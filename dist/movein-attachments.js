(() => {
  'use strict';
  const P = window.Portal;
  if (!P) return;
  const scope = P.demoMode ? 'demo' : 'normal';
  const DB_NAME = 'partnerlabb.moveinAttachments.v1';
  const LIMIT = 5 * 1024 * 1024;
  const verified = new Map();
  const activeDownloads = new Set();
  let database;
  let generation = 0;
  const error = message => new Error(message);
  const ownsPartner = partner => P.getPartner(partner)?.type === 'property' && (P.role === 'internal' || partner === P.partner);
  const validMeta = meta => !!meta && typeof meta.id === 'string' && /^authority-[a-f0-9-]{36}$/i.test(meta.id) && meta.scope === scope && ownsPartner(meta.partner) && typeof meta.name === 'string' && meta.name.length > 0 && meta.name.length <= 180 && typeof meta.createdAt === 'string' && meta.createdAt.length <= 40 && !Number.isNaN(new Date(meta.createdAt).getTime()) && ['application/pdf', 'image/png', 'image/jpeg'].includes(meta.type) && Number.isInteger(meta.size) && meta.size > 0 && meta.size <= LIMIT;
  const fingerprint = meta => JSON.stringify([meta.scope, meta.partner, meta.name, meta.type, meta.size, meta.createdAt]);
  function openDatabase() {
    if (!window.indexedDB) return Promise.reject(error('Webbläsaren kan inte lagra bilagor. Prova en annan webbläsare.'));
    if (database) return database;
    database = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => {
        const store = request.result.createObjectStore('files', { keyPath: 'id' });
        store.createIndex('scope', 'scope');
      };
      request.onsuccess = () => { const db = request.result; db.onversionchange = () => { db.close(); database = undefined; }; resolve(db); };
      request.onerror = () => { database = undefined; reject(error('Bilagorna kunde inte lagras i webbläsaren. Ingen fil har skickats.')); };
      request.onblocked = () => { database = undefined; reject(error('Stäng andra flikar med Partnerlabb och försök igen. Bilagelagringen är blockerad.')); };
    });
    return database;
  }
  async function validateFile(file) {
    if (!(file instanceof Blob) || !file.size || file.size > LIMIT) throw error('Varje fullmakt ska vara en PDF, PNG eller JPEG på högst 5 MB och får inte vara tom.');
    const name = String(file.name || '').split(/[\\/]/).pop().replace(/[\u0000-\u001f\u007f]/g, '').trim();
    if (!name || name.length > 180) throw error('Filnamnet behöver vara högst 180 tecken.');
    const extension = name.split('.').pop().toLowerCase();
    const types = { pdf: 'application/pdf', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg' };
    const type = types[extension];
    if (!type || (file.type && file.type !== type)) throw error('Välj PDF, PNG eller JPEG. Andra filtyper kan inte bifogas.');
    let bytes;
    try { bytes = new Uint8Array(await file.slice(0, 8).arrayBuffer()); }
    catch { throw error('Filen kunde inte läsas. Välj filen igen och prova på nytt.'); }
    const signature = type === 'application/pdf' ? [37, 80, 68, 70, 45] : type === 'image/png' ? [137, 80, 78, 71, 13, 10, 26, 10] : [255, 216, 255];
    if (!signature.every((value, index) => bytes[index] === value)) throw error('Filens innehåll matchar inte PDF, PNG eller JPEG. Välj ett giltigt exempel på en fullmaktsfil.');
    return { name, type, size: file.size };
  }
  async function storeFiles(files, partnerId) {
    const currentGeneration = generation;
    const selected = Array.from(files || []);
    if (!ownsPartner(partnerId)) throw error('Välj ett fastighetsbolag som du kan registrera underlag för.');
    if (!selected.length || selected.length > 3) throw error('Välj mellan en och tre fullmaktsfiler åt gången.');
    const definitions = await Promise.all(selected.map(validateFile));
    const metas = definitions.map(definition => ({ ...definition, id: 'authority-' + crypto.randomUUID(), scope, partner: partnerId, createdAt: new Date().toISOString() }));
    const db = await openDatabase();
    if (!ownsPartner(partnerId) || generation !== currentGeneration) throw error('Arbetsytan har ändrats. Välj filerna igen på fastighetsbolagets sida.');
    await new Promise((resolve, reject) => {
      let transaction;
      try {
        transaction = db.transaction('files', 'readwrite');
        selected.forEach((file, index) => transaction.objectStore('files').put({ ...metas[index], blob: file.slice(0, file.size, metas[index].type) }));
        transaction.oncomplete = resolve;
        transaction.onabort = transaction.onerror = () => reject(error('Bilagorna kunde inte sparas. Prova igen; ingen fil har skickats.'));
      } catch { transaction?.abort(); reject(error('Bilagorna kunde inte sparas i webbläsaren.')); }
    });
    if (!ownsPartner(partnerId) || generation !== currentGeneration) {
      await new Promise((resolve, reject) => {
        const transaction = db.transaction('files', 'readwrite');
        metas.forEach(meta => transaction.objectStore('files').delete(meta.id));
        transaction.oncomplete = resolve;
        transaction.onabort = transaction.onerror = () => reject(error('Arbetsytan ändrades medan bilagan sparades. Prova omstarten för att rensa lokala bilagor.'));
      });
      throw error('Arbetsytan har ändrats. Välj filerna igen på fastighetsbolagets sida.');
    }
    metas.forEach(meta => verified.set(meta.id, fingerprint(meta)));
    return metas;
  }
  async function read(meta) {
    const currentGeneration = generation;
    if (!validMeta(meta)) throw error('Bilagan hör inte till den här arbetsytan eller partnern.');
    const db = await openDatabase();
    const stored = await new Promise((resolve, reject) => {
      try {
        const request = db.transaction('files', 'readonly').objectStore('files').get(meta.id);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(error('Bilagan kunde inte läsas. Prova igen.'));
      } catch { reject(error('Bilagan kunde inte läsas. Prova igen.')); }
    });
    if (!validMeta(meta) || generation !== currentGeneration) throw error('Arbetsytan har ändrats. Öppna ärendet igen.');
    if (!stored || fingerprint(stored) !== fingerprint(meta) || !(stored.blob instanceof Blob) || stored.blob.size !== meta.size) {
      verified.delete(meta.id);
      throw error('Fullmaktsfilen saknas i den här webbläsaren. Bifoga den igen innan du förmedlar underlaget.');
    }
    verified.set(meta.id, fingerprint(meta));
    return stored;
  }
  async function exists(meta) { try { await read(meta); return true; } catch { verified.delete(meta?.id); return false; } }
  async function remove(meta) {
    const currentGeneration = generation;
    if (!validMeta(meta)) throw error('Bilagan hör inte till den här arbetsytan eller partnern.');
    const db = await openDatabase();
    if (!validMeta(meta) || generation !== currentGeneration) throw error('Arbetsytan har ändrats. Öppna ärendet igen.');
    await new Promise((resolve, reject) => {
      const transaction = db.transaction('files', 'readwrite');
      transaction.objectStore('files').delete(meta.id);
      transaction.oncomplete = resolve;
      transaction.onabort = transaction.onerror = () => reject(error('Bilagan kunde inte tas bort. Prova igen.'));
    });
    verified.delete(meta.id);
    return true;
  }
  async function removeUnreferenced(meta) {
    // A recovered draft or another case can share this local file. Unlinking
    // one reference must never delete the bytes needed by a registered case.
    const referenced = Array.isArray(P.state.moveins) && P.state.moveins.some(row => row && typeof row === 'object' && Array.isArray(row.authorityFiles) && row.authorityFiles.some(file => file && file.id === meta?.id && file.scope === meta?.scope));
    return referenced ? false : remove(meta);
  }
  async function download(meta) {
    const stored = await read(meta);
    const url = URL.createObjectURL(stored.blob);
    activeDownloads.add(url);
    const link = document.createElement('a'); link.href = url; link.download = stored.name;
    document.body.append(link); link.click(); link.remove();
    setTimeout(() => { URL.revokeObjectURL(url); activeDownloads.delete(url); }, 30000);
    return true;
  }
  async function clearScope() {
    generation += 1;
    const db = await openDatabase();
    await new Promise((resolve, reject) => {
      const transaction = db.transaction('files', 'readwrite');
      const request = transaction.objectStore('files').index('scope').openCursor(IDBKeyRange.only(scope));
      request.onsuccess = () => { const cursor = request.result; if (cursor) { cursor.delete(); cursor.continue(); } };
      transaction.oncomplete = resolve;
      transaction.onabort = transaction.onerror = () => reject(error('Webbläsaren kunde inte rensa bilagorna. Prova omstarten igen.'));
    });
    verified.clear();
    for (const url of activeDownloads) URL.revokeObjectURL(url);
    activeDownloads.clear();
    return true;
  }
  P.moveinAttachments = { scope, storeFiles, remove, removeUnreferenced, download, exists, clearScope, hasVerified: meta => validMeta(meta) && verified.get(meta.id) === fingerprint(meta), validMeta };
})();
