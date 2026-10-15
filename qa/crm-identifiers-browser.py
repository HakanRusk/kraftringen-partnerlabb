"""Exercise the new customer fields in Chromium at desktop and phone widths."""
import asyncio
import os
from pathlib import Path
from playwright.async_api import async_playwright, expect

BASE = os.environ.get('PARTNERLABB_QA_URL', 'http://127.0.0.1:8000/')
OUT = Path(os.environ.get('PARTNERLABB_QA_SHOTS', '/tmp/partnerlabb-crm-shots'))

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
                await page.wait_for_function('window.Portal && window.Portal.crm')
                await page.evaluate('''() => {
                    const P=window.Portal;
                    const id=P.partnerSetup.saveProfile({name:'Fiktiv CRM-testpartner',salesAudiences:['business','consumer'],crmMode:'portal'}).id;
                    P.previewPartner(id);
                }''')
                await page.locator('[data-crm-new]').first.click()
                form = page.locator('#crm-customer-form')
                org = form.locator('[name=organizationNumber]')
                person = form.locator('[name=personalNumber]')
                await expect(org).to_be_visible()
                await expect(person).to_be_hidden()
                await form.locator('[name=segment]').select_option('consumer')
                await expect(person).to_be_visible()
                await expect(org).to_be_hidden()
                await form.locator('[name=name]').fill('Fiktiv konsument')
                await person.fill('00000000-0000')
                await form.locator('[name=facilityId]').fill('735999 000000000001')
                await form.locator('[name=gridAreaCode]').fill('12')
                await form.locator('[name=nextAction]').fill('Ring igen')
                await form.locator('[name=nextDate]').fill('2099-01-01')
                await form.locator('button[type=submit]').click()
                await expect(page.locator('#crm-form-error')).to_contain_text('tre bokstäver')
                await expect(form.locator('[name=gridAreaCode]')).to_be_focused()
                await form.locator('[name=gridAreaCode]').fill('xyz')
                # Long identifiers must remain inside the viewport at phone widths.
                for field in ('personalNumber', 'facilityId', 'gridAreaCode'):
                    box = await form.locator(f'[name={field}]').bounding_box()
                    assert box and box['x'] >= 0 and box['x'] + box['width'] <= width, (width, field, box)
                await form.locator('button[type=submit]').click()
                await expect(page.locator('#portal-dialog')).not_to_be_visible()
                row = await page.evaluate('window.Portal.crm.rows()[0]')
                assert row['facilityId'] == '735999000000000001'
                assert row['gridAreaCode'] == 'XYZ'
                assert row['personalNumber'] == '00000000-0000'
                assert 'organizationNumber' not in row
                await page.reload()
                await page.wait_for_function('window.Portal && window.Portal.crm')
                await page.evaluate('(id) => window.Portal.crm.open(id)', row['id'])
                await expect(person).to_have_value('00000000-0000')
                await expect(form.locator('[name=facilityId]')).to_have_value('735999000000000001')
                await form.locator('[name=facilityId]').fill('735999000000000002')
                await form.locator('button[type=submit]').click()
                edited = await page.evaluate('window.Portal.crm.rows()[0]')
                assert edited['facilityId'] == '735999000000000002'
                assert edited['revision'] == row['revision'] + 1
                assert '735999' not in edited['events'][0]['text']
                assert not errors, errors
                print(f'PASS CRM create, conditional identity, validation/focus, layout, reload and edit at {width}px', flush=True)
            except Exception:
                await page.screenshot(path=str(OUT / f'crm-identifiers-{width}-failure.png'), full_page=True)
                raise
            finally:
                await context.close()
        await browser.close()

asyncio.run(main())
