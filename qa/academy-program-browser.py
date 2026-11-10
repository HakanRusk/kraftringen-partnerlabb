"""Course UI, all-correct grading and responsive order gate with fictional accounts."""
import asyncio
import os
from playwright.async_api import async_playwright, expect
BASE = os.environ.get('PARTNERLABB_QA_URL', 'http://127.0.0.1:8000/')
async def main():
    async with async_playwright() as pw:
        browser = await pw.chromium.launch()
        for width in (1440, 390, 320):
            context = await browser.new_context(viewport={'width': width, 'height': 900})
            page = await context.new_page()
            errors = []
            page.on('pageerror', lambda error: errors.append(str(error)))
            await page.goto(BASE + '#test-users')
            await page.locator('[data-pu-login="demo-vast-seller-1"]').click()
            await page.goto(BASE + '#academy')
            await expect(page.locator('.lp-banner')).to_contain_text('0 av 10')
            await page.locator('[data-lp-open="balance"]').click()
            await expect(page.locator('.lp-assessment')).to_contain_text('Provet öppnas')
            await page.locator('[data-lp-open="grid"]').click()
            await page.locator('[data-lp-network="2"]').click()
            await expect(page.locator('#lp-net-result')).to_contain_text('Lokalnät')
            for value, result in [('30', 'Inte godkänd ännu'), ('60', 'Godkänd och sparad')]:
                await page.locator('#lp-start').click()
                await page.locator('[name="g1"][value="1"]').check()
                await page.locator('[name="g1"][value="2"]').check()
                await page.locator('[name="g2"]').fill(value)
                await page.locator('[name="g3"][value="1"]').check()
                await page.get_by_role('button', name='Lämna in alla svar').click()
                await expect(page.locator('.lp-feedback')).to_contain_text(result)
            assert await page.evaluate('document.documentElement.scrollWidth <= innerWidth'), width
            await page.reload()
            await expect(page.locator('.lp-banner')).to_contain_text('1 av 10')
            await page.locator('[data-go="academy-library"]').click()
            await expect(page.locator('.lp-page')).to_have_count(0)
            await expect(page.locator('a[href*="#lesson/"]')).to_have_count(18)
            for section in ('calls', 'scripts', 'invoice', 'links', 'films'):
                await page.locator(f'[data-ar-page="{section}"]').click()
                assert await page.evaluate('document.documentElement.scrollWidth <= innerWidth'), (width, section)
            await page.locator('[data-ar-page="invoice"]').click()
            await page.locator('[data-ar-invoice="1"]').click()
            await expect(page.locator('#ar-invoice-explain')).to_contain_text('rörligt påslag')
            await page.locator('[data-ar-page="courses"]').click()
            await expect(page.locator('.lp-banner')).to_contain_text('1 av 10')
            await page.goto(BASE + '#overview')
            await page.get_by_role('button', name='＋ Ny order', exact=True).click()
            await expect(page.locator('.lp-warning')).to_contain_text('Utbildning krävs')
            await expect(page.locator('#ow-order-form button[value="draft"]')).to_be_disabled()
            await page.locator('[data-ow-cancel]').click()
            await page.goto(BASE + '#test-users')
            await page.locator('[data-pu-login="demo-admin"]').click()
            if width <= 800:
                await page.locator('#menu-toggle').click()
            await page.locator('#nav [data-go="academy"]').click()
            await page.locator('summary').filter(has_text='Kraftringen · utbildningsuppföljning').click()
            await expect(page.locator('#lp-policy')).to_be_visible()
            await page.locator('#lp-policy-product').select_option('consumer|Kraftringen Opti')
            for box in await page.locator('#lp-policy [name="required"]').all():
                await box.uncheck()
            await page.get_by_role('button', name='Spara utbildningskrav', exact=True).click()
            await expect(page.locator('#lp-policy-status')).to_contain_text('sparats lokalt')
            assert await page.evaluate('document.documentElement.scrollWidth <= innerWidth'), (width, 'admin')
            assert not errors, errors
            print(f'PASS academy: incorrect/correct quiz, reload, legacy material, order gate and admin policy at {width}px')
            await context.close()
        await browser.close()
asyncio.run(main())
