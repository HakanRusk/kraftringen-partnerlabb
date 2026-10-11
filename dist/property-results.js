(() => {
  'use strict';
  const P = window.Portal;
  if (!P) return;
  const {e, icon} = P;
  const fixturePropertyIds = new Set(['estate1', 'estate2']);
  const monthNames = ['Januari', 'Februari', 'Mars', 'April', 'Maj', 'Juni', 'Juli', 'Augusti', 'September', 'Oktober'];
  const monthShort = ['Jan', 'Feb', 'Mar', 'Apr', 'Maj', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt'];
  const selections = new Map();
  const storagePrefix = P.demoMode ? 'partnerlabb.demo.propertyResults.v1' : 'partnerlabb.propertyResults.v1';
  const count = value => new Intl.NumberFormat('sv-SE', {maximumFractionDigits:0}).format(value);
  const money = value => `${count(value)} kr`;
  const months = () => P.partnerResultsData?.months || [];
  const partnerName = id => P.getPartner?.(id)?.name || 'Fastighetspartner';
  const allowed = id => P.getPartner?.(id)?.type === 'property' && (P.role === 'internal' || P.role === 'partner' && id === P.partner);
  const hasBasis = id => P.getPartner?.(id)?.type === 'property' && fixturePropertyIds.has(id) && !!P.partnerResultsData && !!P.partnerKickback;
  function selectedPartner() {
    if (P.role === 'internal' && allowed(P.selectedPartnerId)) return P.selectedPartnerId;
    return allowed(P.partner) ? P.partner : null;
  }
  function validSelection(value) {
    const input = value && typeof value === 'object' ? value : {};
    return {
      mode: ['year','month'].includes(input.mode) ? input.mode : 'year',
      month: months().includes(input.month) ? input.month : '2026-09'
    };
  }
  function selection(id) {
    if (!selections.has(id)) {
      let saved = null;
      try { saved = JSON.parse(sessionStorage.getItem(`${storagePrefix}.${id}`)); } catch {}
      selections.set(id, validSelection(saved));
    }
    return selections.get(id);
  }
  function saveSelection(id) {
    try { sessionStorage.setItem(`${storagePrefix}.${id}`, JSON.stringify(selection(id))); } catch {}
  }
  function periodFor(id) {
    const selected = selection(id);
    const current = selected.mode === 'month' ? [selected.month] : [...months()];
    const monthIndex = months().indexOf(selected.month);
    const label = selected.mode === 'month' ? `${monthNames[monthIndex]} 2026` : '2026 hittills';
    const range = selected.mode === 'year' ? '1 januari–7 oktober 2026' : selected.month === '2026-10' ? '1–7 oktober 2026' : `1–${new Date(Date.UTC(2026, monthIndex + 1, 0)).getUTCDate()} ${monthNames[monthIndex].toLocaleLowerCase('sv-SE')} 2026`;
    return {current, label, range};
  }
  function outcomeFor(id, periodMonths) {
    // Fixed reporting examples stay independent of new local service records.
    // There is no commission formula or customer creation in this view.
    if (!hasBasis(id)) return {
      available: false,
      result: {agreements: null, helped: null, registrations: null},
      kickback: {rows: [], missing: periodMonths.map(month => ({partner:id, month})), settled: null, paid: null, remaining: null, review: null}
    };
    const result = P.partnerResultsData.summary({partnerIds:[id], months:periodMonths});
    const kickback = P.partnerKickback.totalsFor([id], periodMonths);
    return {available: true, result, kickback};
  }
  function availabilityNote(kickback) {
    if (!kickback.missing.length) return '';
    const missing = kickback.missing.map(item => `${monthNames[months().indexOf(item.month)]} 2026`).join(', ');
    return `<p class="property-results-missing">${icon('file')}<span><strong>Underlag saknas: ${e(missing)}.</strong> ${kickback.rows.length ? 'Beloppen omfattar endast månader med registrerade exempelposter.' : 'Ingen kickback kan visas för den valda perioden.'}</span></p>`;
  }
  function status(row) {
    if (!row) return '<span class="property-results-status missing">Underlag saknas</span>';
    const labels = {review:'Under avstämning', settled:'Avstämt', paid:'Utbetalt'};
    return `<span class="property-results-status ${e(row.status)}">${e(labels[row.status] || 'Ej angivet')}</span>`;
  }
  function controls(id, period) {
    const selected = selection(id);
    return `<section class="property-results-filters" aria-label="Filtrera uppföljningen"><div class="property-results-period"><span class="property-results-filter-title">Visa period</span><div class="property-results-segments" role="group" aria-label="Periodtyp"><button type="button" data-property-results-mode="year" aria-pressed="${selected.mode === 'year'}">År</button><button type="button" data-property-results-mode="month" aria-pressed="${selected.mode === 'month'}">Månad</button></div></div><label class="property-results-filter"><span>År</span><select id="property-results-year"><option value="2026">2026</option></select></label>${selected.mode === 'month' ? `<label class="property-results-filter property-results-month-filter"><span>Månad</span><select id="property-results-month">${months().map((month, index) => `<option value="${month}"${selected.month === month ? ' selected' : ''}>${monthNames[index]}${month === '2026-10' ? ' · 1–7 okt' : ''}</option>`).join('')}</select></label>` : ''}<div class="property-results-range"><strong>${e(period.label)}</strong><span>${e(period.range)}</span></div></section>`;
  }
  function primaryMetrics(result, kickback) {
    const hasBasis = kickback.rows.length > 0;
    return `<section class="property-results-primary" aria-label="Kunder och kickback"><article class="property-results-customer-card"><div class="property-results-card-top"><span class="property-results-eyebrow">KUNDER GENOM ER</span><span class="property-results-icon">${icon('users')}</span></div><span class="property-results-metric-label">Nya kunder · exempel</span><strong data-property-result="customers">${count(result.agreements)}</strong><p>Nya elhandelsavtal från ert samarbete.</p><small>I exemplet motsvarar varje nytt avtal en ny kund.</small></article><article class="property-results-kickback-card"><div class="property-results-card-top"><span class="property-results-eyebrow">ERT KICKBACKUNDERLAG</span><span class="property-results-icon">${icon('money')}</span></div><span class="property-results-metric-label">Avstämd kickback</span><strong data-property-result="settled">${hasBasis ? money(kickback.settled) : '—'}</strong><p>${hasBasis ? 'Inklusive belopp som redan är utbetalda.' : 'Underlag saknas för den valda perioden.'}</p><small>Manuella exempelposter, utan automatisk beräkning.</small></article></section>`;
  }
  function paymentMetrics(kickback) {
    const hasBasis = kickback.rows.length > 0;
    const items = [
      ['Utbetalt', kickback.paid, 'Betalningar på periodens poster', 'paid'],
      ['Kvar på avstämda poster', kickback.remaining, 'Avstämt minus redan utbetalt', 'remaining'],
      ['Under avstämning', kickback.review, 'Ingår inte i avstämd kickback', 'review']
    ];
    return `<section class="property-results-payment" aria-label="Avstämning och utbetalning">${items.map(([label, value, note, key]) => `<div><span>${e(label)}</span><strong data-property-result="${key}">${hasBasis ? money(value) : '—'}</strong><small>${hasBasis ? e(note) : 'Underlag saknas'}</small></div>`).join('')}</section>`;
  }
  function trend(id, period) {
    const rows = period.current.map(month => ({month, ...P.partnerResultsData.summary({partnerIds:[id], months:[month]})}));
    const maximum = Math.max(1, ...rows.map(row => row.agreements));
    return `<section class="card property-results-trend"><div class="property-results-section-head"><div><span class="property-results-eyebrow">NYA ELHANDELSAVTAL</span><h2>Kunder genom samarbetet</h2></div><span class="property-results-unit">Antal · exempel</span></div><div class="property-results-chart" style="--property-result-months:${rows.length}" aria-label="Nya exempelavtal per månad">${rows.map(row => { const index = months().indexOf(row.month); return `<div class="property-results-chart-month"><strong>${count(row.agreements)}</strong><div class="property-results-chart-track" aria-hidden="true"><i style="height:${row.agreements / maximum * 100}%"></i></div><span>${monthShort[index]}${row.month === '2026-10' ? '<small>1–7 okt</small>' : ''}</span><span class="sr-only">${monthNames[index]} 2026: ${count(row.agreements)} nya exempelavtal.</span></div>`; }).join('')}</div></section>`;
  }
  function serviceCard(result, period) {
    return `<section class="card property-results-service"><span class="property-results-service-icon">${icon('home')}</span><span class="property-results-eyebrow">INFLYTTNINGSHJÄLPEN</span><h2>En enklare start för era inflyttare.</h2><div class="property-results-service-count"><strong data-property-result="helped">${count(result.helped)}</strong><span>hjälpta inflyttningar<br><small>${e(period.range)}</small></span></div><p>${count(result.registrations)} serviceanmälningar i periodens exempelunderlag. Inflyttningshjälp och nya elhandelsavtal följs var för sig.</p><button type="button" class="text-button" data-property-results-workspace="${e(P.role==='internal'?selectedPartner():P.partner)}">Öppna era inflyttningsärenden ${icon('arrow')}</button></section>`;
  }
  function monthTable(id, period, kickback) {
    const rows = period.current.slice().reverse().map(month => {
      const index = months().indexOf(month);
      const data = P.partnerResultsData.summary({partnerIds:[id], months:[month]});
      const post = kickback.rows.find(row => row.month === month);
      const title = `${monthNames[index]}${month === '2026-10' ? ' · 1–7 okt' : ''}`;
      return `<tr><th scope="row"><strong>${e(title)}</strong><small>${post ? e(post.reference) : 'Underlag saknas'} · exempel</small></th><td data-label="Nya kunder">${count(data.agreements)}</td><td data-label="Hjälpta inflyttningar">${count(data.helped)}</td><td data-label="Kickbackunderlag">${post ? money(post.amount) : '—'}</td><td data-label="Status">${status(post)}</td><td data-label="Utbetalt">${post ? money(post.paid) : '—'}</td></tr>`;
    }).join('');
    return `<section class="card property-results-ledger"><div class="property-results-section-head"><div><span class="property-results-eyebrow">ERT SAMARBETE I SIFFROR</span><h2>Månad för månad</h2><p>Service, avtal och kickback visas som separata utfall.</p></div><span class="property-results-unit">2026 · till 7 oktober</span></div><div class="property-results-table-wrap"><table class="property-results-table"><caption class="sr-only">Separata fiktiva månadsutfall för ${e(partnerName(id))}. Kickbackunderlaget är manuellt angivet.</caption><thead><tr><th scope="col">Månad / referens</th><th scope="col">Nya kunder</th><th scope="col">Hjälpta inflyttningar</th><th scope="col">Kickbackunderlag</th><th scope="col">Status</th><th scope="col">Utbetalt</th></tr></thead><tbody>${rows}</tbody></table></div></section>`;
  }
  function definitions() {
    return `<details class="property-results-definitions"><summary>Så läser ni uppföljningen ${icon('arrow')}</summary><div><p><strong>Nya kunder.</strong> De manuella exemplen räknar ett nytt elhandelsavtal som en ny kund. Verklig uppföljning behöver särskilja kund och avtal. Detta är periodens nya avtal, inte antal aktiva kunder hos Kraftringen.</p><p><strong>Inflyttningshjälp.</strong> Hjälpta inflyttningar och serviceanmälningar är ett separat exempelunderlag. Ett serviceärende behöver inte leda till ett elhandelsavtal. Registreringar och bilagor som ni testar i labbet ändrar inte dessa resultat.</p><p><strong>Kickback.</strong> Avstämd kickback inkluderar redan utbetalt. Kvar avstämt är avstämt minus utbetalt; belopp under avstämning hålls separat. Underlagsperioden är månaden som posten hör till. Utbetalt avser betalningar på dessa poster till 7 oktober 2026, oavsett betalningsmånad.</p><p><strong>Underlaget.</strong> Alla utfall och belopp är fiktiva, manuella exempel till 7 oktober 2026. Ingen kickback räknas fram från kunder, avtal eller serviceärenden. Faktiska ersättningsregler och datakällor behöver lämnas av Kraftringen.</p></div></details>`;
  }
  function renderWithoutBasis(id) {
    const ownRows = P.moveinService?.rows(id) || [];
    return `<div class="property-results-page" data-property-results-availability="missing"><div class="page-head"><div><span class="eyebrow">FASTIGHETSPARTNER / ${e(partnerName(id))}</span><h1>Kunder & kickback</h1><p>Följ kunderna ni har gett oss och ert kickbackunderlag.</p></div><span class="property-results-demo-label">Underlag saknas</span></div><section class="property-results-primary" aria-label="Kunder och kickback"><article class="property-results-customer-card"><div class="property-results-card-top"><span class="property-results-eyebrow">KUNDER GENOM ER</span><span class="property-results-icon">${icon('users')}</span></div><span class="property-results-metric-label">Nya elhandelskunder</span><strong data-property-result="customers">—</strong><p>Resultatunderlag saknas för ert samarbete.</p><small>Ett registrerat inflyttningsärende skapar inte ett elhandelsavtal.</small></article><article class="property-results-kickback-card"><div class="property-results-card-top"><span class="property-results-eyebrow">ERT KICKBACKUNDERLAG</span><span class="property-results-icon">${icon('money')}</span></div><span class="property-results-metric-label">Avstämd kickback</span><strong data-property-result="settled">—</strong><p>Kickbackunderlag saknas för ert samarbete.</p><small>Ersättningsregler och avstämda poster behöver registreras separat.</small></article></section><section class="card property-results-service"><span class="property-results-service-icon">${icon('home')}</span><span class="property-results-eyebrow">INFLYTTNINGSHJÄLPEN</span><h2>Era ärenden följs separat.</h2><div class="property-results-service-count"><strong data-property-result="helped">—</strong><span>hjälpta inflyttningar<br><small>Resultatunderlag saknas</small></span></div><p><span data-property-result="local-cases">${count(ownRows.length)}</span> registrerade testärenden i er arbetsyta. Antalet ärenden är ett arbetsmått; det visar inte hur många kunder eller slutförda inflyttningar samarbetet har gett.</p><button type="button" class="text-button" data-property-results-workspace="${e(P.role==='internal'?selectedPartner():P.partner)}">Öppna era inflyttningsärenden ${icon('arrow')}</button></section><p class="property-results-missing">${icon('file')}<span>Den här partnern har inget inlagt resultat- eller kickbackunderlag ännu. Testregistreringar ändrar inte affärsutfallet.</span></p></div>`;
  }
  function render() {
    const id = selectedPartner();
    if (!id) return '<div class="empty">Kunder och kickback visas i fastighetspartnerns egen arbetsyta.</div>';
    if (!hasBasis(id)) return renderWithoutBasis(id);
    if (!P.partnerResultsData || !P.partnerKickback) return '<div class="empty">Resultatunderlaget är inte tillgängligt.</div>';
    const period = periodFor(id);
    const {result, kickback} = outcomeFor(id, period.current);
    return `<div class="property-results-page"><div class="page-head"><div><span class="eyebrow">FASTIGHETSPARTNER / ${e(partnerName(id))}</span><h1>Kunder & kickback</h1><p>Följ kunderna ni har gett oss och ert kickbackunderlag.</p></div><span class="property-results-demo-label">Exempeldata · 7 okt 2026</span></div>${controls(id, period)}${primaryMetrics(result, kickback)}${paymentMetrics(kickback)}${availabilityNote(kickback)}<div class="property-results-middle">${trend(id, period)}${serviceCard(result, period)}</div>${monthTable(id, period, kickback)}${definitions()}</div>`;
  }
  function bind() {
    const id = selectedPartner();
    if (!id) return;
    document.querySelectorAll('[data-property-results-workspace]').forEach(button => button.addEventListener('click', () => {
      if (selectedPartner() !== id) return;
      if (P.role === 'internal') P.previewPartner(id);
      P.go('property-registrations');
    }));
    document.querySelectorAll('[data-property-results-mode]').forEach(button => button.addEventListener('click', () => {
      if (selectedPartner() !== id || !['year','month'].includes(button.dataset.propertyResultsMode)) return;
      selection(id).mode = button.dataset.propertyResultsMode;
      saveSelection(id);
      const mode = button.dataset.propertyResultsMode;
      P.render();
      document.querySelector(`[data-property-results-mode="${mode}"]`)?.focus();
    }));
    document.querySelector('#property-results-month')?.addEventListener('change', event => {
      if (selectedPartner() !== id || !months().includes(event.target.value)) return;
      selection(id).month = event.target.value;
      saveSelection(id);
      P.render();
      document.querySelector('#property-results-month')?.focus();
    });
  }
  function renderSummary(id = P.partner) {
    if (!allowed(id)) return '';
    if (!hasBasis(id)) return `<section class="property-results-summary" data-property-results-availability="missing" aria-label="Samarbetets resultat"><div><span class="property-results-eyebrow">ERT SAMARBETE</span><h2>Kunderna ni har gett oss.</h2><p>Resultatunderlag saknas ännu</p></div><div class="property-results-summary-value"><strong>—</strong><span>nya elhandelskunder</span></div><div class="property-results-summary-value"><strong>—</strong><span>avstämd kickback</span></div><button type="button" class="btn btn-secondary" data-go="property-results">Kunder & kickback ${icon('arrow')}</button><small class="property-results-summary-note">Registrering av inflyttningsunderlag skapar inte ett elavtal eller kickback.</small></section>`;
    const {result, kickback} = outcomeFor(id, months());
    return `<section class="property-results-summary" aria-label="Samarbetets resultat hittills"><div><span class="property-results-eyebrow">ERT SAMARBETE / 2026 HITTILLS</span><h2>Kunderna ni har gett oss.</h2><p>1 januari–7 oktober · manuella exempel</p></div><div class="property-results-summary-value"><strong>${count(result.agreements)}</strong><span>nya kunder · exempel</span></div><div class="property-results-summary-value"><strong>${kickback.rows.length ? money(kickback.settled) : '—'}</strong><span>${kickback.rows.length ? 'avstämd kickback' : 'underlag saknas'}</span></div><button type="button" class="btn btn-secondary" data-go="property-results">Kunder & kickback ${icon('arrow')}</button><small class="property-results-summary-note">I exemplet motsvarar ett nytt avtal en ny kund. ${kickback.missing.length ? 'Kickbackunderlag saknas för delar av perioden. ' : ''}Era testregistreringar ändrar inte resultatunderlaget.</small></section>`;
  }
  P.propertyResults = {renderSummary, periodFor, outcomeFor, hasBasis};
  P.register('property-results', {render, bind});
})();
