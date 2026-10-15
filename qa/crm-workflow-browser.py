"""Synthetic CRM sales workflow in the existing CI Chromium job, at three widths."""
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
            await page.add_init_script('''(() => {
                const NativeDate=Date;
                window.Date=class extends NativeDate {
                    constructor(...args){super(...(args.length?args:['2026-10-15T12:00:00Z']));}
                    static now(){return NativeDate.parse('2026-10-15T12:00:00Z');}
                };
            })();''')
            try:
                await page.goto(BASE)
                await page.wait_for_function('window.Portal && window.Portal.crm')
                await page.evaluate('''() => {
                    const P=window.Portal;
                    const id=P.partnerSetup.saveProfile({name:'Fiktiv arbetsflödespartner',salesAudiences:['business','consumer'],crmMode:'portal'}).id;
                    P.previewPartner(id);
                }''')
                await expect(page.locator('.crm-tabs')).to_have_count(0)
                await page.locator('[data-crm-new]').first.click()
                form = page.locator('#crm-customer-form')
                for field, value in {
                    'name': 'Fiktiva Bageriet', 'email': 'kontakt@bageriet.example', 'phone': '+46 700 000 000',
                    'currentSupplier': 'Fiktiv leverantör', 'contractEndDate': '2027-01-31',
                    'annualConsumptionKwh': '25000', 'nextAction': 'Ring och boka möte'
                }.items():
                    await form.locator(f'[name={field}]').fill(value)
                await form.locator('[name=electricityArea]').select_option('SE4')
                await form.locator('[name=productInterest]').select_option('Poolportfölj Trygg')
                await form.locator('[data-crm-date=week]').click()
                await expect(form.locator('[name=nextDate]')).to_have_value('2026-10-22')
                for field in ('currentSupplier', 'contractEndDate', 'annualConsumptionKwh', 'productInterest', 'nextDate'):
                    box = await form.locator(f'[name={field}]').bounding_box()
                    assert box and box['x'] >= 0 and box['x'] + box['width'] <= width, (width, field, box)
                await form.locator('button[type=submit]').click()
                row = await page.evaluate('window.Portal.crm.rows()[0]')
                await page.evaluate('''() => {
                    const P=window.Portal;
                    P.crm.save({name:'Annan fiktiv kund',segment:'consumer',stage:'lead',nextAction:'Stäm av',nextDate:'2026-10-16',annualConsumptionKwh:'1000',contractEndDate:'2026-11-01'});
                    P.crm.save({name:'Utan förbrukning',segment:'business',stage:'lead',nextAction:'Ring',nextDate:'2026-10-23'});
                    P.go('overview');
                }''')
                await expect(page.locator('#crm-upcoming .crm-activity')).to_have_count(2)
                assert await page.locator('#crm-expiring .crm-due').all_text_contents() == ['2026-11-01', '2027-01-31']
                for view, selector in [('crm-customers', '.crm-customer-name'), ('crm-pipeline', '.crm-deal'), ('crm-activities', '.crm-activity')]:
                    await page.evaluate('(view) => window.Portal.go(view)', view)
                    search = page.locator('#crm-filter-form [name=query]')
                    await search.press_sequentially('Bageriet', delay=40)
                    await expect(search).to_be_focused()
                    await expect(search).to_have_value('Bageriet')
                    await expect(page.locator(selector)).to_have_count(1)
                    await page.locator('[data-crm-clear]').click()
                await page.evaluate('window.Portal.go("crm-customers")')
                await expect(page.locator('a[href="tel:+46700000000"]')).to_have_count(1)
                await expect(page.locator('a[href="mailto:kontakt%40bageriet.example"]')).to_have_count(1)
                await page.evaluate('window.Portal.go("crm-pipeline")')
                await expect(page.locator('[data-crm-stage=lead] .crm-volume')).to_contain_text('26 MWh/år')
                await expect(page.locator('[data-crm-stage=lead] .crm-volume')).to_contain_text('2 av 3')
                await page.locator(f'[data-crm-advance="{row["id"]}"]').click()
                await expect(form.locator('[name=stage]')).to_have_value('contact')
                await expect(form.locator('[name=nextAction]')).to_be_focused()
                assert await page.evaluate('(id) => window.Portal.crm.rows().find(r=>r.id===id).stage', row['id']) == 'lead'
                await page.locator('#crm-cancel').click()
                await page.locator(f'[data-crm-advance="{row["id"]}"]').click()
                await form.locator('[name=nextAction]').fill('Följ upp behov')
                await form.locator('[data-crm-date=tomorrow]').click()
                await form.locator('button[type=submit]').click()
                await page.locator(f'[data-crm-open="{row["id"]}"]').click()
                await expect(form.locator('a[href^="tel:"]')).to_have_count(1)
                await form.locator('[name=stage]').select_option('won')
                await expect(page.locator('#crm-won-guidance')).to_be_visible()
                await expect(page.locator('#crm-next')).to_be_hidden()
                await form.locator('button[type=submit]').click()
                await expect(page.locator('#toast')).to_contain_text('Markerad som vunnen i CRM')
                await expect(page.locator('#toast')).to_contain_text('Inget har skickats')
                await page.evaluate('window.Portal.go("crm-customers")')
                await expect(page.locator('tr').filter(has=page.locator(f'[data-crm-open="{row["id"]}"]')).locator('td').last).to_have_text('2026-10-15')
                await page.reload()
                await page.wait_for_function('window.Portal && window.Portal.crm')
                await page.evaluate('(id) => window.Portal.crm.open(id)', row['id'])
                await expect(form.locator('[name=productInterest]')).to_have_value('Poolportfölj Trygg')
                await expect(form.locator('[name=annualConsumptionKwh]')).to_have_value('25000')
                await expect(page.locator('#crm-won-guidance')).to_be_visible()
                await form.locator('[name=stage]').select_option('lost')
                await form.locator('[name=lostReason]').fill('Fiktiv förlustorsak')
                await form.locator('button[type=submit]').click()
                edited = await page.evaluate('(id) => window.Portal.crm.rows().find(r=>r.id===id)', row['id'])
                assert edited['wonAt'] == '2026-10-15T12:00:00.000Z'
                assert edited['lostAt'] == '2026-10-15T12:00:00.000Z'
                assert len(edited['events']) == 4
                assert not errors, errors
                print(f'PASS CRM electricity, queues, links, live typing/focus, pipeline, close dates, reload and mobile layout at {width}px', flush=True)
            except Exception:
                await page.screenshot(path=str(OUT / f'crm-workflow-{width}-failure.png'), full_page=True)
                raise
            finally:
                await context.close()
        await browser.close()

asyncio.run(main())
