"""Integrated studio opens without cross-site authentication and exports real XLSX."""
import asyncio, os, zipfile
from playwright.async_api import async_playwright, expect
BASE=os.environ.get('PARTNERLABB_QA_URL','http://127.0.0.1:8000/')
async def main():
    async with async_playwright() as pw:
        browser=await pw.chromium.launch()
        context=await browser.new_context(accept_downloads=True)
        page=await context.new_page()
        errors=[]
        page.on('pageerror',lambda e:errors.append(str(e)))
        await page.goto(BASE+'#test-users')
        await page.locator('[data-pu-login="demo-admin"]').click()
        await page.get_by_role('button',name='Provisionsmodeller',exact=True).click()
        frame=page.frame_locator('iframe')
        await expect(frame.locator('#title')).to_have_text('Partner & modell')
        for view,title in [('versions','Modellversioner'),('simulation','Simulering'),('comparison','Jämför versioner'),('tests','Beslut & tester'),('report','Provisionsrapport')]:
            await frame.locator('#nav [data-go="'+view+'"]').click()
            await expect(frame.locator('#title')).to_have_text(title)
        await frame.locator('#partner').select_option(label='Lindgården Fastigheter · Fastighetspartner')
        await frame.locator('#from').fill('2026-05')
        await frame.locator('#from').dispatch_event('change')
        await frame.locator('#to').fill('2026-09')
        await frame.locator('#to').dispatch_event('change')
        await expect(frame.locator('[data-export]')).to_have_count(5)
        async with page.expect_download() as event:
            await frame.locator('[data-export="2026-05"]').click()
        download=await event.value
        assert download.suggested_filename.endswith('2026-05.xlsx')
        with zipfile.ZipFile(await download.path()) as book:
            assert 'xl/workbook.xml' in book.namelist()
            assert 'Fakturaunderlag' in book.read('xl/workbook.xml').decode()
        await page.get_by_role('button',name='Logga ut',exact=True).click()
        await expect(page.locator('iframe')).to_have_count(0)
        await page.goto(BASE+'admin-studio/index.html')
        await expect(page.get_by_role('heading',name='Öppna via administrationen')).to_be_visible()
        assert not errors,errors
        print('PASS integrated studio: six views, five months, XLSX, logout, direct URL denial')
        await browser.close()
asyncio.run(main())
