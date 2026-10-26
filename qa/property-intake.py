"""Browser integration for the property-company-only intake workflow.

Uses actual XLSX files, local PDF bytes and browser storage. The three historical
QA entrypoints call focused parts of this suite; no tenant action is simulated.
"""
import argparse
import asyncio
import html
import io
import json
import os
import pathlib
import shutil
import tempfile
import traceback
import zipfile
from playwright.async_api import async_playwright

BASE = os.environ.get('PARTNERLABB_QA_URL', 'http://127.0.0.1:8000/').rstrip('/') + '/'
OUT = pathlib.Path(os.environ.get('PARTNERLABB_QA_SHOTS', tempfile.mkdtemp(prefix='partnerlabb-intake-qa-')))
PDF_A = b'%PDF-1.4\n% Fictional authority A, QA only\n1 0 obj << /Type /Catalog >> endobj\n%%EOF\n'
PDF_B = b'%PDF-1.4\n% Fictional authority B, QA only\n1 0 obj << /Type /Catalog >> endobj\n%%EOF\n'


def workbook(headers, rows):
    """A real OOXML ZIP workbook with plain text/date cells; no external library."""
    def column(n):
        result = ''
        while n:
            n, r = divmod(n - 1, 26)
            result = chr(65 + r) + result
        return result
    def sheet_row(index, values):
        cells = ''.join(f'<c r="{column(i + 1)}{index}" t="inlineStr"><is><t>{html.escape(str(value))}</t></is></c>' for i, value in enumerate(values))
        return f'<row r="{index}">{cells}</row>'
    stream = io.BytesIO()
    with zipfile.ZipFile(stream, 'w', zipfile.ZIP_DEFLATED) as archive:
        archive.writestr('[Content_Types].xml', '<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>')
        archive.writestr('_rels/.rels', '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>')
        archive.writestr('xl/workbook.xml', '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Inflyttningar" sheetId="1" r:id="rId1"/></sheets></workbook>')
        archive.writestr('xl/_rels/workbook.xml.rels', '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>')
        archive.writestr('xl/worksheets/sheet1.xml', '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>' + ''.join(sheet_row(i + 1, values) for i, values in enumerate([headers] + rows)) + '</sheetData></worksheet>')
    return stream.getvalue()


class Suite:
    def __init__(self, browser):
        self.browser = browser
        self.checks = []
        self.errors = []
        self.page = None
        self.context = None

    def good(self, label, value):
        if not value:
            raise AssertionError(label)
        self.checks.append(label)
        print('PASS ' + label, flush=True)

    async def fresh(self, url=BASE):
        if self.context:
            await self.context.close()
        self.context = await self.browser.new_context(viewport={'width': 1440, 'height': 1000}, locale='sv-SE', accept_downloads=True)
        self.page = await self.context.new_page()
        self.page.on('pageerror', lambda error: self.errors.append(str(error)))
        self.page.set_default_timeout(10000)
        await self.page.goto(url, wait_until='networkidle')
        await self.page.wait_for_function('window.Portal && Portal.moveinService && Portal.propertyIntake')

    async def state(self):
        return await self.page.evaluate('JSON.parse(JSON.stringify(Portal.state))')

    async def row(self, rid):
        return await self.page.evaluate('(id)=>Portal.state.moveins.find(row=>row.id===id)', rid)

    async def finance(self):
        return await self.page.evaluate('({outcome:Object.fromEntries(Portal.commercial.partnerIds.map(id=>[id,Portal.commercial.valuesFor(id)])),kickback:JSON.stringify(Portal.state.kickback||null)})')

    async def view(self, partner=None, route='overview'):
        if partner:
            await self.page.evaluate('(id)=>Portal.previewPartner(id)', partner)
        else:
            await self.page.evaluate('Portal.returnInternal()')
        await self.page.evaluate('(route)=>Portal.go(route)', route)

    async def nooverflow(self, label):
        widths = await self.page.evaluate('({scroll:document.documentElement.scrollWidth,width:document.documentElement.clientWidth})')
        self.good(label, widths['scroll'] <= widths['width'] + 1)

    async def shot(self, name):
        await self.page.screenshot(path=str(OUT / name), full_page=True)

    async def attach_by_api(self, name='fullmakt-a.pdf', content=PDF_A, partner='estate1'):
        return await self.page.evaluate('''async({name,bytes,partner})=>{
            const file=new File([new Uint8Array(bytes)],name,{type:'application/pdf'});
            return (await Portal.moveinAttachments.storeFiles([file],partner))[0];
        }''', {'name': name, 'bytes': list(content), 'partner': partner})

    async def attachment_exists(self, meta):
        return await self.page.evaluate('(meta)=>Portal.moveinAttachments.exists(meta)', meta)

    async def api_create(self, values, source='manual'):
        return await self.page.evaluate('({values,source})=>Portal.moveinService.createPartnerRecords([values],{source})', {'values': values, 'source': source})

    async def download_meta(self, meta, filename):
        async with self.page.expect_download() as event:
            await self.page.evaluate('(meta)=>Portal.moveinAttachments.download(meta)', meta)
        download = await event.value
        target = OUT / filename
        await download.save_as(str(target))
        return target.read_bytes(), download.suggested_filename


HEADERS = ['Adress', 'Lägenhet', 'Postnummer', 'Ort', 'Inflyttningsdatum', 'Namn', 'E-post', 'Telefon']


def xlsx_file(name, data):
    return {'name': name, 'mimeType': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'buffer': data}


def pdf_file(name='fullmakt-a.pdf', content=PDF_A):
    return {'name': name, 'mimeType': 'application/pdf', 'buffer': content}


async def open_manual(test, partner='estate1'):
    await test.page.evaluate('(partner)=>Portal.propertyIntake.open("manual",partner)', partner)
    await test.page.locator('#pi-manual-form').wait_for()


async def manual_values(test, name='QA Inflyttare', email='qa@hyresgast.example', address='QAgatan 5'):
    await test.page.locator('#pi-fill-example').click()
    await test.page.locator('#pi-name').fill(name)
    await test.page.locator('#pi-email').fill(email)
    await test.page.locator('#pi-address').fill(address)


async def save_manual(test):
    await test.page.locator('[name=demoOnly]').check()
    await test.page.locator('#pi-manual-form button[type=submit]').click()
    await test.page.locator('.pi-success').wait_for()


async def open_case(test, rid, internal=False):
    if internal:
        await test.view(None, 'movein-cases')
        await test.page.locator(f'[data-service-case="{rid}"]').first.click()
    else:
        await test.view('estate1', 'property-registrations')
        await test.page.locator(f'[data-movein-detail="{rid}"]').first.click()


async def service_checks(test):
    await test.fresh()
    page = test.page
    baseline = await test.state()
    base_finance = await test.finance()
    counters = {key: len(baseline[key]) for key in ['records', 'offers', 'consumerSales']}
    await test.view('estate1')
    test.good('fastighetspartner saknar intern ärendemeny', await page.locator('#nav [data-go="movein-cases"]').count() == 0)
    await page.evaluate('Portal.openMovein("estate1")')
    test.good('två registreringsvägar för fastighetsbolaget', await page.locator('[data-pi-mode="manual"]').count() == 1 and await page.locator('[data-pi-mode="import"]').count() == 1)
    test.good('inget hyresgästformulär eller samtyckessteg i arbetsytan', await page.locator('#property-movein-form,#movein-service,#movein-authority').count() == 0)
    await page.locator('[data-pi-mode="manual"]').click()
    await manual_values(test)
    await page.locator('#pi-email').fill('qa@gmail.com')
    await page.locator('[name=demoOnly]').check()
    await page.locator('#pi-manual-form button[type=submit]').click()
    test.good('riktig e-postdomän kan inte registreras', len((await test.state())['moveins']) == len(baseline['moveins']))
    await page.locator('#pi-email').fill('qa@hyresgast.example')
    await save_manual(test)
    current = await test.state()
    added = [row for row in current['moveins'] if row['id'] not in {row['id'] for row in baseline['moveins']}]
    test.good('manuell registrering skapar exakt ett underlag', len(added) == 1)
    row = added[0]
    rid = row['id']
    test.good('saknad fullmakt visas på registreringskvittot', 'saknar fullmakt' in await page.locator('.pi-success').inner_text())
    test.good('registrering skapar inte fullmakt eller förmedling', row['intakeSource'] == 'manual' and row['handoverStatus'] == 'draft' and row['authorityFiles'] == [] and not row['authorityDemo'])
    test.good('saknad fullmakt blockerar API-förmedling', not await page.evaluate('(id)=>Portal.moveinService.forward(id)', rid))
    await page.locator('[data-pi-records]').click()
    await page.locator(f'[data-movein-detail="{rid}"]').first.click()
    test.good('saknad fullmakt blockerar förmedlingsknappen', await page.locator('#movein-service-forward-form button[type=submit]').is_disabled())
    await page.locator('#movein-attachment-files').set_input_files(pdf_file())
    await page.wait_for_function('(id)=>Portal.state.moveins.find(r=>r.id===id).authorityFiles.length===1', arg=rid)
    await page.locator('#movein-service-forward-form').wait_for()
    meta = (await test.row(rid))['authorityFiles'][0]
    test.good('verkliga PDF-bytes kopplas till rätt lokala ärende', meta['partner'] == 'estate1' and meta['scope'] == 'normal' and meta['size'] == len(PDF_A) and await test.attachment_exists(meta))
    async with page.expect_download() as event:
        await page.locator('[data-attachment-download="0"]').click()
    download = await event.value
    target = OUT / 'case-authority-before-reload.pdf'
    await download.save_as(str(target))
    test.good('ärendedialogen hämtar exakt bifogad PDF', target.read_bytes() == PDF_A and download.suggested_filename == 'fullmakt-a.pdf')
    await page.locator('#close-dialog').click()
    await page.reload(wait_until='networkidle')
    await open_case(test, rid)
    await page.wait_for_function('document.querySelector("[data-attachment-status]")?.textContent.includes("Sparad")')
    content, filename = await test.download_meta(meta, 'case-authority-after-reload.pdf')
    test.good('PDF och koppling består efter omladdning', content == PDF_A and filename == meta['name'] and (await test.row(rid))['authorityFiles'][0]['id'] == meta['id'])
    await page.locator('#movein-service-forward-form textarea').fill('QA registrerat av fastighetsbolaget')
    await page.locator('#movein-service-forward-form button[type=submit]').click()
    await page.wait_for_function('(id)=>Portal.state.moveins.find(r=>r.id===id).handoverStatus==="submitted"', arg=rid)
    test.good('förmedling sker först genom partnerns uttryckliga handling', (await test.row(rid))['handoverStatus'] == 'submitted')
    await open_case(test, rid, internal=True)
    test.good('Kraftringen får separata elhandel- och elnätskontroller', await page.locator('[name=trade]').count() == 1 and await page.locator('[name=network]').count() == 1)
    test.good('intern handläggare kan hämta men inte ändra fullmaktsbilagor', await page.locator('[data-attachment-download="0"]').count() == 1 and await page.locator('#movein-attachment-files,[data-attachment-remove]').count() == 0)
    await page.locator('[name=handoverStatus]').select_option('needs_info')
    await page.locator('[name=trade]').select_option('handling')
    await page.locator('[name=next]').fill('QA komplettera lägenhetsuppgiften')
    await page.locator('[name=feedback]').fill('QA partneråterkoppling')
    await page.locator('[name=privateNote]').fill('QA ENDAST INTERN')
    await page.locator('#movein-service-internal-form button[type=submit]').click()
    await open_case(test, rid)
    visible = await page.locator('#dialog-body').inner_text()
    test.good('partner ser återkoppling men inte intern anteckning', 'QA partneråterkoppling' in visible and 'QA ENDAST INTERN' not in visible)
    await page.locator('[name=partnerReply]').fill('QA komplettering från fastighetsbolaget')
    await page.locator('#movein-service-forward-form button[type=submit]').click()
    await page.wait_for_function('(id)=>Portal.state.moveins.find(r=>r.id===id).handoverStatus==="submitted"', arg=rid)
    updated = await test.row(rid)
    test.good('komplettering kan förmedlas utan att tidigare plan tilldelas Kraftringen', updated['submissionType'] == 'supplement' and updated['next'] == '' and any('Tidigare kompletteringsplan avslutad' in item['text'] for item in updated['events']))
    await open_case(test, rid, internal=True)
    await page.locator('[name=handoverStatus]').select_option('confirmed')
    await page.locator('#movein-service-internal-form button[type=submit]').click()
    test.good('återkoppling klar kräver båda handläggningsdelarna', (await test.row(rid))['handoverStatus'] == 'submitted')
    await page.locator('[name=trade]').select_option('confirmed')
    await page.locator('[name=network]').select_option('confirmed')
    await page.locator('[name=offerChoice]').select_option('declined')
    await page.locator('[name=feedback]').fill('QA inflyttningshjälp klar utan nytt elhandelsavtal')
    await page.locator('#movein-service-internal-form button[type=submit]').click()
    test.good('service kan slutföras utan elhandelsavtal', (await test.row(rid))['handoverStatus'] == 'confirmed' and (await test.row(rid))['processing']['offerChoice'] == 'declined')
    await page.reload(wait_until='networkidle')
    test.good('handläggning och återkoppling består efter omladdning', (await test.row(rid))['handoverStatus'] == 'confirmed')

    # A real downloaded .xlsx template enters the actual preview workflow.
    await page.evaluate('Portal.propertyIntake.open("import","estate1")')
    async with page.expect_download() as event:
        await page.locator('#pi-template').click()
    download = await event.value
    template = OUT / 'downloaded-template.xlsx'
    await download.save_as(str(template))
    with zipfile.ZipFile(template) as archive:
        template_entries = set(archive.namelist())
    test.good('Excel-mallen är en riktig XLSX-arbetsbok', download.suggested_filename.endswith('.xlsx') and 'xl/workbook.xml' in template_entries and 'xl/worksheets/sheet1.xml' in template_entries)
    before_excel = len((await test.state())['moveins'])
    await page.locator('#pi-excel-file').set_input_files(str(template))
    await page.locator('.pi-import-row').nth(1).wait_for()
    test.good('Excel visas för granskning innan registrering', await page.locator('.pi-import-row').count() == 2 and len((await test.state())['moveins']) == before_excel)
    await page.locator('#pi-authority-0').set_input_files(pdf_file('kim-fullmakt.pdf', PDF_A))
    await page.locator('[data-pi-download="0"][data-pi-row="0"]').wait_for()
    await page.locator('#pi-authority-1').set_input_files(pdf_file('robin-fullmakt.pdf', PDF_B))
    await page.locator('[data-pi-download="0"][data-pi-row="1"]').wait_for()
    await page.locator('#pi-import-confirm').check()
    await page.locator('#pi-import-save').click()
    await page.locator('.pi-success').wait_for()
    excel_rows = [row for row in (await test.state())['moveins'] if row.get('intakeSource') == 'excel']
    test.good('Excel skapar två separata serviceunderlag', len(excel_rows) == 2 and all(row['handoverStatus'] == 'draft' and not row['authorityDemo'] for row in excel_rows))
    kim = next(row for row in excel_rows if row['name'] == 'Kim Exempel')
    robin = next(row for row in excel_rows if row['name'] == 'Robin Exempel')
    kim_bytes, kim_name = await test.download_meta(kim['authorityFiles'][0], 'excel-kim.pdf')
    robin_bytes, robin_name = await test.download_meta(robin['authorityFiles'][0], 'excel-robin.pdf')
    test.good('varje Excel-rad behåller rätt fullmakt och filinnehåll', kim_bytes == PDF_A and robin_bytes == PDF_B and kim_name == 'kim-fullmakt.pdf' and robin_name == 'robin-fullmakt.pdf' and kim['authorityFiles'][0]['id'] != robin['authorityFiles'][0]['id'])
    await page.reload(wait_until='networkidle')
    test.good('Excel-radernas fullmakter består efter omladdning', await test.attachment_exists(kim['authorityFiles'][0]) and await test.attachment_exists(robin['authorityFiles'][0]))
    await page.evaluate('Portal.propertyIntake.open("import","estate1")')
    await page.locator('#pi-excel-file').set_input_files(str(template))
    await page.locator('.pi-import-row').nth(1).wait_for()
    test.good('samma Excel-fil visar dubbletter och kan inte skapa igen', await page.locator('.pi-row-invalid').count() == 2 and await page.locator('#pi-import-save').is_disabled() and len((await test.state())['moveins']) == before_excel + 2)
    await page.evaluate('Portal.propertyIntake.clearDrafts();Portal.propertyIntake.open("import","estate1")')
    invalid_rows = [
        ['Testgatan 9', '1001', '222 22', 'Lund', '2026-11-22', '', 'valid@hyresgast.example', ''],
        ['Testgatan 9', '1001', '222 22', 'Lund', '2026-11-22', 'Giltig QA', 'valid@hyresgast.example', ''],
        ['Testgatan 10', '1002', '222 22', 'Lund', '2026-02-30', 'Ogiltig QA', 'invalid@hyresgast.example', ''],
        ['Testgatan 9', '1001', '222 22', 'Lund', '2026-11-22', 'Dubblett QA', 'valid@hyresgast.example', ''],
    ]
    await page.locator('#pi-excel-file').set_input_files(xlsx_file('kontrollrader.xlsx', workbook(HEADERS, invalid_rows)))
    await page.locator('.pi-import-row').nth(3).wait_for()
    test.good('en felaktig rad blockerar inte en senare korrigerad rad', not await page.locator('[data-pi-select="1"]').is_disabled() and await page.locator('[data-pi-select="1"]').is_checked())
    test.good('ogiltiga datum och interna dubbletter markeras och spärras', await page.locator('.pi-row-invalid').count() == 3 and await page.locator('[data-pi-select="0"]').is_disabled() and await page.locator('[data-pi-select="2"]').is_disabled() and await page.locator('[data-pi-select="3"]').is_disabled())
    await page.locator('#pi-import-confirm').check()
    await page.locator('#pi-import-save').click()
    await page.locator('.pi-success').wait_for()
    test.good('endast uttryckligen valda giltiga Excel-rader registreras', len((await test.state())['moveins']) == before_excel + 3 and not any(row['name'] in ['Ogiltig QA', 'Dubblett QA'] for row in (await test.state())['moveins']))
    await page.evaluate('Portal.propertyIntake.open("import","estate1")')
    before_invalid = len((await test.state())['moveins'])
    await page.locator('#pi-excel-file').set_input_files(xlsx_file('trasig.xlsx', b'not an OOXML workbook'))
    await page.locator('.pi-error').wait_for()
    test.good('trasig XLSX ger läsfel och skapar inget underlag', 'kunde inte läsas' in await page.locator('.pi-error').inner_text() and len((await test.state())['moveins']) == before_invalid)
    await page.locator('#pi-excel-file').set_input_files(xlsx_file('saknad-kolumn.xlsx', workbook(['Adress'], [['Testvägen 1']])))
    await page.locator('.pi-error').wait_for()
    test.good('saknade Excel-kolumner ger begripligt fel utan registrering', 'Kolumner saknas' in await page.locator('.pi-error').inner_text() and len((await test.state())['moveins']) == before_invalid)
    await open_manual(test)
    await page.locator('#pi-authority-manual').set_input_files(pdf_file('felaktig.pdf', b'not a PDF'))
    await page.locator('.pi-error').wait_for()
    test.good('förfalskad PDF-extension räknas inte som bilaga', 'innehåll matchar inte' in await page.locator('.pi-error').inner_text() and await page.locator('[data-pi-download]').count() == 0)
    await test.view('estate2', 'property-registrations')
    test.good('annan fastighetspartner ser inte nyregistrerade hyresgäster', 'QA Inflyttare' not in await page.locator('#view').inner_text() and not await test.attachment_exists(meta))
    await page.evaluate('Portal.go("movein-cases")')
    test.good('partner kan inte öppna intern handläggningsvy', await page.evaluate('Portal.page') == 'overview')

    for width in [1440, 390, 320]:
        await page.set_viewport_size({'width': width, 'height': 1000 if width == 1440 else 844})
        for route in ['overview', 'property-intake', 'property-manual', 'property-import', 'property-registrations']:
            await test.view('estate1', route)
            await test.nooverflow(f'{route} vid {width}px')
            if route in ['property-intake', 'property-manual']:
                await test.shot(f'intake-{route}-{width}.png')
        await open_case(test, kim['id'])
        await test.nooverflow(f'partnerns bilagedialog vid {width}px')
        await test.shot(f'intake-partner-dialog-{width}.png')
        await open_case(test, rid, internal=True)
        await test.nooverflow(f'intern handläggningsdialog vid {width}px')
        await test.shot(f'intake-internal-dialog-{width}.png')
        await page.locator('#close-dialog').click()
    current = await test.state()
    test.good('inflyttningskedjan skapar inga säljposter, avtal eller kickback', all(len(current[key]) == count for key, count in counters.items()) and await test.finance() == base_finance)
    await page.set_viewport_size({'width': 1440, 'height': 1000})
    sales_before = await page.evaluate('JSON.stringify({records:Portal.state.records,offers:Portal.state.offers,consumerSales:Portal.state.consumerSales,businessDetails:Portal.state.businessDetails})')
    # Sales work now happens outside Partnerlabb. Regression follows each
    # partner's current own results and insights, preserving legacy drafts.
    for partner, name, legacy_route in [('syd', 'Savera', 'business-brief'), ('vast', 'Face2face', 'consumer-sales')]:
        await test.view(partner, 'partner-sales')
        test.good(f'{name} kan fortsatt följa sina egna kunder och avtal efter inflyttningskedjan', await page.locator('h1').inner_text() == name and await page.locator('[data-sr-record]').count() > 0 and await page.evaluate('Portal.selectedPartnerId') == partner)
        await page.locator('.ow-tabs [data-go="partner-insights"]').click()
        test.good(f'{name} kan fortsatt nå egna Insikter och kundtid', await page.locator('h1').inner_text() == name and await page.locator('.savera-insights .sr-tenure').count() == 1 and await page.evaluate('Portal.selectedPartnerId') == partner)
        await page.evaluate('(route)=>Portal.go(route)', legacy_route)
        test.good(f'{name} återinför inte äldre aktiv säljregistrering', await page.evaluate('Portal.page') == 'overview' and await page.locator('[data-business-offer],[data-consumer-new],#consumer-record-form').count() == 0)
    test.good('säljpartnernas resultat och Insikter bevarar alla äldre säljunderlag och ekonomiska exempel', await page.evaluate('JSON.stringify({records:Portal.state.records,offers:Portal.state.offers,consumerSales:Portal.state.consumerSales,businessDetails:Portal.state.businessDetails})') == sales_before and await test.finance() == base_finance)

    legacy = await test.state()
    legacy['moveins'] = [{'id': 'legacy-qa', 'partner': 'estate1', 'name': 'Äldre QA', 'email': 'legacy@hyresgast.example', 'address': 'Äldrevägen 2', 'moveDate': '2026-11-01', 'legacyField': 'KEEP'}]
    legacy['moveinServiceSeeded'] = True
    legacy['training']['qa-sentinel'] = {'done': True, 'marker': 'KEEP'}
    legacy['propertySettings']['estate1']['welcome'] = 'QA BEVARAD RUBRIK'
    legacy_draft = json.dumps({'version': 1, 'partner': 'estate1', 'step': 2, 'fields': {'address': 'Äldre utkast', 'name': 'Äldre QA'}})
    await page.evaluate('({state,draft})=>{localStorage.setItem("partnerlabb.portal.v2",JSON.stringify(state));sessionStorage.setItem("partnerlabb.moveinDraft.v1.estate1",draft)}', {'state': legacy, 'draft': legacy_draft})
    await page.goto(BASE, wait_until='networkidle')
    old = await test.row('legacy-qa')
    test.good('äldre ärende får inte nytt uppdrag, fullmakt eller förmedling', old['legacyField'] == 'KEEP' and not old['serviceRequested'] and not old['authorityDemo'] and old['authorityFiles'] == [] and old['handoverStatus'] == 'draft')
    await test.view('estate1', 'property-intake')
    test.good('äldre utkast och annan moduldata bevaras vid ny arbetsyta', await page.evaluate('sessionStorage.getItem("partnerlabb.moveinDraft.v1.estate1")') == legacy_draft and (await test.state())['training']['qa-sentinel']['marker'] == 'KEEP' and (await test.state())['propertySettings']['estate1']['welcome'] == 'QA BEVARAD RUBRIK')
    await page.goto(BASE + '?movein=estate1', wait_until='networkidle')
    test.good('äldre inflyttningslänk öppnar fastighetsbolagets två ingångar', await page.locator('[data-pi-mode="manual"]').count() == 1 and await page.locator('#property-movein-form').count() == 0 and await page.evaluate('Portal.role==="partner"&&Portal.partner==="estate1"'))


async def draft_checks(test):
    await test.fresh()
    page = test.page
    await open_manual(test)
    key = await page.evaluate('Portal.propertyIntake.draftPrefix+"estate1:manual"')
    before = len((await test.state())['moveins'])
    await manual_values(test, name='Utkast QA', email='draft@hyresgast.example', address='Utkastvägen 4')
    await page.locator('#pi-authority-manual').set_input_files(pdf_file('utkast-fullmakt.pdf', PDF_A))
    await page.locator('[data-pi-download]').wait_for()
    await page.locator('[name=demoOnly]').check()
    await page.reload(wait_until='networkidle')
    test.good('manuella fält och bilaga återfinns efter omladdning', await page.locator('#pi-name').input_value() == 'Utkast QA' and await page.locator('[data-pi-download]').count() == 1)
    test.good('testbekräftelse återställs och utkast skapar inget ärende', not await page.locator('[name=demoOnly]').is_checked() and len((await test.state())['moveins']) == before)
    async with page.expect_download() as event:
        await page.locator('[data-pi-download]').click()
    download = await event.value
    path = OUT / 'draft-reload-authority.pdf'
    await download.save_as(str(path))
    test.good('utkastets bilaga består med identiska bytes', path.read_bytes() == PDF_A)
    await open_manual(test, 'estate2')
    test.good('utkast är isolerade mellan fastighetspartnerna', await page.locator('#pi-name').input_value() == '' and await page.locator('[data-pi-download]').count() == 0)
    await open_manual(test)
    test.good('perspektivbyte återfinner tidigare partnerutkast', await page.locator('#pi-name').input_value() == 'Utkast QA')
    await page.evaluate('''(key)=>{const value=JSON.parse(sessionStorage.getItem(key));value.fields.owner='Injected';value.fields.id='Injected';sessionStorage.setItem(key,JSON.stringify(value));}''', key)
    await page.reload(wait_until='networkidle')
    await page.locator('#pi-address').fill('Whitelistvägen 3')
    saved = await page.evaluate('(key)=>JSON.parse(sessionStorage.getItem(key))', key)
    test.good('utkast kan inte injicera ägare eller ärende-id', 'owner' not in saved['fields'] and 'id' not in saved['fields'])
    await page.evaluate('Portal.save=()=>false')
    await page.locator('[name=demoOnly]').check()
    await page.locator('#pi-manual-form button[type=submit]').click()
    await page.locator('.pi-error').wait_for()
    test.good('misslyckad ärendelagring bevarar utkast och tidigare ärenden', len((await test.state())['moveins']) == before and await page.evaluate('(key)=>sessionStorage.getItem(key)!==null', key))
    await page.reload(wait_until='networkidle')
    test.good('bevarat utkast kan återupptas efter lagringsfel', await page.locator('#pi-address').input_value() == 'Whitelistvägen 3')
    await page.evaluate('''()=>Object.defineProperty(window,'sessionStorage',{value:{getItem(){throw Error('Blocked')},setItem(){throw Error('Blocked')},removeItem(){throw Error('Blocked')}},configurable:true})''')
    await page.locator('#pi-name').fill('Ej sparat QA')
    test.good('blockerad utkastlagring visar ett korrekt fel', 'kunde inte sparas' in await page.locator('#pi-draft-status').inner_text())
    await page.evaluate('Portal.propertyIntake.open("choice","estate1")')
    await page.locator('[data-pi-mode="manual"]').focus()
    await page.keyboard.press('Enter')
    test.good('registreringsval fungerar med tangentbord', await page.locator('#pi-manual-form').count() == 1)
    await page.reload(wait_until='networkidle')
    await page.evaluate('(key)=>sessionStorage.setItem(key,"{broken")', key)
    await page.reload(wait_until='networkidle')
    test.good('trasigt utkast laddar ett tomt formulär och skapar inget ärende', await page.locator('#pi-name').input_value() == '' and len((await test.state())['moveins']) == before)

    # Delay actual Blob reading, then change partner before persistence.
    await page.evaluate('''()=>{
        window.qaReadOriginal=Blob.prototype.arrayBuffer;
        window.qaReadReady=false;
        Blob.prototype.arrayBuffer=function(){const blob=this;window.qaReadReady=true;return new Promise(resolve=>{window.qaReleaseRead=()=>window.qaReadOriginal.call(blob).then(resolve)})};
        window.qaUploadPromise=Portal.moveinAttachments.storeFiles([new File(['%PDF-1.4\\nQA race\\n'],'race.pdf',{type:'application/pdf'})],'estate1').then(()=>({stored:true}),error=>({stored:false,message:error.message}));
    }''')
    await page.wait_for_function('window.qaReadReady')
    await page.evaluate('Portal.previewPartner("estate2");Blob.prototype.arrayBuffer=window.qaReadOriginal;window.qaReleaseRead()')
    result = await page.evaluate('window.qaUploadPromise')
    test.good('perspektivbyte under filinläsning avbryter förra partnerns uppladdning', not result['stored'] and bool(result.get('message')))


async def demo_checks(test):
    await test.fresh()
    page = test.page
    await test.view('estate1')
    normal_meta = await test.attach_by_api('normal-fullmakt.pdf', PDF_A)
    normal_values = {'partner': 'estate1', 'name': 'Normal QA', 'email': 'normal@hyresgast.example', 'address': 'Normalvägen 1', 'postcode': '222 22', 'city': 'Lund', 'moveDate': '2026-11-01', 'authorityFiles': [normal_meta]}
    normal_result = await test.api_create(normal_values)
    normal_id = normal_result['created'][0]['id']
    await open_manual(test)
    await page.locator('#pi-address').fill('Bevarat normalt utkast')
    normal_draft_key = await page.evaluate('Portal.propertyIntake.draftPrefix+"estate1:manual"')
    normal_draft = await page.evaluate('(key)=>sessionStorage.getItem(key)', normal_draft_key)
    normal = await page.evaluate('localStorage.getItem("partnerlabb.portal.v2")')
    await page.locator('.demo-launch-link').click()
    await page.wait_for_function('Portal.demoMode&&Portal.page==="demo"')
    initial = await test.state()
    finances = await test.finance()
    test.good('kunddemot har separata ärenden och bilageomfång', normal_id not in {row['id'] for row in initial['moveins']} and await page.evaluate('Portal.moveinAttachments.scope') == 'demo' and not await test.attachment_exists(normal_meta))
    await page.locator('[data-demo-step="1"]').first.click()
    for number in [2, 3, 4, 5]:
        await page.locator(f'#demo-guide .demo-guide-step[data-demo-step="{number}"]').click()
    current = await test.state()
    test.good('fem demoperspektiv skapar inga ärenden, avtal eller ekonomi', current['moveins'] == initial['moveins'] and current['records'] == initial['records'] and await test.finance() == finances)
    await page.evaluate('Portal.demoGuide.openStep(2)')
    test.good('demot visar partnerregistrering och inte hyresgästaktivitet', await page.locator('[data-pi-mode="manual"]').count() == 1 and await page.locator('[data-pi-mode="import"]').count() == 1 and await page.locator('#property-movein-form').count() == 0)
    await page.locator('[data-pi-mode="manual"]').click()
    await manual_values(test, name='Kunddemo QA', email='demo@hyresgast.example', address='Demoytan 8')
    await page.locator('#pi-authority-manual').set_input_files(pdf_file('demo-fullmakt.pdf', PDF_B))
    await page.locator('[data-pi-download]').wait_for()
    await save_manual(test)
    added = [row for row in (await test.state())['moveins'] if row['id'] not in {row['id'] for row in initial['moveins']}]
    test.good('demoregistrering skapar endast ett lokalt serviceunderlag', len(added) == 1 and added[0]['handoverStatus'] == 'draft' and added[0]['authorityFiles'][0]['scope'] == 'demo' and await test.finance() == finances)
    demo_id = added[0]['id']
    demo_meta = added[0]['authorityFiles'][0]
    await page.reload(wait_until='networkidle')
    await page.locator('#demo-guide .demo-guide-step[data-demo-step="3"]').click()
    test.good('guide öppnar faktiskt sparat testunderlag efter omladdning', await page.locator(f'[data-demo-open-case="{demo_id}"]').count() == 1 and await test.attachment_exists(demo_meta))
    for width in [1440, 390, 320]:
        await page.set_viewport_size({'width': width, 'height': 1000 if width == 1440 else 844})
        for number in [1, 2, 3, 4, 5]:
            await page.locator(f'#demo-guide .demo-guide-step[data-demo-step="{number}"]').click()
            await test.nooverflow(f'demoperspektiv {number} vid {width}px')
        await page.evaluate('Portal.role="internal";Portal.go("demo")')
        await test.nooverflow(f'demostart vid {width}px')
        await test.shot(f'demo-intake-start-{width}.png')
        await page.locator('[data-demo-step="1"]').first.click()
    await page.evaluate('Portal.propertyIntake.open("manual","estate1")')
    await page.locator('#pi-address').fill('Separat demoutkast')
    demo_key = await page.evaluate('Portal.propertyIntake.draftPrefix+"estate1:manual"')
    test.good('demoutkast använder ett separat lagringsnamn', demo_key != normal_draft_key and await page.evaluate('(key)=>sessionStorage.getItem(key)!==null', demo_key))
    page.once('dialog', lambda dialog: dialog.dismiss())
    await page.locator('[data-demo-reset]').click()
    test.good('avbruten omstart bevarar demodata och bilagor', await test.row(demo_id) is not None and await test.attachment_exists(demo_meta))
    page.once('dialog', lambda dialog: dialog.accept())
    await page.locator('[data-demo-reset]').click()
    await page.wait_for_function('Portal.page==="demo"')
    test.good('omstart tar bort demots ärenden och bilagor', demo_id not in {row['id'] for row in (await test.state())['moveins']} and not await test.attachment_exists(demo_meta))
    test.good('omstart tar bort endast demoutkast', await page.evaluate('(key)=>sessionStorage.getItem(key)===null', demo_key) and await page.evaluate('(key)=>sessionStorage.getItem(key)', normal_draft_key) == normal_draft)
    test.good('normal lagring förblir identisk vid demoomstart', await page.evaluate('localStorage.getItem("partnerlabb.portal.v2")') == normal)
    await page.goto(BASE, wait_until='networkidle')
    await test.view('estate1')
    normal_bytes, _ = await test.download_meta(normal_meta, 'normal-after-demo-reset.pdf')
    test.good('vanliga ärenden och fullmaktsbytes bevaras efter demoomstart', await test.row(normal_id) is not None and normal_bytes == PDF_A)


async def integrity_checks(test):
    await test.fresh()
    await test.view('estate1')
    page = test.page
    meta = await test.attach_by_api('saknad-fil-test.pdf')
    values = {'partner': 'estate1', 'name': 'Integritet QA', 'email': 'integrity@hyresgast.example', 'address': 'Kontrollvägen 4', 'postcode': '222 22', 'city': 'Lund', 'moveDate': '2026-11-29', 'authorityFiles': [meta]}
    result = await test.api_create(values)
    rid = result['created'][0]['id']
    await page.evaluate('(meta)=>Portal.moveinAttachments.remove(meta)', meta)
    missing_result = await page.evaluate('(id)=>Portal.moveinService.forwardChecked(id)', rid)
    test.good('saknade PDF-bytes blockerar förmedling även med sparad metadata', not missing_result and (await test.row(rid))['handoverStatus'] == 'draft')
    before = len((await test.state())['moveins'])
    atomic = await page.evaluate('''()=>Portal.moveinService.createPartnerRecords([
        {partner:'estate1',name:'Atomic QA',email:'atomic@hyresgast.example',address:'Atomicvägen 4',postcode:'222 22',city:'Lund',moveDate:'2026-11-29'},
        {partner:'estate1',name:'Fel QA',email:'invalid@hyresgast.example',address:'Atomicvägen 5',postcode:'222 22',city:'Lund',moveDate:'2026-02-30'}
    ],{source:'excel'})''')
    test.good('valideringsfel i registrerings-API skapar inga delar av importen', not atomic['saved'] and atomic['created'] == [] and bool(atomic['errors']) and len((await test.state())['moveins']) == before)
    await test.view('estate2')
    foreign = await test.api_create({**values, 'partner': 'estate2', 'email': 'foreign@hyresgast.example'})
    test.good('fullmaktsmetadata kan inte flyttas till annan partner', not foreign['saved'] and foreign['created'] == [] and bool(foreign['errors']) and len((await test.state())['moveins']) == before)
    too_many = await page.evaluate('''async()=>{
        try { await Portal.moveinAttachments.storeFiles(Array.from({length:4},(_,i)=>new File(['%PDF-1.4\\nQA\\n'],'authority-'+i+'.pdf',{type:'application/pdf'})),'estate2'); return ''; }
        catch(error){ return error.message; }
    }''')
    test.good('för många bilagor avvisas med ett begripligt fel', 'tre' in too_many)


async def run(suite='all'):
    OUT.mkdir(parents=True, exist_ok=True)
    async with async_playwright() as pw:
        executable = shutil.which('chromium') or shutil.which('chromium-browser')
        if not executable:
            raise RuntimeError('An existing Chromium installation is required for browser QA.')
        browser = await pw.chromium.launch(executable_path=executable, headless=True, args=['--no-sandbox'])
        test = Suite(browser)
        try:
            if suite in ['all', 'service']:
                await service_checks(test)
            if suite in ['all', 'drafts']:
                await draft_checks(test)
            if suite in ['all', 'demo']:
                await demo_checks(test)
            if suite in ['all', 'integrity']:
                await integrity_checks(test)
            test.good('inga JavaScript-fel i verifierade flöden', not test.errors)
            report = {'suite': suite, 'passed': len(test.checks), 'checks': test.checks, 'errors': test.errors, 'screenshots': str(OUT)}
            (OUT / ('property-intake-' + suite + '.json')).write_text(json.dumps(report, ensure_ascii=False, indent=2))
            print(json.dumps({'suite': suite, 'passed': len(test.checks), 'screenshots': str(OUT)}, ensure_ascii=False), flush=True)
        except Exception:
            if test.page:
                await test.shot('failure-' + suite + '.png')
            (OUT / ('property-intake-' + suite + '-failure.json')).write_text(json.dumps({'checks': test.checks, 'errors': test.errors, 'traceback': traceback.format_exc()}, ensure_ascii=False, indent=2))
            raise
        finally:
            await browser.close()


def main(suite=None):
    if suite is None:
        parser = argparse.ArgumentParser(description=__doc__)
        parser.add_argument('--suite', choices=['all', 'service', 'drafts', 'demo', 'integrity'], default='all')
        suite = parser.parse_args().suite
    asyncio.run(run(suite))


if __name__ == '__main__':
    main()
