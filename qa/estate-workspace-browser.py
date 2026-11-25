"""Property landing, unit intake and viewing request at mobile/desktop widths."""
import asyncio, os
from pathlib import Path
from playwright.async_api import async_playwright, expect
BASE=os.environ.get('PARTNERLABB_QA_URL','http://127.0.0.1:8000/')
OUT=Path(os.environ.get('PARTNERLABB_QA_SHOTS','/tmp/partnerlabb-shots'))
async def main():
    OUT.mkdir(parents=True,exist_ok=True)
    async with async_playwright() as pw:
        browser=await pw.chromium.launch()
        for width in (320,390,1440):
            context=await browser.new_context(viewport={'width':width,'height':800})
            page=await context.new_page()
            errors=[]
            page.on('pageerror',lambda e:errors.append(str(e)))
            await page.route('**/api/order-mail',lambda route:route.abort())
            await page.goto(BASE+'#test-users')
            await page.locator('[data-pu-login="demo-estate-manager"]').click()
            await expect(page.locator('h1')).to_have_text('Mina fastigheter')
            await page.locator('[data-unit-search]').fill('1002')
            await expect(page.locator('[data-estate-viewing="a2"]')).to_be_visible()
            assert await page.evaluate('document.documentElement.scrollWidth<=innerWidth'),width
            await page.screenshot(path=str(OUT/f'report-estate-{width}.png'))
            await page.locator('[data-estate-movein="a2"]').click()
            await expect(page.locator('[name=apartment]')).to_have_value('1002')
            await expect(page.locator('[name=moveDate]')).to_be_visible()
            await expect(page.locator('[data-pi-attachment]')).to_be_attached()
            await page.locator('[name=moveDate]').fill('2027-01-15')
            await page.locator('[name=name]').fill('Fiktiv Inflyttare')
            await page.locator('[name=email]').fill('test@hyresgast.example')
            await page.locator('[name=demoOnly]').check()
            await page.locator('#pi-manual-form button[type=submit]').click()
            await expect(page.locator('h1')).to_have_text('Inflyttningen är registrerad.')
            await page.goto(BASE+'?workspace=estate1#overview')
            await page.locator('[data-unit-search]').fill('1002')
            await page.locator('[data-estate-viewing="a2"]').click()
            await expect(page.locator('[data-viewing-info]')).to_be_visible()
            date=await page.locator('#estate-change [name=date]').get_attribute('min')
            await page.locator('#estate-change [name=date]').fill(date)
            await page.locator('#estate-change button[type=submit]').click()
            await expect(page.locator('#view')).to_contain_text('Fortsatt inkoppling önskas.')
            before_scenario=await page.evaluate('JSON.stringify(Portal.state)')
            await page.locator('[data-contract-example]').click()
            await page.locator('[data-contract-step]').select_option('5')
            await expect(page.locator('[data-contract-scenario]')).to_contain_text('Uppsagt · gäller till 2026-12-02')
            await expect(page.locator('[data-contract-scenario]')).to_contain_text('Ledig från 1 december')
            await page.locator('[data-contract-step]').select_option('11')
            await expect(page.locator('[data-contract-scenario]')).to_contain_text('Bebodd från 15 december')
            assert await page.evaluate('document.documentElement.scrollWidth<=innerWidth'),width
            await page.screenshot(path=str(OUT/f'report-estate-contracts-{width}.png'))
            await page.keyboard.press('Escape')
            assert await page.evaluate('JSON.stringify(Portal.state)')==before_scenario
            await page.reload()
            await page.locator('[data-unit-search]').fill('1002')
            await expect(page.locator('[data-unit-address]:visible')).to_contain_text('Visningsel')
            await expect(page.locator('[data-unit-address]:visible')).to_contain_text('inväntar avtalsbekräftelse')
            await expect(page.locator('[data-unit-address]:visible')).to_contain_text('Fysisk uthyrning: Underlag saknas')
            assert not errors,errors
            print(f'PASS property workflow {width}px: search, prefill, save, viewing takeover and reload',flush=True)
            await context.close()
        await browser.close()
asyncio.run(main())
