"""Focused browser audit of portal navigation and disappearing controls.

Uses isolated fictional browser data. A failed baseline writes all observations
before failing, so an actual UI defect remains reviewable after a correction.
"""
import asyncio
import json
import os
import pathlib
import shutil
import tempfile

from playwright.async_api import async_playwright

BASE = os.environ.get('PARTNERLABB_QA_URL', 'http://127.0.0.1:8014').rstrip('/')
OUT = pathlib.Path(os.environ.get('PARTNERLABB_QA_OUTPUT', tempfile.mkdtemp(prefix='partnerlabb-audit3-navigation-')))


async def main():
    checks, errors = [], []

    def check(label, result, observed=None):
        checks.append({'label': label, 'passed': bool(result), 'observed': observed})
        print(('PASS ' if result else 'FAIL ') + label, flush=True)

    async with async_playwright() as p:
        browser = await p.chromium.launch(executable_path=shutil.which('chromium'), args=['--no-sandbox'])
        context = await browser.new_context(viewport={'width': 1440, 'height': 1000}, locale='sv-SE')
        page = await context.new_page()
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.set_default_timeout(10000)

        async def loaded(path=''):
            await page.goto(BASE + '/' + path, wait_until='networkidle')
            await page.wait_for_function('window.Portal?.workbench && Portal.partnerSetup && Portal.propertyIntake')

        async def focus():
            return await page.evaluate('({tag:document.activeElement.tagName,id:document.activeElement.id,text:document.activeElement.textContent.trim().slice(0,80)})')

        try:
            await loaded()
            menu = await page.locator('#nav [data-go]').evaluate_all('(nodes)=>nodes.map(node=>node.dataset.go)')
            for route in menu:
                await page.locator('#nav [data-go="' + route + '"]').focus()
                await page.keyboard.press('Enter')
                check('intern meny öppnar sin faktiska vy: ' + route, await page.evaluate('(route)=>Portal.page===route && document.activeElement.id==="view" && document.querySelector("#view h1")!==null', route))

            # Follow visible menus for every configured channel, including new
            # property and employee profiles, without borrowing seeded outcomes.
            await page.evaluate('Portal.returnInternal()')
            extra = await page.evaluate('''()=>[
              Portal.partnerSetup.saveProfile({name:'Fiktiv blandad auditpartner',partnerType:'sales',salesAudiences:['business','consumer']}),
              Portal.partnerSetup.saveProfile({name:'Fiktiv fastighetsauditpartner',partnerType:'property'}),
              Portal.partnerSetup.saveProfile({name:'Fiktiv personalauditpartner',partnerType:'employee'})
            ]''')
            check('tre nya samarbetstyper sparas lokalt', all(row['ok'] for row in extra))
            for partner in ['syd', 'vast', 'estate1', 'estate2'] + [row['id'] for row in extra]:
                await page.evaluate('(id)=>Portal.previewPartner(id)', partner)
                routes = await page.locator('#nav [data-go]').evaluate_all('(nodes)=>nodes.map(node=>node.dataset.go)')
                for route in routes:
                    await page.locator('#nav [data-go="' + route + '"]').click()
                    check('partnerns meny behåller partner och vy: ' + partner + '/' + route, await page.evaluate('({partner,route})=>Portal.role==="partner" && Portal.partner===partner && Portal.page===route && new URL(location.href).searchParams.get("workspace")===partner && document.querySelector("#view h1")!==null', {'partner': partner, 'route': route}))
                await page.locator('#return-internal').click()
                check('återgång från partner återställer intern översikt: ' + partner, await page.evaluate('Portal.role==="internal" && Portal.page==="overview" && !new URL(location.href).searchParams.has("workspace")'))

            # Three initially visible rows, followed by three newly revealed rows.
            # The last Show more button disappears at this point.
            await loaded('?workspace=estate1#overview')
            await page.evaluate('''()=>{
              Portal.state.moveins=Array.from({length:6},(_,index)=>({id:'audit-focus-'+index,partner:'estate1',name:'Fiktiv inflyttare '+index,handoverStatus:'draft',next:'Granska fiktivt underlag',events:[]}));
              Portal.render();window.qaBeforeWorkbench=JSON.stringify(Portal.state);
            }''')
            panel = page.locator('.workbench')
            check('arbetsytan visar tre ärenden före utveckling', await panel.locator('.workbench-row').count() == 3 and await panel.locator('[data-workbench-more]').count() == 1)
            await panel.locator('[data-workbench-more]').focus()
            await page.keyboard.press('Enter')
            observed = await focus()
            check('sista Visa fler visar alla ärenden utan att tappa tangentbordsfokus', await panel.locator('.workbench-row').count() == 6 and await page.evaluate('document.activeElement.matches(".workbench-row:nth-child(4) .workbench-open")'), observed)
            check('Visa fler lämnar ärenden, historik och ekonomi oförändrade', await page.evaluate('JSON.stringify(Portal.state)===qaBeforeWorkbench'))
            await page.keyboard.press('Tab')
            check('nästa Tab går vidare i de nyvisade ärendena', await page.evaluate('document.activeElement.matches(".workbench-row:nth-child(5) .workbench-open")'), await focus())
            await panel.locator('[data-workbench-filter="others"]').focus()
            await page.keyboard.press('Enter')
            check('tomt arbetsytefilter behåller fokus på valt filter', await page.evaluate('document.activeElement.dataset.workbenchFilter==="others"') and await panel.locator('.workbench-row').count() == 0)
            await panel.locator('[data-workbench-filter="all"]').click()
            check('återgång från tomt filter återställer underlaget', await panel.locator('.workbench-row').count() == 3 and await page.evaluate('JSON.stringify(Portal.state)===qaBeforeWorkbench'))

            # Reset must leave a useful focus target after replacing the settings
            # DOM. All data here is fictional and this context is isolated.
            await page.evaluate('Portal.returnInternal();Portal.go("settings")')
            accept_reset = lambda dialog: dialog.accept()
            page.on('dialog', accept_reset)
            await page.locator('#reset-demo').focus()
            await page.keyboard.press('Enter')
            await page.wait_for_function('!Portal.partnerRegistry.some(row=>row.name==="Fiktiv blandad auditpartner")')
            observed = await focus()
            check('återställning av exempeldata ger den nya innehållsvyn fokus', await page.evaluate('Portal.page==="settings" && document.activeElement.id==="view"'), observed)
            check('återställning lämnar en fungerande meny och profilväljare', await page.locator('#nav [data-go="partners"]').count() == 1 and await page.locator('#partner option').count() == 4)
            await page.keyboard.press('Tab')
            check('Tab efter återställning börjar bland sidans åtgärder', await page.evaluate('document.activeElement.id==="reset-demo"'), await focus())

            # Cancel must retain the form and its focus, without a destructive
            # side effect. The page dialog listener above is removed first.
            page.remove_listener('dialog', accept_reset)
            page.on('dialog', lambda dialog: dialog.dismiss())
            await page.evaluate('window.qaBeforeCancelledReset=JSON.stringify(Portal.state)')
            await page.locator('#reset-demo').focus()
            await page.keyboard.press('Enter')
            check('avbruten återställning behåller data och knappfokus', await page.evaluate('JSON.stringify(Portal.state)===qaBeforeCancelledReset && document.activeElement.id==="reset-demo"'))
            check('inga scriptfel i portalgranskningen', not errors, errors)
        finally:
            OUT.mkdir(parents=True, exist_ok=True)
            OUT.joinpath('audit3-navigation.json').write_text(json.dumps({'checks': checks, 'passed': sum(row['passed'] for row in checks), 'total': len(checks), 'errors': errors}, ensure_ascii=False, indent=2))
            await browser.close()
    failed = [row['label'] for row in checks if not row['passed']]
    print(f'{len(checks)-len(failed)}/{len(checks)} checks passed', flush=True)
    if failed:
        raise AssertionError('; '.join(failed))


if __name__ == '__main__':
    asyncio.run(main())
