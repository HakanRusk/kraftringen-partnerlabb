"""Third-round regression: preserve malformed partnership data and modal focus.

PARTNERLABB_BEFORE_PARTNERSHIP_FILE optionally serves the published module in
the browser for a controlled before-reproduction. All fixtures are fictional.
"""
import asyncio
import json
import os
import pathlib
import shutil
import tempfile

from playwright.async_api import async_playwright

BASE = os.environ.get('PARTNERLABB_QA_URL', 'http://127.0.0.1:4193/').rstrip('/') + '/'
OUT = pathlib.Path(os.environ.get('PARTNERLABB_QA_OUTPUT', tempfile.mkdtemp(prefix='partnerlabb-round3-navigation-')))
BEFORE = os.environ.get('PARTNERLABB_BEFORE_PARTNERSHIP_FILE')


async def main():
    checks, errors = [], []

    def check(label, result, observed=None):
        checks.append({'label': label, 'passed': bool(result), 'observed': observed})
        print(('PASS ' if result else 'FAIL ') + label, flush=True)

    async with async_playwright() as p:
        browser = await p.chromium.launch(executable_path=shutil.which('chromium'), headless=True, args=['--no-sandbox'])
        context = None

        async def fresh(suffix='?workspace=estate1#property-partnership'):
            nonlocal context
            if context:
                await context.close()
            context = await browser.new_context(viewport={'width': 1440, 'height': 1000}, locale='sv-SE')
            if BEFORE:
                async def old_module(route):
                    await route.fulfill(status=200, content_type='application/javascript', body=pathlib.Path(BEFORE).read_text())
                await context.route('**/property-partnership.js', old_module)
            page = await context.new_page()
            page.on('pageerror', lambda error: errors.append(str(error)))
            page.set_default_timeout(10000)
            await page.goto(BASE + suffix, wait_until='networkidle')
            await page.wait_for_function('Portal.propertyPartnership && Portal.partnerSetup')
            return page

        try:
            for label, value in [
                ('hela trädet som sträng', 'Fiktivt äldre samarbetsunderlag'),
                ('partnerpost som lista', {'estate1': ['Fiktivt äldre samarbetsunderlag']}),
                ('fokusfält som sträng', {'estate1': {'focus': 'Fiktivt äldre samarbetsunderlag', 'extension': 'Bevaras'}}),
            ]:
                page = await fresh()
                previous = await page.evaluate('''(value)=>{
                  Portal.state.propertyPartnership=value;Portal.save();Portal.render();
                  return {state:JSON.stringify(Portal.state),raw:localStorage.getItem("partnerlabb.portal.v2")};
                }''', value)
                await page.locator('.property-partnership-page [data-pp-focus="tenant-questions"]').click()
                observed = await page.evaluate('({state:JSON.stringify(Portal.state),raw:localStorage.getItem("partnerlabb.portal.v2"),focus:Portal.propertyPartnership.getFocus("estate1")})')
                check('felaktigt samarbetsunderlag bevaras vid fokusval: ' + label, observed['state'] == previous['state'] and observed['raw'] == previous['raw'], observed['focus'])
                check('blockerat fokusval markeras inte som sparat: ' + label, await page.locator('.property-partnership-page [data-pp-focus="tenant-questions"]').get_attribute('aria-pressed') == 'false')
                toast = await page.locator('#toast').inner_text()
                check('felaktigt samarbetsunderlag får tydligt sparfel: ' + label, 'kunde inte' in toast.lower() and 'behåll' in toast.lower(), toast)

            page = await fresh()
            await page.evaluate('''()=>{
              delete Portal.state.propertyPartnership;Portal.save();Portal.render();
            }''')
            await page.locator('.property-partnership-page [data-pp-focus="tenant-questions"]').click()
            check('första fokusvalet kan skapa ett saknat giltigt område', await page.evaluate('Portal.state.propertyPartnership.estate1.focus[0]==="tenant-questions"'))
            await page.evaluate('''()=>{
              Portal.state.propertyPartnership={extension:{note:"Fiktivt framtida fält"},estate1:{focus:[],note:"Fiktiv partneranteckning"},estate2:{focus:["capacity"],note:"Annan partners fiktiva anteckning"}};
              Portal.save();Portal.render();
            }''')
            await page.locator('.property-partnership-page [data-pp-focus="tenant-questions"]').click()
            check('giltigt fokusval behåller okända rot- och partnerfält samt annan partner', await page.evaluate('Portal.state.propertyPartnership.extension.note==="Fiktivt framtida fält" && Portal.state.propertyPartnership.estate1.note==="Fiktiv partneranteckning" && Portal.state.propertyPartnership.estate2.note==="Annan partners fiktiva anteckning" && Portal.state.propertyPartnership.estate2.focus[0]==="capacity"'))
            await page.reload(wait_until='networkidle')
            check('giltigt fokus och äldre extrafält finns kvar efter omladdning', await page.evaluate('Portal.propertyPartnership.getFocus("estate1")[0]==="tenant-questions" && Portal.state.propertyPartnership.estate1.note==="Fiktiv partneranteckning"'))

            # Real native dialog interaction and a bounded rapid-history check.
            opener = page.locator('.property-partnership-page [data-pp-detail="tenant-questions"]')
            await opener.focus()
            await page.keyboard.press('Enter')
            check('förslagsdialogen öppnas med rätt titel och fokus inom dialogen', await page.locator('#dialog-title').inner_text() == 'Färre elfrågor till er personal' and await page.evaluate('document.querySelector("#portal-dialog").contains(document.activeElement)'))
            focused = []
            for _ in range(6):
                await page.keyboard.press('Tab')
                focused.append(await page.evaluate('document.querySelector("#portal-dialog").contains(document.activeElement)||document.activeElement.tagName==="BODY"'))
            check('native dialog låter inte Tab nå bakgrundens kontroller', all(focused))
            await page.keyboard.press('Escape')
            await page.wait_for_function('document.activeElement?.dataset.ppDetail==="tenant-questions"')
            check('Escape återför fokus till rätt förslag', not await page.locator('#portal-dialog').evaluate('(node)=>node.open'))
            await page.locator('[data-pp-more] > summary').click()
            await page.locator('[data-pp-detail="capacity"]').focus()
            await page.keyboard.press('Enter')
            await page.locator('#close-dialog').focus()
            await page.keyboard.press('Enter')
            await page.wait_for_function('document.activeElement?.dataset.ppDetail==="capacity"')
            check('dialogens stängningsknapp återför fokus i öppnad fördjupning', await page.locator('[data-pp-more]').evaluate('(node)=>node.open'))
            await page.evaluate('Portal.go("property-results");Portal.go("property-partnership")')
            await page.go_back()
            await page.wait_for_function('Portal.page==="property-results"')
            await page.go_forward()
            await page.wait_for_function('Portal.page==="property-partnership"')
            check('snabb navigation och Back/Forward återställer rätt partner och stängda dialoger', await page.evaluate('Portal.partner==="estate1" && Portal.role==="partner" && !document.querySelector("#portal-dialog").open && document.activeElement.id==="view"'))
            await page.locator('#partner').select_option('estate2')
            await page.locator('#nav [data-go="property-partnership"]').click()
            await page.go_back()
            await page.go_back()
            await page.wait_for_function('Portal.partner==="estate1" && Portal.page==="property-partnership"')
            check('Back över partnerbyte återställer första partnerns egen samarbetsvy', 'workspace=estate1' in page.url and await page.locator('.property-partnership-page h1').count() == 1)
            check('tredje navigationpasset ger inga scriptfel', not errors, errors)
        finally:
            OUT.mkdir(parents=True, exist_ok=True)
            (OUT / 'round3-navigation.json').write_text(json.dumps({'checks': checks, 'passed': sum(item['passed'] for item in checks), 'total': len(checks), 'errors': errors, 'published_module_override': bool(BEFORE)}, ensure_ascii=False, indent=2))
            await browser.close()
    failures = [item['label'] for item in checks if not item['passed']]
    print(f'{len(checks)-len(failures)}/{len(checks)} checks passed', flush=True)
    if failures:
        raise AssertionError('; '.join(failures))


if __name__ == '__main__':
    asyncio.run(main())
