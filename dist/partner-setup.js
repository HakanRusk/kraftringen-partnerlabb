(() => {
  'use strict';
  const snapshots = new WeakMap();
  const allowedAudiences = ['business', 'consumer'];
  const labels = { business: 'Företag (B2B)', consumer: 'Konsument (B2C)', both: 'Företag & konsument' };
  const own = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
  const cleanName = value => typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : '';
  const nameKey = value => cleanName(value).normalize('NFKC').toLocaleLowerCase('sv-SE');
  const cleanAudiences = value => Array.isArray(value) ? allowedAudiences.filter(item => value.includes(item)) : [];
  const isSales = partner => partner && ['sales', 'field'].includes(partner.type);
  const partnerTypes = ['sales', 'property', 'employee'];
  const supportedType = type => ['sales', 'field', 'property', 'employee'].includes(type);
  const profileType = partner => isSales(partner) ? 'sales' : partner?.type;
  const typeLabels = { sales: 'Säljpartner', property: 'Fastighetsbolag', employee: 'Personalavtal' };
  const audienceChoice = audiences => audiences.length === 2 ? 'both' : audiences[0] || 'business';
  const choiceAudiences = choice => choice === 'both' ? [...allowedAudiences] : allowedAudiences.includes(choice) ? [choice] : [];

  function originalPartners(registry) {
    if (!snapshots.has(registry)) snapshots.set(registry, registry.map(partner => ({ ...partner, salesAudiences: isSales(partner) ? cleanAudiences(partner.salesAudiences?.length ? partner.salesAudiences : [partner.audience]) : [] })));
    return snapshots.get(registry);
  }

  function normalizeProfiles(raw, registry) {
    const profiles = {};
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return profiles;
    const originals = originalPartners(registry);
    const base = new Map(originals.map(partner => [partner.id, partner]));
    for (const [id, value] of Object.entries(raw)) {
      if (!/^[a-z][a-z0-9_-]{1,80}$/.test(id) || ['constructor', 'prototype', '__proto__'].includes(id)) continue;
      if (!value || typeof value !== 'object' || Array.isArray(value)) continue;
      const existing = base.get(id);
      if (existing && !supportedType(existing.type)) continue;
      const name = cleanName(value.name);
      const type = existing?.type || value.type;
      // A saved profile can rename an existing channel, never change its type.
      // This protects the meaning of already saved customer and service history.
      if (existing && value.type && value.type !== existing.type) continue;
      const salesAudiences = ['sales', 'field'].includes(type) ? cleanAudiences(value.salesAudiences) : [];
      if (!name || name.length > 90 || !supportedType(type) || (['sales', 'field'].includes(type) && !salesAudiences.length)) continue;
      profiles[id] = { id, name, type, salesAudiences };
    }
    // Resolve names from the complete saved set. Object insertion order must not
    // decide whether a renamed original partner frees its former name.
    let changed;
    do {
      changed = false;
      const names = new Map();
      const effective = originals.map(partner => ({ id: partner.id, name: profiles[partner.id]?.name || partner.name }));
      effective.push(...Object.values(profiles).filter(profile => !base.has(profile.id)));
      for (const partner of effective) {
        const key = nameKey(partner.name);
        if (!names.has(key)) names.set(key, []);
        names.get(key).push(partner.id);
      }
      for (const ids of names.values()) {
        if (ids.length < 2) continue;
        for (const id of ids) {
          if (own(profiles, id)) { delete profiles[id]; changed = true; }
        }
      }
    } while (changed);
    return profiles;
  }

  function configuredPartner(base, profile) {
    const salesAudiences = profile ? [...profile.salesAudiences] : [...(base.salesAudiences || [])];
    const partner = { ...base, ...(profile || {}) };
    if (partner.type === 'property') return {
      ...partner,
      audience: 'movein',
      salesAudiences: [],
      typeLabel: 'Inflyttningspartner',
      description: base.description || 'Fastighetspartner som förmedlar inflyttningsunderlag till Kraftringen. Registrera manuellt eller ladda upp en Excel-fil och bifoga befintliga fullmakter.'
    };
    if (partner.type === 'employee') return {
      ...partner,
      audience: 'employee',
      salesAudiences: [],
      typeLabel: 'Personalavtal',
      description: base.description || 'Företag som vill erbjuda personalavtal till sina anställda. Företagets egen elförbrukning är en separat affär.'
    };
    if (!isSales(partner)) return partner;
    const audience = salesAudiences.length === 2 ? 'mixed' : salesAudiences[0];
    const typeLabel = audience === 'mixed' ? 'Företags- & konsumentförsäljning' : audience === 'consumer' ? 'Konsumentförsäljning' : 'Företagsförsäljning';
    const segmentText = audience === 'mixed' ? 'företagskunder och konsumenter' : audience === 'consumer' ? 'konsumenter' : 'företagskunder';
    return {
      ...base,
      ...(profile || {}),
      audience,
      salesAudiences,
      typeLabel,
      description: profile ? `Säljpartner för elhandelsavtal till ${segmentText}.${base.id === 'vast' ? ' Face2face arbetar i Beest; portalen följer resultaten internt.' : ''}` : base.description,
      ...(profile && !base.name ? { description: `Säljpartner för elhandelsavtal till ${segmentText}. Försäljningsunderlag saknas.` } : {})
    };
  }

  function apply(registry, partners, rawProfiles) {
    const originals = originalPartners(registry);
    const profiles = normalizeProfiles(rawProfiles, registry);
    const next = originals.map(partner => configuredPartner(partner, profiles[partner.id]));
    for (const [id, profile] of Object.entries(profiles)) {
      if (!originals.some(partner => partner.id === id)) next.push(configuredPartner({ id, type: profile.type }, profile));
    }
    registry.splice(0, registry.length, ...next);
    for (const id of Object.keys(partners)) delete partners[id];
    for (const partner of next) partners[partner.id] = partner.name;
    return profiles;
  }

  function hydrate(rawProfiles, registry, partners) {
    return apply(registry, partners, rawProfiles);
  }

  function init(P) {
    if (P.partnerSetup) return P.partnerSetup;
    const e = P.escape || P.e;
    const getPartner = id => P.getPartner(id);
    const sync = () => typeof P.syncPartnerRegistry === 'function' ? P.syncPartnerRegistry() : apply(P.partnerRegistry, P.partners, P.state.partnerProfiles);

    function validateProfile(payload, id) {
      if (P.role !== 'internal') return { ok: false, error: 'Partnerinställningar ändras i Kraftringens interna vy.' };
      const existing = id ? getPartner(id) : null;
      if (id && (!existing || !supportedType(existing.type))) return { ok: false, error: 'Öppna en partner för att ändra inställningarna.' };
      const selectedType = payload?.partnerType ?? (existing ? profileType(existing) : 'sales');
      if (!partnerTypes.includes(selectedType)) return { ok: false, field: 'partnerType', error: 'Välj hur partnern ska samarbeta med Kraftringen.' };
      if (existing && selectedType !== profileType(existing)) return { ok: false, field: 'partnerType', error: 'Partnertypen kan inte ändras. Skapa en separat partnerprofil för ett annat samarbete; sparad historik behålls.' };
      const name = cleanName(payload?.name);
      if (!name || name.length > 90) return { ok: false, field: 'name', error: 'Ange ett partnernamn med högst 90 tecken.' };
      if (P.partnerRegistry.some(partner => partner.id !== id && nameKey(partner.name) === nameKey(name))) return { ok: false, field: 'name', error: 'Det finns redan en partner med det namnet.' };
      const salesAudiences = selectedType === 'sales' ? cleanAudiences(payload?.salesAudiences) : [];
      if (selectedType === 'sales' && !salesAudiences.length) return { ok: false, field: 'salesAudience', error: 'Välj vilka kunder partnern säljer till.' };
      return { ok: true, profile: { name, type: existing?.type || selectedType, salesAudiences } };
    }

    function saveProfile(payload, id) {
      const result = validateProfile(payload, id);
      if (!result.ok) return result;
      const profileId = id || `partner-${crypto.randomUUID()}`;
      const previous = P.state.partnerProfiles;
      const hadProfiles = own(P.state, 'partnerProfiles');
      P.state.partnerProfiles = { ...(previous || {}), [profileId]: { id: profileId, ...result.profile } };
      let saved = false;
      try { saved = P.save() === true; } catch { saved = false; }
      if (!saved) {
        if (hadProfiles) P.state.partnerProfiles = previous;
        else delete P.state.partnerProfiles;
        return { ok: false, error: 'Partnern kunde inte sparas. Dina tidigare uppgifter har behållits. Försök igen.' };
      }
      sync();
      return { ok: true, id: profileId, created: !id };
    }

    function open(id) {
      if (P.role !== 'internal') return;
      const existing = id ? getPartner(id) : null;
      if (id && (!existing || !supportedType(existing.type))) return;
      const selectedType = existing ? profileType(existing) : 'sales';
      const selected = audienceChoice(cleanAudiences(existing?.salesAudiences?.length ? existing.salesAudiences : [existing?.audience]));
      P.openDialog(existing ? 'Partnerinställningar' : 'Ny partner', `
        <form id="partner-setup-form" class="partner-setup-form">
          <p class="partner-setup-intro">${existing ? 'Uppdatera partnerns uppgifter.' : 'Välj samarbete. Partnern får en arbetsyta anpassad till sitt uppdrag.'}</p>
          ${existing ? `<div class="partner-setup-locked-type"><span class="partner-setup-type-badge">${e(typeLabels[selectedType])}</span><p>Partnertypen är låst för att bevara sparad historik. Ett annat samarbete får en separat partnerprofil.</p></div>` : `<fieldset class="partner-setup-types">
            <legend>Typ av partner</legend>
            ${[
              ['sales', 'Säljpartner', 'Säljer till företag, konsumenter eller båda.', 'chart'],
              ['property', 'Fastighetsbolag', 'Inflyttningsservice för hyresgäster.', 'home'],
              ['employee', 'Personalavtal', 'Företag som vill erbjuda elavtal till sina anställda.', 'users']
            ].map(([value, title, text, icon]) => `<label class="partner-setup-choice partner-setup-type-choice"><input type="radio" name="partnerType" value="${value}" ${selectedType === value ? 'checked' : ''} required><span class="partner-setup-choice-icon">${P.icon(icon)}</span><span><strong>${title}</strong><small>${text}</small></span><span class="partner-setup-choice-check" aria-hidden="true">${P.icon('check')}</span></label>`).join('')}
          </fieldset>`}
          <label class="field" for="partner-setup-name">Partnernamn <span aria-hidden="true">*</span>
            <input id="partner-setup-name" name="name" required maxlength="90" autocomplete="organization" value="${e(existing?.name || '')}" placeholder="Exempelpartner AB">
          </label>
          <fieldset class="partner-setup-segments" id="partner-setup-sales" ${selectedType !== 'sales' ? 'hidden disabled' : ''}>
            <legend>Kundsegment</legend>
            ${[
              ['business', 'Företag (B2B)', 'Företagsavtal och portföljprodukter.', 'briefcase'],
              ['consumer', 'Konsument (B2C)', 'Fastpris, Vintersäkrat, Opti, Kvartspris och Rörligt pris.', 'user'],
              ['both', 'Båda', 'Samma partner kan sälja till både företag och konsumenter.', 'users']
            ].map(([value, title, text, icon]) => `<label class="partner-setup-choice"><input type="radio" name="salesAudience" value="${value}" ${selected === value ? 'checked' : ''} required><span class="partner-setup-choice-icon">${P.icon(icon)}</span><span><strong>${title}</strong><small>${text}</small></span><span class="partner-setup-choice-check" aria-hidden="true">${P.icon('check')}</span></label>`).join('')}
          </fieldset>
          <p class="partner-setup-note" id="partner-setup-note"></p>
          <p class="partner-setup-error" id="partner-setup-error" role="alert" hidden></p>
          <div class="modal-actions"><button class="btn btn-secondary" id="partner-setup-cancel" type="button">Avbryt</button><button class="btn btn-primary" type="submit">${existing ? 'Spara inställningar' : 'Skapa partner'} ${P.icon('arrow')}</button></div>
          <p class="partner-setup-local">Sparas i denna webbläsare · testmiljö</p>
        </form>`, () => {
        const form = document.querySelector('#partner-setup-form');
        const nameInput = form.elements.namedItem('name');
        const error = document.querySelector('#partner-setup-error');
        const salesFields = document.querySelector('#partner-setup-sales');
        const note = document.querySelector('#partner-setup-note');
        const currentType = () => existing ? selectedType : form.elements.namedItem('partnerType').value;
        const updateType = () => {
          const type = currentType();
          salesFields.hidden = type !== 'sales';
          salesFields.disabled = type !== 'sales';
          const notes = {
            sales: existing ? 'Sparade kunduppgifter och avtal behålls. Kundsegmentet styr vilka avtalsalternativ som kan väljas.' : 'Kunder & avtal och Insikter samlas under partnern. Resultat visas när det finns underlag.',
            property: 'Fastighetsbolaget registrerar inflyttningar manuellt eller via Excel och bifogar fullmakter. Hyresgästen gör inget aktivt i portalen.',
            employee: 'Samarbetet gäller elavtal för företagets anställda. Erbjudande och arbetssätt bestäms separat; inga priser eller förmåner skapas här.'
          };
          note.textContent = notes[type];
        };
        updateType();
        nameInput.focus();
        document.querySelector('#partner-setup-cancel').onclick = P.closeDialog;
        form.addEventListener('input', () => { nameInput.setCustomValidity(''); error.hidden = true; });
        form.addEventListener('change', updateType);
        form.addEventListener('submit', event => {
          event.preventDefault();
          if (!form.reportValidity()) return;
          const choice = new FormData(form).get('salesAudience');
          const result = saveProfile({ name: nameInput.value, partnerType: currentType(), salesAudiences: choiceAudiences(choice) }, id);
          if (!result.ok) {
            error.textContent = result.error;
            error.hidden = false;
            if (result.field === 'name') { nameInput.setCustomValidity(result.error); nameInput.reportValidity(); nameInput.focus(); }
            return;
          }
          P.selectedPartnerId = result.id;
          P.closeDialog();
          const type = profileType(getPartner(result.id));
          P.go(type === 'property' ? 'partner-detail' : type === 'employee' ? 'employee-channel' : 'partner-sales');
          P.toast(result.created ? 'Partnern är skapad.' : 'Partnerinställningarna är sparade.');
        });
      });
    }

    P.partnerSetup = { open, saveProfile, validateProfile, canEdit: id => supportedType(getPartner(id)?.type), audienceLabel: audiences => labels[audienceChoice(cleanAudiences(audiences))] };
    return P.partnerSetup;
  }

  window.PartnerSetupRegistry = { hydrate, apply, normalizeProfiles, init };
})();
