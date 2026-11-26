(() => {
  'use strict';
  const allowed=()=>{
    try {const P=window.parent!==window&&window.parent.Portal;return !!(P&&P.page==='commission-models'&&P.role==='internal'&&P.prototypeUsers?.admin());}
    catch {return false;}
  };
  window.StudioAccess=Object.freeze({allowed});
  if(!allowed()){
    document.body.replaceChildren();
    const box=document.createElement('main');
    const h=document.createElement('h1');h.textContent='Öppna via administrationen';
    const p=document.createElement('p');p.textContent='Provisionsstudion öppnas från Provisionsmodeller i Kraftringens administratörsvy.';
    const a=document.createElement('a');a.href='../#commission-models';a.target='_top';a.textContent='Till Partnerlabbet';box.append(h,p,a);document.body.append(box);document.body.hidden=false;return;
  }
  const sources=['../vendor/exceljs-4.4.0.min.js','model.js','app.js'];
  function next(){if(!allowed())return;const src=sources.shift();if(!src){document.body.hidden=false;return;}const script=document.createElement('script');script.src=src;script.onload=next;script.onerror=()=>{document.body.replaceChildren();document.body.textContent='Provisionsstudion kunde inte laddas. Ladda om Partnerlabbet och försök igen.';document.body.hidden=false;};document.head.append(script);}
  next();
})();
