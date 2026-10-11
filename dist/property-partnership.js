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
    if (!inDialog) document.querySelector(`[data-pp-focus="${ideaId}"]`)?.focus();
    P.toast(selected ? 'Fokus sparat i den här arbetsytan. Ingen beställning har skickats.' : 'Förslaget är borttaget från ert fokus.');
  }
  function showDetail(id, ideaId, opener) {
    const item = ideas.find(value => value.id === ideaId);
    if (!item || current()?.id !== id) return;
    detailReturnTarget = { partnerId: id, selector: `${opener?.closest('.pp-property-electricity') ? '.pp-property-electricity' : '.pp-idea-grid'} [data-pp-detail="${ideaId}"]` };
    P.openDialog(item.title, `<div class="pp-detail-dialog"><div class="pp-detail-intro"><span class="pp-icon">${icon(item.icon)}</span><div><span class="pp-eyebrow">FÖRSLAG TILL SAMARBETE</span><p>${e(item.benefit)}</p></div></div><div class="pp-detail-section"><h3>Behovet vi vill hjälpa till med</h3><p>${e(item.situation)}</p></div><div class="pp-detail-section"><h3>Så skulle vi kunna hjälpa er</h3><p>${e(item.proposal)}</p></div><div class="pp-detail-section pp-detail-first"><h3>Ett första underlag</h3><p>${e(item.first)}</p></div><div class="pp-detail-actions">${focusButton(item, getFocus(id).includes(ideaId), true)}<span>Ett fokus för diskussion, ingen beställning.</span></div></div>`, () => {
      const button = document.querySelector('#portal-dialog [data-pp-focus]');
      button?.addEventListener('click', () => changeFocus(id, ideaId, !getFocus(id).includes(ideaId), button));
    });
  }
  function focusSummary(focus) {
    return `<section class="pp-focus-summary" aria-labelledby="pp-focus-title"><div class="pp-focus-heading"><span class="pp-icon">${icon('target')}</span><div><h2 id="pp-focus-title">Det här vill vi utforska tillsammans</h2><p>${focus.length ? 'Era val ger ett konkret fokus för nästa samtal.' : 'Välj ett förslag nedan som är relevant för er.'}</p></div>${focus.length ? `<span class="pp-focus-count">${focus.length} valda</span>` : ''}</div>${focus.length ? `<div class="pp-focus-chips">${ideas.filter(item => focus.includes(item.id)).map(item => `<span class="pp-focus-chip"><span>${e(item.title)}</span><button type="button" data-pp-remove="${item.id}" aria-label="Ta bort ${e(item.title)} från ert fokus">${icon('close')}</button></span>`).join('')}</div><p class="pp-local-note">Valen sparas lokalt i den här arbetsytan. De är underlag för diskussion och skickar ingen beställning.</p>` : ''}</section>`;
  }
  function foundations(partner) {
    const propertySettings = P.state.propertySettings;
    const settings = plain(propertySettings) && own(propertySettings, partner.id) && plain(propertySettings[partner.id]) ? propertySettings[partner.id] : null;
    const properties = settings && Array.isArray(settings.properties) ? settings.properties.filter(value => typeof value === 'string' && value.trim()).slice(0, 100) : [];
    return `<section class="pp-foundations" aria-labelledby="pp-foundations-title"><div class="pp-section-heading"><div><span class="pp-eyebrow">TVÅ DELAR I SAMARBETET</span><h2 id="pp-foundations-title">Hyresgästernas el. Och fastighetens egen.</h2></div><p>Samlat på samma plats, med egna avtal och resultat.</p></div><div class="pp-foundation-grid"><article class="pp-foundation-card pp-movein"><div class="pp-foundation-top"><span class="pp-icon">${icon('users')}</span><span class="pp-label">INFÖR INFLYTTNING</span></div><h3>Inflyttningsservice</h3><p>Ni samlar underlag och fullmakter. Kraftringen hjälper till med elen och återkopplar till er.</p><div class="pp-movein-flow"><span>Er inflyttningslista</span>${icon('arrow')}<span>Kraftringens hantering</span></div><div class="pp-foundation-bottom"><span>Hyresgästernas elavtal och er kickback följs separat.</span><button type="button" class="btn btn-primary" data-pp-movein>Öppna inflyttningsservice ${icon('arrow')}</button></div></article><article class="pp-foundation-card pp-property-electricity"><div class="pp-foundation-top"><span class="pp-icon">${icon('building')}</span><span class="pp-label pp-label-proposal">AVTALSFÖRSLAG</span></div><h3>Fastighetsel i samma samarbete</h3><p>Inkludera ett elavtal för er egen fastighetsel: till exempel trapphus, hissar, ventilation och tvättstugor.</p><dl class="pp-contract-fields"><div><dt>Elavtal</dt><dd data-pp-contract-missing>—</dd></div><div><dt>Anläggningar</dt><dd data-pp-contract-missing>—</dd></div><div><dt>Avtalsperiod</dt><dd data-pp-contract-missing>—</dd></div></dl><div class="pp-foundation-bottom"><span>Underlag saknas för fastighetselavtalet. ${properties.length ? `${properties.length} fastigheter finns i arbetsytan; avtalsomfattningen behöver fastställas.` : 'Fastigheter och avtalsomfattning behöver fastställas.'}</span><button type="button" class="text-button" data-pp-detail="wasted-energy">Utforska möjligheterna med fastighetselen ${icon('arrow')}</button></div></article></div></section>`;
  }
  function render() {
    const partner = current();
    if (!partner) return '<div class="empty">Välj ett fastighetsbolag för att se samarbetsförslaget.</div>';
    const focus = getFocus(partner.id);
    return `<div class="property-partnership-page">
      ${P.role === 'internal' ? '<button class="text-button pp-back" data-go="partners">← Alla partners</button>' : ''}
      <div class="page-head pp-page-head"><div><span class="pp-eyebrow">${e(partner.name)}</span><h1>Ert samarbete</h1><p>En enklare vardag för er. En bättre start för hyresgästen.</p></div><span class="pp-proposal-badge">Förslag till samarbete</span></div>
      <section class="pp-hero"><div class="pp-hero-copy"><span class="pp-hero-kicker">MER VÄRDE I ERT PARTNERSKAP</span><h2>Mindre administration.<br>Mer nytta av elen.</h2><p>Från en smidigare inflyttning till bättre kontroll över fastighetselen. Här är ett förslag på vad vi kan utveckla tillsammans med er.</p><button type="button" class="btn pp-hero-cta" data-pp-explore>Hitta ert första fokus ${icon('arrow')}</button></div><div class="pp-hero-art" aria-hidden="true"><span class="pp-art-orbit"></span><div class="pp-building pp-building-back"><i></i><i></i><i></i><i></i><i></i><i></i></div><div class="pp-building pp-building-front"><div class="pp-building-roof"></div><i></i><i></i><i></i><i></i><i></i><i></i><span></span></div><span class="pp-art-node pp-art-tenant">${icon('users')} Enklare inflyttning</span><span class="pp-art-node pp-art-energy">${icon('bolt')} Smartare fastighetsel</span><div class="pp-art-ground"></div></div></section>
      ${foundations(partner)}
      ${focusSummary(focus)}
      <section class="pp-ideas" id="pp-ideas" aria-labelledby="pp-ideas-title"><div class="pp-section-heading"><div><span class="pp-eyebrow">UTGÅ FRÅN ER VARDAG</span><h2 id="pp-ideas-title" tabindex="-1">Vad skulle hjälpa er mest?</h2></div><p>Sex möjligheter att utforska. Börja där behovet är störst.</p></div><div class="pp-idea-grid">${ideas.map((item, index) => `<article class="pp-idea-card${item.recommended ? ' pp-recommended' : ''}"><div class="pp-idea-top"><span class="pp-icon">${icon(item.icon)}</span>${item.recommended ? '<span class="pp-recommended-tag">Bra första fokus</span>' : `<span class="pp-idea-number">0${index + 1}</span>`}</div><span class="pp-eyebrow">${item.category}</span><h3>${e(item.title)}</h3><p>${e(item.description)}</p><div class="pp-benefit">${icon('check')}<span>${e(item.benefit)}</span></div><div class="pp-card-actions"><button type="button" class="text-button" data-pp-detail="${item.id}" aria-label="Läs förslaget: ${e(item.title)}">Läs förslaget ${icon('arrow')}</button>${focusButton(item, focus.includes(item.id))}</div></article>`).join('')}</div></section>
      <section class="pp-start"><span class="pp-icon">${icon('target')}</span><div><h2>Börja med två konkreta behov.</h2><p>Vårt förslag är att först undersöka hur vi kan avlasta era hyresgästfrågor och hitta onödig elanvändning. Omfattning, ansvar och villkor bestämmer vi tillsammans.</p></div></section>
    </div>`;
  }
  function bind() {
    const partner = current();
    if (!partner) return;
    document.querySelectorAll('[data-pp-detail]').forEach(button => button.addEventListener('click', () => showDetail(partner.id, button.dataset.ppDetail, button)));
    document.querySelectorAll('.property-partnership-page [data-pp-focus]').forEach(button => button.addEventListener('click', () => changeFocus(partner.id, button.dataset.ppFocus, !getFocus(partner.id).includes(button.dataset.ppFocus), button)));
    document.querySelectorAll('[data-pp-remove]').forEach(button => button.addEventListener('click', () => changeFocus(partner.id, button.dataset.ppRemove, false, button)));
    document.querySelector('[data-pp-explore]')?.addEventListener('click', () => {
      document.querySelector('#pp-ideas-title')?.focus({ preventScroll: true });
      document.querySelector('#pp-ideas')?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
    });
    document.querySelector('[data-pp-movein]')?.addEventListener('click', () => {
      if (current()?.id !== partner.id) return;
      if (P.role === 'internal') P.previewPartner(partner.id);
      else P.go('overview');
    });
  }
  function renderTeaser(id = current()?.id) {
    const partner = current();
    if (!partner || partner.id !== id) return '';
    return `<section class="pp-teaser"><span class="pp-icon">${icon('building')}</span><div><span class="pp-eyebrow">ERT SAMARBETE · FÖRSLAG</span><h2>Mer än en enklare inflyttning.</h2><p>Utforska fastighetsel, färre hyresgästfrågor och nya möjligheter för era fastigheter.</p></div><button type="button" class="btn btn-secondary" data-go="property-partnership">Se samarbetsförslaget ${icon('arrow')}</button></section>`;
  }
  P.propertyPartnership = { render, bind, renderTeaser, getFocus, setFocus };
  P.register('property-partnership', { render, bind });
})();
