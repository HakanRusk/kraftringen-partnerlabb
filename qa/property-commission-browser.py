"""Mobile property commission and contiguous intervals; no external writes."""
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
            context=await browser.new_context(viewport={'width':width,'height':800},accept_downloads=True)
            page=await context.new_page()
            errors=[]
            page.on('pageerror',lambda e:errors.append(str(e)))
            await page.goto(BASE+'#test-users')
            await page.locator('[data-pu-login="demo-estate-manager"]').click()
            await page.evaluate("Portal.go('property-results')")
            await page.locator('[data-pc-rate-form] input').fill('500')
            await page.locator('[data-pc-rate-form] button').click()
            await page.locator('[data-period-picker="property"] summary').click()
            await page.locator('[data-period-mode="property"][data-mode="month"]').click()
            await expect(page.locator('[data-period-mode="property"][data-mode="day"]')).to_have_count(0)
            await expect(page.locator('[data-period-mode="property"][data-mode="week"]')).to_have_count(0)
            await page.locator('[data-period-interval="property"]').click()
            await page.locator('[data-period-cell="property"][data-value="2026-08"]').click()
            await page.locator('[data-period-cell="property"][data-value="2026-09"]').click()
            await page.locator('[data-period-apply="property"]').click()
            await expect(page.locator('[data-pc-month]')).to_have_count(2)
            assert '19' in await page.locator('[data-pc-total]').inner_text()
            assert await page.evaluate('document.documentElement.scrollWidth<=innerWidth'),(width,'page overflow')
            if width<600:
                assert await page.locator('.pc-commission .table-wrap').evaluate('(e)=>e.scrollWidth<=e.clientWidth'),(width,'commission content clipped')
                assert await page.locator('[data-pc-export]').evaluate_all('ns=>ns.every(n=>n.getBoundingClientRect().right<=innerWidth)'),(width,'Excel outside viewport')
            await page.screenshot(path=str(OUT/f'report-property-commission-{width}.png'),full_page=True)
            await page.locator('[data-pc-detail="2026-09"]').click()
            await expect(page.locator('.oc-calculation')).to_contain_text('21 aktiverade avtal')
            await page.evaluate('Portal.closeDialog()')
            async with page.expect_download() as event:
                await page.locator('[data-pc-export="2026-09"]').click()
            download=await event.value
            assert download.suggested_filename=='fakturaunderlag-estate1-2026-09.xlsx'
            assert not errors,errors
            print(f'PASS property commission {width}px: interval, formula, month/year only, XLSX and no overflow',flush=True)
            await context.close()
        await browser.close()
asyncio.run(main())
