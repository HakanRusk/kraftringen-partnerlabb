(() => {
  'use strict';
  const P = window.Portal;
  if (!P) return;
  const e = P.e;
  const partnerId = () => P.role === 'partner' ? P.partner : P.selectedPartnerId || 'syd';
  const allowed = () => ['sales', 'field'].includes(partner()?.type) && (P.role === 'internal' || (P.role === 'partner' && partnerId() === P.partner));
  const partner = () => P.getPartner(partnerId());
  const D = () => P.partnerSalesData?.forPartner(partnerId()) || (partnerId() === 'syd' ? P.saveraData : null);
  const storageKey = () => `${P.demoMode ? 'partnerlabb.demo' : 'partnerlabb'}.partnerSalesReports.v1.${P.role==='partner'?'own.':''}${partnerId()}`;
  const defaultFilters = () => ({mode: 'year', value: '2026', segment: 'all', product: 'all', seller: 'all', region: 'all', query: '', status: 'all'});
  let current = defaultFilters(), list = 'period', page = 1, activePartner = '', moreFiltersOpen = false, filtersExpanded = false;
  const pageSize = 20;
  const number = (value, digits = 0) => new Intl.NumberFormat('sv-SE', {maximumFractionDigits: digits, minimumFractionDigits: digits}).format(Number(value) || 0);
  const date = value => value ? new Date(`${String(value).slice(0, 10)}T12:00:00Z`).toLocaleDateString('sv-SE', {day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC'}) : '—';
  const options = mode => D()?.periods(mode) || [];
  const audiences = () => D()?.reportedAudiences || partner()?.salesAudiences || D()?.salesAudiences || [partner()?.audience].filter(Boolean);
  const segmentLabel = segment => segment === 'business' ? 'Företag' : segment === 'consumer' ? 'Konsument' : 'Alla kunder';
  const hasUnderlag = () => D()?.availableForSegment ? D().availableForSegment(current.segment) : D()?.available !== false;
  function validFilters(input) {
    const result = {...defaultFilters()};
    if (input && ['year', 'month', 'week'].includes(input.mode)) result.mode = input.mode;
    const periods = options(result.mode);
    result.value = periods.some(item => item.value === input?.value) ? input.value : (periods[periods.length - 1]?.value || '2026');
    result.segment = ['business', 'consumer'].includes(input?.segment) && audiences().includes(input.segment) ? input.segment : 'all';
    for (const key of ['product', 'seller', 'region']) {
      const allowed = key === 'product' ? (D()?.productsFor?.(result.segment) || D()?.products || []) : D()?.[`${key}s`] || [];
      result[key] = input?.[key] === 'all' || allowed.includes(input?.[key]) ? input[key] : 'all';
    }
    result.query = typeof input?.query === 'string' ? input.query.slice(0, 120) : '';
    result.status = ['all', 'active', 'pending', 'ended', 'cancelled'].includes(input?.status) ? input.status : 'all';
    return result;
  }
  function restore() {
    try {
      const saved = JSON.parse(sessionStorage.getItem(storageKey()));
      current = validFilters(saved?.filters || saved);
      list = saved?.list === 'active' ? 'active' : 'period';
      moreFiltersOpen = saved?.moreFiltersOpen === true;
    } catch { current = defaultFilters(); list = 'period'; moreFiltersOpen = false; }
    page = 1;
  }
  function ensureContext() {
    if (activePartner !== P.role + ':' + partnerId()) { activePartner = P.role + ':' + partnerId(); restore(); filtersExpanded = false; }
    else current = validFilters(current);
  }
  function save() {
    try { sessionStorage.setItem(storageKey(), JSON.stringify({filters: current, list, moreFiltersOpen})); } catch {}
  }
  function metricsFilters() { return {...current, query: '', status: 'all'}; }
  function repaint(focusId) {
    if (!['partner-sales', 'partner-insights', 'savera', 'insikter'].includes(P.page) || !allowed()) return;
    P.render();
    if (focusId) document.getElementById(focusId)?.focus();
  }
  function setFilters(patch, render = true) {
    ensureContext();
    current = validFilters({...current, ...patch}); page = 1; save();
    if (render) repaint();
    return {...current};
  }
  function setListMode(value, render = true) {
    ensureContext();
    list = value === 'active' ? 'active' : 'period'; page = 1; save();
    if (render) repaint();
    return list;
  }
  function select(key, label, choices, value) {
    return `<label class="sr-filter" for="sr-${key}"><span>${e(label)}</span><select id="sr-${key}" data-sr-filter="${key}">${choices.map(item => `<option value="${e(item.value)}"${item.value === value ? ' selected' : ''}>${e(item.label)}</option>`).join('')}</select></label>`;
  }
  function segmentControls() {
    const reported = audiences();
    const configured = partner()?.salesAudiences || D()?.salesAudiences || [];
    const historical = reported.some(value => !configured.includes(value));
    if (reported.length < 2) return `<div class="sr-audience-context"><span>${P.icon(reported[0] === 'consumer' ? 'user' : 'briefcase')} ${e(segmentLabel(reported[0]))}</span><span>Elhandel</span></div>`;
    return `<div class="sr-audience-controls"><fieldset class="sr-period-mode"><legend>Kundsegment</legend><div class="sr-segmented sr-audience-toggle">${['all', ...reported].map(value => `<button type="button" data-sr-segment="${e(value)}" aria-pressed="${current.segment === value}"${current.segment === value ? ' class="selected"' : ''}>${e(segmentLabel(value))}</button>`).join('')}</div></fieldset>${historical ? '<p>Även tidigare sålda avtal visas i uppföljningen.</p>' : '<p>Välj alla kunder eller följ ett segment.</p>'}</div>`;
  }
  function filterBar() {
    const selected = ['segment', 'product', 'seller', 'region'].some(key => current[key] !== 'all');
    const secondary = ['seller', 'region'].filter(key => current[key] !== 'all').length;
    const catalogue = key => [{value: 'all', label: key === 'product' ? 'Alla elavtal' : key === 'seller' ? 'Alla säljare' : 'Alla områden'}, ...(key === 'product' ? (D()?.productsFor?.(current.segment) || D()?.products || []) : D()?.[`${key}s`] || []).map(value => ({value, label: value}))];
    return `<section class="sr-filter-bar${filtersExpanded ? '' : ' sr-filters-collapsed'}" aria-label="Gemensamma rapportfilter">
      <button type="button" class="sr-filter-toggle" id="sr-filter-toggle" aria-controls="sr-filter-content" aria-expanded="${filtersExpanded}">${P.icon('settings')} ${filtersExpanded ? 'Dölj filter' : 'Visa filter'}<span>${e(audiences().length === 1 ? segmentLabel(audiences()[0]) : segmentLabel(current.segment))}</span>${P.icon('arrow')}</button>
      <div id="sr-filter-content">${segmentControls()}<div class="sr-primary-filters"><fieldset class="sr-period-mode"><legend>Visa period</legend><div class="sr-segmented">${[['year', 'År'], ['month', 'Månad'], ['week', 'Vecka']].map(([mode, label]) => `<button type="button" data-sr-mode="${mode}" aria-pressed="${current.mode === mode}"${current.mode === mode ? ' class="selected"' : ''}>${label}</button>`).join('')}</div></fieldset>${select('period', current.mode === 'year' ? 'År' : current.mode === 'month' ? 'Månad' : 'Vecka', options(current.mode), current.value)}${select('product', 'Elavtal', catalogue('product'), current.product)}<button type="button" class="sr-reset" id="sr-reset"${selected || current.query || current.status !== 'all' ? '' : ' disabled'}>${P.icon('settings')} Rensa filter</button></div><details class="sr-more-filters"${secondary || moreFiltersOpen ? ' open' : ''}><summary>${P.icon('layers')} Fler filter${secondary ? `<span>${secondary}</span>` : ''}</summary><div class="sr-secondary-filters">${select('seller', 'Säljare · exempel', catalogue('seller'), current.seller)}${select('region', 'Geografiskt område', catalogue('region'), current.region)}<p>Kundsegment, elavtal, säljare och område gäller båda rapportsidorna.</p></div></details></div></section>`;
  }
  function selectionNote(period) {
    const labels = [current.segment === 'all' ? null : segmentLabel(current.segment), current.product, current.seller, current.region].filter(value => value && value !== 'all');
    const partial = period.observedStart > period.start ? ` · observerat ${date(period.observedStart)}–${date(period.observedEnd)}` : period.observedEnd && period.observedEnd < period.end ? ` · utfall till ${date(period.observedEnd)}` : '';
    return `<div class="sr-selection"><span>${P.icon('calendar')} <strong>${e(period.label)}</strong>${e(partial)}</span><span>${labels.length ? e(labels.join(' · ')) : 'Alla elavtal, säljare och områden'}</span></div>`;
  }
  function heading(insights = false) {
    const name = partner()?.name || 'Partner', internal = P.role === 'internal';
    const tabs = [['partner-sales','Kunder & avtal'],['partner-insights','Insikter']];
    if(internal) tabs.push(['partner-detail','Partnerprofil']);
    else tabs.push(['product-facts','Avtalsfakta'],['academy','Utbildning']);
    return `<div class="sr-breadcrumb"><button class="text-button" data-go="${internal?'partners':'overview'}">← ${internal?'Partners':'Min översikt'}</button></div><header class="sr-heading"><div><span class="sr-eyebrow">${internal?'KRAFTRINGEN / PARTNERUPPFÖLJNING':'ERA RESULTAT'}</span><h1>${e(name)}</h1><p>${insights?'Kundtid, avtalsval och scenario vid fortsatt tempo.':'Era kunder och avtal – med samma perioder och mått som Kraftringens uppföljning.'}</p></div><span class="sr-demo-label">Fiktiva exempel · inget verkligt kundutfall</span></header><nav class="sr-partner-tabs" aria-label="Partnersidor">${tabs.map(([route,label])=>`<button data-go="${route}" ${route===(insights?'partner-insights':'partner-sales')?'class="selected" aria-current="page"':''}>${label}</button>`).join('')}</nav>`;
  }
  function metric(key, label, value, note, icon, active = false) {
    const tag = active ? 'button' : 'div';
    return `<${tag}${active ? ' type="button" data-sr-list="active"' : ''} class="sr-metric${active ? ' sr-metric-action' : ''}" data-sr-metric="${key}"><div class="sr-metric-label"><span>${e(label)}</span>${P.icon(icon)}</div><strong>${e(value)}</strong><p>${e(note)}</p>${active ? `<span class="sr-metric-link">Visa aktiva kunder ${P.icon('arrow')}</span>` : ''}</${tag}>`;
  }
  function rowMarkup(row) {
    return `<tr data-sr-record="${e(row.id)}" data-sr-row-segment="${e(row.segment || '')}"><td data-label="Kund" class="sr-customer-cell"><strong>${e(row.customer || row.name)}</strong><span>${e(row.region)} · ${e(row.customerId)}</span></td><td data-label="Elavtal"><span class="sr-product-name">${e(row.product)}</span>${audiences().length > 1 ? `<small class="sr-row-segment">${e(segmentLabel(row.segment))}</small>` : ''}</td><td data-label="Säljare">${e(row.seller)}</td><td data-label="Tecknat">${e(date(row.soldDate))}</td><td data-label="Avtalsstart">${e(date(row.startDate))}</td><td data-label="Status"><span class="sr-status sr-status-${e(row.status)}">${e(row.statusLabel)}</span>${row.observedEndDate ? `<small class="sr-end-date">Slut ${e(date(row.observedEndDate))}</small>` : ''}</td><td data-label="Årsvolym" class="sr-number">${e(number(row.annualMWh, 1))}<small>MWh/år</small></td></tr>`;
  }
  function tableMarkup() {
    const rows = D().query({...current, status: list === 'active' ? 'all' : current.status}, {stock: list === 'active'});
    const pages = Math.max(1, Math.ceil(rows.length / pageSize));
    page = Math.max(1, Math.min(page, pages));
    const start = (page - 1) * pageSize;
    const period = D().period(current);
    return `<div class="sr-table-summary"><span id="sr-table-count" role="status" tabindex="-1">${e(number(rows.length))} ${list === 'active' ? 'aktiva kunder' : 'avtal'}${current.query || (list !== 'active' && current.status !== 'all') ? ' matchar listfiltret' : ''}</span><span>${list === 'active' ? `Aktiva ${e(date(period.observedEnd))}, oavsett när avtalet tecknades` : `Tecknade under ${e(period.label.toLocaleLowerCase('sv-SE'))}`}</span></div>${rows.length ? `<table id="sr-customers" class="sr-customer-table"><caption class="sr-only">${list === 'active' ? 'Aktiva kunder vid vald periods observationsdatum' : 'Nya avtal tecknade under vald period'}. Alla kunder är fiktiva. Avtal, säljare och årsvolym per kund.</caption><thead><tr>${['Kund', 'Elavtal', 'Säljare', 'Tecknat', 'Avtalsstart', 'Status', 'Årsvolym'].map(text => `<th scope="col">${text}</th>`).join('')}</tr></thead><tbody>${rows.slice(start, start + pageSize).map(rowMarkup).join('')}</tbody></table><div class="sr-pagination"><span>${e(number(start + 1))}–${e(number(Math.min(start + pageSize, rows.length)))} av ${e(number(rows.length))}</span><div><button type="button" class="sr-pagination-button" data-sr-page="${page - 1}"${page === 1 ? ' disabled' : ''} aria-label="Föregående sida">${P.icon('arrow')}</button><span>Sida ${page} av ${pages}</span><button type="button" class="sr-pagination-button" data-sr-page="${page + 1}"${page === pages ? ' disabled' : ''} aria-label="Nästa sida">${P.icon('arrow')}</button></div></div>` : `<div class="sr-empty">${P.icon('search')}<h3>Inga ${list === 'active' ? 'aktiva kunder' : 'avtal'} matchar</h3><p>Välj en annan period eller justera filtren.</p><button type="button" class="text-button" data-sr-clear-table>Rensa listfilter</button></div>`}`;
  }
  function customerTable() {
    return `<section class="sr-panel sr-customers-panel" aria-labelledby="sr-customers-title"><div class="sr-panel-head"><div><h2 id="sr-customers-title">Kunder & avtal</h2><p>Se kundens elavtal och vem som har sålt det.</p></div><div class="sr-list-tabs" role="group" aria-label="Välj kundlista">${[['period', 'Periodens avtal'], ['active', 'Aktiva kunder']].map(([key, label]) => `<button type="button" data-sr-list="${key}" aria-pressed="${list === key}" class="${list === key ? 'selected' : ''}">${label}</button>`).join('')}</div></div><div class="sr-list-controls"><label class="sr-search" for="sr-search">${P.icon('search')}<span class="sr-only">Sök i kundlistan</span><input id="sr-search" type="search" value="${e(current.query)}" placeholder="Sök kund, avtal eller säljare" maxlength="120" autocomplete="off"></label><label class="sr-list-status" for="sr-status"><span>Status i listan</span><select id="sr-status"${list === 'active' ? ' disabled' : ''}>${[['all', 'Alla statusar'], ['active', 'Aktiv'], ['pending', 'Väntar på start'], ['ended', 'Avslutad'], ['cancelled', 'Bortfall före start']].map(([key, text]) => `<option value="${key}"${(list === 'active' ? 'active' : current.status) === key ? ' selected' : ''}>${text}</option>`).join('')}</select></label></div><p class="sr-list-note">Sökning och status filtrerar kundlistan. Nyckeltalen ovan följer rapportfiltren.</p><div id="sr-table-content">${tableMarkup()}</div></section>`;
  }
  function report() {
    if (!allowed()) return guard();
    ensureContext();
    if (!D()) return '<div class="empty">Rapportunderlaget förbereds.</div>';
    if (!hasUnderlag()) return missingData(false, D().available !== false);
    const result = D().summary(metricsFilters());
    return `<div class="savera-reports partner-sales-reports">${heading()}${filterBar()}${selectionNote(result.period)}<section class="sr-metrics" aria-label="Partnerns nyckeltal">${metric('agreements', 'Nya avtal', number(result.agreements), 'Tecknade under vald period', 'file')}${metric('annualMWh', 'Avtalad årsvolym', `${number(result.annualMWh, 0)} MWh`, 'Årsvolym för periodens nya avtal', 'bolt')}${metric('activeCount', 'Aktiva kunder', number(result.activeCount), `Hos oss ${date(result.period.observedEnd)}`, 'users', true)}</section>${customerTable()}${P.role==='internal'?`<div class="sr-footer-links"><span>${P.icon('money')} Kickback följs i ett separat underlag.</span><button type="button" class="text-button" data-sr-kickback>Öppna ${e(partner()?.name || 'partnerns')} kickback ${P.icon('arrow')}</button></div>`:''}${definitions(false)}</div>`;
  }
  function missingData(insights, missingSegment = false) {
    const configuredProducts = D()?.productsFor?.(missingSegment ? current.segment : 'all') || D()?.products || [];
    const metrics = insights ? '' : `<section class="sr-metrics" aria-label="Partnerns nyckeltal">${metric('agreements', 'Nya avtal', '—', 'Rapportunderlag saknas', 'file')}${metric('annualMWh', 'Avtalad årsvolym', '—', 'Rapportunderlag saknas', 'bolt')}${metric('activeCount', 'Aktiva kunder', '—', 'Rapportunderlag saknas', 'users')}</section>`;
    return `<div class="savera-reports partner-sales-reports${insights ? ' savera-insights' : ''}">${heading(insights)}${missingSegment ? `${filterBar()}${selectionNote(D().period(current))}` : ''}${metrics}<section class="sr-panel sr-data-missing"><div class="sr-missing-icon">${P.icon(insights ? 'chart' : 'users')}</div><h2>${missingSegment ? `Underlag saknas för ${e(segmentLabel(current.segment).toLocaleLowerCase('sv-SE'))}` : insights ? 'Insikter börjar med ett underlag' : 'Redo att följa partnerns försäljning'}</h2><p>${missingSegment ? 'Kundsegmentet är valt för partnern. Avtal och kundhistorik saknas ännu för detta segment. Välj alla kunder för att se det underlag som finns.' : 'Partnern är skapad. Avtal och kundhistorik behöver finnas innan vi kan visa resultat, kundtid eller prognoser.'}</p><span class="sr-missing-tag">Underlag saknas</span><div class="sr-configured-products"><h3>${missingSegment ? `${e(segmentLabel(current.segment))} · elavtal` : 'Partnerns elavtal'}</h3><div>${configuredProducts.map(product => `<span>${e(product)}</span>`).join('')}</div></div>${P.role==='internal'?'<button type="button" class="btn btn-secondary" data-sr-configure>Visa partnerinställningar</button>':''}</section></div>`;
  }
  function productChart(result) {
    const rows = result.products.slice().sort((a, b) => b.agreements - a.agreements || a.product.localeCompare(b.product, 'sv-SE'));
    const max = Math.max(1, ...rows.map(item => item.agreements));
    return `<section class="sr-panel sr-popularity" aria-labelledby="sr-popularity-title"><div class="sr-panel-head"><div><h2 id="sr-popularity-title">Mest valda elavtal</h2><p>Antal nya avtal i vald period.</p></div><span class="sr-panel-tag">${number(rows.reduce((total, row) => total + row.agreements, 0))} avtal</span></div>${rows.some(row => row.agreements) ? `<div class="sr-product-chart">${rows.map(row => `<div class="sr-product-row" data-sr-product="${e(row.product)}"><div><strong>${e(row.product)}</strong><span>${number(row.agreements)} avtal <small>· ${number(row.share * (row.share <= 1 ? 100 : 1), 1)} %</small></span></div><div class="sr-product-track" aria-hidden="true"><span style="width:${row.agreements / max * 100}%"></span></div><small>${number(row.annualMWh, 0)} MWh avtalad årsvolym</small></div>`).join('')}</div>` : '<div class="sr-empty sr-empty-compact"><p>Inga nya avtal i det valda urvalet.</p></div>'}</section>`;
  }
  function trendChart(result) {
    let rows = result.trend;
    const lastObserved = result.period.observedEnd;
    const observedMonth = lastObserved?.slice(0, 7);
    const observedDay = lastObserved ? Number(lastObserved.slice(8)) : 0;
    const completeMonthDays = lastObserved ? new Date(Date.UTC(Number(lastObserved.slice(0, 4)), Number(lastObserved.slice(5, 7)), 0)).getUTCDate() : 0;
    const partialMonth = current.mode === 'year' && observedDay < completeMonthDays;
    if (partialMonth) rows = rows.map(row => row.date.startsWith(observedMonth) ? {...row, label: `${row.label} 1–${observedDay}`} : row);
    if (current.mode === 'month' && rows.length > 14) {
      const grouped = [];
      for (let start = 0; start < rows.length; start += 7) {
        const group = rows.slice(start, start + 7);
        grouped.push({date: group[0].date, label: `${group[0].label}–${group[group.length - 1].label}`, agreements: group.reduce((sum, row) => sum + row.agreements, 0), annualMWh: group.reduce((sum, row) => sum + row.annualMWh, 0)});
      }
      rows = grouped;
    }
    const max = Math.max(1, ...rows.map(row => row.agreements));
    const valueRows = rows.map(row => `<tr><th scope="row">${e(row.label)}</th><td>${number(row.agreements)}</td><td>${number(row.annualMWh, 0)}</td></tr>`).join('');
    return `<section class="sr-panel sr-trend" aria-labelledby="sr-trend-title"><div class="sr-panel-head"><div><h2 id="sr-trend-title">Försäljning över tid</h2><p>Nya avtal under ${e(result.period.label.toLocaleLowerCase('sv-SE'))}.</p></div><span class="sr-panel-tag">Avtal</span></div><div class="sr-trend-chart" aria-label="Antal nya avtal över tid">${rows.map(row => `<div class="sr-trend-bar" title="${e(row.label)}: ${number(row.agreements)} avtal, ${number(row.annualMWh)} MWh årsvolym"><strong>${number(row.agreements)}</strong><div class="sr-trend-track"><span style="height:${row.agreements ? Math.max(3, row.agreements / max * 100) : 0}%"></span></div><span>${e(row.label)}</span></div>`).join('') || '<p class="sr-no-data">Inget observerat utfall i perioden.</p>'}</div>${partialMonth ? `<p class="sr-trend-note">Sista månaden visar endast 1–${observedDay} ${e(new Date(`${lastObserved}T12:00:00Z`).toLocaleDateString('sv-SE', {month: 'long', timeZone: 'UTC'}))}.</p>` : ''}<details class="sr-chart-data"><summary>Visa diagrammets siffror</summary><table><caption class="sr-only">Diagramvärden för periodens försäljning</caption><thead><tr><th scope="col">Period</th><th scope="col">Nya avtal</th><th scope="col">Årsvolym MWh</th></tr></thead><tbody>${valueRows}</tbody></table></details></section>`;
  }
  function tenureCard(group, active, period) {
    return `<div class="sr-tenure-${active ? 'active' : 'completed'}"><span>${P.icon(active ? 'users' : 'clock')} ${active ? 'Kunder aktiva vid periodslut' : 'Kunder som lämnade under perioden'}</span><strong>${group.count ? `${number(group.averageMonths, 1)} <small>mån</small>` : '—'}</strong><h3>${active ? 'Genomsnittlig tid hittills' : 'Genomsnittlig avslutad kundtid'}</h3><p>${active ? `Från avtalsstart till ${e(date(period.observedEnd))}. Kunderna är fortfarande aktiva.` : 'Från avtalsstart till avslut, för kunder som lämnade under vald period.'}</p><small>${number(group.count)} ${active ? 'aktiva kunder i urvalet' : 'avslutade kunder i urvalet'}${!group.count ? ' · inget genomsnitt att visa' : ''}</small></div>`;
  }
  function projectionCard(result) {
    if (!result?.valid) return `<section class="sr-projection sr-projection-empty" aria-labelledby="sr-projection-title"><span class="sr-eyebrow">PROGNOS / ${e(partner()?.name || 'PARTNER')}</span><h2 id="sr-projection-title">Om takten håller i sig</h2><p>Välj en period med observerade avtal för att se en prognos.</p><small>Prognosen räknas från fiktivt utfall, aldrig från registrerade kunddialoger.</small></section>`;
    return `<section class="sr-projection" aria-labelledby="sr-projection-title"><div class="sr-projection-heading"><span class="sr-eyebrow">PROGNOS / ${e(date(result.horizon))}</span><span class="sr-projection-tag">Vid samma försäljningstakt</span></div><h2 id="sr-projection-title">Om takten håller i sig</h2><div class="sr-projection-values"><div><strong>≈ ${number(result.forecastAgreements, 0)}</strong><span>nya avtal under helåret 2026</span></div><div><strong>≈ ${number(result.forecastAnnualMWh, 0)}</strong><span>MWh avtalad årsvolym</span></div></div><div class="sr-projection-baseline"><span><strong>${number(result.yearToDateAgreements)}</strong> avtal hittills i år</span>${P.icon('arrow')}<span><strong>≈ ${number(result.forecastAdditionalAgreements, 0)}</strong> till under årets återstående ${number(result.remainingDays)} dagar</span></div><p class="sr-projection-note">Takten bygger på ${number(result.basisAgreements)} avtal under ${number(result.basisDays)} observerade dagar (${e(date(result.basisStart))}–${e(date(result.basisEnd))}). Årsutfall till ${e(date(result.asOf))} plus samma dagstakt till årets slut.</p><small>En enkel prognos vid oförändrad takt. Säsong, kommande kampanjer och kundbortfall är inte inräknade.</small></section>`;
  }
  function insights() {
    if (!allowed()) return guard();
    ensureContext();
    if (!D()) return '<div class="empty">Rapportunderlaget förbereds.</div>';
    if (!hasUnderlag()) return missingData(true, D().available !== false);
    const filters = metricsFilters(), result = D().insights(filters), forecast = D().projection(filters);
    return `<div class="savera-reports partner-sales-reports savera-insights">${heading(true)}${filterBar()}${selectionNote(result.period)}<section class="sr-panel sr-tenure" aria-labelledby="sr-tenure-title"><div class="sr-panel-head"><div><h2 id="sr-tenure-title">Hur länge stannar kunderna?</h2><p>Avslutad kundtid och tid hittills följs var för sig.</p></div></div><div class="sr-tenure-grid">${tenureCard(result.completed, false, result.period)}${tenureCard(result.active, true, result.period)}</div></section>${attrition(result)}<div class="sr-insights-grid">${productChart(result)}${trendChart(result)}</div>${projectionCard(forecast)}${definitions(true)}</div>`;
  }
  function attrition(result) {
    const churn = result.churn || {}, dropout = result.dropout || {};
    const rate = value => value === null || value === undefined ? '—' : `${number(value * 100, 1)} %`;
    return `<section class="sr-attrition" aria-label="Churn och bortfall"><article class="sr-panel sr-attrition-card" data-sr-attrition="churn"><div class="sr-attrition-head"><span>${P.icon('users')} Efter avtalsstart</span><span class="sr-attrition-label">Kundbas vid periodstart</span></div><strong class="sr-attrition-rate">${e(rate(churn.rate))}</strong><h2>Churn efter start</h2><p>${number(churn.exits || 0)} av ${number(churn.openingCustomers || 0)} kunder som var aktiva vid periodens början lämnade under perioden.</p><small>${churn.openingCustomers ? `${date(churn.periodStart || result.period.observedStart)}–${date(churn.periodEnd || result.period.observedEnd)}. Nya kunder under perioden ingår inte i nämnaren.` : 'Ingen aktiv kundbas vid periodens början i detta urval.'}</small></article><article class="sr-panel sr-attrition-card" data-sr-attrition="dropout"><div class="sr-attrition-head"><span>${P.icon('file')} Före avtalsstart</span><span class="sr-attrition-label">Periodens tecknade avtal</span></div><strong class="sr-attrition-rate">${e(rate(dropout.rate))}</strong><h2>Bortfall före start</h2><p>${number(dropout.cancelled || 0)} av ${number(dropout.agreements || 0)} avtal tecknade under perioden föll bort före avtalsstart.</p><small>Observerat till ${date(dropout.observedThrough || result.period.observedEnd)}. Avtal som fortfarande väntar på start kan ännu förändras.</small></article></section>`;
  }
  function definitions(insights) {
    return `<details class="sr-definitions"><summary>${P.icon('help')} Så räknar vi</summary><div><p><strong>Nya avtal:</strong> tecknade under den valda försäljningsperioden. Ett senare bortfall ändrar kundens status men gör inte teckningshändelsen osynlig. <strong>Årsvolym:</strong> avtalad årlig volym för dessa avtal, inte levererad el under perioden.</p><p><strong>Aktiva kunder:</strong> kunder med ett påbörjat avtal som ännu inte avslutats vid periodens observationsdatum. De kan ha kommit via partnern före vald period. Avtal som väntar på start eller faller bort före start räknas inte som aktiva.</p>${insights ? '<p><strong>Kundtid:</strong> avslutad kundtid beräknas från avtalsstart till avslut för kunder som lämnade under vald period, inklusive kunder från tidigare år. Aktiva kunders ålder räknas separat till periodens observationsdatum. Den visar hur länge de hittills stannat, inte deras slutliga livslängd.</p><p><strong>Churn efter start:</strong> den kundbas som var aktiv vid periodens början och lämnade under perioden, delad med hela den aktiva kundbasen vid periodens början. Nya kunder under perioden ingår inte i detta mått. <strong>Bortfall före start:</strong> periodens tecknade avtal som fallit bort före start, delat med periodens tecknade avtal. Båda måtten följer rapportfiltren och observeras till periodens observationsdatum.</p><p><strong>Prognos:</strong> valt urvals nya avtal och årsvolym per observerad kalenderdag, extrapolerat från 7 oktober till 31 december 2026 och adderat till samma urvals årsutfall hittills. Välj en tidigare månad för att jämföra en annan försäljningstakt. Detta är ett villkorat räkneexempel, inte en garanti eller en prognos för antalet aktiva kunder.</p>' : ''}<p><strong>Exempeldata:</strong> ett separat, fiktivt avtalsregister till 7 oktober 2026 med en äldre ingående kundbas. Det ändrar inga kunddialoger, inflyttningsärenden, ekonomiska exempel eller kickback. Kickbackposter har egen underlagsperiod och påverkas inte av rapportens kundsegment-, produkt- eller säljarfilter. Nyskapade partners visas utan utfall tills underlag finns.</p></div></details>`;
  }
  function guard() { return '<div class="empty"><h2>Välj Kraftringens vy</h2><p>Den här uppföljningen finns i den interna demovyn.</p><button type="button" class="btn btn-secondary" data-go="overview">Till din översikt</button></div>'; }
  function bindTable() {
    document.querySelectorAll('[data-sr-page]').forEach(button => button.addEventListener('click', () => {
      const desired = Number(button.dataset.srPage); if (!Number.isInteger(desired) || desired < 1) return;
      const direction = desired > page ? 1 : -1;
      page = desired; updateTable(); document.getElementById('sr-table-count')?.scrollIntoView({block: 'nearest'});
      const sameDirection = document.querySelector(`[data-sr-page="${page + direction}"]`);
      const oppositeDirection = document.querySelector(`[data-sr-page="${page - direction}"]`);
      if (sameDirection && !sameDirection.disabled) sameDirection.focus();
      else if (oppositeDirection && !oppositeDirection.disabled) oppositeDirection.focus();
      else document.getElementById('sr-table-count')?.focus();
    }));
    document.querySelector('[data-sr-clear-table]')?.addEventListener('click', () => {
      current.query = ''; current.status = 'all'; page = 1; save(); repaint('sr-search');
    });
  }
  function updateTable() {
    const content = document.getElementById('sr-table-content');
    if (!content || !['partner-sales', 'savera'].includes(P.page) || !allowed()) return;
    content.innerHTML = tableMarkup(); bindTable();
    const reset = document.getElementById('sr-reset');
    if (reset) reset.disabled = !(['segment', 'product', 'seller', 'region'].some(key => current[key] !== 'all') || current.query || current.status !== 'all');
  }
  function bind() {
    if (!allowed() || !D()) return;
    document.getElementById('sr-filter-toggle')?.addEventListener('click', () => {
      filtersExpanded = !filtersExpanded;
      repaint('sr-filter-toggle');
    });
    document.querySelector('.sr-more-filters')?.addEventListener('toggle', event => {if (!event.currentTarget.isConnected) return; moreFiltersOpen = event.currentTarget.open; save();});
    (P.role==='internal'?document.querySelectorAll('[data-sr-configure]'):[]).forEach(button => button.addEventListener('click', () => P.partnerSetup?.open(partnerId())));
    document.querySelectorAll('[data-sr-segment]').forEach(button => button.addEventListener('click', () => {
      const segment = button.dataset.srSegment;
      setFilters({segment}, false); repaint();
      document.querySelector(`[data-sr-segment="${segment}"]`)?.focus();
    }));
    document.querySelectorAll('[data-sr-mode]').forEach(button => button.addEventListener('click', () => {
      const mode = button.dataset.srMode;
      if (!['year', 'month', 'week'].includes(mode)) return;
      const selectedDate = D().period(current).observedEnd || D().cutoff || '2026-10-07';
      const match = options(mode).find(option => {
        const period = D().period({...current, mode, value: option.value});
        return period.start <= selectedDate && period.end >= selectedDate;
      });
      setFilters({mode, value: match?.value || options(mode).slice(-1)[0]?.value}, false);
      repaint(); document.querySelector(`[data-sr-mode="${mode}"]`)?.focus();
    }));
    document.querySelectorAll('[data-sr-filter]').forEach(select => select.addEventListener('change', () => {
      const key = select.dataset.srFilter === 'period' ? 'value' : select.dataset.srFilter;
      setFilters({[key]: select.value}, false); repaint(select.id);
    }));
    document.getElementById('sr-reset')?.addEventListener('click', () => {
      moreFiltersOpen = false; setFilters({segment: 'all', product: 'all', seller: 'all', region: 'all', query: '', status: 'all'}, false); repaint('sr-product');
    });
    document.querySelectorAll('[data-sr-list]').forEach(button => button.addEventListener('click', () => {
      setListMode(button.dataset.srList, false); repaint();
      document.querySelector(`.sr-list-tabs [data-sr-list="${list}"]`)?.focus();
    }));
    document.getElementById('sr-search')?.addEventListener('input', event => {
      current.query = event.target.value.slice(0, 120); page = 1; save(); updateTable();
    });
    document.getElementById('sr-status')?.addEventListener('change', event => {
      current.status = event.target.value; page = 1; save(); updateTable();
    });
    document.querySelector('[data-sr-kickback]')?.addEventListener('click', () => {
      if(P.role!=='internal')return;
      if (typeof P.kickback?.selectPartner === 'function') P.kickback.selectPartner(partnerId());
      else if (typeof P.partnerKickback?.selectPartner === 'function') P.partnerKickback.selectPartner(partnerId());
      else P.go('kickback');
    });
    bindTable();
  }
  P.partnerSalesReports = {filters: () => {ensureContext(); return {...current};}, setFilters, reset: () => {ensureContext(); current = validFilters(defaultFilters()); list = 'period'; page = 1; moreFiltersOpen = false; save(); repaint();}, listMode: () => {ensureContext(); return list;}, setListMode, get storageKey() {return storageKey();}};
  P.saveraReports = P.partnerSalesReports;
  P.register('partner-sales', {render: report, bind});
  P.register('partner-insights', {render: insights, bind});
  P.register('savera', {render: report, bind});
  P.register('insikter', {render: insights, bind});
})();
