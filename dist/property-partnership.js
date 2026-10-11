(() => {
  'use strict';
  const P = window.Portal;
  if (!P) return;
  const e = P.e;
  const icon = name => ['building', 'close'].includes(name)
    ? `<svg class="icon" aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round"><path d="${name === 'building' ? 'M4 21V3h12v18M16 10h4v11M2 21h20M8 7h4M8 11h4M8 15h4M9 21v-3h3v3' : 'm6 6 12 12M18 6 6 18'}"/></svg>`
    : P.icon(name);
  const ideas = [
    {
      id: 'tenant-questions', icon: 'headphones', category: 'FRIGÖR TID', recommended: true,
      title: 'Färre elfrågor till er personal',
      description: 'Ge uthyrarna en tydlig väg vidare när hyresgästen undrar över elavtal, elräkning eller vem som ansvarar för frågan.',
      benefit: 'Mer tid för uthyrning och förvaltning.',
      situation: 'Elfrågor hamnar lätt hos uthyraren även när fastighetsbolaget inte kan lösa dem. Hyresgästen behöver hjälp att hitta rätt.',
      proposal: 'Ta fram en gemensam vägledning som hjälper er personal att hänvisa elfrågor rätt. Undersök hur Kraftringen kan ta hand om avtals- och fakturafrågor och hur andra frågor lämnas till rätt ansvarig.',
      first: 'Samla de vanligaste frågorna från uthyrning och kundservice. Beskriv vilka frågor ni vill få hjälp med och vilka kontaktvägar ni använder i dag.'
    },
    {
      id: 'wasted-energy', icon: 'bolt', category: 'FÅ BÄTTRE KONTROLL', recommended: true,
      title: 'Hitta elen som går i onödan',
      description: 'Undersök belysning, ventilation och annan gemensam elanvändning. Börja med en fastighet och en konkret fråga.',
      benefit: 'Ett underlag för åtgärder och möjliga besparingar.',
      situation: 'Förbrukning i gemensamma utrymmen kan fortsätta även när lokaler står tomma eller tiderna för verksamheten har ändrats.',
      proposal: 'Undersök elanvändningen tillsammans och prioritera avvikelser att utreda. Koppla varje förslag till en möjlig åtgärd, ansvarig och en uppskattning som bygger på faktiskt underlag.',
      first: 'Välj en fastighet. Samla förbrukningshistorik, anläggningsuppgifter och driftstider. Tillgången till data och omfattningen behöver stämmas av.'
    },
    {
      id: 'housing-cost', icon: 'home', category: 'HJÄLP DEN BOSTADSSÖKANDE',
      title: 'Visa hela boendekostnaden',
      description: 'Gör hushållselen begriplig i bostadsannonsen och inför hyresavtalet, med tydliga förutsättningar för en uppskattning.',
      benefit: 'Bättre förväntningar före inflyttningen.',
      situation: 'Hyran är tydlig, men den bostadssökande kan ha svårt att bedöma vad hushållselen innebär för den totala boendekostnaden.',
      proposal: 'Ta fram ett enkelt exempel eller ett underbyggt kostnadsintervall för hushållselen. Visa antaganden om förbrukning och pris samt vilka kostnader som ingår. Uppskattningen ska inte presenteras som ett löfte om framtida kostnad.',
      first: 'Välj bostadstyp och beskriv vad som ingår i hyran. Förbrukningsunderlag, aktuell prisgrund och hur exemplet ska uppdateras behöver fastställas.'
    },
    {
      id: 'capacity', icon: 'building', category: 'INFÖR NY UTHYRNING',
      title: 'Passar elen nästa lokalhyresgäst?',
      description: 'Få stöd att undersöka elbehovet innan en restaurang, verkstad eller annan verksamhet flyttar in.',
      benefit: 'Ett bättre beslutsunderlag inför uthyrning.',
      situation: 'En ny verksamhet kan behöva andra elektriska förutsättningar än den tidigare hyresgästen. Frågorna blir lätt dyra att upptäcka sent.',
      proposal: 'Hjälp till att beskriva den nya verksamhetens elbehov och vilka förutsättningar som behöver utredas med elnätsbolag och andra ansvariga. Kapacitet och eventuell ändring behöver verifieras av rätt part.',
      first: 'Samla anläggningsuppgifter och hyresgästens planerade utrustning, effektbehov och öppettider. Undersök vilka tekniska kontroller och kontakter som behövs.'
    },
    {
      id: 'handover', icon: 'file', category: 'VID KÖP & FÖRSÄLJNING',
      title: 'Få ordning på elen vid ett övertagande',
      description: 'Samla avtal, anläggningar och förbrukning så att elfrågorna kan följa med i fastighetsöverlämningen.',
      benefit: 'Färre lösa trådar när fastigheten byter ägare.',
      situation: 'Vid ett fastighetsförvärv finns eluppgifter ofta i olika dokument och hos flera personer. Ansvar och datum behöver bli tydliga.',
      proposal: 'Skapa ett samlat underlag med befintliga elavtal, anläggningsuppgifter, förbrukningshistorik och frågor som behöver följas upp. Beskriv vad som behöver hanteras inför tillträdet, med avtalsvillkoren som grund.',
      first: 'Samla tillträdesdatum, avtalsdokument, fakturor och en anläggningslista. Avgör vilka uppgifter som får delas och vem som ansvarar för respektive steg.'
    },
    {
      id: 'opportunities', icon: 'chart', category: 'UTVECKLA FASTIGHETEN',
      title: 'Välj rätt nästa energiinvestering',
      description: 'Undersök laddplatser, solceller, batterier eller styrning utifrån fastighetens behov och förutsättningar.',
      benefit: 'Ett tydligare underlag innan ni investerar.',
      situation: 'Flera lösningar kan verka intressanta samtidigt. Fastighetsbolaget behöver förstå vilken investering som passar och vad kalkylen bygger på.',
      proposal: 'Jämför ett fåtal relevanta alternativ med investering, möjlig nytta, driftansvar och osäkerheter. Eventuella intäkter och besparingar kräver en separat kalkyl och ska inte tas för givna.',
      first: 'Beskriv ert mål, fastighetens förutsättningar och användarnas behov. Tillgängliga data, genomförbarhet och ansvar behöver undersökas innan ett förslag kan värderas.'
    }
  ];
  const ideaIds = new Set(ideas.map(item => item.id));
  const reserved = new Set(['__proto__', 'constructor', 'prototype']);
  const own = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
  const plain = value => value !== null && typeof value === 'object' && !Array.isArray(value) && [Object.prototype, null].includes(Object.getPrototypeOf(value));
  let detailReturnTarget = null;
  const moreOpen = new Map();
  const moreKey = id => `${P.demoMode ? 'demo' : 'normal'}:${id}`;
  function rememberMore() {
    const section = document.querySelector('.property-partnership-page [data-pp-more]');
    if (section?.dataset.ppMoreKey) moreOpen.set(section.dataset.ppMoreKey, section.open);
  }
  const detailDialog = document.querySelector('#portal-dialog');
  detailDialog?.addEventListener('close', () => {
    // A queued close event can arrive after the next detail has already opened.
    if (detailDialog.open) return;
    const target = detailReturnTarget;
    detailReturnTarget = null;
    if (target && P.page === 'property-partnership' && current()?.id === target.partnerId) document.querySelector(target.selector)?.focus();
  });
  function current() {
    const id = P.role === 'partner' ? P.partner : P.selectedPartnerId;
    if (typeof id !== 'string' || reserved.has(id)) return null;
    const partner = P.getPartner(id);
    return partner?.type === 'property' ? partner : null;
  }
  function getFocus(id = current()?.id) {
    if (!id || current()?.id !== id || reserved.has(id) || P.getPartner(id)?.type !== 'property') return [];
    const root = P.state.propertyPartnership;
    const entry = plain(root) && own(root, id) ? root[id] : null;
    return plain(entry) && own(entry, 'focus') && Array.isArray(entry.focus)
      ? [...new Set(entry.focus.filter(value => typeof value === 'string' && ideaIds.has(value)))].slice(0, ideas.length)
      : [];
  }
  function setFocus(id, ideaId, selected) {
    if (current()?.id !== id || !ideaIds.has(ideaId) || typeof selected !== 'boolean') return false;
    const previous = P.state.propertyPartnership;
    const root = plain(previous) ? previous : {};
    const entry = own(root, id) && plain(root[id]) ? root[id] : {};
    const focus = getFocus(id).filter(value => value !== ideaId);
    if (selected) focus.push(ideaId);
    P.state.propertyPartnership = { ...root, [id]: { ...entry, focus } };
    if (!P.save()) {
      if (previous === undefined) delete P.state.propertyPartnership;
      else P.state.propertyPartnership = previous;
      P.toast('Kunde inte spara ert fokus. Tidigare val behålls.');
      return false;
    }
    return true;
  }
  function focusButton(item, selected, dialog = false) {
    return `<button type="button" class="btn ${selected ? 'pp-focus-selected' : dialog ? 'btn-primary' : 'btn-secondary'}" data-pp-focus="${item.id}" aria-pressed="${selected}">${icon(selected ? 'check' : 'plus')} ${selected ? 'Valt som fokus' : 'Välj som fokus'}</button>`;
  }
  function changeFocus(id, ideaId, selected, button) {
    rememberMore();
    if (!setFocus(id, ideaId, selected)) return;
    const inDialog = !!button?.closest('#portal-dialog');
    if (inDialog) {
      const item = ideas.find(value => value.id === ideaId);
      button.outerHTML = focusButton(item, selected, true);
      const replacement = document.querySelector(`#portal-dialog [data-pp-focus="${ideaId}"]`);
      replacement?.addEventListener('click', () => changeFocus(id, ideaId, !getFocus(id).includes(ideaId), replacement));
      replacement?.focus();
    }
    P.render();
    if (!inDialog) {
      const removal = button?.hasAttribute('data-pp-remove');
      const candidate = removal
        ? document.querySelector('.pp-focus-summary [data-pp-remove]') || document.querySelector('#pp-focus-title')
        : document.querySelector(`.property-partnership-page [data-pp-focus="${ideaId}"]`);
      (candidate?.getClientRects().length ? candidate : document.querySelector('#pp-focus-title'))?.focus();
    }
    P.toast(selected ? 'Fokus sparat i den här arbetsytan. Ingen beställning har skickats.' : 'Förslaget är borttaget från ert fokus.');
  }
  function showDetail(id, ideaId, opener) {
    const item = ideas.find(value => value.id === ideaId);
    if (!item || current()?.id !== id) return;
    detailReturnTarget = { partnerId: id, selector: `.property-partnership-page [data-pp-detail="${ideaId}"]` };
    P.openDialog(item.title, `<div class="pp-detail-dialog"><div class="pp-detail-intro"><span class="pp-icon">${icon(item.icon)}</span><div><span class="pp-eyebrow">FÖRSLAG TILL SAMARBETE</span><p>${e(item.benefit)}</p></div></div><div class="pp-detail-section"><h3>Behovet vi vill hjälpa till med</h3><p>${e(item.situation)}</p></div><div class="pp-detail-section"><h3>Så skulle vi kunna hjälpa er</h3><p>${e(item.proposal)}</p></div><div class="pp-detail-section pp-detail-first"><h3>Ett första underlag</h3><p>${e(item.first)}</p></div><div class="pp-detail-actions">${focusButton(item, getFocus(id).includes(ideaId), true)}<span>Ett fokus för diskussion, ingen beställning.</span></div></div>`, () => {
      const button = document.querySelector('#portal-dialog [data-pp-focus]');
      button?.addEventListener('click', () => changeFocus(id, ideaId, !getFocus(id).includes(ideaId), button));
    });
  }
  function focusSummary(focus) {
    return `<section class="pp-focus-summary" aria-labelledby="pp-focus-title"><div class="pp-focus-heading"><span class="pp-icon">${icon('target')}</span><div><h2 id="pp-focus-title" tabindex="-1">Det här vill vi utforska tillsammans</h2><p>${focus.length ? 'Era val ger ett konkret fokus för nästa samtal.' : 'Markera ett förslag som är relevant för er.'}</p></div>${focus.length ? `<span class="pp-focus-count">${focus.length} valda</span>` : ''}</div>${focus.length ? `<div class="pp-focus-chips">${ideas.filter(item => focus.includes(item.id)).map(item => `<span class="pp-focus-chip"><span>${e(item.title)}</span><button type="button" data-pp-remove="${item.id}" aria-label="Ta bort ${e(item.title)} från ert fokus">${icon('close')}</button></span>`).join('')}</div><p class="pp-local-note">Valen sparas lokalt i den här arbetsytan. De är underlag för diskussion och skickar ingen beställning.</p>` : ''}</section>`;
  }
  function ideaActions(item, focus) {
    return `<div class="pp-card-actions"><button type="button" class="text-button" data-pp-detail="${item.id}" aria-label="Läs förslaget: ${e(item.title)}">Läs förslaget ${icon('arrow')}</button>${focusButton(item, focus.includes(item.id))}</div>`;
  }
  function primaryService() {
    return `<section class="pp-primary-service" aria-labelledby="pp-primary-title"><div class="pp-hero"><div class="pp-hero-copy"><span class="pp-hero-kicker">INFLYTTNINGSSERVICE</span><h2 id="pp-primary-title">Ni ordnar inflyttningen.<br>Vi hjälper till med elen.</h2><p>Lämna inflyttningsunderlag och fullmakter på ett ställe. Följ sedan hur Kraftringen tar ärendet vidare.</p><div class="pp-intake-actions"><button type="button" class="btn pp-hero-cta" data-pp-intake="import">${icon('file')} Ladda upp Excel</button><button type="button" class="btn pp-hero-manual" data-pp-intake="manual">${icon('edit')} Registrera manuellt</button></div><span class="pp-hero-note">För flera inflyttningar eller ett enskilt underlag.</span></div><div class="pp-hero-art" aria-hidden="true"><span class="pp-art-orbit"></span><div class="pp-building pp-building-back"><i></i><i></i><i></i><i></i><i></i><i></i></div><div class="pp-building pp-building-front"><div class="pp-building-roof"></div><i></i><i></i><i></i><i></i><i></i><i></i><span></span></div><span class="pp-art-node pp-art-tenant">${icon('home')} En bra start i nya hemmet</span><div class="pp-art-ground"></div></div></div><div class="pp-service-bottom"><ol class="pp-service-steps"><li><span class="pp-step-number">1</span><div><strong>Samla underlaget</strong><p>Importera Excel eller fyll i manuellt. Bifoga befintliga fullmakter per hyresgäst.</p></div></li><li><span class="pp-step-number">2</span><div><strong>Granska och förmedla</strong><p>Kontrollera uppgifterna och välj att förmedla ett komplett underlag till Kraftringen.</p></div></li><li><span class="pp-step-number">3</span><div><strong>Följ ärendet</strong><p>Se när Kraftringen tar över, om något saknas och när återkoppling finns.</p></div></li></ol><div class="pp-service-footer"><span>${icon('users')} Fastighetsbolaget sköter allt i portalen. Hyresgästen har inga aktiva steg här.</span><button type="button" class="text-button" data-pp-workspace="property-registrations">Följ era inflyttningsärenden ${icon('arrow')}</button></div></div></section>`;
  }
  function tenantSupport(focus) {
    const item = ideas[0];
    return `<section class="pp-tenant-support pp-partner-benefit" aria-labelledby="pp-support-title"><div class="pp-benefit-top"><span class="pp-icon">${icon(item.icon)}</span><span class="pp-label pp-label-proposal">FÖRSLAG ATT UTFORSKA</span></div><span class="pp-eyebrow">MER TID FÖR UTHYRNING</span><h2 id="pp-support-title">${e(item.title)}</h2><p>Gör det enkelt för uthyraren att visa hyresgästen rätt när en elfråga dyker upp.</p><div class="pp-support-example"><span>När hyresgästen frågar</span><strong>”Vem hjälper mig med mitt elavtal?”</strong><p>En kort vägledning kan tydliggöra vilka frågor Kraftringen hanterar och vilka som hör till fastighetsbolaget eller elnätsbolaget.</p></div><p class="pp-scope-note">Kontaktvägar, ansvar och omfattning behöver vi utforma tillsammans.</p>${ideaActions(item, focus)}</section>`;
  }
  function propertyElectricity(partner, focus) {
    const propertySettings = P.state.propertySettings;
    const settings = plain(propertySettings) && own(propertySettings, partner.id) && plain(propertySettings[partner.id]) ? propertySettings[partner.id] : null;
    const properties = settings && Array.isArray(settings.properties) ? settings.properties.filter(value => typeof value === 'string' && value.trim()).slice(0, 100) : [];
    const item = ideas[1];
    return `<section class="pp-property-electricity pp-partner-benefit" aria-labelledby="pp-electricity-title"><div class="pp-benefit-top"><span class="pp-icon">${icon('building')}</span><span class="pp-label pp-label-proposal">AVTALSFÖRSLAG</span></div><span class="pp-eyebrow">FASTIGHETSBOLAGETS EGEN EL</span><h2 id="pp-electricity-title">Bättre kontroll över fastighetselen.</h2><p>Samla också elavtalet för era trapphus, hissar, ventilation och andra gemensamma utrymmen i samarbetet.</p><dl class="pp-contract-fields"><div><dt>Elavtal</dt><dd data-pp-contract-missing>—</dd></div><div><dt>Anläggningar</dt><dd data-pp-contract-missing>—</dd></div><div><dt>Avtalsperiod</dt><dd data-pp-contract-missing>—</dd></div></dl><p class="pp-contract-note">Underlag saknas för fastighetselavtalet. ${properties.length ? `${properties.length} fastigheter finns i arbetsytan; avtalsomfattningen behöver fastställas.` : 'Fastigheter och avtalsomfattning behöver fastställas.'}</p><div class="pp-energy-next"><span>${icon('bolt')} ETT MÖJLIGT NÄSTA STEG</span><h3>${e(item.title)}</h3><p>Välj en fastighet och undersök förbrukningen med faktiskt underlag. Analys, åtgärder och eventuell besparing behöver utredas.</p>${ideaActions(item, focus)}</div><p class="pp-scope-note">Ert eget elavtal är en separat företagsaffär. Det ingår inte i hyresgästernas avtal eller kickback.</p></section>`;
  }
  function extraIdeas(partner, focus) {
    return `<details class="pp-more-ideas" data-pp-more data-pp-partner="${e(partner.id)}" data-pp-more-key="${e(moreKey(partner.id))}"${moreOpen.get(moreKey(partner.id)) ? ' open' : ''}><summary><span><strong>Fler möjligheter när ni behöver dem</strong><span>Fyra idéer inför uthyrning, överlämning och investeringar.</span></span><span class="pp-more-arrow">${icon('arrow')}</span></summary><div class="pp-more-content"><p class="pp-more-intro">Förslag att utforska när ett konkret behov uppstår. Varje idé behöver rätt underlag och en gemensam bedömning.</p><div class="pp-idea-grid">${ideas.slice(2).map((item, index) => `<article class="pp-idea-card"><div class="pp-idea-top"><span class="pp-icon">${icon(item.icon)}</span><span class="pp-idea-number">0${index + 3}</span></div><span class="pp-eyebrow">${item.category}</span><h3>${e(item.title)}</h3><p>${e(item.description)}</p><div class="pp-benefit">${icon('check')}<span>${e(item.benefit)}</span></div>${ideaActions(item, focus)}</article>`).join('')}</div></div></details>`;
  }
  function render() {
    rememberMore();
    const partner = current();
    if (!partner) return '<div class="empty">Välj ett fastighetsbolag för att se samarbetsförslaget.</div>';
    const focus = getFocus(partner.id);
    return `<div class="property-partnership-page">
      ${P.role === 'internal' ? '<button class="text-button pp-back" data-go="partners">← Alla partners</button>' : ''}
      <div class="page-head pp-page-head"><div><span class="pp-eyebrow">${e(partner.name)}</span><h1>Ert samarbete</h1><p>Enkel inflyttning. Tydligt resultat. Bättre kontroll.</p></div><span class="pp-proposal-badge">Förslag till samarbete</span></div>
      ${primaryService()}
      <div class="pp-results">${P.propertyResults?.renderSummary?.(partner.id) || ''}</div>
      <div class="pp-partner-benefits">${tenantSupport(focus)}${propertyElectricity(partner, focus)}</div>
      ${focusSummary(focus)}
      ${extraIdeas(partner, focus)}
    </div>`;
  }
  function openWorkspace(id, page) {
    if (current()?.id !== id) return;
    if (P.role === 'internal') P.previewPartner(id);
    if (P.role === 'partner' && P.partner === id) P.go(page);
  }
  function bind() {
    const partner = current();
    if (!partner) return;
    document.querySelectorAll('.property-partnership-page [data-pp-detail]').forEach(button => button.addEventListener('click', () => showDetail(partner.id, button.dataset.ppDetail, button)));
    document.querySelectorAll('.property-partnership-page [data-pp-focus]').forEach(button => button.addEventListener('click', () => changeFocus(partner.id, button.dataset.ppFocus, !getFocus(partner.id).includes(button.dataset.ppFocus), button)));
    document.querySelectorAll('.property-partnership-page [data-pp-remove]').forEach(button => button.addEventListener('click', () => changeFocus(partner.id, button.dataset.ppRemove, false, button)));
    document.querySelectorAll('.property-partnership-page [data-pp-intake]').forEach(button => button.addEventListener('click', () => openWorkspace(partner.id, button.dataset.ppIntake === 'import' ? 'property-import' : 'property-manual')));
    document.querySelectorAll('.property-partnership-page [data-pp-workspace]').forEach(button => button.addEventListener('click', () => openWorkspace(partner.id, 'property-registrations')));
    const more = document.querySelector('.property-partnership-page [data-pp-more]');
    more?.addEventListener('toggle', () => { if (more.isConnected) moreOpen.set(moreKey(partner.id), more.open); });
  }
  function renderTeaser(id = current()?.id) {
    const partner = current();
    if (!partner || partner.id !== id) return '';
    return `<section class="pp-teaser"><span class="pp-icon">${icon('building')}</span><div><span class="pp-eyebrow">ERT SAMARBETE · FÖRSLAG</span><h2>Enklare inflyttning. Mer tid för era hyresgäster.</h2><p>Se hur inflyttningsservice, ert resultat och egen fastighetsel kan samlas i samarbetet.</p></div><button type="button" class="btn btn-secondary" data-go="property-partnership">Se samarbetsförslaget ${icon('arrow')}</button></section>`;
  }
  P.propertyPartnership = { render, bind, renderTeaser, getFocus, setFocus };
  P.register('property-partnership', { render, bind });
})();
