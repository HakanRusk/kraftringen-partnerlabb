(() => {
  'use strict';
  const P = window.Portal;
  if (!P) return;
  const e = P.e;
  const partnerIds=['syd','vast','estate1','estate2'];
  const registryIds=()=>P.partnerRegistry.map(item=>item.id);
  const months = Array.from({length:10}, (_, index) => `2026-${String(index + 1).padStart(2, '0')}`);
  const monthNames = ['Januari', 'Februari', 'Mars', 'April', 'Maj', 'Juni', 'Juli', 'Augusti', 'September', 'Oktober · 1–7 okt'];
  const cutoff = '2026-10-07';
  const money = value => `${new Intl.NumberFormat('sv-SE', {maximumFractionDigits:0}).format(value)} kr`;
  const name = id => P.getPartner?.(id)?.name || P.partners?.[id] || 'Exempelpartner';
  const statusNames = {review:'Under avstämning', settled:'Avstämt', paid:'Utbetalt'};
  let selectedPartner = 'all';

  // Manually supplied fictitious ledger. Values have no relationship to sales,
  // agreement status, financial cost fixtures or a remuneration formula.
  // Every amount and payment below is an independent illustrative entry.
  const manualAmounts = {
    syd: [13500,15000,14500,16500,18000,19000,18000,20500,23000,4500],
    vast: [9500,11000,10500,12500,13000,14500,15000,16000,17500,3200],
    estate1: [1800,2200,2600,3000,3500,4100,4500,5000,6100,1200],
    estate2: [0,900,1100,1300,1600,1800,2100,2500,2200,null]
  };
  const ledger = [];
  partnerIds.forEach((partner, partnerIndex) => {
    months.forEach((month, monthIndex) => {
      const amount = manualAmounts[partner][monthIndex];
      if (amount === null) return; // Missing basis must not become inferred zero earnings.
      const status = monthIndex < 8 ? 'paid' : monthIndex === 8 ? 'settled' : 'review';
      const paid = monthIndex < 8 ? amount : monthIndex === 8 ? [12000,8000,2500,0][partnerIndex] : 0;
      ledger.push(Object.freeze({
        id:`KB-EX-${partner}-${month}`, partner, month, amount, paid, status,
        reference:`EX-${String(partnerIndex + 1)}-${month.replace('-', '')}`,
        source:'Manuellt exempelunderlag'
      }));
    });
  });
  Object.freeze(ledger);

  function rowsFor(ids, periodMonths) {
    return ledger.filter(row => ids.includes(row.partner) && periodMonths.includes(row.month));
  }
  function totalsFor(ids, periodMonths) {
    const rows = rowsFor(ids, periodMonths);
    const totals = rows.reduce((result, row) => {
      result.amount += row.amount;
      result.paid += row.paid;
      if (row.status === 'review') result.review += row.amount;
      else {
        result.settled += row.amount;
        result.remaining += row.amount - row.paid;
      }
      return result;
    }, {amount:0, paid:0, review:0, settled:0, remaining:0});
    return {...totals, rows, missing:ids.flatMap(partner => periodMonths.filter(month => !rows.some(row => row.partner === partner && row.month === month)).map(month => ({partner,month})))};
  }
  function metric(label, value, note, hasBasis = true) {
    return `<div class="kickback-metric"><span>${e(label)}</span><strong>${hasBasis ? e(money(value)) : '—'}</strong><small>${e(hasBasis ? note : 'Underlag saknas')}</small></div>`;
  }
  function footnote() {
    return '<p class="kickback-footnote">Manuella exempelposter. Faktiska villkor och beräkningsregler saknas. Beloppen är fristående från partnerkostnaden i resultatvyn.</p>';
  }
  function selectPartner(partnerId) {
    if (P.role !== 'internal' || !P.getPartner?.(partnerId)) return;
    selectedPartner=partnerId;
    P.selectedPartnerId=partnerId;
    P.go('kickback');
  }
  function bindSummary(root = document) {
    root.querySelectorAll('[data-kickback-open]').forEach(button => button.addEventListener('click', () => selectPartner(button.dataset.kickbackOpen)));
  }
  function renderSummary(partnerId, period) {
    if (P.role !== 'internal' || !P.getPartner?.(partnerId)) return '';
    const result = totalsFor([partnerId], period.current);
    const hasBasis = result.rows.length > 0;
    return `<section class="card kickback-summary" aria-label="Kickback för ${e(name(partnerId))}"><div class="panel-heading"><div><span class="commercial-eyebrow">KICKBACK / MANUELLA EXEMPEL</span><h2>Underlag, avstämning och utbetalning</h2><p class="kickback-caption">${e(period.range || period.label)}</p></div><button class="text-button" data-kickback-open="${partnerId}">Öppna kickbacköversikten ${P.icon('arrow')}</button></div><div class="kickback-metrics">${metric('Under avstämning', result.review, 'Separat från avstämt belopp', hasBasis)}${metric('Avstämt belopp', result.settled, 'Inklusive redan utbetalt', hasBasis)}${metric('Utbetalt på posterna', result.paid, 'Manuellt angivna betalningar', hasBasis)}${metric('Kvar på avstämda poster', result.remaining, 'Avstämt minus utbetalt', hasBasis)}</div>${result.missing.length ? '<p class="kickback-missing">Underlag saknas för en del av den valda perioden. Beloppen omfattar bara registrerade exempelposter.</p>' : ''}${footnote()}</section>`;
  }
  function statusBadge(status) {
    return `<span class="kickback-status kickback-status-${status}">${statusNames[status]}</span>`;
  }
  function tableRows(rows) {
    return rows.slice().sort((a,b) => b.month.localeCompare(a.month) || name(a.partner).localeCompare(name(b.partner), 'sv-SE')).map(row => `<tr><td><strong>${e(name(row.partner))}</strong><small>${e(row.reference)} · exempel</small></td><td>${e(monthNames[months.indexOf(row.month)])} 2026</td><td>${statusBadge(row.status)}</td><td class="kickback-number">${e(money(row.amount))}</td><td class="kickback-number">${e(money(row.paid))}</td><td class="kickback-number">${row.status === 'review' ? '<span class="kickback-unsettled" title="Posten är ännu inte avstämd">—</span>' : e(money(row.amount - row.paid))}</td></tr>`).join('') || '<tr><td colspan="6"><div class="empty">Underlag saknas för vald partner och period.</div></td></tr>';
  }
  function render() {
    if (P.role !== 'internal') return '<div class="empty">Denna vy tillhör Kraftringens interna demovy.</div>';
    const period = P.commercial?.currentPeriod?.() || {current:['2026-09'],label:'September 2026',range:'1–30 september 2026'};
    if(selectedPartner!=='all'&&!P.getPartner?.(selectedPartner))selectedPartner='all';
    const ids=selectedPartner==='all'?registryIds():[selectedPartner];
    const result = totalsFor(ids, period.current);
    const hasBasis = result.rows.length > 0;
    return `<div class="commercial-page kickback-page"><div class="page-head commercial-head"><div><span class="commercial-eyebrow">KRAFTRINGEN / INTERN PARTNERSTYRNING</span><h1>Kickback och utbetalningar</h1><p class="muted">Följ era partners genom avstämning till utbetalning.</p></div><span class="pill">Manuella exempel</span></div>${P.commercial?.renderControls?.(false) || ''}<div class="kickback-partner-filter"><label class="commercial-filter-label">Partner<select id="kickback-partner"><option value="all"${selectedPartner === 'all' ? ' selected' : ''}>Alla partners</option>${registryIds().map(id => `<option value="${id}"${id === selectedPartner ? ' selected' : ''}>${e(name(id))}</option>`).join('')}</select></label><p class="kickback-caption">Underlagsperiod: ${e(period.range || period.label)} · exempeldata till 7 oktober 2026</p></div><div class="kickback-metrics kickback-main-metrics">${metric('Under avstämning', result.review, 'Belopp ännu ej avstämt', hasBasis)}${metric('Avstämt belopp', result.settled, 'Inklusive redan utbetalt', hasBasis)}${metric('Utbetalt på posterna', result.paid, 'Betalningar kopplade till underlagen', hasBasis)}${metric('Kvar på avstämda poster', result.remaining, 'Avstämt minus utbetalt', hasBasis)}</div>${result.missing.length ? `<div class="kickback-missing">Underlag saknas: ${result.missing.map(item => `${e(name(item.partner))}, ${e(monthNames[months.indexOf(item.month)])} 2026`).join(' · ')}. Saknat underlag räknas inte som noll intjänad ersättning.</div>` : ''}<section class="card kickback-ledger"><div class="panel-heading"><div><h2>Manuellt kickbackunderlag</h2><p class="kickback-caption">${result.rows.length} exempelposter · statusar att diskutera</p></div></div><div class="table-wrap"><table class="kickback-table"><caption class="sr-only">Fiktiva kickbackposter för vald underlagsperiod. Beloppen är inte beräknade från avtal.</caption><thead><tr><th scope="col">Partner / underlag</th><th scope="col">Underlagsperiod</th><th scope="col">Status</th><th scope="col" class="kickback-number">Angivet belopp</th><th scope="col" class="kickback-number">Utbetalt</th><th scope="col" class="kickback-number">Kvar avstämt</th></tr></thead><tbody>${tableRows(result.rows)}</tbody></table></div></section><details class="kickback-guide"><summary>Vad visar beloppen?</summary><div><p><strong>Underlagsperioden</strong> är den månad exempelposten hör till. Utbetalt visar manuellt angivna betalningar på dessa poster fram till 7 oktober 2026, oavsett betalningsmånad.</p><p><strong>Under avstämning</strong> hålls separat från avstämt belopp. Kvar på avstämda poster är avstämt belopp minus angiven utbetalning. Det är underlag för uppföljning och inte ett besked om intjänad ersättning.</p><p><strong>Reglerna behöver underlag.</strong> Belopp per avtal, procentsatser, utlösande händelser och hur bortfall eller churn påverkar kickback är inte definierade. Vyn beräknar ingen ersättning från försäljning eller inflyttningsärenden.</p></div></details>${footnote()}</div>`;
  }
  function bind() {
    if (P.role !== 'internal') return;
    P.commercial?.bindControls?.();
    document.querySelector('#kickback-partner')?.addEventListener('change', event => {
      selectedPartner=P.getPartner?.(event.target.value)?event.target.value:'all';
      P.render();
      document.querySelector('#kickback-partner')?.focus();
    });
  }
  P.partnerKickback = {renderSummary, bindSummary, selectPartner, rowsFor, totalsFor, ledger, months, cutoff};
  P.register('kickback', {render, bind});
})();
