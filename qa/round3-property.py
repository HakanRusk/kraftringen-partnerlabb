"""Third-round checks: stable attachment targets and Excel date boundaries.

Uses fictional PDF/XLSX inputs and the installed browser. A delayed storage
boundary allows actual rapid button actions before a deletion completes.
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
OUT = pathlib.Path(os.environ.get('PARTNERLABB_QA_SHOTS', '/tmp/partnerlabb-round3-property'))


async def rapid_attachments(test):
    await test.fresh()
    page = test.page
    await test.view('estate1')
    metas = []
    for name in ['A', 'B', 'C']:
        metas.append(await test.attach_by_api(name + '.pdf', b'%PDF-1.4\nQA ' + name.encode() + b'\n%%EOF\n'))
    result = await test.api_create({'partner': 'estate1', 'name': 'QA Snabba Bilagor', 'email': 'rapid@hyresgast.example', 'address': 'QA Snabbgatan 1', 'postcode': '222 22', 'city': 'Lund', 'moveDate': '2026-11-01', 'authorityFiles': metas})
    rid = result['created'][0]['id']
    await page.evaluate('(id)=>Portal.moveinService.open(id)', rid)
    await page.evaluate('''()=>{window.qaRealRemove=Portal.moveinAttachments.removeUnreferenced;
      window.qaRemovalCalls=[];window.qaRemovalGates=[];
      Portal.moveinAttachments.removeUnreferenced=meta=>{window.qaRemovalCalls.push(meta.name);return new Promise(resolve=>window.qaRemovalGates.push(()=>window.qaRealRemove(meta).then(resolve)))};}''')
    page.once('dialog', lambda dialog: dialog.accept())
    await page.locator('[data-attachment-remove="0"]').click()
    test.good('första borttagningen kopplar bort A medan lokal radering väntar', [meta['name'] for meta in (await test.row(rid))['authorityFiles']] == ['B.pdf', 'C.pdf'])
    async with page.expect_download() as event:
        await page.locator('[data-attachment-download="1"]').click()
    download = await event.value
    target = OUT / 'rapid-download-B.pdf'
    await download.save_as(str(target))
    test.good('Hämta B efter att A kopplats bort hämtar fortfarande B', download.suggested_filename == 'B.pdf' and target.read_bytes() == b'%PDF-1.4\nQA B\n%%EOF\n')
    await page.locator('[data-attachment-download="0"]').click()
    test.good('Hämta bortkopplad A visar korrekt fel och väljer inte annan fil', 'redan bortkopplad' in await page.locator('#movein-attachment-feedback').inner_text())
    page.once('dialog', lambda dialog: dialog.accept())
    await page.locator('[data-attachment-remove="1"]').click()
    test.good('snabb borttagning av B väljer B:s stabila identifierare', await page.evaluate('window.qaRemovalCalls') == ['A.pdf', 'B.pdf'])
    test.good('snabb borttagning lämnar C:s koppling kvar', [meta['name'] for meta in (await test.row(rid))['authorityFiles']] == ['C.pdf'])
    await page.evaluate('''async()=>{Portal.moveinAttachments.removeUnreferenced=window.qaRealRemove;
      await Promise.all(window.qaRemovalGates.map(release=>release()));}''')
    await page.wait_for_function('(id)=>document.querySelector(".movein-service-detail")?.dataset.caseId===id && document.querySelectorAll("[data-attachment-remove]").length===1', arg=rid)
    test.good('lokal radering tar bort A och B:s bytes och bevarar C:s bytes', not await test.attachment_exists(metas[0]) and not await test.attachment_exists(metas[1]) and await test.attachment_exists(metas[2]))
    events = (await test.row(rid))['events']
    deleted = [event['text'] for event in events if 'tog bort fullmaktsbilagan' in event.get('text', '')]
    test.good('ärendehistoriken innehåller rätt två filnamn', len(deleted) == 2 and any('A.pdf' in event for event in deleted) and any('B.pdf' in event for event in deleted) and not any('C.pdf' in event for event in deleted))
    await page.reload(wait_until='networkidle')
    test.good('C:s återstående koppling och bytes består efter omladdning', [meta['name'] for meta in (await test.row(rid))['authorityFiles']] == ['C.pdf'] and await test.attachment_exists(metas[2]))


async def date_boundaries(test):
    await test.fresh()
    await test.view('estate1', 'property-import')
    results = await test.page.evaluate('''async()=>{
      const dates=['2000-01-01','2000-02-29','2028-02-29','2100-02-28','2100-12-31'];
      const results=[];
      for(const epoch of [false,true])for(const formatted of [false,true]){
        const book=new ExcelJS.Workbook();book.properties.date1904=epoch;
        const sheet=book.addWorksheet('QA');sheet.addRow(['Adress','Postnummer','Ort','Inflyttningsdatum','Namn','E-post']);
        dates.forEach((date,index)=>{
          const serial=(Date.parse(date+'T00:00:00Z')-(epoch?Date.UTC(1904,0,1):Date.UTC(1899,11,30)))/86400000;
          sheet.addRow(['QA Datumgatan '+index,'222 22','Lund',serial,'QA Gränsdatum','dates-'+index+'@hyresgast.example']);
          if(formatted)sheet.getCell('D'+(index+2)).numFmt='yyyy-mm-dd';
        });
        const rows=await Portal.propertyIntake.parseFile(new File([await book.xlsx.writeBuffer()],'datumgranser.xlsx'));
        rows.forEach((row,index)=>results.push({epoch,formatted,expected:dates[index],actual:row.fields.moveDate,errors:Portal.propertyIntake.validate(row.fields)}));
      }
      return results;
    }''')
    for result in results:
        label = ('1904' if result['epoch'] else '1900') + ' ' + ('formaterat' if result['formatted'] else 'numeriskt') + ' gränsdatum ' + result['expected']
        test.good(label, result['actual'] == result['expected'] and result['errors'] == [])
    invalid = ['1999-12-31', '2101-01-01', '2026-02-29', '2100-02-29', '2026-04-31']
    data = _intake.workbook(_intake.HEADERS, [['QA Ogiltiggatan ' + str(index), '1001', '222 22', 'Lund', date, 'QA Ogiltigt Datum', f'invalid-date-{index}@hyresgast.example', ''] for index, date in enumerate(invalid)])
    await test.page.locator('#pi-excel-file').set_input_files(_intake.xlsx_file('ogiltiga-datum.xlsx', data))
    await test.page.locator('.pi-import-row').nth(4).wait_for()
    test.good('datum utanför gränser och omöjliga kalenderdatum markeras före registrering', await test.page.locator('.pi-row-invalid').count() == 5 and await test.page.locator('[data-pi-select]:checked').count() == 0 and await test.page.locator('#pi-import-save').is_disabled())


async def cancelled_case_upload(test):
    await test.fresh()
    await test.view('estate1')
    result = await test.api_create({'partner': 'estate1', 'name': 'QA Avbruten Bilaga', 'email': 'cancel@hyresgast.example', 'address': 'QA Avbrottsgatan 1', 'postcode': '222 22', 'city': 'Lund', 'moveDate': '2026-11-01'})
    rid = result['created'][0]['id']
    await test.page.evaluate('(id)=>Portal.moveinService.open(id)', rid)
    await test.page.evaluate('''()=>{window.qaStoreFiles=Portal.moveinAttachments.storeFiles;
      Portal.moveinAttachments.storeFiles=async(...args)=>{const metas=await window.qaStoreFiles(...args);window.qaPendingMetas=metas;return new Promise(resolve=>{window.qaReleaseUpload=()=>resolve(metas)})};}''')
    await test.page.locator('#movein-attachment-files').set_input_files(_intake.pdf_file('avbruten-bilaga.pdf'))
    await test.page.wait_for_function('typeof window.qaReleaseUpload==="function"')
    await test.page.evaluate('Portal.previewPartner("estate2")')
    await test.page.evaluate('()=>{Portal.moveinAttachments.storeFiles=window.qaStoreFiles;window.qaReleaseUpload()}')
    await test.page.wait_for_timeout(100)
    test.good('byte till annan partner under pågående bilaga ändrar inte tidigare ärende', (await test.row(rid))['authorityFiles'] == [])
    test.good('pågående gammal bilaga öppnar inte ärendet över annan partners arbetsyta', await test.page.evaluate('Portal.partner') == 'estate2' and not await test.page.locator('#portal-dialog').evaluate('(node)=>node.open'))


async def run():
    OUT.mkdir(parents=True, exist_ok=True)
    async with async_playwright() as pw:
        executable = shutil.which('chromium') or shutil.which('chromium-browser')
        if not executable:
            raise RuntimeError('Installed Chromium is required')
        browser = await pw.chromium.launch(executable_path=executable, args=['--no-sandbox'])
        test = Suite(browser)
        try:
            for task in [rapid_attachments, date_boundaries, cancelled_case_upload]:
                await task(test)
            test.good('inga scriptfel i tredjerundans fastighetskontroller', not test.errors)
            (OUT / 'round3-property.json').write_text(json.dumps({'checks': test.checks, 'errors': test.errors}, ensure_ascii=False, indent=2))
            print(f'PASS {len(test.checks)} tredjerundans fastighetskontroller', flush=True)
        except Exception:
            if test.page:
                await test.page.screenshot(path=str(OUT / 'failure.png'), full_page=True)
            (OUT / 'round3-property-failure.json').write_text(json.dumps({'checks': test.checks, 'errors': test.errors, 'traceback': traceback.format_exc()}, ensure_ascii=False, indent=2))
            raise
        finally:
            await browser.close()


if __name__ == '__main__':
    asyncio.run(run())
