"""Second-round regression checks for confirmed property-workflow defects.

All inputs are fictional. Uses the coordinator's preview, installed Chromium,
real XLSX/PDF bytes and controlled delayed failures at the storage boundary.
"""
import asyncio
import importlib.util
import json
import os
import pathlib
import shutil
import traceback

from playwright.async_api import async_playwright

_spec = importlib.util.spec_from_file_location('intake_qa', pathlib.Path(__file__).with_name('property-intake.py'))
_intake = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_intake)
BASE, Suite = _intake.BASE, _intake.Suite
OUT = pathlib.Path(os.environ.get('PARTNERLABB_QA_SHOTS', '/tmp/partnerlabb-round2-property'))


async def row_preview(test):
    await test.fresh()
    page = test.page
    await test.view('estate1', 'property-import')
    rows = []
    for index, field in enumerate(['address', 'name', 'city', 'apartment', 'phone']):
        values = {'address': 'QA Kontrollgatan ' + str(index + 1), 'apartment': '1001', 'postcode': '222 22', 'city': 'Lund', 'moveDate': '2026-11-01', 'name': 'QA Kontrollrad', 'email': f'control-{index}@hyresgast.example', 'phone': ''}
        values[field] = 'QA rad ett\nQA rad två'
        rows.append([values[key] for key in ['address', 'apartment', 'postcode', 'city', 'moveDate', 'name', 'email', 'phone']])
    rows.append(['QA Giltiggatan 6', '1002', '222 22', 'Lund', '2026-11-02', 'QA Giltig Rad', 'valid-control@hyresgast.example', ''])
    await page.locator('#pi-excel-file').set_input_files(_intake.xlsx_file('radbrytningar.xlsx', _intake.workbook(_intake.HEADERS, rows)))
    await page.locator('.pi-import-row').nth(5).wait_for()
    test.good('kontrolltecken markeras per Excelrad före sparning', await page.locator('.pi-row-invalid').count() == 5)
    for index, label in enumerate(['Adress', 'Namn', 'Ort', 'Lägenhet', 'Telefon']):
        text = await page.locator('.pi-import-row').nth(index).inner_text()
        test.good(f'Excelrad {index + 2} visar fel i rätt fält', label + ' innehåller en radbrytning' in text and await page.locator(f'[data-pi-select="{index}"]').is_disabled())
    test.good('giltig Excelrad förblir vald trots radfel i samma fil', await page.locator('[data-pi-select]:checked').count() == 1 and await page.locator('[data-pi-select="5"]').is_checked())
    await page.locator('#pi-import-confirm').check()
    await page.evaluate('''()=>{const button=document.querySelector('#pi-import-save');button.click();button.click();}''')
    await page.locator('.pi-success').wait_for()
    saved = [row for row in (await test.state())['moveins'] if row.get('intakeSource') == 'excel']
    test.good('endast giltig vald rad sparas utan att felrader blockerar importen', len(saved) == 1 and saved[0]['email'] == 'valid-control@hyresgast.example')
    test.good('snabb upprepad sparning skapar inget extra ärende', await page.evaluate('Portal.state.moveins.filter(row=>row.email==="valid-control@hyresgast.example").length') == 1)


async def identity(test):
    await test.fresh()
    page = test.page
    await test.view('estate1', 'property-import')
    rows = [
        ['QA Gatan 1|Hus B', '1001', '222 22', 'Lund', '2026-11-01', 'QA Första Identitet', 'identity@hyresgast.example', ''],
        ['QA Gatan 1', 'Hus B|1001', '222 22', 'Lund', '2026-11-01', 'QA Andra Identitet', 'identity@hyresgast.example', ''],
        ['  qa  gatan 1|hus b  ', '  1001  ', '222 22', 'Lund', '2026-11-01', 'QA Faktisk Dubblett', 'IDENTITY@HYRESGAST.EXAMPLE', ''],
    ]
    await page.locator('#pi-excel-file').set_input_files(_intake.xlsx_file('identitet.xlsx', _intake.workbook(_intake.HEADERS, rows)))
    await page.locator('.pi-import-row').nth(2).wait_for()
    test.good('skilda adress- och lägenhetsvärden med lodstreck kolliderar inte', not await page.locator('[data-pi-select="0"]').is_disabled() and not await page.locator('[data-pi-select="1"]').is_disabled())
    test.good('faktisk normaliserad dubblett markeras fortsatt', await page.locator('[data-pi-select="2"]').is_disabled() and await page.locator('.pi-row-invalid').count() == 1)
    await page.locator('[data-pi-select="0"]').uncheck()
    test.good('ett uttryckligt bortval lämnar den andra skilda raden registrerbar', await page.locator('[data-pi-select]:checked').count() == 1 and await page.locator('[data-pi-select="1"]').is_checked())
    await page.locator('[data-pi-select="0"]').check()
    await page.locator('#pi-import-confirm').check()
    await page.locator('#pi-import-save').click()
    await page.locator('.pi-success').wait_for()
    created = [row for row in (await test.state())['moveins'] if row.get('intakeSource') == 'excel']
    test.good('registrerings-API sparar båda skilda identiteterna', len(created) == 2 and {(row['address'], row['apartment']) for row in created} == {('QA Gatan 1|Hus B', '1001'), ('QA Gatan 1', 'Hus B|1001')})
    await page.reload(wait_until='networkidle')
    await page.locator('#pi-excel-file').set_input_files(_intake.xlsx_file('identitet-igen.xlsx', _intake.workbook(_intake.HEADERS, rows)))
    await page.locator('.pi-import-row').nth(2).wait_for()
    test.good('upprepning av samma Excel under reload ger tre dubbletter och inga nya ärenden', await page.locator('.pi-row-invalid').count() == 3 and await page.locator('#pi-import-save').is_disabled() and await page.evaluate('Portal.state.moveins.filter(row=>row.intakeSource==="excel").length') == 2)


async def attachment_form(test):
    await test.fresh()
    page = test.page
    await test.view('estate2', 'property-registrations')
    await page.evaluate('Portal.moveinService.open("service-demo-003")')
    await page.locator('[name=address]').fill('QA Rättad adress 123')
    await page.locator('[name=apartment]').fill('1202')
    await page.locator('[name=moveDate]').fill('2026-11-17')
    await page.locator('[name=partnerReply]').fill('QA komplettering före uppladdning')
    await page.evaluate('''()=>{window.qaStoreFiles=Portal.moveinAttachments.storeFiles;
      Portal.moveinAttachments.storeFiles=async(...args)=>{const metas=await window.qaStoreFiles(...args);return new Promise(resolve=>{window.qaReleaseUpload=()=>resolve(metas);window.qaUploadReady=true})};}''')
    await page.locator('#movein-attachment-files').set_input_files(_intake.pdf_file('formularet-fullmakt.pdf'))
    await page.wait_for_function('window.qaUploadReady===true')
    await page.locator('[name=partnerReply]').fill('QA komplettering även under uppladdning')
    await page.evaluate('()=>{Portal.moveinAttachments.storeFiles=window.qaStoreFiles;window.qaReleaseUpload()}')
    await page.locator('[data-attachment-download]').wait_for()
    test.good('bilageuppladdning bevarar senast inmatad kompletteringstext', await page.locator('[name=partnerReply]').input_value() == 'QA komplettering även under uppladdning')
    test.good('bilageuppladdning bevarar adress, lägenhet och inflyttningsdatum', await page.locator('[name=address]').input_value() == 'QA Rättad adress 123' and await page.locator('[name=apartment]').input_value() == '1202' and await page.locator('[name=moveDate]').input_value() == '2026-11-17')
    page.once('dialog', lambda dialog: dialog.accept())
    await page.locator('[data-attachment-remove]').click()
    await page.locator('[data-attachment-remove]').wait_for(state='detached')
    test.good('bilageborttagning bevarar också kompletteringsformuläret', await page.locator('[name=partnerReply]').input_value() == 'QA komplettering även under uppladdning' and await page.locator('[name=address]').input_value() == 'QA Rättad adress 123')
    await page.locator('#movein-attachment-files').set_input_files(_intake.pdf_file('ratt-fullmakt.pdf'))
    await page.locator('[data-attachment-download]').wait_for()
    await page.locator('#movein-service-forward-form button[type=submit]').click()
    await page.locator('#portal-dialog').wait_for(state='hidden')
    row = await test.row('service-demo-003')
    test.good('förmedling sparar bevarade rättelser och hela kompletteringen', row['handoverStatus'] == 'submitted' and row['address'] == 'QA Rättad adress 123' and row['moveDate'] == '2026-11-17' and any(event.get('text', '').endswith('QA komplettering även under uppladdning') for event in row['events']))


async def delayed_delete(test):
    await test.fresh()
    page = test.page
    await test.view('estate1')
    meta = await test.attach_by_api('forsta-fullmakt.pdf')
    result = await test.api_create({'partner': 'estate1', 'name': 'QA Samtidiga Bilagor', 'email': 'race@hyresgast.example', 'address': 'QA Racegatan 1', 'postcode': '222 22', 'city': 'Lund', 'moveDate': '2026-11-01', 'authorityFiles': [meta]})
    rid = result['created'][0]['id']
    await page.evaluate('(id)=>Portal.moveinService.open(id)', rid)
    await page.locator('[name=partnerReply]').fill('QA text under bilageradering')
    await page.evaluate('''()=>{window.qaRemoveFile=Portal.moveinAttachments.removeUnreferenced;
      Portal.moveinAttachments.removeUnreferenced=()=>new Promise((resolve,reject)=>{window.qaRejectDelete=()=>reject(new Error('QA IndexedDB delete failure'))})}''')
    page.once('dialog', lambda dialog: dialog.accept())
    await page.locator('[data-attachment-remove]').click()
    await page.wait_for_function('typeof window.qaRejectDelete==="function"')
    await page.locator('#movein-attachment-files').set_input_files(_intake.pdf_file('ny-fullmakt.pdf', _intake.PDF_B))
    await page.wait_for_function('(id)=>Portal.state.moveins.find(row=>row.id===id).authorityFiles.some(meta=>meta.name==="ny-fullmakt.pdf")', arg=rid)
    latest = await test.row(rid)
    await page.evaluate('()=>{Portal.moveinAttachments.removeUnreferenced=window.qaRemoveFile;window.qaRejectDelete()}')
    await page.wait_for_function('document.querySelector("#toast").textContent.includes("Nyare ändringar")')
    test.good('misslyckad äldre radering skriver inte över nyare ärendedata eller historik', await test.row(rid) == latest)
    test.good('asynkront rensfel visas utan att tappa inmatad partnertext', 'kunde inte rensas' in await page.locator('#toast').inner_text() and await page.locator('[name=partnerReply]').input_value() == 'QA text under bilageradering')
    actual, filename = await test.download_meta(latest['authorityFiles'][0], 'new-after-failed-delete.pdf')
    test.good('den nyare fullmaktens bytes och filnamn förblir korrekta', actual == _intake.PDF_B and filename == 'ny-fullmakt.pdf')
    await page.reload(wait_until='networkidle')
    test.good('nyare ärendedata består även efter reload och äldre rensfel', await test.row(rid) == latest)

    # No newer changes: the old reference can be restored safely.
    await page.evaluate('(id)=>Portal.moveinService.open(id)', rid)
    before = await test.row(rid)
    await page.evaluate('''()=>{window.qaRemoveFile=Portal.moveinAttachments.removeUnreferenced;
      Portal.moveinAttachments.removeUnreferenced=async()=>{throw new Error('QA immediate delete failure')};}''')
    page.once('dialog', lambda dialog: dialog.accept())
    await page.locator('[data-attachment-remove]').click()
    await page.wait_for_function('document.querySelector("#toast").textContent.includes("tidigare kopplingen är återställd")')
    test.good('raderingsfel utan nyare ändringar återställer befintligt ärende exakt', await test.row(rid) == before)
    await page.evaluate('()=>{Portal.moveinAttachments.removeUnreferenced=window.qaRemoveFile}')

    # Finish a pending removal after the user opened a different case.
    await page.evaluate('''()=>{window.qaRemoveFile=Portal.moveinAttachments.removeUnreferenced;
      Portal.moveinAttachments.removeUnreferenced=()=>new Promise(resolve=>{window.qaReleaseDelete=()=>resolve(true)})}''')
    page.once('dialog', lambda dialog: dialog.accept())
    await page.locator('[data-attachment-remove]').click()
    await page.wait_for_function('typeof window.qaReleaseDelete==="function"')
    await page.evaluate('Portal.moveinService.open("service-demo-001")')
    await page.evaluate('()=>{Portal.moveinAttachments.removeUnreferenced=window.qaRemoveFile;window.qaReleaseDelete()}')
    await page.wait_for_timeout(100)
    test.good('slutförd radering återöppnar inte ett tidigare ärende över en ny dialog', await page.locator('.movein-service-detail').get_attribute('data-case-id') == 'service-demo-001')


async def run():
    OUT.mkdir(parents=True, exist_ok=True)
    async with async_playwright() as pw:
        executable = shutil.which('chromium') or shutil.which('chromium-browser')
        if not executable:
            raise RuntimeError('Installed Chromium is required')
        browser = await pw.chromium.launch(executable_path=executable, args=['--no-sandbox'])
        test = Suite(browser)
        try:
            for task in [row_preview, identity, attachment_form, delayed_delete]:
                await task(test)
            test.good('inga scriptfel i andrarundans fastighetsregressioner', not test.errors)
            (OUT / 'round2-property.json').write_text(json.dumps({'checks': test.checks, 'errors': test.errors}, ensure_ascii=False, indent=2))
            print(f'PASS {len(test.checks)} andrarundans fastighetsregressioner', flush=True)
        except Exception:
            if test.page:
                await test.page.screenshot(path=str(OUT / 'failure.png'), full_page=True)
            (OUT / 'round2-property-failure.json').write_text(json.dumps({'checks': test.checks, 'errors': test.errors, 'traceback': traceback.format_exc()}, ensure_ascii=False, indent=2))
            raise
        finally:
            await browser.close()


if __name__ == '__main__':
    asyncio.run(run())
