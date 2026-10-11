(() => {
  'use strict';
  const P = window.Portal;
  if (!P) return;
  const DB_NAME = 'partnerlabb.b2cCallExamples.v1';
  const STORE = 'calls';
  const LIMIT = 50 * 1024 * 1024;
  const categories = { opening: 'En bra öppning', needs: 'Förstå kundens behov', objections: 'Bemöta en invändning', 'next-step': 'Ett tydligt nästa steg' };
  const types = { mp3: 'audio/mpeg', m4a: 'audio/mp4', wav: 'audio/wav', ogg: 'audio/ogg', webm: 'audio/webm' };
  const e = P.e;
  const scope = () => P.demoMode ? 'customer-demo' : 'normal';
  const context = () => ({ scope: scope(), partner: P.partner });
  const sameContext = value => value.scope === scope() && value.partner === P.partner;
  const eligible = (partner = P.getPartner()) => !!partner && ['sales', 'field'].includes(partner.type) && partner.salesAudiences?.includes('consumer');
  const formatSize = bytes => `${new Intl.NumberFormat('sv-SE', { maximumFractionDigits: 1 }).format(bytes / (1024 * 1024))} MB`;
  const formatDuration = seconds => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
  const icon = name => P.icon(name);
  let databasePromise;
  let currentList;
  let dialogSession;
  let dialogIntent = 0;

  function openDatabase() {
    if (!window.indexedDB) return Promise.reject(new Error('Ljudlagring stöds inte i denna webbläsare.'));
    if (databasePromise) return databasePromise;
    databasePromise = new Promise((resolve, reject) => {
      let request;
      let settled = false;
      const timeout = setTimeout(() => fail(new Error('Ljudlagringen svarade inte. Stäng andra portalflikar och försök igen.')), 8000);
      const fail = error => { if (!settled) { settled = true; clearTimeout(timeout); reject(error); } };
      try { request = indexedDB.open(DB_NAME, 1); } catch (error) { fail(error); return; }
      request.onupgradeneeded = () => {
        const store = request.result.createObjectStore(STORE, { keyPath: 'id' });
        store.createIndex('scopePartner', ['scope', 'partner']);
        store.createIndex('scope', 'scope');
      };
      request.onerror = () => fail(request.error);
      request.onblocked = () => fail(new Error('Stäng andra portalflikar och försök igen.'));
      request.onsuccess = () => {
        if (settled) { request.result.close(); return; }
        settled = true; clearTimeout(timeout);
        const db = request.result;
        db.onversionchange = () => { db.close(); databasePromise = undefined; };
        resolve(db);
      };
    }).catch(error => { databasePromise = undefined; throw error; });
    return databasePromise;
  }
  async function transaction(mode, work, guard, cancelers) {
    const db = await openDatabase();
    if (guard && !guard()) throw new DOMException('Samtalsåtgärden avbröts när vyn ändrades.', 'AbortError');
    return new Promise((resolve, reject) => {
      let tx, value;
      const cancel = () => { try { tx?.abort(); } catch {} };
      const cleanup = () => cancelers?.delete(cancel);
      try { tx = db.transaction(STORE, mode); work(tx.objectStore(STORE), result => { value = result; }); }
      catch (error) { try { tx?.abort(); } catch {} reject(error); return; }
      cancelers?.add(cancel);
      tx.oncomplete = () => { cleanup(); resolve(value); };
      tx.onerror = () => { cleanup(); reject(tx.error || new Error('Ljudlagringen misslyckades.')); };
      tx.onabort = () => { cleanup(); reject(tx.error || new Error('Ljudlagringen avbröts.')); };
    });
  }
  const listRecords = value => transaction('readonly', (store, done) => {
    const result = [];
    const request = store.index('scopePartner').openCursor(IDBKeyRange.only([value.scope, value.partner]));
    request.onsuccess = () => {
      const cursor = request.result;
      if (cursor) { const { audio, ...metadata } = cursor.value; result.push(metadata); cursor.continue(); }
      else done(result.sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || ''))));
    };
  });
  const getRecord = (id, value) => transaction('readonly', (store, done) => {
    const request = store.get(id);
    request.onsuccess = () => done(request.result?.scope === value.scope && request.result?.partner === value.partner ? request.result : undefined);
  });
  const saveRecord = (record, guard, cancelers) => transaction('readwrite', (store, done) => { store.add(record); done(record); }, guard, cancelers);
  const recordConflict = Symbol('record-conflict');
  const conflictMessage = 'Samtalsexemplet har ändrats i en annan flik. Stäng dialogen och öppna det igen för att arbeta med senaste versionen.';
  const matchesSnapshot = (row, expected) => ['updatedAt', 'title', 'category', 'note'].every(key => row[key] === expected[key]);
  const updateRecord = (id, value, fields, guard, cancelers, expected) => transaction('readwrite', (store, done) => {
    const request = store.get(id);
    request.onsuccess = () => {
      const row = request.result;
      if (!row || row.scope !== value.scope || row.partner !== value.partner) { done(undefined); return; }
      if (!matchesSnapshot(row, expected)) { done(recordConflict); return; }
      const updated = { ...row, ...fields, updatedAt: new Date().toISOString() };
      store.put(updated); done(updated);
    };
  }, guard, cancelers);
  const deleteRecord = (id, value, guard, cancelers, expected) => transaction('readwrite', (store, done) => {
    const request = store.get(id);
    request.onsuccess = () => {
      if (request.result?.scope === value.scope && request.result?.partner === value.partner) {
        if (!matchesSnapshot(request.result, expected)) { done(recordConflict); return; }
        store.delete(id); done(true);
      }
      else done(false);
    };
  }, guard, cancelers);
  const storageMessage = error => error?.name === 'QuotaExceededError' ? 'Webbläsarens lagringsutrymme är fullt. Ta bort ett tidigare samtal eller välj en mindre ljudfil och försök igen.' : `Webbläsaren kunde inte spara eller läsa samtalet. ${error?.message?.startsWith('Stäng andra') ? error.message : 'Försök igen; dina tidigare exempel har inte ändrats.'}`;

  function render() {
    if (!eligible()) return '';
    const value = context();
    return `<section class="b2c-call-library" id="b2c-call-library" data-b2c-scope="${value.scope}" data-b2c-partner="${e(value.partner)}" aria-labelledby="b2c-call-heading"><div class="b2c-call-heading"><span class="b2c-call-symbol">${icon('headphones')}</span><div><span class="ac-eyebrow">Lyssna. Lär. Prova själv.</span><h2 id="b2c-call-heading">Lyckade B2C-samtal</h2><p>Samla bra telefonsamtal och lyft det som gör kunddialogen lyckad.</p></div><button type="button" class="ac-button primary" id="b2c-call-upload">${icon('plus')} Lägg till ett samtal</button></div><p class="b2c-call-scope">Sparas i den här webbläsaren för ${e(P.getPartner()?.name || 'vald partner')}. Använd fiktiva eller anonymiserade samtal som får delas i utbildningen.</p><div class="b2c-call-toolbar"><label class="b2c-call-search">${icon('search')}<span class="sr-only">Sök bland samtalsexempel</span><input type="search" id="b2c-call-search" placeholder="Sök efter ett samtal eller ett tips" maxlength="120"></label><label class="b2c-call-category"><span class="sr-only">Filtrera samtalsexempel efter fokus</span><select id="b2c-call-category"><option value="all">Alla fokusområden</option>${Object.entries(categories).map(([key, label]) => `<option value="${key}">${e(label)}</option>`).join('')}</select></label></div><p class="b2c-call-status" id="b2c-call-status" role="status" aria-live="polite">Hämtar dina lokala samtalsexempel…</p><div id="b2c-call-results" class="b2c-call-results" aria-busy="true"></div></section>`;
  }
  function listAlive(model) { return currentList === model && model.root.isConnected && sameContext(model.context) && eligible() && P.page === 'academy'; }
  function drawList(model) {
    if (!listAlive(model)) return;
    const query = model.search.value.trim().toLocaleLowerCase('sv-SE');
    const category = model.category.value;
    const visible = model.records.filter(row => (category === 'all' || row.category === category) && (!query || `${row.title} ${row.note} ${categories[row.category] || ''}`.toLocaleLowerCase('sv-SE').includes(query)));
    model.results.setAttribute('aria-busy', 'false');
    model.status.textContent = model.records.length ? `${visible.length} av ${model.records.length} samtalsexempel` : 'Inga samtalsexempel ännu';
    model.results.innerHTML = visible.length ? visible.map(row => `<article class="b2c-call-card" data-b2c-call="${e(row.id)}"><div class="b2c-call-card-meta"><span>${e(categories[row.category] || 'Kunddialog')}</span><small>${formatDuration(row.duration)} · ${formatSize(row.size)}</small></div><h3>${e(row.title)}</h3><p class="b2c-call-coaching">${e(row.note)}</p><div class="b2c-call-card-bottom"><button class="ac-button b2c-call-listen" type="button" data-b2c-listen="${e(row.id)}" aria-label="Lyssna på ${e(row.title)}">${icon('headphones')} Lyssna & lär</button><div class="b2c-call-card-actions"><button type="button" data-b2c-edit="${e(row.id)}" aria-label="Redigera ${e(row.title)}">Redigera</button><button type="button" data-b2c-delete="${e(row.id)}" aria-label="Ta bort ${e(row.title)}">Ta bort</button></div></div></article>`).join('') : `<div class="b2c-call-empty"><span>${icon(model.records.length ? 'search' : 'headphones')}</span><h3>${model.records.length ? 'Inga samtal matchar ditt urval' : 'Det bästa sättet att lära är att lyssna'}</h3><p>${model.records.length ? 'Prova ett annat sökord eller välj alla fokusområden.' : 'Lägg till ett lyckat samtal och skriv vad kollegorna kan lära av det. Dina egna exempel visas här.'}</p>${model.records.length ? '<button class="ac-button" type="button" data-b2c-reset-filters>Återställ sökning och filter</button>' : '<button class="ac-button" type="button" data-b2c-empty-upload>Lägg till det första samtalet</button>'}</div>`;
  }
  async function refreshList(model = currentList) {
    if (!model || !listAlive(model)) return;
    const request = ++model.request;
    model.results.setAttribute('aria-busy', 'true');
    try {
      const records = await listRecords(model.context);
      if (!listAlive(model) || request !== model.request) return;
      model.records = records; drawList(model);
    } catch (error) {
      if (!listAlive(model) || request !== model.request) return;
      model.results.setAttribute('aria-busy', 'false');
      model.status.textContent = 'Samtalsexemplen kunde inte hämtas.';
      model.results.innerHTML = `<div class="b2c-call-empty b2c-call-error" role="alert"><h3>Lokal ljudlagring är inte tillgänglig</h3><p>${e(storageMessage(error))}</p><button class="ac-button" type="button" data-b2c-retry>Försök igen</button></div>`;
    }
  }
  function bind() {
    const root = document.querySelector('#b2c-call-library');
    if (!root || !eligible()) { currentList = undefined; return; }
    const model = currentList = { root, context: context(), records: [], request: 0, search: root.querySelector('#b2c-call-search'), category: root.querySelector('#b2c-call-category'), status: root.querySelector('#b2c-call-status'), results: root.querySelector('#b2c-call-results') };
    model.search.addEventListener('input', () => drawList(model));
    model.category.addEventListener('change', () => drawList(model));
    root.addEventListener('click', event => {
      const button = event.target.closest('button');
      if (!button || !listAlive(model)) return;
      if (button.id === 'b2c-call-upload' || button.hasAttribute('data-b2c-empty-upload')) openEditor(undefined, model.context);
      else if (button.hasAttribute('data-b2c-reset-filters')) { model.search.value = ''; model.category.value = 'all'; drawList(model); model.search.focus(); }
      else if (button.hasAttribute('data-b2c-retry')) refreshList(model);
      else if (button.dataset.b2cListen) openPlayer(button.dataset.b2cListen, model.context);
      else if (button.dataset.b2cEdit) openExistingEditor(button.dataset.b2cEdit, model.context);
      else if (button.dataset.b2cDelete) openDelete(button.dataset.b2cDelete, model.context);
    });
    refreshList(model);
  }

  function releaseMedia(session) {
    session.cancelers.forEach(cancel => cancel()); session.cancelers.clear();
    session.root?.querySelectorAll('audio').forEach(audio => { audio.pause(); audio.removeAttribute('src'); audio.load(); });
    session.urls.forEach(url => URL.revokeObjectURL(url)); session.urls.clear();
  }
  function disposeSession(restoreFocus = false) {
    const session = dialogSession;
    if (!session) return;
    dialogSession = undefined; session.disposed = true; releaseMedia(session);
    if (restoreFocus && sameContext(session.context) && P.page === 'academy') document.querySelector(session.returnSelector || '#b2c-call-upload')?.focus();
  }
  function sessionAlive(session) { return dialogSession === session && !session.disposed && session.root.isConnected && document.querySelector('#portal-dialog').open && sameContext(session.context) && eligible() && P.page === 'academy'; }
  function managedDialog(title, content, value, returnSelector) {
    dialogIntent++;
    disposeSession();
    P.openDialog(title, `<div class="b2c-call-dialog" id="b2c-call-dialog">${content}</div>`);
    const session = dialogSession = { root: document.querySelector('#b2c-call-dialog'), context: { ...value }, urls: new Set(), cancelers: new Set(), disposed: false, returnSelector };
    return session;
  }
  function showError(session, message) {
    if (!sessionAlive(session)) return;
    const target = session.root.querySelector('#b2c-call-form-error');
    if (target) { target.textContent = message; target.hidden = false; target.focus(); }
  }
  const hideError = session => { const target = session.root.querySelector('#b2c-call-form-error'); if (target) { target.hidden = true; target.textContent = ''; } };
  const errorHtml = '<p class="b2c-call-form-error" id="b2c-call-form-error" role="alert" tabindex="-1" hidden></p>';
  async function validateAudio(file, session, guard) {
    if (!file?.size) throw new Error('Välj en ljudfil som innehåller ett samtal.');
    if (file.size > LIMIT) throw new Error('Ljudfilen får vara högst 50 MB. Välj en mindre fil.');
    const extension = file.name.split('.').pop().toLowerCase();
    if (!types[extension]) throw new Error('Välj en ljudfil i MP3-, M4A-, WAV-, OGG- eller WebM-format.');
    const bytes = new Uint8Array(await file.slice(0, 64).arrayBuffer());
    if (!sessionAlive(session) || !guard()) throw new DOMException('Ljudkontrollen avbröts.', 'AbortError');
    const text = (start, end) => String.fromCharCode(...bytes.slice(start, end));
    const signature = extension === 'mp3' ? text(0, 3) === 'ID3' || bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0
      : extension === 'wav' ? text(0, 4) === 'RIFF' && text(8, 12) === 'WAVE'
      : extension === 'm4a' ? text(4, 8) === 'ftyp'
      : extension === 'ogg' ? text(0, 4) === 'OggS'
      : bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3;
    if (!signature) throw new Error('Filen verkar inte innehålla ljud i det angivna formatet. Välj en annan inspelning.');
    const audio = new Blob([file], { type: types[extension] });
    const url = URL.createObjectURL(audio);
    try {
      const duration = await new Promise((resolve, reject) => {
        const probe = document.createElement('audio');
        let settled = false;
        const cancel = () => finish(new DOMException('Ljudkontrollen avbröts.', 'AbortError'));
        const finish = (error, duration) => { if (settled) return; settled = true; clearTimeout(timeout); session.cancelers.delete(cancel); probe.onloadedmetadata = null; probe.ondurationchange = null; probe.ontimeupdate = null; probe.onerror = null; probe.pause(); probe.removeAttribute('src'); probe.load(); error ? reject(error) : resolve(duration); };
        const timeout = setTimeout(() => finish(new Error('Ljudfilen kunde inte läsas. Prova en annan inspelning, gärna MP3 eller WAV.')), 10000);
        session.cancelers.add(cancel);
        probe.preload = 'metadata';
        const readDuration = () => { if (Number.isFinite(probe.duration) && probe.duration > 0) finish(undefined, probe.duration); };
        probe.ondurationchange = readDuration;
        probe.ontimeupdate = readDuration;
        probe.onloadedmetadata = () => {
          if (Number.isFinite(probe.duration) && probe.duration > 0) { readDuration(); return; }
          // Streamed WebM files often omit duration. Seeking discovers the end
          // without playing the recording; the existing timeout/cancel still applies.
          if (probe.duration === Infinity) { try { probe.currentTime = 1e10; return; } catch {} }
          finish(new Error('Ljudfilens längd kunde inte läsas. Exportera inspelningen som MP3 eller WAV och prova igen.'));
        };
        probe.onerror = () => finish(new Error('Ljudformatet kan inte spelas i denna webbläsare. Prova en MP3- eller WAV-fil.'));
        probe.src = url; probe.load();
      });
      return { audio, duration, fileName: file.name, size: file.size, mime: types[extension] };
    } finally { URL.revokeObjectURL(url); }
  }
  function fields(row) {
    return `<label class="field">Rubrik *<input id="b2c-call-title" name="title" required maxlength="100" value="${e(row?.title || '')}" placeholder="Exempel: en tydlig start på kunddialogen"></label><label class="field">Vad vill du lyfta? *<select id="b2c-call-focus" name="category">${Object.entries(categories).map(([key, label]) => `<option value="${key}"${row?.category === key ? ' selected' : ''}>${e(label)}</option>`).join('')}</select></label><label class="field">Vad fungerade bra? *<textarea id="b2c-call-note" name="note" required rows="4" maxlength="1500" placeholder="Beskriv det kollegorna ska lyssna efter, till exempel hur säljaren ställer en öppen fråga och sammanfattar kundens behov.">${e(row?.note || '')}</textarea></label>`;
  }
  function openEditor(row, value) {
    if (!sameContext(value) || !eligible()) return;
    const session = managedDialog(row ? 'Redigera samtalsexemplet' : 'Lägg till ett lyckat B2C-samtal', `<p class="b2c-call-dialog-intro">${row ? 'Uppdatera rubriken och tipset till den som lyssnar. Ljudinspelningen behålls.' : 'Välj en inspelning och berätta vad kollegorna kan lära av samtalet.'}</p><p class="b2c-call-dialog-scope">Använd fiktiva eller anonymiserade samtal som får delas i utbildningen. Inspelningen sparas bara i den här webbläsaren.</p><form id="b2c-call-form">${fields(row)}${row ? `<p class="b2c-call-file-info">Befintlig inspelning · ${formatDuration(row.duration)} · ${formatSize(row.size)}</p>` : '<label class="field b2c-call-file-field">Ljudinspelning *<input id="b2c-call-file" name="audio" type="file" accept=".mp3,.m4a,.wav,.ogg,.webm,audio/mpeg,audio/mp4,audio/wav,audio/ogg,audio/webm" required aria-describedby="b2c-call-file-help"><small id="b2c-call-file-help">MP3, M4A, WAV, OGG eller WebM. Högst 50 MB.</small></label><p id="b2c-call-file-status" class="b2c-call-file-info" role="status" aria-live="polite"></p><audio id="b2c-call-preview" controls preload="metadata" aria-label="Förhandslyssna på vald inspelning" hidden></audio>'}${errorHtml}<div class="modal-actions"><button type="button" class="btn btn-secondary" id="b2c-call-cancel">Avbryt</button><button type="submit" class="btn btn-primary" id="b2c-call-submit"${row ? '' : ' disabled'}>${row ? 'Spara ändringar' : 'Spara samtalsexemplet'}</button></div></form>`, value, row ? `[data-b2c-edit="${row.id}"]` : '#b2c-call-upload');
    const form = session.root.querySelector('#b2c-call-form');
    const submit = form.querySelector('#b2c-call-submit');
    let candidate;
    let checking = 0;
    let saving = false;
    session.root.querySelector('#b2c-call-cancel').onclick = P.closeDialog;
    form.querySelector('#b2c-call-file')?.addEventListener('change', async event => {
      const revision = ++checking;
      candidate = undefined; submit.disabled = true; hideError(session);
      releaseMedia(session);
      const preview = session.root.querySelector('#b2c-call-preview'); preview.hidden = true;
      const status = session.root.querySelector('#b2c-call-file-status');
      const file = event.target.files[0];
      if (!file) { status.textContent = ''; return; }
      status.textContent = 'Kontrollerar inspelningen…';
      try {
        const result = await validateAudio(file, session, () => checking === revision);
        if (!sessionAlive(session) || checking !== revision) return;
        candidate = result;
        status.textContent = `Redo att sparas · ${formatDuration(result.duration)} · ${formatSize(result.size)}`;
        const url = URL.createObjectURL(result.audio); session.urls.add(url);
        preview.src = url; preview.hidden = false; submit.disabled = false;
      } catch (error) {
        if (!sessionAlive(session) || checking !== revision) return;
        status.textContent = 'Inspelningen behöver bytas.'; showError(session, error.message);
      }
    });
    form.addEventListener('submit', async event => {
      event.preventDefault();
      if (saving || !sessionAlive(session) || !form.reportValidity()) return;
      if (!P.validText(form.elements.title) || !P.validText(form.elements.note)) return;
      if (!categories[form.elements.category.value]) return;
      if (!row && !candidate) { showError(session, 'Välj en ljudinspelning som går att spela.'); return; }
      hideError(session); saving = true; submit.disabled = true; submit.textContent = 'Sparar…';
      const metadata = { title: form.elements.title.value.trim(), category: form.elements.category.value, note: form.elements.note.value.trim() };
      try {
        const now = new Date().toISOString();
        const saved = row ? await updateRecord(row.id, value, metadata, () => sessionAlive(session), session.cancelers, row) : await saveRecord({ id: crypto.randomUUID(), ...value, ...metadata, ...candidate, createdAt: now, updatedAt: now }, () => sessionAlive(session), session.cancelers);
        if (!sessionAlive(session)) return;
        if (saved === recordConflict) { showError(session, conflictMessage); return; }
        if (!saved) { showError(session, 'Samtalet finns inte längre. Stäng dialogen och uppdatera listan.'); return; }
        await finishMutation(session, row ? 'Samtalsexemplet är uppdaterat i den här webbläsaren.' : 'Samtalsexemplet är sparat i den här webbläsaren.');
      } catch (error) { showError(session, storageMessage(error)); }
      finally { saving = false; if (sessionAlive(session)) { submit.disabled = false; submit.textContent = row ? 'Spara ändringar' : 'Spara samtalsexemplet'; } }
    });
    form.elements.title.focus();
  }
  async function loadExisting(id, value) {
    const intent = ++dialogIntent;
    const dialogContents = document.querySelector('#dialog-body').firstElementChild;
    try {
      const row = await getRecord(id, value);
      if (intent !== dialogIntent || dialogContents !== document.querySelector('#dialog-body').firstElementChild || !sameContext(value) || !eligible() || P.page !== 'academy') return;
      if (!row) { P.toast('Samtalet finns inte längre. Listan uppdateras.'); await refreshList(); return; }
      return row;
    } catch (error) { if (sameContext(value)) P.toast(storageMessage(error)); }
  }
  async function openExistingEditor(id, value) { const row = await loadExisting(id, value); if (row) openEditor(row, value); }
  async function openPlayer(id, value) {
    const row = await loadExisting(id, value);
    if (!row) return;
    const session = managedDialog(row.title, `<div class="b2c-call-player-meta"><span>${e(categories[row.category])}</span><small>${formatDuration(row.duration)} · ${formatSize(row.size)}</small></div><audio controls preload="metadata" id="b2c-call-player" aria-label="Lyssna på ${e(row.title)}"></audio><p class="b2c-call-form-error" id="b2c-call-playback-error" role="alert" hidden>Ljudet kunde inte spelas. Prova en annan webbläsare eller lägg till inspelningen igen som MP3 eller WAV.</p><section class="b2c-call-learning"><span class="ac-eyebrow">Lyssna efter detta</span><h3>Vad fungerade bra?</h3><p>${e(row.note)}</p></section><p class="b2c-call-dialog-scope">Lokalt samtalsexempel för ${e(P.getPartner()?.name || 'vald partner')}.</p><div class="modal-actions"><button type="button" class="btn btn-secondary" id="b2c-call-player-close">Till samtalsexemplen</button></div>`, value, `[data-b2c-listen="${id}"]`);
    session.root.querySelector('#b2c-call-player-close').onclick = P.closeDialog;
    if (!(row.audio instanceof Blob) || !row.audio.size) { session.root.querySelector('#b2c-call-playback-error').hidden = false; return; }
    const url = URL.createObjectURL(row.audio); session.urls.add(url);
    const player = session.root.querySelector('#b2c-call-player'); player.src = url;
    player.onerror = () => { if (sessionAlive(session)) session.root.querySelector('#b2c-call-playback-error').hidden = false; };
    player.focus();
  }
  async function openDelete(id, value) {
    const row = await loadExisting(id, value);
    if (!row) return;
    const session = managedDialog('Ta bort samtalsexemplet?', `<p class="b2c-call-dialog-intro"><strong>${e(row.title)}</strong></p><p class="b2c-call-dialog-scope">Inspelningen och tipset tas bort från den här webbläsaren. Det går inte att ångra.</p>${errorHtml}<div class="modal-actions"><button type="button" class="btn btn-secondary" id="b2c-call-cancel-delete">Behåll samtalet</button><button type="button" class="btn b2c-call-danger" id="b2c-call-confirm-delete">Ta bort samtalet</button></div>`, value, `[data-b2c-delete="${id}"]`);
    session.root.querySelector('#b2c-call-cancel-delete').onclick = P.closeDialog;
    const button = session.root.querySelector('#b2c-call-confirm-delete');
    button.onclick = async () => {
      if (!sessionAlive(session) || button.disabled) return;
      button.disabled = true; hideError(session);
      try {
        const deleted = await deleteRecord(id, value, () => sessionAlive(session), session.cancelers, row);
        if (!sessionAlive(session)) return;
        if (deleted === recordConflict) { showError(session, conflictMessage); return; }
        await finishMutation(session, deleted ? 'Samtalsexemplet är borttaget.' : 'Samtalet var redan borttaget. Listan är uppdaterad.');
      } catch (error) { showError(session, storageMessage(error)); }
      finally { if (sessionAlive(session)) button.disabled = false; }
    };
    session.root.querySelector('#b2c-call-cancel-delete').focus();
  }
  async function finishMutation(session, message) {
    const value = session.context;
    const selector = session.returnSelector;
    const model = currentList;
    P.closeDialog(); disposeSession();
    await refreshList(model);
    if (sameContext(value)) {
      if (!document.querySelector('#portal-dialog').open && model && listAlive(model)) (document.querySelector(selector) || document.querySelector('#b2c-call-upload'))?.focus();
      P.toast(message);
    }
  }
  async function clearScope(customerDemo = P.demoMode) {
    dialogIntent++;
    const target = customerDemo ? 'customer-demo' : 'normal';
    if (dialogSession?.context.scope === target) { disposeSession(); P.closeDialog(); }
    try {
      await transaction('readwrite', (store, done) => {
        const request = store.index('scope').openCursor(IDBKeyRange.only(target));
        request.onsuccess = () => { const cursor = request.result; if (cursor) { cursor.delete(); cursor.continue(); } else done(true); };
      });
      if (currentList?.context.scope === target) await refreshList();
      return true;
    } catch { return false; }
  }
  document.querySelector('#portal-dialog')?.addEventListener('close', () => { if (!document.querySelector('#portal-dialog').open) disposeSession(true); });
  const observer = new MutationObserver(() => {
    if (dialogSession && (!sessionAlive(dialogSession) || P.page !== 'academy')) {
      const ownDialog = dialogSession.root.isConnected;
      disposeSession(); if (ownDialog) P.closeDialog();
    }
    if (currentList && !listAlive(currentList)) { currentList = undefined; dialogIntent++; }
  });
  const view = document.querySelector('#view'); const dialogBody = document.querySelector('#dialog-body');
  if (view) observer.observe(view, { childList: true });
  if (dialogBody) observer.observe(dialogBody, { childList: true });
  P.b2cCalls = { eligible, render, bind, clearScope };
})();
