"""Independent browser checks for encoded links, demo history and support edges.

Runs against a buildless preview using fictional local state. Failed assertions
are collected so the coordinator can review every reproduced defect in one run.
"""
import asyncio
import json
import os
import pathlib
import shutil
import tempfile

from playwright.async_api import async_playwright

BASE = os.environ.get('PARTNERLABB_QA_URL', 'http://127.0.0.1:4192/').rstrip('/') + '/'
OUT = pathlib.Path(os.environ.get('PARTNERLABB_QA_OUTPUT', tempfile.mkdtemp(prefix='partnerlabb-round2-navigation-')))


async def main():
    checks, errors = [], []

    def check(label, result, observed=None):
        checks.append({'label': label, 'passed': bool(result), 'observed': observed})
        print(('PASS ' if result else 'FAIL ') + label, flush=True)

    async with async_playwright() as p:
        browser = await p.chromium.launch(executable_path=shutil.which('chromium'), headless=True, args=['--no-sandbox'])
        context = await browser.new_context(viewport={'width': 1440, 'height': 1000}, locale='sv-SE')
        page = await context.new_page()
        page.set_default_timeout(10000)
        page.on('pageerror', lambda error: errors.append(str(error)))

        async def loaded(url=BASE):
            await page.goto(url, wait_until='networkidle')
            await page.wait_for_function('Portal.partnerSetup && Portal.demoGuide && Portal.propertyIntake')

        async def state():
            return await page.evaluate('({page:Portal.page,role:Portal.role,partner:Portal.partner,selected:Portal.selectedPartnerId,step:Portal.demoGuide.currentStep(),length:history.length,url:location.href})')

        try:
            await loaded(BASE + '?partner=vast#%70artner-sales')
            observed = await state()
            check('percentkodad giltig rapportlänk öppnar vald partner', observed['page'] == 'partner-sales' and observed['selected'] == 'vast' and 'partner=vast' in page.url, observed)
            await loaded(BASE + '?workspace=vast#%61cademy')
            observed = await state()
            check('percentkodad giltig utbildningslänk behåller arbetsytan', observed['page'] == 'academy' and observed['role'] == 'partner' and observed['partner'] == 'vast', observed)
            for fragment in ['%', '%C0%AF', '%E0%A4%A', '%00', '%5F%5Fproto%5F%5F']:
                await loaded(BASE + '#' + fragment)
                check('felaktig eller ärvd kodad hash får säker reservvy: ' + fragment, await page.evaluate('Portal.page==="overview" && document.querySelector("#view h1")!==null'))

            await loaded()
            await page.evaluate('Portal.go("partners")')
            await page.locator('[data-partner-create]').click()
            check('partnerdialogen får fokus och är markerad som native dialog', await page.evaluate('document.querySelector("#portal-dialog").open && document.querySelector("#portal-dialog").contains(document.activeElement)'))
            await page.go_back()
            await page.wait_for_function('Portal.page==="overview"')
            check('Bakåt med öppen dialog stänger dialogen och fokuserar rätt vy', await page.evaluate('!document.querySelector("#portal-dialog").open && document.activeElement.id==="view"'))
            await page.go_forward()
            await page.wait_for_function('Portal.page==="partners"')
            check('Framåt efter dialognavigation öppnar inte en gammal modal', await page.evaluate('!document.querySelector("#portal-dialog").open && document.activeElement.id==="view"'))
            await page.locator('#nav [data-go="partners"]').focus()
            await page.set_viewport_size({'width': 390, 'height': 844})
            await page.wait_for_timeout(100)
            check('desktopmenyns tangentbordsfokus återgår till synlig menyknapp på mobil', await page.evaluate('document.activeElement.id==="menu-toggle" && getComputedStyle(document.activeElement).visibility!=="hidden"'))
            await page.set_viewport_size({'width': 1440, 'height': 1000})

            await loaded(BASE + '#support')
            before = await page.evaluate('JSON.stringify(Portal.state.support)')
            await page.locator('#partner-support-title').fill('   ')
            await page.locator('#partner-support-message').fill('Fiktiv fråga för kontroll.')
            await page.locator('#partner-support-form button[type="submit"]').click()
            check('supportformuläret avvisar enbart blanksteg utan att spara en rad', await page.evaluate('JSON.stringify(Portal.state.support)') == before)
            await page.locator('#partner-support-title').fill('<b>Fiktivt & underlag</b>')
            await page.locator('#partner-support-form button[type="submit"]').focus()
            await page.keyboard.press('Enter')
            check('sparad supportfråga behandlar HTML som vanlig text', await page.locator('.partner-request h3').first.inner_text() == '<b>Fiktivt & underlag</b>' and await page.locator('.partner-request h3 b').count() == 0)
            check('supportsparning behåller användbart tangentbordsfokus', await page.evaluate('document.activeElement.id==="partner-support-title"'))
            await page.evaluate('''()=>{
              Portal.state.support={legacy:{message:"Fiktivt underlag som ska bevaras"}};
              Portal.save();window.qaSupportOriginal=JSON.stringify(Portal.state.support);Portal.go("support");
            }''')
            check('öppna support bevarar en felaktig äldre listtyp', await page.evaluate('JSON.stringify(Portal.state.support)===window.qaSupportOriginal'))
            await page.locator('#partner-support-title').fill('Fiktiv ny fråga')
            await page.locator('#partner-support-message').fill('Den gamla listan får inte ersättas.')
            await page.locator('#partner-support-form button[type="submit"]').click()
            check('ny supportfråga skriver inte över felaktigt äldre underlag', await page.evaluate('JSON.stringify(Portal.state.support)===window.qaSupportOriginal && JSON.stringify(JSON.parse(localStorage.getItem("partnerlabb.portal.v2")).support)===window.qaSupportOriginal'))
            check('blockerad supportskrivning visar att inmatningen finns kvar', await page.locator('#partner-support-title').input_value() == 'Fiktiv ny fråga' and 'kunde inte' in (await page.locator('#toast').inner_text()).lower())
            date_errors = []
            try:
                await page.evaluate('''()=>{
                  Portal.state.support=[{id:"qa-bad-date",partner:"syd",title:"Fiktiv rubrik",message:"Fiktiv fråga",created:{toString:null,valueOf:null}}];Portal.go("support");
                }''')
            except Exception as error:
                date_errors.append(str(error).splitlines()[0])
            check('felaktigt sparat supportdatum kraschar inte sidan', not date_errors and await page.locator('#partner-support-form').count() == 1, date_errors)
            try:
                date_fallback = await page.evaluate('Portal.date({toString:null,valueOf:null})')
            except Exception as error:
                date_fallback = None
            check('gemensam datumformatterare hanterar JSON-objekt utan typkonverteringsfel', isinstance(date_fallback, str), date_fallback)

            await loaded()
            await page.evaluate('Portal.state.qaNormalMarker="normalyta";Portal.save()')
            normal_before = await page.evaluate('localStorage.getItem("partnerlabb.portal.v2")')
            await page.locator('.demo-launch-link').click()
            await page.wait_for_function('Portal.demoMode===true')
            check('öppna kunddemo väljer separat lagringsyta', await page.evaluate('Portal.state.qaNormalMarker===undefined'))
            await page.locator('.demo-intro-start').click()
            finance_before = await page.evaluate('JSON.stringify({records:Portal.state.records,offers:Portal.state.offers,moveins:Portal.state.moveins})')
            await page.locator('.demo-guide-navigation [data-demo-step="3"]').click()
            step3 = await state()
            await page.locator('.demo-guide-navigation [data-demo-step="5"]').click()
            step5 = await state()
            check('demots steg 3 och 5 får separata historikposter', step5['length'] == step3['length'] + 1 and step5['step'] == 5, {'step3': step3, 'step5': step5})
            await page.go_back()
            observed = await state()
            check('Bakåt återgår från steg 5 till oförändrat steg 3', observed['page'] == 'property-registrations' and observed['step'] == 3 and observed['url'] == step3['url'], observed)
            await page.go_forward()
            observed = await state()
            check('Framåt återställer steg 5 med rätt partnerperspektiv', observed['page'] == 'property-registrations' and observed['step'] == 5 and observed['role'] == 'partner' and observed['partner'] == 'estate1', observed)
            await page.locator('.demo-guide-navigation [data-demo-step="2"]').click()
            await page.go_back()
            observed = await state()
            check('Bakåt från registreringsvalet behåller steg 5 i föregående historikpost', observed['step'] == 5 and observed['page'] == 'property-registrations', observed)
            check('demonavigation skapar inga nya kundavtal eller servicehändelser', await page.evaluate('JSON.stringify({records:Portal.state.records,offers:Portal.state.offers,moveins:Portal.state.moveins})') == finance_before)
            check('demonavigation ändrar inte ordinarie lagringsyta', await page.evaluate('localStorage.getItem("partnerlabb.portal.v2")') == normal_before)
            await page.reload(wait_until='networkidle')
            check('omladdning återställer demosteg och perspektiv från URL', await page.evaluate('Portal.demoMode && Portal.role==="partner" && Portal.partner==="estate1" && Portal.demoGuide.currentStep()===5'))
            await page.locator('.demo-guide-exit').click()
            await page.wait_for_function('Portal.demoMode===false')
            check('avsluta demo återställer ordinarie sparat underlag', await page.evaluate('Portal.state.qaNormalMarker==="normalyta"'))
            await page.go_back()
            await page.wait_for_function('Portal.demoMode===true')
            check('Bakåt mellan hela normal-/demodokument återställer rätt lagringsyta', await page.evaluate('Portal.state.qaNormalMarker===undefined && Portal.demoGuide.currentStep()===5'))
            check('hela andrarundans navigation ger inga asynkrona scriptfel', not errors, errors)
        finally:
            OUT.mkdir(parents=True, exist_ok=True)
            (OUT / 'round2-navigation.json').write_text(json.dumps({'checks': checks, 'passed': sum(row['passed'] for row in checks), 'total': len(checks), 'errors': errors}, ensure_ascii=False, indent=2))
            await browser.close()
    failures = [row['label'] for row in checks if not row['passed']]
    print(f'{len(checks) - len(failures)}/{len(checks)} checks passed', flush=True)
    if failures:
        raise AssertionError('; '.join(failures))


if __name__ == '__main__':
    asyncio.run(main())
