"""Browser regression for portal routing, keyboard access and safe local reads.

Uses the buildless static portal, fictional rows and installed Chromium. No
credentials or external calls are required. Run with PARTNERLABB_QA_URL pointing
at the local preview; reports go outside the source checkout by default.
"""
import asyncio
import json
import os
import pathlib
import shutil
import tempfile

from playwright.async_api import async_playwright

BASE = os.environ.get('PARTNERLABB_QA_URL', 'http://127.0.0.1:4191/').rstrip('/') + '/'
OUT = pathlib.Path(os.environ.get('PARTNERLABB_QA_OUTPUT', tempfile.mkdtemp(prefix='partnerlabb-navigation-qa-')))


async def main():
    checks, errors = [], []

    def good(label, value):
        if not value:
            raise AssertionError(label)
        checks.append(label)
        print('PASS ' + label, flush=True)

    async with async_playwright() as p:
        browser = await p.chromium.launch(executable_path=shutil.which('chromium'), headless=True, args=['--no-sandbox'])
        context = await browser.new_context(viewport={'width': 1440, 'height': 1000}, locale='sv-SE')
        page = await context.new_page()
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.set_default_timeout(10000)

        async def loaded(url=BASE):
            await page.goto(url, wait_until='networkidle')
            await page.wait_for_function('Portal.partnerSetup && Portal.partnerSalesData && Portal.moveinService')

        try:
            await loaded()
            initial_length = await page.evaluate('history.length')
            await page.locator('#nav [data-go="partners"]').focus()
            await page.keyboard.press('Enter')
            good('Enter i huvudmenyn öppnar Partners och ger innehållet fokus', await page.evaluate('Portal.page==="partners" && document.activeElement.id==="view"'))
            await page.locator('#nav [data-go="product-facts"]').click()
            good('menyn lägger till riktiga historikposter', await page.evaluate('history.length') == initial_length + 2)
            await page.go_back()
            await page.wait_for_function('Portal.page==="partners"')
            good('Bakåt återgår till föregående portalvy', page.url.endswith('#partners'))
            await page.go_forward()
            await page.wait_for_function('Portal.page==="product-facts"')
            good('Framåt återställer nästa portalvy', page.url.endswith('#product-facts'))
            before = page.url
            await page.locator('.skip-link').focus()
            await page.keyboard.press('Enter')
            good('Hoppa till innehållet flyttar fokus utan att byta sida eller URL', page.url == before and await page.evaluate('Portal.page==="product-facts" && document.activeElement.id==="view"'))
            length = await page.evaluate('history.length')
            await page.evaluate('Portal.go("product-facts")')
            good('samma vy lägger inte till en dublett i historiken', await page.evaluate('history.length') == length)

            await page.evaluate('Portal.previewPartner("syd")')
            await page.evaluate('Portal.go("academy")')
            await page.evaluate('Portal.previewPartner("vast")')
            await page.go_back()
            await page.wait_for_function('Portal.role==="partner" && Portal.partner==="syd" && Portal.page==="academy"')
            good('Bakåt över perspektivbyte återställer rätt partner och vy', 'workspace=syd' in page.url)
            await page.go_forward()
            await page.wait_for_function('Portal.role==="partner" && Portal.partner==="vast" && Portal.page==="overview"')
            good('Framåt över perspektivbyte återställer nästa partner', 'workspace=vast' in page.url)
            await page.evaluate('Portal.returnInternal()')
            await page.go_back()
            await page.wait_for_function('Portal.role==="partner" && Portal.partner==="vast"')
            good('Bakåt återgår från intern vy till partnerns egen arbetsyta', 'workspace=vast' in page.url)
            await loaded(BASE + '?partner=vast#partner-sales')
            await page.evaluate('Portal.selectedPartnerId="estate1";Portal.go("property-partnership")')
            await page.go_back()
            await page.wait_for_function('Portal.page==="partner-sales" && Portal.selectedPartnerId==="vast"')
            good('historiken återställer vald intern partner, inte senaste partnern', await page.locator('h1').inner_text() == 'Face2face')

            for fragment in ['missing-view', 'constructor', '__proto__', 'toString']:
                await loaded(BASE + '#' + fragment)
                good('okänd eller ärvd route hanteras: ' + fragment, await page.evaluate('Portal.page==="overview"') and page.url.endswith('#overview') and await page.locator('h1').count() == 1)
            await loaded(BASE + '?workspace=missing&partner=missing#partner-sales')
            good('okänd partner ger en fungerande intern Partners-vy', await page.evaluate('Portal.role==="internal" && Portal.page==="partners"'))
            await loaded(BASE + '?movein=estate2#overview')
            good('äldre inflyttningslänk öppnar rätt fastighetspartners registrering', await page.evaluate('Portal.role==="partner" && Portal.partner==="estate2" && Portal.page==="movein"'))

            await loaded()
            await page.set_viewport_size({'width': 390, 'height': 844})
            await page.locator('#menu-toggle').click()
            good('mobilmenyn öppnas med fokus på aktuell menypost', await page.evaluate('document.querySelector("#sidebar").classList.contains("open") && document.activeElement.closest("#sidebar")!==null && document.activeElement.getAttribute("aria-current")==="page"'))
            tab_focus = []
            for _ in range(24):
                await page.keyboard.press('Tab')
                tab_focus.append(await page.evaluate('document.activeElement.closest("#sidebar")!==null'))
            good('mobilmenyn behåller Tab-fokus genom flera kompletta varv', all(tab_focus))
            for _ in range(12):
                await page.keyboard.press('Shift+Tab')
                tab_focus.append(await page.evaluate('document.activeElement.closest("#sidebar")!==null'))
            good('mobilmenyn behåller fokus även vid omvänd tabbordning', all(tab_focus))
            await page.keyboard.press('Escape')
            good('Escape stänger mobilmenyn och återför fokus till menyknappen', await page.evaluate('!document.querySelector("#sidebar").classList.contains("open") && document.querySelector("#sidebar-backdrop").hidden && document.activeElement.id==="menu-toggle" && document.querySelector("#menu-toggle").getAttribute("aria-expanded")==="false"'))
            await page.locator('#menu-toggle').click()
            await page.locator('#sidebar-backdrop').click(position={'x': 350, 'y': 300})
            good('klick utanför mobilmenyn stänger och återför fokus', await page.evaluate('!document.querySelector("#sidebar").classList.contains("open") && document.activeElement.id==="menu-toggle"'))
            await page.locator('#menu-toggle').click()
            await page.locator('#nav [data-go="partners"]').click()
            good('mobilnavigation stänger menyn och ger det nya innehållet fokus', await page.evaluate('Portal.page==="partners" && !document.querySelector("#sidebar").classList.contains("open") && document.activeElement.id==="view"'))
            await page.locator('#menu-toggle').click()
            await page.set_viewport_size({'width': 1440, 'height': 1000})
            await page.wait_for_function('document.querySelector("#sidebar-backdrop").hidden')
            good('byte till desktop lämnar ingen blockerande mobilbakgrund', await page.evaluate('!document.querySelector("#sidebar").classList.contains("open")'))

            await page.evaluate('''()=>{
              Portal.state.moveins=[null,7,{id:"older",partner:"estate1",name:"Äldre exempel",events:[null,{at:"2026-01-01T10:00:00Z",text:"Gammal händelse"}]},{id:"newer",partner:"estate2",name:"Nyare exempel",events:[{at:"2026-10-11T10:00:00Z",text:"Nyast händelse"}]}];
              window.qaMoveinsBefore=JSON.stringify(Portal.state.moveins);
            }''')
            await page.locator('#notifications').click()
            good('Senaste aktiviteter visar den faktiskt nyaste händelsen först', await page.locator('#dialog-body .activity-row').first.inner_text() == '11 okt.\nNyare exempel\nNyast händelse')
            good('notifikationer hoppar över felaktiga rader utan att radera dem', await page.evaluate('JSON.stringify(Portal.state.moveins)===window.qaMoveinsBefore'))
            await page.keyboard.press('Escape')

            await page.evaluate('Portal.previewPartner("vast");Portal.go("settings")')
            await page.evaluate('''()=>{
              Portal.state.consumerSales=[null,3,{id:"own",partner:"vast",name:"Eget fiktivt underlag",owner:"Intern",events:[null,{visibility:"shared",text:"Delat"},{visibility:"internal",text:"Internt"}]},{id:"other",partner:"syd",name:"Annan partners fiktiva underlag",events:[]}];
              Portal.state.offers={unknown:"bevara"};Portal.state.sites={unknown:"bevara"};
              window.qaOriginalState=JSON.stringify(Portal.state);
              Portal.download=(filename,content)=>{window.qaExport=JSON.parse(content)};
            }''')
            await page.locator('#export-settings').click()
            good('partnerexport innehåller enbart den egna partnerns konsumentunderlag', await page.evaluate('qaExport.consumerSales.length===1 && qaExport.consumerSales[0].id==="own" && !("owner" in qaExport.consumerSales[0]) && qaExport.consumerSales[0].events.length===1 && qaExport.consumerSales[0].events[0].text==="Delat"'))
            good('felaktiga exportlistor ger ett fungerande exportresultat', await page.evaluate('Array.isArray(qaExport.offers) && qaExport.offers.length===0 && Array.isArray(qaExport.sites) && qaExport.sites.length===0'))
            good('export behåller alla ursprungliga felaktiga och andra partnerdata', await page.evaluate('JSON.stringify(Portal.state)===window.qaOriginalState'))

            await context.close()
            context = await browser.new_context(viewport={'width': 1440, 'height': 1000})
            page = await context.new_page()
            page.on('pageerror', lambda error: errors.append(str(error)))
            await loaded()
            await page.evaluate('''()=>{
              const s=JSON.parse(localStorage.getItem("partnerlabb.portal.v2"));
              s.records.push(null,7,{id:"broken",company:"Bevarat trasigt exempel",partner:"syd",status:"ny",events:null});
              s.qaPreservedExtension={source:"fiktivt",marker:"bevarat"};
              window.qaExpectedRecords=JSON.stringify(s.records);
              localStorage.setItem("partnerlabb.portal.v2",JSON.stringify(s));
            }''')
            expected = await page.evaluate('window.qaExpectedRecords')
            await page.reload(wait_until='networkidle')
            good('en felaktig historisk kundrad återställer inte resten av v2', await page.evaluate('Portal.state.qaPreservedExtension?.marker==="bevarat"'))
            good('felaktiga kundrader bevaras oförändrade i state', await page.evaluate('JSON.stringify(Portal.state.records)') == expected)
            good('kundläsaren visar giltiga rader och hoppar över felaktiga', await page.evaluate('Portal.getRecords().length===7 && Portal.getRecords().every(Portal.isRecord)'))
            await page.evaluate('Portal.save()')
            good('nästa sparning behåller giltiga och felaktiga historiska rader', await page.evaluate('JSON.stringify(JSON.parse(localStorage.getItem("partnerlabb.portal.v2")).records)') == expected)

            # The older customer forms remain preserved behind inactive routes.
            # Their save failure must be honest without reactivating those routes.
            await page.evaluate('''()=>{
              Portal.returnInternal();document.querySelector("#view").innerHTML=Portal.routes.customers.render();Portal.routes.customers.bind();
              window.qaBeforeLegacy=JSON.stringify(Portal.state);window.qaSave=Portal.save;Portal.save=()=>false;
            }''')
            await page.locator('#view [data-new-customer]').click()
            await page.locator('#customer-form [name="company"]').fill('QA Fiktiv kund AB')
            await page.locator('#customer-form [name="need"]').fill('Fiktivt underlag för lagringskontroll.')
            await page.locator('#customer-form [name="next"]').fill('Fiktivt nästa steg.')
            await page.locator('#customer-form input[type="checkbox"]').check()
            await page.locator('#customer-form button[type="submit"]').click()
            good('äldre kundregistrering återställer data och behåller formuläret vid sparfel', await page.evaluate('JSON.stringify(Portal.state)===window.qaBeforeLegacy && document.querySelector("#portal-dialog").open') and 'kunde inte sparas' in await page.locator('#toast').inner_text())
            await page.evaluate('Portal.save=window.qaSave;Portal.closeDialog()')
            await page.locator('#update-record').click()
            await page.locator('#update-form [name="owner"]').select_option(label='Demoansvarig B')
            await page.locator('#update-form [name="feedback"]').fill('Fiktiv återkoppling som inte får sparas.')
            await page.evaluate('Portal.save=()=>false')
            await page.locator('#update-form button[type="submit"]').click()
            good('äldre kunduppdatering återställer ansvar och händelser vid sparfel', await page.evaluate('JSON.stringify(Portal.state)===window.qaBeforeLegacy && document.querySelector("#portal-dialog").open') and 'kunde inte sparas' in await page.locator('#toast').inner_text())
            await page.evaluate('Portal.save=window.qaSave;Portal.closeDialog()')
            for broken in [None, {'saved': 'bevarat fiktivt underlag'}, 'bevarat fiktivt underlag']:
                await page.evaluate('''(broken)=>{
                  const s=JSON.parse(localStorage.getItem("partnerlabb.portal.v2"));
                  s.records=broken;s.qaPreservedExtension={marker:"bevarat med trasig lista"};
                  s.support=[{id:"qa-existing",partner:"syd",subject:"Bevarad fiktiv fråga",message:"Befintligt fiktivt underlag",status:"new"}];
                  localStorage.setItem("partnerlabb.portal.v2",JSON.stringify(s));
                }''', broken)
                await page.reload(wait_until='networkidle')
                good('felaktig kundlisttyp behåller annat sparat underlag: ' + type(broken).__name__, await page.evaluate('Portal.state.qaPreservedExtension?.marker==="bevarat med trasig lista" && Portal.state.support[0]?.subject==="Bevarad fiktiv fråga" && Portal.getRecords().length===0') and await page.evaluate('Portal.state.records') == broken)
                await page.evaluate('Portal.save()')
                good('nästa sparning bevarar felaktig kundlisttyp: ' + type(broken).__name__, await page.evaluate('JSON.parse(localStorage.getItem("partnerlabb.portal.v2")).records') == broken)
            good('hela navigationsregressionen ger inga scriptfel', not errors)
        finally:
            OUT.mkdir(parents=True, exist_ok=True)
            (OUT / 'navigation-qa.json').write_text(json.dumps({'checks': checks, 'count': len(checks), 'errors': errors}, ensure_ascii=False, indent=2))
            await browser.close()
    print(f'PASS {len(checks)} navigation/accessibility/storage checks; 0 script errors', flush=True)


if __name__ == '__main__':
    asyncio.run(main())
