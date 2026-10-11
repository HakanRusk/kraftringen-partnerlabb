"""Regression checks for bugs found during the full portal audit.

Uses actual browser storage, PDF bytes and XLSX workbooks. All people and
addresses are fictional. Output stays outside the source tree by default.
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
OUT = pathlib.Path(os.environ.get('PARTNERLABB_QA_SHOTS', '/tmp/partnerlabb-bug-property'))


async def save_failure(test):
    await test.fresh()
    page = test.page
    await test.view(None, 'movein-cases')
    await page.evaluate('Portal.moveinService.open("service-demo-001")')
    before = await test.row('service-demo-001')
    await page.evaluate('Portal.save()')
    saved_before = await page.evaluate('localStorage.getItem("partnerlabb.portal.v2")')
    await page.locator('[name=handoverStatus]').select_option('handling')
    await page.locator('[name=trade]').select_option('handling')
    await page.locator('[name=next]').fill('QA kontrollera underlaget igen')
    await page.locator('[name=feedback]').fill('QA delad återkoppling vid lagringsfel')
    await page.locator('[name=privateNote]').fill('QA intern anteckning vid lagringsfel')
    await page.evaluate('''()=>{window.qaStorageWrite=Storage.prototype.setItem;
      Storage.prototype.setItem=function(){throw new DOMException('QA full storage','QuotaExceededError')};}''')
    await page.locator('#movein-service-internal-form button[type=submit]').click()
    test.good('misslyckad intern handläggning återställer hela ärendet och historiken', await test.row('service-demo-001') == before)
    test.good('misslyckad handläggning behåller den öppna dialogen', await page.locator('#portal-dialog').evaluate('(node)=>node.open'))
    test.good('misslyckad handläggning behåller inmatad återkoppling och nästa steg', await page.locator('[name=feedback]').input_value() == 'QA delad återkoppling vid lagringsfel' and await page.locator('[name=next]').input_value() == 'QA kontrollera underlaget igen')
    test.good('misslyckad handläggning visar lokalt sparfel utan falsk framgång', 'kunde inte sparas' in await page.locator('#movein-service-save-feedback').inner_text())
    test.good('lagrat v2-underlag förblir identiskt vid handläggningsfel', await page.evaluate('localStorage.getItem("partnerlabb.portal.v2")') == saved_before)
    await page.evaluate('Storage.prototype.setItem=window.qaStorageWrite;delete window.qaStorageWrite')
    await page.locator('#movein-service-internal-form button[type=submit]').click()
    row = await test.row('service-demo-001')
    test.good('återförsök sparar ändringen och stänger dialogen', row['handoverStatus'] == 'handling' and not await page.locator('#portal-dialog').evaluate('(node)=>node.open'))
    test.good('återförsök dubblerar varken återkoppling eller intern anteckning', sum(event['text'] == 'QA delad återkoppling vid lagringsfel' for event in row['events']) == 1 and sum(event['text'] == 'QA intern anteckning vid lagringsfel' for event in row['events']) == 1)
    await page.reload(wait_until='networkidle')
    test.good('lyckat återförsök består efter omladdning', (await test.row('service-demo-001')) == row)
    await test.view('estate1', 'property-registrations')
    await page.evaluate('Portal.moveinService.open("service-demo-001")')
    text = await page.locator('.movein-service-timeline').inner_text()
    test.good('partnern får den sparade återkopplingen men ingen intern anteckning', 'QA delad återkoppling' in text and 'QA intern anteckning' not in text)
    await page.locator('#close-dialog').click()


async def filters(test):
    await test.fresh()
    page = test.page
    await test.view('estate1', 'property-registrations')
    await page.locator('#property-query').fill('Sökning utan träff QA')
    test.good('tom sökträff skiljs från saknade ärenden', 'Inga ärenden matchar' in await page.locator('.property-empty').inner_text() and await page.locator('.property-empty [data-property-intake]').count() == 0)
    test.good('tom sökträff erbjuder att återställa listan', await page.locator('[data-property-clear-filters]').count() == 1)
    await page.locator('[data-property-clear-filters]').click()
    test.good('återställning visar befintliga ärenden och fokuserar sökningen', await page.locator('.property-table tbody tr').count() == 2 and await page.locator('#property-query').evaluate('(node)=>node===document.activeElement'))
    await page.locator('#property-query').fill('  Ari  ')
    test.good('sökning tolererar omgivande blanksteg', await page.locator('.property-table tbody tr').count() == 1 and 'Ari Exempel' in await page.locator('.property-table').inner_text())
    await page.locator('#property-filter').select_option('underway')
    await test.view('estate2', 'property-registrations')
    test.good('en annan partner ärver inte föregående partners sökning eller filter', await page.locator('#property-query').input_value() == '' and await page.locator('#property-filter').input_value() == 'all' and 'Mika Exempel' in await page.locator('.property-table').inner_text())
    await page.locator('#property-filter').select_option('confirmed')
    test.good('tom statusfiltrering visar samma tydliga tomläge', await page.locator('[data-property-clear-filters]').count() == 1 and 'Inga ärenden matchar' in await page.locator('.property-empty').inner_text())
    await test.view('estate1', 'property-registrations')
    test.good('första partnerns egna listval återfinns efter perspektivbyte', await page.locator('#property-query').input_value() == '  Ari  ' and await page.locator('#property-filter').input_value() == 'underway')
    new = await page.evaluate('''()=>{Portal.returnInternal();return Portal.partnerSetup.saveProfile({name:'QA Tom Fastighet AB',partnerType:'property',salesAudiences:[]}).id}''')
    await test.view(new, 'property-registrations')
    test.good('partner utan ärenden får fortsatt relevant registreringsingång', 'Inga ärenden i den här vyn ännu' in await page.locator('.property-empty').inner_text() and await page.locator('.property-empty [data-property-intake]').count() == 1)


async def dates(test):
    await test.fresh()
    page = test.page
    await test.view('estate1', 'property-import')
    for epoch in [False, True]:
        for formatted in [False, True]:
            result = await page.evaluate('''async({epoch,formatted})=>{
              const book=new ExcelJS.Workbook();book.properties.date1904=epoch;
              const sheet=book.addWorksheet('QA Inflyttningar');
              sheet.addRow(['Adress','Postnummer','Ort','Inflyttningsdatum','Namn','E-post']);
              const serial=(Date.UTC(2026,10,1)-(epoch?Date.UTC(1904,0,1):Date.UTC(1899,11,30)))/86400000;
              sheet.addRow(['QA Datavägen 1','222 22','Lund',serial,'QA Datum','date@hyresgast.example']);
              if(formatted)sheet.getCell('D2').numFmt='yyyy-mm-dd';
              const file=new File([await book.xlsx.writeBuffer()],'datum-qa.xlsx',{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
              const rows=await Portal.propertyIntake.parseFile(file);return rows[0];
            }''', {'epoch': epoch, 'formatted': formatted})
            test.good(('1904' if epoch else '1900') + ' datumsystem ger korrekt inflyttningsdatum i ' + ('datumformaterad cell' if formatted else 'numerisk cell'), result['fields']['moveDate'] == '2026-11-01' and result['parseErrors'] == [])
    payload = await page.evaluate('''async()=>{
      const book=new ExcelJS.Workbook();book.properties.date1904=true;
      const sheet=book.addWorksheet('QA');sheet.addRow(['Adress','Postnummer','Ort','Inflyttningsdatum','Namn','E-post']);
      sheet.addRow(['QA Registreringsvägen 1','222 22','Lund',(Date.UTC(2026,10,1)-Date.UTC(1904,0,1))/86400000,'QA Registrerat Datum','registered-date@hyresgast.example']);
      return Array.from(new Uint8Array(await book.xlsx.writeBuffer()));
    }''')
    await page.locator('#pi-excel-file').set_input_files({'name': 'datum1904.xlsx', 'mimeType': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'buffer': bytes(payload)})
    await page.locator('.pi-import-row').wait_for()
    test.good('Excelgranskningen visar rätt 1904-datum före registrering', '2026-11-01' in await page.locator('.pi-import-row').inner_text())
    await page.locator('#pi-import-confirm').check()
    await page.locator('#pi-import-save').click()
    await page.locator('.pi-success').wait_for()
    test.good('Excelregistreringen sparar det korrekta 1904-datumet', await page.evaluate('Portal.state.moveins.find(row=>row.email==="registered-date@hyresgast.example").moveDate') == '2026-11-01')


async def recovered_draft(test):
    await test.fresh()
    page = test.page
    await test.view('estate1', 'property-manual')
    await page.locator('#pi-fill-example').click()
    await page.locator('#pi-authority-manual').set_input_files(_intake.pdf_file('bevarad-fullmakt.pdf'))
    await page.locator('[data-pi-download]').wait_for()
    await page.evaluate('''()=>{window.qaStorageRemove=Storage.prototype.removeItem;
      Storage.prototype.removeItem=function(key){if(String(key).includes('partnerIntake'))throw Error('QA blocked removal');return window.qaStorageRemove.call(this,key)};}''')
    await page.locator('[name=demoOnly]').check()
    await page.locator('#pi-manual-form button[type=submit]').click()
    await page.locator('.pi-success').wait_for()
    rid = await page.evaluate('Portal.state.moveins.find(row=>row.intakeSource==="manual").id')
    row = await test.row(rid)
    meta = row['authorityFiles'][0]
    test.good('lyckad registrering med misslyckad utkaststädning visas ärligt', 'tidigare utkastet kunde inte rensas' in await page.locator('.pi-success').inner_text())
    await page.evaluate('()=>{Storage.prototype.removeItem=window.qaStorageRemove;delete window.qaStorageRemove}')
    await page.reload(wait_until='networkidle')
    await page.locator('#pi-manual-form').wait_for()
    test.good('ett kvarvarande utkast kan återställas utan att ärendet dupliceras', await page.locator('[data-pi-remove]').count() == 1 and len([row for row in (await test.state())['moveins'] if row.get('intakeSource') == 'manual']) == 1)
    await page.locator('[data-pi-remove]').click()
    await page.wait_for_function('document.querySelectorAll("[data-pi-remove]").length===0')
    test.good('borttagning ur återställt utkast bevarar registrerat ärendes fullmaktsbytes', await test.attachment_exists(meta))
    actual, name = await test.download_meta(meta, 'recovered-draft-authority.pdf')
    test.good('det registrerade ärendets bilaga kan hämtas med ursprungliga bytes', actual == _intake.PDF_A and name == 'bevarad-fullmakt.pdf')
    test.good('borttagning ur utkast ändrar inte det registrerade ärendet', await test.row(rid) == row)
    await test.view('estate1', 'property-registrations')
    test.good('ärendet kan förmedlas efter att utkastets referens tagits bort', await page.evaluate('(id)=>Portal.moveinService.forwardChecked(id)', rid))


async def shared_reference(test):
    await test.fresh()
    page = test.page
    await test.view('estate1')
    meta = await test.attach_by_api('delad-testfullmakt.pdf')
    base = {'partner': 'estate1', 'name': 'QA Bilagekoppling Ett', 'email': 'file-one@hyresgast.example', 'address': 'QA Bilagevägen 1', 'postcode': '222 22', 'city': 'Lund', 'moveDate': '2026-11-01', 'authorityFiles': [meta]}
    first = (await test.api_create(base))['created'][0]['id']
    second = (await test.api_create({**base, 'name': 'QA Bilagekoppling Två', 'email': 'file-two@hyresgast.example'}))['created'][0]['id']
    await page.evaluate('(id)=>Portal.moveinService.open(id)', first)
    page.once('dialog', lambda dialog: dialog.accept())
    await page.locator('[data-attachment-remove]').click()
    await page.wait_for_function('(id)=>Portal.state.moveins.find(row=>row.id===id).authorityFiles.length===0', arg=first)
    await page.locator('[data-attachment-remove]').wait_for(state='detached')
    test.good('bortkoppling från ett ärende bevarar annat ärendes fullmakt', await test.attachment_exists(meta) and (await test.row(second))['authorityFiles'][0]['id'] == meta['id'])
    await page.locator('#close-dialog').click()
    await page.evaluate('(id)=>Portal.moveinService.open(id)', second)
    page.once('dialog', lambda dialog: dialog.accept())
    await page.locator('[data-attachment-remove]').click()
    await page.locator('[data-attachment-remove]').wait_for(state='detached')
    test.good('bytes tas bort när sista ärendereferensen uttryckligen tas bort', not await test.attachment_exists(meta) and (await test.row(second))['authorityFiles'] == [])


async def malformed_cases(test):
    await test.fresh()
    page = test.page
    await page.evaluate('''()=>{Portal.state.moveins.unshift(null,42,'QA gammal post',[],{legacyMarker:'KEEP'});Portal.state.moveinServiceSeeded=false;Portal.save();}''')
    await page.reload(wait_until='networkidle')
    test.good('äldre felaktiga poster slår inte ut ärendeinitialisering', await page.evaluate('Portal.moveinService.rows().length') == 3)
    test.good('okända äldre poster bevaras utan dataradering', await page.evaluate('Portal.state.moveins.slice(0,5)') == [None, 42, 'QA gammal post', [], {'legacyMarker': 'KEEP'}])
    await test.view('estate1', 'property-registrations')
    test.good('ärendelistan visar giltiga ärenden trots felaktiga äldre poster', await page.locator('.property-table tbody tr').count() == 2)
    await test.view('estate1', 'property-import')
    await page.locator('#pi-excel-file').set_input_files(_intake.xlsx_file('malformed-state-qa.xlsx', _intake.workbook(_intake.HEADERS, [['QA Nyvägen 1', '1001', '222 22', 'Lund', '2026-11-01', 'QA Ny Rad', 'new-row@hyresgast.example', '']])))
    await page.locator('.pi-import-row').wait_for()
    test.good('Excelgranskning fungerar trots felaktiga äldre ärendeposter', await page.locator('.pi-row-invalid').count() == 0 and not await page.locator('#pi-import-save').is_disabled())


async def run():
    OUT.mkdir(parents=True, exist_ok=True)
    async with async_playwright() as pw:
        executable = shutil.which('chromium') or shutil.which('chromium-browser')
        if not executable:
            raise RuntimeError('Installed Chromium is required')
        browser = await pw.chromium.launch(executable_path=executable, args=['--no-sandbox'])
        test = Suite(browser)
        try:
            for task in [save_failure, filters, dates, recovered_draft, shared_reference, malformed_cases]:
                await task(test)
            test.good('inga scriptfel i de reproducerade regressionerna', not test.errors)
            (OUT / 'bug-property.json').write_text(json.dumps({'checks': test.checks, 'errors': test.errors}, ensure_ascii=False, indent=2))
            print(f'PASS {len(test.checks)} fastighetsregressioner', flush=True)
        except Exception:
            if test.page:
                await test.page.screenshot(path=str(OUT / 'failure.png'), full_page=True)
            (OUT / 'bug-property-failure.json').write_text(json.dumps({'checks': test.checks, 'errors': test.errors, 'traceback': traceback.format_exc()}, ensure_ascii=False, indent=2))
            raise
        finally:
            await browser.close()


if __name__ == '__main__':
    asyncio.run(run())
