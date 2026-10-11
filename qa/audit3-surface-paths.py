"""Independent click-path and visual samples for the complete static portal.

Only isolated fictional browser data is used. No service, contract or financial
record is created, and external destinations are not clicked.
"""
import asyncio
import json
import os
import pathlib
import shutil

from playwright.async_api import async_playwright

BASE = os.environ.get('PARTNERLABB_QA_URL', 'http://127.0.0.1:8014/').rstrip('/') + '/'
OUT = pathlib.Path('/workspace/portal-audit3/surface')


async def main():
    checks, errors, snapshots = [], [], []
    OUT.mkdir(parents=True, exist_ok=True)

    def check(label, passed, observed=None):
        checks.append({'label': label, 'passed': bool(passed), 'observed': observed})
        print(('PASS ' if passed else 'FAIL ') + label, flush=True)

    async with async_playwright() as p:
        browser = await p.chromium.launch(executable_path=shutil.which('chromium'), headless=True, args=['--no-sandbox'])
        context = await browser.new_context(viewport={'width': 1440, 'height': 1000}, locale='sv-SE', accept_downloads=True)
        page = await context.new_page()
        page.set_default_timeout(8000)
        page.on('pageerror', lambda error: errors.append(str(error)))

        async def shot(name):
            await page.evaluate('window.scrollTo(0,0)')
            await page.screenshot(path=str(OUT / (name + '.png')), full_page=True)
            observed = await page.evaluate('''()=>({page:Portal?.page,width:innerWidth,scrollWidth:document.documentElement.scrollWidth,
                blocked:[...document.querySelectorAll(document.querySelector('#portal-dialog[open]')?'#portal-dialog[open] button,#portal-dialog[open] select,#portal-dialog[open] input':'#view button,#view select,#view input')].filter(n=>{
                    const r=n.getBoundingClientRect();if(!r.width||!r.height||r.top<0||r.bottom>innerHeight||r.left<0||r.right>innerWidth)return false;
                    const node=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);
                    return node&&!n.contains(node)&&!node.contains(n)&&!(n.type==='file'&&node.closest('label'));
                }).map(n=>({id:n.id,label:n.textContent.trim(),type:n.type}))})''')
            snapshots.append({'name': name, **observed})
            check(name + ': innehållet håller skärmens bredd', observed['scrollWidth'] <= observed['width'] + 1, observed)
            check(name + ': synliga kontroller täcks inte av andra element', not observed['blocked'], observed['blocked'])

        async def nav(route):
            if await page.evaluate('innerWidth<=850') and not await page.locator('#sidebar').evaluate("n=>n.classList.contains('open')"):
                await page.locator('#menu-toggle').click()
            await page.locator('#nav [data-go="' + route + '"]').click()
            check('menyklick öppnar ' + route, await page.evaluate('(route)=>Portal.page===route', route))

        try:
            for width in [1440, 390, 320]:
                await page.set_viewport_size({'width': width, 'height': 1000 if width == 1440 else 844})
                await page.goto(BASE, wait_until='networkidle')
                await page.wait_for_function('Portal.partnerSetup && Portal.propertyIntake')
                baseline = await page.evaluate('JSON.stringify({records:Portal.state.records,offers:Portal.state.offers,moveins:Portal.state.moveins})')
                await shot(f'{width}-internal-overview')
                await nav('partners')
                for partner in ['syd', 'vast']:
                    await page.locator('[data-commercial-partner="' + partner + '"]').first.click()
                    check(f'{width}: partnerlistan öppnar rätt partners resultat {partner}', await page.evaluate('(id)=>Portal.role==="internal"&&Portal.page==="partner-sales"&&Portal.selectedPartnerId===id', partner))
                    await page.locator('.sr-partner-tabs [data-go="partner-detail"]').click()
                    check(f'{width}: intern partnerprofil behåller {partner}', await page.evaluate('(id)=>Portal.role==="internal"&&Portal.page==="partner-detail"&&Portal.selectedPartnerId===id', partner))
                    await page.locator('#view [data-go="partner-sales"]').first.click()
                    await page.locator('[data-sr-mode="month"]').click()
                    products = await page.locator('#sr-product option').evaluate_all('(nodes)=>nodes.map(n=>n.value)')
                    await page.locator('#sr-product').select_option(products[1])
                    await shot(f'{width}-{partner}-sales-filter')
                    await page.locator('.sr-partner-tabs [data-go="partner-insights"]').click()
                    check(f'{width}: Insikter behåller produkt och vald partner {partner}', await page.evaluate('(id)=>Portal.selectedPartnerId===id&&Portal.page==="partner-insights"', partner) and await page.locator('#sr-product').input_value() == products[1])
                    await shot(f'{width}-{partner}-insights-filter')
                    await page.locator('.sr-partner-tabs [data-go="partner-detail"]').click()
                    await page.locator('[data-commercial-preview="' + partner + '"]').first.click()
                    check(f'{width}: partnerarbetsytan har rätt roll och partner {partner}', await page.evaluate('(id)=>Portal.role==="partner"&&Portal.partner===id', partner))
                    await page.locator('#view [data-go="partner-sales"]').first.click()
                    check(f'{width}: partnerns resultat håller egen avgränsning {partner}', await page.evaluate('(id)=>Portal.partner===id&&Portal.role==="partner"&&Portal.page==="partner-sales"', partner))
                    await page.locator('.sr-partner-tabs [data-go="academy"]').click()
                    await shot(f'{width}-{partner}-academy')
                    await page.locator('[data-ac-course]').first.click()
                    check(f'{width}: utbildningsdialog har fokus {partner}', await page.evaluate('document.querySelector("#portal-dialog").open&&document.querySelector("#portal-dialog").contains(document.activeElement)'))
                    await shot(f'{width}-{partner}-course-dialog')
                    await page.keyboard.press('Escape')
                    check(f'{width}: Escape stänger utbildning och återför fokus {partner}', await page.evaluate('!document.querySelector("#portal-dialog").open&&document.activeElement.matches("[data-ac-course]")'))
                    await page.locator('#return-internal').click()
                    check(f'{width}: återgång till intern översikt {partner}', await page.evaluate('Portal.role==="internal"&&Portal.page==="overview"'))
                    await nav('partners')

                await page.locator('[data-commercial-partner="estate1"]').first.click()
                await page.locator('#view [data-go="property-partnership"]').first.click()
                await shot(f'{width}-property-partnership')
                await page.locator('[data-pp-intake="import"]').click()
                check(f'{width}: samarbetsförslag öppnar rätt partners Excel', await page.evaluate('Portal.role==="partner"&&Portal.partner==="estate1"&&Portal.page==="property-import"'))
                async with page.expect_download() as pending:
                    await page.locator('#pi-template').click()
                template = await pending.value
                await page.locator('#pi-excel-file').set_input_files({'name': template.suggested_filename, 'mimeType': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'buffer': pathlib.Path(await template.path()).read_bytes()})
                await page.wait_for_selector('.pi-import-rows')
                await shot(f'{width}-property-import-preview')
                await page.locator('[data-pi-back]').click()
                await page.locator('[data-pi-mode="manual"]').click()
                await page.locator('#pi-fill-example').click()
                await shot(f'{width}-property-manual-example')
                await page.locator('[data-pi-back]').click()
                await page.locator('[data-pi-back]').click()
                check(f'{width}: tillbaka från båda registreringsvalen leder till inflyttningsservice', await page.evaluate('Portal.page==="overview"&&Portal.partner==="estate1"&&Portal.role==="partner"'))
                await nav('property-results')
                await page.locator('[data-property-results-mode="year"]').click()
                await shot(f'{width}-property-results')
                period_labels = await page.locator('[data-property-results-mode]').evaluate_all('''nodes=>nodes.map(n=>{
                    const range=document.createRange();range.selectNodeContents(n);
                    return {label:n.textContent.trim(),lines:[...range.getClientRects()].length,width:n.getBoundingClientRect().width};
                })''')
                check(f'{width}: periodval År/Månad är läsbart på en rad', all(item['lines'] == 1 for item in period_labels), period_labels)
                await page.locator('[data-property-results-mode="month"]').click()
                await shot(f'{width}-property-results-month')
                period_labels = await page.locator('[data-property-results-mode]').evaluate_all('''nodes=>nodes.map(n=>{
                    const range=document.createRange();range.selectNodeContents(n);
                    return {label:n.textContent.trim(),lines:[...range.getClientRects()].length,width:n.getBoundingClientRect().width};
                })''')
                check(f'{width}: Månad/År förblir läsbart med månadsfilter', all(item['lines'] == 1 for item in period_labels), period_labels)
                await page.locator('#return-internal').click()
                check(f'{width}: navigering, filgranskning och utbildning skapade inga affärsunderlag', await page.evaluate('JSON.stringify({records:Portal.state.records,offers:Portal.state.offers,moveins:Portal.state.moveins})') == baseline)

            check('inga nya JavaScript-fel i samtliga klickvägar', not errors, errors)
        finally:
            (OUT / 'audit3-surface-paths.json').write_text(json.dumps({'checks': checks, 'errors': errors, 'snapshots': snapshots}, ensure_ascii=False, indent=2))
            await browser.close()
    failed = [row for row in checks if not row['passed']]
    print(json.dumps({'checks': len(checks), 'passed': len(checks)-len(failed), 'failed': failed, 'errors': errors}, ensure_ascii=False), flush=True)
    if failed:
        raise SystemExit(1)


if __name__ == '__main__':
    asyncio.run(main())
