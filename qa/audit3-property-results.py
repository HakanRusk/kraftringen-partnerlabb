"""Real-browser regression for readable property-result period controls."""
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


async def results_controls(test):
    await test.fresh(intake.BASE + '?workspace=estate1#property-results')
    page = test.page
    finance = await test.finance()
    moveins = (await test.state())['moveins']
    for width in [390, 320, 1440]:
        await page.set_viewport_size({'width': width, 'height': 900})
        await page.evaluate('Portal.go("property-results")')
        for mode in ['year', 'month']:
            button = page.locator(f'[data-property-results-mode="{mode}"]')
            await button.focus()
            await page.keyboard.press('Enter')
            test.good(f'{width}px: {mode} kan väljas med tangentbord och behåller fokus',
                      await page.locator(f'[data-property-results-mode="{mode}"]').get_attribute('aria-pressed') == 'true'
                      and await page.evaluate('(mode)=>document.activeElement.dataset.propertyResultsMode===mode', mode))
            for key in ['year', 'month']:
                lines = await page.locator(f'[data-property-results-mode="{key}"]').evaluate('''node=>{
                  const range=document.createRange();range.selectNodeContents(node);
                  return new Set(Array.from(range.getClientRects()).map(rect=>Math.round(rect.top))).size;
                }''')
                test.good(f'{width}px: {key}-knappen är läsbar på en textrad i {mode}-läge', lines == 1)
            await test.nooverflow(f'{width}px: resultatfilter har ingen horisontell överbredd i {mode}-läge')
            if width < 650:
                geometry = await page.locator('.property-results-period').evaluate('''node=>({
                  period:node.getBoundingClientRect().width,
                  content:node.parentElement.clientWidth-parseFloat(getComputedStyle(node.parentElement).paddingLeft)-parseFloat(getComputedStyle(node.parentElement).paddingRight),
                  heights:Array.from(node.querySelectorAll('button')).map(button=>button.getBoundingClientRect().height)
                })''')
                test.good(f'{width}px: periodknapparna får en egen helrad och minst44px tryckyta',
                          abs(geometry['period'] - geometry['content']) <= 1
                          and min(geometry['heights']) >= 44)
                context = await page.locator('.property-results-range').evaluate('''node=>{
                  const lineCounts=Array.from(node.children).map(child=>{
                    const range=document.createRange();range.selectNodeContents(child);
                    return new Set(Array.from(range.getClientRects()).map(rect=>Math.round(rect.top))).size;
                  });
                  return {width:node.getBoundingClientRect().width,lineCounts};
                }''')
                test.good(f'{width}px: vald period och datum är läsbara på egen rad i {mode}-läge',
                          abs(context['width'] - geometry['content']) <= 1
                          and context['lineCounts'] == [1, 1])
        await page.locator('#property-results-month').select_option('2026-08')
        test.good(f'{width}px: månadsfilter visar rätt period och eget exempelresultat',
                  'Augusti 2026' in await page.locator('.property-results-range').inner_text()
                  and await page.locator('[data-property-result="customers"]').inner_text() == await page.evaluate('String(Portal.partnerResultsData.summary({partnerIds:["estate1"],months:["2026-08"]}).agreements)'))
        await test.shot(f'property-results-{width}.png')
    await page.reload(wait_until='networkidle')
    test.good('månadsvalet består efter omladdning', await page.locator('#property-results-month').input_value() == '2026-08')
    await test.view('estate2', 'property-results')
    test.good('annan fastighetspartner ärver inte periodvalet', await page.locator('[data-property-results-mode="year"]').get_attribute('aria-pressed') == 'true')
    test.good('resultatfiltrering ändrar inga serviceärenden eller finansunderlag', (await test.state())['moveins'] == moveins and await test.finance() == finance)


async def run():
    intake.OUT.mkdir(parents=True, exist_ok=True)
    async with async_playwright() as pw:
        browser = await pw.chromium.launch(executable_path=shutil.which('chromium') or shutil.which('chromium-browser'), args=['--no-sandbox'])
        test = intake.Suite(browser)
        try:
            await results_controls(test)
            test.good('inga JavaScript-fel i resultatfiltreringen', not test.errors)
            (intake.OUT / 'audit3-property-results.json').write_text(json.dumps({'checks': test.checks, 'errors': test.errors}, ensure_ascii=False, indent=2))
            print(json.dumps({'passed': len(test.checks), 'errors': test.errors}, ensure_ascii=False), flush=True)
        except Exception:
            if test.page:
                await test.page.screenshot(path=str(intake.OUT / 'failure.png'), full_page=True)
            (intake.OUT / 'audit3-property-results-failure.json').write_text(json.dumps({'checks': test.checks, 'errors': test.errors, 'traceback': traceback.format_exc()}, ensure_ascii=False, indent=2))
            raise
        finally:
            await browser.close()


if __name__ == '__main__':
    asyncio.run(run())
