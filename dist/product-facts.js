(() => {
  'use strict';
  const P=window.Portal,e=P.e,root='https://www.kraftringen.se/';
  const rows=[
    ['consumer','Opti','Kraftringen jämför utfallet för rörligt kvartspris och rörligt månadspris utifrån kundens faktiska förbrukning inför fakturan. Kunden får det billigare av dessa två alternativ. Det betyder inte lägst pris bland alla marknadens avtal.','privat/el/vara-elavtal/kraftringen-opti/','elavtalet'],
    ['consumer','Kvartspris','Priset följer spotpriset varje kvart. När elen används påverkar därför kostnaden. Att flytta förbrukning från dyrare till billigare kvartar kan sänka kostnaden; priset kan också stiga.','privat/el/vara-elavtal/rorligt-kvartspris/','elavtalet'],
    ['consumer','Rörligt månadspris','Priset per kWh ändras månadsvis. Produktinformationen anger ett löpande avtal utan bindningstid. Månadspriset är inte samma sak som att den egna användningen prissätts kvart för kvart.','privat/el/vara-elavtal/rorligt-manadspris/','elavtalet'],
    ['consumer','Fastpris','Elpriset per kWh är fast under bindningstiden. Den totala kostnaden påverkas fortfarande av hur mycket el kunden använder. Lägre spotpris vid en viss tid sänker inte det avtalade kWh-priset.','privat/el/vara-elavtal/fast-elpris/','prissakring'],
    ['consumer','Vintersäkrat','Säljarens produktspecifikation anger normalt fast elhandelspris oktober–mars, inklusive dygnsprofilen, och Kvartspris april–september. Andra månader behöver vara uttryckligen avtalade. Elnät, skatt och moms omfattas inte av säkringen.','privat/el/vara-elavtal/vinteravtal/','prissakring'],
    ['business','Rörligt pris','Företagets pris sätts månadsvis i efterskott. Det består av månadsmedelpris från Nord Pool samt rörliga kostnader, fast påslag, månadsavgift och moms. Priset kan röra sig både uppåt och nedåt.','foretag/el/vara-elavtal/rorligt-elpris/','elavtalet'],
    ['business','Kvartspris','Energikostnaden följer spotpriset och kundens användning i varje kvart. Förbrukning under dyra kvartar ger högre energisnitt. Flyttbar användning kan påverka kostnaden, men pris, avgifter och övriga delar följer företagets eget erbjudande och villkor.','foretag/el/vara-elavtal/avtalsvillkor/','elavtalet'],
    ['business','Poolportfölj Trygg','Gemensamma, regelstyrda inköp för normalt 80 procent av den förväntade volymen, med 20 procent rörligt enligt säljarens specifikation. Indexdelens inköp sprids över tid. Det ger ingen garanti om lägst pris eller helt fast slutkostnad. Offertens volymbas och omfattning styr.','foretag/el/vara-elavtal/poolportfolj/','portfoljer'],
    ['business','Poolportfölj Offensiv','Den förväntade volymen fördelas normalt på 40 procent regelstyrda indexköp, 40 procent aktiva marknadsbedömningar och 20 procent rörligt enligt säljarens specifikation. Gemensam förvaltning och aktiva beslut kan ge både bättre och sämre utfall. Aktuellt mandat och avtal styr.','foretag/el/vara-elavtal/poolportfolj/','portfoljer'],
    ['business','Individuell portfölj','En egen inköpsplan där regelstyrda köp bygger upp prissäkringen över tid. Kunden och Kraftringen kommer överens om volymer, perioder och säkringsgrad. Standardhorisonten 24 månader är inte avtalslängden. Slutkostnaden följer prisformeln, genomförda köp, förbrukning och övriga komponenter.','foretag/el/vara-elavtal/portfoljforvaltning/','portfoljer'],
    ['business','Kraftringen Stabil','SYS och elområdesskillnaden säkras vid ett inköpstillfälle för överenskommen volym och period. Kundens förväntade månadsprofil ger ett förbrukningsvägt gemensamt pris endast på den säkrade, månadsutjämnade delen. Osäkrad el, dygnsprofil och övriga kostnader ligger separat. Samma komponentpris innebär inte samma fakturabelopp.','foretag/el/vara-elavtal/','ditt-val']
  ];
  const lessons = {
    'Opti':['opti',11], 'Kvartspris':['kvartspris',3], 'Rörligt månadspris':['rorligt-pris',6],
    'Rörligt pris':['rorligt-pris',6], 'Fastpris':['fastpris',9], 'Vintersäkrat':['vintersakrat',14],
    'Poolportfölj Trygg':['pool-trygg',20], 'Poolportfölj Offensiv':['pool-offensiv',23],
    'Individuell portfölj':['individuell-indexportfolj',17], 'Kraftringen Stabil':['kraftringen-stabil',26]
  };
  function lessonHref(id, segment) {
    const url = new URL('elakademin.html', location.href);
    url.searchParams.set('track', segment);
    if (P.role === 'partner') url.searchParams.set('workspace', P.partner);
    if (P.demoMode) url.searchParams.set('demo', 'inflyttning');
    url.hash = 'lesson/' + id;
    return url.pathname.split('/').pop() + url.search + url.hash;
  }
  let selected='consumer';
  function segments(){
    if(P.role==='internal')return ['business','consumer'];
    const p=P.getPartner();
    return p?.type==='property'?['consumer']:p?.salesAudiences||[p?.audience].filter(x=>['business','consumer'].includes(x));
  }
  function render(){
    const allowed=segments();if(!allowed.includes(selected))selected=allowed[0];
    const property=P.role==='partner'&&P.getPartner()?.type==='property';
    return `<div class="commercial-page product-facts"><header class="page-head"><div><span class="eyebrow">KUNSKAP / ELAVTAL</span><h1>Avtalsfakta</h1><p>Vad innebär avtalen? Läs förklaringen, se en film och gå vidare till källan.</p></div><button class="btn btn-secondary" data-go="${property?'property-default':'academy'}">${property?'Ert grundval':'Utbildning'}</button></header><div class="detail-actions" role="group" aria-label="Kundsegment">${allowed.map(x=>`<button class="btn ${x===selected?'btn-primary':'btn-secondary'}" data-fact-segment="${x}" aria-pressed="${x===selected}">${x==='business'?'Företag · B2B':'Konsument · B2C'}</button>`).join('')}</div><p class="muted">Utbildningskälla: säljarens produktspecifikation 10 oktober 2026 och Kraftringens bekräftade Stabil-upplägg. Officiella webbkällor kontrollerade 11 oktober 2026. Produktnamn och erbjudanden på webben kan skilja sig; aktuell offert och avtal styr. Sammanfattningar, inte fullständiga avtalsvillkor. Pris, påslag, avgifter, avtalstid och uppsägning kontrolleras i aktuellt erbjudande och villkor.</p><div class="product-facts-grid">${rows.filter(r=>r[0]===selected&&(!property||P.propertyDefaults.choices.includes(r[1]))).map(([segment,name,body,url,film,gap])=>{
      const [lesson, page] = lessons[name];
      return `<article class="card"><span class="eyebrow">${segment==='business'?'FÖRETAG':'KONSUMENT'}</span><h2>${e(name)}</h2><p>${e(body)}</p>${gap?`<p class="product-facts-gap"><strong>Underlag behövs:</strong> ${e(gap)}.</p>`:''}<details><summary>Fakta, villkor & film</summary><p><a href="${root+url}" target="_blank" rel="noopener">Kraftringens källa ↗</a></p><p><a href="${root+(segment==='business'?'foretag':'privat')+'/el/vara-elavtal/avtalsvillkor/'}" target="_blank" rel="noopener">Aktuella avtalsvillkor ↗</a></p><p><a href="utbildning-preview/produktspecifikationer.pdf#page=${page}" target="_blank" rel="noopener">Säljarens produktspecifikation · sida ${page} ↗</a></p><p><a href="${e(lessonHref(lesson,segment))}">Se film: ${e(name)} · hela produktlektionen →</a></p><small>Filmen och övningarna förklarar produktmodellen. Aktuell offert, prisbilaga och avtal styr villkoren.</small></details></article>`;
    }).join('')}</div></div>`;
  }
  P.productFacts={rows,segments};
  P.register('product-facts',{render,bind:()=>document.querySelectorAll('[data-fact-segment]').forEach(button=>button.addEventListener('click',()=>{
    if(segments().includes(button.dataset.factSegment))selected=button.dataset.factSegment;
    P.render();document.querySelector('[data-fact-segment][aria-pressed="true"]')?.focus();
  }))});
})();
