(() => {
  'use strict';
  const $ = (selector, within = document) => within.querySelector(selector);
  const $$ = (selector, within = document) => [...within.querySelectorAll(selector)];
  const escape = value => String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
  const list = value => Array.isArray(value) ? value : [];
  const paragraphs = value => (Array.isArray(value) ? value : String(value ?? '').split(/\n\s*\n/)).filter(Boolean).map(text => `<p>${escape(text)}</p>`).join('');
  const bullets = value => list(value).length ? `<ul>${list(value).map(text => `<li>${escape(text)}</li>`).join('')}</ul>` : '';
  const number = (value, digits = 2) => new Intl.NumberFormat('sv-SE', { maximumFractionDigits: digits }).format(value);
  const trackLabels = { all: 'Alla kapitel', shared: 'Gemensam grund', business: 'Företag · B2B', consumer: 'Privatkund · B2C' };
  const sourceLabels = { products: 'Produktspecifikationer för säljare', slides: 'Grundutbildning B2B · presentation', selfstudy: 'Grundutbildning B2B · självstudier', 'user-confirmation': 'Användarens produktförtydligande' };
  let data;
  let state;
  let storageKey;
  let storageAvailable = true;
  let currentLessonId;
  let currentView = 'overview';
  let assessmentTrack = 'business';
  let toastTimeout;
  const validTrack = track => ['all', 'business', 'consumer'].includes(track) ? track : 'all';
  const relevantLessons = () => data.lessons.filter(lesson => state.track === 'all' || lesson.track === 'shared' || lesson.track === state.track);
  const lessonById = id => data.lessons.find(lesson => lesson.id === id);
  const isComplete = id => state.completed.includes(id);
  const isBookmarked = id => state.bookmarks.includes(id);
  const completedCount = lessons => lessons.filter(lesson => isComplete(lesson.id)).length;
  const pauseMedia = within => $$('video,audio', within).forEach(media => media.pause());
  const progressPercent = lessons => lessons.length ? Math.round(completedCount(lessons) / lessons.length * 100) : 0;
  const lessonHref = lesson => `#lesson/${encodeURIComponent(lesson.id)}`;
  const safeMediaUrl = url => {
    if (typeof url !== 'string' || !url.trim()) return '';
    try {
      const parsed = new URL(url, location.href);
      return ['http:', 'https:'].includes(parsed.protocol) ? parsed.href : '';
    } catch (_) { return ''; }
  };
  const emptyState = () => ({ track: 'all', completed: [], bookmarks: [], notes: {}, caseNotes: {}, answers: {}, lastLesson: null });
  function storageFailure() {
    storageAvailable = false;
    $('#storage-status').textContent = 'Webbläsaren kunde inte spara. Dina val finns kvar under detta besök, men kan försvinna vid omladdning.';
  }
  function loadState() {
    const fresh = emptyState();
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || 'null');
      if (saved && typeof saved === 'object' && !Array.isArray(saved)) {
        fresh.track = validTrack(saved.track);
        ['completed', 'bookmarks'].forEach(key => {
          fresh[key] = [...new Set(list(saved[key]).filter(id => lessonById(id)))];
        });
        ['notes', 'caseNotes', 'answers'].forEach(key => {
          if (saved[key] && typeof saved[key] === 'object' && !Array.isArray(saved[key])) fresh[key] = saved[key];
        });
        fresh.lastLesson = lessonById(saved.lastLesson) ? saved.lastLesson : null;
      }
    } catch (_) { storageFailure(); }
    const requestedTrack = new URLSearchParams(location.search).get('track');
    if (requestedTrack && ['all', 'business', 'consumer'].includes(requestedTrack)) fresh.track = requestedTrack;
    return fresh;
  }
  function save() {
    try {
      localStorage.setItem(storageKey, JSON.stringify(state));
      storageAvailable = true;
      $('#storage-status').textContent = 'Framsteg, testsvar och egna anteckningar sparas endast i denna webbläsare. Ingen central resultatrapportering eller partnercertifiering.';
      return true;
    } catch (_) { storageFailure(); return false; }
  }
  function flushActiveNotes() {
    if (currentView !== 'lesson' || !currentLessonId) return;
    const notes = $('#lesson-notes');
    const caseNotes = $('#case-answer');
    let changed = false;
    if (notes && notes.value !== (state.notes[currentLessonId] || '')) {
      state.notes[currentLessonId] = notes.value;
      changed = true;
    }
    if (caseNotes && caseNotes.value !== (state.caseNotes[currentLessonId] || '')) {
      state.caseNotes[currentLessonId] = caseNotes.value;
      changed = true;
    }
    if (changed) save();
  }
  function syncTrackQuery() {
    const url = new URL(location.href);
    url.searchParams.set('track', state.track);
    history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
  }
  function toast(message) {
    clearTimeout(toastTimeout);
    const node = $('#toast');
    node.textContent = message;
    node.hidden = false;
    toastTimeout = setTimeout(() => { node.hidden = true; }, 5500);
  }
  function trackChip(lesson) {
    return `<span class="track-chip ${escape(lesson.track)}">${escape(trackLabels[lesson.track] || lesson.track)}</span>`;
  }
  function resourcesHtml() {
    const resources = data.resources || {};
    return [
      ['selfstudy_pdf', 'Självstudiehandbok', 'PDF'],
      ['presentation_pptx', 'Presentationsmaterial', 'PowerPoint'],
      ['products_pdf', 'Produktunderlag · original', 'PDF'],
      ['foundation_pdf', 'Grundutbildning · original', 'PDF']
    ].map(([key, title, format]) => {
      const resource = resources[key];
      const url = safeMediaUrl(typeof resource === 'string' ? resource : resource?.url);
      return url ? `<a class="resource-link" href="${escape(url)}" target="_blank" rel="noopener"><span>${escape(title)} ↗</span><small>${escape(format)}</small></a>` : '';
    }).join('') || '<p>De nedladdningsbara filerna läggs här när de finns tillgängliga.</p>';
  }
  function mediaStatusText() {
    const status = data.meta?.media_status;
    if (typeof status === 'string' && status.trim()) return status;
    if (status && typeof status.description === 'string') return status.description;
    return 'Kapiteltexter och övningar kan läsas nu. Arthur hos Higgsfield och den inskickade figuren är valda för filmerna. En film eller ljudversion visas i sitt kapitel först när den är färdig.';
  }
  function renderMeta() {
    const lessons = relevantLessons();
    const totalMinutes = lessons.reduce((sum, lesson) => sum + (Number(lesson.minutes) || 0), 0);
    const questionCount = lessons.reduce((sum, lesson) => sum + list(lesson.quiz).length, 0);
    const productCount = new Set(lessons.map(lesson => lesson.product_id).filter(Boolean)).size;
    $('#course-meta').innerHTML = `<div><strong>${lessons.length}</strong><span>grundliga kapitel i ditt spår</span></div><div><strong>${number(totalMinutes, 0)}</strong><span>min läsning och övningar, uppskattat</span></div><div><strong>${questionCount}</strong><span>kapitelfrågor med förklarat facit</span></div><div><strong>${productCount}</strong><span>produkter att förstå och jämföra</span></div>`;
    $$('[data-track]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.track === state.track)));
    const courseQuery = new URLSearchParams(location.search);
    const portalUrl = new URL('./', location.href);
    portalUrl.searchParams.set('workspace', courseQuery.get('workspace') || (state.track === 'consumer' ? 'vast' : 'syd'));
    if (courseQuery.get('demo') === 'inflyttning') portalUrl.searchParams.set('demo', 'inflyttning');
    portalUrl.hash = 'academy';
    $('#portal-link').href = portalUrl.href;
    $('#hero-version').textContent = `Produktunderlag ${data.meta?.source_date || '2026-10-10'} · ${data.meta?.version || 'ny utbildningsversion'}`;
  }
  function introVideoHtml() {
    const intro = data.meta?.intro_video;
    if (!intro || typeof intro !== 'object' || Array.isArray(intro)) return '';
    const videoUrl = safeMediaUrl(intro.video_url);
    if (!videoUrl) return '';
    const poster = safeMediaUrl(intro.poster);
    const duration = Number(intro.duration_seconds);
    const durationLabel = Number.isFinite(duration) && duration > 0 ? `${number(duration, 1)} sek introduktion` : 'Kort introduktionsfilm';
    return `<figure class="course-intro-video" aria-labelledby="intro-video-title"><video id="course-intro-player" controls playsinline preload="metadata" ${poster ? `poster="${escape(poster)}"` : ''} aria-label="Arthur introducerar Elakademin"><source src="${escape(videoUrl)}" type="video/mp4">Din webbläsare kan inte spela upp filmen här.</video><figcaption><p class="eyebrow">En introduktion med Arthur</p><h3 id="intro-video-title">Välkommen till Elakademin</h3><p>${escape(intro.caption || 'En kort introduktion med Arthur och utbildningens avatar. Starta när du vill och fortsätt sedan i din egen takt.')}</p><span class="intro-video-duration">${escape(durationLabel)}</span><a class="button subtle" href="${escape(videoUrl)}" target="_blank" rel="noopener">Öppna introduktionsfilmen separat ↗</a><p class="media-error" role="status" hidden>Introduktionsfilmen kunde inte laddas. Öppna filmen separat eller börja läsa kapitlen nedan.</p></figcaption></figure>`;
  }
  function bindIntroVideo() {
    const player = $('#course-intro-player');
    if (!player) return;
    const revealError = () => {
      const status = $('.media-error', player.closest('.course-intro-video'));
      if (status) status.hidden = false;
    };
    player.addEventListener('error', revealError);
    $$('source', player).forEach(source => source.addEventListener('error', revealError));
    if (player.error) revealError();
  }
  function renderOverview() {
    pauseMedia($('#overview-content'));
    const lessons = relevantLessons();
    const next = lessons.find(lesson => !isComplete(lesson.id)) || lessons[0];
    const remembered = lessons.find(lesson => lesson.id === state.lastLesson);
    const start = remembered && !isComplete(remembered.id) ? remembered : next;
    const subtitle = state.track === 'business'
      ? 'Gemensamma grunder, företagens produkter och tillämpning i B2B-dialogen. Savera är exempelpartner för företagsspåret.'
      : state.track === 'consumer'
        ? 'Gemensamma grunder, konsumentprodukter och tillämpning i B2C-dialogen. Face2face är exempelpartner för privatkundsspåret.'
        : 'Hela utbildningen, med tydlig märkning av gemensamma grunder, företagsfördjupning och konsumentprodukter.';
    const introAudio = data.meta?.intro_audio;
    const introAudioUrl = safeMediaUrl(typeof introAudio === 'string' ? introAudio : introAudio?.url);
    $('#overview-content').innerHTML = `<div class="section-heading"><div><p class="eyebrow">Börja enkelt. Förstå ordentligt.</p><h2 id="overview-title" tabindex="-1">${escape(state.track === 'all' ? 'En komplett väg genom elhandeln' : trackLabels[state.track])}</h2></div><p>${escape(subtitle)}</p></div>
      <section class="start-panel" aria-labelledby="start-title"><div><h3 id="start-title">${completedCount(lessons) === lessons.length ? 'Repetera och pröva din förståelse' : remembered ? 'Fortsätt där du var' : 'Ta första steget'}</h3><p>Du behöver inga förkunskaper. Börja med grunderna och ta ett kapitel i taget. Varje kapitel innehåller förklaringar, genomräknade exempel, ett kundfall och fyra frågor med facit.</p><div class="button-group">${start ? `<a class="button primary" href="${lessonHref(start)}">${remembered ? 'Fortsätt läsa' : 'Börja utbildningen'} →</a>` : ''}<a class="button" href="#assessment">Till sluttestet</a><a class="button subtle" href="#tools">Prova räkneverktygen →</a></div></div><div class="start-progress"><strong>${progressPercent(lessons)}%</strong><span>${completedCount(lessons)} av ${lessons.length} kapitel<br>klarmarkerade av dig</span><progress max="100" value="${progressPercent(lessons)}" aria-label="${progressPercent(lessons)} procent av kapitlen lokalt klarmarkerade"></progress></div></section>
      ${introVideoHtml()}
      ${introAudioUrl ? `<section class="lesson-audio" aria-labelledby="intro-audio-title"><h3 id="intro-audio-title">En introduktion med Arthur</h3><audio controls preload="metadata" src="${escape(introAudioUrl)}" aria-label="Arthur introducerar Elakademin"></audio><p>${escape(typeof introAudio === 'object' ? introAudio.caption || 'Lyssna på introduktionen och fortsätt sedan i din egen takt.' : 'Lyssna på introduktionen och fortsätt sedan i din egen takt.')} <a href="${escape(introAudioUrl)}" target="_blank" rel="noopener">Öppna ljudfilen ↗</a></p></section>` : ''}
      <div class="learning-grid"><article class="learning-card"><span class="step-label">LÄS OCH RÄKNA</span><h3>Bygg en egen förståelse</h3><p>Lär dig vad som påverkar priset. Följ beräkningarna steg för steg och skilj komponentpris, totalpris och fakturabelopp åt.</p></article><article class="learning-card"><span class="step-label">ÖVA OCH FÖRKLARA</span><h3>Gör kunskapen användbar</h3><p>Ta ställning till fiktiva kundfall. Formulera ditt svar innan du öppnar modellsvaret och bedömningsstödet.</p></article><article class="learning-card"><span class="step-label">KONTROLLERA OCH REPETERA</span><h3>Förstå också varför</h3><p>Varje facit förklarar resonemanget. Ett fel svar är en signal om vad du behöver läsa igen, inte ett underkänt certifieringsprov.</p></article></div>
      <div class="overview-heading"><h3>Kapitlen i ditt spår</h3><p>${lessons.length} kapitel · ${escape(trackLabels[state.track])}</p></div><div class="chapter-grid">${lessons.map((lesson, index) => `<article class="chapter-card" data-overview-lesson="${escape(lesson.id)}"><div class="chapter-card-top"><span class="chapter-number">${String(index + 1).padStart(2, '0')}</span>${trackChip(lesson)}</div><h3>${escape(lesson.title)}</h3><p>${escape(lesson.introduction)}</p><div class="chapter-card-meta"><span>${number(lesson.minutes || 0, 0)} min · ${list(lesson.quiz).length} frågor</span>${isComplete(lesson.id) ? '<span class="completed-label">✓ Klarmarkerat</span>' : isBookmarked(lesson.id) ? '<span>Bokmärkt</span>' : '<span>Läs i egen takt</span>'}</div><a class="button" href="${lessonHref(lesson)}"><span>${isComplete(lesson.id) ? 'Repetera kapitlet' : 'Öppna kapitlet'}</span><span aria-hidden="true">→</span></a></article>`).join('')}</div>
      <section class="resources-panel" aria-labelledby="resources-title"><div><h3 id="resources-title">Ta materialet med dig</h3><p>Läs handboken i egen takt eller använd presentationen i en gemensam genomgång. Originalunderlaget visar produktfakta som utbildningen bygger på.</p><div class="resource-links">${resourcesHtml()}</div></div><div class="media-note"><h4>Filmer och berättarröst</h4><p>${escape(mediaStatusText())}</p></div></section>
      <p class="local-note">Dina bokmärken, anteckningar, testsvar och klarmarkeringar sparas lokalt. De delas inte mellan personer eller datorer och ger ingen partnercertifiering. Partnernamnen ovan visar exempel på segment; ett spår väljs efter kundtypen. Räkneexempel är syntetiska och aktuellt kundavtal anger villkoren.</p>`;
    bindIntroVideo();
  }
  function renderSidebar() {
    const lessons = relevantLessons();
    const search = ($('#lesson-search').value || '').trim().toLocaleLowerCase('sv');
    const filter = $('#lesson-filter').value;
    const visible = lessons.filter(lesson => {
      const matchesText = !search || `${lesson.title} ${lesson.kicker} ${lesson.introduction} ${list(lesson.objectives).join(' ')} ${list(lesson.sections).map(section => `${section.title} ${list(section.paragraphs).join(' ')}`).join(' ')}`.toLocaleLowerCase('sv').includes(search);
      return matchesText && (filter !== 'unfinished' || !isComplete(lesson.id)) && (filter !== 'bookmarked' || isBookmarked(lesson.id));
    });
    $('#chapter-list').innerHTML = visible.length ? visible.map(lesson => `<a class="chapter-nav-link ${isComplete(lesson.id) ? 'is-complete' : ''}" href="${lessonHref(lesson)}" ${lesson.id === currentLessonId ? 'aria-current="step"' : ''}><span aria-hidden="true">${isComplete(lesson.id) ? '✓' : String(lessons.indexOf(lesson) + 1).padStart(2, '0')}</span><span>${escape(lesson.title)}<small>${escape(trackLabels[lesson.track])} · ${number(lesson.minutes || 0, 0)} min${isComplete(lesson.id) ? ' · klarmarkerat' : ''}</small></span>${isBookmarked(lesson.id) ? '<span class="bookmark-dot" aria-label="Bokmärkt">◇</span>' : ''}</a>`).join('') : '<p class="empty-state">Inga kapitel matchar. Ändra sökningen eller visningsfiltret.</p>';
    $('#sidebar-count').textContent = String(lessons.length);
    $('#lesson-search-count').textContent = `${visible.length} av ${lessons.length} kapitel visas`;
    $('#sidebar-progress-label').textContent = `${completedCount(lessons)} av ${lessons.length} klarmarkerade`;
    $('#sidebar-progress').value = progressPercent(lessons);
    $('#sidebar-progress').setAttribute('aria-label', `${progressPercent(lessons)} procent av ditt spår lokalt klarmarkerat`);
  }
  function getAnswer(key) {
    const answer = state.answers[key];
    return answer && typeof answer === 'object' && !Array.isArray(answer) ? { ...answer, checked: answer.checked === true } : {};
  }
  function questionResult(question, answer) {
    if (question.type === 'short') return 'manual';
    if (question.type === 'number') {
      const entered = Number(answer.value);
      const expected = Number(question.correct);
      const tolerance = Number.isFinite(Number(question.tolerance)) ? Math.max(0, Number(question.tolerance)) : .01;
      return answer.value !== '' && Number.isFinite(entered) && Number.isFinite(expected) && Math.abs(entered - expected) <= tolerance ? 'correct' : 'incorrect';
    }
    return String(answer.value) === String(question.correct) ? 'correct' : 'incorrect';
  }
  function questionFeedback(question, answer) {
    if (!answer.checked) return '';
    const result = questionResult(question, answer);
    let answerLine = '';
    if (question.type === 'mcq') {
      const correctOption = list(question.options).find(option => String(option.id) === String(question.correct));
      if (correctOption) answerLine = `Facit: ${correctOption.text}`;
    } else if (question.type === 'number') answerLine = `Facit: ${number(Number(question.correct), 4)}${question.unit ? ` ${question.unit}` : ''}.`;
    const feedbackTitle = result === 'correct' ? 'Rätt svar — jämför ditt resonemang med förklaringen.' : result === 'manual' ? 'Bedöm ditt svar med hjälp av modellsvaret.' : 'Läs förklaringen och pröva igen.';
    return `<strong>${feedbackTitle}</strong>${answerLine ? `<p class="answer-line">${escape(answerLine)}</p>` : ''}${paragraphs(question.explanation)}${list(question.rubric).length ? `<div class="quiz-rubric"><h4>Kontrollera att ditt svar tar upp</h4>${bullets(question.rubric)}</div>` : ''}`;
  }
  function renderQuestion(question, index, context) {
    const key = `${context}:${question.id || index}`;
    const answer = getAnswer(key);
    const fieldId = `answer-${context.replace(/[^a-z0-9-]/gi, '-')}-${index}`;
    const questionType = ['mcq', 'number', 'short'].includes(question.type) ? question.type : 'short';
    const required = 'required';
    const input = questionType === 'mcq'
      ? `<div class="quiz-options">${list(question.options).map((option, optionIndex) => `<label class="quiz-option" for="${fieldId}-${optionIndex}"><input id="${fieldId}-${optionIndex}" type="radio" name="${fieldId}" value="${escape(option.id)}" ${String(answer.value) === String(option.id) ? 'checked' : ''} ${required}><span>${escape(option.text)}</span></label>`).join('')}</div>`
      : questionType === 'number'
        ? `<div class="quiz-entry"><label for="${fieldId}">Ditt svar${question.unit ? `, ${escape(question.unit)}` : ''}<input id="${fieldId}" name="answer" type="number" step="any" value="${escape(answer.value ?? '')}" ${required}></label></div><div class="question-rationale"><label for="${fieldId}-reason">Visa ditt resonemang eller din beräkning (valfritt)<textarea id="${fieldId}-reason" name="reason" rows="3" placeholder="Vilka volymer, priser och enheter använde du?">${escape(answer.reason || '')}</textarea></label></div>`
        : `<div class="quiz-entry"><label for="${fieldId}">Ditt resonemang<textarea id="${fieldId}" name="answer" rows="5" placeholder="Svara med egna ord innan du öppnar facit." ${required}>${escape(answer.value || '')}</textarea></label></div>`;
    const result = answer.checked ? questionResult(question, answer) : '';
    return `<form class="quiz-card" data-question-key="${escape(key)}" data-question-index="${index}"><fieldset><legend><span class="question-number">Fråga ${index + 1} · ${questionType === 'number' ? 'Räkna och förklara' : questionType === 'short' ? 'Tillämpa med egna ord' : 'Välj och förstå'}</span>${escape(question.prompt)}</legend>${input}</fieldset><div class="quiz-actions"><button type="submit" class="button">${answer.checked ? 'Visa facit igen' : questionType === 'short' ? 'Visa modellsvar och bedömningsstöd' : 'Kontrollera och visa facit'}</button><small>${questionType === 'short' ? 'Du bedömer själv ditt resonemang.' : 'Facit förklarar varför svaret gäller.'}</small></div><div class="quiz-feedback ${result === 'incorrect' ? 'incorrect' : ''}" role="status" tabindex="-1" ${answer.checked ? '' : 'hidden'}>${questionFeedback(question, answer)}</div></form>`;
  }
  function bindQuestions(holder, questions, context) {
    $$('.quiz-card[data-question-key]', holder).forEach(form => {
      const index = Number(form.dataset.questionIndex);
      const question = list(questions)[index];
      const key = form.dataset.questionKey;
      if (!question) return;
      const read = () => ({ value: question.type === 'mcq' ? $('input[type=radio]:checked', form)?.value || '' : $('[name=answer]', form)?.value || '', reason: $('[name=reason]', form)?.value || '', checked: false });
      const storeDraft = () => {
        state.answers[key] = read();
        save();
        $('.quiz-feedback', form).hidden = true;
        $('button[type=submit]', form).textContent = question.type === 'short' ? 'Visa modellsvar och bedömningsstöd' : 'Kontrollera och visa facit';
        updateQuestionSummary(holder, questions, context);
      };
      $$('input,textarea', form).forEach(input => input.addEventListener('input', storeDraft));
      form.addEventListener('submit', event => {
        event.preventDefault();
        if (!form.reportValidity()) return;
        const answer = read();
        answer.checked = true;
        state.answers[key] = answer;
        save();
        const feedback = $('.quiz-feedback', form);
        feedback.innerHTML = questionFeedback(question, answer);
        feedback.classList.toggle('incorrect', questionResult(question, answer) === 'incorrect');
        feedback.hidden = false;
        $('button[type=submit]', form).textContent = 'Visa facit igen';
        updateQuestionSummary(holder, questions, context);
        feedback.focus({ preventScroll: true });
      });
    });
    updateQuestionSummary(holder, questions, context);
  }
  function updateQuestionSummary(holder, questions, context) {
    const checked = list(questions).filter((question, index) => getAnswer(`${context}:${question.id || index}`).checked);
    const automatic = checked.filter(question => question.type !== 'short');
    const correct = automatic.filter(question => {
      const index = questions.indexOf(question);
      return questionResult(question, getAnswer(`${context}:${question.id || index}`)) === 'correct';
    });
    const manual = checked.length - automatic.length;
    const status = $('[data-quiz-status]', holder);
    if (status) status.textContent = `${checked.length} av ${list(questions).length} frågor har öppnat facit.${automatic.length ? ` ${correct.length} av ${automatic.length} automatiskt rättade svar stämmer med facit.` : ''}${manual ? ` ${manual} resonemang bedömer du själv med stöd av modellsvaret.` : ''}`;
    const result = $('[data-assessment-summary]', holder);
    if (result) {
      const unfinished = questions.length - checked.length;
      result.textContent = unfinished
        ? `${unfinished} frågor återstår att jämföra med facit. Ta gärna en fråga i taget och gå tillbaka till kapitlet om något är oklart.`
        : `Du har jämfört alla ${questions.length} frågor med facit. ${automatic.length ? `${correct.length} av ${automatic.length} automatiskt rättade svar stämmer. ` : ''}${manual ? `${manual} resonemangsfrågor behöver din egen bedömning. ` : ''}Repetera sådant du vill förklara tydligare. Testet är stöd för eget lärande och ger ingen partnercertifiering.`;
    }
  }
  function videoHtml(lesson) {
    const media = lesson.media || lesson.video || {};
    const video = typeof media.video === 'object' ? media.video : media;
    const videoUrl = safeMediaUrl(video.video_url || (media.type !== 'audio' ? video.url : ''));
    const audioUrl = safeMediaUrl(media.audio_url || (media.type === 'audio' ? media.url : media.audio?.url));
    const poster = safeMediaUrl(video.poster || media.poster);
    const subtitlesUrl = safeMediaUrl(video.subtitles_url || media.subtitles_url);
    if (videoUrl) return `<figure class="lesson-video"><video controls playsinline preload="metadata" ${poster ? `poster="${escape(poster)}"` : ''} aria-label="Kapitelfilm: ${escape(lesson.title)}"><source src="${escape(videoUrl)}" type="video/mp4">${subtitlesUrl ? `<track kind="captions" src="${escape(subtitlesUrl)}" srclang="sv" label="Svenska" default>` : ''}Din webbläsare kan inte spela upp filmen här.</video><figcaption>${escape(video.caption || media.caption || 'Kapitelfilm · läs texten och öva nedan')}<a href="${escape(videoUrl)}" target="_blank" rel="noopener">Öppna filmen separat ↗</a></figcaption><p class="media-error" hidden role="status">Filmen kunde inte laddas. Öppna den separat eller läs kapiteltexten nedan.</p></figure>`;
    if (audioUrl) return `<section class="lesson-audio" aria-label="Ljudversion av kapitlet"><h3>Lyssna på kapitlets berättartext</h3><audio controls preload="metadata" aria-label="Ljud: ${escape(lesson.title)}" src="${escape(audioUrl)}"></audio><p>${escape(media.caption || 'Berättarröst: Arthur · berättartexten finns längre ned i kapitlet.')} <a href="${escape(audioUrl)}" target="_blank" rel="noopener">Öppna ljudfilen ↗</a></p><p class="media-error" hidden role="status">Ljudet kunde inte laddas. Öppna filen separat eller läs berättartexten.</p></section>`;
    return '';
  }
  function renderNarration(lesson) {
    const segments = list(lesson.narration?.segments);
    if (!segments.length) return '';
    const hasMedia = Boolean(videoHtml(lesson));
    return `<details class="narration-card"><summary>Berättartext för Arthur · ${segments.length} avsnitt</summary><p class="narration-intro">${hasMedia ? 'Läs kapitlets berättartext som ett komplement till ljud eller film.' : 'Här finns kapitlets färdiga berättartext. Ljud och film visas ovan när de har producerats.'} Bildanvisningarna visar hur sambanden ska illustreras.</p>${segments.map((segment, index) => `<section class="narration-segment"><h4>${String(index + 1).padStart(2, '0')} · ${escape(segment.title)}</h4>${paragraphs(segment.text)}<div class="narration-visual"><strong>På skärmen</strong>${bullets(segment.on_screen)}<p>${escape(segment.visual)}</p></div></section>`).join('')}</details>`;
  }
  function renderSources(lesson) {
    const references = list(lesson.source_refs);
    return references.length ? `<details class="source-details"><summary>Underlag för detta kapitel</summary><ul>${references.map(reference => `<li>${escape(sourceLabels[reference.source] || reference.source)}${list(reference.pages).length ? ` · sida ${escape(reference.pages.join(', '))}` : ''}${reference.note ? `: ${escape(reference.note)}` : ''}</li>`).join('')}</ul><p>Produktbeskrivningarna utgår från säljarunderlaget ${escape(data.meta?.source_date || '2026-10-10')}. Räkneexemplen är pedagogiska; kundens aktuella offert och avtal anger kommersiella villkor.</p></details>` : '';
  }
  function renderLesson(id) {
    const lesson = lessonById(id);
    if (!lesson) return;
    flushActiveNotes();
    currentLessonId = lesson.id;
    state.lastLesson = lesson.id;
    save();
    const lessons = relevantLessons();
    const index = lessons.findIndex(item => item.id === lesson.id);
    const previous = lessons[index - 1];
    const next = lessons[index + 1];
    const scenario = lesson.scenario || {};
    const notes = typeof state.notes[lesson.id] === 'string' ? state.notes[lesson.id] : '';
    const caseNotes = typeof state.caseNotes[lesson.id] === 'string' ? state.caseNotes[lesson.id] : '';
    const done = isComplete(lesson.id);
    const bookmarked = isBookmarked(lesson.id);
    pauseMedia($('#lesson-content'));
    $('#lesson-content').innerHTML = `<div class="lesson-topline"><span>Kapitel ${index + 1} av ${lessons.length} i ditt spår</span><button id="bookmark-lesson" class="button ${bookmarked ? 'is-bookmarked' : ''}" aria-pressed="${bookmarked}">${bookmarked ? '◇ Bokmärkt' : '◇ Bokmärk kapitlet'}</button></div>
      <header class="lesson-header"><p class="eyebrow">${escape(lesson.kicker || trackLabels[lesson.track])}</p><h2 id="lesson-title" tabindex="-1">${escape(lesson.title)}</h2><p class="lesson-intro">${escape(lesson.introduction)}</p><div class="lesson-meta">${trackChip(lesson)}<span>${number(lesson.minutes || 0, 0)} min läsning och övning, uppskattat</span><span>${list(lesson.examples).length} genomräknade exempel · ${list(lesson.quiz).length} frågor</span></div></header>
      <nav class="lesson-jump" aria-label="Innehåll i kapitlet"><a href="#objectives" data-jump="objectives">Mål</a><a href="#teaching" data-jump="teaching">Förklaring</a><a href="#examples" data-jump="examples">Exempel</a><a href="#customer-case" data-jump="customer-case">Kundfall</a><a href="#chapter-quiz" data-jump="chapter-quiz">Självtest</a><a href="#chapter-notes" data-jump="chapter-notes">Anteckningar</a></nav>
      ${videoHtml(lesson)}
      <section id="objectives" class="content-card objectives-card"><h3>Efter kapitlet ska du kunna</h3>${bullets(lesson.objectives)}</section>
      <div id="teaching">${list(lesson.sections).map(section => `<section class="teaching-section"><h3>${escape(section.title)}</h3>${paragraphs(section.paragraphs)}${bullets(section.bullets)}</section>`).join('')}</div>
      <div class="section-divider" id="examples"><p class="eyebrow">Följ beräkningen steg för steg</p><h3>Genomräknade exempel</h3></div>${list(lesson.examples).map((example, exampleIndex) => `<article class="example-card"><h4>${exampleIndex + 1}. ${escape(example.title)}</h4><p class="scope-note">${escape(example.scope)}</p>${list(example.given).length ? `<h5>Förutsättningar</h5>${bullets(example.given)}` : ''}${list(example.steps).length ? `<h5>Så räknar vi</h5><ol>${example.steps.map(step => `<li>${escape(step)}</li>`).join('')}</ol>` : ''}<div class="example-result">${escape(example.result)}</div>${paragraphs(example.explanation)}</article>`).join('')}
      ${list(lesson.misconceptions).length ? `<div class="section-divider"><p class="eyebrow">Det som lätt blir fel</p><h3>Vanliga missförstånd</h3></div><div class="misconception-list">${lesson.misconceptions.map(item => `<details class="misconception"><summary>${escape(item.claim)}</summary>${paragraphs(item.correction)}</details>`).join('')}</div>` : ''}
      <section class="content-card customer-copy" style="margin-top:25px"><p class="eyebrow">En förklaring att använda i kunddialogen</p><blockquote>${escape(lesson.customer_explanation?.short)}</blockquote>${lesson.customer_explanation?.detailed ? `<details><summary>En längre förklaring, med sammanhang</summary>${paragraphs(lesson.customer_explanation.detailed)}</details>` : ''}</section>
      <section id="customer-case" class="content-card case-card"><p class="eyebrow">Tillämpa på ett fiktivt kundfall</p><h3>${escape(scenario.title || 'Kundfallet')}</h3>${paragraphs(scenario.setup)}${list(scenario.tasks).length ? `<ol>${scenario.tasks.map(task => `<li>${escape(task)}</li>`).join('')}</ol>` : ''}<label class="case-label" for="case-answer">Ditt resonemang innan du läser modellsvaret<textarea id="case-answer" rows="5" placeholder="Vilka uppgifter behöver du? Vad kan du förklara, och vad styrs av avtalet?">${escape(caseNotes)}</textarea></label><p class="small" id="case-save-status">Ditt svar kan sparas lokalt som övningsanteckning.</p><details><summary>Visa modellsvar och bedömningsstöd</summary><div class="model-answer">${paragraphs(scenario.model_answer)}${list(scenario.rubric).length ? `<h4>Bedöm ditt resonemang</h4>${bullets(scenario.rubric)}` : ''}</div></details></section>
      <div class="section-divider" id="chapter-quiz"><p class="eyebrow">Kontrollera förståelsen</p><h3>Självtest med förklarat facit</h3></div><p class="quiz-status" data-quiz-status></p><div class="quiz-list">${list(lesson.quiz).map((question, questionIndex) => renderQuestion(question, questionIndex, `lesson-${lesson.id}`)).join('')}</div>
      <section class="content-card takeaways-card" style="margin-top:25px"><h3>Ta med dig till nästa kunddialog</h3>${bullets(lesson.takeaways)}</section>
      ${renderNarration(lesson)}
      <section id="chapter-notes" class="content-card notes-card"><h3>Dina egna anteckningar</h3><label for="lesson-notes">Vad vill du komma ihåg eller få förklarat igen?<textarea id="lesson-notes" rows="5" placeholder="Skriv din egen sammanfattning, ett begrepp att repetera eller en fråga till nästa genomgång.">${escape(notes)}</textarea></label><div class="button-group"><button id="save-notes" class="button">Spara anteckningen</button><button id="clear-notes" class="button subtle">Rensa anteckningen</button></div><p id="note-save-status" role="status">${notes ? 'En sparad anteckning har lästs in från denna webbläsare.' : 'Anteckningen sparas endast i denna webbläsare.'}</p></section>
      ${renderSources(lesson)}
      <div class="lesson-bottom"><p class="completion-label" id="completion-label">${done ? '✓ Du har markerat det här kapitlet klart.' : 'Markera kapitlet klart när du har läst, räknat och jämfört dina svar med facit.'}</p><div class="lesson-bottom-nav"><div class="button-group"><button id="complete-lesson" class="button ${done ? '' : 'primary'}" aria-pressed="${done}">${done ? 'Ångra klarmarkering' : '✓ Markera kapitlet klart'}</button>${previous ? `<a class="button subtle" href="${lessonHref(previous)}">← Föregående kapitel</a>` : ''}</div><div class="next-lesson">${next ? `<small>Nästa kapitel</small><a class="button" href="${lessonHref(next)}">${escape(next.title)} →</a>` : '<small>Alla kapitel i spåret är lästa?</small><a class="button" href="#assessment">Pröva sluttestet →</a>'}</div></div></div>`;
    bindQuestions($('#lesson-content'), list(lesson.quiz), `lesson-${lesson.id}`);
    $$('[data-jump]', $('#lesson-content')).forEach(link => link.addEventListener('click', event => {
      event.preventDefault();
      const target = $(`#${link.dataset.jump}`);
      target?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
      const heading = target?.querySelector('h3') || target;
      if (heading) { heading.setAttribute('tabindex', '-1'); heading.focus({ preventScroll: true }); }
    }));
    $('#bookmark-lesson').addEventListener('click', () => {
      const marked = isBookmarked(lesson.id);
      state.bookmarks = marked ? state.bookmarks.filter(value => value !== lesson.id) : [...state.bookmarks, lesson.id];
      const saved = save();
      const button = $('#bookmark-lesson');
      button.setAttribute('aria-pressed', String(!marked));
      button.classList.toggle('is-bookmarked', !marked);
      button.textContent = marked ? '◇ Bokmärk kapitlet' : '◇ Bokmärkt';
      renderSidebar();
      toast(saved ? marked ? 'Bokmärket har tagits bort.' : 'Kapitlet är bokmärkt i denna webbläsare.' : 'Bokmärket gäller under besöket. Webbläsaren kunde inte spara.');
    });
    $('#complete-lesson').addEventListener('click', () => {
      const marked = isComplete(lesson.id);
      state.completed = marked ? state.completed.filter(value => value !== lesson.id) : [...state.completed, lesson.id];
      const saved = save();
      const button = $('#complete-lesson');
      button.setAttribute('aria-pressed', String(!marked));
      button.classList.toggle('primary', marked);
      button.textContent = marked ? '✓ Markera kapitlet klart' : 'Ångra klarmarkering';
      $('#completion-label').textContent = marked ? 'Klarmarkeringen är borttagen.' : '✓ Du har markerat det här kapitlet klart.';
      renderSidebar();
      toast(saved ? marked ? 'Klarmarkeringen är borttagen.' : 'Din klarmarkering är sparad lokalt.' : 'Klarmarkeringen gäller under besöket. Webbläsaren kunde inte spara.');
    });
    const saveNote = () => {
      state.notes[lesson.id] = $('#lesson-notes').value;
      $('#note-save-status').textContent = save() ? 'Anteckningen är sparad i denna webbläsare.' : 'Anteckningen kunde inte sparas. Den finns kvar under detta besök.';
    };
    $('#save-notes').addEventListener('click', saveNote);
    $('#lesson-notes').addEventListener('change', saveNote);
    $('#lesson-notes').addEventListener('input', () => { $('#note-save-status').textContent = 'Ändringen sparas när du lämnar fältet eller väljer Spara anteckningen.'; });
    $('#clear-notes').addEventListener('click', () => { $('#lesson-notes').value = ''; saveNote(); $('#lesson-notes').focus(); });
    $('#case-answer').addEventListener('change', () => {
      state.caseNotes[lesson.id] = $('#case-answer').value;
      $('#case-save-status').textContent = save() ? 'Ditt övningssvar är sparat i denna webbläsare.' : 'Ditt övningssvar kunde inte sparas och gäller bara under detta besök.';
    });
    $$('video,audio', $('#lesson-content')).forEach(media => {
      const revealError = () => { const error = $('.media-error', media.parentElement); if (error) error.hidden = false; };
      media.addEventListener('error', revealError);
      $$('source', media).forEach(source => source.addEventListener('error', revealError));
      if (media.error || media.networkState === 3) revealError();
    });
    renderSidebar();
  }
  function renderAssessment() {
    if (state.track !== 'all') assessmentTrack = state.track;
    history.replaceState(null, '', `#assessment/${assessmentTrack}`);
    const questions = list(data.final_assessment?.[assessmentTrack]);
    const context = `final-${assessmentTrack}`;
    $('#assessment-content').innerHTML = `<div class="section-heading"><div><p class="eyebrow">Från fakta till egen förklaring</p><h2 id="assessment-title" tabindex="-1">Sluttest · ${escape(trackLabels[assessmentTrack])}</h2></div><p>Knyt ihop grunderna, produkterna och kunddialogen. Ta tid på dig och använd facit för att förstå resonemanget.</p></div><div class="assessment-intro"><p>Svara först utan att läsa facit. Flervals- och räknesvar kan jämföras automatiskt. Resonemangsfrågorna bedömer du själv mot modellsvaret. Testet har ingen formell godkäntgräns och ger ingen partnercertifiering.</p></div><div class="assessment-track"><label for="assessment-track">Välj kundsegment för sluttestet<select id="assessment-track"><option value="business" ${assessmentTrack === 'business' ? 'selected' : ''}>Företag · B2B</option><option value="consumer" ${assessmentTrack === 'consumer' ? 'selected' : ''}>Privatkund · B2C</option></select></label><p class="small">Svar sparas separat för de två testen.</p></div><p class="quiz-status" data-quiz-status></p><div class="quiz-list">${questions.map((question, index) => renderQuestion(question, index, context)).join('') || '<p class="empty-state">Sluttestet för det här spåret har inget innehåll ännu. Kapitelövningarna kan användas under tiden.</p>'}</div><section class="assessment-results"><h3>Din egen uppföljning</h3><p data-assessment-summary></p><a class="button" href="#overview">Välj ett kapitel att repetera →</a></section>`;
    $('#assessment-track').addEventListener('change', event => {
      assessmentTrack = event.target.value;
      if (state.track !== 'all' && state.track !== assessmentTrack) {
        state.track = 'all';
        save();
        syncTrackQuery();
        renderMeta();
      }
      history.replaceState(null, '', `#assessment/${assessmentTrack}`);
      renderAssessment();
      $('#assessment-track').focus();
    });
    bindQuestions($('#assessment-content'), questions, context);
  }
  function renderGlossary() {
    const search = $('#glossary-search').value.trim().toLocaleLowerCase('sv');
    const terms = list(data.glossary).filter(item => !search || `${item.term} ${item.definition}`.toLocaleLowerCase('sv').includes(search));
    $('#glossary-list').innerHTML = terms.length ? terms.map(item => `<article class="glossary-card"><h3>${escape(item.term)}</h3>${paragraphs(item.definition)}</article>`).join('') : '<p class="empty-state">Inga begrepp matchar. Prova ett annat ord eller rensa sökningen.</p>';
    $('#glossary-count').textContent = `${terms.length} av ${list(data.glossary).length} begrepp visas`;
  }
  function weightedCalculation() {
    const winterVolume = Number($('#winter-volume').value);
    const winterPrice = Number($('#winter-price').value);
    const summerVolume = Number($('#summer-volume').value);
    const summerPrice = Number($('#summer-price').value);
    const totalVolume = winterVolume + summerVolume;
    const totalCost = (winterVolume * winterPrice + summerVolume * summerPrice) / 100;
    const weighted = totalCost * 100 / totalVolume;
    if (![winterVolume, winterPrice, summerVolume, summerPrice, totalVolume, totalCost, weighted].every(Number.isFinite) || winterVolume < 0 || summerVolume < 0 || totalVolume <= 0) {
      $('#weighted-result').innerHTML = '<p class="error-text">Ange ändliga prisvärden och volymer på minst noll. Den sammanlagda volymen måste vara större än noll. Prova mindre tal om värdena är för stora för beräkningen.</p>';
      return;
    }
    const simpleMean = winterPrice / 2 + summerPrice / 2;
    $('#weighted-result').innerHTML = `<p class="result-label">Förbrukningsvägt komponentpris</p><strong>${number(weighted)} <small>öre/kWh</small></strong><p>${number(totalCost)} kr för ${number(totalVolume)} kWh i den här komponenten.</p><p>Det oviktade medelvärdet är ${number(simpleMean)} öre/kWh. ${Math.abs(weighted - simpleMean) < .00001 ? 'Med lika stora volymer, eller lika priser, blir snitten lika.' : 'Den period som har större volym påverkar det viktade priset mer.'}</p><p>Formel: (${number(winterVolume)} × ${number(winterPrice)} + ${number(summerVolume)} × ${number(summerPrice)}) ÷ ${number(totalVolume)}.</p>`;
  }
  function hedgeCalculation() {
    const forecast = Number($('#forecast-volume').value);
    const percentage = Number($('#hedge-percentage').value);
    const actual = Number($('#actual-volume').value);
    const secured = forecast * percentage / 100;
    const actualShare = secured / actual * 100;
    if (![forecast, percentage, actual, secured, actualShare].every(Number.isFinite) || forecast < 0 || actual <= 0 || percentage < 0 || percentage > 100) {
      $('#hedge-result').innerHTML = '<p class="error-text">Ange ändliga värden: prognos på minst noll, säkring mellan 0 och 100 procent och faktisk förbrukning större än noll. Prova mindre tal om värdena är för stora för beräkningen.</p>';
      return;
    }
    $('#hedge-result').innerHTML = `<p class="result-label">Säkrad volym i relation till faktisk förbrukning</p><strong>${number(actualShare)} <small>%</small></strong><p>Prognos ${number(forecast)} MWh × ${number(percentage)} % = ${number(secured)} MWh säkrad volym.</p><p>${number(secured)} MWh ÷ ${number(actual)} MWh × 100 = ${number(actualShare)} % av utfallet.</p><p>${actualShare > 100 ? 'Den säkrade volymen är större än den faktiska förbrukningen. Avtalet avgör hur överskott och avvikelse hanteras.' : 'Detta är ett volymförhållande. Det betyder inte att motsvarande andel av hela fakturan är fast.'}</p>`;
  }
  function showView(view, focus = false) {
    if (view !== 'lesson') flushActiveNotes();
    currentView = view;
    $$('.view-panel').forEach(panel => { panel.hidden = panel.id !== `view-${view}`; if (panel.hidden) pauseMedia(panel); });
    $$('[data-view-link]').forEach(link => {
      if (link.dataset.viewLink === view) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
    if (view === 'overview') renderOverview();
    if (view === 'assessment') renderAssessment();
    if (view === 'glossary') renderGlossary();
    if (view === 'tools') { weightedCalculation(); hedgeCalculation(); }
    if (focus) {
      const heading = view === 'lesson' ? $('#lesson-title') : $(`#${view === 'assessment' ? 'assessment' : view}-title`);
      const panel = $(`#view-${view}`);
      panel?.scrollIntoView({ behavior: 'auto', block: 'start' });
      heading?.focus({ preventScroll: true });
    }
  }
  function route(focus = false) {
    flushActiveNotes();
    const hash = location.hash.slice(1);
    const [target, rawId] = hash.split('/');
    if (target === 'lesson') {
      let decodedId = '';
      try { decodedId = decodeURIComponent(rawId || ''); } catch (_) { /* Fall back to a valid chapter. */ }
      let lesson = lessonById(decodedId);
      if (!lesson) lesson = relevantLessons().find(item => item.id === state.lastLesson) || relevantLessons().find(item => !isComplete(item.id)) || relevantLessons()[0];
      if (!lesson) { showView('overview', focus); return; }
      if (state.track !== 'all' && lesson.track !== 'shared' && lesson.track !== state.track) {
        state.track = 'all';
        save();
        syncTrackQuery();
        renderMeta();
      }
      history.replaceState(null, '', lessonHref(lesson));
      renderLesson(lesson.id);
      showView('lesson', focus);
    } else if (target === 'assessment') {
      if (['business', 'consumer'].includes(rawId)) {
        assessmentTrack = rawId;
        if (state.track !== 'all' && state.track !== rawId) { state.track = 'all'; save(); syncTrackQuery(); renderMeta(); }
      }
      showView('assessment', focus);
    } else showView(['overview', 'glossary', 'tools'].includes(target) ? target : 'overview', focus);
  }
  function bindGlobal() {
    $('.skip-link').addEventListener('click', event => {
      event.preventDefault();
      const panel = $(`#view-${currentView}`);
      const target = panel?.querySelector('h2') || $('#content');
      target.setAttribute('tabindex', '-1');
      target.focus();
    });
    $$('[data-track]').forEach(button => button.addEventListener('click', () => {
      flushActiveNotes();
      state.track = validTrack(button.dataset.track);
      save();
      syncTrackQuery();
      renderMeta();
      if (currentView === 'lesson' && relevantLessons().some(lesson => lesson.id === currentLessonId)) {
        renderLesson(currentLessonId);
      } else if (currentView === 'lesson') location.hash = 'overview';
      else showView(currentView);
      toast(`Spåret ${trackLabels[state.track].toLocaleLowerCase('sv')} är valt.`);
    }));
    $('#lesson-search').addEventListener('input', renderSidebar);
    $('#lesson-filter').addEventListener('change', renderSidebar);
    $('#glossary-search').addEventListener('input', renderGlossary);
    $('#weighted-form').addEventListener('submit', event => { event.preventDefault(); if (event.target.reportValidity()) weightedCalculation(); });
    $('#hedge-form').addEventListener('submit', event => { event.preventDefault(); if (event.target.reportValidity()) hedgeCalculation(); });
    addEventListener('hashchange', () => route(true));
    addEventListener('beforeunload', () => {
      if (currentView === 'lesson' && currentLessonId) {
        if ($('#lesson-notes')) state.notes[currentLessonId] = $('#lesson-notes').value;
        if ($('#case-answer')) state.caseNotes[currentLessonId] = $('#case-answer').value;
        save();
      }
    });
    if (matchMedia('(max-width:760px)').matches) $('#chapter-disclosure').open = false;
  }
  async function init() {
    try {
      const response = await fetch('./elakademin-data.json');
      if (!response.ok) throw new Error(`Innehållsfilen svarade ${response.status}`);
      data = await response.json();
      if (!Array.isArray(data.lessons) || !data.lessons.length) throw new Error('Innehållsfilen saknar kapitel');
      const validIds = new Set();
      data.lessons = data.lessons.filter(lesson => {
        if (!lesson || typeof lesson.id !== 'string' || !lesson.id || validIds.has(lesson.id)) return false;
        validIds.add(lesson.id);
        return true;
      });
      storageKey = `kraftringen.elakademin.full.v1.${String(data.meta?.version || '2026-10-11').replace(/[^a-z0-9._-]/gi, '-')}`;
      state = loadState();
      renderMeta();
      bindGlobal();
      route();
      $('#load-status').hidden = true;
      $('#course-app').hidden = false;
      if (storageAvailable) $('#storage-status').textContent = 'Framsteg, testsvar och egna anteckningar sparas endast i denna webbläsare. Ingen central resultatrapportering eller partnercertifiering.';
    } catch (_) {
      $('#load-status').textContent = 'Utbildningsinnehållet kunde inte hämtas. Ladda om sidan och försök igen, eller gå tillbaka till utbildningarna i partnerportalen.';
    }
  }
  init();
})();
