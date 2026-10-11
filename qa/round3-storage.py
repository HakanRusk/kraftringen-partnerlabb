"""Browser regression for calendar dates across user time zones."""
import asyncio
import json
import os
import pathlib
import shutil
import tempfile
from playwright.async_api import async_playwright

BASE = os.environ.get('PARTNERLABB_QA_URL', 'http://127.0.0.1:4193').rstrip('/')
OUT = pathlib.Path(os.environ.get('PARTNERLABB_QA_OUTPUT', tempfile.mkdtemp(prefix='partnerlabb-storage3-')))

async def main():
    checks, errors = [], []
    def check(name, result):
        assert result, name
        checks.append(name)
    async with async_playwright() as p:
        browser = await p.chromium.launch(executable_path=shutil.which('chromium'), args=['--no-sandbox'])
        for zone in ['Europe/Stockholm', 'America/Los_Angeles', 'Pacific/Honolulu']:
            context = await browser.new_context(locale='sv-SE', timezone_id=zone)
            page = await context.new_page()
            page.on('pageerror', lambda error: errors.append(str(error)))
            await page.goto(BASE + '/', wait_until='networkidle')
            await page.wait_for_function('!!window.Portal?.date')
            for value, expected in [('2026-10-12', '12 okt.'), ('2026-01-01', '1 jan.'), ('2024-02-29', '29 feb.')]:
                check(zone + ': calendar day ' + value, await page.evaluate('(value)=>Portal.date(value)', value) == expected)
            for value in ['2026-02-29', '2026-04-31']:
                check(zone + ': invalid calendar day ' + value, await page.evaluate('(value)=>Portal.date(value)', value) == 'Ej planerat')
            # Activity timestamps are instants; unlike calendar days, their
            # display must still reflect the reader's own local time zone.
            expected = '12 okt.' if zone == 'Europe/Stockholm' else '11 okt.'
            check(zone + ': activity retains local time', await page.evaluate('Portal.date("2026-10-12T00:30:00Z")') == expected)
            check(zone + ': historical malformed date is harmless', await page.evaluate('Portal.date({toString:null,valueOf:null})') == 'Ej planerat')
            await context.close()
        check('no JavaScript errors', not errors)
        await browser.close()
    OUT.mkdir(parents=True, exist_ok=True)
    OUT.joinpath('round3-storage.json').write_text(json.dumps({'checks':len(checks), 'passed':checks, 'errors':errors}, ensure_ascii=False, indent=2))
    print(json.dumps({'checks':len(checks), 'errors':errors}, ensure_ascii=False))

if __name__ == '__main__':
    asyncio.run(main())
