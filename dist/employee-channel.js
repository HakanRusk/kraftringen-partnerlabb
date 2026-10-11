(() => {
  'use strict';
  const P = window.Portal;
  if (!P) return;
  const e = P.e;
  const current = () => P.getPartner(P.role === 'partner' ? P.partner : P.selectedPartnerId);
  function render() {
    const partner = current();
    if (partner?.type !== 'employee') return '<div class="empty">Välj en partner med personalavtal.</div>';
    const internal = P.role === 'internal';
    const actions = internal
      ? `<button class="btn btn-secondary" data-employee-settings>${P.icon('edit')} Partnerinställningar</button><button class="btn btn-primary" data-employee-preview>Öppna arbetsytan ${P.icon('arrow')}</button>`
      : `<button class="btn btn-secondary" data-go="support">${P.icon('headphones')} Hjälp & support</button>`;
    return `<div class="commercial-page employee-channel">
      ${internal ? '<button class="text-button" data-go="partners">← Alla partners</button>' : ''}
      <div class="page-head"><div><span class="eyebrow">${internal ? 'KRAFTRINGEN / PARTNERS' : 'PARTNERARBETSYTA'}</span><h1>${e(partner.name)}</h1><p class="muted">Personalavtal för företag</p></div><div class="employee-actions">${actions}</div></div>
      <section class="employee-hero"><div><span class="employee-badge">${P.icon('users')} PERSONALAVTAL</span><h2>Ett erbjudande för era medarbetare.</h2><p>En egen samarbetsyta för företag som vill erbjuda personalavtal. Företagets egen elförbrukning följs som en separat affär.</p></div><span class="employee-hero-icon" aria-hidden="true">${P.icon('users')}</span></section>
      <div class="employee-metrics">${[['Avtal','file'],['Aktiva kunder','users'],['Kickback','money']].map(([label,icon]) => `<article class="card employee-metric" data-employee-metric><span class="employee-metric-icon">${P.icon(icon)}</span><span>${label}</span><strong>—</strong><small>Underlag saknas</small></article>`).join('')}</div>
      <section class="card employee-readiness"><div class="panel-heading"><div><span class="eyebrow">SAMARBETETS NÄSTA STEG</span><h2>Partnern är upplagd.</h2></div><span class="pill">Personalavtal</span></div><p>Erbjudandet och arbetssättet behöver beskrivas innan kundflödet kan öppnas.</p><div class="employee-next"><div><span>01</span><div><strong>Beskriv erbjudandet</strong><p>Vilka elavtal och villkor ska ingå för medarbetarna?</p></div></div><div><span>02</span><div><strong>Bestäm arbetssättet</strong><p>Hur ska erbjudandet förmedlas och ett valt avtal hanteras?</p></div></div><div><span>03</span><div><strong>Följ kunder och kickback</strong><p>Resultat visas när verifierat kund- och ersättningsunderlag finns.</p></div></div></div>
      ${internal ? '<div class="detail-actions"><button class="btn btn-secondary" data-employee-kickback>Kickback & underlag</button><button class="text-button" data-employee-journey>Öppna partnerresan →</button></div>' : ''}</section>
    </div>`;
  }
  function bind() {
    const partner = current();
    if (P.role !== 'internal' || partner?.type !== 'employee') return;
    document.querySelector('[data-employee-settings]')?.addEventListener('click', () => P.partnerSetup.open(partner.id));
    document.querySelector('[data-employee-preview]')?.addEventListener('click', () => P.previewPartner(partner.id));
    document.querySelector('[data-employee-kickback]')?.addEventListener('click', () => P.partnerKickback.selectPartner(partner.id));
    document.querySelector('[data-employee-journey]')?.addEventListener('click', () => P.commercial.selectPartner(partner.id, 'journey'));
  }
  P.employeeChannel = { render, bind };
  P.register('employee-channel', {render, bind});
  P.register('employee-overview', {render, bind});
})();
