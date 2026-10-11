(() => {
  'use strict';
  const P = window.Portal;
  if (!P) return;
  const { e, icon } = P;
  const qs = selector => document.querySelector(selector);
  const handoverLabels = { draft: 'Hos partnern', submitted: 'Förmedlat till Kraftringen', handling: 'Kraftringen handlägger', needs_info: 'Komplettering behövs', confirmed: 'Återkoppling klar · demo' };
  const processingLabels = { pending: 'Återstår', handling: 'Pågår · demo', confirmed: 'Handläggning klar · demo' };
  const offerLabels = { undecided: 'Ej registrerat i demo', chosen: 'Registrerat val · demo', declined: 'Avböjt · demo' };
  let search = '', partnerFilter = 'all', statusFilter = 'all';
  const propertyPartners = () => P.partnerRegistry.filter(partner => partner.type === 'property');
  const now = () => new Date().toISOString();
  const event = (text, visibility = 'shared', actor = P.role === 'internal' ? 'Kraftringen · intern demo' : (P.partners[P.partner] || 'Fastighetspartner') + ' · demo') => ({ at: now(), actor, text, visibility });
  const text = value => typeof value === 'string' ? value.trim() : '';
  const caseRow = row => !!row && typeof row === 'object' && !Array.isArray(row) && typeof row.id === 'string' && typeof row.partner === 'string';
  const date = value => P.date(value);
  const restoreRow = (row, previous) => { for (const key of Object.keys(row)) if (!Object.hasOwn(previous, key)) delete row[key]; Object.assign(row, previous); };
  const partnerIntake = row => ['manual', 'excel'].includes(row?.intakeSource);
  const validDate = value => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number(value.slice(0, 4)) < 2000 || Number(value.slice(0, 4)) > 2100) return false;
    const parsed = new Date(value + 'T12:00:00Z');
    return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
  };
  const duplicateKey = row => JSON.stringify(['partner', 'address', 'apartment', 'moveDate', 'email'].map(field => text(row[field]).replace(/\s+/g, ' ').toLocaleLowerCase('sv-SE')));
  function authorityReady(row) {
    if (!partnerIntake(row)) return row?.authorityDemo === true;
    return Array.isArray(row.authorityFiles) && row.authorityFiles.length > 0 && row.authorityFiles.length <= 3 && row.authorityFiles.every(meta => meta.partner === row.partner && P.moveinAttachments?.validMeta(meta));
  }

  function normalize(row) {
    if (!caseRow(row)) return;
    if (typeof row.serviceRequested !== 'boolean') row.serviceRequested = false;
    if (typeof row.authorityDemo !== 'boolean') row.authorityDemo = false;
    if (!Array.isArray(row.authorityFiles)) row.authorityFiles = [];
    else row.authorityFiles = row.authorityFiles.filter(meta => meta && typeof meta === 'object' && !Array.isArray(meta) && typeof meta.id === 'string' && typeof meta.name === 'string' && typeof meta.type === 'string' && typeof meta.partner === 'string' && typeof meta.scope === 'string' && typeof meta.createdAt === 'string' && Number.isInteger(meta.size));
    if (!Object.hasOwn(handoverLabels, row.handoverStatus)) row.handoverStatus = 'draft';
    if (!row.processing || typeof row.processing !== 'object' || Array.isArray(row.processing)) row.processing = {};
    for (const field of ['trade', 'network']) if (!Object.hasOwn(processingLabels, row.processing[field])) row.processing[field] = 'pending';
    if (!Object.hasOwn(offerLabels, row.processing.offerChoice)) row.processing.offerChoice = 'undecided';
    if (!Array.isArray(row.events)) row.events = [];
  }
  function init() {
    if (!Array.isArray(P.state.moveins)) P.state.moveins = [];
    P.state.moveins.forEach(normalize);
    if (!P.state.moveinServiceSeeded) {
      const examples = [
        { id: 'service-demo-001', partner: 'estate1', name: 'Ari Exempel', email: 'ari@inflyttare.example', address: 'Exempelgatan 4', apartment: '1402', postcode: '222 22', city: 'Lund', moveDate: '2026-11-01', handoverStatus: 'submitted', processing: { trade: 'pending', network: 'pending', offerChoice: 'undecided' }, next: 'Ta emot underlaget och stäm av hyresgästens behov', createdAt: '2026-10-07T08:40:00Z', events: [{ at: '2026-10-07T08:40:00Z', actor: 'Exempelfastigheter AB · demo', text: 'Fiktivt serviceunderlag förmedlat till Kraftringen. Tjänsteval och fullmaktssteg är endast testmarkeringar.', visibility: 'shared' }] },
        { id: 'service-demo-002', partner: 'estate1', name: 'Noor Demo', email: 'noor@inflyttare.example', address: 'Demovägen 12', apartment: '1201', postcode: '211 22', city: 'Malmö', moveDate: '2026-11-15', handoverStatus: 'handling', processing: { trade: 'handling', network: 'pending', offerChoice: 'chosen' }, next: 'Följ upp elnätsdelen och återkoppla om nästa steg', createdAt: '2026-10-06T10:00:00Z', events: [{ at: '2026-10-07T09:00:00Z', actor: 'Kraftringen · intern demo', text: 'Exempel på återkoppling: elhandelsdelen handläggs, elnätsdelen återstår. Erbjudandevalet är fiktivt; inget avtal är tecknat.', visibility: 'shared' }, { at: '2026-10-06T10:00:00Z', actor: 'Exempelfastigheter AB · demo', text: 'Fiktivt serviceunderlag förmedlat i test.', visibility: 'shared' }] },
        { id: 'service-demo-003', partner: 'estate2', name: 'Mika Exempel', email: 'mika@inflyttare.example', address: 'Testallén 8', apartment: '1301', postcode: '252 22', city: 'Helsingborg', moveDate: '2026-11-01', handoverStatus: 'needs_info', processing: { trade: 'pending', network: 'pending', offerChoice: 'undecided' }, next: 'Stäm av lägenhetsuppgiften med hyresgästen', createdAt: '2026-10-05T14:00:00Z', events: [{ at: '2026-10-07T07:50:00Z', actor: 'Kraftringen · intern demo', text: 'Exempel på komplettering: kontrollera lägenhetsuppgiften med hyresgästen. Ingen kontakt har tagits i verkligheten.', visibility: 'shared' }] }
      ];
      for (const row of examples) if (!P.state.moveins.some(existing => caseRow(existing) && existing.id === row.id)) P.state.moveins.push({ ...row, phone: '', serviceRequested: true, authorityDemo: true, updatedAt: row.createdAt, owner: 'Demoansvarig A', nextDate: '', demoServiceCase: true });
      P.state.moveinServiceSeeded = true;
    }
  }
  function rows(partnerId) {
    init();
    return P.state.moveins.filter(row => caseRow(row) && P.getPartner(row.partner)?.type === 'property' && (!partnerId || row.partner === partnerId) && (P.role === 'internal' || row.partner === P.partner)).slice().sort((a, b) => String(b.updatedAt || b.createdAt || '').localeCompare(String(a.updatedAt || a.createdAt || '')));
  }
  function statusLabel(row) {
    if (partnerIntake(row) && (row.handoverStatus || 'draft') === 'draft') return authorityReady(row) ? (canForward(row) ? 'Klart att förmedla' : 'Underlag behöver kompletteras') : 'Fullmakt saknas';
    return handoverLabels[row?.handoverStatus] || handoverLabels.draft;
  }
  function canForward(row) {
    return !!row && row.serviceRequested === true && authorityReady(row) && ['draft', 'needs_info'].includes(row.handoverStatus || 'draft') && ['name', 'email', 'address', 'moveDate'].every(field => text(row[field])) && /^[^\s@]+@[^\s@]+\.example$/i.test(text(row.email)) && validDate(text(row.moveDate)) && (!partnerIntake(row) || ['postcode', 'city'].every(field => text(row[field])));
  }
  function createPartnerRecords(inputRows, options = {}) {
    const result = { ok: false, saved: false, created: [], duplicates: [], errors: [] };
    if (P.role !== 'partner' || P.getPartner(P.partner)?.type !== 'property') { result.errors.push({ index: -1, message: 'Byt till fastighetsbolagets arbetsyta för att registrera underlag.' }); return result; }
    if (!Array.isArray(inputRows) || !inputRows.length || inputRows.length > 500 || !['manual', 'excel'].includes(options.source)) { result.errors.push({ index: -1, message: 'Registrera mellan en och 500 rader manuellt eller från Excel.' }); return result; }
    const batchId = text(options.batchId), filename = text(options.filename);
    if (batchId.length > 100 || filename.length > 180 || /[\u0000-\u001f\u007f]/.test(batchId + filename)) { result.errors.push({ index: -1, message: 'Importens namn eller identifierare är för långt eller ogiltigt.' }); return result; }
    init();
    const previous = P.state.moveins;
    const existing = new Map(previous.filter(caseRow).map(row => [duplicateKey(row), row]));
    const limits = { name: 120, email: 254, address: 180, apartment: 40, postcode: 12, city: 80, moveDate: 10, phone: 40 };
    const required = ['name', 'email', 'address', 'postcode', 'city', 'moveDate'];
    inputRows.forEach((input, index) => {
      if (!input || typeof input !== 'object' || Array.isArray(input) || input.partner !== P.partner) { result.errors.push({ index, message: 'Raden behöver höra till det valda fastighetsbolaget.' }); return; }
      const values = {};
      if(input.desiredProduct && !['Kvartspris','Opti','Rörligt månadspris'].includes(input.desiredProduct)){result.errors.push({index,message:'Välj ett giltigt önskat elavtal.'});return;}
      if(input.desiredProduct)values.desiredProduct=input.desiredProduct;
      for (const [field, limit] of Object.entries(limits)) {
        if (input[field] !== undefined && input[field] !== null && typeof input[field] !== 'string') { result.errors.push({ index, message: 'Uppgifterna behöver vara text eller datum i formatet ÅÅÅÅ-MM-DD.' }); return; }
        values[field] = text(input[field]);
        if (values[field].length > limit || /[\u0000-\u001f\u007f]/.test(values[field])) { result.errors.push({ index, message: 'En uppgift är för lång eller innehåller otillåtna kontrolltecken.' }); return; }
      }
      if (required.some(field => !values[field]) || !validDate(values.moveDate)) { result.errors.push({ index, message: 'Fyll i namn, kontakt, adress, postnummer, ort och ett giltigt inflyttningsdatum.' }); return; }
      if (!/^[^\s@]+@[^\s@]+\.example$/i.test(values.email)) { result.errors.push({ index, message: 'Använd en fiktiv e-postadress som slutar på .example i labbet.' }); return; }
      const authorityFiles = input.authorityFiles === undefined ? [] : input.authorityFiles;
      if (!Array.isArray(authorityFiles) || authorityFiles.length > 3 || authorityFiles.some(meta => meta?.partner !== P.partner || !P.moveinAttachments?.validMeta(meta)) || new Set(authorityFiles.map(meta => meta.id)).size !== authorityFiles.length) { result.errors.push({ index, message: 'Bifoga högst tre fullmaktsfiler som hör till det här fastighetsbolaget och arbetsytan.' }); return; }
      const key = duplicateKey({ ...values, partner: P.partner });
      if (existing.has(key)) { result.duplicates.push({ index, id: existing.get(key).id, message: 'Underlaget finns redan för samma partner, bostad, inflyttningsdatum och kontakt.' }); return; }
      const timestamp = now();
      const row = { ...values, id: 'movein-' + crypto.randomUUID(), partner: P.partner, intakeSource: options.source, intakeBatchId: batchId, intakeFilename: filename, authorityFiles: authorityFiles.map(meta => ({ id: meta.id, name: meta.name, type: meta.type, size: meta.size, scope: meta.scope, partner: meta.partner, createdAt: meta.createdAt })), serviceRequested: true, authorityDemo: false, handoverStatus: 'draft', processing: { trade: 'pending', network: 'pending', offerChoice: 'undecided' }, owner: 'Ej tilldelad', next: '', nextDate: '', createdAt: timestamp, updatedAt: timestamp, events: [event(options.source === 'excel' ? 'Fastighetsbolaget registrerade ett serviceunderlag från Excel i test.' : 'Fastighetsbolaget registrerade ett serviceunderlag manuellt i test.', 'shared', 'Fastighetsbolaget · demo')] };
      if (row.authorityFiles.length) row.events.unshift(event(row.authorityFiles.length + ' fullmaktsbilaga/bilagor bifogade av fastighetsbolaget. Innehåll och behörighet är inte juridiskt verifierade.', 'shared', 'Fastighetsbolaget · demo'));
      result.created.push(row); existing.set(key, row);
    });
    if (result.errors.length) { result.created = []; return result; }
    if (!result.created.length) { result.ok = true; return result; }
    P.state.moveins = [...result.created, ...previous];
    if (!P.save()) {
      P.state.moveins = previous; result.created = [];
      result.errors.push({ index: -1, message: 'Underlagen kunde inte sparas. Inga nya ärenden skapades; behåll importen och prova igen.' });
      return result;
    }
    result.saved = true; result.ok = true;
    return result;
  }
  function findVisible(id) { return rows().find(row => row.id === id); }
  function forward(id, options = {}) {
    const row = findVisible(id);
    if (P.role === 'internal') { P.toast('Fastighetsbolaget förmedlar sitt underlag från partnerns arbetsyta.'); return false; }
    const changes = row?.handoverStatus === 'needs_info' && options.changes ? Object.fromEntries(['address', 'apartment', 'moveDate', 'postcode', 'city'].map(field => [field, text(options.changes[field])])) : {};
    const reply = text(options.reply);
    if (reply.length > 800 || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(reply) || Object.entries(changes).some(([field, value]) => value.length > ({ address: 180, apartment: 40, moveDate: 10, postcode: 12, city: 80 })[field] || /[\u0000-\u001f\u007f]/.test(value))) { P.toast('Kontrollera kompletteringens längd och uppgifter.'); return false; }
    if (!canForward({ ...row, ...changes })) { P.toast('Komplettera underlaget och bifoga fullmakten innan du förmedlar. Äldre intressen har inget registrerat serviceuppdrag.'); return false; }
    if (partnerIntake(row) && !row.authorityFiles.every(meta => P.moveinAttachments?.hasVerified(meta))) { P.toast('Fullmaktsfilen behöver kontrolleras i den här webbläsaren innan underlaget förmedlas.'); return false; }
    const previous = structuredClone(row);
    Object.assign(row, changes);
    const supplement = row.handoverStatus === 'needs_info';
    const previousPlan = supplement ? text(row.next) : '';
    const previousPlanDate = supplement ? text(row.nextDate) : '';
    row.handoverStatus = 'submitted'; row.updatedAt = now(); row.submittedAt = row.updatedAt;
    row.submissionType = supplement ? 'supplement' : 'initial';
    if (supplement) {
      if (previousPlan) row.events.unshift(event('Tidigare kompletteringsplan avslutad vid ny förmedling: ' + previousPlan + (previousPlanDate ? ' · planerat ' + date(previousPlanDate) : '') + '.'));
      row.next = ''; row.nextDate = '';
    }
    row.events.unshift(event(supplement ? 'Kompletterat serviceunderlag förmedlat på nytt i test. Inget skickas till Kraftringen eller elnätsbolag.' : 'Serviceunderlag förmedlat till Kraftringens demovy. Inget skickas till Kraftringen eller elnätsbolag.'));
    if (reply) row.events.unshift(event('Partnerns komplettering/meddelande: ' + reply));
    if (!P.save()) { restoreRow(row, previous); P.toast('Förmedlingen kunde inte sparas. Underlaget ligger kvar hos fastighetsbolaget.'); return false; }
    return true;
  }
  async function forwardChecked(id, options = {}) {
    const row = findVisible(id);
    if (!row || P.role === 'internal') return forward(id, options);
    const candidate = row.handoverStatus === 'needs_info' ? { ...row, ...options.changes } : row;
    if (!canForward(candidate)) return forward(id, options);
    const revision = JSON.stringify(row);
    let checks;
    if (partnerIntake(row)) {
      checks = await Promise.all(row.authorityFiles.map(meta => P.moveinAttachments.exists(meta)));
    }
    if (typeof options.isCurrent === 'function' && !options.isCurrent()) { P.toast('Förmedlingen avbröts när du lämnade formuläret. Underlaget ligger kvar hos fastighetsbolaget.'); return false; }
    if (checks?.some(exists => !exists)) { P.toast('En fullmaktsfil saknas i den här webbläsaren. Bifoga den igen innan du förmedlar underlaget.'); return false; }
    if (findVisible(id) !== row || JSON.stringify(row) !== revision) { P.toast('Ärendet har ändrats. Öppna det igen innan du förmedlar.'); return false; }
    return forward(id, options);
  }
  function activityFor(partnerId) {
    return rows(partnerId).flatMap(row => row.events.filter(item => item && (P.role === 'internal' || item.visibility === 'shared')).map(item => ({ ...item, id: row.id, name: row.name, company: row.name, partner: row.partner, kind: 'movein' }))).sort((a, b) => String(b.at).localeCompare(String(a.at)));
  }
  const badge = row => `<span class="movein-service-status movein-service-status-${e(row.handoverStatus || 'draft')}">${e(statusLabel(row))}</span>`;
  const note = value => `<p class="movein-service-note">${icon('shield')}<span>${e(value)}</span></p>`;
  function timeline(row) {
    const visible = row.events.filter(item => item && (P.role === 'internal' || item.visibility === 'shared'));
    return visible.length ? `<div class="movein-service-timeline">${visible.map(item => `<article class="${item.visibility === 'internal' ? 'movein-service-private' : ''}"><span>${icon(item.visibility === 'internal' ? 'shield' : 'mail')}</span><div><small>${e(date(item.at))} · ${e(item.actor)}${item.visibility === 'internal' ? ' · Intern anteckning' : ' · Delad återkoppling'}</small><p>${e(item.text)}</p></div></article>`).join('')}</div>` : '<p class="muted">Ingen återkoppling ännu.</p>';
  }
  const mayAttach = row => P.role === 'partner' && row.partner === P.partner && row.serviceRequested === true && ['draft', 'needs_info'].includes(row.handoverStatus);
  function refreshCase(row) {
    const dialog = qs('#portal-dialog');
    const isCurrent = dialog?.open && dialog.querySelector('.movein-service-detail')?.dataset.caseId === row.id;
    const form = isCurrent ? qs('#movein-service-forward-form') : null;
    const fields = ['partnerReply', 'address', 'apartment', 'moveDate', 'postcode', 'city'];
    const draft = form ? Object.fromEntries(fields.filter(name => form.elements.namedItem(name)).map(name => [name, form.elements.namedItem(name).value])) : null;
    const focused = form?.contains(document.activeElement) ? document.activeElement.name : '';
    P.render();
    if (!isCurrent || findVisible(row.id) !== row) return;
    open(row.id);
    const nextForm = qs('#movein-service-forward-form');
    if (draft && nextForm) for (const [name, value] of Object.entries(draft)) {
      const input = nextForm.elements.namedItem(name);
      if (input) input.value = value;
    }
    if (focused) nextForm?.elements.namedItem(focused)?.focus();
  }
  function attachmentPanel(row) {
    const files = row.authorityFiles || [], editable = mayAttach(row);
    return `<section class="movein-attachment-panel"><h3>Fullmakter</h3><p>${files.length ? 'Bifogade exempel på fullmakter. Kraftringen kan öppna underlaget vid handläggning.' : partnerIntake(row) ? 'Bifoga fullmakten innan underlaget förmedlas. Du kan spara ärendet och lägga till filen senare.' : row.authorityDemo ? 'Det här äldre exempelärendet har en bevarad testmarkering, ingen bifogad fullmaktsfil.' : 'Ingen fullmaktsfil finns bifogad.'}</p><div class="movein-attachment-list">${files.map((meta, index) => `<div class="movein-attachment-item"><span><strong>${e(meta.name)}</strong><small>${e(Math.ceil(meta.size / 1024))} kB · <span data-attachment-status="${index}">Kontrollerar lokal fil…</span></small></span><div class="movein-attachment-actions"><button class="btn btn-secondary btn-small" type="button" data-attachment-download="${index}">${icon('download')} Hämta</button>${editable ? `<button class="btn btn-secondary btn-small" type="button" data-attachment-remove="${index}">Ta bort</button>` : ''}</div></div>`).join('')}</div>${editable ? `<label class="field">Bifoga fullmakt${files.length >= 3 ? '<span class="form-hint">Tre bilagor är redan bifogade. Ta bort en för att ersätta den.</span>' : `<input id="movein-attachment-files" type="file" accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg" multiple><span class="form-hint">PDF, PNG eller JPEG · högst 5 MB per fil · max tre bilagor per ärende.</span>`}</label>` : ''}<p class="movein-attachment-feedback" id="movein-attachment-feedback" role="status" aria-live="polite"></p><p>Filerna stannar i den här webbläsaren. En bilaga innebär ingen juridisk verifiering av fullmakt eller ett tecknat avtal.</p></section>`;
  }
  function bindAttachments(row) {
    const feedback = qs('#movein-attachment-feedback');
    const message = (value, failed = false) => { if (!feedback?.isConnected) return; feedback.textContent = value; feedback.className = 'movein-attachment-feedback ' + (failed ? 'is-error' : 'is-success'); };
    (row.authorityFiles || []).forEach((meta, index) => {
      P.moveinAttachments?.exists(meta).then(exists => {
        const element = qs(`[data-attachment-status="${index}"]`);
        if (feedback?.isConnected && element) element.textContent = exists ? 'Sparad i denna webbläsare' : 'Fil saknas · bifoga igen';
      });
    });
    document.querySelectorAll('[data-attachment-download]').forEach(button => {
      const fileId = row.authorityFiles[Number(button.dataset.attachmentDownload)]?.id;
      button.onclick = async () => {
      if (findVisible(row.id) !== row) return;
      const meta = row.authorityFiles.find(file => file.id === fileId);
      if (!meta) { message('Bilagan är redan bortkopplad från ärendet. Öppna ärendet igen för att se aktuella filer.', true); return; }
      button.disabled = true;
      try { await P.moveinAttachments.download(meta); message('Exempelfilen är hämtad från denna webbläsare.'); }
      catch (failure) { message(failure.message || 'Bilagan kunde inte hämtas.', true); }
      finally { if (button.isConnected) button.disabled = false; }
      };
    });
    document.querySelectorAll('[data-attachment-remove]').forEach(button => {
      const fileId = row.authorityFiles[Number(button.dataset.attachmentRemove)]?.id;
      button.onclick = async () => {
      if (!mayAttach(row) || findVisible(row.id) !== row) return;
      const index = row.authorityFiles.findIndex(file => file.id === fileId), meta = row.authorityFiles[index];
      if (!meta || !confirm('Ta bort fullmaktsbilagan från detta testärende?')) return;
      const previous = structuredClone(row);
      row.authorityFiles.splice(index, 1); row.updatedAt = now(); row.events.unshift(event('Fastighetsbolaget tog bort fullmaktsbilagan ' + meta.name + ' i test.', 'shared', 'Fastighetsbolaget · demo'));
      if (!P.save()) { restoreRow(row, previous); message('Bilagan är kvar. Ändringen kunde inte sparas.', true); return; }
      const revision = JSON.stringify(row);
      button.disabled = true;
      try { await P.moveinAttachments.removeUnreferenced(meta); if (findVisible(row.id) === row && mayAttach(row)) refreshCase(row); }
      catch (failure) {
        if (findVisible(row.id) === row && JSON.stringify(row) === revision) {
          restoreRow(row, previous);
          const restored = P.save();
          refreshCase(row);
          P.toast(restored ? 'Bilagan kunde inte tas bort. Den tidigare kopplingen är återställd.' : 'Bilagan kunde inte tas bort. Kopplingen finns kvar i denna flik men kunde inte sparas.');
        } else {
          if (findVisible(row.id) === row) refreshCase(row);
          P.toast('Den bortkopplade lokala filen kunde inte rensas. Nyare ändringar i ärendet behålls.');
        }
      }
      finally { if (button.isConnected) button.disabled = false; }
      };
    });
    const picker = qs('#movein-attachment-files');
    if (picker) picker.onchange = async () => {
      if (!mayAttach(row) || findVisible(row.id) !== row) return;
      const selected = Array.from(picker.files || []);
      if (!selected.length) return;
      if ((row.authorityFiles || []).length + selected.length > 3) { picker.value = ''; message('Ett ärende kan ha högst tre bilagor. Ta bort en fil innan du bifogar fler.', true); return; }
      picker.disabled = true; message('Sparar bilagorna lokalt…');
      let uploaded = [];
      try {
        uploaded = await P.moveinAttachments.storeFiles(selected, row.partner);
        if (!mayAttach(row) || findVisible(row.id) !== row || !picker.isConnected) { await Promise.all(uploaded.map(meta => P.moveinAttachments.remove(meta).catch(() => false))); return; }
        const previous = structuredClone(row);
        row.authorityFiles.push(...uploaded); row.updatedAt = now(); row.events.unshift(event(uploaded.length + ' fullmaktsbilaga/bilagor bifogade av fastighetsbolaget. Innehåll och behörighet är inte juridiskt verifierade.', 'shared', 'Fastighetsbolaget · demo'));
        if (!P.save()) { restoreRow(row, previous); await Promise.all(uploaded.map(meta => P.moveinAttachments.remove(meta).catch(() => false))); message('Bilagorna kunde inte kopplas till ärendet. Välj filerna igen.', true); return; }
        refreshCase(row); P.toast('Fullmaktsbilagan är sparad i den här webbläsaren.');
      } catch (failure) { message(failure.message || 'Bilagan kunde inte sparas.', true); }
      finally { if (picker.isConnected) { picker.disabled = false; picker.value = ''; } }
    };
  }
  function detail(row) {
    const internal = P.role === 'internal';
    const controls = internal ? internalForm(row) : partnerForm(row);
    return `<div class="movein-service-detail" data-case-id="${e(row.id)}"><div class="movein-service-detail-head"><div><span class="eyebrow">INFLYTTNINGSSERVICE · EXEMPEL</span><h2>${e(row.name)}</h2><p>${e(P.partners[row.partner])}</p></div>${badge(row)}</div><dl class="movein-service-meta"><div><dt>Bostad</dt><dd>${e(row.address)}${row.apartment ? ', lgh ' + e(row.apartment) : ''}<br>${e(row.postcode)} ${e(row.city)}</dd></div><div><dt>Inflyttning</dt><dd>${e(date(row.moveDate))}</dd></div><div><dt>Kontakt · exempel</dt><dd>${e(row.email)}${row.phone ? '<br>' + e(row.phone) : ''}</dd></div><div><dt>Registrerat</dt><dd>${e(date(row.createdAt))}${partnerIntake(row) ? '<br>' + (row.intakeSource === 'excel' ? 'Excelimport' : 'Manuellt av fastighetsbolaget') : ''}</dd></div></dl><div class="movein-service-prerequisites"><span>${icon(row.serviceRequested ? 'check' : 'clock')}<strong>Serviceuppdrag</strong>${row.serviceRequested ? (partnerIntake(row) ? 'Registrerat av fastighetsbolaget' : 'Bevarat testval') : 'Inget uppdrag registrerat'}</span><span>${icon(authorityReady(row) ? 'check' : 'file')}<strong>Fullmakt</strong>${partnerIntake(row) ? (row.authorityFiles.length ? 'Bilaga finns · inte juridiskt verifierad' : 'Bilaga saknas') : (row.authorityDemo ? 'Äldre testmarkering · ingen giltig fullmakt' : 'Ingen fullmaktsmarkering')}</span></div>${!row.serviceRequested ? note('Äldre intresseregistrering. Ett serviceuppdrag eller en fullmakt har inte lagts till i efterhand.') : ''}<section class="card"><h3>Önskat elavtal</h3><p>${e(row.desiredProduct || 'Inget avtalsval registrerat')}</p><small>Förslag i underlaget. Inte tecknat avtal eller verifierad fullmakt.</small></section>${attachmentPanel(row)}<section class="movein-service-processing"><h3>Kraftringens handläggning</h3><div class="movein-service-process-grid"><article>${icon('bolt')}<strong>Elhandel</strong><span>${e(processingLabels[row.processing.trade])}</span></article><article>${icon('home')}<strong>Elnät</strong><span>${e(processingLabels[row.processing.network])}</span></article><article>${icon('user')}<strong>Elhandelsavtal · separat status</strong><span>${e(offerLabels[row.processing.offerChoice])}</span></article></div><p class="movein-service-small">Fastighetsbolaget sköter registrering och fullmaktsunderlag. Hyresgästen behöver inte använda portalen. Elhandel och nödvändig elnätshantering följs separat; ett färdigt serviceärende skapar inget avtal i demot.</p></section>${row.next ? `<div class="movein-service-next"><small>NÄSTA STEG${row.nextDate ? ' · ' + e(date(row.nextDate)) : ''}</small><strong>${e(row.next)}</strong></div>` : ''}${controls}<section class="movein-service-feedback"><h3>Återkoppling & aktivitet</h3>${timeline(row)}</section>${note('Alla ändringar sparas lokalt. Bilagor och testmarkeringar innebär inget giltigt avtal eller kommersiellt utfall.')}</div>`;
  }
  function internalForm(row) {
    if (row.handoverStatus === 'draft') return `<div class="movein-service-awaiting"><strong>Underlaget ligger hos fastighetsbolaget</strong><p>Partnern registrerar underlaget och bifogar fullmakten innan ärendet förmedlas. Kraftringens handläggning börjar efter överlämningen.</p></div>`;
    const options = (labels, selected) => Object.entries(labels).map(([value, label]) => `<option value="${value}" ${selected === value ? 'selected' : ''}>${e(label)}</option>`).join('');
    return `<form id="movein-service-internal-form"><h3 class="movein-service-form-head">Handlägg & återkoppla</h3><div class="form-grid"><label class="field">Ärendestatus · testförslag<select name="handoverStatus">${options(handoverLabels, row.handoverStatus).replace('<option value="draft"', '<option disabled value="draft"')}</select></label><label class="field">Intern ansvarig · exempel<select name="owner">${['Ej tilldelad', 'Demoansvarig A', 'Demoansvarig B'].map(value => `<option ${row.owner === value ? 'selected' : ''}>${e(value)}</option>`).join('')}</select></label><label class="field">Elhandel · demostatus<select name="trade">${options(processingLabels, row.processing.trade)}</select></label><label class="field">Elnät · demostatus<select name="network">${options(processingLabels, row.processing.network)}</select></label><label class="field">Elhandelsavtal · separat demostatus<select name="offerChoice">${options(offerLabels, row.processing.offerChoice)}</select><span class="form-hint">Fiktiv status. Faktiskt avtal följs separat; ingen aktivitet från hyresgästen behövs i portalen.</span></label><label class="field">Datum för nästa steg<input name="nextDate" type="date" min="2000-01-01" max="2100-12-31" value="${e(row.nextDate)}"></label></div><label class="field">Nästa steg<input name="next" maxlength="200" value="${e(row.next)}" placeholder="Stäm av underlaget och återkoppla"></label><label class="field">Återkoppling som partnern får se<textarea name="feedback" rows="3" maxlength="800" placeholder="Beskriv vad som är omhändertaget eller vad som behöver kompletteras."></textarea></label><label class="field">Intern anteckning<textarea name="privateNote" rows="2" maxlength="800" placeholder="Visas bara i den interna demovyn."></textarea></label><p id="movein-service-save-feedback" role="alert" hidden></p><div class="modal-actions"><button class="btn btn-secondary" type="button" id="movein-service-download">${icon('download')} Testsammanfattning</button><button class="btn btn-primary" type="submit">Spara handläggning</button></div></form>`;
  }
  function partnerForm(row) {
    if (!['draft', 'needs_info'].includes(row.handoverStatus)) return `<div class="movein-service-awaiting"><strong>Kraftringen tar över ärendet</strong><p>Följ återkopplingen här. Elhandel, elnätskontakter och bekräftelser hanteras av Kraftringen.</p></div>`;
    const supplement = row.handoverStatus === 'needs_info';
    if (!row.serviceRequested) return `<div class="movein-service-awaiting"><strong>Äldre intresse utan serviceuppdrag</strong><p>Det här sparade intresset har inget registrerat uppdrag. Nya underlag registreras av fastighetsbolaget manuellt eller från Excel.</p></div>`;
    const corrections = supplement ? `<fieldset class="movein-service-corrections"><legend>Komplettera bostadsunderlaget</legend><p class="movein-service-small">Fastighetsbolaget korrigerar bostadsuppgifterna och bifogar eventuella saknade fullmaktsfiler. Ingen fullmakt eller juridisk behörighet skapas här.</p><label class="field">Bostadsadress *<input name="address" required maxlength="180" value="${e(row.address)}"></label><div class="form-grid"><label class="field">Lägenhetsnummer<input name="apartment" maxlength="40" value="${e(row.apartment || '')}"></label><label class="field">Inflyttningsdatum *<input name="moveDate" type="date" required value="${e(row.moveDate)}"></label><label class="field">Postnummer *<input name="postcode" required maxlength="12" value="${e(row.postcode || '')}"></label><label class="field">Ort *<input name="city" required maxlength="80" value="${e(row.city || '')}"></label></div></fieldset>` : '';
    return `<form id="movein-service-forward-form"><h3 class="movein-service-form-head">${supplement ? 'Komplettera & förmedla igen' : 'Förmedla till Kraftringen'}</h3>${corrections}<label class="field">${supplement ? 'Vad har kompletterats? *' : 'Meddelande till Kraftringen · valfritt'}<textarea name="partnerReply" rows="3" maxlength="800" ${supplement ? 'required' : ''} placeholder="Ange en fiktiv komplettering eller fråga."></textarea></label><p class="movein-service-small">${authorityReady(row) ? 'Kraftringen tar över elfrågorna när fastighetsbolaget förmedlar underlaget.' : 'Bifoga fullmakten ovan innan du förmedlar underlaget.'}</p><div class="modal-actions"><button class="btn btn-primary" type="submit" ${!authorityReady(row) ? 'disabled' : ''}>${icon('arrow')} Förmedla testunderlag</button></div></form>`;
  }
  function download(row) {
    const sharedEvents = row.events.filter(item => item?.visibility === 'shared');
    const content = ['TESTSAMMANFATTNING – INGEN BEKRÄFTELSE ELLER GILTIGT AVTAL', '', 'Inflyttningsservice · fiktiva exempeluppgifter', 'Partner: ' + (P.partners[row.partner] || row.partner), 'Inflyttare: ' + row.name, 'Bostad: ' + row.address + (row.apartment ? ', lgh ' + row.apartment : ''), 'Inflyttning: ' + row.moveDate, '', 'Ärendestatus: ' + statusLabel(row), 'Elhandel: ' + processingLabels[row.processing.trade], 'Elnät: ' + processingLabels[row.processing.network], 'Elhandelsavtal · separat demostatus: ' + offerLabels[row.processing.offerChoice], 'Fullmaktsbilagor: ' + (row.authorityFiles.map(meta => meta.name).join(', ') || 'Inga bifogade filer'), '', 'Delad återkoppling:', ...sharedEvents.map(item => item.at + ' · ' + item.actor + '\n' + item.text), '', 'Enbart lokal demo. Inget har skickats, tecknats eller ordnats hos Kraftringen eller ett elnätsbolag. Testmarkeringen är ingen fullmakt. Detta dokument har ingen juridisk verkan.'].join('\n');
    P.download('inflyttningsservice-testsammanfattning.txt', content);
  }
  function open(id) {
    const row = findVisible(id);
    if (!row) return;
    P.openDialog('Inflyttningsservice · ' + row.name, detail(row), () => {
      bindAttachments(row);
      qs('#movein-service-download')?.addEventListener('click', () => download(row));
      const internalFormElement = qs('#movein-service-internal-form');
      if (internalFormElement) internalFormElement.onsubmit = submitEvent => {
        submitEvent.preventDefault();
        if (P.role !== 'internal' || findVisible(row.id) !== row) return;
        const form = submitEvent.currentTarget;
        if (!form.reportValidity()) return;
        const data = new FormData(form);
        const status = data.get('handoverStatus'), trade = data.get('trade'), network = data.get('network'), offerChoice = data.get('offerChoice');
        if (!Object.hasOwn(handoverLabels, status) || status === 'draft' || !Object.hasOwn(processingLabels, trade) || !Object.hasOwn(processingLabels, network) || !Object.hasOwn(offerLabels, offerChoice)) return;
        if (status === 'confirmed' && (trade !== 'confirmed' || network !== 'confirmed')) { P.toast('För att avsluta återkopplingen i testet behöver både elhandel och elnätsdelen ha klar handläggning i demot.'); return; }
        const changed = row.handoverStatus !== status || row.processing.trade !== trade || row.processing.network !== network || row.processing.offerChoice !== offerChoice;
        const feedback = text(data.get('feedback')), privateNote = text(data.get('privateNote'));
        if (status === 'needs_info' && row.handoverStatus !== 'needs_info' && !feedback) { form.elements.feedback.setCustomValidity('Beskriv vilken komplettering partnern behöver göra.'); form.elements.feedback.oninput = () => form.elements.feedback.setCustomValidity(''); form.elements.feedback.reportValidity(); return; }
        const previous = structuredClone(row);
        row.handoverStatus = status; row.processing = { ...row.processing, trade, network, offerChoice }; row.owner = data.get('owner'); row.next = text(data.get('next')); row.nextDate = data.get('nextDate'); row.updatedAt = now();
        if (changed) row.events.unshift(event('Testhandläggning: ' + statusLabel(row) + '. Elhandel: ' + processingLabels[trade] + '. Elnät: ' + processingLabels[network] + '. Erbjudande: ' + offerLabels[offerChoice] + '. Inget verkligt avtal eller utskick.'));
        if (feedback) row.events.unshift(event(feedback));
        if (privateNote) row.events.unshift(event(privateNote, 'internal'));
        if (!P.save()) {
          restoreRow(row, previous);
          const failure = form.querySelector('#movein-service-save-feedback');
          failure.textContent = 'Handläggningen kunde inte sparas. Tidigare ärendestatus och historik behålls. Dina inmatade uppgifter finns kvar här så att du kan prova igen.';
          failure.hidden = false;
          P.toast('Handläggningen kunde inte sparas. Tidigare ärendedata behålls.');
          return;
        }
        P.closeDialog(); P.render(); P.toast('Handläggning och återkoppling är sparade i denna webbläsare.');
      };
      const forwardForm = qs('#movein-service-forward-form');
      if (forwardForm) forwardForm.onsubmit = async submitEvent => {
        submitEvent.preventDefault();
        if (P.role === 'internal') return;
        const form = submitEvent.currentTarget;
        if (!form.reportValidity()) return;
        const input = form.elements.partnerReply;
        if (row.handoverStatus === 'needs_info' && !P.validText(input)) return;
        const reply = input.value.trim();
        let changes;
        if (row.handoverStatus === 'needs_info') {
          changes = Object.fromEntries(['address', 'apartment', 'moveDate', 'postcode', 'city'].map(field => [field, form.elements.namedItem(field).value.trim()]));
          for (const field of ['address', 'postcode', 'city']) if (!P.validText(form.elements.namedItem(field))) return;
          if (!canForward({ ...row, ...changes })) { P.toast('Kontrollera bostadsunderlaget innan du förmedlar det igen.'); return; }
        }
        const submitButton = form.querySelector('[type="submit"]');
        const isCurrent = () => form.isConnected && qs('#portal-dialog')?.open && qs('#movein-service-forward-form') === form && P.role === 'partner' && P.partner === row.partner;
        submitButton.disabled = true;
        if (await forwardChecked(row.id, { changes, reply, isCurrent }) && isCurrent()) {
          P.closeDialog(); P.render(); P.toast('Testunderlaget är förmedlat till Kraftringens demovy. Inget skickas externt.');
        }
        if (isCurrent()) submitButton.disabled = !authorityReady(row);
      };
    });
  }
  function filteredRows() { return rows(partnerFilter === 'all' ? undefined : partnerFilter).filter(row => (statusFilter === 'all' || row.handoverStatus === statusFilter) && `${row.name} ${row.email} ${row.address} ${row.city} ${P.partners[row.partner]}`.toLocaleLowerCase('sv-SE').includes(search.toLocaleLowerCase('sv-SE'))); }
  function tableBody() {
    return filteredRows().map(row => `<tr><td><button class="movein-service-person" data-service-case="${e(row.id)}">${icon('user')}<span><strong>${e(row.name)}</strong><small>${e(row.address)}${row.apartment ? ', lgh ' + e(row.apartment) : ''}</small></span></button></td><td><span class="movein-service-cell">${e(P.partners[row.partner])}</span><small>${e(row.city)}</small></td><td>${e(date(row.moveDate))}</td><td>${badge(row)}</td><td><span class="movein-service-cell">Elhandel: ${e(processingLabels[row.processing.trade])}</span><small>Elnät: ${e(processingLabels[row.processing.network])}</small></td><td><button class="btn btn-secondary btn-small" data-service-case="${e(row.id)}">Visa ${icon('arrow')}</button></td></tr>`).join('') || '<tr><td colspan="6"><div class="empty">Inga serviceärenden matchar sökningen.</div></td></tr>';
  }
  function render() {
    if (P.role !== 'internal') return '<div class="empty">Byt till Kraftringens demovy för den interna handläggningen.</div>';
    const all = rows();
    const metrics = [['Nya att ta emot', all.filter(row => row.handoverStatus === 'submitted').length, 'Förmedlade serviceunderlag', 'file'], ['Kraftringen handlägger', all.filter(row => row.handoverStatus === 'handling').length, 'Elhandel och elnät följs separat', 'bolt'], ['Komplettering behövs', all.filter(row => row.handoverStatus === 'needs_info').length, 'Återkoppling till fastighetspartnern', 'mail'], ['Återkoppling klar', all.filter(row => row.handoverStatus === 'confirmed').length, 'Färdigt serviceärende i test', 'check']];
    return `<div class="movein-service-workspace"><div class="page-head"><div><span class="eyebrow">KRAFTRINGEN / INFLYTTNINGSSERVICE</span><h1>Ta hand om inflyttarnas el.</h1><p>Fastighetspartnern förmedlar underlaget. Kraftringen tar över elhandeln, nödvändig elnätshantering och återkoppling.</p></div><span class="pill">Lokala testärenden</span></div><section class="movein-service-hero"><span>${icon('home')}</span><div><h2>Ett tydligt ansvar efter överlämningen.</h2><p>Följ varje hyresgästs serviceärende och håll partnern uppdaterad. Fastighetsbolagets egen elförbrukning är en separat företagsaffär.</p></div></section><div class="movein-service-metrics">${metrics.map(([label, value, sub, name]) => `<article class="card"><span>${icon(name)}</span><div><small>${e(label)}</small><strong>${value}</strong><p>${e(sub)}</p></div></article>`).join('')}</div><section class="card"><div class="section-title"><h2>Serviceärenden</h2><span class="pill" id="movein-service-count">${filteredRows().length} exempel</span></div><div class="movein-service-toolbar"><label class="movein-service-search">${icon('search')}<input id="movein-service-search" type="search" value="${e(search)}" placeholder="Sök inflyttare, adress eller partner" aria-label="Sök serviceärenden"></label><select id="movein-service-partner" aria-label="Filtrera fastighetspartner"><option value="all">Alla fastighetspartners</option>${propertyPartners().map(partner => `<option value="${e(partner.id)}" ${partnerFilter === partner.id ? 'selected' : ''}>${e(partner.name)}</option>`).join('')}</select><select id="movein-service-status" aria-label="Filtrera serviceärendestatus"><option value="all">Alla ärendestatusar</option>${Object.entries(handoverLabels).map(([value, label]) => `<option value="${value}" ${statusFilter === value ? 'selected' : ''}>${e(label)}</option>`).join('')}</select></div><div class="table-wrap"><table class="movein-service-table"><thead><tr><th>Inflyttare · exempel</th><th>Partner</th><th>Inflyttning</th><th>Ärendestatus</th><th>Handläggning</th><th><span class="sr-only">Visa ärende</span></th></tr></thead><tbody id="movein-service-table-body">${tableBody()}</tbody></table></div>${note('Statusar och kompletteringssteg är testförslag. Fastighetsbolaget registrerar underlaget och bifogar fullmakten. Filer och statusar hanteras lokalt i demot; inget skickas externt.')}</section><div class="movein-service-bottom"><section class="card"><h2>Service och affärsresultat följs separat</h2><p>Serviceuppdraget och ett faktiskt elhandelsavtal är separata händelser. Registrering eller handläggning i demot skapar inga kunder, avtal eller intäkter i resultatöversikten.</p><button class="text-button" data-go="overview">Till kommersiellt resultat ${icon('arrow')}</button></section><section class="card"><h2>Återkoppling åt båda håll</h2><p>Partnern ser delad återkoppling och kan förmedla kompletteringar. Interna anteckningar hålls åtskilda i demovyn; det är ett visningsval, inget åtkomstskydd.</p></section></div></div>`;
  }
  function bindRows() { document.querySelectorAll('[data-service-case]').forEach(button => button.onclick = () => open(button.dataset.serviceCase)); }
  function refreshTable() { qs('#movein-service-table-body').innerHTML = tableBody(); qs('#movein-service-count').textContent = filteredRows().length + ' exempel'; bindRows(); }
  function bind() {
    if (P.role !== 'internal') return;
    qs('#movein-service-search').oninput = inputEvent => { search = inputEvent.target.value; refreshTable(); };
    qs('#movein-service-partner').onchange = changeEvent => { partnerFilter = changeEvent.target.value; refreshTable(); };
    qs('#movein-service-status').onchange = changeEvent => { statusFilter = changeEvent.target.value; refreshTable(); };
    bindRows();
  }
  P.moveinService = { init, rows, statusLabel, authorityReady, canForward, forward, forwardChecked, createPartnerRecords, open, activityFor, handoverLabels, processingLabels, offerLabels };
  P.register('movein-cases', { render, bind });
  init();
})();
