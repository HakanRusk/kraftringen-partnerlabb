"""Fictional local accounts: login, visibility, groups and admin at three widths."""
import asyncio
import os
from pathlib import Path
from playwright.async_api import async_playwright, expect

BASE = os.environ.get('PARTNERLABB_QA_URL', 'http://127.0.0.1:8000/')
OUT = Path(os.environ.get('PARTNERLABB_QA_SHOTS', '/tmp/partnerlabb-shots'))

async def main():
    OUT.mkdir(parents=True, exist_ok=True)
    async with async_playwright() as pw:
        browser = await pw.chromium.launch()
        for width in (1440, 390, 320):
            context = await browser.new_context(viewport={'width': width, 'height': 900})
            page = await context.new_page()
            errors = []
            page.on('pageerror', lambda error: errors.append(str(error)))
            try:
                await page.goto(BASE)
                await expect(page.locator('[data-pu-login]')).to_have_count(10)
                await page.locator('[data-pu-login="demo-vast-seller-1"]').click()
                await expect(page.locator('#profile-role')).to_have_text('Partner · säljare')
                await expect(page.locator('#role')).to_be_hidden()
                await expect(page.locator('#nav [data-go="order-commission"]')).to_be_hidden()
                await page.locator('[data-pu-period="day"]').fill('2026-10-15')
                await expect(page.locator('.pu-total')).to_have_text('6')
                await page.locator('[data-ow-filter="month"]').select_option('10')
                await expect(page.locator('.pu-order-owner')).to_have_count(4)
                assert all('Charlie Exempel' in text for text in await page.locator('.pu-order-owner').all_text_contents())
                for mode in ('day', 'week', 'month', 'year'):
                    await page.locator('[data-pu-period="mode"]').select_option(mode)
                    assert await page.evaluate('document.documentElement.scrollWidth <= innerWidth'), (width, mode)
                await page.goto(BASE + '?workspace=syd#order-commission')
                await expect(page.locator('.ow-head')).to_contain_text('Face2face')
                await expect(page.locator('.oc-total')).to_have_count(0)
                await page.locator('#pu-account').click()
                await page.locator('[data-pu-login="demo-vast-manager"]').click()
                await page.locator('[data-pu-period="day"]').fill('2026-10-15')
                await page.locator('[data-pu-seller="demo-vast-seller-1"]').check()
                await page.locator('[data-pu-seller="demo-vast-seller-2"]').check()
                await expect(page.locator('.pu-total')).to_have_text('11')
                await expect(page.locator('[data-pu-seller="demo-vast-seller-2"]')).to_be_focused()
                await page.locator('.ow-tabs [data-go="order-commission"]').click()
                await expect(page.locator('.oc-total')).to_be_visible()
                await page.locator('#pu-account').click()
                await page.locator('[data-pu-login="demo-admin"]').click()
                await page.evaluate("Portal.go('user-admin')")
                await page.locator('[data-pu-new]').click()
                await page.locator('#pu-user-form [name="name"]').fill('Fiktiv Rolltest')
                await page.locator('#pu-user-form [name="email"]').fill('rolltest@partner.example')
                await page.locator('#pu-user-form [name="partner"]').select_option('vast')
                for field in await page.locator('#pu-user-form input,#pu-user-form select').all():
                    if await field.is_visible():
                        box = await field.bounding_box()
                        assert box and box['x'] >= 0 and box['x'] + box['width'] <= width + 1, (width, box)
                await page.get_by_role('button', name='Spara lokalt', exact=True).click()
                await expect(page.locator('#view')).to_contain_text('rolltest@partner.example')
                await page.reload()
                await expect(page.locator('#view')).to_contain_text('rolltest@partner.example')
                assert await page.evaluate('document.documentElement.scrollWidth <= innerWidth'), width
                await page.screenshot(path=str(OUT / f'report-user-roles-{width}.png'), full_page=True)
                assert not errors, errors
            finally:
                await context.close()
        await browser.close()

asyncio.run(main())
