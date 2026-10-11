"""Third bounded report audit: preserve existing partner-profile extensions.

Uses fictional profile metadata, the actual edit form, real localStorage failure,
and malformed saved report filters. No economic or customer fixtures are added.
"""
import asyncio
import json
import os
import pathlib
import shutil
import tempfile
from playwright.async_api import async_playwright

BASE=os.environ.get('PARTNERLABB_QA_URL','http://127.0.0.1:4193/').rstrip('/')+'/'
OUT=pathlib.Path(os.environ.get('PARTNERLABB_QA_SHOTS',tempfile.mkdtemp(prefix='partnerlabb-round3-reports-')))


async def main():
    OUT.mkdir(parents=True,exist_ok=True)
    checks,errors=[],[]
    def good(label,condition):
        if not condition: raise AssertionError(label)
        checks.append(label);print('PASS '+label,flush=True)
    async with async_playwright() as p:
        browser=await p.chromium.launch(executable_path=shutil.which('chromium') or '/usr/bin/chromium',args=['--no-sandbox'])
        context=await browser.new_context(viewport={'width':1440,'height':1000},locale='sv-SE')
        page=await context.new_page();page.on('pageerror',lambda error:errors.append(str(error)))
        await page.goto(BASE,wait_until='networkidle')
        await page.wait_for_function('Portal.partnerSetup && Portal.partnerSalesReports')
        async def fixtures():
            return await page.evaluate('JSON.stringify({records:Portal.state.records,moveins:Portal.state.moveins,finance:Portal.commercial.fixtures,kickback:Portal.partnerKickback.ledger,sales:Portal.partnerResultsData.rows()})')
        baseline=await fixtures()
        await page.evaluate('''()=>{
          const saved=JSON.parse(localStorage.getItem('partnerlabb.portal.v2'));
          saved.partnerProfiles.syd={id:'syd',name:'Savera',type:'sales',salesAudiences:['business'],legacyNote:'Fiktivt äldre profilunderlag',extension:{keep:true,reference:'QA-PROFILE-OLD'},audience:'consumer',typeLabel:'QA Får inte styra vyn',initials:'QA Får inte styra'};
          saved.partnerProfiles.estate1={id:'estate1',name:'Exempelfastigheter AB',type:'property',salesAudiences:[],legacyNote:'Fiktivt fastighetsunderlag',extension:{keep:true,reference:'QA-PROPERTY-OLD'},audience:'business'};
          localStorage.setItem('partnerlabb.portal.v2',JSON.stringify(saved));
        }''')
        await page.reload(wait_until='networkidle')
        profiles=await page.evaluate('Portal.state.partnerProfiles')
        good('giltig säljprofil behåller äldre anteckning och strukturerad extension vid inläsning',profiles['syd']['legacyNote']=='Fiktivt äldre profilunderlag' and profiles['syd']['extension']=={'keep':True,'reference':'QA-PROFILE-OLD'})
        good('giltig fastighetsprofil behåller sitt tidigare profilunderlag',profiles['estate1']['legacyNote']=='Fiktivt fastighetsunderlag' and profiles['estate1']['extension']['reference']=='QA-PROPERTY-OLD')
        partner=await page.evaluate('Portal.getPartner("syd")')
        good('okända metadatafält påverkar inte säljpartnerns faktiska typ eller kundsegment',partner['type']=='sales' and partner['audience']=='business' and partner['salesAudiences']==['business'] and partner['typeLabel']=='Företagsförsäljning' and 'legacyNote' not in partner and 'extension' not in partner and partner.get('initials')!='QA Får inte styra')
        partner=await page.evaluate('Portal.getPartner("estate1")')
        good('okända metadatafält kan inte ge fastighetspartnern företagssegment',partner['type']=='property' and partner['audience']=='movein' and partner['salesAudiences']==[])
        await page.evaluate('Portal.go("support")')
        persisted=await page.evaluate('JSON.parse(localStorage.getItem("partnerlabb.portal.v2")).partnerProfiles')
        good('första supportbesöket och autosparning bevarar båda profilernas underlag',persisted['syd']['extension']==profiles['syd']['extension'] and persisted['estate1']['extension']==profiles['estate1']['extension'])
        await page.locator('#partner-support-title').fill('QA Ny supportfråga')
        await page.locator('#partner-support-message').fill('QA Fiktivt innehåll i tredje rapportauditen.')
        await page.get_by_role('button',name='Spara testförfrågan',exact=True).click()
        persisted=await page.evaluate('JSON.parse(localStorage.getItem("partnerlabb.portal.v2")).partnerProfiles')
        good('aktiv supportsparning skriver inte bort äldre profilmetadata',persisted['syd']['legacyNote']==profiles['syd']['legacyNote'] and persisted['estate1']['legacyNote']==profiles['estate1']['legacyNote'])
        await page.evaluate('Portal.partnerSetup.open("syd")')
        await page.locator('#partner-setup-name').fill('QA Savera uppdaterad')
        await page.locator('[name="salesAudience"][value="both"]').check()
        await page.get_by_role('button',name='Spara inställningar',exact=True).click()
        updated=await page.evaluate('Portal.state.partnerProfiles.syd')
        good('profilredigering uppdaterar namn och segment utan att ersätta extra profilunderlag',updated['name']=='QA Savera uppdaterad' and updated['salesAudiences']==['business','consumer'] and updated['extension']==profiles['syd']['extension'] and updated['legacyNote']==profiles['syd']['legacyNote'])
        await page.reload(wait_until='networkidle')
        good('redigerad profils äldre underlag består efter omladdning',await page.evaluate('Portal.state.partnerProfiles.syd.extension.reference')=='QA-PROFILE-OLD' and await page.evaluate('Portal.getPartner("syd").name')=='QA Savera uppdaterad')
        await page.evaluate('Portal.partnerSetup.open("estate1")')
        await page.locator('#partner-setup-name').fill('QA Exempelfastigheter uppdaterad')
        await page.get_by_role('button',name='Spara inställningar',exact=True).click()
        good('fastighetspartners namnredigering behåller typ och äldre profilunderlag',await page.evaluate('Portal.getPartner("estate1").type')=='property' and await page.evaluate('Portal.state.partnerProfiles.estate1.extension.reference')=='QA-PROPERTY-OLD')
        await page.evaluate('Portal.partnerSetup.open("syd")')
        await page.locator('#partner-setup-name').fill('QA Efter lagringsfel')
        before=await page.evaluate('JSON.stringify(Portal.state.partnerProfiles)')
        await page.evaluate('''()=>{window.qaSet=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(this===localStorage)throw new DOMException('QA quota','QuotaExceededError');return window.qaSet.call(this,k,v)}}''')
        await page.get_by_role('button',name='Spara inställningar',exact=True).click()
        good('verkligt lagringsfel bevarar hela tidigare profil inklusive extensions',await page.evaluate('JSON.stringify(Portal.state.partnerProfiles)')==before and await page.locator('#partner-setup-error').is_visible() and await page.locator('#partner-setup-name').input_value()=='QA Efter lagringsfel')
        await page.evaluate('Storage.prototype.setItem=window.qaSet;delete window.qaSet')
        await page.get_by_role('button',name='Spara inställningar',exact=True).click()
        good('återförsök sparar ändringen utan att förlora den äldre extensionen',await page.evaluate('Portal.getPartner("syd").name')=='QA Efter lagringsfel' and await page.evaluate('Portal.state.partnerProfiles.syd.extension.reference')=='QA-PROFILE-OLD')
        normal=await page.evaluate('localStorage.getItem("partnerlabb.portal.v2")')
        await page.goto(BASE+'?demo=inflyttning',wait_until='networkidle')
        good('profilunderlaget från normalytan blandas inte in i kunddemot',not await page.evaluate('Object.hasOwn(Portal.state.partnerProfiles,"syd")'))
        good('kunddemoöppning bevarar normalt profilunderlag i sin egen lagring',await page.evaluate('localStorage.getItem("partnerlabb.portal.v2")')==normal)
        await page.goto(BASE+'?partner=syd#partner-sales',wait_until='networkidle')
        good('normalytan återger både redigerat namn och tidigare extension efter demobyte',await page.evaluate('Portal.getPartner("syd").name')=='QA Efter lagringsfel' and await page.evaluate('Portal.state.partnerProfiles.syd.extension.reference')=='QA-PROFILE-OLD')
        for invalid in [{'filters':{'mode':{},'value':['bad'],'segment':{},'product':{},'seller':42,'region':False,'query':{},'status':[]},'list':{}}, {'filters':True,'list':['active']}, ['bad']]:
            await page.evaluate('(data)=>sessionStorage.setItem(Portal.partnerSalesReports.storageKey,JSON.stringify(data))',invalid)
            await page.reload(wait_until='networkidle')
            actual=await page.evaluate('Portal.partnerSalesReports.filters()')
            good('feltypat sparat rapporturval återgår till giltigt urval utan krasch',actual=={'mode':'year','value':'2026','segment':'all','product':'all','seller':'all','region':'all','query':'','status':'all'} and await page.locator('#sr-period').input_value()=='2026')
        good('profiler, support och felaktiga filter ändrar inga avtal, ekonomi eller serviceärenden',await fixtures()==baseline)
        for width in [320,390,1440]:
            await page.set_viewport_size({'width':width,'height':1000})
            await page.evaluate('Portal.go("partners");Portal.partnerSetup.open("syd")')
            good(f'profilredigering med bevarat underlag ryms vid {width}px',await page.evaluate('document.documentElement.scrollWidth<=document.documentElement.clientWidth+1'))
            await page.screenshot(path=str(OUT/f'profile-{width}.png'),full_page=True)
            await page.locator('#partner-setup-cancel').click()
        good('inga scriptfel under tredje rapportauditen',not errors)
        (OUT/'round3-reports.json').write_text(json.dumps({'passed':len(checks),'checks':checks,'scriptErrors':errors},ensure_ascii=False,indent=2))
        print(f'PASS {len(checks)} kontroller; {OUT}',flush=True)
        await context.close();await browser.close()


if __name__=='__main__':asyncio.run(main())
