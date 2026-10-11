"""Browser regression for sales, property and employee-benefit partners.

Creates partners through the visible form, checks persisted identities and uses
real PDF/XLSX bytes in a new property's own service workflow. Result examples
stay separate from local service records; no rates or employee enrollment are
assumed. Runs against the coordinator's existing Chromium preview.
"""
import argparse
import asyncio
import importlib.util
import json
import pathlib
import shutil

from playwright.async_api import async_playwright

_spec = importlib.util.spec_from_file_location('property_intake_qa', pathlib.Path(__file__).with_name('property-intake.py'))
_intake = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_intake)
BASE, OUT, Suite = _intake.BASE, _intake.OUT, _intake.Suite
pdf_file, xlsx_file, workbook = _intake.pdf_file, _intake.xlsx_file, _intake.workbook
PDF_A, HEADERS = _intake.PDF_A, _intake.HEADERS


async def route(test, name):
    await test.page.evaluate('(name)=>Portal.go(name)', name)


async def fresh(test, suffix=''):
    await test.fresh(BASE + suffix)
    await test.page.wait_for_function('Portal.partnerSetup && Portal.propertyResults && Portal.partnerSalesData')


async def open_create(test):
    await test.page.evaluate('Portal.returnInternal()')
    await route(test, 'partners')
    await test.page.get_by_role('button', name='Ny partner', exact=True).click()
    await test.page.locator('#partner-setup-form').wait_for()


async def create(test, name, kind='sales', audience='business'):
    await open_create(test)
    page = test.page
    await page.locator('#partner-setup-name').fill(name)
    await page.locator(f'input[name="partnerType"][value="{kind}"]').check()
    if kind == 'sales':
        await page.locator(f'input[name="salesAudience"][value="{audience}"]').check()
    await page.get_by_role('button', name='Skapa partner', exact=True).click()
    await page.locator('#partner-setup-form').wait_for(state='hidden')
    return await page.evaluate('Portal.selectedPartnerId')


async def profile(page, partner):
    return await page.evaluate('(id)=>Portal.getPartner(id)', partner)


async def counts(page):
    return await page.evaluate('''()=>({
      records:JSON.stringify(Portal.state.records),offers:JSON.stringify(Portal.state.offers),
      consumerSales:JSON.stringify(Portal.state.consumerSales),moveins:JSON.stringify(Portal.state.moveins),
      kickback:JSON.stringify(Portal.partnerKickback.ledger),
      result:JSON.stringify(Portal.partnerResultsData.rows({partnerIds:["syd","vast","estate1","estate2"]}))
    })''')


async def registry_checks(test):
    await fresh(test)
    page = test.page
    baseline = await counts(page)
    await open_create(test)
    form_text = await page.locator('#partner-setup-form').inner_text()
    test.good('ny partner erbjuder säljpartner, fastighetsbolag och personalavtal i samma dialog', await page.locator('input[name="partnerType"]').evaluate_all('(nodes)=>nodes.map(n=>n.value)') == ['sales', 'property', 'employee'] and all(label in form_text for label in ['Säljpartner', 'Fastighetsbolag', 'Personalavtal']))
    test.good('säljpartner är standard och behåller företag, konsument och båda', await page.locator('input[name="partnerType"][value="sales"]').is_checked() and await page.locator('input[name="salesAudience"]').evaluate_all('(nodes)=>nodes.map(n=>n.value)') == ['business', 'consumer', 'both'])
    for kind in ['property', 'employee']:
        await page.locator(f'input[name="partnerType"][value="{kind}"]').check()
        test.good(f'{kind} kräver inte säljsegment', not await page.locator('#partner-setup-sales').is_visible() and await page.locator('#partner-setup-sales').evaluate('(field)=>field.disabled'))
    await page.locator('input[name="partnerType"][value="sales"]').check()
    test.good('återgång till säljpartner återaktiverar segmentvalen', await page.locator('#partner-setup-sales').is_visible() and not await page.locator('#partner-setup-sales').evaluate('(field)=>field.disabled'))
    await page.locator('#partner-setup-cancel').click()

    partners = {}
    for kind, label, expected_route, expected_audience in [('property', 'QA Fastigheter AB', 'partner-detail', 'movein'), ('employee', 'QA Personalbolag AB', 'employee-channel', 'employee')]:
        partner = await create(test, label, kind)
        partners[kind] = partner
        data = await profile(page, partner)
        test.good(f'ny {kind} sparar rätt partneridentitet utan försäljningssegment', data['name'] == label and data['type'] == kind and data['audience'] == expected_audience and data['salesAudiences'] == [] and await page.evaluate('Portal.page') == expected_route)
        test.good(f'ny {kind} har egen rubrik under Partners', await page.locator('h1').inner_text() == label and await page.locator('#nav [data-go="partners"]').get_attribute('aria-current') == 'page' and 'partner=' + partner in page.url)
        await page.reload(wait_until='networkidle')
        data = await profile(page, partner)
        test.good(f'ny {kind} består efter omladdning och behåller sin egen sida', data['name'] == label and data['type'] == kind and data['salesAudiences'] == [] and await page.evaluate('Portal.selectedPartnerId') == partner and await page.evaluate('Portal.page') == expected_route)
        await page.evaluate('(id)=>Portal.partnerSetup.open(id)', partner)
        test.good(f'ändring av {kind} visar låst partnertyp och inga säljsegment', await page.locator('.partner-setup-locked-type').count() == 1 and await page.locator('input[name="partnerType"]').count() == 0 and not await page.locator('#partner-setup-sales').is_visible())
        new_name = label.replace('QA ', 'QA Ändrat ')
        await page.locator('#partner-setup-name').fill(new_name)
        await page.get_by_role('button', name='Spara inställningar', exact=True).click()
        data = await profile(page, partner)
        test.good(f'namnet på {kind} kan ändras utan typbyte eller historikändring', data['name'] == new_name and data['type'] == kind and data['audience'] == expected_audience and data['salesAudiences'] == [])
        before_profiles = await page.evaluate('JSON.stringify(Portal.state.partnerProfiles)')
        changed = await page.evaluate('(id)=>Portal.partnerSetup.saveProfile({name:"QA Otillåtet typbyte",partnerType:"sales",salesAudiences:["business"]},id)', partner)
        test.good(f'{kind} kan inte omklassificeras genom direkt sparanrop', not changed['ok'] and await page.evaluate('JSON.stringify(Portal.state.partnerProfiles)') == before_profiles and (await profile(page, partner))['type'] == kind)

    for audience, expected in [('business', ['business']), ('consumer', ['consumer']), ('both', ['business', 'consumer'])]:
        partner = await create(test, 'QA Säljpartner ' + audience, 'sales', audience)
        partners[audience] = partner
        data = await profile(page, partner)
        test.good(f'säljpartner {audience} behåller rätt kundsegment och avtalsöversikt', data['type'] == 'sales' and data['salesAudiences'] == expected and await page.evaluate('Portal.page') == 'partner-sales' and await page.locator('[data-sr-metric] strong').all_inner_texts() == ['—', '—', '—'])

    test.good('nya partnertyper skapar inga kundavtal, serviceärenden eller ekonomiska utfall', await counts(page) == baseline)
    await open_create(test)
    await page.locator('#partner-setup-name').fill('QA Ändrat Personalbolag AB')
    await page.locator('input[name="partnerType"][value="property"]').check()
    before_size = await page.evaluate('Portal.partnerRegistry.length')
    await page.get_by_role('button', name='Skapa partner', exact=True).click()
    test.good('namndublett stoppas även mellan olika partnertyper', await page.locator('#partner-setup-error').is_visible() and await page.evaluate('Portal.partnerRegistry.length') == before_size)
    await page.locator('#partner-setup-cancel').click()
    await open_create(test)
    await page.locator('#partner-setup-name').fill('QA Misslyckad lagring')
    await page.locator('input[name="partnerType"][value="employee"]').check()
    await page.evaluate('window.qaOriginalSave=Portal.save;Portal.save=()=>false')
    await page.get_by_role('button', name='Skapa partner', exact=True).click()
    test.good('lagringsfel behåller dialog och tidigare partnerregister', await page.locator('#partner-setup-error').is_visible() and await page.evaluate('Portal.partnerRegistry.length') == before_size and not await page.evaluate('Portal.partnerRegistry.some(p=>p.name==="QA Misslyckad lagring")'))
    await page.evaluate('Portal.save=window.qaOriginalSave;delete window.qaOriginalSave')
    await page.locator('#partner-setup-cancel').click()

    for kind in ['property', 'employee']:
        await test.view(partners[kind])
        denied = await page.evaluate('Portal.partnerSetup.saveProfile({name:"QA Förbjuden",partnerType:"sales",salesAudiences:["business"]})')
        test.good(f'partnerrollen {kind} kan inte ändra partnerregistret', not denied['ok'] and not await page.evaluate('Portal.partnerRegistry.some(p=>p.name==="QA Förbjuden")'))

    # The existing v2 business state and unknown extensions survive hydration.
    await page.evaluate('''()=>{
      const saved=JSON.parse(localStorage.getItem("partnerlabb.portal.v2"));
      saved.qaPartnerTypesExtension={keep:"existing-data"};
      saved.records[0].need="QA Befintlig sparad kunddialog";
      localStorage.setItem("partnerlabb.portal.v2",JSON.stringify(saved));
    }''')
    await page.reload(wait_until='networkidle')
    test.good('befintlig kunddialog och okända v2-fält består när nya typer läses', await page.evaluate('Portal.state.qaPartnerTypesExtension.keep==="existing-data"&&Portal.state.records[0].need==="QA Befintlig sparad kunddialog"'))
    normal = await page.evaluate('localStorage.getItem("partnerlabb.portal.v2")')
    await page.goto(BASE + '?demo=inflyttning&workspace=estate1', wait_until='networkidle')
    test.good('kunddemo är isolerat från normala nya fastighets- och personalpartners', await page.evaluate('(ids)=>ids.every(id=>!Portal.getPartner(id))', [partners['property'], partners['employee']]))
    demo_employee = await create(test, 'QA Kunddemo personal', 'employee')
    test.good('personalpartner i kunddemo ändrar inte ordinarie testdata', (await profile(page, demo_employee))['type'] == 'employee' and await page.evaluate('localStorage.getItem("partnerlabb.portal.v2")') == normal)
    await page.goto(BASE + '?partner=' + partners['employee'] + '#employee-channel', wait_until='networkidle')
    test.good('normal yta återfår egen personalpartner utan kunddemots partner', (await profile(page, partners['employee']))['name'] == 'QA Ändrat Personalbolag AB' and await page.evaluate('(id)=>!Portal.getPartner(id)', demo_employee) and await page.evaluate('Portal.page') == 'employee-channel')
    return partners


async def property_checks(test):
    await fresh(test)
    page = test.page
    partner = await create(test, 'QA Nya Fastigheter AB', 'property')
    other = await create(test, 'QA Andra Fastigheter AB', 'property')
    base = await counts(page)
    await test.view(partner)
    test.good('ny fastighetspartner öppnar egen inflyttningsservice utan annans ärenden', await page.locator('h1').inner_text() == 'Inflyttningsservice' and 'QA Nya Fastigheter AB' in await page.locator('.page-head .eyebrow').text_content() and await page.locator('[data-movein-detail]').count() == 0 and await page.evaluate('(id)=>Portal.moveinService.rows(id).length', partner) == 0)
    settings = await page.evaluate('(id)=>Portal.state.propertySettings[id]', partner)
    test.good('ny fastighetspartner får inga påhittade adresser eller fastigheter', settings['address'] == '' and settings['postcode'] == '' and settings['city'] == '' and settings['properties'] == [])
    await route(test, 'property-results')
    test.good('ny fastighetspartner visar saknat resultatunderlag och inga lånade exempel', await page.locator('[data-property-results-availability="missing"]').count() > 0 and await page.locator('[data-property-result="customers"]').inner_text() == '—' and await page.locator('[data-property-result="settled"]').inner_text() == '—' and await page.locator('[data-property-result="helped"]').inner_text() == '—')
    await page.evaluate('(id)=>Portal.propertyIntake.open("choice",id)', partner)
    test.good('ny fastighetspartner har Excel och manuell registrering utan hyresgäststeg', await page.locator('[data-pi-mode="import"]').count() == 1 and await page.locator('[data-pi-mode="manual"]').count() == 1 and 'Hyresgästen behöver inte använda portalen' in await page.locator('#view').inner_text())
    await page.locator('[data-pi-mode="manual"]').click()
    await _intake.manual_values(test, 'QA Egen inflyttare', 'egen@hyresgast.example', 'QA Nya gatan 12')
    await page.locator('#pi-authority-manual').set_input_files(pdf_file('qa-egen-fullmakt.pdf'))
    await page.locator('[data-pi-download]').wait_for()
    await _intake.save_manual(test)
    rows = [row for row in (await test.state())['moveins'] if row['partner'] == partner and row['name'] == 'QA Egen inflyttare']
    test.good('ny fastighetspartner kan spara eget serviceunderlag utan automatisk överlämning', len(rows) == 1 and rows[0]['handoverStatus'] == 'draft' and rows[0]['intakeSource'] == 'manual' and not rows[0]['authorityDemo'] and rows[0]['processing']['offerChoice'] == 'undecided')
    rid, meta = rows[0]['id'], rows[0]['authorityFiles'][0]
    test.good('egen fullmakt märks med rätt ny partner och rätt lokal lagringsyta', meta['partner'] == partner and meta['scope'] == 'normal' and await test.attachment_exists(meta))
    data, filename = await test.download_meta(meta, 'new-property-authority.pdf')
    test.good('ny partners fullmakt kan hämtas med ursprungligt filnamn och PDF-innehåll', data == PDF_A and filename == 'qa-egen-fullmakt.pdf')
    await page.reload(wait_until='networkidle')
    test.good('ny partners serviceunderlag och riktiga bilaga består efter omladdning', (await test.row(rid))['partner'] == partner and await test.attachment_exists(meta))
    await test.view(partner, 'property-registrations')
    await page.locator(f'[data-movein-detail="{rid}"]').first.click()
    test.good('sparat underlag kräver ett uttryckligt förmedlingssteg', (await test.row(rid))['handoverStatus'] == 'draft' and not await page.locator('#movein-service-forward-form button[type="submit"]').is_disabled())
    await page.locator('#movein-service-forward-form [name="partnerReply"]').fill('QA eget fastighetsunderlag förmedlas')
    await page.locator('#movein-service-forward-form button[type="submit"]').click()
    await page.wait_for_function('(id)=>Portal.state.moveins.find(row=>row.id===id).handoverStatus==="submitted"', arg=rid)
    test.good('explicit överlämning behåller egen partner och separata elhandelsval', (await test.row(rid))['partner'] == partner and (await test.row(rid))['processing']['offerChoice'] == 'undecided')

    await test.view(None, 'movein-cases')
    options = await page.locator('#movein-service-partner option').evaluate_all('(nodes)=>nodes.map(n=>n.value)')
    test.good('intern handläggning kan filtreras på nyskapade fastighetsbolag', partner in options and other in options)
    await page.locator('#movein-service-partner').select_option(partner)
    test.good('eget internfilter visar exakt det nya bolagets förmedlade ärende', await page.locator('#movein-service-table-body [data-service-case]').evaluate_all('(nodes)=>[...new Set(nodes.map(n=>n.dataset.serviceCase))]') == [rid])
    await page.locator('#movein-service-partner').select_option(other)
    test.good('annat bolags internfilter saknar den förmedlade inflyttaren', await page.locator('#movein-service-table-body [data-service-case]').count() == 0 and 'QA Egen inflyttare' not in await page.locator('#movein-service-table-body').inner_text())
    await test.view(other, 'property-registrations')
    test.good('annan fastighetspartners arbetsyta saknar både ärendet och bilagan', await page.locator('[data-movein-detail]').count() == 0 and not await test.attachment_exists(meta))

    # A genuine new-partner Excel row is saved separately, with its own PDF.
    await page.evaluate('(id)=>Portal.propertyIntake.open("import",id)', partner)
    payload = [['QA Excelgatan 20', '1002', '222 22', 'Lund', '2026-11-22', 'QA Excel inflyttare', 'excel@hyresgast.example', '']]
    await page.locator('#pi-excel-file').set_input_files(xlsx_file('qa-nya-fastigheter.xlsx', workbook(HEADERS, payload)))
    await page.locator('.pi-import-row').wait_for()
    await page.locator('#pi-authority-0').set_input_files(pdf_file('qa-excel-fullmakt.pdf'))
    await page.locator('[data-pi-download="0"][data-pi-row="0"]').wait_for()
    await page.locator('#pi-import-confirm').check()
    await page.locator('#pi-import-save').click()
    await page.locator('.pi-success').wait_for()
    own = [row for row in (await test.state())['moveins'] if row['partner'] == partner]
    test.good('ny fastighetspartners Excel-väg sparar egen inflyttning med rätt fullmakt', len(own) == 2 and any(row['name'] == 'QA Excel inflyttare' and row['intakeSource'] == 'excel' and row['handoverStatus'] == 'draft' and row['authorityFiles'][0]['partner'] == partner for row in own))
    await route(test, 'property-results')
    test.good('två lokala serviceunderlag blir varken två elhandelskunder eller kickback', await page.locator('[data-property-result="local-cases"]').inner_text() == '2' and await page.locator('[data-property-result="customers"]').inner_text() == '—' and await page.locator('[data-property-result="settled"]').inner_text() == '—' and await page.locator('[data-property-result="helped"]').inner_text() == '—')
    after = await counts(page)
    test.good('manuell registrering, Excel och förmedling bevarar alla tidigare affärsresultat', all(after[key] == base[key] for key in ['records', 'offers', 'consumerSales', 'kickback', 'result']))
    await page.reload(wait_until='networkidle')
    test.good('ny partners resultatvy förblir separat från lokala serviceärenden efter reload', await page.locator('[data-property-result="local-cases"]').inner_text() == '2' and await page.locator('[data-property-result="customers"]').inner_text() == '—')
    return partner


async def employee_checks(test):
    await fresh(test)
    page = test.page
    partner = await create(test, 'QA Personalavtal AB', 'employee')
    baseline = await counts(page)
    text = await page.locator('#view').inner_text()
    test.good('personalavtal visar eget företag utan att låna säljar- eller fastighetsresultat', await page.locator('h1').inner_text() == 'QA Personalavtal AB' and 'Savera' not in text and 'Face2face' not in text and 'Exempelfastigheter' not in text)
    test.good('personalavtal uppfinner ingen insamling av kunddata eller fullmakter', await page.locator('#view form,#view input[type="file"],#pi-manual-form,#movein-service-forward-form').count() == 0 and 'fullmakt' not in text.lower())
    test.good('personalavtal visar saknat underlag för avtal, kunder och ersättning', 'Underlag saknas' in text and not await page.locator('[data-sr-record],.commercial-waterfall,.property-results-chart').count())
    await test.view(partner)
    text = await page.locator('#view').inner_text()
    test.good('personalpartner har egen arbetsyta med rätt identitet och roll', await page.evaluate('Portal.role') == 'partner' and await page.locator('h1').inner_text() == 'QA Personalavtal AB' and 'Personalavtal' in text and 'Savera' not in text and 'Face2face' not in text)
    test.good('personalpartner får ingen inflyttningsmeny eller säljregistrering', await page.locator('#nav [data-go="property-intake"],#nav [data-go="property-registrations"],#nav [data-go="partner-sales"]').count() == 0 and await page.locator('#view form').count() == 0)
    for forbidden in ['property-manual', 'property-import', 'property-results', 'partner-sales', 'partner-insights', 'consumer-sales', 'business-brief', 'movein-cases']:
        await route(test, forbidden)
        test.good(f'personalpartner behåller sin egen arbetsyta vid otillåten vy {forbidden}', await page.evaluate('Portal.page') == 'overview' and await page.locator('h1').inner_text() == 'QA Personalavtal AB')
    for forbidden in ['partner-sales', 'partner-insights', 'savera', 'insikter', 'property-intake', 'academy']:
        await page.goto(BASE + '?workspace=' + partner + '&partner=syd#' + forbidden, wait_until='networkidle')
        text = await page.locator('#view').inner_text()
        test.good(f'personalpartnerns direktlänk {forbidden} visar egen vy utan lånade säljuppgifter', await page.evaluate('Portal.role') == 'partner' and await page.evaluate('Portal.partner') == partner and await page.evaluate('Portal.page') == 'overview' and await page.locator('h1').inner_text() == 'QA Personalavtal AB' and 'Savera' not in text and 'Face2face' not in text)
    test.good('personalpartner får inga antagna produktval från företags- eller konsumentkatalogerna', await page.evaluate('Portal.productFacts.segments()') == [])
    await page.reload(wait_until='networkidle')
    test.good('personalpartnerns egen vy återställs från arbetsytans direktlänk', await page.evaluate('Portal.role') == 'partner' and await page.evaluate('Portal.partner') == partner and await page.locator('h1').inner_text() == 'QA Personalavtal AB')
    test.good('personalpartnerns visningar skapar inga resultat eller kundunderlag', await counts(page) == baseline)
    return partner


async def layout_checks(test):
    await fresh(test)
    page = test.page
    employee = await create(test, 'QA Mobil personal', 'employee')
    property_partner = await create(test, 'QA Mobil fastighet', 'property')
    await route(test, 'partners')
    for kind, expected_ids in [('property', {'estate1', 'estate2', property_partner}), ('employee', {employee})]:
        await page.locator('#commercial-type').select_option(kind)
        filtered_ids = await page.locator('.commercial-partner-name').evaluate_all('(nodes)=>nodes.map(n=>n.dataset.commercialPartner)')
        test.good(f'partnerregistrets filter {kind} visar bara rätt typ och dess nya partner', set(filtered_ids) == expected_ids)
    await page.locator('#commercial-type').select_option('all')
    for width in [1440, 390, 320]:
        await page.set_viewport_size({'width': width, 'height': 1000 if width == 1440 else 844})
        await open_create(test)
        for kind in ['sales', 'property', 'employee']:
            await page.locator(f'input[name="partnerType"][value="{kind}"]').check()
            await test.nooverflow(f'partnerdialog {kind} saknar sidöverflöde vid {width}px')
            dialog_width = await page.locator('#portal-dialog').evaluate('(d)=>({width:d.getBoundingClientRect().width,scroll:d.scrollWidth,client:d.clientWidth})')
            test.good(f'partnerdialog {kind} ryms även internt vid {width}px', dialog_width['width'] <= width and dialog_width['scroll'] <= dialog_width['client'] + 1)
        await test.shot(f'partner-types-dialog-{width}.png')
        if width in [390, 320]:
            name = f'QA Mobil skapad {width}'
            kind = 'property' if width == 390 else 'employee'
            await page.locator(f'input[name="partnerType"][value="{kind}"]').check()
            await page.locator('#partner-setup-name').fill(name)
            submit = page.get_by_role('button', name='Skapa partner', exact=True)
            await submit.scroll_into_view_if_needed()
            position = await submit.bounding_box()
            test.good(f'dialogens skapa-knapp kan nås efter vertikal scroll vid {width}px', position is not None and position['y'] >= 0 and position['y'] + position['height'] <= 844)
            before_create = await page.evaluate('Portal.partnerRegistry.length')
            await submit.click()
            await page.locator('#partner-setup-form').wait_for(state='hidden')
            created = await page.evaluate('Portal.selectedPartnerId')
            saved = await profile(page, created)
            test.good(f'{kind} kan skapas genom hela mobilformuläret vid {width}px', saved['name'] == name and saved['type'] == kind and await page.evaluate('Portal.partnerRegistry.length') == before_create + 1 and await page.locator('h1').inner_text() == name)
        else:
            await page.locator('#partner-setup-cancel').click()
        await page.evaluate('(id)=>{Portal.selectedPartnerId=id;Portal.go("employee-channel")}', employee)
        await test.nooverflow(f'personalavtal intern vy saknar sidöverflöde vid {width}px')
        sizes = await page.locator('.employee-channel .btn').evaluate_all('(nodes)=>nodes.map(n=>parseFloat(getComputedStyle(n).fontSize))')
        test.good(f'personalavtalets knappar har läsbar text vid {width}px', bool(sizes) and min(sizes) >= 12)
        await test.shot(f'employee-channel-{width}.png')
        await test.view(employee)
        await test.nooverflow(f'personalpartnerns arbetsyta saknar sidöverflöde vid {width}px')
        await test.view(property_partner)
        await test.nooverflow(f'ny fastighetspartners översikt saknar sidöverflöde vid {width}px')
        await test.shot(f'new-property-overview-{width}.png')
        await route(test, 'property-intake')
        await test.nooverflow(f'ny fastighetspartners två registreringsvägar ryms vid {width}px')
        await route(test, 'property-results')
        await test.nooverflow(f'ny fastighetspartners saknade utfall ryms vid {width}px')
        await test.shot(f'new-property-results-{width}.png')
    await page.set_viewport_size({'width': 1440, 'height': 1000})
    await open_create(test)
    await page.locator('input[name="partnerType"][value="sales"]').focus()
    await page.keyboard.press('ArrowRight')
    test.good('partnertyp kan ändras med tangentbordets radioval', await page.locator('input[name="partnerType"][value="property"]').is_checked() and not await page.locator('#partner-setup-sales').is_visible())
    await page.keyboard.press('ArrowRight')
    test.good('nästa tangentbordsval öppnar personalavtal utan säljsegment', await page.locator('input[name="partnerType"][value="employee"]').is_checked() and await page.locator('#partner-setup-sales').evaluate('(field)=>field.disabled'))
    await page.locator('#partner-setup-cancel').focus()
    await page.keyboard.press('Enter')
    test.good('dialogen kan avbrytas med tangentbordet utan att skapa ny partner', not await page.locator('#partner-setup-form').is_visible())


async def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--suite', choices=['all', 'registry', 'property', 'employee', 'layout'], default='all')
    args = parser.parse_args()
    chromium = shutil.which('chromium') or shutil.which('chromium-browser')
    if not chromium:
        raise RuntimeError('Existing Chromium required; no browser installation is performed.')
    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(executable_path=chromium, headless=True, args=['--no-sandbox'])
        test = Suite(browser)
        try:
            for name, run in [('registry', registry_checks), ('property', property_checks), ('employee', employee_checks), ('layout', layout_checks)]:
                if args.suite in ['all', name]:
                    await run(test)
            test.good('inga JavaScript-fel i flöden för de tre partnertyperna', not test.errors)
            print(json.dumps({'checks': len(test.checks), 'screenshots': str(OUT), 'javascript_errors': test.errors}, ensure_ascii=False), flush=True)
        except Exception:
            if test.page:
                await test.shot('partner-types-failure.png')
            raise
        finally:
            if test.context:
                await test.context.close()
            await browser.close()


if __name__ == '__main__':
    asyncio.run(main())
