(() => {
  'use strict';
  const P = window.Portal;
  if (!P) return;
  const { e, icon } = P;
  const panels = new Map(), preferences = new Map();
  let sequence = 0;
  const text = value => typeof value === 'string' ? value.trim() : '';
  const sharedFeedback = (row, kind) => (Array.isArray(row.events) ? row.events : []).filter(event => event && event.visibility === 'shared' && (!kind || event.kind === kind) && text(event.text)).slice().sort((a, b) => String(b.at || '').localeCompare(String(a.at || '')))[0]?.text?.trim().slice(0, 160) || '';
  const partnerName = id => P.getPartner?.(id)?.name || P.partners?.[id] || 'Partner';
  const localToday = () => { const now = new Date(); return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`; };
  function plannedDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return '';
    const parsed = new Date(value + 'T12:00:00');
    if (Number.isNaN(parsed.getTime())) return '';
    const actual = `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}-${String(parsed.getDate()).padStart(2, '0')}`;
    return actual === value ? value : '';
  }
  function inScope(partner, options) {
    if (!P.getPartner?.(partner)) return false;
    if (P.role !== 'internal' && partner !== P.partner) return false;
    return !Array.isArray(options.partnerIds) || options.partnerIds.includes(partner);
  }
  const includes = (options, channel) => !Array.isArray(options.channels) || options.channels.includes(channel);
  function tasks(options = {}) {
    const output = [], internal = P.role === 'internal', today = localToday();
    function add(task) {
      const date = plannedDate(task.date);
      output.push({ ...task, date, dateState: !date ? 'none' : date < today ? 'passed' : date === today ? 'today' : 'planned', ours: task.side === (internal ? 'internal' : 'partner') });
    }
    if (includes(options, 'movein')) for (const row of Array.isArray(P.state.moveins) ? P.state.moveins : []) {
      if (!row || !inScope(row.partner, options) || P.getPartner?.(row.partner)?.type !== 'property') continue;
      const status = row.handoverStatus || 'draft';
      if (!['draft', 'needs_info', 'submitted', 'handling'].includes(status)) continue;
      const partnerAction = ['draft', 'needs_info'].includes(status);
      const ready = !!P.moveinService?.canForward?.(row);
      const missing = status === 'draft' && !ready;
      const receivedSupplement = status === 'submitted' && row.submissionType === 'supplement';
      add({ id: `movein:${row.id}`, recordId: row.id, channel: 'movein', channelLabel: 'Inflyttningsärende', partner: row.partner, title: text(row.name) || 'Inflyttare · exempel', action: 'movein', side: partnerAction ? 'partner' : 'internal', owner: partnerAction ? partnerName(row.partner) : 'Kraftringen', next: missing ? 'Granska underlaget som saknas' : text(row.next) || (status === 'draft' ? 'Förmedla serviceunderlaget i test' : status === 'needs_info' ? 'Komplettera och förmedla underlaget på nytt' : receivedSupplement ? 'Ta emot kompletterat underlag och fortsätt handläggningen' : 'Handlägg serviceärendet och återkoppla'), detail: missing ? 'Underlag eller fullmakt saknas för förmedling. Fastighetsbolaget kompletterar ärendet. En bifogad fil innebär ingen automatisk godkänd fullmakt.' : status === 'needs_info' ? sharedFeedback(row) || 'Partnern behöver förmedla en komplettering.' : receivedSupplement ? 'Partnern har förmedlat kompletteringen på nytt. Tidigare kompletteringsplan finns kvar i aktivitetshistoriken.' : partnerAction ? 'Serviceunderlag hos partnern.' : 'Elhandel, elnät och erbjudandeval följs separat.', date: row.nextDate, button: missing ? 'Se saknat underlag' : partnerAction ? 'Öppna ärende' : internal ? 'Handlägg ärende' : 'Följ handläggning' });
    }
    if (internal && options.includeManagement !== false && includes(options, 'management')) for (const [partner, row] of Object.entries(P.state.commercial?.management || {})) {
      if (!row || P.getPartner?.(partner)?.type !== 'property' || !inScope(partner, options) || (!text(row.next) && text(row.owner) && row.owner !== 'Ej tilldelad')) continue;
      const unassigned = !text(row.owner) || row.owner === 'Ej tilldelad';
      add({ id: `management:${partner}`, recordId: partner, channel: 'management', channelLabel: 'Intern partneruppföljning', partner, title: partnerName(partner), action: 'management', side: 'internal', owner: unassigned ? 'Kraftringen · behöver fördelas' : text(row.owner), next: text(row.next) || 'Utse ansvarig för partneruppföljningen', detail: 'Kraftringens uppföljning av samarbetet, separat från kundärenden.', date: row.date, button: 'Öppna partnerprofil' });
    }
    return output.sort((a, b) => (a.date || '9999').localeCompare(b.date || '9999') || a.channelLabel.localeCompare(b.channelLabel, 'sv-SE') || a.title.localeCompare(b.title, 'sv-SE'));
  }
  function panelKey(options) {
    return `${P.role}|${P.role === 'internal' ? '' : P.partner}|${options.key || ''}|${(options.partnerIds || []).join(',')}|${(options.channels || []).join(',')}|${options.includeManagement !== false}`;
  }
  function render(options = {}) {
    if (!P.partnerRegistry?.some(partner => partner.type === 'property' && inScope(partner.id, options))) return '';
    const key = panelKey(options);
    if (!panels.has(key)) panels.set(key, { token: 'wb-' + ++sequence, options: { ...options } });
    const panel = panels.get(key); panel.options = { ...options };
    const limit = Math.min(12, Math.max(1, Number(options.limit) || 4));
    if (!preferences.has(key)) preferences.set(key, { filter: 'ours', shown: limit });
    const setting = preferences.get(key), data = tasks(options), internal = P.role === 'internal';
    const selected = data.filter(task => setting.filter === 'all' || (setting.filter === 'ours' ? task.ours : !task.ours));
    const visible = selected.slice(0, Math.max(limit, setting.shown));
    const counts = { ours: data.filter(task => task.ours).length, others: data.filter(task => !task.ours).length, all: data.length };
    const labels = { ours: internal ? 'Vår insats' : 'Partnerns insats', others: 'Hos andra', all: 'Alla' };
    const empty = setting.filter === 'ours' ? `${internal ? 'Kraftringen' : 'Partnern'} har inga nästa steg i det här urvalet.` : setting.filter === 'others' ? 'Inga nästa steg ligger hos andra i det här urvalet.' : 'Inga öppna nästa steg i det här urvalet.';
    return `<section class="card workbench" data-workbench-panel="${panel.token}" aria-labelledby="${panel.token}-title"><div class="workbench-heading"><div><span class="eyebrow">UPPFÖLJNING / BEFINTLIGT UNDERLAG</span><h2 id="${panel.token}-title">${e(options.title || 'Nästa steg')}</h2><p>Se vem som behöver agera och öppna rätt underlag.</p></div><span class="workbench-total">${data.length}<small>öppna steg</small></span></div><div class="workbench-filters" role="group" aria-label="Filtrera nästa steg efter vem som behöver agera">${Object.entries(labels).map(([filter, label]) => `<button type="button" data-workbench-filter="${filter}" aria-pressed="${setting.filter === filter}"><span>${label}</span><b>${counts[filter]}</b></button>`).join('')}</div><div class="workbench-list">${visible.map(task => { const attrs = task.action === 'record' ? `data-record="${e(task.recordId)}"` : `data-workbench-open="${e(task.id)}"`; return `<article class="workbench-row"><span class="workbench-symbol">${icon(task.channel === 'movein' ? 'home' : task.channel === 'management' ? 'users' : task.channel === 'consumer' ? 'user' : 'briefcase')}</span><div class="workbench-task"><div class="workbench-meta"><span>${e(task.channelLabel)}${internal && task.channel !== 'management' ? ' · ' + e(partnerName(task.partner)) : ''}</span><span class="workbench-responsibility${task.ours ? ' workbench-responsibility-ours' : ''}">${e(task.owner)}</span></div><h3>${e(task.title)}</h3><p>${e(task.next)}</p>${task.detail ? `<small class="workbench-detail">${e(task.detail)}</small>` : ''}<div class="workbench-date${task.dateState === 'passed' ? ' workbench-date-passed' : ''}">${icon('calendar')}<span>${task.date ? 'Planerat datum · ' + e(P.date(task.date)) + (task.dateState === 'passed' ? ' · datum passerat' : task.dateState === 'today' ? ' · idag' : '') : 'Inget planerat datum'}</span></div></div><button type="button" class="workbench-open" ${attrs} aria-label="${e(task.button + ': ' + task.title)}"><span>${e(task.button)}</span>${icon('arrow')}</button></article>`; }).join('') || `<div class="workbench-empty">${icon('check')}<strong>${e(empty)}</strong><p>${setting.filter !== 'all' && data.length ? 'Välj ett annat filter för att följa övriga steg.' : 'Följ inflyttningsärenden och fastighetspartnerns uppföljning.'}</p></div>`}</div><div class="workbench-foot"><span aria-live="polite">${selected.length ? `Visar ${visible.length} av ${selected.length} nästa steg` : '0 nästa steg'}<small>Planerade datum är uppföljning, ingen utlovad svarstid.</small></span>${selected.length > visible.length ? '<button type="button" class="workbench-more" data-workbench-more>Visa fler ' + icon('arrow') + '</button>' : ''}</div></section>`;
  }
  function resolvePanel(element) { return [...panels.values()].find(panel => panel.token === element?.dataset.workbenchPanel); }
  function bind() { /* Event delegation also handles panels inserted after route changes. */ }
  document.addEventListener('click', event => {
    const control = event.target.closest('[data-workbench-filter], [data-workbench-more], [data-workbench-open]');
    if (!control) return;
    const element = control.closest('[data-workbench-panel]'), panel = resolvePanel(element);
    if (!panel) return;
    event.preventDefault();
    if (control.hasAttribute('data-workbench-filter') || control.hasAttribute('data-workbench-more')) {
      const previouslyVisible = element.querySelectorAll('.workbench-row').length;
      const setting = preferences.get(panelKey(panel.options));
      if (control.hasAttribute('data-workbench-filter')) { setting.filter = control.dataset.workbenchFilter; setting.shown = Math.min(12, Math.max(1, Number(panel.options.limit) || 4)); }
      else setting.shown += Math.min(12, Math.max(1, Number(panel.options.limit) || 4));
      const focusSelector = control.hasAttribute('data-workbench-filter') ? `[data-workbench-filter="${setting.filter}"]` : '[data-workbench-more]';
      const token = panel.token; element.outerHTML = render(panel.options);
      const updated = document.querySelector(`[data-workbench-panel="${token}"]`);
      // The final Show more button is removed once all rows are visible. Keep
      // keyboard users at the first newly revealed case instead of the body.
      const target = updated?.querySelector(focusSelector) || updated?.querySelectorAll('.workbench-open')[previouslyVisible];
      target?.focus({ preventScroll: true });
      return;
    }
    const task = tasks(panel.options).find(row => row.id === control.dataset.workbenchOpen);
    if (!task) { P.toast('Nästa steget finns inte längre i det här urvalet.'); return; }
    if (task.action === 'business') P.openBusinessBrief?.(task.recordId);
    if (task.action === 'consumer') P.consumer?.open?.(task.recordId);
    if (task.action === 'movein') P.moveinService?.open?.(task.recordId);
    if (task.action === 'management' && P.role === 'internal') P.commercial?.selectPartner?.(task.partner);
  });
  P.workbench = { tasks, render, bind };
})();
