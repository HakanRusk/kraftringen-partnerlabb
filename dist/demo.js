(() => {
  'use strict';
  const P = window.Portal;
  if (!P) return;
  const { e, icon } = P;
  const propertyId = 'estate1';

  const steps = [
    { title: 'Välj arbetssätt', short: 'Välj väg', perspective: 'Fastighetsbolaget', icon: 'home', description: 'Fastighetsbolaget sköter hela registreringen. Välj Excel för flera inflyttare eller fyll i en inflyttning för hand.', brief: 'Välj Excel eller manuell registrering.', action: 'Prova registreringen' },
    { title: 'Registrera & bifoga', short: 'Registrera', perspective: 'Fastighetsbolaget', icon: 'file', description: 'Ladda upp inflyttningslistan eller fyll i uppgifterna direkt. Bifoga fullmakter och granska underlaget före registrering.', brief: 'Registrera underlag och bifoga fullmakter.', action: 'Till era inflyttningsärenden' },
    { title: 'Förmedla underlag', short: 'Förmedla', perspective: 'Fastighetsbolaget', icon: 'arrow', description: 'Öppna ett registrerat testunderlag. När uppgifter och bilagor är klara väljer ni Förmedla till Kraftringen.', brief: 'Öppna underlaget och välj Förmedla.', action: 'Visa Kraftringens vy' },
    { title: 'Ta hand om elen', short: 'Handlägg', perspective: 'Kraftringen', icon: 'bolt', description: 'Öppna ett förmedlat ärende. Följ elhandel och elnät var för sig, dokumentera nästa steg och återkoppla till fastighetsbolaget.', brief: 'Handlägg elfrågorna och återkoppla.', action: 'Följ partnerns återkoppling' },
    { title: 'Följ samarbetet', short: 'Följ upp', perspective: 'Fastighetsbolaget', icon: 'chart', description: 'Se återkopplingen som fastighetsbolaget får. Öppna sedan Kraftringens separata uppföljning av avtal, resultat och kickback.', brief: 'Följ återkoppling och affärsresultat.', action: 'Visa kommersiellt resultat' }
  ];

  function demoURL() {
    const url = new URL(location.href);
    for (const key of ['workspace', 'movein', 'partner', 'demoStep']) url.searchParams.delete(key);
    url.searchParams.set('demo', 'inflyttning');
    url.hash = 'demo';
    return url.toString();
  }

  function portalURL() {
    const url = new URL(location.href);
    for (const key of ['demo', 'workspace', 'movein', 'partner', 'demoStep']) url.searchParams.delete(key);
    url.hash = 'overview';
    return url.toString();
  }

  function focusView() {
    document.querySelector('#view')?.focus({ preventScroll: true });
  }

  function markStep(number) {
    const url = new URL(location.href);
    if (number) url.searchParams.set('demoStep', String(number));
    else url.searchParams.delete('demoStep');
    history.replaceState(null, '', url);
  }

  function openIntake(mode = 'choice') {
    if (!P.demoMode) {
      const url = new URL(demoURL());
      url.searchParams.set('workspace', propertyId);
      url.searchParams.set('demoStep', '2');
      url.hash = mode === 'manual' ? 'property-manual' : mode === 'import' ? 'property-import' : 'property-intake';
      location.href = url.toString();
      return;
    }
    P.partner = propertyId;
    P.selectedPartnerId = propertyId;
    P.role = 'partner';
    P.propertyIntake?.open(mode, propertyId, { demoStep: 2 });
    focusView();
  }

  function openStep(number) {
    if (!P.demoMode) { location.href = demoURL(); return; }
    if (!Number.isInteger(number) || number < 1 || number > steps.length) return;
    P.partner = propertyId;
    P.selectedPartnerId = propertyId;
    if (number === 4) {
      P.role = 'internal';
      P.go('movein-cases', { demoStep: number });
    } else if (number === 2) openIntake();
    else {
      P.role = 'partner';
      P.go(number === 1 ? 'overview' : 'property-registrations', { demoStep: number });
    }
    focusView();
  }

  function openResult(partnerId = propertyId) {
    if (!P.getPartner(partnerId)) return;
    P.role = 'internal';
    P.selectedPartnerId = partnerId;
    P.go('partner-detail', { demoStep: partnerId === propertyId ? 5 : 0 });
    focusView();
  }

  function currentStep() {
    if (P.page === 'demo') return 0;
    if (P.role === 'internal') {
      if (P.page === 'movein-cases') return 4;
      if (P.page === 'partner-detail' && P.selectedPartnerId === propertyId) return 5;
      return 0;
    }
    if (P.partner !== propertyId) return 0;
    if (P.page === 'overview' || P.page === 'property-overview') return 1;
    if (['movein', 'property-intake', 'property-manual', 'property-import'].includes(P.page)) return 2;
    if (P.page === 'property-registrations') return new URLSearchParams(location.search).get('demoStep') === '5' ? 5 : 3;
    return 0;
  }

  function latestRegistration() {
    return (P.moveinService?.rows(propertyId) || []).filter(row => row && !row.demoServiceCase && row.id && row.createdAt).sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))[0] || null;
  }

  function perspective() {
    if (P.role === 'internal') return 'Kraftringen';
    return P.getPartner()?.type === 'property' ? 'Fastighetsbolaget' : P.partners[P.partner] || 'Partnern';
  }

  function guideMarkup() {
    const number = currentStep();
    const step = steps[number - 1];
    const latest = latestRegistration();
    const showingResult = number === 5 && P.role === 'internal';
    const recordAction = [3, 4, 5].includes(number) && latest ? `<button type="button" class="demo-guide-record" data-demo-open-case="${e(latest.id)}">${icon('file')} Öppna ditt testunderlag</button>` : '';
    const action = showingResult ? `<button type="button" class="demo-guide-next" data-demo-step="5">Till partnerns återkoppling ${icon('arrow')}</button>` : number ? `<button type="button" class="demo-guide-next" ${number === 5 ? 'data-demo-result="estate1"' : `data-demo-step="${number + 1}"`}>${e(step.action)} ${icon('arrow')}</button>` : '<button type="button" class="demo-guide-next" data-demo-step="1">Till inflyttningsdemot ' + icon('arrow') + '</button>';
    const description = showingResult ? 'Jämför hjälpta inflyttare, nya avtal och kickback. Serviceärenden och ekonomiska exempel följs separat.' : step?.description;
    const brief = showingResult ? 'Jämför service, avtal och resultat.' : step?.brief;
    return `<div class="demo-guide-inner">
      <div class="demo-guide-heading"><a class="demo-guide-home" href="#demo" data-demo-home>${icon('home')}<span>Kunddemo</span></a><span class="demo-guide-perspective">Du ser: <strong>${e(perspective())}</strong></span><div class="demo-guide-options">${P.resetDemo ? `<button type="button" class="demo-guide-reset" data-demo-reset>${icon('copy')}<span>Börja om</span></button>` : ''}<a class="demo-guide-exit" href="${e(portalURL())}">Avsluta demo ${icon('arrow')}</a></div></div>
      <nav class="demo-guide-navigation" aria-label="Demots fem arbetssteg"><ol>${steps.map((item, index) => `<li><button type="button" class="demo-guide-step${number === index + 1 ? ' is-current' : ''}" data-demo-step="${index + 1}"${number === index + 1 ? ' aria-current="step"' : ''} aria-label="Steg ${index + 1}: ${e(item.title)} – ${e(item.perspective)}"><span class="demo-guide-number">${index + 1}</span><span class="demo-guide-step-copy"><strong>${e(item.title)}</strong><small>${e(item.perspective)}</small></span></button></li>`).join('')}</ol></nav>
      <div class="demo-guide-bottom"><p>${step ? `<span class="demo-guide-help-full">${e(description)}</span><span class="demo-guide-help-brief">${e(brief)}</span>` : 'Utforska partnernas uppföljning eller fortsätt inflyttningsdemot.'}</p><div class="demo-guide-actions">${recordAction}${action}</div></div>
    </div>`;
  }

  function landing() {
    const start = P.demoMode ? `<button type="button" class="demo-intro-start" data-demo-step="1">Starta inflyttningsdemot ${icon('arrow')}</button>` : `<a class="demo-intro-start" href="${e(demoURL())}">Starta inflyttningsdemot ${icon('arrow')}</a>`;
    return `<div class="demo-intro">
      <section class="demo-intro-hero" aria-labelledby="demo-intro-title"><div class="demo-intro-copy"><span class="demo-intro-eyebrow"><span aria-hidden="true"></span> KRAFTRINGEN · PARTNERSAMARBETEN</span><h1 id="demo-intro-title">Ett nytt hem.<br><span>En enklare start.</span></h1><p class="demo-intro-lead">Fastighetsbolaget samlar inflyttningar och fullmakter. Kraftringen tar hand om elfrågorna och återkopplar till er.</p><div class="demo-intro-hero-actions">${start}<div class="demo-intro-entry-actions"><button type="button" data-demo-intake="import">${icon('file')} Prova Excel</button><button type="button" data-demo-intake="manual">${icon('edit')} Prova manuell registrering</button></div><button type="button" class="demo-intro-secondary" data-demo-internal>Visa Kraftringens översikt ${icon('chart')}</button></div><p class="demo-intro-note">Fiktiva exempel · Sparas separat från övriga teständringar.</p></div>
      <div class="demo-intro-visual"><img src="assets/home.jpg" alt="Illustrationsbild av ett modernt hem" width="720" height="640"><div class="demo-intro-visual-shade"></div><div class="demo-intro-image-heading"><span>EN NATURLIG DEL AV INFLYTTNINGEN</span><strong>Ni har hyresgästkontakten.<br>Vi hjälper till med elen.</strong></div><div class="demo-intro-example"><span class="demo-intro-example-icon">${icon('home')}</span><div><span>INFLYTTNINGSSERVICE</span><strong>Välkommen till ditt nya hem.</strong><p>Fastighetsbolaget sköter underlaget.<br>Kraftringen hjälper till med elen.</p></div><span class="demo-intro-example-arrow" aria-hidden="true">${icon('arrow')}</span></div></div></section>
      <section class="demo-intro-value" aria-label="Värde för varje deltagare">${[['user', 'För hyresgästen', 'Hjälp med elen genom sin fastighetsvärd.'], ['home', 'För fastighetsbolaget', 'Registrera, bifoga och följ ärendet.'], ['bolt', 'För Kraftringen', 'Samlat underlag och tydlig återkoppling.']].map(([name, title, text]) => `<article><span>${icon(name)}</span><div><h2>${e(title)}</h2><p>${e(text)}</p></div></article>`).join('')}</section>
      <section class="demo-intro-journey" aria-labelledby="demo-journey-title"><div class="demo-intro-section-heading"><div><span class="demo-intro-eyebrow">FRÅN REGISTRERING TILL ÅTERKOPPLING</span><h2 id="demo-journey-title">Fem steg. Ett sammanhängande samarbete.</h2></div><p>Prova fastighetsbolagets och Kraftringens arbete.<br>Du styr varje handling i demot.</p></div><ol class="demo-intro-phases">${steps.map((item, index) => `<li><button type="button" data-demo-step="${index + 1}"><span class="demo-intro-phase-top"><span class="demo-intro-phase-number">0${index + 1}</span>${icon(item.icon)}</span><small>${e(item.perspective)}</small><strong>${e(item.title)}</strong><span class="demo-intro-phase-link">Öppna vy ${icon('arrow')}</span></button></li>`).join('')}</ol><p class="demo-intro-process-note">Fastighetsbolaget registrerar via Excel eller manuellt, bifogar fullmakter och förmedlar ärendena. Kraftringen hanterar elfrågorna och återkopplar. Hyresgästen gör inget i portalen. Serviceärenden och elavtal följs separat.</p></section>
      <section class="demo-intro-channels" aria-labelledby="demo-channels-title"><div class="demo-intro-section-heading"><div><span class="demo-intro-eyebrow">OLIKA PARTNERS · OLIKA BEHOV</span><h2 id="demo-channels-title">Samma överblick. Rätt fokus för varje partner.</h2></div></div><div class="demo-intro-channel-grid"><button type="button" class="demo-intro-channel" data-demo-step="1"><span class="demo-intro-channel-icon">${icon('home')}</span><span class="demo-intro-channel-copy"><small>INFLYTTNINGSPARTNER</small><strong>Fastighetsbolag</strong><span>Serviceärenden, återkoppling och hjälpta inflyttare.</span></span>${icon('arrow')}</button><button type="button" class="demo-intro-channel" data-demo-result="syd"><span class="demo-intro-channel-icon">${icon('briefcase')}</span><span class="demo-intro-channel-copy"><small>FÖRETAGSFÖRSÄLJNING</small><strong>Savera</strong><span>Avtal, avtalad årsvolym, produkter och säljare.</span></span>${icon('arrow')}</button><button type="button" class="demo-intro-channel" data-demo-result="vast"><span class="demo-intro-channel-icon">${icon('users')}</span><span class="demo-intro-channel-copy"><small>KONSUMENTFÖRSÄLJNING</small><strong>Face2face</strong><span>Avtal, geografi och kundbortfall. Försäljning i Beest.</span></span>${icon('arrow')}</button></div></section>
    </div>`;
  }

  P.register('demo', { render: landing });
  P.demoGuide = { openStep, currentStep, openResult, openIntake };
  const previousAfterRender = P.afterRender;
  P.afterRender = function (...args) {
    previousAfterRender?.apply(P, args);
    document.body.classList.toggle('customer-demo-mode', !!P.demoMode);
    document.body.classList.toggle('customer-demo-intake', !!P.demoMode && ['movein', 'property-intake', 'property-manual', 'property-import'].includes(P.page));
    if (P.demoMode && !['property-registrations', 'partner-detail'].includes(P.page) && new URLSearchParams(location.search).get('demoStep') === '5') markStep(0);
    document.body.classList.toggle('customer-demo-landing', P.page === 'demo');
    if (P.page === 'demo') {
      const title = document.querySelector('#current-page');
      if (title) title.textContent = 'Kunddemo';
    }
    let guide = document.querySelector('#demo-guide');
    if (!P.demoMode || P.page === 'demo') { guide?.remove(); return; }
    if (!guide) {
      guide = document.createElement('section');
      guide.id = 'demo-guide';
      guide.className = 'demo-guide';
      guide.setAttribute('aria-label', 'Guidning för kunddemo');
      document.querySelector('#view')?.before(guide);
    }
    guide.innerHTML = guideMarkup();
    const navigation = guide.querySelector('.demo-guide-navigation');
    const active = navigation?.querySelector('[aria-current="step"]');
    if (active && navigation.scrollWidth > navigation.clientWidth) {
      navigation.scrollLeft = Math.max(0, active.offsetLeft - navigation.offsetLeft - (navigation.clientWidth - active.offsetWidth) / 2);
    }
  };

  document.addEventListener('click', event => {
    const stepButton = event.target.closest('[data-demo-step]');
    if (stepButton) { event.preventDefault(); openStep(Number(stepButton.dataset.demoStep)); return; }
    const resultButton = event.target.closest('[data-demo-result]');
    if (resultButton) { event.preventDefault(); openResult(resultButton.dataset.demoResult); return; }
    const intakeButton = event.target.closest('[data-demo-intake]');
    if (intakeButton) { event.preventDefault(); openIntake(intakeButton.dataset.demoIntake); return; }
    if (event.target.closest('[data-demo-home]')) { event.preventDefault(); P.go('demo', { demoStep: 0 }); focusView(); return; }
    if (event.target.closest('[data-demo-internal]')) { P.role = 'internal'; P.go('overview', { demoStep: 0 }); focusView(); return; }
    const recordButton = event.target.closest('[data-demo-open-case]');
    if (recordButton) { P.moveinService?.open(recordButton.dataset.demoOpenCase); return; }
    if (event.target.closest('[data-demo-reset]')) P.resetDemo?.();
  });
})();
