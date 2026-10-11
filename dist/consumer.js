(() => {
  'use strict';
  const P = window.Portal;
  const { e, icon } = P;
  const statuses = {
    underlag: 'Registrerat underlag',
    waiting: 'Inväntar återkoppling',
    complement: 'Komplettering behövs',
    active: 'Aktiv kund · demo',
    closed: 'Avslutad · demo'
  };
  const qs = selector => document.querySelector(selector);
  const uid = () => 'consumer-' + crypto.randomUUID().slice(0, 8);
  const isObject = value => !!value && typeof value === 'object' && !Array.isArray(value);
  function restoreObject(target, previous) {
    Object.keys(target).forEach(key => delete target[key]); Object.assign(target, previous);
  }
  let search = '', statusFilter = 'all', teamFilter = 'all', followupFilter = 'action';
  const newEvent = (text, actor = P.role === 'internal' ? 'Kraftringen · intern demo' : 'Face2face · demo') => ({at: new Date().toISOString(), actor, text, visibility: 'shared'});
  function init() {
    if (P.state.consumerSales !== undefined) return;
    const seed = [
      ['F2F-EX-001', 'Lo Exempel', 'lo@privatkund.example', 'Exempelgatan 4', 'Lund', '2026-11-01', 'Alex Exempel', 'Exempelteam Syd', 'Exempelkanal A', 'complement', 'Stäm av önskad leveransstart', '2026-10-09', 'Kontrollera datumet med kunden. Underlaget anger två olika önskemål.', '2026-10-06T09:15:00Z'],
      ['F2F-EX-002', 'Robin Exempel', 'robin@privatkund.example', 'Testvägen 12', 'Malmö', '2026-11-15', 'Kim Exempel', 'Exempelteam Syd', 'Exempelkanal B', 'waiting', 'Följ återkopplingen från Kraftringen', '2026-10-12', 'Underlaget är registrerat i test. Återkoppling väntar.', '2026-10-06T11:30:00Z'],
      ['F2F-EX-003', 'Sam Exempel', 'sam@privatkund.example', 'Provgatan 8', 'Göteborg', '2026-11-01', 'Taylor Exempel', 'Exempelteam Väst', 'Exempelkanal A', 'active', 'Följ upp kundens frågor', '2026-10-14', 'Exempel på återkoppling: aktiv kund i demot. Ingen leverans har beställts.', '2026-10-05T14:10:00Z'],
      ['F2F-EX-004', 'Mika Exempel', 'mika@privatkund.example', 'Demogränd 3', 'Helsingborg', '2026-12-01', 'Alex Exempel', 'Exempelteam Syd', 'Exempelkanal A', 'underlag', 'Granska kontaktuppgifterna i testet', '2026-10-08', '', '2026-10-07T08:20:00Z'],
      ['F2F-EX-005', 'Noor Exempel', 'noor@privatkund.example', 'Exempelallén 2', 'Borås', '2026-11-15', 'Taylor Exempel', 'Exempelteam Väst', 'Exempelkanal B', 'active', 'Dokumentera eventuell kundfråga', '', 'Aktiv kund visas som exempelutfall. Ingen signering eller avtalsstart har genomförts.', '2026-10-04T12:00:00Z'],
      ['F2F-EX-006', 'Charlie Exempel', 'charlie@privatkund.example', 'Provtorget 6', 'Landskrona', '2026-11-01', 'Kim Exempel', 'Exempelteam Syd', 'Exempelkanal B', 'closed', 'Ingen uppföljning planerad', '', 'Avslutat exempelärende. Registreringen blev inte en aktiv kund i demot.', '2026-10-03T10:00:00Z']
    ];
    P.state.consumerSales = seed.map(([reference, name, email, address, city, startDate, seller, team, channel, status, next, nextDate, feedback, createdAt], index) => ({
      id: 'consumer-demo-' + (index + 1), partner: 'vast', reference, name, email, address, city, startDate, seller, team, channel, status, next, nextDate,
      question: index === 0 ? 'Kunden vill stämma av vilket startdatum som ska anges.' : 'Fiktivt försäljningsunderlag för Kraftringens elhandel till privatkund.',
      createdAt, updatedAt: createdAt,
      events: [ ...(feedback ? [{ at: createdAt, actor: 'Kraftringen · intern demo', text: feedback, visibility: 'shared', kind: 'feedback' }] : []),
        { at: createdAt, actor: 'Face2face · demo', text: 'Försäljningsunderlag sparat med fiktiva privatkundsuppgifter.', visibility: 'shared', kind: 'activity' } ]
    }));
    P.save();
  }
  function rows() {
    init();
    return (Array.isArray(P.state.consumerSales) ? P.state.consumerSales : []).filter(row => isObject(row) && row.partner === 'vast');
  }
  function activityFor(id) {
    if (id === 'vast') return rows().flatMap(row => activityFor(row.id).map(event => ({...event, id: row.id, name: row.name, company: row.name, reference: row.reference}))).sort((a, b) => String(b.at || '').localeCompare(String(a.at || '')));
    const row = rows().find(item => item.id === id);
    return (Array.isArray(row?.events) ? row.events : []).filter(event => isObject(event) && (P.role === 'internal' || event.visibility !== 'internal'));
  }
  function badge(status) { return `<span class="consumer-status consumer-status-${e(status)}">${e(statuses[status] || 'Status ej angiven')}</span>`; }
  function heading(eyebrow, title, intro, actions = '') {
    return `<div class="page-head consumer-page-head"><div><span class="eyebrow">${e(eyebrow)}</span><h1>${e(title)}</h1><p>${e(intro)}</p></div>${actions}</div>`;
  }
  const newButton = `<button class="btn btn-primary" data-consumer-new>${icon('plus')} Registrera försäljningsunderlag</button>`;
  const demoNote = text => `<div class="consumer-note">${icon('shield')}<span>${e(text)}</span></div>`;
  function attentionRows() { return rows().filter(row => row.status === 'complement' || row.status === 'underlag'); }
  function teamStats(field = 'team') {
    const groups = new Map();
    for (const row of rows()) {
      const key = row[field] || 'Ej angivet';
      if (!groups.has(key)) groups.set(key, {name: key, total: 0, active: 0, complement: 0});
      const group = groups.get(key); group.total++; if (row.status === 'active') group.active++; if (row.status === 'complement') group.complement++;
    }
    return [...groups.values()].sort((a, b) => b.total - a.total);
  }
  function metrics() {
    const data = rows();
    return `<div class="consumer-metrics">${[
      ['Försäljningsunderlag', data.length, 'Registrerade i test', 'file'],
      ['Aktiva exempelkunder', data.filter(row => row.status === 'active').length, 'Visar exempelutfall', 'bolt'],
      ['Kompletteringar', data.filter(row => row.status === 'complement').length, 'Nästa steg för partnern', 'edit'],
      ['Inväntar återkoppling', data.filter(row => row.status === 'waiting').length, 'Följ dialogen', 'clock']
    ].map(([label, value, note, symbol]) => `<article class="card consumer-metric"><span class="consumer-metric-icon">${icon(symbol)}</span><div><span>${label}</span><strong>${value}</strong><small>${note}</small></div></article>`).join('')}</div>`;
  }
  function table(data, compact = false) {
    return `<div class="table-wrap consumer-table-wrap"><table class="consumer-table"><thead><tr><th>Privatkund · exempel</th><th>Status</th>${compact ? '' : '<th>Säljare / team</th>'}<th>Nästa steg</th><th><span class="sr-only">Öppna underlag</span></th></tr></thead><tbody>${data.map(row => `<tr><td><button class="consumer-person" data-consumer-open="${e(row.id)}"><span class="consumer-person-icon">${icon('user')}</span><span><strong>${e(row.name)}</strong><small>${e(row.reference)} · ${e(row.city)}</small></span></button></td><td>${badge(row.status)}</td>${compact ? '' : `<td><strong class="consumer-cell-name">${e(row.seller)}</strong><small class="consumer-cell-meta">${e(row.team)}</small></td>`}<td><span class="consumer-next-text">${e(row.next || 'Ej planerat')}</span><small class="consumer-cell-meta">${row.nextDate ? P.date(row.nextDate) : 'Inget datum'}</small></td><td><button class="icon-button" data-consumer-open="${e(row.id)}" aria-label="Öppna ${e(row.name)}">${icon('arrow')}</button></td></tr>`).join('') || `<tr><td colspan="${compact ? 4 : 5}"><div class="empty"><strong>Inga underlag i urvalet</strong>Justera sökningen eller registrera ett nytt exempel.</div></td></tr>`}</tbody></table></div>`;
  }
  function statusDistribution() {
    const data = rows(), max = Math.max(1, data.length);
    return `<div class="consumer-distribution">${Object.entries(statuses).map(([key, label]) => {const count = data.filter(row => row.status === key).length; return `<button class="consumer-distribution-row" data-consumer-status="${key}"><span>${e(label)}</span><span class="consumer-bar"><i class="consumer-bar-${key}" style="width:${count / max * 100}%"></i></span><strong>${count}</strong></button>`;}).join('')}</div>`;
  }
  function renderOverview() {
    init();
    const data = rows(), feedback = data.flatMap(row => activityFor(row.id).filter(event => event.kind === 'feedback').map(event => ({...event, row}))).sort((a, b) => String(b.at || '').localeCompare(String(a.at || ''))).slice(0, 3);
    return `<div class="consumer-workspace">${heading('FACE2FACE × KRAFTRINGEN', 'Konsumentförsäljning', 'Face2face säljer i Beest. Denna arbetsyta bevarar portalens lokala konsumentdemo.', newButton)}
      ${demoNote('Nuvarande säljverktyg: Beest. Kraftringens nya affärsutfall följs i den interna vyn. Ingen Beest-data hämtas i prototypen.')}
      ${P.workbench?.render({limit:3}) || ''}
      ${metrics()}
      <section class="consumer-hero consumer-hero-compact"><div><span class="consumer-eyebrow">ELHANDEL TILL PRIVATKUNDER</span><h2>Följ kundmötet hela vägen.</h2><p>Följ varje underlag och återkoppling från Kraftringen.</p></div><div class="consumer-hero-actions"><button class="btn consumer-btn-light" data-go="consumer-sales">Alla underlag ${icon('arrow')}</button><button class="consumer-hero-link" data-go="consumer-followup">Återkoppling ${icon('arrow')}</button></div></section>
      <div class="consumer-overview-grid"><section class="card"><div class="panel-heading"><h2>Underlagen just nu</h2><span class="pill">Antal · exempel</span></div>${statusDistribution()}<div class="consumer-panel-foot"><button class="text-button" data-go="consumer-sales">Se alla underlag ${icon('arrow')}</button></div></section><section class="card"><div class="panel-heading"><h2>Stöd inför kundmötet</h2></div><div class="consumer-actions-list"><button data-go="consumer-material">${icon('book')}<span><strong>Konsumentanpassat säljstöd</strong><small>Testmallar för underlag och kundfrågor.</small></span>${icon('arrow')}</button><button data-go="academy">${icon('graduation')}<span><strong>Förbered din kunddialog</strong><small>Textmoment och lokala framsteg.</small></span>${icon('arrow')}</button><button data-go="support">${icon('headphones')}<span><strong>Stäm av med Kraftringen</strong><small>Samla frågor till partnerteamet.</small></span>${icon('arrow')}</button></div></section></div>
      <div class="consumer-overview-grid"><section class="card"><div class="panel-heading"><h2>Senaste återkoppling</h2><button class="text-button" data-go="consumer-followup">Visa alla</button></div><div class="consumer-feedback-list">${feedback.map(event => `<button class="consumer-feedback" data-consumer-open="${e(event.row.id)}"><span class="consumer-feedback-icon">${icon('mail')}</span><span><small>${P.date(event.at)} · ${e(event.row.reference)}</small><strong>${e(event.row.name)}</strong><p>${e(event.text)}</p></span>${icon('arrow')}</button>`).join('') || '<p class="muted">Ingen återkoppling registrerad.</p>'}</div></section><section class="card"><div class="panel-heading"><h2>Teamens exempelutfall</h2><button class="text-button" data-go="consumer-reports">Se rapport</button></div><div class="consumer-teams">${teamStats().map(group => `<div><span>${icon('users')}</span><div><strong>${e(group.name)}</strong><small>${group.total} underlag · ${group.complement} kompletteringar</small></div><b>${group.active}<small>aktiva · demo</small></b></div>`).join('')}</div><p class="consumer-small-note">Team och kanaler är exempel. Er verkliga organisation är inte fastställd här.</p></section></div>
      ${demoNote('Exempeldata sparas lokalt i webbläsaren. Registrering skapar inget elavtal. Aktiva demokunder och Kraftringens ekonomiska exempelutfall hålls åtskilda.')}</div>`;
  }
  function filteredRows() {
    const query = search.trim().toLocaleLowerCase('sv-SE');
    return rows().filter(row => (!query || `${row.name} ${row.reference} ${row.city} ${row.seller} ${row.team}`.toLocaleLowerCase('sv-SE').includes(query)) && (statusFilter === 'all' || row.status === statusFilter) && (teamFilter === 'all' || row.team === teamFilter));
  }
  function renderSales() {
    init();
    const teams = [...new Set(rows().map(row => row.team))];
    return `<div class="consumer-workspace">${heading('FACE2FACE / FÖRSÄLJNING', 'Försäljningsunderlag', 'Privatkunder och status i dialogen med Kraftringen.', newButton)}${metrics()}<section class="card"><div class="panel-heading"><h2>Registrerade underlag</h2><span class="pill">Elhandel · konsument</span></div><div class="consumer-toolbar"><label class="consumer-search">${icon('search')}<input id="consumer-search" type="search" placeholder="Sök kund, referens, ort eller säljare" aria-label="Sök konsumentunderlag" value="${e(search)}"></label><select id="consumer-status-filter" aria-label="Filtrera konsumentstatus"><option value="all">Alla statusar</option>${Object.entries(statuses).map(([key, label]) => `<option value="${key}"${key === statusFilter ? ' selected' : ''}>${e(label)}</option>`).join('')}</select><select id="consumer-team-filter" aria-label="Filtrera exempelteam"><option value="all">Alla exempelteam</option>${teams.map(team => `<option value="${e(team)}"${team === teamFilter ? ' selected' : ''}>${e(team)}</option>`).join('')}</select></div><div id="consumer-sales-table">${table(filteredRows())}</div><div class="consumer-panel-foot"><span class="muted small" id="consumer-result-count">${filteredRows().length} av ${rows().length} underlag</span><span class="muted small">Öppna en kund för detaljer och nästa steg.</span></div></section>${demoNote('Statusarna är förslag för test. Godkännande, avtalsvillkor, signering och leveransstart behöver ert faktiska underlag.')}</div>`;
  }
  function followupRows() {
    return rows().filter(row => followupFilter === 'all' ? row.status !== 'closed' : followupFilter === 'action' ? ['underlag', 'complement'].includes(row.status) : row.status === followupFilter);
  }
  function renderFollowup() {
    init();
    return `<div class="consumer-workspace">${heading('FACE2FACE / ÅTERKOPPLING', 'Uppföljning & kompletteringar', 'Samla nästa steg och följ återkopplingen per privatkund.')}<div class="consumer-followup-intro"><span>${icon('mail')}</span><div><h2>${rows().filter(row => row.status === 'complement').length} underlag behöver komplettering</h2><p>Öppna ett underlag, dokumentera aktiviteten och planera nästa steg.</p></div><button class="btn btn-secondary" data-go="consumer-sales">Alla försäljningsunderlag ${icon('arrow')}</button></div><div class="consumer-filter-tabs">${[['action', 'Att göra'], ['waiting', 'Inväntar återkoppling'], ['active', 'Aktiva · demo'], ['all', 'Alla pågående']].map(([key, label]) => `<button class="btn btn-secondary${followupFilter === key ? ' consumer-tab-active' : ''}" data-consumer-followup-filter="${key}" aria-pressed="${followupFilter === key}">${label}</button>`).join('')}</div><section class="card"><div class="panel-heading"><h2>${followupFilter === 'action' ? 'Partnerns nästa steg' : 'Underlag att följa'}</h2><span class="pill">${followupRows().length} exempel</span></div>${table(followupRows())}</section>${demoNote('Återkopplingen är lokal testdata. Kraftringens interna demovy kan lägga till återkoppling och ändra teststatus; inga meddelanden skickas.')}</div>`;
  }
  function saveMessage(text, rollback) {
    let saved = false;
    try { saved = P.save(); } catch {}
    if (!saved) {
      rollback(); P.toast('Webbläsaren kunde inte spara. Ingen ändring genomfördes. Formuläret finns kvar så att du kan försöka igen.');
      return false;
    }
    P.toast(text + ' Sparat i denna webbläsare.');
    return true;
  }
  function canEdit(row) {
    if (!Array.isArray(P.state.consumerSales) || (row && row.events != null && !Array.isArray(row.events))) {
      P.toast('Det äldre konsumentunderlaget har ett okänt format. Ingen data ändrades. Exportera underlaget innan det rättas.');
      return false;
    }
    return true;
  }
  function formFields(row = {}) {
    return `<div class="form-grid"><label class="field">Privatkundens namn · fiktivt *<input name="name" required maxlength="90" autocomplete="off" value="${e(row.name)}" placeholder="Lo Exempel"></label><label class="field">E-post · exempel *<input name="email" required type="email" maxlength="130" autocomplete="off" value="${e(row.email)}" placeholder="lo@privatkund.example"><span class="form-hint">Använd en adress som slutar med .example.</span></label><label class="field">Bostadsadress · exempel *<input name="address" required maxlength="120" autocomplete="off" value="${e(row.address)}" placeholder="Exempelgatan 4"></label><label class="field">Ort *<input name="city" required maxlength="70" autocomplete="off" value="${e(row.city)}" placeholder="Lund"></label><label class="field">Önskad leveransstart · exempel<input name="startDate" type="date" value="${e(row.startDate)}"></label><label class="field">Säljare · fiktiv *<input name="seller" required maxlength="90" value="${e(row.seller)}" placeholder="Alex Exempel"></label><label class="field">Team · exempel *<input name="team" required maxlength="80" value="${e(row.team)}" placeholder="Exempelteam Syd"></label><label class="field">Plats eller kanal · exempel *<input name="channel" required maxlength="120" value="${e(row.channel)}" placeholder="Exempelkanal A"><span class="form-hint">Den verkliga försäljningskanalen är inte fastställd här.</span></label></div><label class="field">Kundfråga eller kompletterande underlag<textarea name="question" maxlength="800" rows="3" placeholder="Samla det som behöver följas upp.">${e(row.question)}</textarea></label><div class="form-grid"><label class="field">Nästa steg *<input name="next" required maxlength="180" value="${e(row.next)}" placeholder="Granska underlaget och följ återkopplingen"></label><label class="field">Datum för nästa steg<input name="nextDate" type="date" value="${e(row.nextDate)}"></label></div>`;
  }
  function recordForm(row) {
    const editing = !!row;
    P.openDialog(editing ? 'Redigera konsumentunderlag' : 'Registrera försäljningsunderlag', `<form id="consumer-record-form"><p class="muted">Kraftringens elhandel till privatkunder · enbart fiktiva uppgifter.</p>${formFields(row)}<label class="checkbox-label consumer-demo-check"><input name="demo" type="checkbox" required><span>Jag använder påhittade uppgifter och sparar ett testunderlag. Detta tecknar inget avtal.</span></label><div class="modal-actions"><button class="btn btn-secondary" type="button" id="consumer-cancel-form">Avbryt</button>${editing ? '' : '<button class="btn btn-secondary" type="button" id="consumer-fill-example">Fyll med exempel</button>'}<button class="btn btn-primary" type="submit">${editing ? 'Spara ändringar' : 'Spara försäljningsunderlag'}</button></div></form>`, () => {
      const form = qs('#consumer-record-form');
      form.elements.name.focus(); qs('#consumer-cancel-form').onclick = P.closeDialog;
      form.elements.email.oninput = () => form.elements.email.setCustomValidity('');
      qs('#consumer-fill-example')?.addEventListener('click', () => {
        const example = {name: 'Ari Exempel', email: 'ari@privatkund.example', address: 'Testgatan 10', city: 'Lund', startDate: '2026-12-01', seller: 'Alex Exempel', team: 'Exempelteam Syd', channel: 'Exempelkanal A', question: 'Fiktivt underlag för att testa privatkundsförsäljning.', next: 'Följ återkopplingen i portalen', nextDate: '2026-10-15'};
        for (const [key, value] of Object.entries(example)) form.elements.namedItem(key).value = value;
        form.elements.email.setCustomValidity('');
      });
      form.onsubmit = event => {
        event.preventDefault();
        for (const field of ['name', 'email', 'address', 'city', 'seller', 'team', 'channel', 'next']) if (!P.validText(form.elements.namedItem(field))) return;
        if (!/^[^\s@]+@[^\s@]+\.example$/i.test(form.elements.email.value.trim())) { form.elements.email.setCustomValidity('Använd en påhittad e-postadress som slutar med .example.'); form.elements.email.reportValidity(); return; }
        if (!form.reportValidity()) return;
        if (!canEdit(row)) return;
        const previous = row && structuredClone(row);
        const previousRows = P.state.consumerSales.slice();
        const values = Object.fromEntries(['name', 'email', 'address', 'city', 'startDate', 'seller', 'team', 'channel', 'question', 'next', 'nextDate'].map(key => [key, form.elements.namedItem(key).value.trim()]));
        const now = new Date().toISOString();
        if (editing) {
          if (!Array.isArray(row.events)) row.events = [];
          Object.assign(row, values, {updatedAt: now}); row.events.unshift({...newEvent('Kontakt- och försäljningsunderlaget uppdaterat i test.'), kind: 'activity'});
        } else {
          const id = uid();
          P.state.consumerSales.unshift({id, partner: 'vast', reference: 'F2F-TEST-' + id.slice(-8).toUpperCase(), ...values, status: 'underlag', createdAt: now, updatedAt: now, events: [{...newEvent('Försäljningsunderlag registrerat i test. Inget avtal har tecknats.'), kind: 'activity'}]});
        }
        if (!saveMessage(editing ? 'Underlaget är uppdaterat.' : 'Försäljningsunderlaget är registrerat.', () => {
          P.state.consumerSales.splice(0, P.state.consumerSales.length, ...previousRows);
          if (editing) restoreObject(row, previous);
        })) return;
        if (!editing) { search = ''; statusFilter = 'all'; teamFilter = 'all'; }
        P.closeDialog(); P.go('consumer-sales');
      };
    });
  }
  function openRecord(id) {
    const row = rows().find(item => item.id === id);
    if (!row) return;
    const internal = P.role === 'internal';
    P.openDialog('Konsumentunderlag · ' + row.reference, `<div class="consumer-detail"><div class="consumer-detail-heading"><div><span class="eyebrow">PRIVATKUND · EXEMPEL</span><h2>${e(row.name)}</h2><p>${e(row.city)} · ${e(row.reference)}</p></div>${badge(row.status)}</div><dl class="consumer-detail-meta"><div><dt>Kontakt</dt><dd>${e(row.email)}</dd></div><div><dt>Bostadsadress · exempel</dt><dd>${e(row.address)}, ${e(row.city)}</dd></div><div><dt>Önskad leveransstart</dt><dd>${row.startDate ? P.date(row.startDate) : 'Ej angivet'}</dd></div><div><dt>Säljare / team · exempel</dt><dd>${e(row.seller)} / ${e(row.team)}</dd></div><div><dt>Plats eller kanal · exempel</dt><dd>${e(row.channel)}</dd></div><div><dt>Produktområde</dt><dd>Kraftringens elhandel · privatkund</dd></div></dl>${row.question ? `<div class="consumer-detail-question"><strong>Kundfråga / underlag</strong><p>${e(row.question)}</p></div>` : ''}<div class="consumer-detail-next"><span>${icon('calendar')}</span><div><small>NÄSTA STEG · ${row.nextDate ? P.date(row.nextDate) : 'Ej daterat'}</small><strong>${e(row.next || 'Ej planerat')}</strong></div></div><button class="btn btn-secondary btn-small" id="consumer-edit-record">${icon('edit')} Redigera underlag</button><h3 class="consumer-detail-section">${internal ? 'Återkoppling till Face2face' : 'Dokumentera aktivitet & nästa steg'}</h3><form id="consumer-activity-form">${internal ? `<label class="field">Status · testförslag<select name="status">${Object.entries(statuses).map(([key, label]) => `<option value="${key}"${key === row.status ? ' selected' : ''}>${e(label)}</option>`).join('')}</select></label><label class="field">Återkoppling som partnern ser *<textarea name="activity" required rows="3" maxlength="800" placeholder="Beskriv vad som behöver kompletteras eller nästa steg."></textarea></label>` : '<label class="field">Aktivitet eller svar på återkoppling *<textarea name="activity" required rows="3" maxlength="800" placeholder="Exempel: stämt av önskad leveransstart med den fiktiva kunden."></textarea></label>'}<div class="form-grid"><label class="field">Nästa steg *<input name="next" required maxlength="180" value="${e(row.next)}"></label><label class="field">Datum<input name="nextDate" type="date" value="${e(row.nextDate)}"></label></div><button class="btn btn-primary" type="submit">${internal ? 'Spara teståterkoppling' : 'Spara aktivitet & nästa steg'}</button></form><h3 class="consumer-detail-section">Aktivitet & återkoppling</h3><div class="consumer-timeline">${activityFor(id).map(event => `<article><span>${icon(event.kind === 'feedback' ? 'mail' : 'file')}</span><div><small>${P.date(event.at)} · ${e(event.actor)}</small><p>${e(event.text)}</p></div></article>`).join('')}</div><p class="consumer-small-note">Lokal testhistorik. Ingen signering, orderöverföring eller elleverans genomförs.</p></div>`, () => {
      qs('#consumer-edit-record').onclick = () => recordForm(row);
      qs('#consumer-activity-form').onsubmit = event => {
        event.preventDefault(); const form = event.currentTarget;
        if (!P.validText(form.elements.activity) || !P.validText(form.elements.next) || !form.reportValidity()) return;
        if (!canEdit(row)) return;
        const previous = structuredClone(row);
        const previousStatus = row.status;
        row.next = form.elements.next.value.trim(); row.nextDate = form.elements.nextDate.value; row.updatedAt = new Date().toISOString();
        if (internal && statuses[form.elements.status.value]) row.status = form.elements.status.value;
        const text = form.elements.activity.value.trim() + (internal && previousStatus !== row.status ? '\nTeststatus: ' + statuses[row.status] + '.' : '');
        if (!Array.isArray(row.events)) row.events = [];
        row.events.unshift({...newEvent(text), kind: internal ? 'feedback' : 'activity'});
        if (!saveMessage(internal ? 'Teståterkopplingen är sparad.' : 'Aktiviteten är dokumenterad.', () => restoreObject(row, previous))) return;
        P.render(); openRecord(id);
      };
    });
  }
  const materials = [
    {id: 'meeting', icon: 'users', title: 'Inför privatkundsmötet', intro: 'Samla kundens fråga, adress och önskade nästa steg.', text: 'INFÖR PRIVATKUNDSMÖTET\nTESTMALL – inte godkänt säljmaterial.\n\n1. Förklara vilken aktör du företräder.\n2. Samla den fiktiva kundens frågor om elhandel.\n3. Dokumentera adress och önskad leveransstart.\n4. Använd godkänt underlag för produkt, pris och villkor när det finns.\n5. Sammanfatta nästa steg med kunden.\n\nDenna mall anger inga avtalsvillkor, priser eller säljmandat. Använd bara exempeldata.\n'},
    {id: 'check', icon: 'file', title: 'Granska försäljningsunderlaget', intro: 'Kontrollera kontaktuppgifter och se vad som behöver kompletteras.', text: 'GRANSKA FÖRSÄLJNINGSUNDERLAG\nTESTMALL – inte beslutad kontrollprocess.\n\nKontrollera fiktivt namn, .example-mejl, adress och ort.\nStäm av önskat datum, kundfråga, säljare och exempelteam.\nDokumentera saknat underlag och nästa steg.\n\nRegistrering skapar inget avtal. Verkligt godkännande, identifiering och avtalsstart behöver Kraftringens underlag.\n'},
    {id: 'followup', icon: 'mail', title: 'Besvara en komplettering', intro: 'Beskriv vad du har stämt av och planera fortsatt uppföljning.', text: 'SVAR PÅ KOMPLETTERING\nTESTMALL – inget skickas.\n\nReferens: [F2F-testreferens]\nFråga från Kraftringen: [exempel]\nVad har stämts av: [fiktiv aktivitet]\nUppdaterat underlag: [exempel]\nNästa steg och datum: [exempel]\n\nKundkontakt, meddelanden och återkoppling är lokala simuleringar i prototypen.\n'}
  ];
  function renderMaterial() {
    return `<div class="consumer-workspace">${heading('FACE2FACE / SÄLJSTÖD', 'Material för konsumentförsäljning', 'Förbered kundmötet och håll ihop uppföljningen.')}<section class="consumer-material-hero"><div><span class="consumer-eyebrow">PRIVATKUNDEN I FOKUS</span><h2>Ett tydligt möte.<br>Ett tydligt nästa steg.</h2><p>Testa mallarna för möte, underlag och återkoppling.</p></div>${icon('users')}</section><div class="consumer-material-grid">${materials.map(item => `<article class="card consumer-material-card"><span class="consumer-material-icon">${icon(item.icon)}</span><span class="eyebrow">KONSUMENT · TESTMALL</span><h2>${e(item.title)}</h2><p>${e(item.intro)}</p><small>TXT · strukturförslag</small><div><button class="btn btn-secondary btn-small" data-consumer-read-material="${item.id}">Förhandsvisa</button><button class="btn btn-primary btn-small" data-consumer-download-material="${item.id}">${icon('download')} Ladda ned</button></div></article>`).join('')}</div><section class="card consumer-approved-material"><span class="consumer-material-icon">${icon('shield')}</span><div><h2>Godkända produkter, priser & kampanjer</h2><p>Här kan ert godkända konsumentmaterial samlas när ni lämnar det. Aktuella elavtal, villkor, kampanjer och eventuell ersättning saknar underlag i prototypen.</p></div><button class="btn btn-secondary" data-go="support">Ställ en testfråga ${icon('arrow')}</button></section>${demoNote('Mallarna är diskussionsunderlag. De är inte godkända produkttexter, kampanjer eller instruktioner för verklig avtalsteckning.')}</div>`;
  }
  function reportTable(field, label) {
    return `<div class="table-wrap"><table class="consumer-table"><thead><tr><th>${label}</th><th>Underlag</th><th>Aktiva · demo</th><th>Kompletteringar</th></tr></thead><tbody>${teamStats(field).map(group => `<tr><td><strong>${e(group.name)}</strong></td><td>${group.total}</td><td>${group.active}</td><td>${group.complement}</td></tr>`).join('')}</tbody></table></div>`;
  }
  function renderReports() {
    init();
    return `<div class="consumer-workspace">${heading('FACE2FACE / RESULTAT', 'Lokala konsumentunderlag', 'Demo av underlag och återkoppling. Face2faces interna avtalsutfall följs i Affärsutfall.', `<button class="btn btn-primary" data-consumer-export>${icon('download')} Exportera konsumenttestdata</button>`)}${metrics()}<div class="consumer-overview-grid"><section class="card"><div class="panel-heading"><h2>Exempelutfall per team</h2><span class="pill">Antal</span></div>${reportTable('team', 'Exempelteam')}</section><section class="card"><div class="panel-heading"><h2>Exempelutfall per säljare</h2><span class="pill">Antal</span></div>${reportTable('seller', 'Fiktiv säljare')}</section></div><section class="card consumer-report-status"><div class="panel-heading"><h2>Underlag per teststatus</h2></div>${statusDistribution()}</section>${demoNote('Rapporten visar lokala konsumentunderlag. Ekonomiskt resultat, försäljningsvärde och partnerersättning kräver ett fastställt underlag och räknas inte fram här.')}</div>`;
  }
  function bind() {
    const view = qs('#view');
    view.onclick = event => {
      const button = event.target.closest('button'); if (!button) return;
      if (button.hasAttribute('data-consumer-new')) recordForm();
      else if (button.dataset.consumerOpen) openRecord(button.dataset.consumerOpen);
      else if (button.dataset.consumerStatus) { statusFilter = button.dataset.consumerStatus; search = ''; teamFilter = 'all'; P.go('consumer-sales'); }
      else if (button.dataset.consumerFollowupFilter) { followupFilter = button.dataset.consumerFollowupFilter; P.render(); }
      else if (button.dataset.consumerReadMaterial) {
        const item = materials.find(material => material.id === button.dataset.consumerReadMaterial);
        if (item) P.openDialog(item.title, `<pre class="consumer-material-preview">${e(item.text)}</pre>`);
      } else if (button.dataset.consumerDownloadMaterial) {
        const item = materials.find(material => material.id === button.dataset.consumerDownloadMaterial);
        if (item) P.download('face2face-' + item.id + '-testmall.txt', item.text);
      } else if (button.hasAttribute('data-consumer-export')) {
        P.download('face2face-konsumenttestdata.json', JSON.stringify({prototype: true, exportedAt: new Date().toISOString(), note: 'Lokal konsumenttestdata. Ingen ekonomirapport, synkronisering eller fullständig säkerhetskopia.', consumerSales: rows().map(row => ({...row, events: activityFor(row.id)}))}, null, 2), 'application/json');
        P.toast('Konsumenttestdata exporterade.');
      }
    };
    const refreshTable = () => { qs('#consumer-sales-table').innerHTML = table(filteredRows()); qs('#consumer-result-count').textContent = `${filteredRows().length} av ${rows().length} underlag`; };
    qs('#consumer-search')?.addEventListener('input', event => {search = event.target.value; refreshTable();});
    qs('#consumer-status-filter')?.addEventListener('change', event => {statusFilter = event.target.value; refreshTable();});
    qs('#consumer-team-filter')?.addEventListener('change', event => {teamFilter = event.target.value; refreshTable();});
  }
  P.initConsumerDemo = init;
  P.consumer = {init, rows, activityFor, open: openRecord, new: () => recordForm(), statuses};
  for (const [id, render] of [['consumer-overview', renderOverview], ['consumer-sales', renderSales], ['consumer-followup', renderFollowup], ['consumer-material', renderMaterial], ['consumer-reports', renderReports]]) P.register(id, {render, bind});
})();
