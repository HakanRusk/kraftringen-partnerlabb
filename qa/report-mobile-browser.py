"""Report-filter regression and layout evidence, using fictional fixtures only.

Geometry is evidence for MOBILE-01, not a claim of real-user usability.
No arbitrary above-the-fold threshold: record where the first result begins.
"""
import asyncio
import json
import os
from pathlib import Path
from playwright.async_api import async_playwright, expect

BASE = os.environ.get('PARTNERLABB_QA_URL', 'http://127.0.0.1:8000/')
OUT = Path(os.environ.get('PARTNERLABB_QA_SHOTS', '/tmp/partnerlabb-report-shots'))


async def within_page(page, width):
    assert await page.evaluate('document.documentElement.scrollWidth') <= width + 1
    for selector in ('.sr-filter-bar', '.sr-selection', '#sr-product', '.sr-more-filters > summary'):
        if not await page.locator(selector).is_visible():
            continue
        box = await page.locator(selector).bounding_box()
        assert box and box['x'] >= 0 and box['x'] + box['width'] <= width + 1, (selector, box)


async def main():
    OUT.mkdir(parents=True, exist_ok=True)
    evidence = []
    async with async_playwright() as pw:
        browser = await pw.chromium.launch()
        for width in (1440, 390, 320):
            context = await browser.new_context(viewport={'width': width, 'height': 900}, locale='sv-SE')
            page = await context.new_page()
            errors = []
            page.on('pageerror', lambda error: errors.append(str(error)))
            page.set_default_timeout(10000)
            try:
                await page.goto(BASE)
                await page.wait_for_function('window.Portal && Portal.partnerSalesReports')
                # The fresh overview lazily initializes example management data.
                # Persist that fictional fixture before testing reload, otherwise
                # reload legitimately reads a new seed rather than this baseline.
                before = await page.evaluate('''() => {
                    if (!Portal.save()) throw new Error('Could not prepare saved QA fixture');
                    return JSON.parse(JSON.stringify(Portal.state));
                }''')
                stored_before = await page.evaluate('localStorage.getItem("partnerlabb.portal.v2")')
                for partner in ('syd', 'vast'):
                    await page.evaluate('''id => {
                        Portal.returnInternal(); Portal.selectedPartnerId=id;
                        Portal.go('partner-sales'); Portal.partnerSalesReports.reset();
                    }''', partner)
                    for route in ('partner-sales', 'partner-insights'):
                        await page.evaluate('route => Portal.go(route)', route)
                        await page.evaluate('Portal.partnerSalesReports.reset()')
                        if width <= 600:
                            toggle = page.locator('#sr-filter-toggle')
                            if await toggle.get_attribute('aria-expanded') == 'true':
                                await toggle.click()
                            await expect(page.locator('#sr-product')).not_to_be_visible()
                        await page.evaluate('window.scrollTo(0,0)')
                        await within_page(page, width)
                        first = '.sr-metrics' if route == 'partner-sales' else '.sr-tenure'
                        evidence.append({'width': width, 'partner': partner, 'route': route,
                            **await page.evaluate('''selector => ({
                                filterHeight: Math.round(document.querySelector('.sr-filter-bar').getBoundingClientRect().height),
                                firstResultTop: Math.round(document.querySelector(selector).getBoundingClientRect().top + scrollY)
                            })''', first)})
                        await page.screenshot(path=str(OUT / f'report-{partner}-{route}-{width}.png'), full_page=True)
                        if width <= 600:
                            # Relative to the recorded baseline, not an assumed usability threshold.
                            assert evidence[-1]['filterHeight'] < 410 - 250
                            await toggle.focus()
                            await page.keyboard.press('Enter')
                            await expect(toggle).to_be_focused()
                            await expect(toggle).to_have_attribute('aria-expanded', 'true')
                            await expect(page.locator('#sr-product')).to_be_visible()
                            await within_page(page, width)
                        else:
                            await expect(page.locator('#sr-filter-toggle')).not_to_be_visible()
                            await expect(page.locator('#sr-product')).to_be_visible()
                        summary = page.locator('.sr-more-filters > summary')
                        await summary.focus()
                        await page.keyboard.press('Enter')
                        await expect(page.locator('#sr-seller')).to_be_visible()
                        await page.keyboard.press('Tab')
                        await expect(page.locator('#sr-seller')).to_be_focused()
                        seller = await page.locator('#sr-seller option').nth(1).get_attribute('value')
                        await page.locator('#sr-seller').select_option(seller)
                        await expect(page.locator('#sr-seller')).to_be_focused()
                        await expect(page.locator('.sr-selection')).to_contain_text(seller)
                        # Collapsing the controls must not hide the active selection.
                        await summary.focus()
                        await page.keyboard.press('Space')
                        await expect(page.locator('#sr-seller')).not_to_be_visible()
                        await expect(page.locator('.sr-selection')).to_contain_text(seller)
                        if width <= 600:
                            await toggle.focus()
                            await page.keyboard.press('Space')
                            await expect(toggle).to_be_focused()
                            await expect(toggle).to_have_attribute('aria-expanded', 'false')
                            await expect(page.locator('.sr-selection')).to_contain_text(seller)
                            await expect(page.locator('#sr-product')).not_to_be_visible()
                        await page.reload()
                        if width <= 600:
                            await expect(page.locator('#sr-filter-toggle')).to_have_attribute('aria-expanded', 'false')
                            await expect(page.locator('.sr-selection')).to_contain_text(seller)
                            # Desktop must expose controls even after a mobile collapse.
                            await page.set_viewport_size({'width': 1440, 'height': 900})
                            await expect(page.locator('#sr-product')).to_be_visible()
                            await page.set_viewport_size({'width': width, 'height': 900})
                            await page.locator('#sr-filter-toggle').click()
                        await expect(page.locator('#sr-seller')).to_have_value(seller)
                        await expect(page.locator('.sr-selection')).to_contain_text(seller)
                        await within_page(page, width)
                        await page.locator('#sr-reset').click()
                        await expect(page.locator('#sr-product')).to_be_focused()
                        await expect(page.locator('#sr-reset')).to_be_disabled()
                        assert await page.evaluate('Portal.partnerSalesReports.filters().seller') == 'all'
                        for mode in ('month', 'week', 'year'):
                            await page.locator(f'[data-sr-mode={mode}]').focus()
                            await page.keyboard.press('Enter')
                            await expect(page.locator(f'[data-sr-mode={mode}]')).to_be_focused()
                            await expect(page.locator(f'[data-sr-mode={mode}]')).to_have_attribute('aria-pressed', 'true')
                        print(f'PASS report filters {partner} {route} {width}px', flush=True)
                after = await page.evaluate('JSON.parse(JSON.stringify(Portal.state))')
                changed = [key for key in before.keys() | after.keys() if before.get(key) != after.get(key)]
                assert not changed, ('Report navigation changed domain data', changed)
                assert await page.evaluate('localStorage.getItem("partnerlabb.portal.v2")') == stored_before, 'Report navigation wrote domain storage'
                assert not errors, errors
            except Exception:
                await page.screenshot(path=str(OUT / f'report-failure-{width}.png'), full_page=True)
                raise
            finally:
                (OUT / 'report-layout.json').write_text(json.dumps(evidence, indent=2), encoding='utf-8')
                await context.close()
        await browser.close()
    print('REPORT_LAYOUT ' + json.dumps(evidence), flush=True)


asyncio.run(main())
