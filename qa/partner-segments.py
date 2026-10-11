"""Browser checks for reusable, nested partner reports and local partner setup.

Runs against the coordinator's preview using the existing Chromium. Counts,
stock, churn and dropout expectations come from individual fictitious rows,
not from calling the report implementation to generate its own expected values.
"""
import argparse
import asyncio
import datetime as dt
import importlib.util
import json
import pathlib
import shutil

from playwright.async_api import async_playwright
_spec = importlib.util.spec_from_file_location('savera_insights', pathlib.Path(__file__).with_name('savera-insights.py'))
_shared = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_shared)
BASE, OUT, Suite = _shared.BASE, _shared.OUT, _shared.Suite
metric_values, selection, table_ids = _shared.metric_values, _shared.selection, _shared.table_ids


B2B = ['Rörligt pris', 'Kvartspris', 'Poolportfölj Trygg', 'Poolportfölj Offensiv', 'Individuell portfölj', 'Kraftringen Stabil']
B2C = ['Fastpris', 'Vintersäkrat', 'Opti', 'Kvartspris', 'Rörligt pris']
F2F_COUNTS = [36, 38, 41, 44, 47, 51, 52, 55, 61, 12]
F2F_MWH = [142, 151, 164, 180, 192, 210, 220, 235, 260, 50]
CUTOFF = '2026-10-07'


async def open_partner(test, partner='syd', route='partner-sales'):
    await test.page.evaluate('({partner,route})=>{Portal.role="internal";Portal.selectedPartnerId=partner;Portal.go(route)}', {'partner': partner, 'route': route})


async def options(page, selector):
    return await page.locator(selector + ' option').evaluate_all('(nodes)=>nodes.map(node=>node.value).filter(value=>value!=="all")')


async def browser_flow(test):
    await test.fresh()
    page = test.page
    await test.route('partners')
    test.good('Savera och Face2face är partners utan egna huvudkategorier', await page.locator('#nav [data-go="partners"]').count() == 1 and await page.locator('#nav [data-go="savera"],#nav [data-go="insikter"],#nav [data-go="partner-sales"],#nav [data-go="partner-insights"]').count() == 0 and await page.locator('[data-commercial-partner="syd"]').count() > 0 and await page.locator('[data-commercial-partner="vast"]').count() > 0)
    await page.locator('[data-commercial-partner="syd"]').first.click()
    test.good('partnerregistret öppnar gemensam avtalsuppföljning under Partners', await page.evaluate('Portal.page') == 'partner-sales' and await page.locator('#nav [data-go="partners"]').get_attribute('aria-current') == 'page' and await page.locator('h1').inner_text() == 'Savera' and 'partner=syd' in page.url)
    test.good('Savera har exakt de sex företagsalternativen i rapportens avtalstyper', await options(page, '#sr-product') == B2B)
    await page.locator('#sr-product').select_option(B2B[3])
    savera_filters = await page.evaluate('Portal.partnerSalesReports.filters()')
    await page.locator('[data-go="partner-insights"]').first.click()
    test.good('partnerns Insikter använder samma urval och behåller Partners aktiv', await page.evaluate('Portal.page') == 'partner-insights' and await page.locator('#sr-product').input_value() == B2B[3] and await page.locator('#nav [data-go="partners"]').get_attribute('aria-current') == 'page')
    await page.reload(wait_until='networkidle')
    test.good('direktlänk och omladdning behåller partner och rapportfilter', await page.evaluate('Portal.selectedPartnerId') == 'syd' and await page.evaluate('Portal.page') == 'partner-insights' and await page.evaluate('Portal.partnerSalesReports.filters()') == savera_filters and 'partner=syd' in page.url)

    await test.route('partners')
    await page.locator('[data-commercial-partner="vast"]').first.click()
    test.good('Face2face använder samma uppföljning med eget konsumenturval', await page.evaluate('Portal.page') == 'partner-sales' and await page.locator('h1').inner_text() == 'Face2face' and await options(page, '#sr-product') == B2C and await page.locator('#sr-product').input_value() == 'all' and 'partner=vast' in page.url)
    test.good('Face2face visar 437 nya avtal, 1804 avtalade års-MWh och 990 aktiva exempelpersoner', await metric_values(page) == {'agreements': 437, 'annualMWh': 1804, 'activeCount': 990})
    ledger = await page.evaluate('Portal.partnerSalesData.forPartner("vast").ledger')
    test.good('Face2face har bara konsumentavtal i sina fiktiva kundrader', all(row['partner'] == 'vast' and row['segment'] == 'consumer' and row['product'] in B2C and row['fictional'] and row['email'].endswith('.example') for row in ledger))
    for product in B2C:
        await page.locator('#sr-product').select_option(product)
        sold = selection(ledger, product=product)
        active = selection(ledger, product=product, active=True)
        test.good(f'Face2face {product}: filter räknar samma kunder, årsvolym och aktiva stock', await metric_values(page) == {'agreements': len(sold), 'annualMWh': sum(row['annualMWh'] for row in sold), 'activeCount': len(active)} and set(await table_ids(page)).issubset({row['id'] for row in sold}))
    await page.locator('#sr-reset').click()
    await page.locator('[data-sr-mode="month"]').click()
    for index, expected in enumerate(F2F_COUNTS):
        month = f'2026-{index+1:02d}'
        await page.locator('#sr-period').select_option(month)
        result = await metric_values(page)
        test.good(f'Face2face {month}: månadsutfallet behåller befintligt antal och årsvolym', result['agreements'] == expected and result['annualMWh'] == F2F_MWH[index])
    await page.locator('[data-sr-mode="week"]').click()
    test.good('Face2face har samma veckofilter och rätt observerade slutvecka', await page.locator('#sr-period').input_value() == '2026-W41' and '7 okt.' in await page.locator('.sr-selection').inner_text())
    await page.locator('[data-sr-mode="year"]').click()
    await page.locator('[data-go="partner-insights"]').first.click()
    insights = await page.evaluate('Portal.partnerSalesData.forPartner("vast").insights({mode:"year",value:"2026"})')
    opening = [row for row in ledger if row['startDate'] and row['startDate'] < '2026-01-01' and (not row['endDate'] or row['endDate'] >= '2026-01-01') and not row['cancelledDate']]
    exits = [row for row in opening if row['endDate'] and '2026-01-01' <= row['endDate'] <= CUTOFF]
    sold = selection(ledger)
    cancelled = [row for row in sold if row['cancelledDate'] and row['cancelledDate'] <= CUTOFF]
    test.good('Face2face årschurn använder de 176 avgångarna ur samma ingående stock på 785', len(opening) == 785 and len(exits) == 176 and insights['churn']['openingCustomers'] == 785 and insights['churn']['exits'] == 176 and abs(insights['churn']['rate'] - 176/785) < 1e-9)
    test.good('bortfall före avtalsstart använder periodens 437 sålda avtal som egen nämnare', len(cancelled) == 41 and insights['dropout']['cancelled'] == 41 and insights['dropout']['agreements'] == 437 and abs(insights['dropout']['rate'] - 41/437) < 1e-9)
    test.good('kundtid, popularitet och prognos finns också för Face2face', await page.locator('.sr-tenure-completed,.sr-tenure-active').count() == 2 and await page.locator('.sr-product-row').count() == 5 and await page.locator('.sr-projection').count() == 1 and await page.locator('[data-sr-attrition="churn"],[data-sr-attrition="dropout"]').count() == 2)
    test.good('churn och bortfall presenteras som två skilda procentmått', '22,4' in await page.locator('[data-sr-attrition="churn"] .sr-attrition-rate').inner_text() and '9,4' in await page.locator('[data-sr-attrition="dropout"] .sr-attrition-rate').inner_text())
    await page.locator('#sr-product').select_option('Vintersäkrat')
    f2f_filters = await page.evaluate('Portal.partnerSalesReports.filters()')
    await page.reload(wait_until='networkidle')
    test.good('Face2face direktlänk återställer rätt partner och eget Insikter-urval', await page.evaluate('Portal.selectedPartnerId') == 'vast' and await page.evaluate('Portal.page') == 'partner-insights' and await page.evaluate('Portal.partnerSalesReports.filters()') == f2f_filters and 'partner=vast' in page.url)
    await open_partner(test, 'syd')
    test.good('partnerbyte återger Saveras eget filter utan konsumentfilterläckage', await page.evaluate('Portal.partnerSalesReports.filters()') == savera_filters and await page.locator('#sr-product').input_value() == B2B[3])
    await open_partner(test, 'vast')
    test.good('partnerbyte tillbaka återger Face2faces eget urval', await page.locator('#sr-product').input_value() == 'Vintersäkrat' and await options(page, '#sr-product') == B2C)
    await page.locator('#sr-reset').click()

    for partner in ['syd', 'vast']:
        for route in ['partner-sales', 'partner-insights']:
            await open_partner(test, partner, route)
            for width in [1440, 390, 320]:
                await page.set_viewport_size({'width': width, 'height': 1000 if width == 1440 else 844})
                await test.nooverflow(f'{partner} {route} saknar sidöverflöde vid {width}px')
                if width != 1440:
                    sizes = await page.locator('.savera-reports input,.savera-reports select').evaluate_all('(nodes)=>nodes.map(node=>parseFloat(getComputedStyle(node).fontSize))')
                    test.good(f'{partner} {route} formulärtext är minst 16px vid {width}px', bool(sizes) and min(sizes) >= 16)
                await test.shot(f'{partner}-{route}-{width}.png')
    await page.locator('[data-sr-mode="month"]').focus()
    await page.keyboard.press('Enter')
    test.good('gemensamt periodfilter fungerar med tangentbord och behåller fokus', await page.locator('[data-sr-mode="month"]').get_attribute('aria-pressed') == 'true' and await page.evaluate('document.activeElement.dataset.srMode') == 'month')


async def create_partner(test, name, audience):
    page = test.page
    await test.route('partners')
    await page.get_by_role('button', name='Ny partner', exact=True).click()
    await page.locator('#partner-setup-name').fill(name)
    await page.locator(f'input[name="salesAudience"][value="{audience}"]').check()
    await page.get_by_role('button', name='Skapa partner', exact=True).click()
    return await page.evaluate('Portal.selectedPartnerId')


async def setup_checks(test):
    await test.fresh()
    page = test.page
    saved_business = await page.evaluate('JSON.stringify({records:Portal.state.records,offers:Portal.state.offers,consumerSales:Portal.state.consumerSales,moveins:Portal.state.moveins})')
    finance = await test.finance()
    ids = {}
    for audience, label, expected in [('business', 'QA Företagspartner', ['business']), ('consumer', 'QA Konsumentpartner', ['consumer']), ('both', 'QA Partner båda', ['business', 'consumer'])]:
        partner = await create_partner(test, label, audience)
        ids[audience] = partner
        profile = await page.evaluate('(id)=>Portal.getPartner(id)', partner)
        test.good(f'skapa {audience}: val sparas som partner och öppnar eget uppföljningsläge', profile['name'] == label and profile['salesAudiences'] == expected and await page.evaluate('Portal.page') == 'partner-sales' and await page.locator('h1').inner_text() == label)
        values = await page.locator('[data-sr-metric] strong').all_inner_texts()
        test.good(f'ny {audience}-partner får saknat underlag utan fabricerade avtal eller stock', values == ['—', '—', '—'] and await page.locator('.sr-data-missing').count() > 0 and await page.locator('tr[data-sr-record]').count() == 0)
        await page.locator('[data-go="partner-insights"]').first.click()
        test.good(f'ny {audience}-partner får inget påhittat tempo eller livslängd', await page.locator('.sr-data-missing').count() > 0 and await page.locator('.sr-tenure-completed,.sr-tenure-active,.sr-projection-values').count() == 0 and 'prognoser' in await page.locator('.sr-data-missing').inner_text())
        await page.reload(wait_until='networkidle')
        reloaded = await page.evaluate('(id)=>Portal.getPartner(id)', partner)
        test.good(f'ny {audience}-partners namn och segment består efter omladdning', reloaded['name'] == label and reloaded['salesAudiences'] == expected and await page.evaluate('Portal.selectedPartnerId') == partner and await page.evaluate('Portal.page') == 'partner-insights')
        await page.locator('[data-go="partner-detail"]').first.click()
        test.good(f'ny {audience}-partners profil visar egen identitet och saknad ekonomi', await page.locator('h1').inner_text() == label and 'Resultatunderlag saknas' in await page.locator('#view').inner_text() and await page.locator('.commercial-waterfall').count() == 0 and 'Savera' not in await page.locator('#view').inner_text())
    test.good('partnerregistrering bevarar kunddialoger, offerter, konsumentunderlag och inflyttningar', await page.evaluate('JSON.stringify({records:Portal.state.records,offers:Portal.state.offers,consumerSales:Portal.state.consumerSales,moveins:Portal.state.moveins})') == saved_business)
    after_finance = await test.finance()
    test.good('partnerregistrering ändrar inga manuella finansiella exempelposter', after_finance['kickback'] == finance['kickback'] and all(after_finance['outcome'][key] == value for key, value in finance['outcome'].items()))
    await open_partner(test, ids['both'])
    configured = await page.locator('.sr-configured-products span').all_inner_texts()
    test.good('nyskapad blandad partner visar båda produktkatalogerna utan dubblerade namn', set(configured) == set(B2B + B2C) and len(configured) == len(set(B2B + B2C)))
    await page.evaluate('(id)=>Portal.partnerKickback.selectPartner(id)', ids['both'])
    test.good('ny partner saknar kickbackposter och lånar aldrig någon annans belopp', await page.locator('#kickback-partner').input_value() == ids['both'] and await page.locator('.kickback-main-metrics strong').all_inner_texts() == ['—', '—', '—', '—'] and 'Underlag saknas' in await page.locator('.kickback-ledger').inner_text())

    # Enable both sales audiences for an existing ledger; configuration does not
    # rewrite its historical B2B agreements into consumer sales.
    work_before = await page.evaluate('Portal.workbench.tasks({partnerIds:["syd"],channels:["business"]}).map(task=>task.id)')
    old_records = await page.evaluate('JSON.stringify(Portal.state.records)')
    await open_partner(test, 'syd')
    await page.locator('[data-go="partner-detail"]').first.click()
    await page.locator('[data-partner-edit="syd"]').first.click()
    await page.locator('input[name="salesAudience"][value="both"]').check()
    await page.get_by_role('button', name='Spara inställningar', exact=True).click()
    test.good('befintlig partner kan ändras till båda kundsegmenten', await page.evaluate('Portal.getPartner("syd").salesAudiences') == ['business', 'consumer'] and await page.locator('[data-sr-segment="all"]').get_attribute('aria-pressed') == 'true')
    for segment, catalog in [('business', B2B), ('consumer', B2C)]:
        await page.locator(f'[data-sr-segment="{segment}"]').click()
        test.good(f'blandad partner {segment}: rätt produktkatalog och tryckt segmentval', await options(page, '#sr-product') == catalog and await page.locator(f'[data-sr-segment="{segment}"]').get_attribute('aria-pressed') == 'true')
        if segment == 'consumer':
            test.good('nytt segment utan avtalsunderlag visas som saknat, aldrig nollutfall', await page.locator('.sr-data-missing').count() == 1 and await page.locator('[data-sr-metric] strong').all_inner_texts() == ['—', '—', '—'] and await page.locator('tr[data-sr-record]').count() == 0)
            await page.locator('[data-go="partner-insights"]').first.click()
            test.good('nytt segment utan historik ger varken churntal eller påhittad prognos', await page.locator('.sr-data-missing').count() == 1 and await page.locator('.sr-projection-values,.sr-attrition-rate').count() == 0)
            await page.locator('[data-go="partner-sales"]').first.click()
    await page.locator('[data-sr-segment="business"]').click()
    await page.locator('#sr-reset').click()
    test.good('segmentändring bevarar historiska avtal, årsvolym och aktiv stock', await metric_values(page) == {'agreements': 207, 'annualMWh': 8175, 'activeCount': 305})
    await page.locator('[data-sr-segment="all"]').click()
    test.good('blandad partner erbjuder båda segmenten utan dubblerade avtalsnamn', set(await options(page, '#sr-product')) == set(B2B + B2C) and len(await options(page, '#sr-product')) == len(set(B2B + B2C)))
    work_after = await page.evaluate('Portal.workbench.tasks({partnerIds:["syd"],channels:["business"]}).map(task=>task.id)')
    test.good('blandad kundsegmentering bevarar äldre underlag utan att återöppna pensionerad säljarbetslista', work_before == work_after == [] and await page.evaluate('JSON.stringify(Portal.state.records)') == old_records)
    await test.route('customers')
    test.good('äldre intern kunddialog omdirigeras till partneruppföljningen', await page.evaluate('Portal.page') == 'partners' and await page.locator('[data-new-customer]').count() == 0)

    for audience in ['business', 'consumer', 'both']:
        await test.partner(ids[audience])
        test.good(f'ny {audience}-partners arbetsyta visar egen identitet utan lånade kundexempel', await page.locator('h1').inner_text() == (await page.evaluate('(id)=>Portal.getPartner(id).name', ids[audience])) and 'Face2face' not in await page.locator('#view').inner_text() and 'Savera' not in await page.locator('#view').inner_text())
        for route in ['consumer-sales', 'business-brief']:
            await test.route(route)
            test.good(f'ny {audience}-partner får ingen befintlig partners arbetsdata via {route}', await page.evaluate('Portal.page') == 'overview' and await page.locator('#view').get_by_text('Kim Exempel', exact=True).count() == 0)
    await page.evaluate('Portal.returnInternal()')

    await page.set_viewport_size({'width': 1440, 'height': 1000})
    await test.route('partners')
    for label in ['QA Företagspartner', 'QA Konsumentpartner', 'QA Partner båda']:
        test.good(f'partnerregistret behåller nyskapad {label}', await page.locator('.commercial-partner-table').get_by_text(label, exact=True).count() == 1)
    await page.get_by_role('button', name='Ny partner', exact=True).click()
    await page.locator('#partner-setup-name').fill('QA Partner båda')
    await page.get_by_role('button', name='Skapa partner', exact=True).click()
    test.good('dublettnamn stoppas med begripligt meddelande utan ny partner', await page.locator('#partner-setup-error').is_visible() and await page.evaluate('Portal.partnerRegistry.filter(p=>p.name==="QA Partner båda").length') == 1)
    await page.locator('#partner-setup-cancel').click()
    html_name = 'QA <b>AB</b>'
    html_partner = await create_partner(test, html_name, 'business')
    ids['html'] = html_partner
    test.good('partnernamn med HTML-liknande text visas ordagrant i rapporten', await page.locator('h1').inner_text() == html_name and await page.locator('h1 b').count() == 0)
    await page.reload(wait_until='networkidle')
    await test.route('partners')
    literal_row = page.locator(f'.commercial-partner-name[data-commercial-partner="{html_partner}"]')
    test.good('HTML-liknande namn består ordagrant i partnerlistan utan HTML-element', await literal_row.locator('strong').inner_text() == html_name and await literal_row.locator('b').count() == 0)
    await test.partner(html_partner)
    literal_option = page.locator(f'#partner option[value="{html_partner}"]')
    test.good('HTML-liknande partnernamn kan väljas som vanlig text i partnerarbetsytan', await literal_option.inner_text() == html_name and await page.locator('#partner b').count() == 0)
    await page.evaluate('Portal.returnInternal()')
    await test.route('partners')
    await page.get_by_role('button', name='Ny partner', exact=True).click()
    for width in [390, 320]:
        await page.set_viewport_size({'width': width, 'height': 844})
        await test.nooverflow(f'partnerdialog saknar sidöverflöde vid {width}px')
        await test.shot(f'partner-setup-{width}.png')
    await page.locator('#partner-setup-cancel').click()

    # A saved v2 record wins over legacy data; extension fields survive reloading.
    await page.evaluate('''()=>{
      const state=JSON.parse(localStorage.getItem('partnerlabb.portal.v2'));
      const existing={...state.records[0],id:'qa-preserved-v2',company:'QA Bevarad kund',events:[...state.records[0].events]};
      state.records.unshift(existing);state.qaPreservedExtension={marker:'keep-v2'};
      localStorage.setItem('partnerlabb.portal.v2',JSON.stringify(state));
      localStorage.setItem('partnerlabb.active.v1',JSON.stringify([{...existing,id:'qa-legacy-shadow',company:'QA Äldre kund'}]));
    }''')
    await page.reload(wait_until='networkidle')
    test.good('nytt partnerregister bevarar v2-kund och okända datafält med företräde framför legacy', await page.evaluate('Portal.state.records.some(r=>r.id==="qa-preserved-v2")&&!Portal.state.records.some(r=>r.id==="qa-legacy-shadow")&&Portal.state.qaPreservedExtension.marker==="keep-v2"'))
    normal_before = await page.evaluate('localStorage.getItem("partnerlabb.portal.v2")')
    await page.goto(BASE + '?demo=inflyttning&workspace=estate1', wait_until='networkidle')
    await page.evaluate('Portal.returnInternal()')
    test.good('kunddemo delar inte nya partnerprofiler med vanliga labbet', await page.evaluate('(id)=>!Portal.getPartner(id)', ids['both']))
    demo_partner = await create_partner(test, 'QA Demo endast', 'both')
    test.good('ny partner i kunddemo sparas utan att ändra normaldata', await page.evaluate('localStorage.getItem("partnerlabb.portal.v2")') == normal_before and await page.evaluate('(id)=>Portal.getPartner(id).name', demo_partner) == 'QA Demo endast')
    await page.goto(BASE + '?partner=' + ids['both'] + '#partner-sales', wait_until='networkidle')
    test.good('normaldata återkommer med egen partner och saknar demots nya partner', await page.evaluate('(id)=>Portal.getPartner(id).name', ids['both']) == 'QA Partner båda' and await page.evaluate('(id)=>!Portal.getPartner(id)', demo_partner) and await page.evaluate('Portal.selectedPartnerId') == ids['both'])
    demo_before_reset = await page.evaluate('localStorage.getItem("partnerlabb.customerDemo.v1")')
    page.once('dialog', lambda dialog: asyncio.create_task(dialog.accept()))
    reset_result = await page.evaluate('Portal.resetScope(false)')
    test.good('uttrycklig återställning tar bort nya partners och lämnar inga döda partnervyer', reset_result and await page.evaluate('(ids)=>ids.every(id=>!Portal.getPartner(id))', list(ids.values())) and await page.evaluate('Portal.page') == 'partners' and await page.evaluate('Portal.selectedPartnerId===undefined') and 'partner=' not in page.url and 'workspace=' not in page.url)
    await page.reload(wait_until='networkidle')
    test.good('återställd partnernavigation fungerar efter omladdning och bevarar kunddemot', await page.evaluate('Portal.page') == 'partners' and await page.evaluate('localStorage.getItem("partnerlabb.customerDemo.v1")') == demo_before_reset and await page.locator('[data-commercial-partner="syd"]').count() > 0)


async def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--suite', choices=['all', 'reports', 'setup'], default='all')
    args = parser.parse_args()
    chromium = shutil.which('chromium') or shutil.which('chromium-browser')
    if not chromium:
        raise RuntimeError('Existing Chromium required; no browser installation is performed.')
    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(executable_path=chromium, headless=True, args=['--no-sandbox'])
        test = Suite(browser)
        try:
            if args.suite in ['all', 'reports']:
                await browser_flow(test)
            if args.suite in ['all', 'setup']:
                await setup_checks(test)
            test.good('inga JavaScript-fel i generiska partnerflöden', not test.errors)
            print(json.dumps({'checks': len(test.checks), 'screenshots': str(OUT), 'javascript_errors': test.errors}, ensure_ascii=False), flush=True)
        finally:
            if test.context:
                await test.context.close()
            await browser.close()


if __name__ == '__main__':
    asyncio.run(main())
