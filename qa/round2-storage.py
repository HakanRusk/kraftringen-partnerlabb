"""Real-browser checks for stale-tab writes against isolated fictional data."""
import asyncio
import json
import os
import pathlib
import shutil
import tempfile
from playwright.async_api import async_playwright

BASE=os.environ.get('PARTNERLABB_QA_URL','http://127.0.0.1:4192').rstrip('/')
OUT=pathlib.Path(os.environ.get('PARTNERLABB_QA_OUTPUT',tempfile.mkdtemp(prefix='partnerlabb-storage2-')))
KEY='partnerlabb.portal.v2'

async def main():
    checks=[]; errors=[]
    def check(name,result):
        assert result,name
        checks.append(name)
    async with async_playwright() as p:
        browser=await p.chromium.launch(executable_path=shutil.which('chromium'),args=['--no-sandbox'])
        context=await browser.new_context(locale='sv-SE')
        async def new_page(path=''):
            page=await context.new_page()
            page.on('pageerror',lambda error:errors.append(str(error)))
            await page.goto(BASE+'/'+path,wait_until='networkidle')
            await page.wait_for_function('Portal.partnerSetup && Portal.moveinService')
            return page
        first=await new_page(); stale=await new_page()
        result=await first.evaluate("Portal.partnerSetup.saveProfile({name:'QA första flikens partner',partnerType:'sales',salesAudiences:['consumer']})")
        check('first tab saves a fictional partner',result['ok'])
        await stale.evaluate("Portal.go('support')")
        await stale.locator('#partner-support-title').fill('QA andra flikens fråga')
        await stale.locator('#partner-support-message').fill('Fiktiv utbildningsfråga som inte får skriva över första fliken.')
        before=await first.evaluate('localStorage.getItem('+json.dumps(KEY)+')')
        await stale.locator('#partner-support-form button[type=submit]').click()
        check('stale form leaves newer persisted data byte unchanged',await first.evaluate('localStorage.getItem('+json.dumps(KEY)+')')==before)
        check('first tab partner remains persisted',any(row['name']=='QA första flikens partner' for row in json.loads(before)['partnerProfiles'].values()))
        check('stale support mutation is rolled back',await stale.evaluate('Portal.state.support.length')==0)
        check('stale form keeps title',await stale.locator('#partner-support-title').input_value()=='QA andra flikens fråga')
        check('stale form keeps question',await stale.locator('#partner-support-message').input_value()=='Fiktiv utbildningsfråga som inte får skriva över första fliken.')
        message=await stale.locator('#toast').inner_text()
        check('failure explains another tab and reload','annan flik' in message and 'ladda om' in message.lower())
        await stale.locator('#partner-support-form button[type=submit]').click()
        check('retry without reload still preserves newer data',await first.evaluate('localStorage.getItem('+json.dumps(KEY)+')')==before)
        await stale.reload(wait_until='networkidle')
        check('reload recovers the latest partner registry',await stale.evaluate("Portal.partnerRegistry.some(p=>p.name==='QA första flikens partner')"))
        await stale.locator('#partner-support-title').fill('QA andra flikens fråga')
        await stale.locator('#partner-support-message').fill('Fiktiv utbildningsfråga som inte får skriva över första fliken.')
        await stale.locator('#partner-support-form button[type=submit]').click()
        saved=await stale.evaluate('JSON.parse(localStorage.getItem('+json.dumps(KEY)+'))')
        check('save after reload creates exactly one support request',len(saved['support'])==1)
        check('save after reload preserves first tab partner',any(row['name']=='QA första flikens partner' for row in saved['partnerProfiles'].values()))
        await stale.reload(wait_until='networkidle')
        check('both changes survive a further reload',await stale.locator('.partner-request').filter(has_text='QA andra flikens fråga').count()==1)

        # A stale reset must stop before clearing IndexedDB files or audio.
        first.on('dialog',lambda dialog:dialog.accept())
        await first.evaluate('''()=>{window.qaFileClears=0;window.qaCallClears=0;
            Portal.moveinAttachments.clearScope=async()=>{qaFileClears++;return true;};
            Portal.b2cCalls.clearScope=async()=>{qaCallClears++;return true;};
            window.qaPreviousState=Portal.state;
        }''')
        persisted=await stale.evaluate('localStorage.getItem('+json.dumps(KEY)+')')
        check('stale reset is rejected',await first.evaluate('Portal.resetScope(false)') is False)
        check('stale reset restores its original in-memory state',await first.evaluate('Portal.state===qaPreviousState'))
        check('stale reset does not clear attachments or calls',await first.evaluate('qaFileClears===0 && qaCallClears===0'))
        check('stale reset preserves newer persisted state',await stale.evaluate('localStorage.getItem('+json.dumps(KEY)+')')==persisted)

        await first.reload(wait_until='networkidle')
        check('same bytes rewritten by another tab permit a save',await first.evaluate('''()=>{const key='partnerlabb.portal.v2';localStorage.setItem(key,localStorage.getItem(key));return Portal.save();}'''))
        demo=await new_page('?demo=inflyttning#demo')
        check('isolated customer demo can save its own profile',bool((await demo.evaluate("Portal.partnerSetup.saveProfile({name:'QA separat demopartner',partnerType:'employee'})"))['ok']))
        check('demo writes do not block normal lab state',await first.evaluate('Portal.save()'))
        check('demo profile stays outside normal partner registry',not await first.evaluate("Portal.partnerRegistry.some(p=>p.name==='QA separat demopartner')"))

        await stale.evaluate("localStorage.removeItem('partnerlabb.portal.v2')")
        check('external reset removal rejects stale save',await first.evaluate('Portal.save()') is False)
        check('stale save does not resurrect a removed state',await first.evaluate("localStorage.getItem('partnerlabb.portal.v2')===null"))
        await stale.evaluate("localStorage.setItem('partnerlabb.portal.v2','{\"qaExternal\":true}')")
        check('unexpected external state also blocks old overwrite',await first.evaluate('Portal.save()') is False)
        check('unexpected external state is preserved exactly',await first.evaluate("localStorage.getItem('partnerlabb.portal.v2')")=='{"qaExternal":true}')
        check('malformed date object does not crash notifications',await first.evaluate("Portal.date({toString:null,valueOf:null})==='Ej planerat'"))
        check('array date value is treated as absent',await first.evaluate("Portal.date(['2026-10-11'])==='Ej planerat'"))
        check('valid string date is still formatted',await first.evaluate("Portal.date('2026-10-11').includes('okt')"))
        check('no JavaScript errors',not errors)
        await browser.close()
    OUT.mkdir(parents=True,exist_ok=True)
    OUT.joinpath('round2-storage.json').write_text(json.dumps({'checks':len(checks),'passed':checks,'errors':errors},ensure_ascii=False,indent=2))
    print(json.dumps({'checks':len(checks),'errors':errors},ensure_ascii=False))

if __name__=='__main__':
    asyncio.run(main())
