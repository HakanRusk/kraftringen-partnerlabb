"""Actual font loading, original-logo geometry/clear space and UI contrast."""
import asyncio
import os
from pathlib import Path
from playwright.async_api import async_playwright

BASE = os.environ.get('PARTNERLABB_QA_URL', 'http://127.0.0.1:8000/').rstrip('/') + '/'
OUT = Path(os.environ.get('PARTNERLABB_QA_SHOTS', '/tmp/partnerlabb-shots'))

async def main():
    OUT.mkdir(parents=True, exist_ok=True)
    async with async_playwright() as pw:
        browser = await pw.chromium.launch()
        for width in (1440, 390, 320):
            context = await browser.new_context(viewport={'width': width, 'height': 900})
            page = await context.new_page()
            for route in ('', 'elakademin.html', 'utbildning-preview.html'):
                await page.goto(BASE + route)
                await page.evaluate('document.fonts.ready')
                if not route and width < 1000:
                    await page.locator('#menu-toggle').click()
                result = await page.evaluate('''() => {
                  const img = document.querySelector('.brand-logo'), box = img.getBoundingClientRect(), style = getComputedStyle(img.parentElement);
                  const rgb = value => value.match(/[\\d.]+/g).slice(0,3).map(Number);
                  const luminance = color => rgb(color).map(c => c/255).map(c => c <= .04045 ? c/12.92 : ((c+.055)/1.055)**2.4).reduce((a,c,i) => a+c*[.2126,.7152,.0722][i],0);
                  const contrast = el => {
                    const style = getComputedStyle(el); let bg = style.backgroundColor, parent = el;
                    while (bg === 'rgba(0, 0, 0, 0)' && parent.parentElement) {parent = parent.parentElement; bg = getComputedStyle(parent).backgroundColor;}
                    const a = luminance(style.color), b = luminance(bg);
                    return {text: el.textContent.trim().slice(0,40), ratio: (Math.max(a,b)+.05)/(Math.min(a,b)+.05)};
                  };
                  return {font: getComputedStyle(document.body).fontFamily, fonts: [400,500,700].every(w => document.fonts.check(w+' 16px Poppins')),
                    natural: [img.naturalWidth,img.naturalHeight], width: box.width, height: box.height,
                    padding: ['Top','Right','Bottom','Left'].map(k => parseFloat(style['padding'+k])),
                    overflow: document.documentElement.scrollWidth > innerWidth,
                    contrast: [...document.querySelectorAll('.btn-primary, .button.primary, .nav-button.active')].filter(el => el.getBoundingClientRect().width && !el.disabled).map(contrast)};
                }''')
                assert result['font'].startswith('Poppins') and result['fonts'], (width, route, result)
                assert result['natural'] == [1170,199], result
                assert abs(result['width']/result['height'] - 1170/199) < .02, result
                assert min(result['padding']) >= result['width'] * 145/1170, result
                assert not result['overflow'], (width, route, result)
                assert all(x['ratio'] >= 4.5 for x in result['contrast']), (width, route, result['contrast'])
                await page.screenshot(path=str(OUT/f'report-brand-{route or "portal"}-{width}.png'),full_page=True)
            await context.close()
        await browser.close()
    print('PASS Poppins, approved-logo geometry/clear space, CTA contrast and page widths: 3 entries × 3 sizes')

asyncio.run(main())
