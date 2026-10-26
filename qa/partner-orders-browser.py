"""Order proposal UI, partner scoping, forms and responsive layout in CI Chromium."""
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
            context = await browser.new_context(viewport={'width':width,'height':900})
            page = await context.new_page()
            errors=[]
            page.on('pageerror',lambda error: errors.append(str(error)))
            page.on('dialog',lambda dialog: dialog.accept())
            try:
                # Ordinary existing-partner entry: no opt-in URL or stored preference.
                await page.goto(BASE)
                await expect(page.locator('#ow-login')).to_have_count(0)
                await page.locator('#role').select_option('partner')
                await page.locator('#partner').select_option('vast')
                await expect(page.locator('#role')).to_have_value('partner')
                await expect(page.locator('#partner')).to_have_value('vast')
                await expect(page.locator('.ow-head h1')).to_have_text('Din orderöversikt')
                await page.locator('[data-ow-filter=year]').select_option('2026')
                await page.locator('[data-ow-filter=month]').select_option('10')
                assert await page.evaluate('document.documentElement.scrollWidth <= innerWidth'), width
                await page.screenshot(path=str(OUT/f'report-orders-home-{width}.png'),full_page=True)
                await page.locator('[data-ow-status=approved]').click()
                await expect(page.locator('[data-ow-filter=status]')).to_have_value('approved')
                await expect(page.locator('#ow-order-list tbody tr')).to_have_count(1)
                await page.locator('[data-ow-filter=mode]').select_option('week')
                await page.locator('[data-ow-filter=week]').select_option('41')
                await expect(page.locator('#ow-order-list tbody')).to_contain_text('Exempelperson 3')
                await page.locator('[data-ow-filter=mode]').select_option('month')
                await page.locator('[data-ow-filter=status]').select_option('all')
                await page.locator('[data-ow-customer]').first.click()
                form=page.locator('#ow-customer-form')
                await form.locator('[name=name]').fill('Fiktiv Testkund')
                await form.locator('[name=postalAddress]').fill('Exempelgatan 4')
                await form.locator('[name=visitAddress]').fill('Exempelvägen 7')
                await form.locator('[name=email]').fill('test@kund.example')
                await form.get_by_role('button',name='Spara kund').click()
                await expect(page.locator('#view')).to_contain_text('Fiktiv Testkund')
                await page.locator('[data-ow-order]').click()
                form=page.locator('#ow-order-form')
                await form.locator('[name=customerId]').select_option(label='Fiktiv Testkund')
                assert await form.locator('[name=termMonths]').count()==0
                assert await form.locator('[data-field=network]').count()==0
                await form.locator('[name=product]').select_option('Kraftringen Opti')
                await form.locator('[name=startDate]').fill('2026-12-01')
                await form.locator('[data-field=installationId]').fill('735999999999999998')
                await form.locator('[data-field=annualKwh]').fill('12000')
                await form.locator('[data-ow-add]').click()
                assert await form.locator('[data-facility]').count()==2
                second=form.locator('[data-facility]').nth(1)
                await second.locator('[data-field=installationId]').fill('735999999999999997')
                await second.locator('[data-field=annualKwh]').fill('6000')
                for control in await form.locator('input,select').all():
                    box=await control.bounding_box()
                    assert box and box['x']>=0 and box['x']+box['width']<=width+1,(width,box)
                await form.get_by_role('button',name='Registrera order · demo').click()
                await expect(page.locator('#portal-dialog')).not_to_be_visible()
                await page.locator('[data-ow-filter=mode]').select_option('year')
                await page.locator('[data-ow-filter=year]').select_option('2026')
                await page.locator('[data-ow-search]').fill('Fiktiv Testkund')
                await page.locator('[data-ow-open]').click()
                await page.get_by_role('button',name='Godkänd · demo',exact=True).click()
                await page.get_by_role('button',name='Bekräftad · demo',exact=True).click()
                await expect(page.locator('#dialog-title')).to_have_text('Order · Bekräftad')
                await page.locator('#close-dialog').click()
                await page.reload()
                await page.locator('[data-ow-search]').fill('Fiktiv Testkund')
                await expect(page.locator('#ow-order-list tbody')).to_contain_text('Bekräftad')
                await page.get_by_role('button',name='Visa provisionsstatistik →').click()
                await expect(page.locator('.ow-metrics')).to_contain_text('250 kr per bekräftad order')
                await page.screenshot(path=str(OUT/f'report-orders-commission-{width}.png'),full_page=True)
                await page.get_by_role('button',name='Byt demoinloggning',exact=True).click()
                await page.locator('#ow-login select').select_option('syd')
                await page.get_by_role('button',name='Öppna partnerns startsida').click()
                await expect(page.locator('#view')).not_to_contain_text('Fiktiv Testkund')
                await page.locator('[data-ow-order]').click()
                form=page.locator('#ow-order-form')
                await form.locator('[name=product]').select_option('Kraftringen Direkt')
                await expect(form.locator('[name=termMonths]')).to_be_visible()
                await expect(form.locator('[data-field=network]')).to_be_visible()
                assert await form.locator('[data-month]').count()==12
                for control in await form.locator('input,select').all():
                    box=await control.bounding_box()
                    assert box and box['x']>=0 and box['x']+box['width']<=width+1,(width,box)
                await page.screenshot(path=str(OUT/f'report-orders-business-{width}.png'),full_page=True)
                await form.locator('[data-ow-cancel]').click()
                await page.locator('[data-ow-legacy]').click()
                await expect(page.locator('.partner-start-choice')).to_have_count(4)
                await page.goto(BASE+'?partner=syd#partner-sales')
                await expect(page.locator('#role')).to_have_value('internal')
                await page.get_by_role('button',name='Visa ordrar & status',exact=True).click()
                await expect(page.locator('#partner')).to_have_value('syd')
                await expect(page.locator('[data-ow-status]')).to_have_count(7)
                await page.reload()
                await expect(page.locator('[data-ow-status]')).to_have_count(7)
                assert not errors, errors
                print(f'PASS order proposal at {width}px: login, cohort, create, multi-site, confirm, reload, partner, profile, rollback',flush=True)
            except Exception:
                await page.screenshot(path=str(OUT/f'orders-failure-{width}.png'),full_page=True)
                raise
            finally:
                await context.close()
        await browser.close()
asyncio.run(main())
