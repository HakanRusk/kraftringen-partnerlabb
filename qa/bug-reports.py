"""Regression for report/journey bugs found in the full-portal audit.

Uses the existing static preview and installed Chromium. Local failures are
injected at the browser Storage API; ledger expectations are derived from
individual immutable rows rather than the report summary being tested.
"""
import asyncio
import csv
import json
import os
import pathlib
import shutil
import tempfile
from playwright.async_api import async_playwright

BASE = os.environ.get('PARTNERLABB_QA_URL', 'http://127.0.0.1:4191/').rstrip('/') + '/'
OUT = pathlib.Path(os.environ.get('PARTNERLABB_QA_SHOTS', tempfile.mkdtemp(prefix='partnerlabb-bug-reports-')))


class Suite:
    def __init__(self, browser):
        self.browser, self.context, self.page = browser, None, None
        self.checks, self.errors = [], []

    def good(self, label, value):
        if not value:
            raise AssertionError(label)
        self.checks.append(label)
        print('PASS ' + label, flush=True)

    async def fresh(self, suffix=''):
        if self.context:
            await self.context.close()
        self.context = await self.browser.new_context(viewport={'width': 1440, 'height': 1000}, locale='sv-SE', accept_downloads=True)
        self.page = await self.context.new_page()
        self.page.on('pageerror', lambda error: self.errors.append(str(error)))
        await self.page.goto(BASE + suffix, wait_until='networkidle')
        await self.page.wait_for_function('Portal.commercial && Portal.partnerSalesReports && Portal.propertyResults')

    async def journey(self, partner='syd'):
        await self.page.evaluate('(id)=>{Portal.returnInternal();Portal.commercial.selectPartner(id,"journey")}', partner)

    async def management(self, partner='syd'):
        return await self.page.evaluate('(id)=>JSON.stringify(Portal.state.commercial.management[id])', partner)

    async def fail_storage(self):
        await self.page.evaluate('''()=>{
          window.qaRealSet = Storage.prototype.setItem;
          Storage.prototype.setItem = function(key,value) {
            if(this === localStorage) throw new DOMException('QA quota', 'QuotaExceededError');
            return window.qaRealSet.call(this,key,value);
          };
        }''')

    async def restore_storage(self):
        await self.page.evaluate('Storage.prototype.setItem=window.qaRealSet;delete window.qaRealSet')

    async def fixtures(self):
        return await self.page.evaluate('JSON.stringify({finance:Portal.commercial.fixtures,kickback:Portal.partnerKickback.ledger,result:Portal.partnerResultsData.rows(),records:Portal.state.records,moveins:Portal.state.moveins})')


async def persistence(test):
    await test.fresh()
    page = test.page
    await test.journey()
    fixtures, before = await test.fixtures(), await test.management()
    before_saved = await page.evaluate('localStorage.getItem("partnerlabb.portal.v2")')
    checkbox = page.locator('[data-commercial-check]').first
    check_key = await checkbox.get_attribute('data-commercial-check')
    await test.fail_storage()
    await checkbox.click()
    test.good('misslyckad checklista återställer state, kontroll och sparad data', await test.management() == before and not await checkbox.is_checked() and await page.evaluate('localStorage.getItem("partnerlabb.portal.v2")') == before_saved)
    test.good('checklistefelet visar ett felbesked utan falsk sparstatus', 'kunde inte spara' in await page.locator('#toast').inner_text() and 'är sparat' not in await page.locator('#toast').inner_text())
    await test.restore_storage()
    await checkbox.check()
    test.good('checklistan kan sparas efter ett lagringsfel', check_key in json.loads(await test.management())['checks'])

    before = await test.management()
    stage = 1 if json.loads(before)['stage'] != 1 else 2
    await page.locator(f'[data-commercial-step="{stage}"]').focus()
    await page.keyboard.press('Enter')
    test.good('partnerresans steg behåller fokus när de öppnas med tangentbord', await page.evaluate('document.activeElement.dataset.commercialStep') == str(stage))
    await test.fail_storage()
    await page.locator('#commercial-place-stage').click()
    test.good('misslyckad exempelplacering återställer placering och händelsehistorik', await test.management() == before and await page.locator('#commercial-place-stage').count() == 1 and 'kunde inte spara' in await page.locator('#toast').inner_text())
    await test.restore_storage()
    await page.locator('#commercial-place-stage').click()
    changed = json.loads(await test.management())
    test.good('placeringsåtgärden återför fokus till steget efter sparning', await page.evaluate('document.activeElement.dataset.commercialStep') == str(stage))
    test.good('exempelplacering sparas med exakt en händelse efter återförsök', changed['stage'] == stage and len(changed['events']) == len(json.loads(before)['events']) + 1)

    before = await test.management()
    await page.locator('#commercial-edit-management').click()
    await page.locator('[name="owner"]').fill('QA Ägare')
    await page.locator('[name="next"]').fill('QA Nästa steg')
    await page.locator('[name="note"]').fill('QA Intern anteckning')
    await test.fail_storage()
    await page.get_by_role('button', name='Spara lokalt utkast', exact=True).click()
    test.good('misslyckad ansvarssparning behåller formuläret och tidigare data', await test.management() == before and await page.locator('#commercial-management-form').is_visible() and await page.locator('[name="note"]').input_value() == 'QA Intern anteckning' and 'kunde inte spara' in await page.locator('#toast').inner_text())
    await test.restore_storage()
    await page.get_by_role('button', name='Spara lokalt utkast', exact=True).click()
    changed = json.loads(await test.management())
    test.good('ansvar och anteckning sparas med en händelse vid återförsök', changed['owner'] == 'QA Ägare' and changed['next'] == 'QA Nästa steg' and changed['note'] == 'QA Intern anteckning' and len(changed['events']) == len(json.loads(before)['events']) + 1 and not await page.locator('#commercial-management-form').is_visible())
    await page.reload(wait_until='networkidle')
    test.good('lyckad checklista, placering och ansvar består efter omladdning', json.loads(await test.management()) == changed and check_key in changed['checks'])
    other = await test.management('vast')
    await page.locator('#commercial-journey-partner').select_option('vast')
    test.good('partnerresans partnerväljare behåller fokus efter partnerbyte', await page.evaluate('document.activeElement.id') == 'commercial-journey-partner')
    test.good('ändringar i Saveras partnerresa påverkar inte Face2face', await test.management('vast') == other)
    test.good('partnerresan ändrar inga kund-/ärende-/resultat-/kickbackunderlag', await test.fixtures() == fixtures)

    normal = await page.evaluate('localStorage.getItem("partnerlabb.portal.v2")')
    await page.goto(BASE + '?demo=inflyttning', wait_until='networkidle')
    await test.journey('syd')
    demo_checkbox = page.locator('[data-commercial-check]').first
    await demo_checkbox.check()
    test.good('checklistan i kunddemo kan sparas separat utan normaldataändring', await demo_checkbox.is_checked() and await page.evaluate('localStorage.getItem("partnerlabb.portal.v2")') == normal)


async def legacy(test):
    await test.fresh()
    page = test.page
    await page.evaluate('''()=>{
      const saved=JSON.parse(localStorage.getItem("partnerlabb.portal.v2")) || Portal.state;
      saved.commercial.management ||= {};
      saved.commercial.management.syd={owner:"QA Äldre ägare",next:"QA Äldre nästa",note:"QA Behåll anteckningen",date:"2026-10-12",stage:99,qaExtension:{preserve:"yes"}};
      localStorage.setItem("partnerlabb.portal.v2",JSON.stringify(saved));
    }''')
    await page.reload(wait_until='networkidle')
    await test.journey()
    fixed = json.loads(await test.management())
    test.good('äldre partnerutkast med ogiltig placering öppnar utan krasch', await page.locator('h1').inner_text() == 'Partnerresan · Savera' and await page.locator('[data-commercial-check]').count() == 2 and 0 <= fixed['stage'] < 8)
    test.good('äldre ansvar och okända fält bevaras när saknad struktur kompletteras', fixed['owner'] == 'QA Äldre ägare' and fixed['note'] == 'QA Behåll anteckningen' and fixed['qaExtension'] == {'preserve': 'yes'} and fixed['checks'] == [] and fixed['events'] == [])
    await page.locator('#commercial-edit-management').click()
    await page.get_by_role('button', name='Spara lokalt utkast', exact=True).click()
    await page.reload(wait_until='networkidle')
    test.good('kompletterat äldre utkast kan sparas och läsas tillbaka utan anteckningsförlust', json.loads(await test.management())['note'] == 'QA Behåll anteckningen')

    await page.evaluate('''()=>{
      const saved=JSON.parse(localStorage.getItem("partnerlabb.portal.v2"));
      saved.commercial.management.estate1={stage:2,checks:{old:true},events:{old:true},note:"QA gammal fastighet"};
      saved.records.push(null,42,"QA ofullständig rad");
      saved.qaExtension={preserve:true};
      localStorage.setItem("partnerlabb.portal.v2",JSON.stringify(saved));
    }''')
    await page.reload(wait_until='networkidle')
    await page.evaluate('Portal.selectedPartnerId="estate1";Portal.go("partner-detail")')
    test.good('fastighetsprofilen hanterar ofullständig äldre aktivitet utan sidkrasch', 'Exempelfastigheter AB' in await page.locator('h1').inner_text() and await page.evaluate('Portal.state.qaExtension.preserve') and await page.evaluate('Portal.state.records.includes(null)'))
    await test.journey('estate1')
    test.good('äldre checklist- och aktivitetsobjekt hindrar inte partnerresan', await page.locator('[data-commercial-check]').count() == 2 and json.loads(await test.management('estate1'))['note'] == 'QA gammal fastighet')


async def reports(test):
    await test.fresh()
    page = test.page
    fixtures = await test.fixtures()
    cutoff = '2026-10-07'
    for partner in ['syd', 'vast']:
        await page.evaluate('(id)=>{Portal.returnInternal();Portal.selectedPartnerId=id;Portal.go("partner-sales")}', partner)
        ledger = await page.evaluate('(id)=>Portal.partnerSalesData.forPartner(id).ledger', partner)
        for mode, value in [('year','2026'),('month','2026-01'),('month','2026-10'),('week','2026-W01'),('week','2026-W41')]:
            await page.evaluate('(f)=>Portal.partnerSalesReports.setFilters(f)', {'mode':mode,'value':value,'product':'all','seller':'all','region':'all'})
            period = await page.evaluate('(f)=>Portal.partnerSalesData.forPartner(Portal.selectedPartnerId).period(f)', {'mode':mode,'value':value})
            sold = [row for row in ledger if period['observedStart'] <= row['soldDate'] <= period['observedEnd']]
            active = [row for row in ledger if row['soldDate'] <= period['observedEnd'] and row['startDate'] and row['startDate'] <= period['observedEnd'] and (not row['endDate'] or row['endDate'] > period['observedEnd']) and (not row['cancelledDate'] or row['cancelledDate'] > period['observedEnd'])]
            actual = await page.locator('[data-sr-metric] strong').all_inner_texts()
            expected = [str(len(sold)), str(sum(row['annualMWh'] for row in sold)) + ' MWh', str(len({row['customerId'] for row in active}))]
            test.good(f'{partner} {value}: visade mått följer avtalsrader, äldre bestånd och observerad period', [text.replace('\u00a0','').replace('\u202f','').replace(' ','') for text in actual] == [text.replace(' ','') for text in expected])
        await page.evaluate('Portal.partnerSalesReports.setFilters({mode:"year",value:"2026",product:"Kvartspris"})')
        await page.evaluate('Portal.go("partner-insights")')
        result = await page.evaluate('(id)=>Portal.partnerSalesData.forPartner(id).insights(Portal.partnerSalesReports.filters())', partner)
        opening = [r for r in ledger if r['product']=='Kvartspris' and r['startDate'] and r['startDate']<'2026-01-01' and (not r['endDate'] or r['endDate']>='2026-01-01') and not r['cancelledDate']]
        exits = [r for r in opening if r['endDate'] and '2026-01-01'<=r['endDate']<=cutoff]
        sold = [r for r in ledger if r['product']=='Kvartspris' and '2026-01-01'<=r['soldDate']<=cutoff]
        cancelled = [r for r in sold if r['cancelledDate'] and r['cancelledDate']<=cutoff]
        test.good(f'{partner}: churn efter start och bortfall före start behåller skilda baser efter produktfilter', result['churn']['openingCustomers']==len(opening) and result['churn']['exits']==len(exits) and result['dropout']['agreements']==len(sold) and result['dropout']['cancelled']==len(cancelled))
        await page.evaluate('(id)=>Portal.previewPartner(id)',partner)
        await page.evaluate('Portal.go("partner-sales")')
        test.good(f'{partner}: eget partnerperspektiv har eget filter och saknar interna kostnader', await page.locator('#sr-product').input_value()=='all' and await page.locator('.commercial-kpis,.commercial-waterfall,[data-sr-kickback],[data-partner-edit]').count()==0)

    await page.evaluate('Portal.returnInternal();Portal.go("kickback")')
    await page.locator('#kickback-partner').focus()
    await page.locator('#kickback-partner').select_option('estate2')
    test.good('kickbackens partnerväljare behåller tangentbordsfokus efter omritning', await page.evaluate('document.activeElement.id')=='kickback-partner')
    test.good('kickbacken visar bara vald partners separata underlag', await page.locator('.kickback-table tbody tr').count()==1 and 'Exempelbo Förvaltning' in await page.locator('.kickback-table tbody').inner_text() and 'Savera' not in await page.locator('.kickback-table tbody').inner_text())
    await page.locator('#commercial-period').select_option('2026-10')
    test.good('saknad kickbackpost visas som underlag saknas, inte intjänad nolla', await page.locator('.kickback-main-metrics strong').all_inner_texts()==['—']*4 and 'Underlag saknas' in await page.locator('.kickback-missing').inner_text())
    test.good('rapportfilter och navigation ändrar inga underliggande affärsdata', await test.fixtures()==fixtures)


async def csv_and_layout(test):
    await test.fresh()
    page = test.page
    await page.evaluate('Portal.returnInternal();Portal.go("partners");Portal.partnerSetup.open()')
    await page.locator('#partner-setup-name').fill('=1+2')
    await page.get_by_role('button',name='Skapa partner',exact=True).click()
    partner = await page.evaluate('Portal.selectedPartnerId')
    await page.evaluate('Portal.go("internal-overview")')
    async with page.expect_download() as capture:
        await page.locator('#commercial-export').click()
    download = await capture.value
    path = OUT / 'partnerutfall.csv'
    await download.save_as(path)
    rows = list(csv.reader(path.read_text(encoding='utf-8-sig').splitlines(), delimiter=';'))
    test.good('CSV behandlar formelliknande partnernamn som text i kalkylprogram', any(row and row[0]=="'=1+2" and row[1]=='Underlag saknas' for row in rows))
    estate_row = next(row for row in rows if row and row[0]=='Exempelbo Förvaltning')
    test.good('CSV behåller negativa och positiva utfallsbelopp som tal', estate_row[1]=='-3000' and estate_row[2]=='12100' and estate_row[3]=='15100')
    for width in [320,390,1440]:
        await page.set_viewport_size({'width':width,'height':1000})
        for route,id in [('internal-overview','syd'),('partners','syd'),('journey','syd'),('partner-sales','vast'),('partner-insights','vast'),('partner-results','estate1'),('kickback','estate2'),('property-results','estate1')]:
            await page.evaluate('({route,id})=>{Portal.returnInternal();Portal.selectedPartnerId=id;Portal.go(route)}',{'route':route,'id':id})
            test.good(f'{route} öppnar rätt vy vid {width}px', await page.evaluate('Portal.page') == route)
            fits = await page.evaluate('document.documentElement.scrollWidth<=document.documentElement.clientWidth+1')
            test.good(f'{route} saknar sidöverflöde vid {width}px', fits)
        await page.screenshot(path=str(OUT/f'reports-{width}.png'),full_page=True)
    await page.evaluate('(id)=>{Portal.returnInternal();Portal.commercial.selectPartner(id,"journey")}',partner)
    test.good('nyskapad partner har en egen partnerresa utan andra partners placering', await page.locator('h1').inner_text()=='Partnerresan · =1+2' and json.loads(await test.management(partner))['stage']==0)


async def main():
    OUT.mkdir(parents=True, exist_ok=True)
    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(executable_path=shutil.which('chromium') or '/usr/bin/chromium', args=['--no-sandbox'])
        test = Suite(browser)
        try:
            await persistence(test)
            await legacy(test)
            await reports(test)
            await csv_and_layout(test)
            test.good('inga scriptfel under rapport- och sparflödena', not test.errors)
            (OUT/'bug-reports.json').write_text(json.dumps({'checks':test.checks,'scriptErrors':test.errors,'passed':len(test.checks)},ensure_ascii=False,indent=2))
            print(f'PASS {len(test.checks)} kontroller; rapport: {OUT}',flush=True)
        finally:
            if test.context:
                await test.context.close()
            await browser.close()


if __name__=='__main__':
    asyncio.run(main())
