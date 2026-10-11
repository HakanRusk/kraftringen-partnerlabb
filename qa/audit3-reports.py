"""Third portal audit: live partner registry and report handoff regression."""
import asyncio
import json
import os
import pathlib
import shutil
from playwright.async_api import async_playwright

BASE = os.environ.get('PARTNERLABB_QA_URL', 'http://127.0.0.1:8014/').rstrip('/') + '/'
OUT = pathlib.Path(os.environ.get('PARTNERLABB_QA_SHOTS', '/workspace/portal-audit3/reports/audit3'))


async def main():
    OUT.mkdir(parents=True, exist_ok=True)
    checks, errors = [], []
    def good(label, ok):
        if not ok:
            raise AssertionError(label)
        checks.append(label)
        print('PASS ' + label, flush=True)
    async with async_playwright() as p:
        browser = await p.chromium.launch(executable_path=shutil.which('chromium') or '/usr/bin/chromium', args=['--no-sandbox'])
        context = await browser.new_context(viewport={'width': 1440, 'height': 1000}, locale='sv-SE', accept_downloads=True)
        page = await context.new_page()
        page.on('pageerror', lambda error: errors.append(str(error)))
        await page.goto(BASE, wait_until='networkidle')
        await page.wait_for_function('Portal.partnerSalesReports && Portal.partnerResults')
        baseline = await page.evaluate('JSON.stringify({finance:Portal.commercial.fixtures,kickback:Portal.partnerKickback.ledger,result:Portal.partnerResultsData.rows(),records:Portal.state.records,moveins:Portal.state.moveins})')
        created = []
        for kind, name in [('sales', 'QA Rapportpartner <b>'), ('property', 'QA Rapportfastighet'), ('employee', 'QA Rapportarbetsgivare')]:
            await page.evaluate('Portal.go("partners");Portal.partnerSetup.open()')
            await page.locator('#partner-setup-name').fill(name)
            await page.locator(f'[name="partnerType"][value="{kind}"]').check()
            if kind == 'sales':
                await page.locator('[name="salesAudience"][value="both"]').check()
            await page.get_by_role('button', name='Skapa partner', exact=True).click()
            created.append({'id': await page.evaluate('Portal.selectedPartnerId'), 'kind': kind, 'name': name})
        await page.locator('#nav [data-go="partner-results"]').click()
        actual_options = await page.locator('#partner-results-partner option').evaluate_all('(nodes)=>nodes.map(n=>({value:n.value,text:n.textContent}))')
        (OUT / 'registry-observation.json').write_text(json.dumps({'created': created, 'options': actual_options}, ensure_ascii=False, indent=2))
        good('Försäljningsutfall låter användaren välja varje nyregistrerad partner', all(item['id'] in [opt['value'] for opt in actual_options] for item in created))
        for item in created:
            await page.locator('#partner-results-partner').select_option(item['id'])
            good(f"{item['kind']}: vald ny partner har rätt egen rubrik", item['name'] in await page.locator('[data-result-panel] h2').inner_text())
            good(f"{item['kind']}: saknat resultatunderlag visar streck", await page.locator('.partner-result-metric strong').all_inner_texts() == ['—'] * (4 if item['kind'] == 'property' else 2))
            good(f"{item['kind']}: inga lånade avtal, diagram eller churn", await page.locator('.partner-result-trend,.partner-result-breakdowns,.partner-result-cohort').count() == 0 and 'Underlag saknas' in await page.locator('[data-result-panel]').inner_text())
            await page.evaluate('(id)=>Portal.partnerResults.selectPartner(id)', item['id'])
            good(f"{item['kind']}: rapportlänken behåller samma partner", await page.locator('#partner-results-partner').input_value() == item['id'])
        await page.locator('#partner-results-partner').select_option('all')
        missing_note = await page.locator('.partner-result-missing-partners').inner_text()
        good('alla partners visar vilka nyskapade partners som saknar resultatunderlag', all(item['name'] in missing_note for item in created))
        good('partnernamnets HTML blir text i rapporten', await page.locator('.partner-result-missing-partners b').count() == 0)
        for reserved in ['constructor', '__proto__', 'toString', 'saknad-partner']:
            state = await page.locator('#partner-results-partner').input_value()
            await page.evaluate('(id)=>Portal.partnerResults.selectPartner(id)', reserved)
            good(f'ogiltig {reserved} öppnar ingen annan partners rapport', await page.locator('#partner-results-partner').input_value() == state and await page.evaluate('(id)=>Portal.partnerResults.renderPanel(id)', reserved) == '')
        for partner, count in [('syd', 207), ('vast', 437)]:
            await page.evaluate('(id)=>{Portal.returnInternal();Portal.commercial.selectPartner(id)}', partner)
            await page.locator('[data-sr-mode="year"]').click()
            if await page.locator('#sr-reset').is_enabled():
                await page.locator('#sr-reset').click()
            good(f'{partner}: den generiska partnerlänken öppnar egen årsförsäljning', await page.evaluate('Portal.page') == 'partner-sales' and int((await page.locator('[data-sr-metric="agreements"] strong').inner_text()).replace(' ', '').replace('\xa0', '')) == count)
            await page.locator('.sr-more-filters summary').click()
            choices = await page.locator('#sr-seller option').evaluate_all('(nodes)=>nodes.filter(n=>n.value!=="all").map(n=>n.value)')
            await page.locator('#sr-seller').select_option(choices[0])
            await page.locator('[data-sr-mode="month"]').click()
            await page.locator('#sr-period').select_option('2026-09')
            await page.locator('[data-go="partner-insights"]').first.click()
            good(f'{partner}: period och säljare följer med till Insikter', await page.locator('#sr-period').input_value() == '2026-09' and await page.locator('#sr-seller').input_value() == choices[0])
            await page.locator('[data-go="partner-sales"]').first.click()
            await page.locator('[data-sr-kickback]').click()
            good(f'{partner}: kickbacklänken går till samma partner och separat tydlig underlagsperiod', await page.locator('#kickback-partner').input_value() == partner and 'Underlagsperiod:' in await page.locator('.kickback-partner-filter').inner_text())
            await page.evaluate('(id)=>Portal.previewPartner(id)', partner)
            await page.locator('#nav [data-go="partner-sales"]').click()
            good(f'{partner}: egen partnerpresentation har inga interna ekonomidelar', await page.locator('#sr-product').input_value() == 'all' and await page.locator('.commercial-kpis,.commercial-waterfall,[data-sr-kickback],[data-partner-edit]').count() == 0)
            await page.locator('[data-go="partner-insights"]').first.click()
            good(f'{partner}: egna Insikter behåller rätt partner', partner == await page.evaluate('Portal.partner') and await page.locator('.sr-partner-tabs [data-go="partner-detail"]').count() == 0)
        for width in [320, 390, 1440]:
            await page.set_viewport_size({'width': width, 'height': 1000})
            for item in created:
                await page.evaluate('(id)=>{Portal.returnInternal();Portal.partnerResults.selectPartner(id)}', item['id'])
                good(f"{width}px/{item['kind']}: rapporten ryms och väljaren behåller fokus", await page.evaluate('document.documentElement.scrollWidth<=document.documentElement.clientWidth+1'))
                await page.locator('#partner-results-partner').select_option('all')
                good(f"{width}px/{item['kind']}: tangentbordsfokus består efter rapportbyte", await page.evaluate('document.activeElement.id') == 'partner-results-partner')
            await page.screenshot(path=str(OUT / f'reports-{width}.png'), full_page=True)
        after = await page.evaluate('JSON.stringify({finance:Portal.commercial.fixtures,kickback:Portal.partnerKickback.ledger,result:Portal.partnerResultsData.rows(),records:Portal.state.records,moveins:Portal.state.moveins})')
        good('partner-/rapport-/filterbyten ändrar inga utfall, ärenden eller kickbackposter', baseline == after)
        good('inga JavaScript-fel i rapportflödena', not errors)
        (OUT / 'audit3-reports.json').write_text(json.dumps({'passed': len(checks), 'checks': checks, 'scriptErrors': errors}, ensure_ascii=False, indent=2))
        print(f'PASS {len(checks)} kontroller; {OUT}', flush=True)
        await context.close()
        await browser.close()


if __name__ == '__main__':
    asyncio.run(main())
