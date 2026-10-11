"""Browser checks for the proposed property-company partnership.

Exercises proposals through their actual interface, including local selection,
reload, independent partner/demo storage and failed-write rollback. No proposal
selection may create service cases, customer agreements or financial results.
Uses the existing Chromium installation and the coordinator's HTTP preview.
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

IDEAS = ['tenant-questions', 'housing-cost', 'wasted-energy', 'capacity', 'handover', 'opportunities']
ROUTE = 'property-partnership'


async def fresh(test, suffix=''):
    await test.fresh(BASE + suffix)
    await test.page.wait_for_function('Portal.propertyPartnership && Portal.partnerSetup')


async def create(page, name, kind='property'):
    result = await page.evaluate('''({name,kind})=>Portal.partnerSetup.saveProfile({
      name,partnerType:kind,salesAudiences:kind==='sales'?['business']:[]
    })''', {'name': name, 'kind': kind})
    if not result.get('ok'):
        raise AssertionError('Cannot create fictional QA partner: ' + str(result))
    return result['id']


async def view(test, partner, internal=False):
    if internal:
        await test.page.evaluate('(id)=>{Portal.returnInternal();Portal.selectedPartnerId=id;Portal.go("partner-detail")}', partner)
        await test.page.locator('#view [data-go="property-partnership"]').click()
    else:
        await test.view(partner)
        await test.page.locator('#nav [data-go="property-partnership"]').click()
    await test.page.locator('.property-partnership-page').wait_for()


async def focus(page, partner):
    return await page.evaluate('(id)=>Portal.propertyPartnership.getFocus(id)', partner)


async def business_data(page):
    return await page.evaluate('''()=>({
      records:JSON.stringify(Portal.state.records),offers:JSON.stringify(Portal.state.offers),
      consumerSales:JSON.stringify(Portal.state.consumerSales),moveins:JSON.stringify(Portal.state.moveins),
      kickback:JSON.stringify(Portal.partnerKickback.ledger),
      result:JSON.stringify(Portal.partnerResultsData.rows({partnerIds:['syd','vast','estate1','estate2']}))
    })''')


async def choose(page, idea):
    await reveal(page, '[data-pp-focus="' + idea + '"]')
    await page.locator('.property-partnership-page [data-pp-focus="' + idea + '"]').click()


async def reveal(page, selector):
    """Reveal a secondary idea through its real disclosure, when necessary."""
    target = page.locator('.property-partnership-page ' + selector)
    if not await target.is_visible():
        await page.locator('[data-pp-more] > summary').click()
    await target.wait_for(state='visible')


async def route_checks(test):
    await fresh(test)
    page = test.page
    new = await create(page, 'QA Samarbete Fastigheter AB')
    employee = await create(page, 'QA Samarbete Personal AB', 'employee')
    base = await business_data(page)
    for partner, name in [('estate1', 'Exempelfastigheter AB'), ('estate2', 'Exempelbo Förvaltning'), (new, 'QA Samarbete Fastigheter AB')]:
        for internal in [True, False]:
            await view(test, partner, internal)
            text = await page.locator('.property-partnership-page').inner_text()
            test.good(f'{partner} visar eget samarbetsförslag i ' + ('intern vy' if internal else 'partnerarbetsyta'), name in text and await page.evaluate('Portal.page') == ROUTE)
            test.good(f'{partner} har sex idéer utan andra partners resultat', await page.locator('.property-partnership-page [data-pp-detail]').count() == 6 and 'Savera' not in text and 'Face2face' not in text)
            await page.reload(wait_until='networkidle')
            text = await page.locator('.property-partnership-page').inner_text()
            test.good(f'{partner} bevarar egen kontext efter reload i ' + ('intern vy' if internal else 'partnerarbetsyta'), name in text and await page.evaluate('Portal.role') == ('internal' if internal else 'partner') and ('partner=' if internal else 'workspace=') + partner in page.url)
    for partner in ['syd', 'vast', employee]:
        await test.view(partner, ROUTE)
        test.good(f'{partner} saknar fastighetsförslag i partnerrollen', await page.locator('.property-partnership-page').count() == 0 and await page.evaluate('Portal.page') == 'overview' and await page.locator('#nav [data-go="property-partnership"]').count() == 0)
        await page.evaluate('(id)=>{Portal.returnInternal();Portal.selectedPartnerId=id;Portal.go("property-partnership")}', partner)
        test.good(f'{partner} saknar fastighetsförslag även från intern direktnavigation', await page.locator('.property-partnership-page').count() == 0 and await page.evaluate('Portal.page') == 'partners')
    await page.goto(BASE + '?workspace=estate1&partner=estate2#property-partnership', wait_until='networkidle')
    test.good('partnerlänk kan inte växla samarbetet till en annan internvald partner', await page.evaluate('Portal.partner') == 'estate1' and 'Exempelfastigheter AB' in await page.locator('.property-partnership-page').inner_text() and 'Exempelbo Förvaltning' not in await page.locator('.property-partnership-page').inner_text())
    test.good('navigation, reload och förslag skapar inga nya affärsunderlag eller utfall', await business_data(page) == base)


async def proposal_checks(test):
    await fresh(test)
    page = test.page
    partner = await create(page, 'QA Förslag Fastigheter AB')
    await view(test, partner)
    base = await business_data(page)
    electricity = page.locator('.pp-property-electricity')
    test.good('fastighetsel har ett separat underlag i samarbetet', await electricity.count() == 1 and 'fastighetsel' in (await electricity.inner_text()).lower())
    test.good('saknade fastighetselavtal visas inte som verkliga avtalsresultat', 'Underlag saknas' in await electricity.inner_text() and '—' in await electricity.inner_text() and await electricity.locator('form,input[type="file"],[data-sr-record],[data-ps-record]').count() == 0)
    test.good('samarbetsförslaget kräver ingen ny ärende- eller avtalsregistrering', await page.locator('.property-partnership-page form,.property-partnership-page input[type="file"]').count() == 0)
    ids = await page.locator('.property-partnership-page [data-pp-detail]').evaluate_all('(nodes)=>nodes.map(n=>n.dataset.ppDetail)')
    test.good('alla sex förbättringsförslag finns med unika identiteter', len(ids) == 6 and set(ids) == set(IDEAS))
    for idea in ids:
        await reveal(page, '[data-pp-detail="' + idea + '"]')
        await page.locator('.property-partnership-page [data-pp-detail="' + idea + '"]').click()
        dialog = page.locator('.pp-detail-dialog')
        await dialog.wait_for()
        text = await dialog.inner_text()
        test.good(f'{idea} har en läsbar fördjupning med tydlig förslagsstatus', len(text) > 180 and 'förslag' in text.lower())
        test.good(f'{idea} inför inga formulär eller verkliga tjänstelöften', await dialog.locator('form,input,textarea,select').count() == 0 and not any(word in text.lower() for word in ['tjänsten är aktiverad', 'avtalet är tecknat', 'vi garanterar', 'fullmakten är godkänd']))
        await page.locator('#close-dialog').click()
    test.good('alla fördjupningar lämnar kund-, ärende-, avtals- och ekonomidata oförändrade', await business_data(page) == base)
    for route, selector in [('property-intake', '[data-pi-mode="manual"]'), ('property-registrations', '#property-query'), ('property-results', '[data-property-result="customers"]')]:
        await test.page.evaluate('(route)=>Portal.go(route)', route)
        test.good(f'befintlig {route} går fortsatt att nå från fastighetens arbetsyta', await page.evaluate('Portal.page') == route and await page.locator(selector).count() > 0)
        if route == 'property-intake':
            test.good('både Excel och manuell registrering finns kvar utan hyresgästformulär', await page.locator('[data-pi-mode="import"]').count() == 1 and await page.locator('#property-movein-form,#movein-service,#movein-authority').count() == 0)
    test.good('visning av befintliga arbetsytor skapar inget nytt underlag', await business_data(page) == base)


async def persistence_checks(test):
    await fresh(test)
    page = test.page
    first = await create(page, 'QA Fokus Ett AB')
    second = await create(page, 'QA Fokus Två AB')
    await view(test, first)
    base = await business_data(page)
    test.good('ny fastighetspartner saknar automatiskt valda samarbetsförslag', await focus(page, first) == [])
    await choose(page, 'tenant-questions')
    await choose(page, 'wasted-energy')
    test.good('två uttryckliga fokusval markeras och sammanfattas', set(await focus(page, first)) == {'tenant-questions', 'wasted-energy'} and await page.locator('.pp-focus-summary [data-pp-remove]').count() == 2 and await page.locator('.property-partnership-page [data-pp-focus="tenant-questions"]').get_attribute('aria-pressed') == 'true')
    await page.reload(wait_until='networkidle')
    test.good('egna fokusval består efter omladdning', set(await focus(page, first)) == {'tenant-questions', 'wasted-energy'} and await page.locator('.pp-focus-summary [data-pp-remove]').count() == 2)
    await page.locator('[data-pp-remove="tenant-questions"]').click()
    test.good('fokusval kan tas bort från sammanfattningen', await focus(page, first) == ['wasted-energy'] and await page.locator('.property-partnership-page [data-pp-focus="tenant-questions"]').get_attribute('aria-pressed') == 'false')
    await view(test, second)
    test.good('annat fastighetsbolag ärver inga val från den första partnern', await focus(page, second) == [] and await page.locator('.pp-focus-summary [data-pp-remove]').count() == 0)
    await choose(page, 'capacity')
    await view(test, first)
    test.good('egna fokusval och andra bolagets val förblir skilda', await focus(page, first) == ['wasted-energy'] and await page.evaluate('(id)=>Portal.state.propertyPartnership[id].focus', second) == ['capacity'])
    before_scope = await page.evaluate('JSON.stringify(Portal.state)')
    denied = await page.evaluate('(id)=>Portal.propertyPartnership.setFocus(id,"housing-cost",true)', second)
    test.good('partnern kan inte ändra ett annat fastighetsbolags fokus via skriv-API', not denied and await page.evaluate('JSON.stringify(Portal.state)') == before_scope and await focus(page, second) == [])

    # Failed storage must leave in-memory state and previously stored values
    # intact. Fault injection uses the browser's actual Storage implementation.
    before = await page.evaluate('JSON.stringify(Portal.state)')
    await page.evaluate('''()=>{window.qaOriginalSetItem=Storage.prototype.setItem;
      Storage.prototype.setItem=function(){throw new DOMException('QA full storage','QuotaExceededError')};}''')
    await choose(page, 'housing-cost')
    test.good('misslyckat fokusval återställer hela tidigare lokala state', await page.evaluate('JSON.stringify(Portal.state)') == before and await focus(page, first) == ['wasted-energy'])
    test.good('misslyckad lagring visas utan falsk sparbekräftelse', 'kunde inte spara' in (await page.locator('body').inner_text()).lower())
    await page.evaluate('Storage.prototype.setItem=window.qaOriginalSetItem;delete window.qaOriginalSetItem')
    await page.reload(wait_until='networkidle')
    test.good('tidigare sparade fokusval består efter ett lagringsfel och reload', await focus(page, first) == ['wasted-energy'])
    test.good('fokusval, borttagning och lagringsfel skapar aldrig affärsdata', await business_data(page) == base)

    # Existing seeded identity permits a meaningful comparison in both scopes.
    await view(test, 'estate1')
    await choose(page, 'tenant-questions')
    test.good('ordinarie labbet sparar sitt eget fokus för grundpartnern', await focus(page, 'estate1') == ['tenant-questions'])
    await page.goto(BASE + '?demo=inflyttning&workspace=estate1#property-partnership', wait_until='networkidle')
    await page.locator('.property-partnership-page').wait_for()
    test.good('kunddemo ärver inte ordinarie labbets fokusval', await page.evaluate('Portal.demoMode') and await focus(page, 'estate1') == [])
    demo_base = await business_data(page)
    await choose(page, 'opportunities')
    await page.reload(wait_until='networkidle')
    test.good('kunddemots eget fokusval består i sin separata lagringsyta', await focus(page, 'estate1') == ['opportunities'] and await page.evaluate('Portal.demoMode'))
    test.good('kunddemots fokusval skapar inga exempelavtal eller ärenden', await business_data(page) == demo_base)
    await page.goto(BASE + '?workspace=estate1#property-partnership', wait_until='networkidle')
    test.good('återgång till ordinarie labbet behåller grundpartnerns egna fokusval', not await page.evaluate('Portal.demoMode') and await focus(page, 'estate1') == ['tenant-questions'])
    await view(test, first)
    test.good('kunddemo lämnar även nyskapad ordinarie partner och dess val orörda', await focus(page, first) == ['wasted-energy'] and await page.evaluate('(id)=>Portal.state.propertyPartnership[id].focus', second) == ['capacity'])


async def priority_checks(test):
    await fresh(test)
    page = test.page
    new = await create(page, 'QA Enkel Inflyttning AB')
    base = await business_data(page)
    for partner in ['estate1', 'estate2', new]:
        for internal in [True, False]:
            await view(test, partner, internal)
            summary = page.locator('.property-partnership-page .property-results-summary')
            source_text = await page.evaluate('''(id)=>{
              const host=document.createElement('div');
              host.innerHTML=Portal.propertyResults.renderSummary(id);
              return host.textContent.replace(/\\s+/g,' ').trim();
            }''', partner)
            actual_text = ' '.join((await summary.text_content()).split())
            test.good(f'{partner} visar samma kunder och kickback som den befintliga resultatkällan i ' + ('intern vy' if internal else 'partnerarbetsyta'), actual_text == source_text and len(source_text) > 100)
            if partner == new:
                test.good('ny fastighetspartner får saknat underlag och inga andra bolags resultat', await summary.get_attribute('data-property-results-availability') == 'missing' and await summary.locator('.property-results-summary-value strong').all_text_contents() == ['—', '—'])
            for mode, route, selector in [('import', 'property-import', '.pi-import-upload'), ('manual', 'property-manual', '#pi-manual-form')]:
                await view(test, partner, internal)
                await page.locator('.pp-primary-service [data-pp-intake="' + mode + '"]').click()
                test.good(f'{partner} {mode} öppnar rätt befintliga arbetsflöde från ' + ('intern vy' if internal else 'partnerarbetsyta'), await page.evaluate('Portal.page') == route and await page.evaluate('Portal.partner') == partner and await page.evaluate('Portal.role') == 'partner' and 'workspace=' + partner in page.url and await page.locator(selector).is_visible())
                test.good(f'{partner} {mode} navigation skapar inga ärenden, avtal eller ekonomiska utfall', await business_data(page) == base)
            await view(test, partner, internal)
            await page.locator('.property-partnership-page .property-results-summary [data-go="property-results"]').click()
            test.good(f'{partner} resultatlänken bevarar rätt partner i ' + ('intern vy' if internal else 'partnerarbetsyta'), await page.evaluate('Portal.page') == 'property-results' and await page.evaluate('Portal.role==="internal"?Portal.selectedPartnerId:Portal.partner') == partner)

    await view(test, new)
    ordering = await page.evaluate('''()=>{
      const selectors=['.pp-primary-service','.property-results-summary','.pp-tenant-support','.pp-property-electricity','[data-pp-more]'];
      const nodes=selectors.map(selector=>document.querySelector('.property-partnership-page '+selector));
      return nodes.every(Boolean) && nodes.slice(1).every((node,index)=>Boolean(nodes[index].compareDocumentPosition(node)&Node.DOCUMENT_POSITION_FOLLOWING));
    }''')
    test.good('inflyttning kommer först, följt av eget resultat, elfrågor, fastighetsel och fler idéer', ordering)
    more = page.locator('[data-pp-more]')
    test.good('fyra övriga idéer är samlade under en stängd fördjupning från start', not await more.evaluate('(node)=>node.open') and await more.locator('[data-pp-detail]').count() == 4 and not await more.locator('[data-pp-detail="capacity"]').is_visible())
    test.good('elfrågor och onödig förbrukning kan läsas direkt utan att öppna fler idéer', await page.locator('[data-pp-detail="tenant-questions"]').is_visible() and await page.locator('[data-pp-detail="wasted-energy"]').is_visible())
    disclosure = more.locator('summary')
    await disclosure.focus()
    await page.keyboard.press('Enter')
    test.good('fler idéer öppnas med Enter och visar innehållet', await more.evaluate('(node)=>node.open') and await more.locator('[data-pp-detail="capacity"]').is_visible())
    await page.keyboard.press('Space')
    test.good('fler idéer stängs med mellanslag utan att navigera', not await more.evaluate('(node)=>node.open') and await page.evaluate('Portal.page') == ROUTE)
    await page.keyboard.press('Enter')
    await choose(page, 'capacity')
    test.good('ett fokusval under fler idéer bevarar den öppna fördjupningen', await more.evaluate('(node)=>node.open') and await page.locator('[data-pp-focus="capacity"]').get_attribute('aria-pressed') == 'true')
    await page.evaluate('Portal.render()')
    test.good('omrendering bevarar öppna fler idéer och valt fokus', await more.evaluate('(node)=>node.open') and await focus(page, new) == ['capacity'])
    await page.locator('[data-pp-detail="capacity"]').click()
    await page.locator('#portal-dialog [data-pp-focus="capacity"]').click()
    await page.keyboard.press('Escape')
    # Native dialog close restores focus in its queued close event.
    await page.wait_for_function('document.activeElement?.dataset.ppDetail==="capacity"')
    test.good('fokusändring i dialogen behåller öppna fler idéer och återför fokus', await more.evaluate('(node)=>node.open') and await focus(page, new) == [] and await page.locator('[data-pp-detail="capacity"]').evaluate('(node)=>node===document.activeElement'))
    await choose(page, 'handover')
    await page.locator('[data-pp-remove="handover"]').click()
    test.good('borttagning från fokussammanfattningen stänger inte fler idéer', await more.evaluate('(node)=>node.open') and await focus(page, new) == [])
    await choose(page, 'housing-cost')
    await page.reload(wait_until='networkidle')
    test.good('sekundärt fokus består efter reload utan tjänsteaktivering', await focus(page, new) == ['housing-cost'] and await business_data(page) == base)
    test.good('fler idéer börjar stängda efter reload även med ett sparat sekundärt fokus', not await more.evaluate('(node)=>node.open'))
    await reveal(page, '[data-pp-focus="housing-cost"]')
    test.good('sparat sekundärt fokus visas som valt när fördjupningen öppnas', await page.locator('[data-pp-focus="housing-cost"]').get_attribute('aria-pressed') == 'true')
    await more.locator('summary').focus()
    await page.keyboard.press('Enter')
    await page.locator('[data-pp-remove="housing-cost"]').focus()
    await page.keyboard.press('Enter')
    visible_focus = await page.evaluate('''()=>{
      const active=document.activeElement;
      return !!active && active!==document.body && active.getClientRects().length>0;
    }''')
    test.good('borttagning av ett dolt sekundärt fokus återför fokus till en synlig kontroll', not await more.evaluate('(node)=>node.open') and await focus(page, new) == [] and visible_focus)
    test.good('prioritering och fördjupningar skapar aldrig affärsdata', await business_data(page) == base)


async def layout_checks(test):
    await fresh(test)
    page = test.page
    partner = await create(page, 'QA Mobil Fastigheter AB')
    await view(test, partner)
    for width in [1440, 390, 320]:
        await page.set_viewport_size({'width': width, 'height': 1000 if width == 1440 else 844})
        if await page.locator('[data-pp-more]').evaluate('(node)=>node.open'):
            await page.locator('[data-pp-more] > summary').click()
        await test.nooverflow(f'samarbetssidan saknar sidöverflöde vid {width}px')
        sizes = await page.locator('.property-partnership-page button').evaluate_all('(nodes)=>nodes.map(n=>parseFloat(getComputedStyle(n).fontSize))')
        test.good(f'samarbetssidans knappar har läsbar text vid {width}px', bool(sizes) and min(sizes) >= 13)
        await page.evaluate('window.scrollTo(0,0)')
        await test.shot(f'property-partnership-{width}.png')
        await reveal(page, '[data-pp-detail="housing-cost"]')
        targets = await page.locator('.property-partnership-page button,[data-pp-more] > summary').evaluate_all('(nodes)=>nodes.filter(n=>n.getClientRects().length).map(n=>({height:n.getBoundingClientRect().height,font:parseFloat(getComputedStyle(n).fontSize)}))')
        test.good(f'alla synliga handlingar har minst 44px höjd och 13px text vid {width}px', bool(targets) and all(item['height'] >= 44 and item['font'] >= 13 for item in targets))
        await test.nooverflow(f'öppna fler idéer saknar sidöverflöde vid {width}px')
        for idea in IDEAS:
            await reveal(page, '[data-pp-detail="' + idea + '"]')
            await page.locator('.property-partnership-page [data-pp-detail="' + idea + '"]').click()
            await page.locator('.pp-detail-dialog').wait_for()
            size = await page.locator('#portal-dialog').evaluate('(node)=>({width:node.getBoundingClientRect().width,scroll:node.scrollWidth,client:node.clientWidth})')
            test.good(f'{idea} fördjupning ryms på {width}px', size['width'] <= width and size['scroll'] <= size['client'] + 1)
            if idea == 'tenant-questions':
                targets = await page.locator('#portal-dialog button').evaluate_all('(nodes)=>nodes.filter(n=>n.getClientRects().length).map(n=>({height:n.getBoundingClientRect().height,font:parseFloat(getComputedStyle(n).fontSize)}))')
                test.good(f'dialogens handlingar har minst 44px höjd och 13px text vid {width}px', bool(targets) and all(item['height'] >= 44 and item['font'] >= 13 for item in targets))
            await page.locator('#close-dialog').click()
    await page.set_viewport_size({'width': 1440, 'height': 1000})
    button = page.locator('[data-pp-detail="tenant-questions"]')
    await button.focus()
    await page.keyboard.press('Enter')
    test.good('fördjupning kan öppnas med tangentbord och flyttar fokus till dialogen', await page.locator('#portal-dialog').evaluate('(node)=>node.open && node.contains(document.activeElement)'))
    await page.keyboard.press('Escape')
    await page.wait_for_function('document.activeElement?.dataset.ppDetail==="tenant-questions"')
    test.good('Escape stänger fördjupningen och återför fokus till öppningsknappen', not await page.locator('#portal-dialog').evaluate('(node)=>node.open') and await button.evaluate('(node)=>node===document.activeElement'))
    await button.focus()
    await page.keyboard.press('Enter')
    await page.locator('#portal-dialog [data-pp-focus="tenant-questions"]').focus()
    await page.keyboard.press('Enter')
    test.good('fokusval i fördjupningen sparas och behåller tangentbordsfokus i dialogen', 'tenant-questions' in await focus(page, partner) and await page.locator('#portal-dialog [data-pp-focus="tenant-questions"]').evaluate('(node)=>node===document.activeElement'))
    await page.keyboard.press('Enter')
    test.good('fokusval kan tas bort inne i samma fördjupning', 'tenant-questions' not in await focus(page, partner) and await page.locator('#portal-dialog [data-pp-focus="tenant-questions"]').get_attribute('aria-pressed') == 'false')
    await page.keyboard.press('Escape')
    await page.wait_for_function('document.activeElement?.dataset.ppDetail==="tenant-questions"')
    test.good('Escape återför fokus även när fokusval uppdaterat samarbetskortet', not await page.locator('#portal-dialog').evaluate('(node)=>node.open') and await page.locator('.property-partnership-page [data-pp-detail="tenant-questions"]').evaluate('(node)=>node===document.activeElement'))
    # Native dialog close events are queued. Reopening and rerendering in the
    # same task must not consume the new dialog's focus-restoration target.
    await page.evaluate('''()=>{
      const first=document.querySelector('.property-partnership-page [data-pp-detail="tenant-questions"]');
      first.focus();first.click();document.querySelector('#portal-dialog').close();
      const next=document.querySelector('.property-partnership-page [data-pp-detail="housing-cost"]');
      next.focus();next.click();document.querySelector('#portal-dialog [data-pp-focus="housing-cost"]').click();
    }''')
    await page.keyboard.press('Escape')
    await page.wait_for_function('document.activeElement?.dataset.ppDetail==="housing-cost"')
    test.good('köat close-event från tidigare dialog tappar inte den nya dialogens returfokus', not await page.locator('#portal-dialog').evaluate('(node)=>node.open') and await page.locator('.property-partnership-page [data-pp-detail="housing-cost"]').evaluate('(node)=>node===document.activeElement'))
    await reveal(page, '[data-pp-focus="handover"]')
    choose_button = page.locator('.property-partnership-page [data-pp-focus="handover"]')
    await choose_button.focus()
    await page.keyboard.press('Enter')
    test.good('ett fokusval kan göras med tangentbord', 'handover' in await focus(page, partner))


async def stored_data_checks(test):
    await fresh(test)
    page = test.page
    base = await business_data(page)
    state = await page.evaluate('JSON.parse(JSON.stringify(Portal.state))')
    malformed = [
        ('rotfält som text', 'invalid', []),
        ('rotfält som array', [], []),
        ('partnerfält som text', {'estate1': 'invalid'}, []),
        ('fokus som text', {'estate1': {'focus': 'tenant-questions'}}, []),
        ('dubbletter och okända fokus-ID', {'estate1': {'focus': ['tenant-questions', 'constructor', '__proto__', 'tenant-questions', 'missing', 9, {}]}}, ['tenant-questions']),
        ('prototypnamn som partnerfält', {'__proto__': {'focus': ['capacity']}, 'constructor': {'focus': ['wasted-energy']}}, []),
    ]
    for label, raw, expected in malformed:
        await page.evaluate('''({state,raw})=>{
          localStorage.setItem('partnerlabb.portal.v2',JSON.stringify({...state,propertyPartnership:raw}));
        }''', {'state': state, 'raw': raw})
        await page.goto(BASE + '?workspace=estate1#property-partnership', wait_until='networkidle')
        await page.reload(wait_until='networkidle')
        await page.locator('.property-partnership-page').wait_for()
        test.good('felaktigt sparat underlag hanteras: ' + label, await focus(page, 'estate1') == expected and await page.locator('.property-partnership-page [data-pp-detail]').count() == 6)
        test.good('felaktigt förslagsunderlag ändrar inga affärsdata: ' + label, await business_data(page) == base)
    await page.evaluate('localStorage.removeItem("partnerlabb.portal.v2")')
    await page.goto(BASE, wait_until='networkidle')
    name = '<img src=x onerror="window.qaNameXss=1"> Fastigheter'
    partner = await create(page, name)
    await view(test, partner)
    test.good('partnernamnets HTML visas som text på samarbetsförslaget', name in await page.locator('.property-partnership-page').inner_text() and await page.locator('.property-partnership-page img[src="x"]').count() == 0 and not await page.evaluate('window.qaNameXss===1'))
    await page.locator('[data-pp-detail="tenant-questions"]').click()
    test.good('fördjupningen utför ingen HTML från partnernamnet', await page.locator('#portal-dialog img[src="x"]').count() == 0 and not await page.evaluate('window.qaNameXss===1'))
    await page.locator('#close-dialog').click()


async def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--suite', choices=['all', 'routes', 'proposal', 'persistence', 'priority', 'layout', 'stored-data'], default='all')
    args = parser.parse_args()
    chromium = shutil.which('chromium') or shutil.which('chromium-browser')
    if not chromium:
        raise RuntimeError('Existing Chromium required; no browser installation is performed.')
    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(executable_path=chromium, headless=True, args=['--no-sandbox'])
        test = Suite(browser)
        try:
            for name, run in [('routes', route_checks), ('proposal', proposal_checks), ('persistence', persistence_checks), ('priority', priority_checks), ('layout', layout_checks), ('stored-data', stored_data_checks)]:
                if args.suite in ['all', name]:
                    await run(test)
            test.good('inga JavaScript-fel i samarbetsförslagen', not test.errors)
            print(json.dumps({'checks': len(test.checks), 'screenshots': str(OUT), 'javascript_errors': test.errors}, ensure_ascii=False), flush=True)
        except Exception:
            if test.page:
                await test.shot('property-partnership-failure.png')
            raise
        finally:
            if test.context:
                await test.context.close()
            await browser.close()


if __name__ == '__main__':
    asyncio.run(main())
