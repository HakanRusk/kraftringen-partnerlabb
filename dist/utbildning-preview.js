'use strict';
(() => {
  const $ = id => document.getElementById(id);
  const el = (tag, text, className) => { const n = document.createElement(tag); if (text !== undefined) n.textContent = text; if (className) n.className = className; return n; };
  const list = values => { const n = el('ul'); values.forEach(value => n.append(el('li', value))); return n; };
  const nf = new Intl.NumberFormat('sv-SE', { maximumFractionDigits: 2 });
  const shared = ['kvartspris', 'rorligt-pris', 'fastpris'];
  const trackIds = { all: null, shared, savera: [...shared, 'individuell-indexportfolj', 'pool-trygg', 'pool-offensiv', 'kraftringen-direkt', 'kraftringen-stabil'], face2face: [...shared, 'opti', 'vintersakrat'] };
  const tabs = Array.from(document.querySelectorAll('[role=tab]'));
  function switchTab(id, focus = false) {
    tabs.forEach(tab => { const active = tab.getAttribute('aria-controls') === id; tab.setAttribute('aria-selected', String(active)); tab.tabIndex = active ? 0 : -1; $(tab.getAttribute('aria-controls')).hidden = !active; if (active && focus) tab.focus(); });
  }
  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => switchTab(tab.getAttribute('aria-controls')));
    tab.addEventListener('keydown', event => { let next; if (event.key === 'ArrowRight') next = (i + 1) % tabs.length; if (event.key === 'ArrowLeft') next = (i + tabs.length - 1) % tabs.length; if (event.key === 'Home') next = 0; if (event.key === 'End') next = tabs.length - 1; if (next !== undefined) { event.preventDefault(); switchTab(tabs[next].getAttribute('aria-controls'), true); } });
  });
  const labels = { reference: 'Prisreferens', profile_treatment: 'Förbrukningsprofil', other_components: 'Övriga kostnader', comparison_rule: 'Så görs jämförelsen', winter: 'Vinterdelen', summer: 'Sommardelen', calendar_rule: 'Perioderna', volume_basis: 'Volymunderlag', annual_weighting: 'Årets förbrukningsvägda pris', fixed_common_components: 'Gemensamma säkrade komponenter', fixed_common_scope: 'Vad det gemensamma priset omfattar', monthly_profile: 'Månadsprofil', daily_profile: 'Dygnsprofil', unsecured_volume: 'Osäkrad volym', changed_actual_profile_rule: 'Ändrad faktisk månadsprofil', limit: 'Prisets omfattning', secured_components: 'Säkrade komponenter', purchase_pattern: 'Inköpsmodell', standard_horizon_months: 'Standardhorisont, månader', optional_horizon_months: 'Valbara horisonter, månader', hedge_share: 'Säkringsgrad', horizon_rule: 'Säkringshorisont och avtal', index_percent: 'Indexdel, procent', variable_percent: 'Rörlig del, procent', active_percent: 'Aktiv del, procent', actual_positions_rule: 'Plan och genomförda köp', active_part_rule: 'Den aktiva delen', current_mandate: 'Mandat', described_standard_forecast_share_percent: 'Beskriven standardandel av volymunderlaget, procent', volume_rule: 'Vilken volym gäller andelen?' };
  function definition(data) { const dl = el('dl'); Object.entries(data).forEach(([key, value]) => { if (value === null || value === undefined) return; dl.append(el('dt', labels[key] || key), el('dd', Array.isArray(value) ? value.join(', ') : String(value))); }); return dl; }
  function productCard(p) {
    const card = el('details', undefined, 'product-card'); card.dataset.product = p.id;
    const summary = el('summary'), title = el('div'); title.append(el('h3', p.name), el('p', p.customer_promise)); summary.append(title, el('span', '+', 'expand-symbol')); summary.lastChild.setAttribute('aria-hidden', 'true'); card.append(summary);
    const body = el('div', undefined, 'product-body'); body.append(el('p', p.core_model, 'product-model'));
    const columns = el('div', undefined, 'product-columns'), left = el('div'), right = el('div');
    left.append(el('h4', 'Vad ingår i priset?'), definition(p.price_scope)); if (p.strategy) left.append(el('h4', 'Inköp och strategi'), definition(p.strategy));
    right.append(el('h4', 'Vilka risker finns kvar?'), list(p.risks), el('h4', 'Kundbehov att undersöka'), list(p.customer_needs), el('h4', 'Frågor i kunddialogen'), list(p.customer_questions)); columns.append(left, right); body.append(columns);
    if (p.source_examples.length) { body.append(el('h4', 'Räkneexempel')); p.source_examples.forEach(example => { const box = el('div', undefined, 'product-example'); box.append(el('p', 'Syntetiskt undervisningsexempel · inte en offert', 'eyebrow'), el('p', example.scope), list(example.calculations)); body.append(box); }); }
    else if (p.example_note) body.append(el('p', p.example_note, 'small'));
    body.append(el('h4', 'Kontrollera i aktuell offert'), list(p.contract_details_to_lookup), el('p', 'Källa: produktspecifikationen, sidor ' + p.source_page_range.join('–') + '.', 'source-ref')); card.append(body); return card;
  }
  function renderTrack(blueprint, name) {
    const b2b = name === 'savera', track = b2b ? blueprint.savera_b2b : blueprint.face2face_b2c, box = $('track-content'); box.replaceChildren();
    box.append(el('h3', b2b ? 'Savera · Förstå företagets elaffär' : 'Face2face · Förklara valet för privatkunden'));
    const layout = el('div', undefined, 'track-layout'), products = el('div'), practice = el('div'); products.append(el('h4', 'Produktlektioner'));
    const pills = el('div', undefined, 'lesson-pills'); [...blueprint.shared_product_lessons, ...track.product_lessons].forEach(p => pills.append(el('span', p.title, 'lesson-pill'))); products.append(pills);
    if (b2b) products.append(el('h4', 'Fördjupning'), list(track.advanced_lessons));
    practice.append(el('h4', 'Träna på kunddialogen'), el('p', track.practice), el('h4', 'Visa vad du kan'), el('p', track.assessment));
    const cta = el('button', 'Utforska produktbiblioteket', 'text-button'); cta.type = 'button'; cta.addEventListener('click', () => { $('product-track').value = name; $('product-track').dispatchEvent(new Event('change')); switchTab('library', true); }); practice.append(cta); layout.append(products, practice); box.append(layout);
  }
  function renderQuiz(questions) {
    questions.forEach((q, i) => {
      const card = el('div', undefined, 'quiz-card'), form = el('form'), title = `${i + 1}. ${q.prompt}`, facit = el('div', undefined, 'quiz-facit'); facit.id = 'facit-' + i; facit.hidden = true;
      let field, options;
      if (q.options) { field = el('fieldset'); field.append(el('legend', title)); options = [];
        q.options.forEach(option => { const label = el('label', undefined, 'answer-option'), input = el('input'); input.type = 'radio'; input.name = 'question-' + i; input.value = option.id; input.required = true; options.push(input); label.append(input, el('span', option.text)); field.append(label); }); form.append(field);
      } else { form.append(el('h4', title)); const label = el('label', q.expected_numeric_answer !== undefined ? `Ditt svar (${q.answer_unit})` : 'Din kundförklaring'); label.htmlFor = 'answer-' + i; field = el(q.expected_numeric_answer !== undefined ? 'input' : 'textarea'); field.id = 'answer-' + i; field.required = true; if (q.expected_numeric_answer !== undefined) { field.type = 'number'; field.step = 'any'; } form.append(label, field); if (q.expected_numeric_answer !== undefined) { const reasonLabel = el('label', 'Förklara hur du tänker'); reasonLabel.htmlFor = 'reason-' + i; const reason = el('textarea'); reason.id = reasonLabel.htmlFor; form.append(reasonLabel, reason); } }
      const submit = el('button', 'Visa facit och förklaring', 'primary'); submit.type = 'submit'; submit.setAttribute('aria-controls', facit.id); submit.setAttribute('aria-expanded', 'false'); form.append(submit);
      form.addEventListener('submit', event => { event.preventDefault(); facit.replaceChildren(); let feedback;
        if (options) feedback = options.find(option => option.checked)?.value === q.correct_option_id ? 'Rätt svar.' : 'Läs förklaringen och jämför med ditt val.';
        else if (q.expected_numeric_answer !== undefined) feedback = Math.abs(Number(field.value) - q.expected_numeric_answer) < 0.01 ? 'Beräkningen stämmer.' : 'Jämför din beräkning med facit nedan.';
        else feedback = 'Jämför din kundförklaring med bedömningsstödet.';
        facit.append(el('p', feedback, 'quiz-feedback'), el('p', q.facit)); if (q.rubric) facit.append(el('p', 'Kontrollera att ditt svar tar upp:'), list(q.rubric)); facit.hidden = false; submit.setAttribute('aria-expanded', 'true'); submit.textContent = 'Visa facit igen';
      }); card.append(form, facit); $('quiz').append(card);
    });
  }
  function calculate(event) {
    if (event) event.preventDefault();
    const volume = [Number($('winter-volume').value), Number($('summer-volume').value)], price = [Number($('winter-price').value), Number($('summer-price').value)], total = volume[0] + volume[1];
    if (!volume.every(Number.isFinite) || !price.every(Number.isFinite) || !Number.isFinite(total) || volume.some(v => v < 0) || total <= 0) { $('weighted-price').textContent = 'Kontrollera värdena'; $('weighted-cost').textContent = 'Ange giltiga prisnivåer och volymer. Volymerna ska vara minst noll och tillsammans större än noll.'; $('weighted-insight').textContent = ''; return; }
    const cost = (volume[0] * price[0] + volume[1] * price[1]) / 100, weighted = cost / total * 100, mean = (price[0] + price[1]) / 2;
    if (![cost, weighted, mean].every(Number.isFinite)) { $('weighted-price').textContent = 'Kontrollera värdena'; $('weighted-cost').textContent = 'Värdena är för stora för att beräkningen ska kunna visas. Ange mindre volymer eller prisnivåer.'; $('weighted-insight').textContent = ''; return; }
    $('weighted-price').replaceChildren(document.createTextNode(nf.format(weighted) + ' '), el('small', 'öre/kWh'));
    $('weighted-cost').textContent = `${nf.format(cost)} kr för ${nf.format(total)} kWh på den omfattade komponenten.`;
    $('weighted-insight').textContent = `Ett oviktat medelvärde blir ${nf.format(mean)} öre/kWh. Det förbrukningsvägda priset ger varje period vikt efter dess kWh. Vid samma omfattade volymer förändrar utjämningen inte totalkostnaden.`;
  }
  fetch('./utbildning-preview-data.json', { credentials: 'same-origin' }).then(response => { if (!response.ok) throw new Error('Innehållet kunde inte hämtas.'); return response.json(); }).then(data => {
    const { blueprint, catalog, lesson } = data;
    blueprint.shared_foundation.forEach((chapter, i) => { const card = el('div', undefined, 'foundation-card'); card.append(el('span', '0' + (i + 1), 'chapter-number'), el('h3', chapter.title), el('p', chapter.practice)); $('foundation').append(card); });
    renderTrack(blueprint, 'savera'); document.querySelectorAll('[data-track]').forEach(button => button.addEventListener('click', () => { document.querySelectorAll('[data-track]').forEach(other => { const active = other === button; other.classList.toggle('active', active); other.setAttribute('aria-pressed', String(active)); }); renderTrack(blueprint, button.dataset.track); }));
    const cards = catalog.products.map(p => ({ data: p, element: productCard(p), search: JSON.stringify(p).toLocaleLowerCase('sv-SE') })); cards.forEach(card => $('products').append(card.element));
    function filter() { const query = $('product-search').value.trim().toLocaleLowerCase('sv-SE'), ids = trackIds[$('product-track').value]; let count = 0; cards.forEach(card => { const show = (!ids || ids.includes(card.data.id)) && (!query || card.search.includes(query)); card.element.hidden = !show; if (show) count++; }); $('product-count').textContent = `${count} av ${cards.length} produkter visas${count ? '.' : '. Prova ett annat sökord eller spår.'}`; }
    $('product-search').addEventListener('input', filter); $('product-track').addEventListener('change', filter); filter();
    $('customer-explanation').textContent = lesson.customer_explanation.short;
    const header = el('div', undefined, 'comparison-row comparison-header'); ['Fråga', 'Kraftringen Direkt', 'Kraftringen Stabil'].forEach(text => header.append(el('div', text))); $('comparison').append(header);
    lesson.comparison.rows.forEach(row => { const n = el('div', undefined, 'comparison-row'); n.append(el('div', row.question)); [['Direkt', row.direkt], ['Stabil', row.stabil]].forEach(([name, text]) => { const cell = el('div'); cell.append(el('span', name, 'mobile-label'), document.createTextNode(text)); n.append(cell); }); $('comparison').append(n); });
    $('calculator-scope').textContent = 'Syntetiskt undervisningsexempel. ' + lesson.worked_example.scope;
    $('weighted-form').addEventListener('submit', calculate); calculate(); renderQuiz(lesson.assessment.questions);
    lesson.narration_segments.forEach((segment, i) => { const card = el('details', undefined, 'narration-card'), summary = el('summary'); summary.append(el('span', String(i + 1).padStart(2, '0'), 'chapter-number'), el('span', segment.title), el('span', '+', 'expand-symbol')); summary.lastChild.setAttribute('aria-hidden', 'true'); const body = el('div', undefined, 'narration-body'); body.append(el('h4', 'Arthur · berättartext, manusutkast'), el('p', segment.narration), el('h4', 'Text i bild'), list(segment.on_screen), el('p', 'Bildidé: ' + segment.visual_direction, 'direction')); card.append(summary, body); $('narration').append(card); });
    $('load-status').hidden = true;
  }).catch(error => { $('load-status').textContent = 'Utbildningsinnehållet kunde inte hämtas. Ladda om sidan eller öppna produktunderlaget längst ned.'; });
})();
