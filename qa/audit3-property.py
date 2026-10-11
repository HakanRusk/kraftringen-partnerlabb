"""Confirmed third-audit regressions for delayed property handover dialogs.

Fictional inputs only. Reuses actual local PDF storage and the existing preview.
"""
import asyncio
import importlib.util
import json
import pathlib
import shutil
import traceback

from playwright.async_api import async_playwright

spec = importlib.util.spec_from_file_location('intake_qa', pathlib.Path(__file__).with_name('property-intake.py'))
intake = importlib.util.module_from_spec(spec)
spec.loader.exec_module(intake)


async def pending_handover(test, navigation):
    await test.fresh()
    page = test.page
    await test.view('estate1', 'property-registrations')
    finance = await test.finance()
    meta = await test.attach_by_api('QA-sen-fullmakt.pdf')
    result = await test.api_create({
        'partner': 'estate1', 'name': 'QA Sen Förmedling',
        'email': 'delayed-handover@hyresgast.example', 'address': 'QA Överlämningsgatan 1',
        'postcode': '222 22', 'city': 'Lund', 'moveDate': '2026-11-12',
        'authorityFiles': [meta],
    })
    rid = result['created'][0]['id']
    before = await test.row(rid)
    await page.evaluate('(id)=>Portal.moveinService.open(id)', rid)
    await page.locator('[data-attachment-status]').filter(has_text='Sparad').wait_for()
    await page.locator('[name=partnerReply]').fill('QA avsiktlig förmedling')
    await page.evaluate('''()=>{window.qaOriginalExists=Portal.moveinAttachments.exists;
      let pending=false;
      Portal.moveinAttachments.exists=(meta)=>{
        if(pending)return window.qaOriginalExists(meta);
        pending=true;
        return new Promise(resolve=>{
          window.qaFinishHandoverCheck=async()=>resolve(await window.qaOriginalExists(meta));
        });
      };}''')
    await page.locator('#movein-service-forward-form button[type=submit]').click()
    await page.wait_for_function('typeof window.qaFinishHandoverCheck==="function"')
    if navigation == 'other-case':
        await page.evaluate('Portal.moveinService.open("service-demo-001")')
        await page.locator('.movein-service-detail[data-case-id="service-demo-001"]').wait_for()
    elif navigation == 'reopened-case':
        await page.locator('#close-dialog').click()
        await page.evaluate('(id)=>Portal.moveinService.open(id)', rid)
        await page.locator('[name=partnerReply]').fill('QA nytt formulär ska bevaras')
    elif navigation == 'other-route':
        await page.locator('#close-dialog').click()
        await page.evaluate('Portal.go("property-partnership")')
        await page.locator('.property-partnership-page').wait_for()
    elif navigation == 'closed-dialog':
        await page.locator('#close-dialog').click()
    elif navigation == 'other-partner':
        await page.locator('#close-dialog').click()
        await test.view('estate2', 'property-registrations')
        await page.evaluate('Portal.moveinService.open("service-demo-003")')
        await page.locator('[name=partnerReply]').fill('QA den andra partnerns nya komplettering')
    await page.evaluate('''async()=>{Portal.moveinAttachments.exists=window.qaOriginalExists;
      await window.qaFinishHandoverCheck();}''')
    await page.wait_for_function('document.querySelector("#toast").textContent.includes("Förmedlingen avbröts")')
    test.good(navigation + ': ett lämnat formulär bevarar hela underlaget och historiken', await test.row(rid) == before)
    if navigation == 'other-partner':
        test.good('sen förmedling bevarar annan partners öppna ärende och text',
                  await page.locator('#portal-dialog').evaluate('(node)=>node.open')
                  and await page.locator('.movein-service-detail').get_attribute('data-case-id') == 'service-demo-003'
                  and await page.locator('[name=partnerReply]').input_value() == 'QA den andra partnerns nya komplettering')
    else:
        if navigation == 'other-case':
            test.good('sen förmedling stänger inte ett nyare öppnat ärende',
                      await page.locator('#portal-dialog').evaluate('(node)=>node.open')
                      and await page.locator('.movein-service-detail').get_attribute('data-case-id') == 'service-demo-001')
        elif navigation == 'reopened-case':
            test.good('sen förmedling stänger eller skriver inte över det återöppnade formuläret',
                      await page.locator('#portal-dialog').evaluate('(node)=>node.open')
                      and await page.locator('[name=partnerReply]').input_value() == 'QA nytt formulär ska bevaras')
        elif navigation == 'other-route':
            test.good('sen förmedling bevarar den nya samarbetsvyn och navigationen',
                      await page.evaluate('Portal.page') == 'property-partnership'
                      and await page.locator('.property-partnership-page').count() == 1)
        else:
            test.good('sen förmedling återöppnar inte en stängd dialog',
                      not await page.locator('#portal-dialog').evaluate('(node)=>node.open')
                      and await page.evaluate('Portal.page') == 'property-registrations')
    test.good(navigation + ': förmedling skapar inte kundavtal eller ändrad ekonomi', await test.finance() == finance)


async def save_failure_and_direct_api(test):
    await test.fresh()
    page = test.page
    await test.view('estate1', 'property-registrations')
    finance = await test.finance()
    meta = await test.attach_by_api('QA-sparfel-fullmakt.pdf')
    result = await test.api_create({
        'partner': 'estate1', 'name': 'QA Sparfel Förmedling',
        'email': 'save-handover@hyresgast.example', 'address': 'QA Sparfelgatan 1',
        'postcode': '222 22', 'city': 'Lund', 'moveDate': '2026-11-14',
        'authorityFiles': [meta],
    })
    rid = result['created'][0]['id']
    before = await test.row(rid)
    stored_before = await page.evaluate('localStorage.getItem("partnerlabb.portal.v2")')
    await page.evaluate('(id)=>Portal.moveinService.open(id)', rid)
    await page.locator('[data-attachment-status]').filter(has_text='Sparad').wait_for()
    await page.locator('[name=partnerReply]').fill('QA återförsök förmedling')
    await page.evaluate('''()=>{window.qaStorageWrite=Storage.prototype.setItem;
      Storage.prototype.setItem=function(){throw new DOMException('QA full storage','QuotaExceededError')};}''')
    await page.locator('#movein-service-forward-form button[type=submit]').click()
    await page.wait_for_function('document.querySelector("#toast").textContent.includes("Förmedlingen kunde inte sparas")')
    test.good('förmedlingens sparfel återställer exakt ärendet och alla historikhändelser', await test.row(rid) == before)
    test.good('förmedlingens sparfel bevarar dialogen, texten och möjlighet att försöka igen',
              await page.locator('#portal-dialog').evaluate('(node)=>node.open')
              and await page.locator('[name=partnerReply]').input_value() == 'QA återförsök förmedling'
              and await page.locator('#movein-service-forward-form button[type=submit]').is_enabled())
    test.good('förmedlingens sparfel ändrar inte tidigare lagrat v2-underlag', await page.evaluate('localStorage.getItem("partnerlabb.portal.v2")') == stored_before)
    await page.evaluate('()=>{Storage.prototype.setItem=window.qaStorageWrite;}')
    await page.evaluate('''()=>{const button=document.querySelector('#movein-service-forward-form button[type=submit]');button.click();button.click();}''')
    await page.wait_for_function('(id)=>Portal.state.moveins.find(row=>row.id===id).handoverStatus==="submitted"', arg=rid)
    row = await test.row(rid)
    test.good('lyckat förmedlingsåterförsök skapar bara en överlämning och ett meddelande',
              not await page.locator('#portal-dialog').evaluate('(node)=>node.open')
              and sum(event.get('text', '').startswith('Serviceunderlag förmedlat') for event in row['events']) == 1
              and sum(event.get('text', '').endswith('QA återförsök förmedling') for event in row['events']) == 1)
    await page.reload(wait_until='networkidle')
    test.good('lyckat förmedlingsåterförsök består efter omladdning', await test.row(rid) == row)
    second = await test.api_create({
        'partner': 'estate1', 'name': 'QA API Förmedling',
        'email': 'api-handover@hyresgast.example', 'address': 'QA APIgatan 2',
        'postcode': '222 22', 'city': 'Lund', 'moveDate': '2026-11-15',
        'authorityFiles': [meta],
    })
    second_id = second['created'][0]['id']
    api_ok = await page.evaluate('(id)=>Portal.moveinService.forwardChecked(id,{reply:"QA direkt API"})', second_id)
    test.good('direkt kontrollerad API-förmedling fungerar utan formulärguard', api_ok and (await test.row(second_id))['handoverStatus'] == 'submitted')
    test.good('sparfel, återförsök och direkt API ändrar inga kundavtal eller ekonomiska underlag', await test.finance() == finance)


async def new_property_partner(test):
    await test.fresh()
    page = test.page
    finance = await test.finance()
    existing = (await test.state())['moveins']
    result = await page.evaluate('''()=>Portal.partnerSetup.saveProfile({
      name:'QA Nya Fastigheter AB',partnerType:'property',salesAudiences:[]
    })''')
    partner = result['id']
    for source in ['manual', 'import']:
        await page.evaluate('({source,partner})=>Portal.propertyIntake.open(source,partner)', {'source': source, 'partner': partner})
        test.good(source + ': ny fastighetspartner har egna initiala avtalsval', await page.locator('#intake-product').input_value() == 'Kvartspris')
        name = 'QA Ny Manuell' if source == 'manual' else 'QA Ny Excel'
        email = 'new-' + source + '@hyresgast.example'
        if source == 'manual':
            await intake.manual_values(test, name=name, email=email, address='QA Nyfastighetsgatan 1')
            await page.locator('#pi-authority-manual').set_input_files(intake.pdf_file('QA-ny-manuell.pdf'))
            await page.locator('[data-pi-download]').wait_for()
            await intake.save_manual(test)
        else:
            await page.locator('#pi-excel-file').set_input_files(intake.xlsx_file('QA-ny-fastighet.xlsx', intake.workbook(intake.HEADERS, [
                ['QA Nyfastighetsgatan 2', '1102', '222 22', 'Lund', '2026-11-16', name, email, ''],
            ])))
            await page.locator('.pi-import-row').wait_for()
            await page.locator('#pi-authority-0').set_input_files(intake.pdf_file('QA-ny-excel.pdf', intake.PDF_B))
            await page.locator('[data-pi-download]').wait_for()
            await page.locator('#pi-import-confirm').check()
            await page.locator('#pi-import-save').click()
            await page.locator('.pi-success').wait_for()
        row = await page.evaluate('(email)=>Portal.state.moveins.find(row=>row.email===email)', email)
        rid = row['id']
        test.good(source + ': underlaget och fullmakten hör till den nya partnern utan förmedling',
                  row['partner'] == partner and row['handoverStatus'] == 'draft'
                  and row['authorityFiles'][0]['partner'] == partner
                  and row['desiredProduct'] == 'Kvartspris')
        await page.locator('[data-pi-records]').click()
        await page.locator(f'[data-movein-detail="{rid}"]').first.click()
        await page.locator('#movein-service-forward-form button[type=submit]').click()
        await page.wait_for_function('(id)=>Portal.state.moveins.find(row=>row.id===id).handoverStatus==="submitted"', arg=rid)
        await test.view(None, 'movein-cases')
        await page.evaluate('(id)=>Portal.moveinService.open(id)', rid)
        await page.locator('[name=handoverStatus]').select_option('needs_info')
        await page.locator('[name=feedback]').fill('QA kontrollera lägenhetens nummer')
        await page.locator('[name=privateNote]').fill('QA intern notering för ny fastighet')
        await page.locator('#movein-service-internal-form button[type=submit]').click()
        await test.view(partner, 'property-registrations')
        await page.locator(f'[data-movein-detail="{rid}"]').first.click()
        test.good(source + ': ny partner ser begärd komplettering och ingen intern notering',
                  'QA kontrollera lägenhetens nummer' in await page.locator('.movein-service-timeline').inner_text()
                  and 'QA intern notering' not in await page.locator('.movein-service-timeline').inner_text())
        await page.locator('[name=apartment]').fill('1203')
        await page.locator('[name=partnerReply]').fill('QA lägenhetsnummer kontrollerat')
        await page.locator('#movein-service-forward-form button[type=submit]').click()
        await page.wait_for_function('(id)=>Portal.state.moveins.find(row=>row.id===id).submissionType==="supplement"', arg=rid)
        test.good(source + ': ny partner förmedlar korrigerat eget underlag på nytt', (await test.row(rid))['apartment'] == '1203')
        await test.view(None, 'movein-cases')
        await page.evaluate('(id)=>Portal.moveinService.open(id)', rid)
        await page.locator('[name=handoverStatus]').select_option('confirmed')
        await page.locator('[name=trade]').select_option('confirmed')
        await page.locator('[name=network]').select_option('confirmed')
        await page.locator('[name=offerChoice]').select_option('declined')
        await page.locator('[name=feedback]').fill('QA elhanteringen återkopplad utan nytt avtal')
        await page.locator('#movein-service-internal-form button[type=submit]').click()
        test.good(source + ': intern handläggning kan återkopplas utan ett nytt kundavtal',
                  (await test.row(rid))['handoverStatus'] == 'confirmed'
                  and (await test.row(rid))['processing']['offerChoice'] == 'declined')
    await test.view(partner, 'property-registrations')
    test.good('ny fastighetspartner ser endast sina två egna testärenden', await page.locator('.property-table tbody tr').count() == 2 and 'Ari Exempel' not in await page.locator('#view').inner_text())
    await test.view(partner, 'property-results')
    test.good('ny fastighetspartners två slutförda testärenden skapar inget resultat- eller kickbackunderlag',
              await page.locator('[data-property-result="customers"]').inner_text() == '—'
              and await page.locator('[data-property-result="settled"]').inner_text() == '—'
              and await page.locator('[data-property-result="local-cases"]').inner_text() == '2')
    await page.reload(wait_until='networkidle')
    test.good('den nya partnerns båda ärendekedjor består efter omladdning',
              len([row for row in (await test.state())['moveins'] if row.get('partner') == partner and row['handoverStatus'] == 'confirmed']) == 2)
    current = await test.state()
    test.good('ny fastighetspartner bevarar tidigare ärenden och fristående ekonomi',
              all(row in current['moveins'] for row in existing)
              and await test.finance() == finance)


async def run():
    intake.OUT.mkdir(parents=True, exist_ok=True)
    async with async_playwright() as pw:
        browser = await pw.chromium.launch(executable_path=shutil.which('chromium') or shutil.which('chromium-browser'), args=['--no-sandbox'])
        test = intake.Suite(browser)
        try:
            for navigation in ['other-case', 'reopened-case', 'closed-dialog', 'other-route', 'other-partner']:
                await pending_handover(test, navigation)
            await save_failure_and_direct_api(test)
            await new_property_partner(test)
            test.good('inga JavaScript-fel i den sena förmedlingsdialogen', not test.errors)
            (intake.OUT / 'audit3-property.json').write_text(json.dumps({'checks': test.checks, 'errors': test.errors}, ensure_ascii=False, indent=2))
            print(json.dumps({'passed': len(test.checks), 'errors': test.errors}, ensure_ascii=False), flush=True)
        except Exception:
            if test.page:
                await test.page.screenshot(path=str(intake.OUT / 'failure.png'), full_page=True)
            (intake.OUT / 'audit3-property-failure.json').write_text(json.dumps({'checks': test.checks, 'errors': test.errors, 'traceback': traceback.format_exc()}, ensure_ascii=False, indent=2))
            raise
        finally:
            await browser.close()


if __name__ == '__main__':
    asyncio.run(run())
