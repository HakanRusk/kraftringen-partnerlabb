"""Collect a DESIGN-01 baseline with fictional property partners only.

Geometry is evidence about the current order, not a real-user usability claim.
"""
import asyncio
import json
import os
from pathlib import Path

from playwright.async_api import async_playwright, expect

BASE = os.environ.get('PARTNERLABB_QA_URL', 'http://127.0.0.1:8000/')
OUT = Path(os.environ.get('PARTNERLABB_QA_SHOTS', '/tmp/partnerlabb-shots'))
WIDTHS = (1440, 390, 320)
SECTIONS = ('.property-hero', '.property-intake-options', '.property-service-kpis',
            '.property-next-step', '.property-queue-card')


async def create_empty_property(page):
    await page.evaluate("Portal.returnInternal(); Portal.go('partners')")
    await page.get_by_role('button', name='Ny partner', exact=True).click()
    await page.locator('#partner-setup-name').fill('QA Översikt Fastigheter')
    await page.locator('input[name="partnerType"][value="property"]').check()
    await page.get_by_role('button', name='Skapa partner', exact=True).click()
    await page.locator('#partner-setup-form').wait_for(state='hidden')
    return await page.evaluate('Portal.selectedPartnerId')


async def geometry(page):
    return await page.evaluate('''selectors => Object.fromEntries(selectors.map(selector => {
      const node = document.querySelector(selector);
      if (!node) return [selector, null];
      const box = node.getBoundingClientRect();
      return [selector, {top: Math.round(box.top + scrollY), height: Math.round(box.height),
        visible: !!(box.width && box.height)}];
    }))''', SECTIONS)


async def domain_snapshot(page):
    return await page.evaluate('''() => JSON.stringify({
      records: Portal.state.records,
      offers: Portal.state.offers,
      consumerSales: Portal.state.consumerSales,
      moveins: Portal.state.moveins,
      kickback: Portal.partnerKickback?.ledger
    })''')


async def main():
    OUT.mkdir(parents=True, exist_ok=True)
    evidence = []
    async with async_playwright() as pw:
        browser = await pw.chromium.launch()
        for width in WIDTHS:
            context = await browser.new_context(viewport={'width': width, 'height': 900}, locale='sv-SE')
            page = await context.new_page()
            errors = []
            page.on('pageerror', lambda error: errors.append(str(error)))
            page.set_default_timeout(10000)
            try:
                await page.goto(BASE)
                await page.wait_for_function('window.Portal && Portal.partnerSetup && Portal.propertyIntake && Portal.workbench')
                empty_id = await create_empty_property(page)
                for label, partner_id in (('empty', empty_id), ('needs-info', 'estate2')):
                    await page.evaluate('(id) => Portal.previewPartner(id)', partner_id)
                    await expect(page.locator('.property-dashboard')).to_be_visible()
                    rows = await page.evaluate('(id) => Portal.moveinService.rows(id)', partner_id)
                    if label == 'empty':
                        assert rows == [], rows
                    else:
                        assert any(row.get('handoverStatus') == 'needs_info' for row in rows), rows
                    await page.evaluate('''() => {
                      if (!Portal.save()) throw new Error('Could not persist QA fixture');
                    }''')
                    saved_domain = await domain_snapshot(page)
                    await page.evaluate('window.scrollTo(0, 0)')
                    assert await page.evaluate('document.documentElement.scrollWidth') <= width + 1
                    evidence.append({'width': width, 'state': label, 'partner': partner_id,
                                     'sections': await geometry(page)})
                    await page.screenshot(path=str(OUT / f'property-overview-{label}-{width}.png'), full_page=True)
                    for mode in ('manual', 'import'):
                        button = page.locator(f'[data-property-intake="{mode}"]').first
                        await button.focus()
                        await expect(button).to_be_focused()
                        await page.keyboard.press('Enter')
                        await expect(page.locator('.pi-shell')).to_be_visible()
                        back = page.locator('[data-pi-back]')
                        await back.focus()
                        await page.keyboard.press('Enter')
                        await expect(page.locator('.pi-choice-grid')).to_be_visible()
                        back = page.locator('[data-pi-back]')
                        await back.focus()
                        await page.keyboard.press('Enter')
                        await expect(page.locator('.property-dashboard')).to_be_visible()
                    assert await domain_snapshot(page) == saved_domain, 'Navigation changed domain data'
                    await page.reload(wait_until='networkidle')
                    await expect(page.locator('.property-dashboard')).to_be_visible()
                    assert await domain_snapshot(page) == saved_domain, 'Reload changed domain data'
                    assert not errors, errors
                    print(f'PASS property overview baseline {label} {width}px', flush=True)
            except Exception:
                await page.screenshot(path=str(OUT / f'property-overview-failure-{width}.png'), full_page=True)
                raise
            finally:
                (OUT / 'property-overview-layout.json').write_text(
                    json.dumps(evidence, indent=2, ensure_ascii=False), encoding='utf-8')
                await context.close()
        await browser.close()
    print('PROPERTY_OVERVIEW_LAYOUT ' + json.dumps(evidence, ensure_ascii=False), flush=True)


asyncio.run(main())
