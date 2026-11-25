"""Direct sidebar routes and actual per-month invoice downloads."""
import asyncio, os, zipfile
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
            await context.add_init_script('window.showSaveFilePicker=undefined')
            page=await context.new_page()
            errors=[]
            page.on('pageerror',lambda e:errors.append(str(e)))
            await page.goto(BASE+'#test-users')
            await page.locator('[data-pu-login="demo-vast-manager"]').click()
            async def nav(key):
                if width<1000: await page.locator('#menu-toggle').click()
                await page.locator(f'#nav [data-go="{key}"]').click()
            await nav('partner-hub-services')
            await expect(page.locator('#view h1')).to_have_text('Ordrar & resultat')
            await expect(page.locator('.hub-tabs [data-go="order-customers"]')).to_be_visible()
            await expect(page.locator('.hub-tabs [data-go="products"]')).to_be_visible()
            await page.screenshot(path=str(OUT/f'report-direct-services-{width}.png'))
            await nav('partner-hub-results')
            await expect(page.locator('#view h1')).to_have_text('Din provisionsöversikt')
            await page.locator('#oc-dataset').select_option('new')
            await page.locator('[data-period-picker="commission"] summary').click()
            await page.locator('[data-period-interval="commission"]').click()
            await page.locator('[data-period-cell="commission"][data-value="2026-05"]').click()
            await page.locator('[data-period-cell="commission"][data-value="2026-09"]').click()
            await page.locator('[data-period-apply="commission"]').click()
            assert await page.locator('[data-oc-month-row]').evaluate_all('ns=>ns.map(n=>n.dataset.ocMonthRow)')==['2026-05','2026-06','2026-07','2026-08','2026-09']
            await expect(page.locator('[data-oc-export]')).to_have_count(5)
            for month in ('08','09'):
                async with page.expect_download() as event:
                    await page.locator(f'[data-oc-export="2026-{month}"]').click()
                download=await event.value
                assert download.suggested_filename==f'Fakturaunderlag_vast_2026-{month}_urval.xlsx'
                file=OUT/f'invoice-{width}-{month}.xlsx'
                await download.save_as(file)
                assert file.stat().st_size>5000
                with zipfile.ZipFile(file) as book:
                    assert book.testzip() is None
                    assert 'Fakturaunderlag' in book.read('xl/workbook.xml').decode()
                await expect(page.locator(f'[data-oc-export-status="2026-{month}"] a')).to_have_attribute('download',download.suggested_filename)
            # A user-initiated fallback remains available for a browser blocking an automatic click.
            async with page.expect_download() as event:
                await page.locator('[data-oc-export-status="2026-09"] a').click()
            assert (await event.value).suggested_filename=='Fakturaunderlag_vast_2026-09_urval.xlsx'
            await expect(page.locator('[data-oc-month-row]')).to_have_count(5)
            await page.screenshot(path=str(OUT/f'report-direct-invoices-{width}.png'))
            assert not errors,errors
            print(f'PASS direct workspaces {width}px: one-click services/commission, five monthly rows, two saved XLSX files and persistent download link',flush=True)
            await context.close()
        await browser.close()
asyncio.run(main())
