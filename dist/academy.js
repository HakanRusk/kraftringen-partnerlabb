(() => {
  'use strict';
  const P = window.Portal;
  if (!P) return;
  const categories = [
    { id: 'all', label: 'Alla utbildningar', icon: 'grid' },
    { id: 'electric', label: 'Elhandel', icon: 'bolt' },
    { id: 'sales', label: 'Sälj & kundmöte', icon: 'users' },
    { id: 'partner', label: 'Partnersamarbete', icon: 'handshake' },
    { id: 'bookmarked', label: 'Bokmärken', icon: 'bookmark' }
  ];
  const businessCourses = [
    {
      id: 'intro', category: 'partner', title: 'Kom igång med företagsaffären', description: 'Förstå resultatvyerna och hitta utbildningsstöd för företagsdialogen.', image: 'assets/office.jpg', duration: '6 min',
      lessons: [
        { id: 'intro-1', title: 'Din företagsarbetsyta', text: 'Partnerns aktiva företagsförsäljning sker utanför portalen. Här följer du egna exempelresultat, utforskar Insikter och hittar utbildning och produktunderlag.', bullets: ['Öppna Kunder & avtal och se vilka exempelresultat som visas för din partner.', 'Utforska Insikter för din partner och välj en period.', 'Välj ett utbildningskapitel eller ett begrepp att repetera inför kunddialogen.'] },
        { id: 'intro-2', title: 'Förstå ett resultat', text: 'Resultatvyerna visar manuella exempelutfall. Skilj periodens nya avtal från aktivt kundbestånd och använd filtren för att förstå vad ett mått omfattar.', bullets: ['Välj en period och jämför de mått som finns i Kunder & avtal.', 'Skilj nya avtal under perioden från kunder som är aktiva vid periodens slut.', 'Underlag och resultat här är exempel; saknat underlag är inte ett verifierat nollutfall.'] },
        { id: 'intro-3', title: 'Testa tillsammans', text: 'Använd demovyerna för att jämföra partnerns egna resultat med Kraftringens interna översikt. Alla exempeluppgifter och utbildningsframsteg ligger i din webbläsare.', bullets: ['Byt demovy och jämför intern resultatöversikt med partnerns egna resultat.', 'Kontrollera vad som visas i partnerns vy.', 'Två datorer delar ännu inte testdata.'] }
      ]
    },
    {
      id: 'dialogue', category: 'sales', title: 'Första kunddialogen', description: 'Förbered ett möte och fånga kundens viktigaste frågor.', image: 'assets/office.jpg', duration: '7 min',
      lessons: [
        { id: 'dialogue-1', title: 'Förbered mötet', text: 'Börja med vad kunden vill diskutera. I ett första möte behöver ni kunna enas om vilka frågor som ska tas vidare.', bullets: ['Vad vill företaget eller föreningen få hjälp med?', 'Vem behöver delta i nästa dialog?', 'Vilka uppgifter behöver ni klargöra tillsammans?'] },
        { id: 'dialogue-2', title: 'Dokumentera behovet', text: 'Sammanfatta kundens egna frågor och det ni faktiskt har kommit överens om. Undvik att fylla i antaganden som om de vore beslut.', bullets: ['Skriv en kort beskrivning av frågeställningen.', 'Skilj kundens önskemål från sådant som behöver undersökas.', 'Använd enbart påhittade kunduppgifter i utbildningens övningar.'] },
        { id: 'dialogue-3', title: 'Enas om nästa steg', text: 'Gör det lätt att fortsätta efter mötet. Dokumentera nästa kontakt och vilket underlag som behöver tas fram.', bullets: ['Vad ska hända härnäst?', 'Vem behöver delta eller återkomma?', 'När vill kunden fortsätta dialogen?'] }
      ]
    },
    {
      id: 'electric', category: 'electric', title: 'Elhandel – samla kundens underlag', description: 'Öva på frågorna inför en företagskunds elhandelsdialog.', image: 'assets/wind.jpg', duration: '8 min',
      lessons: [
        { id: 'electric-1', title: 'Kundens frågeställning', text: 'Kraftringens B2B-team arbetar med elavtal, portföljlösningar och prissäkring. Den här demokursen hjälper dig att strukturera en fråga till teamet.', bullets: ['Vad vill kunden förstå eller diskutera om sin elhandel?', 'Gäller frågan en verksamhet, flera anläggningar eller en BRF?', 'Dokumentera frågan i ert ordinarie säljverktyg så att nästa deltagare får sammanhanget.'] },
        { id: 'electric-2', title: 'Skilj fakta från antaganden', text: 'Uppgifter om kundens behov och nuvarande situation behöver bygga på kundens underlag. Ett tomt fält är bättre än en uppgift som ser verifierad ut men är ett antagande.', bullets: ['Markera vad kunden har lämnat och vad som fortfarande saknas.', 'Beskriv vilken fråga du behöver hjälp att reda ut.', 'Använd aktuellt produktunderlag och kontrollera vad kundens offert och avtal omfattar.'] },
        { id: 'electric-3', title: 'Ta frågan vidare', text: 'Förbered en tydlig sammanfattning inför fortsatt dialog i ert ordinarie säljverktyg. Portalen ger produktkunskap och övningar; den skapar inga offerter eller elavtal.', bullets: ['Samla kundens frågor på ett ställe.', 'Gå igenom vad som behöver verifieras före en offert.', 'Partnerns befogenheter och godkännanden är öppna beslut.'] }
      ]
    },
    {
      id: 'collaboration', category: 'partner', title: 'Nästa steg tillsammans', description: 'Samordna kunddialogen utanför portalen och använd utbildningsstödet här.', image: 'assets/solar.jpg', duration: '6 min',
      lessons: [
        { id: 'collaboration-1', title: 'Samlad återkoppling', text: 'Ett sammanhållet samarbete bygger på att deltagarna vet vad som har hänt och vad som väntar. Återkoppling om aktiva kundaffärer hanteras i era ordinarie kanaler utanför portalen.', bullets: ['Samla senaste återkopplingen från er ordinarie kunddialog.', 'Kom överens om nästa steg i ert ordinarie säljverktyg.', 'Använd portalens produktunderlag när en förklaring behöver repeteras.'] },
        { id: 'collaboration-2', title: 'Tydligt ansvar', text: 'Ansvar och aktiviteter i kundaffären hanteras utanför portalen. Portalens resultatvyer och utbildning ger stöd, men avgör inte hur ert partnersamarbete ska organiseras.', bullets: ['Vem samordnar nästa kundkontakt?', 'När behövs en intern avstämning?', 'Vilka aktiviteter får partnern göra på egen hand?'] },
        { id: 'collaboration-3', title: 'Förbättra arbetsflödet', text: 'Avsluta testet med ett konkret exempel på vad som fungerade och vad som behöver ändras. Det ger Ludwig och Håkan underlag för nästa version.', bullets: ['Vilken uppgift blev enklare att utföra?', 'Var behövde du mer information?', 'Vilken förändring skulle göra störst skillnad nästa gång?'] }
      ]
    }
  ];
  const consumerContent = {
    intro: {
      title: 'Kom igång med konsumentförsäljning', description: 'Förstå resultatvyerna och hitta utbildningsstöd för konsumentdialogen.',
      lessons: [
        { title: 'Din konsumentarbetsyta', text: 'Partnerns aktiva konsumentförsäljning sker utanför portalen. Här följer du egna exempelresultat, utforskar Insikter och övar på att förklara produkter och kundfrågor.', bullets: ['Öppna Kunder & avtal och se vilka exempelresultat som visas för din partner.', 'Utforska Insikter och jämför nya avtal med aktivt kundbestånd.', 'Repetera ett begrepp eller lyssna på ett eget samtalsexempel inför nästa kundmöte.'] },
        { title: 'Förstå ett resultat', text: 'Resultatvyerna visar manuella exempelutfall. Skilj nya avtal och aktivt kundbestånd åt, samt bortfall före start från churn efter att leveransen har börjat.', bullets: ['Välj en period och jämför de mått som finns i Kunder & avtal.', 'Skilj nya avtal under perioden från kunder som är aktiva vid periodens slut.', 'Underlag och resultat här är exempel; saknat underlag är inte ett verifierat nollutfall.'] },
        { title: 'Testa resultatvyerna', text: 'Använd demovyerna för att jämföra partnerns egna resultat med Kraftringens interna översikt. Alla exempeluppgifter och utbildningsframsteg ligger i din webbläsare.', bullets: ['Byt demovy och jämför intern resultatöversikt med partnerns egna resultat.', 'Kontrollera vad partnern kan läsa och följa upp.', 'Två datorer delar ännu inte testdata.'] }
      ]
    },
    dialogue: {
      title: 'Tydlig dialog med konsumenten', description: 'Fånga kundens frågor och gör nästa steg tydligt.',
      lessons: [
        { title: 'Lyssna på kundens fråga', text: 'Börja med vad kunden vill förstå om sin elhandel. Ta reda på vilka frågor som behöver förklaras innan kunden går vidare.', bullets: ['Vad vill kunden få hjälp att förstå?', 'Gäller frågan nuvarande bostad eller en flytt?', 'Vilken information behöver kunden inför nästa steg?'] },
        { title: 'Beskriv nästa steg tydligt', text: 'Skilj mellan information, ett insamlat underlag och ett ingånget avtal. Använd godkända produktuppgifter när sådant underlag har lämnats; demot innehåller inga skarpa villkor.', bullets: ['Sammanfatta vad kunden vill gå vidare med.', 'Markera frågor som du behöver få svar på från Kraftringen.', 'Använd enbart påhittade kontaktuppgifter i testet.'] },
        { title: 'Följ upp kunddialogen', text: 'Samla det ni har pratat om och det kunden fortfarande vill veta. En tydlig anteckning hjälper nästa person att fortsätta utan att kunden behöver börja om.', bullets: ['Vad behöver följas upp?', 'Hur vill kunden bli kontaktad?', 'Vilket nästa steg har ni pratat om?'] }
      ]
    },
    electric: {
      title: 'Elhandel – konsumentunderlag', description: 'Öva på att förstå konsumentens frågor och vad som behöver klargöras.',
      lessons: [
        { title: 'Förstå kundens situation', text: 'Ett tydligt kundunderlag ger sammanhang för fortsatt hantering i ert ordinarie säljverktyg. Här övar du på att förstå kundens fråga och skilja önskemål från bekräftade uppgifter.', bullets: ['Använd en fiktiv kund och adress.', 'Skilj önskat datum från ett bekräftat avtalsdatum.', 'Dokumentera kundens fråga i ert ordinarie säljverktyg.'] },
        { title: 'Granska underlaget', text: 'För in det kunden har lämnat och markera vad som är oklart. Fyll inte i gissningar som om de vore bekräftade uppgifter.', bullets: ['Kontrollera att adress och kontaktuppgifter stämmer i testexemplet.', 'Markera vilken uppgift som behöver kompletteras.', 'Priser och produktvillkor behöver godkänt underlag.'] },
        { title: 'Förbered nästa kunddialog', text: 'Gå igenom sammanfattningen i ert ordinarie säljverktyg innan kunddialogen fortsätter. Portalens utbildningsövningar hjälper dig att förklara; de skapar inga elavtal.', bullets: ['Läs igenom vad som har sparats.', 'Kontrollera vad som behöver återkoppling från Kraftringen.', 'Dokumentera ett tydligt nästa steg.'] }
      ]
    },
    collaboration: {
      title: 'Återkoppling och komplettering', description: 'Samordna kunddialogen utanför portalen och använd utbildningsstödet här.',
      lessons: [
        { title: 'Läs återkopplingen', text: 'Återkoppling om aktiva konsumentaffärer hanteras i era ordinarie kanaler utanför portalen. Samla vad som har hänt och vilken uppgift som behöver följas upp.', bullets: ['Samla senaste återkopplingen från er ordinarie kunddialog.', 'Se vilken fråga eller uppgift återkopplingen gäller.', 'Anteckna vad du behöver göra härnäst.'] },
        { title: 'Komplettera med rätt uppgift', text: 'Utgå från den fråga som behöver redas ut och dokumentera det nya underlaget. Ett genomfört teststeg är inte ett besked om ett verkligt avtal.', bullets: ['Ange den fiktiva uppgift som saknades.', 'Beskriv vad du har följt upp med kunden.', 'Markera vad som fortfarande behöver svar.'] },
        { title: 'Förbättra arbetsflödet', text: 'Avsluta övningen med ett konkret exempel på vad som fungerade och vad som behöver ändras. Det hjälper Ludwig och Håkan att utveckla stödet för konsumentförsäljning.', bullets: ['Var kunde du snabbt förstå nästa steg?', 'Vilken återkoppling behövde vara tydligare?', 'Vilken förändring skulle hjälpa mest i ett kundmöte?'] }
      ]
    }
  };
  const consumerCourses = businessCourses.map(course => {
    const content = consumerContent[course.id];
    return { ...course, ...content, lessons: course.lessons.map((lesson, index) => ({ ...lesson, ...content.lessons[index] })) };
  });
  const elakademin = window.PartnerElakademin;
  const academyCourse = elakademin ? {
    id: 'elakademin', category: 'electric', title: elakademin.title, description: elakademin.description,
    image: elakademin.cover, duration: `${elakademin.durationLabel} film`, realContent: true,
    lessons: elakademin.modules.map(module => ({ ...module, text: module.subtitle, bullets: module.takeaways }))
  } : null;
  const consumerPartner = () => {
    const segments = P.getPartner()?.salesAudiences || [];
    return segments.length === 1 && segments[0] === 'consumer';
  };
  const coursesForPartner = () => {
    const demos = consumerPartner() ? consumerCourses : businessCourses;
    return academyCourse && ['sales', 'field'].includes(P.getPartner()?.type) ? [academyCourse, ...demos] : demos;
  };
  function fullCourseHref() {
    const segments = P.getPartner()?.salesAudiences || [];
    const query = new URLSearchParams({ track: segments.length === 1 ? segments[0] : 'all', workspace: P.partner });
    if (P.demoMode) query.set('demo', 'inflyttning');
    return `elakademin.html?${query}#overview`;
  }
  const paths = {
    grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
    bolt: '<path d="m13 2-9 12h7l-1 8 10-13h-7l1-7Z"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m20 0v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/><circle cx="9" cy="7" r="4"/>',
    handshake: '<path d="m2 8 4-4 4 2h4l4-2 4 4-3 10-3-1-4 3-3-2-3-1-4-9Z"/><path d="m10 6-4 5 3 2 4-4 5 5m-7 3 3 2m0-5 3 2"/>',
    bookmark: '<path d="M6 3h12v18l-6-4-6 4V3Z"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    book: '<path d="M12 5v16M3 3l9 2 9-2v16l-9 2-9-2V3Z"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    arrow: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
    certificate: '<circle cx="12" cy="9" r="6"/><path d="m8 14-2 7 6-3 6 3-2-7m-7-5 2 2 4-4"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v1"/>',
    play: '<path d="m9 5 10 7-10 7V5Z" fill="currentColor" stroke="none"/>'
  };
  const icon = (name) => `<svg class="ac-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.book}</svg>`;
  let filter = 'all';
  const courseById = (id) => coursesForPartner().find(course => course.id === id);
  function training() {
    if (!P.state.training || typeof P.state.training !== 'object' || Array.isArray(P.state.training)) P.state.training = {};
    const key = P.partner || 'syd';
    let progress = P.state.training[key];
    if (!progress || typeof progress !== 'object' || Array.isArray(progress)) {
      progress = { completed: key === 'syd' ? { intro: ['intro-1', 'intro-2', 'intro-3'], dialogue: ['dialogue-1'], electric: [], collaboration: [] } : {}, bookmarks: key === 'syd' ? ['electric'] : [], webinarBooked: false };
      P.state.training[key] = progress;
    }
    if (!progress.completed || typeof progress.completed !== 'object' || Array.isArray(progress.completed)) progress.completed = {};
    if (!Array.isArray(progress.bookmarks)) progress.bookmarks = [];
    coursesForPartner().forEach(course => {
      if (!Array.isArray(progress.completed[course.id])) progress.completed[course.id] = [];
      progress.completed[course.id] = [...new Set(progress.completed[course.id].filter(id => course.lessons.some(lesson => lesson.id === id)))];
    });
    progress.bookmarks = [...new Set(progress.bookmarks.filter(id => courseById(id)))];
    return progress;
  }
  const completed = (course) => training().completed[course.id].length;
  const percent = (course) => Math.round(completed(course) / course.lessons.length * 100);
  P.academyStats = () => {
    const courses = coursesForPartner();
    const progress = training();
    const totalMoments = courses.reduce((count, course) => count + course.lessons.length, 0);
    const completedMoments = courses.reduce((count, course) => count + progress.completed[course.id].length, 0);
    return { totalCourses: courses.length, totalMoments, completedMoments, percent: Math.round(completedMoments / totalMoments * 100), completedCourses: courses.filter(course => completed(course) === course.lessons.length).length, ongoingCourses: courses.filter(course => completed(course) > 0 && completed(course) < course.lessons.length).length, bookmarkedCourses: progress.bookmarks.length };
  };
  function courseCard(course) {
    const marked = training().bookmarks.includes(course.id);
    const progress = percent(course);
    const category = categories.find(item => item.id === course.category);
    return `<article class="ac-course ${course.realContent ? 'ac-course-featured' : ''}"><div class="ac-course-image"><img src="${P.e(course.image)}" alt="" loading="lazy"><span class="ac-course-type">${course.realContent ? 'Elakademin · utbildningsmaterial' : P.e(category.label) + ' · demo'}</span><button class="ac-bookmark" data-ac-bookmark="${course.id}" aria-pressed="${marked}" aria-label="${marked ? 'Ta bort bokmärke för' : 'Bokmärk'} ${P.e(course.title)}">${icon('bookmark')}</button><button class="ac-course-play" data-ac-course="${course.id}" aria-label="Öppna ${P.e(course.title)}">${icon('play')}</button></div><div class="ac-course-body"><h3>${P.e(course.title)}</h3><p class="ac-course-description">${P.e(course.description)}</p>${course.realContent ? `<p class="ac-course-segment">${consumerPartner() ? 'Fördjupning i företagselhandel · företagsvillkor' : 'För kunddialogen med företag & BRF'}</p>` : ''}<div class="ac-course-meta"><span>${icon('clock')}${P.e(course.duration)}${course.realContent ? ' · svenskt tal · textat' : ' · demo'}</span><span>${icon('book')}${course.lessons.length} ${course.realContent ? 'kapitel' : 'moment'}</span></div><div class="ac-progress-line" aria-label="${progress} procent lokalt klarmarkerat"><span class="ac-progress-track"><span style="width:${progress}%"></span></span><b>${progress}%</b></div><button class="ac-button" data-ac-course="${course.id}">${progress === 100 ? 'Repetera kursen' : progress > 0 ? 'Fortsätt utbildningen' : 'Öppna utbildningen'} ${icon('arrow')}</button></div></article>`;
  }
  function fullCourseBanner() {
    const partner = typeof P.getPartner === 'function' ? P.getPartner() : null;
    if (!partner || !['sales', 'field'].includes(partner.type)) return '';
    const segments = Array.isArray(partner.salesAudiences) ? partner.salesAudiences.filter(segment => ['business', 'consumer'].includes(segment)) : [];
    const track = segments.length === 1 ? segments[0] : 'all';
    const segmentLabel = track === 'consumer' ? 'Privatkund · B2C' : track === 'business' ? 'Företag · B2B' : 'Företag och privatkund';
    return `<section class="ac-full-course" aria-labelledby="ac-full-course-title"><div><span class="ac-eyebrow">Elakademin · fördjupad självstudieutbildning</span><h2 id="ac-full-course-title">Förstå elen. Förklara affären.</h2><p>Elmarknadsgrunder, produkter och kunddialog – med genomräknade exempel, kundfall, ordlista och självtest med förklarat facit.</p><span class="ac-full-course-scope">${P.e(segmentLabel)} · eget spår efter kundsegment</span></div><a class="ac-button primary" href="${P.e(fullCourseHref())}">Öppna hela utbildningen ${icon('arrow')}</a></section>`;
  }
  function render() {
    const courses = coursesForPartner();
    const consumer = consumerPartner();
    const subtitle = consumer ? 'Kunddialog och underlag för konsumentelhandel.' : 'Kunddialog och underlag för företagsaffärer.';
    const heroCopy = 'Lär dig produkterna och öva på att förklara dem. Det aktiva säljarbetet sker utanför portalen.';
    const stats = P.academyStats();
    const progress = training();
    const visible = courses.filter(course => filter === 'all' || course.category === filter || (filter === 'bookmarked' && progress.bookmarks.includes(course.id)));
    return `<section class="academy-page" aria-labelledby="ac-title"><div class="ac-header"><div><span class="ac-eyebrow">Partner Academy</span><h1 id="ac-title">Utbildning</h1><p>${P.e(subtitle)}</p></div><span class="ac-demo-chip">Lokala framsteg</span></div><div class="ac-layout"><div class="ac-main"><section class="ac-hero" aria-label="Dina utbildningsframsteg"><img class="ac-hero-photo" src="assets/wind.jpg" alt="" fetchpriority="high"><div class="ac-hero-copy"><span class="ac-eyebrow">Kunskap. Dialog. Samarbete.</span><h2>Utveckla din kompetens.<br>Skapa värde i mötet.</h2><p>${P.e(heroCopy)}</p><button class="ac-button primary" id="ac-explore">Utforska utbildningar ${icon('arrow')}</button></div><div class="ac-hero-ring"><span>Dina klarmarkeringar</span><div class="ac-ring" style="--progress:${stats.percent}" aria-label="${stats.percent} procent av momenten lokalt klarmarkerade"><b>${stats.percent}%</b></div><small>${stats.completedMoments} av ${stats.totalMoments} moment<br>klarmarkerade lokalt</small></div></section>${fullCourseBanner()}${P.b2cCalls?.render() || ''}<div class="ac-section-title"><h2>Utbildningskategorier</h2><small>Välj vad du vill utforska</small></div><div class="ac-filters" aria-label="Filtrera utbildningar">${categories.map(category => `<button class="ac-filter" data-ac-filter="${category.id}" aria-pressed="${filter === category.id}">${icon(category.icon)}${P.e(category.label)}</button>`).join('')}</div><div class="ac-section-title" id="ac-course-heading"><h2>${filter === 'bookmarked' ? 'Dina bokmärken' : 'Utvalda utbildningar'}</h2><small>${visible.length} utbildningar</small></div><div class="ac-course-grid">${visible.length ? visible.map(courseCard).join('') : '<div class="ac-empty"><strong>Inga bokmärken ännu</strong>Tryck på bokmärket i ett kurskort för att spara kursen här.</div>'}</div><div class="ac-note">${icon('info')}<p>Den tidigare grundkursen nedan innehåller sex kapitelfilmer och självtest. Den nya fullständiga utbildningen öppnas ovan. De fyra övriga kurserna är demoinnehåll. Klarmarkeringar och testsvar sparas bara i denna webbläsare och ger ingen partnercertifiering.</p></div></div><aside class="ac-side" aria-label="Utbildningsöversikt"><section class="ac-panel"><h2>Mina framsteg</h2><dl class="ac-stats-list"><div><dt>${icon('check')}Klarmarkerade kurser</dt><dd>${stats.completedCourses}</dd></div><div><dt>${icon('clock')}Påbörjade kurser</dt><dd>${stats.ongoingCourses}</dd></div><div><dt>${icon('book')}Klarmarkerade moment</dt><dd>${stats.completedMoments} / ${stats.totalMoments}</dd></div><div><dt>${icon('bookmark')}Bokmärken</dt><dd>${stats.bookmarkedCourses}</dd></div></dl><p>Gäller ${P.e(P.partners[P.partner] || 'vald exempelpartner')} i denna webbläsare.</p></section><section class="ac-panel" id="ac-certifications"><h2>Certifieringar</h2><span class="ac-certificate-icon">${icon('certificate')}</span><span class="ac-cert-state">Underlag återstår</span><p>Här kan partnerns certifieringar samlas när ni har bestämt innehåll, bedömning och giltighet.</p><p class="ac-future">Klarmarkeringar och lokala självtest ger ingen partnercertifiering.</p></section><section class="ac-panel"><h2>Kommande genomgång</h2><div class="ac-webinar"><div class="ac-calendar-date" aria-hidden="true"><b>21</b><span>OKT</span></div><div><h3>Upptäck partnerportalen</h3><p>21 oktober 2026<br>10:00–10:30 · exempelaktivitet</p><button class="ac-button" id="ac-webinar" aria-pressed="${!!progress.webinarBooked}">${progress.webinarBooked ? `${icon('check')} Markerad i demo` : 'Testa anmälan'}</button></div></div><p class="ac-future">Anmälan sparas lokalt som ett test. Ingen mötesbokning skickas.</p></section></aside></div></section>`;
  }
  function quizAnswers(courseId) {
    const progress = training();
    if (!progress.selfTests || typeof progress.selfTests !== 'object' || Array.isArray(progress.selfTests)) progress.selfTests = {};
    if (!progress.selfTests[courseId] || typeof progress.selfTests[courseId] !== 'object' || Array.isArray(progress.selfTests[courseId])) progress.selfTests[courseId] = {};
    return progress.selfTests[courseId];
  }
  function quizAnswer(courseId, question) {
    const saved = quizAnswers(courseId)[question.id];
    return saved && Number.isInteger(saved.selectedIndex) && saved.selectedIndex >= 0 && saved.selectedIndex < question.options.length ? { ...saved, checked: saved.checked === true } : null;
  }
  function quizFeedback(question, answer) {
    if (!answer?.checked) return '';
    const correct = answer.selectedIndex === question.correctIndex;
    return `<strong>${correct ? 'Rätt svar.' : 'Prova att tänka ett varv till.'}</strong>${correct ? '' : `<p>Rätt svar: ${P.e(question.options[question.correctIndex])}</p>`}<p>${P.e(question.explanation)}</p>`;
  }
  function quizSummary(course) {
    const questions = course.lessons.flatMap(lesson => lesson.quiz || []);
    const checked = questions.filter(question => quizAnswer(course.id, question)?.checked);
    const correct = checked.filter(question => quizAnswer(course.id, question).selectedIndex === question.correctIndex);
    return `Självtest: ${correct.length} av ${questions.length} rätt · ${checked.length} frågor kontrollerade lokalt.`;
  }
  function renderQuiz(course, lesson) {
    return `<section class="ac-self-test" aria-labelledby="ac-self-test-title"><h4 id="ac-self-test-title">Testa din förståelse</h4><p>Ett självtest med återkoppling. Dina svar sparas lokalt för ${P.e(P.partners[P.partner])}; de klarmarkerar inte kapitlet.</p>${lesson.quiz.map((question, index) => {
      const answer = quizAnswer(course.id, question);
      return `<form class="ac-quiz" data-ac-quiz="${P.e(question.id)}"><fieldset><legend>${index + 1}. ${P.e(question.question)}</legend>${question.options.map((option, optionIndex) => `<label class="ac-quiz-option" for="ac-choice-${question.id}-${optionIndex}"><input type="radio" name="choice" id="ac-choice-${question.id}-${optionIndex}" value="${optionIndex}" required${answer?.selectedIndex === optionIndex ? ' checked' : ''}><span>${P.e(option)}</span></label>`).join('')}</fieldset><button class="ac-button" type="submit" data-ac-check="${question.id}">${answer?.checked ? 'Kontrollera igen' : 'Kontrollera svaret'}</button><div class="ac-quiz-feedback ${answer?.checked ? (answer.selectedIndex === question.correctIndex ? 'correct' : 'retry') : ''}" data-ac-feedback="${question.id}" role="status" aria-live="polite" tabindex="-1"${answer?.checked ? '' : ' hidden'}>${quizFeedback(question, answer)}</div></form>`;
    }).join('')}</section>`;
  }
  function bindQuiz(holder, course, lesson) {
    holder.querySelectorAll('[data-ac-quiz]').forEach(form => {
      const question = lesson.quiz.find(item => item.id === form.dataset.acQuiz);
      const feedback = form.querySelector('[data-ac-feedback]');
      const button = form.querySelector('[data-ac-check]');
      form.addEventListener('change', () => {
        const selectedIndex = Number(new FormData(form).get('choice'));
        if (!Number.isInteger(selectedIndex) || selectedIndex < 0 || selectedIndex >= question.options.length) return;
        quizAnswers(course.id)[question.id] = { selectedIndex, checked: false };
        P.save(); feedback.hidden = true; feedback.innerHTML = ''; button.textContent = 'Kontrollera svaret';
        holder.querySelector('#ac-self-test-progress').textContent = quizSummary(course);
      });
      form.addEventListener('submit', event => {
        event.preventDefault();
        const selectedIndex = Number(new FormData(form).get('choice'));
        if (!Number.isInteger(selectedIndex) || selectedIndex < 0 || selectedIndex >= question.options.length) return;
        const answer = { selectedIndex, checked: true };
        quizAnswers(course.id)[question.id] = answer; P.save();
        feedback.hidden = false; feedback.className = `ac-quiz-feedback ${selectedIndex === question.correctIndex ? 'correct' : 'retry'}`;
        feedback.innerHTML = quizFeedback(question, answer); button.textContent = 'Kontrollera igen';
        holder.querySelector('#ac-self-test-progress').textContent = quizSummary(course); feedback.focus();
      });
    });
  }
  function academyLesson(course, lesson) {
    return `<p class="ac-lesson-subtitle">${P.e(lesson.subtitle)}</p><figure class="ac-lesson-video"><video controls playsinline preload="metadata" poster="${P.e(lesson.video.poster)}" aria-label="Kapitelfilm: ${P.e(lesson.title)}" data-ac-video><source src="${P.e(lesson.video.url)}" type="video/mp4">Din webbläsare kan inte visa filmen här.</video><figcaption>${P.e(lesson.video.durationLabel)} · Svenskt tal · Inbränd svensk text <a href="${P.e(lesson.video.url)}" target="_blank" rel="noopener" aria-label="Öppna kapitelfilmen i en ny flik">Öppna filmen separat ${icon('arrow')}</a></figcaption><p class="ac-video-error" data-ac-video-error role="status" hidden>Filmen kunde inte laddas. Prova länken till filmen eller läs kapiteltexten nedan.</p></figure><details class="ac-transcript"><summary>Filmmanus – läs vad som sägs</summary>${lesson.script.split(/\n+/).map(paragraph => `<p>${P.e(paragraph)}</p>`).join('')}</details><div class="ac-reading">${lesson.sections.map(section => `<section><h4>${P.e(section.heading)}</h4>${section.body.map(paragraph => `<p>${P.e(paragraph)}</p>`).join('')}</section>`).join('')}</div><section class="ac-takeaways"><h4>Ta med dig</h4><ul>${lesson.takeaways.map(text => `<li>${P.e(text)}</li>`).join('')}</ul></section>${renderQuiz(course, lesson)}`;
  }
  function openCourse(id) {
    const course = courseById(id);
    if (!course) return;
    let activeLesson = course.lessons.findIndex(lesson => !training().completed[id].includes(lesson.id));
    if (activeLesson < 0) activeLesson = 0;
    const real = course.realContent;
    const scopeNote = consumerPartner() ? 'Elmarknadsgrunderna kan användas som bakgrundskunskap. Företagsexemplen och portföljprodukterna gäller företagskunder och är separat fördjupning för en konsumentsäljare. De beskriver inte konsumentvillkor eller konsumenterbjudanden.' : 'Utbildningen använder ett fiktivt företag för att förklara elhandel och portföljprodukter. Räkneexemplen är inga offerter; aktuella villkor gäller för varje kund.';
    const resources = real ? `<div class="ac-b2b-note"><strong>${consumerPartner() ? 'Fördjupning i företagselhandel' : 'Företagselhandel · för kunddialogen'}</strong><p>${scopeNote}</p></div><div class="ac-resources"><a class="ac-button" href="${P.e(fullCourseHref())}" target="_blank" rel="noopener" aria-label="Öppna hela Elakademin i en ny flik">Hela Elakademin ${icon('arrow')}</a><a class="ac-button" href="${P.e(elakademin.guideUrl)}" target="_blank" rel="noopener" aria-label="Öppna kundguiden som PDF i en ny flik">Kundguide · PDF ${icon('book')}</a><p>Räkneverktyg, ordlista och självtest finns i hela Elakademin. Framstegen där sparas separat från partnerportalen.</p></div>` : '';
    const mountHtml = `<div class="academy-page"><p class="ac-dialog-intro">${real ? 'Sex kapitelfilmer, kapiteltext och tolv frågor. Se filmen, läs i din egen takt och testa din förståelse.' : 'Läs ett kort demomoment och testa att markera det klart.'}</p>${resources}<div id="academy-dialog-mount"></div>${real ? `<details class="ac-source-list"><summary>Källor och aktuella produktvillkor</summary><ul>${elakademin.sources.map(source => `<li><a href="${P.e(source.url)}" target="_blank" rel="noopener">${P.e(source.title)}</a></li>`).join('')}</ul></details>` : ''}<p class="ac-dialog-note">${real ? 'Klarmarkeringar och testsvar sparas lokalt för vald partner. Klarmarkering är din egen uppföljning och verifierar inte filmvisning, slutprov eller partnercertifiering.' : 'Demoinnehåll för att testa portalen. Framsteg sparas i denna webbläsare för vald exempelpartner. Klarmarkering ger inget kunskapsintyg eller certifikat.'}</p></div>`;
    const mount = () => {
      const holder = document.querySelector('#academy-dialog-mount');
      if (!holder) return;
      holder.querySelectorAll('video,audio').forEach(media => media.pause());
      const progress = training();
      const lesson = course.lessons[activeLesson];
      const done = progress.completed[id].includes(lesson.id);
      holder.innerHTML = `<div class="ac-dialog-body"><div class="ac-lesson-aside"><nav class="ac-lesson-menu" aria-label="${real ? 'Kapitel' : 'Moment'} i utbildningen">${course.lessons.map((item, index) => `<button class="ac-lesson-nav ${index === activeLesson ? 'active' : ''}" data-ac-lesson="${index}" ${index === activeLesson ? 'aria-current="step"' : ''}><span class="ac-lesson-number ${progress.completed[id].includes(item.id) ? 'complete' : ''}">${progress.completed[id].includes(item.id) ? '✓' : index + 1}</span>${P.e(item.title)}</button>`).join('')}</nav><p class="ac-dialog-progress" id="ac-course-progress">${completed(course)} av ${course.lessons.length} ${real ? 'kapitel' : 'moment'} klarmarkerade</p>${real ? `<p class="ac-dialog-progress" id="ac-self-test-progress">${quizSummary(course)}</p>` : ''}</div><article class="ac-lesson-copy"><span class="ac-demo-chip">${real ? 'Kapitel' : 'Moment'} ${activeLesson + 1} av ${course.lessons.length}${real ? ` · ${P.e(lesson.video.durationLabel)}` : ' · demoinnehåll'}</span><h3 tabindex="-1" id="ac-lesson-title">${P.e(lesson.title)}</h3>${real ? academyLesson(course, lesson) : `<p>${P.e(lesson.text)}</p><ul>${lesson.bullets.map(text => `<li>${P.e(text)}</li>`).join('')}</ul>`}<p class="ac-completion" id="ac-completion"${done ? '' : ' hidden'}>✓ Du har markerat detta ${real ? 'kapitel' : 'demomoment'} klart.</p><div class="ac-lesson-actions"><button class="ac-button ${done ? '' : 'primary'}" id="ac-complete">${done ? 'Ångra klarmarkering' : `${icon('check')} Markera ${real ? 'kapitlet' : 'momentet'} klart`}</button>${activeLesson < course.lessons.length - 1 ? `<button class="ac-button" id="ac-next-lesson">Nästa ${real ? 'kapitel' : 'moment'} ${icon('arrow')}</button>` : '<button class="ac-button" id="ac-close-course">Till utbildningarna</button>'}</div></article></div>`;
      holder.querySelectorAll('[data-ac-lesson]').forEach(button => button.addEventListener('click', () => {
        activeLesson = Number(button.dataset.acLesson); mount(); document.querySelector('#ac-lesson-title')?.focus();
      }));
      holder.querySelector('#ac-complete').addEventListener('click', () => {
        const values = training().completed[id];
        const wasDone = values.includes(lesson.id);
        training().completed[id] = wasDone ? values.filter(value => value !== lesson.id) : [...values, lesson.id];
        const saved = P.save(); P.render();
        holder.querySelectorAll('[data-ac-lesson]').forEach(button => {
          const index = Number(button.dataset.acLesson);
          const number = button.querySelector('.ac-lesson-number');
          const marked = training().completed[id].includes(course.lessons[index].id);
          number.classList.toggle('complete', marked); number.textContent = marked ? '✓' : index + 1;
        });
        holder.querySelector('#ac-course-progress').textContent = `${completed(course)} av ${course.lessons.length} ${real ? 'kapitel' : 'moment'} klarmarkerade`;
        holder.querySelector('#ac-completion').hidden = wasDone;
        const completeButton = holder.querySelector('#ac-complete');
        completeButton.classList.toggle('primary', wasDone);
        completeButton.innerHTML = !wasDone ? 'Ångra klarmarkering' : `${icon('check')} Markera ${real ? 'kapitlet' : 'momentet'} klart`;
        document.querySelector('#ac-complete')?.focus();
        P.toast(saved ? wasDone ? 'Klarmarkeringen borttagen.' : real ? 'Kapitlet klarmarkerat lokalt. Självtest och slutprov bedöms separat.' : 'Demomomentet klarmarkerat. Dina framsteg har sparats lokalt.' : 'Klarmarkeringen kunde inte sparas. Ändringen gäller under detta besök.');
      });
      holder.querySelector('#ac-next-lesson')?.addEventListener('click', () => {
        activeLesson += 1; mount(); document.querySelector('#ac-lesson-title')?.focus();
      });
      holder.querySelector('#ac-close-course')?.addEventListener('click', () => P.closeDialog());
      if (real) {
        bindQuiz(holder, course, lesson);
        const video = holder.querySelector('[data-ac-video]');
        const revealError = () => { holder.querySelector('[data-ac-video-error]').hidden = false; };
        video?.addEventListener('error', revealError);
        video?.querySelectorAll('source').forEach(source => source.addEventListener('error', revealError));
        if (video?.error || video?.networkState === 3) revealError();
      }
    };
    const dialog = document.querySelector('#portal-dialog');
    dialog?.classList.toggle('ac-elakademin-dialog', !!real);
    P.openDialog(course.title, mountHtml, mount);
    dialog?.addEventListener('close', () => {
      dialog.querySelectorAll('video').forEach(video => video.pause());
      dialog.classList.remove('ac-elakademin-dialog');
      document.querySelector(`[data-ac-course="${id}"]`)?.focus();
    }, { once: true });
  }
  function bind() {
    const view = document.querySelector('#view');
    if (!view) return;
    P.b2cCalls?.bind();
    view.querySelectorAll('[data-ac-filter]').forEach(button => button.addEventListener('click', () => {
      filter = button.dataset.acFilter; P.render();
      document.querySelector(`[data-ac-filter="${filter}"]`)?.focus();
    }));
    view.querySelectorAll('[data-ac-course]').forEach(button => button.addEventListener('click', () => openCourse(button.dataset.acCourse)));
    view.querySelectorAll('[data-ac-bookmark]').forEach(button => button.addEventListener('click', () => {
      const id = button.dataset.acBookmark;
      const progress = training();
      const hasBookmark = progress.bookmarks.includes(id);
      progress.bookmarks = hasBookmark ? progress.bookmarks.filter(value => value !== id) : [...progress.bookmarks, id];
      const saved = P.save(); P.render();
      const restored = document.querySelector(`[data-ac-bookmark="${id}"]`);
      (restored || document.querySelector('[data-ac-filter="bookmarked"]'))?.focus();
      P.toast(saved ? hasBookmark ? 'Bokmärket borttaget.' : 'Utbildningen bokmärkt i denna webbläsare.' : 'Bokmärket kunde inte sparas. Ändringen gäller under detta besök.');
    }));
    view.querySelector('#ac-explore')?.addEventListener('click', () => {
      const heading = document.querySelector('#ac-course-heading');
      heading.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
      document.querySelector('[data-ac-filter="all"]')?.focus({ preventScroll: true });
    });
    view.querySelector('#ac-webinar')?.addEventListener('click', () => {
      training().webinarBooked = !training().webinarBooked;
      const saved = P.save(); P.render(); document.querySelector('#ac-webinar')?.focus();
      P.toast(saved ? training().webinarBooked ? 'Exempelaktiviteten markerad. Ingen mötesbokning har skickats.' : 'Testanmälan borttagen.' : 'Testanmälan kunde inte sparas. Ändringen gäller under detta besök.');
    });
  }
  P.register('academy', { render, bind });
})();
