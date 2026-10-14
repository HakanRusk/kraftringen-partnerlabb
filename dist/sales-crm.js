(() => {
  'use strict';
  const P = window.Portal;
  if (!P) return;
  const e = P.escape || P.e;
  const icon = P.icon;
  const statuses = { new: 'Ny', active: 'Pågår', waiting: 'Väntar', closed: 'Avslutad' };
  const segmentLabels = { business: 'Företag (B2B)', consumer: 'Konsument (B2C)' };
  let query = '';
  let statusFilter = 'open';

  const isPortalPartner = () => {
    const partner = P.getPartner();
    return P.role === 'partner' && ['sales', 'field'].includes(partner?.type) && partner.salesWorkMode === 'portal';
  };
  const sourceRows = () => Array.isArray(P.state.salesCrmRecords) ? P.state.salesCrmRecords : [];
  const validRow = row => row && typeof row === 'object' && !Array.isArray(row) && typeof row.id === 'string' && typeof row.partner === 'string' && typeof row.customer === 'string' && Object.hasOwn(statuses, row.status) && Object.hasOwn(segmentLabels, row.segment);
  const rows = () => sourceRows().filter(row => validRow(row) && row.partner === P.partner);
  const clean = value => typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : '';
  const allowedSegments = () => Array.isArray(P.getPartner()?.salesAudiences) ? P.getPartner().salesAudiences.filter(segment => Object.hasOwn(segmentLabels, segment)) : [];
  const visibleRows = () => rows().filter(row => {
    const text = `${row.customer} ${row.contact} ${row.email} ${row.next}`.toLocaleLowerCase('sv-SE');
    const statusMatch = statusFilter === 'all' || statusFilter === 'open' ? (statusFilter === 'all' || row.status !== 'closed') : row.status === statusFilter;
    return statusMatch && text.includes(query.toLocaleLowerCase('sv-SE'));
  }).sort((a, b) => (a.nextDate || '9999-12-31').localeCompare(b.nextDate || '9999-12-31') || a.customer.localeCompare(b.customer, 'sv'));

  function validate(payload) {
    if (!isPortalPartner()) return { ok: false, error: 'Kundarbete är bara tillgängligt när Partnerportalen har valts som CRM.' };
    const customer = clean(payload?.customer);
    const contact = clean(payload?.contact);
    const email = clean(payload?.email).toLocaleLowerCase('sv-SE');
    const next = clean(payload?.next);
    const segment = payload?.segment;
    const status = payload?.status;
    const rawNextDate = typeof payload?.nextDate === 'string' ? payload.nextDate.trim() : '';
    const parsedNextDate = rawNextDate ? new Date(`${rawNextDate}T00:00:00Z`) : null;
    const nextDate = /^\d{4}-\d{2}-\d{2}$/.test(rawNextDate) && !Number.isNaN(parsedNextDate?.getTime()) && parsedNextDate.toISOString().slice(0, 10) === rawNextDate ? rawNextDate : '';
    const note = clean(payload?.note);
    if (!customer || customer.length > 90) return { ok: false, field: 'customer', error: 'Ange ett fiktivt kundnamn med högst 90 tecken.' };
    if (!allowedSegments().includes(segment)) return { ok: false, field: 'segment', error: 'Välj ett kundsegment som partnern arbetar med.' };
    if (!email || email.length > 130 || !/^[^\s@]+@[^\s@]+\.example$/i.test(email)) return { ok: false, field: 'email', error: 'Använd en påhittad e-postadress som slutar med .example.' };
    if (contact.length > 90) return { ok: false, field: 'contact', error: 'Kontaktpersonen får ha högst 90 tecken.' };
    if (!next || next.length > 180) return { ok: false, field: 'next', error: 'Ange nästa steg med högst 180 tecken.' };
    if (rawNextDate && !nextDate) return { ok: false, field: 'nextDate', error: 'Ange ett giltigt kalenderdatum.' };
    if (note.length > 800) return { ok: false, field: 'note', error: 'Anteckningen får ha högst 800 tecken.' };
    if (!Object.hasOwn(statuses, status)) return { ok: false, field: 'status', error: 'Välj en giltig teststatus.' };
    return { ok: true, row: { customer, contact, email, segment, status, next, nextDate, note } };
  }

  function saveRecord(payload, id) {
    const result = validate(payload);
    if (!result.ok) return result;
    const previous = P.state.salesCrmRecords;
    const current = sourceRows();
    const existing = id ? current.find(row => validRow(row) && row.id === id && row.partner === P.partner) : null;
    if (id && !existing) return { ok: false, error: 'Kundaktiviteten kunde inte hittas för den här partnern.' };
    const now = new Date().toISOString();
    const record = existing ? { ...existing, ...result.row, updatedAt: now } : { id: `crm-${crypto.randomUUID()}`, partner: P.partner, ...result.row, createdAt: now, updatedAt: now };
    P.state.salesCrmRecords = existing ? current.map(row => row === existing ? record : row) : [record, ...current];
    let saved = false;
    try { saved = P.save() === true; } catch { saved = false; }
    if (!saved) {
      if (previous === undefined) delete P.state.salesCrmRecords;
      else P.state.salesCrmRecords = previous;
      return { ok: false, error: 'Kundaktiviteten kunde inte sparas. Tidigare uppgifter har behållits.' };
    }
    return { ok: true, id: record.id, created: !existing };
  }

  const statusBadge = status => `<span class="sales-crm-status sales-crm-status-${e(status)}">${e(statuses[status])}</span>`;
  function table() {
    const list = visibleRows();
    if (!list.length) return `<div class="sales-crm-empty"><span>${icon('users')}</span><h2>${rows().length ? 'Inga kundaktiviteter matchar' : 'Börja med en fiktiv kundaktivitet'}</h2><p>${rows().length ? 'Ändra sökning eller statusfilter.' : 'Samla kontakt, status och nästa steg. Inget avtal eller resultat skapas.'}</p>${rows().length ? '' : '<button class="btn btn-primary" data-sales-crm-new>Ny kundaktivitet</button>'}</div>`;
    return `<div class="table-wrap"><table class="sales-crm-table"><thead><tr><th>Kund · exempel</th><th>Segment</th><th>Status</th><th>Nästa steg</th><th></th></tr></thead><tbody>${list.map(row => `<tr><td><strong>${e(row.customer)}</strong><small>${e(row.contact || 'Kontakt ej angiven')} · ${e(row.email)}</small></td><td>${e(segmentLabels[row.segment])}</td><td>${statusBadge(row.status)}</td><td><strong>${e(row.next)}</strong><small>${row.nextDate ? P.date(row.nextDate) : 'Ej daterat'}</small></td><td><button class="icon-button" data-sales-crm-edit="${e(row.id)}" aria-label="Redigera ${e(row.customer)}">${icon('edit')}</button></td></tr>`).join('')}</tbody></table></div>`;
  }

  function render() {
    if (!isPortalPartner()) return `<div class="commercial-page"><div class="page-head"><div><span class="eyebrow">PARTNERPORTAL / KUNDARBETE</span><h1>Kundarbete är inte aktiverat</h1><p class="muted">Den här partnern använder eget CRM. Ändra arbetssätt i partnerinställningarna om Partnerportalen ska användas för kundaktiviteter.</p></div></div><button class="btn btn-secondary" data-go="overview">Till partneröversikten</button></div>`;
    const open = rows().filter(row => row.status !== 'closed').length;
    const due = rows().filter(row => row.status !== 'closed' && row.nextDate).sort((a, b) => a.nextDate.localeCompare(b.nextDate))[0];
    return `<div class="commercial-page sales-crm"><div class="page-head"><div><span class="eyebrow">PARTNERPORTAL / LOKALT CRM-FÖRSLAG</span><h1>Kundarbete</h1><p class="muted">Dokumentera fiktiva kundaktiviteter och ett tydligt nästa steg. Uppgifterna sparas bara i den här webbläsaren.</p></div><button class="btn btn-primary" data-sales-crm-new>${icon('plus')} Ny kundaktivitet</button></div>
      <div class="sales-crm-summary"><article><small>ÖPPNA AKTIVITETER</small><strong>${open}</strong><span>Hos ${e(P.getPartner()?.name || 'partnern')}</span></article><article><small>NÄRMASTE NÄSTA STEG</small><strong>${due ? P.date(due.nextDate) : '—'}</strong><span>${due ? e(due.customer) : 'Underlag saknas'}</span></article><article><small>ARBETSSÄTT</small><strong>Partnerportalen</strong><span>Lokalt demo-CRM</span></article></div>
      <section class="card"><div class="sales-crm-toolbar"><label class="field">Sök kundaktivitet<input id="sales-crm-search" type="search" value="${e(query)}" placeholder="Kund, kontakt eller nästa steg"></label><label class="field">Status<select id="sales-crm-status"><option value="open"${statusFilter === 'open' ? ' selected' : ''}>Öppna</option>${Object.entries(statuses).map(([value, label]) => `<option value="${value}"${statusFilter === value ? ' selected' : ''}>${e(label)}</option>`).join('')}<option value="all"${statusFilter === 'all' ? ' selected' : ''}>Alla</option></select></label></div><div id="sales-crm-list">${table()}</div></section>
      <div class="info-note"><strong>Avgränsad frontenddemo.</strong><p>Kundarbete är inte delat mellan användare och är ingen integration. En aktivitet skapar inte offert, elavtal, försäljningsresultat, intäkt eller kickback. Använd aldrig riktiga kunduppgifter här.</p></div></div>`;
  }

  function openForm(row) {
    const segments = allowedSegments();
    const value = row || { segment: segments[0], status: 'new', customer: '', contact: '', email: '', next: '', nextDate: '', note: '' };
    P.openDialog(row ? 'Redigera kundaktivitet' : 'Ny kundaktivitet', `<form id="sales-crm-form"><p class="muted">Enbart fiktiva uppgifter. Aktiviteten skapar inget avtal eller resultat.</p><div class="form-grid"><label class="field">Kund eller organisation · exempel *<input name="customer" required maxlength="90" value="${e(value.customer)}" placeholder="Exempelkund AB"></label><label class="field">Kundsegment *<select name="segment" required>${segments.map(segment => `<option value="${segment}"${value.segment === segment ? ' selected' : ''}>${e(segmentLabels[segment])}</option>`).join('')}</select></label><label class="field">Kontaktperson · exempel<input name="contact" maxlength="90" value="${e(value.contact)}" placeholder="Kim Exempel"></label><label class="field">E-post · exempel *<input name="email" type="email" required maxlength="130" value="${e(value.email)}" placeholder="kim@kund.example"><span class="form-hint">Måste sluta med .example.</span></label><label class="field">Status · test<select name="status">${Object.entries(statuses).map(([status, label]) => `<option value="${status}"${value.status === status ? ' selected' : ''}>${e(label)}</option>`).join('')}</select></label><label class="field">Datum för nästa steg<input name="nextDate" type="date" value="${e(value.nextDate)}"></label></div><label class="field">Nästa steg *<input name="next" required maxlength="180" value="${e(value.next)}" placeholder="Boka ett första behovssamtal"></label><label class="field">Anteckning · valfri<textarea name="note" maxlength="800" rows="3" placeholder="Kort fiktivt sammanhang">${e(value.note)}</textarea></label><label class="checkbox-label"><input name="demo" type="checkbox" required><span>Jag använder endast påhittade exempeluppgifter.</span></label><p id="sales-crm-error" class="partner-setup-error" role="alert" hidden></p><div class="modal-actions"><button class="btn btn-secondary" type="button" id="sales-crm-cancel">Avbryt</button><button class="btn btn-primary" type="submit">${row ? 'Spara ändringar' : 'Spara kundaktivitet'}</button></div></form>`, () => {
      const form = document.querySelector('#sales-crm-form');
      const error = document.querySelector('#sales-crm-error');
      form.elements.customer.focus();
      document.querySelector('#sales-crm-cancel').onclick = P.closeDialog;
      form.oninput = () => { error.hidden = true; form.elements.email.setCustomValidity(''); };
      form.onsubmit = event => {
        event.preventDefault();
        if (!form.reportValidity()) return;
        const payload = Object.fromEntries(['customer', 'segment', 'contact', 'email', 'status', 'nextDate', 'next', 'note'].map(key => [key, form.elements.namedItem(key).value]));
        const result = saveRecord(payload, row?.id);
        if (!result.ok) {
          error.textContent = result.error; error.hidden = false;
          if (result.field && form.elements.namedItem(result.field)) { const field = form.elements.namedItem(result.field); field.setCustomValidity(result.error); field.reportValidity(); field.focus(); }
          return;
        }
        P.closeDialog(); P.render(); P.toast(result.created ? 'Kundaktiviteten är sparad lokalt.' : 'Kundaktiviteten är uppdaterad lokalt.');
      };
    });
  }

  function bind() {
    const view = document.querySelector('#view');
    view.querySelectorAll('[data-sales-crm-new]').forEach(button => button.addEventListener('click', () => openForm()));
    view.querySelectorAll('[data-sales-crm-edit]').forEach(button => button.addEventListener('click', () => {
      const row = rows().find(item => item.id === button.dataset.salesCrmEdit);
      if (row) openForm(row);
    }));
    document.querySelector('#sales-crm-search')?.addEventListener('input', event => { query = event.target.value; document.querySelector('#sales-crm-list').innerHTML = table(); bindRows(); });
    document.querySelector('#sales-crm-status')?.addEventListener('change', event => { statusFilter = event.target.value; document.querySelector('#sales-crm-list').innerHTML = table(); bindRows(); });
  }
  function bindRows() {
    document.querySelectorAll('#sales-crm-list [data-sales-crm-new]').forEach(button => button.onclick = () => openForm());
    document.querySelectorAll('#sales-crm-list [data-sales-crm-edit]').forEach(button => button.onclick = () => { const row = rows().find(item => item.id === button.dataset.salesCrmEdit); if (row) openForm(row); });
  }

  P.salesCrm = { rows, saveRecord, validate, isPortalPartner };
  P.register('sales-crm', { render, bind });
})();
