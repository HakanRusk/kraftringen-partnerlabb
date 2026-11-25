"""Fictional local accounts: login, visibility, groups and admin at three widths."""
import asyncio
import os
from pathlib import Path
from playwright.async_api import async_playwright, expect

BASE = os.environ.get('PARTNERLABB_QA_URL', 'http://127.0.0.1:8000/')
OUT = Path(os.environ.get('PARTNERLABB_QA_SHOTS', '/tmp/partnerlabb-shots'))

async def choose_period(page, key, value, end=None):
    picker=page.locator(f'[data-period-picker="{key}"]')
    if await picker.get_attribute('open') is None:
        await picker.locator('summary').click()
    async def show(v):
        year=page.locator(f'[data-period-year="{key}"]')
        if await year.count(): await year.select_option(v[:4])
        month=page.locator(f'[data-period-month="{key}"]')
        if await month.count(): await month.select_option(v[5:7])
    await show(value)
    kind='interval' if end else 'single'
    await page.locator(f'[data-period-{kind}="{key}"]').click()
    await page.locator(f'[data-period-cell="{key}"][data-value="{value}"]').click()
    if end:
        await show(end)
        await page.locator(f'[data-period-cell="{key}"][data-value="{end}"]').click()
    await page.locator(f'[data-period-apply="{key}"]').click()
    assert await picker.get_attribute('open') is None

async def choose_mode(page, mode):
    picker=page.locator('[data-period-picker="orders"]')
    if await picker.get_attribute('open') is None: await picker.locator('summary').click()
    await page.locator(f'[data-period-mode="orders"][data-mode="{mode}"]').click()
    await page.locator('[data-period-apply="orders"]').click()

async def main():
    OUT.mkdir(parents=True, exist_ok=True)
    async with async_playwright() as pw:
        browser = await pw.chromium.launch()
        for width in (1440, 390, 320):
            context = await browser.new_context(viewport={'width': width, 'height': 900})
            page = await context.new_page()
            await page.add_init_script('window.showSaveFilePicker=undefined')
            errors = []
            page.on('pageerror', lambda error: errors.append(str(error)))
            try:
                await page.goto(BASE + '#test-users')
                await expect(page.locator('[data-pu-login]')).to_have_count(14)
                await page.locator('[data-pu-login="demo-vast-seller-1"]').click()
                await expect(page.locator('#profile-role')).to_have_text('Partner · säljare')
                await expect(page.locator('#role')).to_be_hidden()
                await expect(page.locator('#nav button')).to_have_count(5)
                await expect(page.locator('#nav [data-go="order-commission"]')).to_be_hidden()
                await page.locator('#view [data-go="order-list"]').click()
                await choose_mode(page, 'month')
                await choose_period(page, 'orders', '2026-12', '2027-02')
                await expect(page.locator('#orders-period-value')).to_have_text('December 2026 – februari 2027')
                await page.locator('[data-period-picker="orders"] summary').click()
                assert await page.evaluate('document.documentElement.scrollWidth <= innerWidth'), (width, 'open period picker')
                await expect(page.locator('[data-period-cell="orders"]')).to_have_count(12)
                box=await page.locator('[data-period-dialog="orders"]').bounding_box()
                assert box['width'] >= min(width, 320)-2, (width,box)
                assert box['x'] >= 0 and box['x']+box['width'] <= width+1
                assert await page.locator('[data-period-cell="orders"]').evaluate_all("nodes=>nodes.every(n=>n.scrollWidth<=n.clientWidth && n.getBoundingClientRect().height<80)")
                await page.locator('[data-period-cancel="orders"]').first.click()
                await choose_period(page, 'orders', '2026-10')
                await expect(page.locator('.pu-total')).to_have_text('6')
                await choose_period(page, 'orders', '2026-10')
                await expect(page.locator('.pu-order-owner')).to_have_count(4)
                assert all('Charlie Exempel' in text for text in await page.locator('.pu-order-owner').all_text_contents())
                for mode in ('day', 'week', 'month', 'year'):
                    await choose_mode(page, mode)
                    assert await page.evaluate('document.documentElement.scrollWidth <= innerWidth'), (width, mode)
                await page.goto(BASE + '?workspace=syd#order-commission')
                await expect(page.locator('.hub-page header')).to_contain_text('Face2face')
                await expect(page.locator('.oc-total')).to_have_count(0)
                await page.locator('#pu-account').click()
                await page.locator('[data-go="test-users"]').click()
                await page.locator('[data-pu-login="demo-vast-manager"]').click()
                await page.locator('#view [data-go="order-list"]').click()
                await choose_mode(page, 'month')
                await choose_period(page, 'orders', '2026-10')
                await page.locator('[data-pu-seller="demo-vast-seller-1"]').check()
                await page.locator('[data-pu-seller="demo-vast-seller-2"]').check()
                await expect(page.locator('.pu-total')).to_have_text('11')
                await expect(page.locator('[data-pu-seller="demo-vast-seller-2"]')).to_be_focused()
                if width < 1000: await page.locator('#menu-toggle').click()
                await page.locator('#nav [data-go="partner-hub-results"]').click()
                await expect(page.locator('.oc-monthly-table')).to_be_visible()
                await page.locator('#oc-dataset').select_option('new')
                await choose_period(page, 'commission', '2026-10')
                await expect(page.locator('.oc-monthly-table')).to_contain_text('Tillägg utöver förskott')
                assert await page.evaluate('document.documentElement.scrollWidth <= innerWidth'), (width, 'invoice')
                async with page.expect_download() as pending:
                    await page.locator('[data-oc-export="2026-10"]').click()
                download = await pending.value
                assert download.suggested_filename == 'Fakturaunderlag_vast_2026-10_urval.xlsx'
                assert await download.failure() is None
                await expect(page.locator('[data-oc-export-status="2026-10"]')).to_contain_text('Excel-filen har skapats')
                await page.locator('#pu-account').click()
                await page.locator('[data-go="test-users"]').click()
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
