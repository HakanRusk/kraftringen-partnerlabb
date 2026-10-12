"""Focused real Chromium checks for Partnerlabb's optional app installation.

Native prompt choices and standalone mode are explicitly synthetic. Manifest,
assets, navigation, layout, focus, and dismissal use the actual portal UI.
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


BASE = os.environ.get('PARTNERLABB_QA_URL', 'http://127.0.0.1:8015/').rstrip('/')
OUT = pathlib.Path(os.environ.get('PARTNERLABB_QA_OUTPUT', '/workspace/partnerapp-qa/browser'))
AUTH_TOKEN = None
if '--auth-stdin' in sys.argv:
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
    BASE = str(runtime.get('base', BASE)).rstrip('/')
    AUTH_TOKEN = runtime.get('token')
    if not runtime.get('hosted') or not isinstance(AUTH_TOKEN, str) or not AUTH_TOKEN:
        raise SystemExit('Hosted QA requires a valid hidden credential payload.')
    del runtime
ORIGIN = (urlsplit(BASE).scheme, urlsplit(BASE).netloc)
IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'
ANDROID = 'Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36'


async def authenticate_context(context):
    if not AUTH_TOKEN:
        return

    async def scoped_headers(route):
        headers = {key: value for key, value in route.request.headers.items() if key.lower() != 'oai-sites-authorization'}
        url = urlsplit(route.request.url)
        if (url.scheme, url.netloc) == ORIGIN:
            headers['OAI-Sites-Authorization'] = 'Bearer ' + AUTH_TOKEN
        await route.continue_(headers=headers)

    await context.route('**/*', scoped_headers)


async def main():
    OUT.mkdir(parents=True, exist_ok=True)
    checks, errors, observations = [], [], {}

    def check(label, passed, observed=None):
        checks.append({'label': label, 'passed': bool(passed), 'observed': observed})
        print(('PASS ' if passed else 'FAIL ') + label, flush=True)

    async with async_playwright() as p:
        browser = await p.chromium.launch(executable_path=shutil.which('chromium'), args=['--no-sandbox'])

        async def new_context(width, ua=None, standalone=False):
            kwargs = {'viewport': {'width': width, 'height': 1000}, 'locale': 'sv-SE'}
            if ua:
                kwargs['user_agent'] = ua
            context = await browser.new_context(**kwargs)
            await authenticate_context(context)
            if standalone:
                # Named simulation, rather than claiming an OS app installation.
                await context.add_init_script('''(() => {
                    const original = window.matchMedia.bind(window);
                    window.matchMedia = query => {
                        const result=original(query);
                        if(query.includes('display-mode'))Object.defineProperty(result,'matches',{value:true});
                        return result;
                    };
                })();''')
            page = await context.new_page()
            page.on('pageerror', lambda error: errors.append(str(error).replace(AUTH_TOKEN, '[redacted]') if AUTH_TOKEN else str(error)))
            page.set_default_timeout(10000)
            return context, page

        async def loaded(page, path=''):
            await page.goto(BASE + '/' + path, wait_until='networkidle')
            await page.wait_for_function('window.Portal?.propertyIntake && window.Portal?.partnerResults')

        async def snapshot(page):
            return await page.evaluate('JSON.stringify({state:Portal.state,storage:{...localStorage},role:Portal.role,partner:Portal.partner,page:Portal.page,url:location.href})')

        async def open_guide(page, width):
            if width < 900:
                await page.locator('#menu-toggle').click()
                await page.wait_for_function('document.querySelector("#sidebar").classList.contains("open")')
            await page.locator('#install-app').click()
            await page.wait_for_function('document.querySelector("#portal-dialog").open')

        try:
            for name, width, ua, expected in [
                ('desktop', 1440, None, ['Chrome eller Edge', 'Arkiv → Lägg till i Dock']),
                ('iphone-390', 390, IPHONE, ['Safari', 'Lägg till på hemskärmen', 'Öppna som webbapp']),
                ('iphone-320', 320, IPHONE, ['Safari', 'Lägg till på hemskärmen', 'Öppna som webbapp']),
                ('android-390', 390, ANDROID, ['Chrome', 'Installera app', 'Lägg till på startskärmen']),
            ]:
                context, page = await new_context(width, ua)
                await loaded(page)
                before = await snapshot(page)
                await page.screenshot(path=str(OUT / (name + '-start-viewport.png')))
                await open_guide(page, width)
                text = await page.locator('#dialog-body').inner_text()
                check(name + ': rätt plattformsinstruktion', all(word in text for word in expected))
                check(name + ': lokal data och inloggning förklaras', all(word in text for word in ['Internet', 'samma inloggning', 'separata i appen och webbläsaren']))
                check(name + ': ingen syntetisk installationsknapp visas utan prompt', await page.locator('#install-app-confirm').is_hidden())
                check(name + ': mobilmenyn är stängd bakom dialogen', not await page.locator('#sidebar').evaluate('(node)=>node.classList.contains("open")'))
                check(name + ': dialogen får tangentbordsfokus', await page.evaluate('document.querySelector("#portal-dialog").contains(document.activeElement)'))
                sizes = await page.evaluate('''() => {
                    const rect=document.querySelector('#portal-dialog').getBoundingClientRect();
                    return {left:rect.left,right:rect.right,width:rect.width,viewport:innerWidth,
                        scroll:document.documentElement.scrollWidth,guide:document.querySelector('#install-app-guide').scrollWidth,
                        body:document.querySelector('#dialog-body').clientWidth};
                }''')
                check(name + ': dialog och innehåll ryms utan sidledsscroll', sizes['left'] >= -1 and sizes['right'] <= width + 1 and sizes['scroll'] <= width and sizes['guide'] <= sizes['body'] + 1, sizes)
                await page.screenshot(path=str(OUT / (name + '-guide.png')), full_page=True)
                await page.screenshot(path=str(OUT / (name + '-guide-viewport.png')))
                await page.keyboard.press('Escape')
                check(name + ': Escape stänger dialogen', not await page.locator('#portal-dialog').evaluate('(node)=>node.open'))
                focus = await page.evaluate('({id:document.activeElement.id,visible:!!document.activeElement.getClientRects().length})')
                check(name + ': Escape återger ett synligt fokus', focus['visible'] and focus['id'] in ['install-app', 'menu-toggle'], focus)
                check(name + ': installationsguiden ändrar inte portaldata eller URL', before == await snapshot(page))
                if name == 'desktop':
                    cdp = await context.new_cdp_session(page)
                    manifest = await cdp.send('Page.getAppManifest')
                    observations['chromium_manifest'] = manifest
                    parsed = json.loads(manifest.get('data', '{}'))
                    check('Chromium läser rätt appmanifest utan tolkningsfel', parsed.get('name') == 'Kraftringen Partnerlabb' and not manifest.get('errors'), manifest.get('errors'))
                    check('manifestets start, omfattning och app-ID förblir samma portal', parsed.get('start_url') == './' and parsed.get('scope') == './' and parsed.get('id') == './' and parsed.get('display') == 'standalone')
                    try:
                        installability = await cdp.send('Page.getInstallabilityErrors')
                        observations['chromium_installability'] = installability
                        check('isolerad profil har endast förväntad inkognitobegränsning', all(item['errorId'] == 'in-incognito' for item in installability.get('installabilityErrors', [])), installability.get('installabilityErrors'))
                    except Exception as error:
                        observations['chromium_installability_api'] = type(error).__name__
                    for size in [180, 192, 512]:
                        # Browser fetch passes through the same own-origin route
                        # as the manifest; no request-client auth headers leak.
                        icon = await page.evaluate('''async url => {
                            const response=await fetch(url,{credentials:'include'});
                            const bytes=new Uint8Array(await response.arrayBuffer());
                            const data=new DataView(bytes.buffer);
                            return {status:response.status,png:String.fromCharCode(...bytes.slice(1,4)),width:data.getUint32(16),height:data.getUint32(20)};
                        }''', BASE + f'/assets/app-icon-{size}.png')
                        check(f'appikon {size} är faktisk hämtbar PNG', icon == {'status':200,'png':'PNG','width':size,'height':size}, icon)
                    check('appen registrerar ingen service worker eller ny offlinecache', await page.evaluate('(async()=>navigator.serviceWorker ? (await navigator.serviceWorker.getRegistrations()).length===0 : true)()'))
                await context.close()

            # A persistent profile is necessary for a real browser installability
            # check: Browser.new_context() intentionally uses incognito storage.
            with tempfile.TemporaryDirectory(prefix='partnerlabb-installability-') as profile:
                normal = await p.chromium.launch_persistent_context(profile, executable_path=shutil.which('chromium'), args=['--no-sandbox'], viewport={'width':1440,'height':1000})
                await authenticate_context(normal)
                normal_page = await normal.new_page()
                normal_page.on('pageerror', lambda error: errors.append(str(error).replace(AUTH_TOKEN, '[redacted]') if AUTH_TOKEN else str(error)))
                await loaded(normal_page)
                normal_cdp = await normal.new_cdp_session(normal_page)
                normal_errors = await normal_cdp.send('Page.getInstallabilityErrors')
                observations['persistent_profile_installability'] = normal_errors
                check('normal lokal Chromiumprofil har inga installationshinder', not normal_errors.get('installabilityErrors'), normal_errors.get('installabilityErrors'))
                await normal.close()

            # Synthetic native choices exercise the real browser DOM/controller.
            for outcome, error in [('accepted', False), ('dismissed', False), ('accepted', True)]:
                context, page = await new_context(390, ANDROID)
                await loaded(page)
                before = await snapshot(page)
                await page.evaluate('''({outcome,error}) => {
                    window.syntheticInstallCalls=0;
                    const event=new Event('beforeinstallprompt', {cancelable:true});
                    Object.defineProperties(event, {
                        prompt:{value:async()=>{window.syntheticInstallCalls++; if(error)throw Error('Synthetic unavailable');}},
                        userChoice:{value:Promise.resolve({outcome})}
                    });
                    window.dispatchEvent(event);
                }''', {'outcome': outcome, 'error': error})
                label = 'syntetisk prompt ' + ('error' if error else outcome)
                check(label + ': ingen prompt före användarens handling', await page.evaluate('syntheticInstallCalls===0'))
                await open_guide(page, 390)
                check(label + ': tillgänglig prompt ger en uttrycklig knapp', await page.locator('#install-app-confirm').is_visible())
                await page.locator('#install-app-confirm').click()
                expected = 'kunde inte öppnas' if error else 'sista steg' if outcome == 'accepted' else 'avbröts'
                await page.wait_for_function('(expected)=>document.querySelector("#install-app-status").textContent.includes(expected)', arg=expected)
                check(label + ': resultat återkopplas en gång', await page.evaluate('syntheticInstallCalls===1'))
                check(label + ': acceptans påstås inte vara slutförd installation', not await page.locator('#install-app').evaluate('(node)=>node.hidden'))
                check(label + ': inga portaldata skrivs', before == await snapshot(page))
                if not error and outcome == 'accepted':
                    await page.evaluate('window.dispatchEvent(new Event("appinstalled"))')
                    check('syntetisk appinstalled döljer installationsvalet', await page.locator('#install-app').evaluate('(node)=>node.hidden'))
                await context.close()

            # The old OS prompt may still be pending when another guide is opened.
            # A new prompt opportunity must become usable after the old one ends.
            context, page = await new_context(390, ANDROID)
            await loaded(page)
            before = await snapshot(page)
            await page.evaluate('''() => {
                window.syntheticOldCalls=0; window.syntheticNewCalls=0;
                const event=new Event('beforeinstallprompt',{cancelable:true});
                Object.defineProperties(event, {
                    prompt:{value:()=>{syntheticOldCalls++;return new Promise(resolve=>{window.syntheticRelease=resolve;});}},
                    userChoice:{value:Promise.resolve({outcome:'dismissed'})}
                });
                window.dispatchEvent(event);
            }''')
            await open_guide(page, 390)
            await page.locator('#install-app-confirm').click()
            await page.wait_for_function('window.syntheticOldCalls===1')
            check('syntetisk väntande prompt låser dubbelklick', await page.locator('#install-app-confirm').is_disabled())
            await page.keyboard.press('Escape')
            await page.evaluate('''() => {
                const event=new Event('beforeinstallprompt',{cancelable:true});
                Object.defineProperties(event, {
                    prompt:{value:async()=>{syntheticNewCalls++;}},
                    userChoice:{value:Promise.resolve({outcome:'dismissed'})}
                });
                window.dispatchEvent(event);
            }''')
            await open_guide(page, 390)
            check('syntetisk ny guide inväntar den gamla prompten', await page.locator('#install-app-confirm').is_visible() and await page.locator('#install-app-confirm').is_disabled())
            await page.evaluate('window.syntheticRelease()')
            await page.wait_for_function('!document.querySelector("#install-app-confirm").disabled')
            check('syntetisk sen avslutning låser upp aktuell guide', await page.locator('#install-app-confirm').is_visible() and await page.locator('#install-app-confirm').is_enabled())
            check('syntetisk gammal återkoppling lämnar nya guiden orörd', await page.locator('#install-app-status').inner_text() == '')
            await page.locator('#install-app-confirm').click()
            await page.wait_for_function('window.syntheticNewCalls===1')
            check('syntetisk ny prompt går att använda en gång', await page.evaluate('syntheticOldCalls===1&&syntheticNewCalls===1'))
            check('syntetisk guideersättning lämnar portaldata och URL orörda', before == await snapshot(page))
            await context.close()

            # Standalone simulation leaves actual partner navigation intact.
            for width in [1440, 390, 320]:
                context, page = await new_context(width, IPHONE if width < 900 else None, True)
                await loaded(page, '?workspace=estate1#overview')
                check(f'syntetiskt standalone {width}: installationsval dolt', await page.locator('#install-app').evaluate('(node)=>node.hidden'))
                check(f'syntetiskt standalone {width}: egen fastighetspartnersida bevarad', await page.evaluate('Portal.role==="partner" && Portal.partner==="estate1" && Portal.page==="overview"') and await page.locator('#view h1').count() == 1)
                if width < 900:
                    await page.locator('#menu-toggle').click()
                await page.locator('#nav [data-go="property-results"]').click()
                check(f'syntetiskt standalone {width}: faktisk resultatnavigation fungerar', await page.evaluate('Portal.role==="partner" && Portal.partner==="estate1" && Portal.page==="property-results" && new URL(location.href).searchParams.get("workspace")==="estate1"'))
                check(f'syntetiskt standalone {width}: ingen sidledsscroll', await page.evaluate('document.documentElement.scrollWidth<=innerWidth'))
                await page.screenshot(path=str(OUT / f'synthetic-standalone-{width}.png'), full_page=True)
                await page.screenshot(path=str(OUT / f'synthetic-standalone-{width}-viewport.png'))
                await context.close()
            check('inga scriptfel i fokuserad appkontroll', not errors, errors)
        finally:
            report = {'base': BASE, 'checks': checks, 'passed': sum(row['passed'] for row in checks), 'total': len(checks), 'errors': errors, 'observations': observations}
            (OUT / 'report.json').write_text(json.dumps(report, ensure_ascii=False, indent=2))
            await browser.close()
    failed = [row['label'] for row in checks if not row['passed']]
    print(f'{len(checks)-len(failed)}/{len(checks)} focused real-browser checks passed', flush=True)
    if failed:
        raise AssertionError('; '.join(failed))


if __name__ == '__main__':
    try:
        asyncio.run(main())
    except AssertionError as error:
        print(str(error), flush=True)
        raise SystemExit(1)
    except Exception as error:
        # A hosted Playwright call log might include request headers. Keep the
        # token out of diagnostics and rely on the recorded assertion report.
        if AUTH_TOKEN:
            print('Hosted focused QA failed: ' + type(error).__name__, flush=True)
            raise SystemExit(1)
        raise
