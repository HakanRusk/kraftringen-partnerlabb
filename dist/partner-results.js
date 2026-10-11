(() => {
  'use strict';
  const P = window.Portal;
  if (!P) return;
  const e = P.e;
  const partnerIds = () => P.partnerRegistry.map(partner => partner.id);
  const filters = {};
  let reportPartner = 'syd';
  const format = (value, decimals = 0) => new Intl.NumberFormat('sv-SE', { maximumFractionDigits: decimals }).format(value);
  const percent = value => value == null ? '—' : `${format(value * 100, 1)} %`;
  const name = id => P.getPartner?.(id)?.name || P.partners?.[id] || 'Partner';
  const data = () => P.partnerResultsData;
  const stateFor = id => filters[id] || (filters[id] = { product: 'all', seller: 'all', region: 'all', metric: 'agreements' });
  const idsFor = id => id === 'all' ? partnerIds() : [id];
  const isProperty = id => P.getPartner?.(id)?.type === 'property';
  const hasBasis = id => Boolean(data()?.rows({partnerIds: [id]}).length || data()?.serviceRows({partnerIds: [id]}).length);
  const periodFor = period => period || P.commercial?.currentPeriod?.() || { label: 'September 2026', current: ['2026-09'], range: '1–30 september 2026' };
  const monthName = month => new Intl.DateTimeFormat('sv-SE', { month: 'short', timeZone: 'UTC' }).format(new Date(`${month}-01T12:00:00Z`));
  const monthLong = month => new Intl.DateTimeFormat('sv-SE', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${month}-01T12:00:00Z`));
  function optionsFor(id, period, overrides = {}) {
    const f = stateFor(id);
    return { partnerIds: idsFor(id), months: periodFor(period).current, product: f.product, region: f.region, seller: id === 'syd' ? f.seller : 'all', ...overrides };
  }
  function select(label, key, choices, value) {
    return `<label class="partner-result-filter"><span>${e(label)}</span><select data-results-filter="${e(key)}">${choices.map(([id, text]) => `<option value="${e(id)}" ${value === id ? 'selected' : ''}>${e(text)}</option>`).join('')}</select></label>`;
  }
  function filtersHtml(id, period) {
    const f = stateFor(id), rows = data().rows({ partnerIds: idsFor(id), months: period.current });
    const products = data().productsFor(idsFor(id));
    const regions = [...new Set(rows.map(row => row.region))].sort((a, b) => a.localeCompare(b, 'sv-SE'));
    const sellers = [...new Set(rows.map(row => row.seller).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'sv-SE'));
    return `<div class="partner-result-filters">${select('Elavtal', 'product', [['all', 'Alla elavtal'], ...products.map(product => [product, product])], f.product)}${select('Geografiskt område', 'region', [['all', 'Alla områden'], ...regions.map(region => [region, region])], f.region)}${id === 'syd' ? select('Säljare · exempel', 'seller', [['all', 'Alla säljare'], ...sellers.map(seller => [seller, seller])], f.seller) : ''}<button class="text-button partner-result-reset" type="button" data-results-reset>Återställ filter</button></div>`;
  }
  function metric(label, value, note, icon, featured = false) {
    return `<article class="partner-result-metric ${featured ? 'featured' : ''}"><span>${P.icon(icon)}${e(label)}</span><strong>${value}</strong><small>${e(note)}</small></article>`;
  }
  function metricsHtml(id, period, summary, opts, hasRows) {
    const missing = value => hasRows ? value : '—';
    const agreements = metric('Stängda elavtal', missing(format(summary.agreements)), 'Avtal sålda under vald period', 'file', !isProperty(id));
    const volume = metric('Avtalad årsvolym', missing(`${format(summary.annualMWh, 2)} <small>MWh</small>`), 'Årsvolym för periodens nya avtal', 'chart');
    if (isProperty(id)) {
      const service = data().summary({ ...opts, product: 'all', seller: 'all' });
      return `<div class="partner-result-metrics">${metric('Hjälpta nyinflyttare', format(service.helped), 'Slutförd inflyttningshjälp under perioden', 'home', true)}${metric('Registrerad service', format(service.registrations), 'Frivilliga serviceunderlag under perioden', 'users')}${agreements}${volume}</div><p class="partner-result-scope-note">Serviceantal följer partner, område och period. Elavtalsfiltret gäller avtal och MWh. Hjälp med inflyttning innebär inte automatiskt ett elavtal.</p>`;
    }
    if (id === 'vast') {
      const cohort = data().cohort(opts);
      const churn = cohort.churnRate == null ? 'Ingen jämförbar kundbas' : `${format(cohort.openingCohortExited)} av ${format(cohort.openingActive)} i periodens ingående kundbas`;
      const loss = cohort.preStartRate == null ? 'Inga sålda avtal i urvalet' : `${format(cohort.preStartCancelled)} av ${format(cohort.sold)} sålda avtal`;
      return `<div class="partner-result-metrics">${agreements}${volume}${metric('Churn efter start', percent(cohort.churnRate), churn, 'users')}${metric('Bortfall före start', percent(cohort.preStartRate), loss, 'file')}</div><p class="partner-result-scope-note">Churn och bortfall har olika kundbaser och redovisas separat. Bortfall är observerat till 7 oktober; alla sålda avtal har ännu inte hunnit starta.</p>`;
    }
    if (id === 'all') {
      const service = data().summary({ ...opts, partnerIds: ['estate1', 'estate2'], product: 'all', seller: 'all' });
      return `<div class="partner-result-metrics">${agreements}${volume}${metric('Hjälpta nyinflyttare', format(service.helped), 'Fastighetspartner · oberoende av produktval', 'home')}${metric('Registrerad service', format(service.registrations), 'Fastighetspartner · oberoende av produktval', 'users')}</div>`;
    }
    return `<div class="partner-result-metrics partner-result-metrics-two">${agreements}${volume}</div>`;
  }
  function aggregate(rows, key) {
    const grouped = new Map();
    rows.forEach(row => {
      const label = row[key], current = grouped.get(label) || { label, agreements: 0, annualMWh: 0 };
      current.agreements += row.agreements;
      current.annualMWh += row.annualMWh;
      grouped.set(label, current);
    });
    return [...grouped.values()].sort((a, b) => b.agreements - a.agreements || b.annualMWh - a.annualMWh || String(a.label).localeCompare(String(b.label), 'sv-SE'));
  }
  function tableHtml(title, subtitle, rows, firstHeading, extra = '') {
    const max = Math.max(1, ...rows.map(row => row.agreements));
    return `<section class="partner-result-table-panel"><div class="partner-result-section-head"><div><h3>${e(title)}</h3><p>${e(subtitle)}</p></div></div><div class="table-wrap"><table class="partner-result-table"><caption class="sr-only">${e(title)}. ${e(subtitle)}</caption><thead><tr><th scope="col">${e(firstHeading)}</th><th scope="col">Avtal</th><th scope="col">Årsvolym · MWh</th>${extra ? '<th scope="col">Churn efter start</th>' : ''}</tr></thead><tbody>${rows.map(row => `<tr><th scope="row"><span>${e(row.label)}</span><i class="partner-result-table-bar" aria-hidden="true"><i style="width:${Math.max(0, row.agreements / max * 100)}%"></i></i></th><td>${format(row.agreements)}</td><td>${format(row.annualMWh, 2)}</td>${extra ? `<td>${extra(row)}</td>` : ''}</tr>`).join('') || `<tr><td colspan="${extra ? 4 : 3}" class="partner-result-no-data">Inget exempelunderlag för detta urval.</td></tr>`}</tbody></table></div></section>`;
  }
  function trendHtml(id, period, opts) {
    const f = stateFor(id);
    const isHelped = f.metric === 'helped';
    const title = f.metric === 'annualMWh' ? 'Avtalad årsvolym per månad' : isHelped ? 'Hjälpta nyinflyttare per månad' : 'Stängda avtal per månad';
    // The data API keeps service totals independent of product/seller itself.
    // Contract/MWh columns must retain their product filter even in a service chart.
    const totals = period.current.map(month => ({ month, ...data().summary({ ...opts, months: [month] }) }));
    const max = Math.max(1, ...totals.map(row => row[f.metric]));
    const choices = [['agreements', 'Antal avtal'], ['annualMWh', 'Årsvolym · MWh'], ...(isProperty(id) ? [['helped', 'Hjälpta nyinflyttare']] : [])];
    const chart = `<div class="partner-result-trend-scroll" tabindex="0" aria-label="Månadsdiagram, kan rullas i sidled"><div class="partner-result-trend" style="--result-months:${totals.length}" role="img" aria-label="${e(title)}. ${e(totals.map(row => `${monthLong(row.month)}: ${format(row[f.metric], isHelped || f.metric === 'agreements' ? 0 : 2)}${f.metric === 'annualMWh' ? ' MWh' : ''}`).join('. '))}">${totals.map(row => `<div class="partner-result-trend-column"><strong>${format(row[f.metric], f.metric === 'annualMWh' ? 2 : 0)}</strong><div class="partner-result-trend-track"><i style="height:${row[f.metric] ? Math.max(2, row[f.metric] / max * 100) : 0}%"></i></div><span>${e(monthName(row.month))}${row.month === '2026-10' ? '<small>1–7 okt</small>' : ''}</span></div>`).join('')}</div></div>`;
    return `<section class="partner-result-trend-panel"><div class="partner-result-section-head"><div><h3>${e(title)}</h3><p>${e(period.range || period.label)}${f.metric === 'annualMWh' ? ' · inte levererad månadsenergi' : ''}</p></div><label class="partner-result-chart-select"><span class="sr-only">Mått i månadsdiagrammet</span><select data-results-filter="metric">${choices.map(([value, label]) => `<option value="${value}" ${f.metric === value ? 'selected' : ''}>${label}</option>`).join('')}</select></label></div>${chart}<details class="partner-result-month-details"><summary>Visa månadsunderlaget</summary><div class="table-wrap"><table class="partner-result-table"><thead><tr><th scope="col">Månad</th><th scope="col">Avtal</th><th scope="col">Årsvolym · MWh</th>${isProperty(id) ? '<th scope="col">Hjälpta nyinflyttare</th>' : ''}</tr></thead><tbody>${totals.map(row => `<tr><th scope="row">${e(monthLong(row.month))}${row.month === '2026-10' ? ' · 1–7 okt' : ''}</th><td>${format(row.agreements)}</td><td>${format(row.annualMWh, 2)}</td>${isProperty(id) ? `<td>${format(data().helped({ ...opts, months: [row.month], product: 'all', seller: 'all' }))}</td>` : ''}</tr>`).join('')}</tbody></table></div></details></section>`;
  }
  function cohortHtml(period, opts) {
    const c = data().cohort({ ...opts, partnerIds: ['vast'], seller: 'all' });
    const churnNote = c.churnRate == null ? 'Ingen ingående kundbas för Face2face i detta urval.' : `${format(c.openingCohortExited)} kunder lämnade av ${format(c.openingActive)} aktiva kunder vid periodens början.`;
    const preStartNote = c.preStartRate == null ? 'Inga sålda Face2face-avtal i detta urval.' : `${format(c.preStartCancelled)} av ${format(c.sold)} sålda avtal föll bort före start, observerat till 7 oktober.`;
    return `<section class="partner-result-cohort"><div class="partner-result-section-head"><div><h3>Face2face · kundutfall</h3><p>Två separata mått för ${e(period.label.toLocaleLowerCase('sv-SE'))}</p></div></div><div class="partner-result-cohort-grid"><div><span>Efter avtalsstart</span><strong>${percent(c.churnRate)}</strong><h4>Churn i ingående kundbas</h4><p>${e(churnNote)}</p></div><div><span>Före avtalsstart</span><strong>${percent(c.preStartRate)}</strong><h4>Bortfall bland periodens sålda avtal</h4><p>${e(preStartNote)}</p></div></div><p class="partner-result-scope-note">Års- och kvartalschurn följer samma kundgrupp från periodens början. Månaders kundbaser eller procentsatser summeras inte. Måttdefinitionerna är förslag i detta test.</p></section>`;
  }
  function definitionsHtml(id) {
    return `<details class="partner-result-definitions"><summary>Så läser du resultatet ${P.icon('arrow')}</summary><div><p><strong>Stängda avtal</strong> är manuellt angivna exempel på avtal sålda under perioden. De är fristående från kunddialoger och lokala testregistreringar.</p><p><strong>MWh</strong> avser avtalad årsvolym för dessa nya avtal. En årsrapport summerar den årsvolym som tecknats under året; den visar inte levererad el under året.</p>${id === 'vast' || id === 'all' ? '<p><strong>Churn efter start</strong> är kunder som lämnat ur kundbasen som var aktiv vid periodens början, delat med den ingående kundbasen. <strong>Bortfall före start</strong> är periodens sålda avtal som fallit bort före start, delat med periodens sålda avtal. Det senare kan ändras när fler avtal hinner få utfall.</p>' : ''}${isProperty(id) || id === 'all' ? '<p><strong>Hjälpta nyinflyttare</strong> är separat angivna exempel på slutförd inflyttningshjälp under perioden. Serviceunderlag, slutförd hjälp och nya elavtal är olika mått och inte en automatisk konverteringskedja.</p>' : ''}${id === 'syd' ? `<p><strong>Företagsförsäljning via Savera:</strong> ${e(data().productsFor(['syd']).join(', '))}. Produktnamnen är bekräftade av er.</p>` : id === 'vast' ? '<p><strong>Face2face:</strong> Fastpris, Vintersäkrat, Opti, Kvartspris och Rörligt pris är de bekräftade elavtalsvalen.</p>' : id === 'all' ? `<p><strong>Savera:</strong> ${e(data().productsFor(['syd']).join(', '))}. <strong>Face2face:</strong> Fastpris, Vintersäkrat, Opti, Kvartspris och Rörligt pris.</p>` : '<p>Inflyttningskanalens avtalstyper visas som exempel. Slutligt utbud behöver bekräftas.</p>'}<p>Resultatfördelning, geografier och säljarnamn här är fiktiva. Priser och produktvillkor ingår inte.</p></div></details>`;
  }
  function content(id, period) {
    if (!data()) return '<div class="empty">Resultatunderlaget förbereds.</div>';
    if (id !== 'all' && !hasBasis(id)) {
      const missing = metric('Stängda elavtal', '—', 'Underlag saknas', 'file') + metric('Avtalad årsvolym', '—', 'Underlag saknas', 'chart');
      const services = isProperty(id) ? metric('Hjälpta nyinflyttare', '—', 'Underlag saknas', 'home', true) + metric('Registrerad service', '—', 'Underlag saknas', 'users') : '';
      return `<div class="partner-result-heading"><div><span class="commercial-eyebrow">PARTNERUTFALL</span><h2>${e(name(id))} · resultatunderlag saknas</h2><p>${e(period.range || period.label)}</p></div></div><div class="partner-result-metrics${isProperty(id) ? '' : ' partner-result-metrics-two'}">${services}${missing}</div><p class="partner-result-empty" role="status">Underlag saknas för den här partnern. Registreringar och lokala ärenden skapar inga avtal eller resultat.</p><button class="text-button" data-go="partners">Till partnerregistret ${P.icon('arrow')}</button>`;
    }
    const opts = optionsFor(id, period), rows = data().rows(opts), summary = data().summary(opts);
    const title = id === 'syd' ? 'Savera · avtal, volym och säljare' : id === 'vast' ? 'Face2face · försäljning och kundutfall' : isProperty(id) ? 'Inflyttningshjälp och nya elavtal' : 'Alla partners · avtal och volym';
    const source = id === 'vast' ? 'Beest · framtida datakälla' : id === 'syd' ? 'Partnerportal · möjlig framtida arbetsyta' : isProperty(id) ? 'Inflyttningsservice' : 'Tre partnerkanaler';
    const subtitle = id === 'syd' ? 'Följ företagsförsäljningen per månad, år, elavtal och säljare.' : id === 'vast' ? 'Face2face säljer i Beest. Här följer Kraftringen utfall, geografier och kundernas fortsatta relation.' : isProperty(id) ? 'Följ hjälpen till nya hyresgäster och de elavtal som väljs separat.' : 'Gemensamt utfall, med olika arbetssätt för företagsförsäljning, konsumentförsäljning och inflyttningsservice.';
    const productRows = aggregate(rows, 'product');
    let secondary;
    if (id === 'syd') secondary = tableHtml('Försäljning per säljare', 'Fiktiva säljarnamn · sorterat efter antal avtal', aggregate(rows, 'seller'), 'Säljare');
    else if (id === 'vast') secondary = tableHtml('Försäljning per område', 'Sorterat efter antal avtal · churn använder varje områdes egen kundbas', aggregate(rows, 'region'), 'Område', row => percent(data().cohort({ ...opts, region: row.label }).churnRate));
    else if (id === 'all') secondary = tableHtml('Utfallet per partner', 'Samma valda period och produktfilter', aggregate(rows, 'partner').map(row => ({ ...row, label: name(row.label) })), 'Partner');
    else secondary = tableHtml('Elavtal per område', 'Servicehjälp följs separat från avtalen', aggregate(rows, 'region'), 'Område');
    const missingPartners = id === 'all' ? partnerIds().filter(partner => !hasBasis(partner)) : [];
    const missingNote = missingPartners.length ? `<p class="partner-result-empty partner-result-missing-partners" role="status">Resultatunderlag saknas för: ${e(missingPartners.map(name).join(', '))}. Siffrorna omfattar partners med registrerade exempelunderlag.</p>` : '';
    return `<div class="partner-result-heading"><div><span class="commercial-eyebrow">PARTNERUTFALL</span><h2>${e(title)}</h2><p>${e(subtitle)}</p></div><span class="partner-result-source">${P.icon(id === 'vast' ? 'layers' : 'chart')}${e(source)}</span></div>${missingNote}${filtersHtml(id, period)}<div class="partner-result-selection" role="status" aria-live="polite">${e(period.range || period.label)} · ${e(stateFor(id).product === 'all' ? 'Alla elavtal' : stateFor(id).product)} · ${e(stateFor(id).region === 'all' ? 'Alla områden' : stateFor(id).region)}${id === 'syd' && stateFor(id).seller !== 'all' ? ` · ${e(stateFor(id).seller)}` : ''}</div>${rows.length ? '' : '<p class="partner-result-empty" role="status">Inget exempelunderlag matchar filtren. Justera ditt urval.</p>'}${metricsHtml(id, period, summary, opts, rows.length > 0)}${trendHtml(id, period, opts)}<div class="partner-result-breakdowns">${tableHtml('Fördelning på elavtal', 'Elhandel · manuellt fördelade exempelutfall', productRows, 'Elavtal')}${secondary}</div>${id === 'all' ? cohortHtml(period, opts) : ''}${definitionsHtml(id)}<p class="partner-result-footnote">Manuella exempeldata · till 7 oktober 2026. ${id === 'vast' ? 'Ingen anslutning till Beest. ' : ''}Inget ekonomiskt utfall skapas av lokala kund- eller serviceunderlag.</p>`;
  }
  function renderPanel(id, period) {
    if (P.role !== 'internal') return '';
    if (id !== 'all' && !P.getPartner?.(id)) return '';
    return `<section class="partner-results" data-result-panel="${e(id)}">${content(id, periodFor(period))}</section>`;
  }
  function bindPanel(root = document, id, period) {
    if (P.role !== 'internal') return;
    const panels = root.matches?.('[data-result-panel]') ? [root] : [...root.querySelectorAll('[data-result-panel]')];
    panels.forEach(panel => {
      const panelId = id || panel.dataset.resultPanel;
      const selectedPeriod = periodFor(period);
      panel.querySelectorAll('[data-results-filter]').forEach(selectNode => selectNode.addEventListener('change', () => {
        const key = selectNode.dataset.resultsFilter;
        stateFor(panelId)[key] = selectNode.value;
        panel.innerHTML = content(panelId, selectedPeriod);
        bindPanel(panel, panelId, selectedPeriod);
        panel.querySelector(`[data-results-filter="${key}"]`)?.focus();
      }));
      panel.querySelector('[data-results-reset]')?.addEventListener('click', () => {
        filters[panelId] = { product: 'all', seller: 'all', region: 'all', metric: 'agreements' };
        panel.innerHTML = content(panelId, selectedPeriod);
        bindPanel(panel, panelId, selectedPeriod);
        panel.querySelector('[data-results-reset]')?.focus();
      });
    });
  }
  function renderReport() {
    if (P.role !== 'internal') return '<div class="empty">Partnerutfall visas i Kraftringens interna demovy.</div>';
    const period = periodFor();
    if (reportPartner !== 'all' && !P.getPartner?.(reportPartner)) reportPartner = 'all';
    return `<div class="commercial-page partner-results-report"><div class="page-head commercial-head"><div><span class="commercial-eyebrow">KRAFTRINGEN / PARTNERUTFALL</span><h1>Avtal, volym och kundutfall</h1><p class="muted">Följ varje kanals försäljning och kundresultat. Kommersiellt bidrag och kostnad finns i resultatöversikten.</p></div><button class="btn btn-secondary" data-go="overview">${P.icon('arrow')} Kommersiell översikt</button></div><div class="partner-results-report-controls">${P.commercial?.renderControls?.(false) || ''}<label class="partner-result-partner-select"><span>Partner</span><select id="partner-results-partner"><option value="all" ${reportPartner === 'all' ? 'selected' : ''}>Alla partners</option>${partnerIds().map(id => `<option value="${e(id)}" ${reportPartner === id ? 'selected' : ''}>${e(name(id))}</option>`).join('')}</select></label></div>${renderPanel(reportPartner, period)}</div>`;
  }
  P.partnerResults = {
    renderPanel, bindPanel, renderReport,
    selectPartner(id) { if (P.role !== 'internal' || (id !== 'all' && !P.getPartner?.(id))) return; reportPartner = id; P.go('partner-results'); }
  };
  P.register('partner-results', {
    render: renderReport,
    bind() {
      if (P.role !== 'internal') return;
      P.commercial?.bindControls?.();
      bindPanel(document, reportPartner, periodFor());
      document.querySelector('#partner-results-partner')?.addEventListener('change', event => {
        if (event.target.value !== 'all' && !P.getPartner?.(event.target.value)) return;
        reportPartner = event.target.value;
        P.render();
        document.querySelector('#partner-results-partner')?.focus();
      });
    }
  });
})();
