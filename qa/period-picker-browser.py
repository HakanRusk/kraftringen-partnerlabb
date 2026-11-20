"""Regression for the reported narrow mobile period popup, with real layout checks."""
import asyncio, os
from pathlib import Path
from playwright.async_api import async_playwright, expect
BASE=os.environ.get('PARTNERLABB_QA_URL','http://127.0.0.1:8000/')
OUT=Path(os.environ.get('PARTNERLABB_QA_SHOTS','/tmp/partnerlabb-shots'))
async def main():
    OUT.mkdir(parents=True,exist_ok=True)
    async with async_playwright() as pw:
        browser=await pw.chromium.launch()
        for width in (320,390,414,768,1440):
            context=await browser.new_context(viewport={'width':width,'height':740},has_touch=width<800)
            page=await context.new_page()
            errors=[]
            page.on('pageerror',lambda e:errors.append(str(e)))
            await page.goto(BASE+'#test-users')
            await page.locator('[data-pu-login="demo-internal"]').click()
            original=await page.locator('#internal-period-value').inner_text()
            for mode in ('year','month','week','day'):
                await page.locator('[data-period-picker="internal"] summary').click()
                await page.locator(f'[data-period-mode="internal"][data-mode="{mode}"]').click()
                dialog=page.locator('[data-period-dialog="internal"]')
                box=await dialog.bounding_box()
                assert box['width']>=min(width,320)-2 and box['x']>=0 and box['x']+box['width']<=width+1,(width,mode,box)
                assert await dialog.evaluate('(d)=>d.scrollWidth<=d.clientWidth'),(width,mode,'dialog overflow')
                assert await page.locator('[data-period-cell="internal"]').evaluate_all('ns=>ns.every(n=>n.scrollWidth<=n.clientWidth && n.clientHeight<85 && getComputedStyle(n).whiteSpace==="nowrap")'),(width,mode,'unreadable cells')
                await page.locator('[data-period-apply="internal"]').focus()
                await page.keyboard.press('Tab')
                assert await page.evaluate('document.activeElement.closest("[data-period-dialog]")!==null'), 'focus escaped modal'
                await page.screenshot(path=str(OUT/f'report-period-{mode}-{width}.png'))
                await page.locator('[data-period-cancel="internal"]').first.click()
                await expect(page.locator('#internal-period-value')).to_have_text(original)
            await page.locator('[data-period-picker="internal"] summary').click()
            await page.locator('[data-period-mode="internal"][data-mode="month"]').click()
            await page.locator('[data-period-interval="internal"]').click()
            await page.locator('[data-period-cell="internal"][data-value="2026-01"]').click()
            await expect(page.locator('[data-period-apply="internal"]')).to_be_disabled()
            await page.locator('[data-period-cell="internal"][data-value="2026-03"]').click()
            await expect(page.locator('#internal-period-value')).to_have_text(original)
            await page.locator('[data-period-apply="internal"]').click()
            await expect(page.locator('#internal-period-value')).to_have_text('Januari–mars 2026')
            await expect(page.locator('[data-period-picker="internal"] summary')).to_be_focused()
            assert await page.evaluate('document.documentElement.scrollWidth<=innerWidth')
            assert not errors,errors
            print(f'PASS internal period sheet {width}px: month/week/year, readable cells, cancel, focus and apply',flush=True)
            await context.close()
        await browser.close()
asyncio.run(main())
