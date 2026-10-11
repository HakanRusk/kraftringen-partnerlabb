"""Browser regressions for support persistence and consistent product lessons.

Uses only synthetic data. PARTNERLABB_QA_URL selects an existing local server.
"""
import json
import os
from playwright.sync_api import sync_playwright

BASE = os.environ.get('PARTNERLABB_QA_URL', 'http://127.0.0.1:4191').rstrip('/')
checks = []


def check(name, passed):
    checks.append({'name': name, 'passed': bool(passed)})
    if not passed:
        raise AssertionError(name)


with sync_playwright() as playwright:
    browser = playwright.chromium.launch(executable_path='/usr/bin/chromium', args=['--no-sandbox'])
    context = browser.new_context(locale='sv-SE')
    context.route('https://d2ol7oe51mr4n9.cloudfront.net/**', lambda route: route.abort())
    page = context.new_page()
    errors = []
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.goto(BASE + '/?workspace=syd#support')
    page.wait_for_selector('#partner-support-form')
    before = page.evaluate('JSON.stringify(Portal.state.support)')
    title, message = 'Syntetisk supporttest', 'Fiktiv fråga för lagringstest.'
    page.fill('#partner-support-title', title)
    page.fill('#partner-support-message', message)
    page.evaluate("""() => {
        window.qaStorageSet = Storage.prototype.setItem;
        Storage.prototype.setItem = function() {
            throw new DOMException('Synthetic quota', 'QuotaExceededError');
        };
    }""")
    page.locator('#partner-support-form button[type=submit]').click()
    check('failed support save restores prior state', page.evaluate('JSON.stringify(Portal.state.support)') == before)
    check('failed support save retains both inputs', page.input_value('#partner-support-title') == title and page.input_value('#partner-support-message') == message)
    check('failed support save gives an honest retry message', 'Kunde inte spara testförfrågan' in page.locator('#toast').inner_text() and 'är sparad' not in page.locator('#toast').inner_text())
    page.evaluate('() => { Storage.prototype.setItem = window.qaStorageSet; }')
    page.locator('#partner-support-form button[type=submit]').click()
    check('retry creates exactly one request', page.evaluate('Portal.state.support.length') == len(json.loads(before)) + 1)
    check('successful retry reports saved', 'är sparad lokalt' in page.locator('#toast').inner_text())
    page.reload()
    check('successful support request survives reload', page.locator('.partner-request').filter(has_text=title).count() == 1)
    page.goto(BASE + '/?workspace=vast#support')
    check('support request stays with its original partner', page.locator('.partner-request').filter(has_text=title).count() == 0)
    page.evaluate("""() => {
        Portal.state.support.push(null, 42, {id:'qa-undated', partner:'vast', title:'Äldre fiktiv fråga', message:'Fiktivt underlag', created:'not-a-date'});
        Portal.save();
    }""")
    page.reload()
    check('malformed individual support rows do not crash the view', page.locator('#partner-support-form').is_visible())
    check('invalid support date has an explicit fallback', 'Datum saknas' in page.locator('.partner-request').filter(has_text='Äldre fiktiv fråga').inner_text())
    check('invalid support rows are preserved in storage', page.evaluate('Portal.state.support.includes(null) && Portal.state.support.includes(42)'))

    def facts(partner):
        page.goto(BASE + '/?workspace=' + partner + '#product-facts')
        page.wait_for_selector('.product-facts-grid')

    facts('syd')
    check('business catalog retains its six products', page.locator('.product-facts-grid article').count() == 6)
    stabil = page.locator('.product-facts-grid article').filter(has=page.locator('h2', has_text='Kraftringen Stabil'))
    check('Stabil describes the confirmed limited common price', 'endast på den säkrade, månadsutjämnade delen' in stabil.inner_text())
    check('Stabil no longer claims its product model is missing', 'Verifierat produktblad saknas' not in stabil.inner_text())
    stabil.locator('summary').click()
    check('Stabil links to the supplied specification', '#page=26' in stabil.locator('a', has_text='Säljarens produktspecifikation').get_attribute('href'))
    link = stabil.locator('a', has_text='Se film:').get_attribute('href')
    check('Stabil links to its complete lesson with partner context', '#lesson/kraftringen-stabil' in link and 'workspace=syd' in link and 'track=business' in link)
    check('every business product has its own full lesson', page.locator('.product-facts-grid a[href*="#lesson/"]').count() == 6)
    facts('vast')
    check('consumer catalog retains its five products', page.locator('.product-facts-grid article').count() == 5)
    winter = page.locator('.product-facts-grid article').filter(has=page.locator('h2', has_text='Vintersäkrat'))
    check('Vintersäkrat matches the supplied October–March scope', 'oktober–mars' in winter.inner_text() and 'Kvartspris april–september' in winter.inner_text() and 'november–mars' not in winter.inner_text())
    check('every consumer product links to its full lesson', page.locator('.product-facts-grid a[href*="#lesson/"]').count() == 5)
    facts('estate1')
    check('property facts retain only the three allowed choices', page.locator('.product-facts-grid article').count() == 3)
    normal_support = page.evaluate('JSON.stringify(JSON.parse(localStorage.getItem("partnerlabb.portal.v2")).support)')
    page.goto(BASE + '/?demo=inflyttning&workspace=syd#product-facts')
    check('lesson links retain the isolated demo scope', all('demo=inflyttning' in href for href in page.locator('.product-facts-grid a[href*="#lesson/"]').evaluate_all('(links)=>links.map(a=>a.getAttribute("href"))')))
    check('product facts do not change stored normal support data', page.evaluate('JSON.stringify(JSON.parse(localStorage.getItem("partnerlabb.portal.v2")).support)') == normal_support)

    # Workspace should tolerate an old non-array events field without deleting it.
    page.goto(BASE + '/?workspace=estate1#overview')
    result = page.evaluate("""() => {
        const previous = Portal.state.moveins;
        const row = {id:'qa-workbench', partner:'estate1', name:'Fiktiv hyresgäst', handoverStatus:'needs_info', events:{legacy:'retained'}};
        Portal.state.moveins = [row];
        let ok = false;
        try { const tasks = Portal.workbench.tasks({channels:['movein']}); ok = tasks.length === 1 && tasks[0].title === row.name && row.events.legacy === 'retained'; }
        finally { Portal.state.moveins = previous; }
        return ok;
    }""")
    check('workbench tolerates and preserves legacy event data', result)
    check('no JavaScript errors in support or product flows', not errors)
    browser.close()

print(json.dumps({'passed': len(checks), 'checks': checks}, ensure_ascii=False))
