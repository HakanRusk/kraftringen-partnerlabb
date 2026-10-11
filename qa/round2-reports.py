"""Second-audit regression for new partner journeys and report edge cases.

Runs against the existing static preview with installed Chromium. Tests use
fictional names and preserve the immutable sales/financial fixtures.
"""
import asyncio
import json
import os
import pathlib
import shutil
import tempfile
from playwright.async_api import async_playwright

BASE=os.environ.get('PARTNERLABB_QA_URL','http://127.0.0.1:4192/').rstrip('/')+'/'
OUT=pathlib.Path(os.environ.get('PARTNERLABB_QA_SHOTS',tempfile.mkdtemp(prefix='partnerlabb-round2-reports-')))


async def main():
    OUT.mkdir(parents=True,exist_ok=True)
    checks,errors=[],[]
    def good(label,condition):
        if not condition: raise AssertionError(label)
        checks.append(label)
        print('PASS '+label,flush=True)
    async with async_playwright() as p:
        browser=await p.chromium.launch(executable_path=shutil.which('chromium') or '/usr/bin/chromium',args=['--no-sandbox'])
        context=await browser.new_context(viewport={'width':1440,'height':1000},locale='sv-SE')
        page=await context.new_page()
        page.on('pageerror',lambda error:errors.append(str(error)))
        await page.goto(BASE,wait_until='networkidle')
        await page.wait_for_function('Portal.partnerSetup && Portal.partnerSalesData')
        async def fixture_snapshot():
            return await page.evaluate('JSON.stringify({finance:Portal.commercial.fixtures,kickback:Portal.partnerKickback.ledger,result:Portal.partnerResultsData.rows(),records:Portal.state.records,moveins:Portal.state.moveins})')
        fixtures=await fixture_snapshot()
        async def create(name,kind):
            await page.evaluate('Portal.returnInternal();Portal.go("partners");Portal.partnerSetup.open()')
            await page.locator('#partner-setup-name').fill(name)
            await page.locator(f'[name="partnerType"][value="{kind}"]').check()
            await page.get_by_role('button',name='Skapa partner',exact=True).click()
            return await page.evaluate('Portal.selectedPartnerId')
        employee=await create('QA Ny arbetsgivare runda två','employee')
        await page.locator('[data-employee-journey]').click()
        good('ny personalpartner öppnar sin partnerresa direkt efter skapande',await page.evaluate('Portal.page')=='journey' and await page.locator('h1').inner_text()=='Partnerresan · QA Ny arbetsgivare runda två')
        good('partnerresan använder det nya registret utan mellanliggande översiktsbesök',await page.evaluate('(id)=>Portal.commercial.partnerIds.includes(id)',employee))
        await page.locator('[data-commercial-step="4"]').click()
        await page.locator('#commercial-place-stage').click()
        await page.evaluate('Portal.go("partners")')
        row=page.locator('tr').filter(has=page.locator(f'[data-commercial-partner="{employee}"]'))
        good('partnerregistret visar sparat resesteg även när ekonomi saknas',await row.locator('.commercial-stage').inner_text()=='Sälja' and 'resultatunderlag saknas' in await row.inner_text())
        good('sparat resesteg skapar inga utfallsbelopp för en ny partner',await row.locator('.commercial-number').all_inner_texts()==['—']*5)
        await page.reload(wait_until='networkidle')
        row=page.locator('tr').filter(has=page.locator(f'[data-commercial-partner="{employee}"]'))
        good('personalpartnerns resesteg består i registret efter omladdning',await row.locator('.commercial-stage').inner_text()=='Sälja')
        property_id=await create('QA Ny fastighet runda två','property')
        await page.locator('[data-commercial-journey]').click()
        good('ny fastighetspartner får sin egen direkt öppnade partnerresa',await page.evaluate('Portal.page')=='journey' and await page.locator('h1').inner_text()=='Partnerresan · QA Ny fastighet runda två')
        sales=await create('QA Ny säljpartner runda två','sales')
        await page.evaluate('(id)=>Portal.commercial.selectPartner(id,"journey")',sales)
        good('den gemensamma partnernavigatorn hittar en nyskapad säljpartner direkt',await page.evaluate('Portal.page')=='journey' and await page.locator('h1').inner_text()=='Partnerresan · QA Ny säljpartner runda två')
        good('nya partners lånar ingen annan partners placering',await page.evaluate('(ids)=>ids.every(id=>Portal.state.commercial.management[id].stage===0)',[sales,property_id]) and await page.evaluate('(id)=>Portal.state.commercial.management[id].stage===4',employee))
        for reserved in ['constructor','toString','__proto__','hasOwnProperty','prototype','saknad-partner']:
            report=await page.evaluate('(id)=>{const r=Portal.partnerSalesData.forPartner(id);return {available:r.available,name:r.name,rows:r.ledger.length,summary:r.summary({mode:"year",value:"2026"}),projection:r.projection({mode:"year",value:"2026"})}}',reserved)
            good(f'rapportidentifierare {reserved} ger saknat underlag utan prototypevärden eller krasch',report['available'] is False and report['name']=='Partner' and report['rows']==0 and report['summary']['agreements'] is None and report['projection']['valid'] is False)
        for reserved in ['constructor','toString','__proto__','hasOwnProperty']:
            denied=await page.evaluate('(id)=>Portal.partnerSetup.saveProfile({name:"QA Reserverad",salesAudiences:["business"]},id)',reserved)
            good(f'profiländring för obefintlig {reserved} avvisas utan ny partner',denied['ok'] is False and await page.evaluate('(id)=>!Portal.getPartner(id)',reserved))

        await page.evaluate('Portal.selectedPartnerId="syd";Portal.go("partner-sales")')
        for payload in [{'mode':'month','value':'2026-00'},{'mode':'month','value':'2026-13'},{'mode':'week','value':'2026-W00'},{'mode':'week','value':'2026-W54'},{'mode':'year','value':'2025'}]:
            result=await page.evaluate('(f)=>{const d=Portal.partnerSalesData.forPartner("syd");return {period:d.period(f),rows:d.query(f),scenario:d.projection(f)}}',payload)
            good(f"ogiltig {payload['value']} har ingen observerad bas eller prognos",result['period']['valid'] is False and not result['rows'] and result['scenario']['valid'] is False)
        for mode,value,days,start,end in [('week','2026-W01',4,'2026-01-01','2026-01-04'),('week','2026-W41',3,'2026-10-05','2026-10-07'),('month','2026-10',7,'2026-10-01','2026-10-07')]:
            actual=await page.evaluate('(f)=>Portal.partnerSalesData.forPartner("syd").period(f)',{'mode':mode,'value':value})
            good(f'{value} avgränsar observerade dagar vid års- och datagräns',actual['observedStart']==start and actual['observedEnd']==end and actual['daysObserved']==days)
        for partner in ['syd','vast']:
            before=await page.evaluate('(id)=>JSON.stringify(Portal.partnerSalesData.forPartner(id).ledger)',partner)
            await page.evaluate('(id)=>{Portal.selectedPartnerId=id;Portal.partnerSetup.open(id)}',partner)
            await page.locator('[name="salesAudience"][value="both"]').check()
            await page.get_by_role('button',name='Spara inställningar',exact=True).click()
            missing='consumer' if partner=='syd' else 'business'
            await page.locator(f'[data-sr-segment="{missing}"]').click()
            good(f'{partner}: segment utan historik visar streck och saknat underlag',await page.locator('[data-sr-metric] strong').all_inner_texts()==['—']*3 and 'Underlag saknas' in await page.locator('.sr-data-missing').inner_text())
            await page.locator('[data-go="partner-insights"]').first.click()
            good(f'{partner}: saknad segmenthistorik skapar ingen kundtid eller prognos',await page.locator('.sr-tenure,.sr-projection-values').count()==0 and await page.locator('.sr-data-missing').count()==1)
            good(f'{partner}: segmentändring bevarar varje historisk avtalsrad',await page.evaluate('(id)=>JSON.stringify(Portal.partnerSalesData.forPartner(id).ledger)',partner)==before)
        await page.evaluate('Portal.selectedPartnerId="syd";Portal.partnerSetup.open("syd")')
        old=await page.evaluate('JSON.stringify(Portal.state.partnerProfiles)')
        await page.locator('#partner-setup-name').fill('QA Får inte sparas')
        await page.evaluate('''()=>{window.qaSet=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(this===localStorage)throw new DOMException('QA quota','QuotaExceededError');return window.qaSet.call(this,k,v)}}''')
        await page.get_by_role('button',name='Spara inställningar',exact=True).click()
        good('redigeringsfel behåller dialog, tidigare profil och namn i registret',await page.locator('#partner-setup-error').is_visible() and await page.evaluate('JSON.stringify(Portal.state.partnerProfiles)')==old and await page.evaluate('Portal.getPartner("syd").name')=='Savera')
        await page.evaluate('Storage.prototype.setItem=window.qaSet;delete window.qaSet')
        await page.get_by_role('button',name='Spara inställningar',exact=True).click()
        good('profilredigering kan återförsökas efter ett verkligt lagringsfel',await page.evaluate('Portal.getPartner("syd").name')=='QA Får inte sparas')
        await page.evaluate('Portal.state.sites=[];delete Portal.state.partnerModulesSeeded;Portal.save();Portal.go("support")')
        good('giltig tom kundsidearray får fortfarande fiktivt seed från befintliga kundrader',await page.evaluate('Portal.state.sites.length>0&&Portal.state.sites.every(site=>Portal.state.records.some(row=>row&&row.id===site.recordId))'))
        await page.locator('#partner-support-title').fill('QA Uppföljningsfråga')
        await page.locator('#partner-support-message').fill('QA Fiktiv fråga i andra felrundan.')
        await page.get_by_role('button',name='Spara testförfrågan',exact=True).click()
        good('sparad supportfråga återför tangentbordsfokus till rubrikfältet',await page.evaluate('document.activeElement.id')=='partner-support-title')
        await page.evaluate('''()=>{window.qaSupport=Portal.state.support;Portal.state.support={legacy:{message:'QA äldre supportunderlag'}};Portal.save();Portal.go('support')}''')
        good('ett äldre supportobjekt bevaras när supportvyn öppnas',await page.evaluate('Portal.state.support.legacy.message')=='QA äldre supportunderlag')
        await page.locator('#partner-support-title').fill('QA Får inte skriva över äldre underlag')
        await page.locator('#partner-support-message').fill('QA Behåll både underlag och inmatning.')
        await page.get_by_role('button',name='Spara testförfrågan',exact=True).click()
        good('ny supportfråga skriver inte över oläsbart äldre underlag',await page.evaluate('Portal.state.support.legacy.message')=='QA äldre supportunderlag' and await page.locator('#partner-support-title').input_value()=='QA Får inte skriva över äldre underlag' and 'Ingen ny fråga sparades' in await page.locator('#toast').inner_text())
        await page.evaluate('''()=>{Portal.state.support=window.qaSupport;delete window.qaSupport;Portal.state.support[0].created={toString:null,valueOf:null};Portal.save();Portal.go('support')}''')
        good('en äldre frågas ogiltiga datumobjekt ger datum saknas utan krasch', 'Datum saknas' in await page.locator('.partner-request-list').inner_text())
        await page.evaluate('''()=>{Portal.state.sites={legacy:{subtitle:'Fiktivt underlag'}};delete Portal.state.partnerModulesSeeded;Portal.save();Portal.go('support')}''')
        site_object=await page.evaluate('JSON.stringify({legacy:{subtitle:"Fiktivt underlag"}})')
        good('supportvisning bevarar exakt äldre kundsideobjekt även före första seed',await page.evaluate('JSON.stringify(Portal.state.sites)')==site_object)
        await page.locator('#partner-support-title').fill('QA Ny fråga med äldre kundsidor')
        await page.locator('#partner-support-message').fill('QA Denna fråga ska inte skriva över äldre kundsideunderlag.')
        await page.get_by_role('button',name='Spara testförfrågan',exact=True).click()
        good('supportsparning bevarar exakt äldre kundsideobjekt i state och localStorage',await page.evaluate('JSON.stringify(Portal.state.sites)')==site_object and await page.evaluate('JSON.stringify(JSON.parse(localStorage.getItem("partnerlabb.portal.v2")).sites)')==site_object)
        await page.reload(wait_until='networkidle')
        good('det äldre kundsideobjektet består efter omladdning av support',await page.evaluate('JSON.stringify(Portal.state.sites)')==site_object and await page.locator('#partner-support-form').is_visible())
        good('profil-/resa-/rapporthandlingar ändrar inga kommersiella fixtures eller kundärenden',await fixture_snapshot()==fixtures)
        for width in [320,390,1440]:
            await page.set_viewport_size({'width':width,'height':1000})
            await page.evaluate('Portal.go("partners")')
            good(f'partnerregister med nya kanaler och resesteg ryms vid {width}px',await page.evaluate('document.documentElement.scrollWidth<=document.documentElement.clientWidth+1'))
            await page.screenshot(path=str(OUT/f'round2-partners-{width}.png'),full_page=True)
        good('inga scriptfel under andra rapportauditen',not errors)
        (OUT/'round2-reports.json').write_text(json.dumps({'passed':len(checks),'checks':checks,'scriptErrors':errors},ensure_ascii=False,indent=2))
        print(f'PASS {len(checks)} kontroller; {OUT}',flush=True)
        await context.close();await browser.close()


if __name__=='__main__': asyncio.run(main())
