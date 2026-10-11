"""Broad real-browser regression for active portal surfaces and recovered exports.

Uses isolated fictional browser data, installed Chromium, and the coordinator's
static preview. No remote media rendering or external actions are performed.
"""
import asyncio
import copy
import json
import os
import pathlib
import shutil
import sys
import tempfile
from urllib.parse import urlsplit

from playwright.async_api import async_playwright

BASE = os.environ.get('PARTNERLABB_QA_URL', 'http://127.0.0.1:8000/').rstrip('/') + '/'
OUT = pathlib.Path(os.environ.get('PARTNERLABB_QA_SHOTS', tempfile.mkdtemp(prefix='partnerlabb-surface-qa-')))
AUTH_TOKEN = None
if '--auth-stdin' in sys.argv:
    # Hosted QA credentials stay in memory and never enter argv, files or logs.
    terminal = None
    if sys.stdin.isatty():
        import termios
        terminal = termios.tcgetattr(sys.stdin.fileno())
        hidden = copy.deepcopy(terminal)
        hidden[3] &= ~(termios.ECHO | termios.ICANON)
        termios.tcsetattr(sys.stdin.fileno(), termios.TCSANOW, hidden)
    print('Ready for hidden hosted QA payload.', flush=True)
    try:
        runtime = json.loads(sys.stdin.readline())
    finally:
        if terminal is not None:
            termios.tcsetattr(sys.stdin.fileno(), termios.TCSANOW, terminal)
    BASE = str(runtime.get('base', BASE)).rstrip('/') + '/'
    AUTH_TOKEN = runtime.get('token')
    if not runtime.get('hosted') or not isinstance(AUTH_TOKEN, str) or not AUTH_TOKEN:
        raise SystemExit('Hosted QA requires a valid hidden credential payload.')
    del runtime
ORIGIN = (urlsplit(BASE).scheme, urlsplit(BASE).netloc)


def own_origin(url):
    parsed = urlsplit(url)
    return (parsed.scheme, parsed.netloc) == ORIGIN


async def authenticate_context(context):
    if not AUTH_TOKEN:
        return

    async def scoped_headers(route):
        headers = {key: value for key, value in route.request.headers.items() if key.lower() != 'oai-sites-authorization'}
        if own_origin(route.request.url):
            headers['OAI-Sites-Authorization'] = 'Bearer ' + AUTH_TOKEN
        await route.continue_(headers=headers)

    await context.route('**/*', scoped_headers)


SCAN = """()=>({
  page:Portal.page,role:Portal.role,partner:Portal.partner,selected:Portal.selectedPartnerId,
  h1:[...document.querySelectorAll('h1')].map(n=>n.textContent),
  width:{client:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth},
  empty:document.querySelector('#view').textContent.trim().length<25,
  duplicates:[...document.querySelectorAll('[id]')].map(n=>n.id).filter((id,i,a)=>a.indexOf(id)!==i),
  unlabelled:[...document.querySelectorAll('input,select,textarea')].filter(n=>
    n.getBoundingClientRect().width>0&&n.type!=='hidden'&&!n.labels?.length&&
    !n.getAttribute('aria-label')&&!n.getAttribute('aria-labelledby')
  ).map(n=>({id:n.id,name:n.name,type:n.type})),
  links:[...document.querySelectorAll('a[href]')].map(n=>({href:n.href,label:n.textContent.trim()}))
})"""


async def main():
    OUT.mkdir(parents=True, exist_ok=True)
    checks, views, errors, bad, links = [], [], [], [], []

    def good(label, value):
        if not value:
            raise AssertionError(label)
        checks.append(label)

    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(executable_path=shutil.which('chromium'), headless=True, args=['--no-sandbox'])
        context = await browser.new_context(viewport={'width': 1440, 'height': 1000}, locale='sv-SE', accept_downloads=True)
        await authenticate_context(context)
        page = await context.new_page()
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.on('response', lambda response: bad.append({'status': response.status, 'url': response.url}) if response.status >= 400 else None)
        await page.goto(BASE, wait_until='networkidle')
        await page.wait_for_function('Portal.partnerSetup && Portal.propertyIntake && Portal.partnerSalesData')
        seed = await page.evaluate('JSON.parse(JSON.stringify(Portal.state))')
        result = await page.evaluate("""()=>[
          Portal.partnerSetup.saveProfile({name:'QA Surface Personalbolag',partnerType:'employee'}),
          Portal.partnerSetup.saveProfile({name:'QA Surface Blandad försäljning',partnerType:'sales',salesAudiences:['business','consumer']})
        ]""")
        good('fiktiva personal- och blandade säljpartners skapas utan verkliga åtgärder', all(item['ok'] for item in result))
        partners = await page.evaluate('Portal.partnerRegistry.map(p=>({id:p.id,type:p.type}))')

        async def inspect(requested, width):
            await page.evaluate('(id)=>Portal.go(id)', requested)
            result = await page.evaluate(SCAN)
            result.update(widthTest=width, requested=requested)
            views.append(result)
            label = f"{width}px {result['role']} {result.get('selected') or result['partner']} {requested}"
            good(label + ': aktiv sida har en rubrik och innehåll', len(result['h1']) == 1 and not result['empty'])
            good(label + ': ingen dokumentöverbredd', result['width']['scroll'] <= width + 1)
            good(label + ': unika id och etiketter för synliga formulärfält', not result['duplicates'] and not result['unlabelled'])

        for width in [1440, 390, 320]:
            await page.set_viewport_size({'width': width, 'height': 900})
            for partner in [None] + [item['id'] for item in partners]:
                if partner:
                    await page.evaluate('(id)=>Portal.previewPartner(id)', partner)
                else:
                    await page.evaluate('Portal.returnInternal()')
                nav = await page.locator('#nav [data-go]').evaluate_all('(nodes)=>nodes.map(n=>n.dataset.go)')
                for route in nav + ['support', 'settings']:
                    await inspect(route, width)
            await page.evaluate('Portal.returnInternal()')
            for partner in partners:
                routes = ['partner-detail', 'journey']
                if partner['type'] in ['sales', 'field']:
                    routes += ['partner-sales', 'partner-insights']
                if partner['type'] == 'property':
                    routes += ['property-results', 'property-partnership']
                if partner['type'] == 'employee':
                    routes += ['employee-channel']
                for route in routes:
                    await page.evaluate('(id)=>Portal.selectedPartnerId=id', partner['id'])
                    await inspect(route, width)

        # Legal unbroken names previously widened headers to nearly 2,000px on
        # a 320px screen, and the Academy grid inherited a wide progress panel.
        long_partners = await page.evaluate("""()=>['sales','property','employee'].map((type,index)=>{
          const name=['Q','P','E'][index].repeat(90);
          const result=Portal.partnerSetup.saveProfile({name,partnerType:type,salesAudiences:type==='sales'?['business','consumer']:[]});
          return {ok:result.ok,type,id:Portal.partnerRegistry.find(p=>p.name===name)?.id};
        })""")
        good('partnernamn med 90 sammanhängande tecken accepteras', all(item['ok'] and item.get('id') for item in long_partners))
        for width in [1440, 390, 320]:
            await page.set_viewport_size({'width': width, 'height': 900})
            for partner in long_partners:
                await page.evaluate('Portal.returnInternal()')
                await page.evaluate('(id)=>Portal.selectedPartnerId=id', partner['id'])
                await inspect('employee-channel' if partner['type'] == 'employee' else 'partner-detail', width)
                await page.evaluate('(id)=>Portal.previewPartner(id)', partner['id'])
                if partner['type'] == 'sales':
                    routes = ['overview', 'partner-sales', 'partner-insights', 'academy', 'support']
                elif partner['type'] == 'property':
                    routes = ['overview', 'property-partnership', 'property-results', 'property-default', 'property-intake', 'support']
                else:
                    routes = ['overview', 'support']
                for route in routes:
                    await inspect(route, width)

        local = sorted(set(link['href'].split('#')[0] for view in views for link in view['links'] if link['href'].startswith(BASE) and link['href'].split('#')[0] != BASE))
        for url in local:
            # Use the actual browser's network and trust configuration, also on
            # hosted Sites. The scoped context route supplies auth in memory.
            response = await page.evaluate("""async url => {
                // Sites canonicalizes .html URLs with an own-origin redirect.
                // Each redirected request passes through scoped_headers too.
                const result = await fetch(url, {credentials:'same-origin', redirect:'follow'});
                const status = result.status, ok = result.ok;
                if (result.body) await result.body.cancel();
                return {status, ok, url:result.url, redirected:result.redirected};
            }""", url)
            links.append({'url': url, 'status': response['status'], 'redirected': response['redirected']})
            good('lokal länkdestination svarar på portalens egen origin: ' + url, response['ok'] and own_origin(response['url']))

        # Keyboard navigation used to destroy focus; Escape left the menu open.
        await page.set_viewport_size({'width': 1440, 'height': 900})
        await page.evaluate('Portal.returnInternal()')
        await page.locator('#nav [data-go="partners"]').focus()
        await page.keyboard.press('Enter')
        good('tangentbordsnavigation fokuserar huvudytan', await page.evaluate('document.activeElement.id==="view"&&Portal.page==="partners"'))
        await page.set_viewport_size({'width': 390, 'height': 900})
        await page.locator('#menu-toggle').click()
        await page.keyboard.press('Escape')
        good('Escape stänger mobilmenyn och återför fokus', await page.evaluate('!document.querySelector("#sidebar").classList.contains("open")&&document.querySelector("#menu-toggle").getAttribute("aria-expanded")==="false"&&document.activeElement.id==="menu-toggle"'))
        good('aktiv navigation och filer skapade inga browserfel', not errors and not bad)
        await context.close()

        # Old malformed modules must not prevent the available data being exported.
        recovered = []
        for name, patch in [('offers-object', {'offers': {}}), ('sites-object', {'sites': {}}), ('records-bad-event', {'records': [dict(seed['records'][0], events=[None])]}), ('records-mixed-validity', {'records': [seed['records'][0], None]}), ('support-mixed-validity', {'support': [None, {'id': 'qa', 'partner': 'syd', 'title': 'QA', 'message': 'QA', 'created': 'not-a-date', 'type': 'Portalfråga'}]})]:
            state = copy.deepcopy(seed)
            state.update(patch)
            state['qaSurfaceUnknownField'] = {'keep': 'independent-extension'}
            isolated = await browser.new_context(locale='sv-SE', accept_downloads=True)
            await authenticate_context(isolated)
            await isolated.add_init_script('localStorage.setItem("partnerlabb.portal.v2",' + json.dumps(json.dumps(state)) + ')')
            check_page = await isolated.new_page()
            isolated_errors = []
            check_page.on('pageerror', lambda error: isolated_errors.append(str(error)))
            await check_page.goto(BASE + '#settings', wait_until='networkidle')
            async with check_page.expect_download() as pending:
                await check_page.locator('#export-settings').click()
            download = await pending.value
            payload = json.loads(pathlib.Path(await download.path()).read_text())
            good(name + ': export av tillgängliga lokala testdata fungerar', payload['prototype'] and isinstance(payload['records'], list))
            good(name + ': okända datafält behålls', await check_page.evaluate('Portal.state.qaSurfaceUnknownField.keep==="independent-extension"'))
            if 'records' in patch:
                good(name + ': giltig äldre kunddialog bevaras', payload['records'][0]['company'] == seed['records'][0]['company'])
            if 'support' in patch:
                await check_page.evaluate('Portal.go("support")')
                good(name + ': tillgänglig support visas trots äldre fel', 'QA' in await check_page.locator('#view').inner_text())
            good(name + ': inga nya JavaScriptfel', not isolated_errors)
            recovered.append({'case': name, 'errors': isolated_errors})
            await isolated.close()
        await browser.close()

    summary = {'checks': len(checks), 'view_combinations': len(views), 'local_destinations': len(links), 'errors': errors, 'failed_responses': bad, 'recovered': recovered, 'views': views, 'links': links}
    OUT.joinpath('bug-surface-report.json').write_text(json.dumps(summary, ensure_ascii=False, indent=2))
    print(json.dumps({key: summary[key] for key in ['checks', 'view_combinations', 'local_destinations', 'errors', 'failed_responses']}, ensure_ascii=False))


if __name__ == '__main__':
    try:
        asyncio.run(main())
    except AssertionError as error:
        print('FAILED: ' + str(error), file=sys.stderr)
        raise SystemExit(1)
    except Exception as error:
        # Playwright's detailed API errors can include request headers.
        print('FAILED: ' + type(error).__name__, file=sys.stderr)
        raise SystemExit(1)
