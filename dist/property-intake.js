(() => {
  'use strict';
  const P = window.Portal;
  if (!P) return;
  const e = P.e, icon = P.icon;
  const prefix = P.demoMode ? 'partnerlabb.demo.partnerIntake.v1.' : 'partnerlabb.partnerIntake.v1.';
  const limits = { address: 120, apartment: 25, postcode: 6, city: 80, moveDate: 10, name: 100, email: 140, phone: 30 };
  const columns = [['address','Adress'],['apartment','Lägenhet'],['postcode','Postnummer'],['city','Ort'],['moveDate','Inflyttningsdatum'],['name','Namn'],['email','E-post'],['phone','Telefon']];
  const required = ['address','postcode','city','moveDate','name','email'];
  const cache = new Map();
  let generation = 0, storageWarning = '', receipt = null, previousContext = '';
  const $ = selector => document.querySelector(selector);
  const isProperty = id => P.getPartner(id)?.type === 'property';
  const allowed = () => P.role === 'partner' && isProperty(P.partner);
  const context = () => `${P.partner}:${P.page}`;
  const emptyFields = () => Object.fromEntries(Object.keys(limits).map(key => [key, '']));
  const validDate = value => /^\d{4}-\d{2}-\d{2}$/.test(value) && Number(value.slice(0,4)) >= 2000 && Number(value.slice(0,4)) <= 2100 && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
  const normalize = value => String(value || '').trim().toLocaleLowerCase('sv-SE').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
  const identity = row => [row.partner || P.partner, row.address, row.apartment, row.moveDate, row.email].map(value => String(value || '').trim().replace(/\s+/g,' ').toLocaleLowerCase('sv-SE')).join('|');
  const cleanFiles = (files, partner) => Array.isArray(files) ? files.slice(0, 3).filter(meta => meta && typeof meta.id === 'string' && typeof meta.name === 'string' && meta.partner === partner && meta.scope === (P.demoMode ? 'demo' : 'normal')).map(meta => ({ id: meta.id, name: meta.name.slice(0, 250), type: String(meta.type || ''), size: Number(meta.size) || 0, scope: meta.scope, partner, createdAt: String(meta.createdAt || '') })) : [];
  function fresh(mode, partner) {
    return mode === 'manual' ? { mode, partner, desiredProduct: P.propertyDefaults?.get(partner) || 'Kvartspris', fields: emptyFields(), authorityFiles: [], confirmed: false, busy: false, error: '' } : { mode, partner, desiredProduct: P.propertyDefaults?.get(partner) || 'Kvartspris', filename: '', rows: [], confirmed: false, busy: false, error: '', batchId: crypto.randomUUID() };
  }
  function getDraft(mode) {
    const key = `${P.partner}:${mode}`;
    if (cache.has(key)) return cache.get(key);
    let draft = fresh(mode, P.partner);
    try {
      const saved = JSON.parse(sessionStorage.getItem(prefix + key));
      if (saved?.version === 1 && saved.partner === P.partner && saved.mode === mode) {
        draft.desiredProduct = P.propertyDefaults?.valid(saved.desiredProduct) ? saved.desiredProduct : '';
        if (mode === 'manual' && saved.fields && required.every(name => typeof saved.fields[name] === 'string')) {
          for (const [name, max] of Object.entries(limits)) draft.fields[name] = typeof saved.fields[name] === 'string' ? saved.fields[name].slice(0, max) : '';
          draft.authorityFiles = cleanFiles(saved.authorityFiles, P.partner);
        } else if (mode === 'import' && Array.isArray(saved.rows) && saved.rows.length <= 200) {
          draft.filename = String(saved.filename || '').slice(0, 250);
          draft.batchId = typeof saved.batchId === 'string' ? saved.batchId : draft.batchId;
          draft.rows = saved.rows.filter(row => row && row.fields && typeof row.fields === 'object').map((row, index) => ({ rowNumber: Number(row.rowNumber) || index + 2, fields: Object.fromEntries(Object.entries(limits).map(([name,max]) => [name, String(row.fields[name] || '').slice(0, max + 1)])), parseErrors: Array.isArray(row.parseErrors) ? row.parseErrors.slice(0, 8).map(value => String(value).slice(0, 180)) : [], authorityFiles: cleanFiles(row.authorityFiles, P.partner), selected: row.selected === true }));
        }
      }
    } catch { storageWarning = 'Utkastet kunde inte läsas. Du kan fylla i ett nytt underlag.'; }
    cache.set(key, draft);
    return draft;
  }
  function saveDraft(draft) {
    const value = { version: 1, mode: draft.mode, partner: draft.partner, desiredProduct: draft.desiredProduct };
    if (draft.mode === 'manual') Object.assign(value, { fields: draft.fields, authorityFiles: draft.authorityFiles });
    else Object.assign(value, { filename: draft.filename, batchId: draft.batchId, rows: draft.rows });
    try { sessionStorage.setItem(prefix + `${draft.partner}:${draft.mode}`, JSON.stringify(value)); storageWarning = ''; }
    catch { storageWarning = 'Utkastet kunde inte sparas. Behåll den här fliken öppen.'; }
    const node = $('#pi-draft-status');
    if (node) { node.textContent = storageWarning || 'Utkastet sparas i den här fliken. Inget har skickats till Kraftringen.'; node.classList.toggle('pi-warning-text', !!storageWarning); }
  }
  function clearDraft(mode, partner = P.partner) {
    cache.delete(`${partner}:${mode}`);
    try { sessionStorage.removeItem(prefix + `${partner}:${mode}`); return true; } catch { return false; }
  }
  function clearDrafts() {
    generation++; cache.clear(); receipt = null; storageWarning = '';
    let ok = true;
    for (const partner of P.partnerRegistry.filter(item => item.type === 'property')) for (const mode of ['manual','import']) if (!clearDraft(mode, partner.id)) ok = false;
    return ok;
  }
  function rowErrors(fields) {
    const errors = [];
    for (const key of required) if (!fields[key]?.trim()) errors.push(`${columns.find(([name]) => name === key)[1]} saknas`);
    if (fields.postcode && !/^\d{3} ?\d{2}$/.test(fields.postcode)) errors.push('Postnummer ska ha fem siffror');
    if (fields.moveDate && !validDate(fields.moveDate)) errors.push('Inflyttningsdatum ska vara ÅÅÅÅ-MM-DD');
    if (fields.email && !/^[^\s@]+@[^\s@]+\.example$/i.test(fields.email)) errors.push('Använd en fiktiv e-postadress som slutar på .example');
    for (const [key,max] of Object.entries(limits)) if (String(fields[key] || '').length > max) errors.push(`${columns.find(([name]) => name === key)[1]} är för långt`);
    return errors;
  }
  function inspectRows(draft) {
    const existing = new Set((P.state.moveins || []).filter(row => row && typeof row === 'object' && !Array.isArray(row) && row.partner === draft.partner).map(identity));
    const seen = new Set();
    return draft.rows.map(row => {
      const id = identity({ ...row.fields, partner: draft.partner });
      const errors = [...row.parseErrors, ...rowErrors(row.fields)];
      // En rad som ändå inte kan registreras ska inte blockera en senare,
      // korrigerad rad med samma identitet i filen.
      const duplicate = existing.has(id) ? 'Finns redan bland era ärenden' : !errors.length && seen.has(id) ? 'Samma inflyttning finns tidigare i filen' : '';
      if (!errors.length && !duplicate) seen.add(id);
      return { row, errors, duplicate, valid: !errors.length && !duplicate };
    });
  }
  function active(token, expected, draft) { return token === generation && context() === expected && allowed() && cache.get(`${draft.partner}:${draft.mode}`) === draft; }
  function refreshDraft(draft) {
    if (allowed() && P.partner === draft.partner && P.page === `property-${draft.mode}` && cache.get(`${draft.partner}:${draft.mode}`) === draft) P.render();
  }
  function open(mode = 'choice', partnerId = P.partner) {
    if (!isProperty(partnerId)) return;
    generation++; receipt = null; P.role = 'partner'; P.partner = partnerId;
    P.go(mode === 'manual' ? 'property-manual' : mode === 'import' ? 'property-import' : 'property-intake');
  }
  function top(title, text, mode) {
    return `<div class="pi-heading"><div><button class="text-button pi-back" type="button" data-pi-back>${icon('arrow')} ${mode ? 'Välj registreringssätt' : 'Inflyttningsservice'}</button><span class="eyebrow">${e(P.getPartner().name)} · INFLYTTNINGSSERVICE</span><h1>${title}</h1><p>${text}</p></div>${mode ? `<span class="pi-mode-tag">${icon(mode === 'import' ? 'file' : 'edit')}${mode === 'import' ? 'Excel-import' : 'Manuell registrering'}</span>` : ''}</div>`;
  }
  const demoNote = () => `<div class="pi-demo-note">${icon('shield')}<span>Använd fiktiva uppgifter och testfiler. Bilagor och ärenden sparas lokalt i den här webbläsaren.</span></div>`;
  const testAttachmentLink = () => `<div class="pi-test-download"><a href="assets/inflyttning-testbilaga.pdf" download="inflyttning-testbilaga.pdf">${icon('download')} Hämta en fiktiv testbilaga</a><small>För filprov · ingen fullmaktsmall</small></div>`;
  const guard = () => `<div class="card pi-guard"><h1>Fastighetsbolagets arbetsyta</h1><p>Öppna ett fastighetsbolag för att registrera inflyttningar.</p><button class="btn btn-primary" type="button" data-go="overview">Till översikten ${icon('arrow')}</button></div>`;
  function renderChoice() {
    if (!allowed()) return guard();
    return `<div class="pi-shell">${top('Registrera inflyttningar.','Ni samlar underlaget och bifogar fullmakterna. Kraftringen hjälper vidare med elen.')}<div class="pi-choice-intro"><span class="pi-intro-icon">${icon('home')}</span><div><strong>Ett enkelt arbetssätt, två vägar in.</strong><p>Hyresgästen behöver inte använda portalen. Välj det sätt som passar er bäst.</p></div></div><div class="pi-choice-grid"><button type="button" class="pi-choice-card pi-choice-excel" data-pi-mode="import"><span class="pi-choice-top"><span class="pi-choice-icon">${icon('file')}</span><span class="pi-tag">FLERA INFLYTTNINGAR</span></span><h2>Ladda upp Excel</h2><p>Samla inflyttningarna i en fil, kontrollera raderna och koppla rätt fullmakt till rätt hyresgäst.</p><span class="pi-choice-steps"><span>1. Ladda upp</span><span>2. Bifoga fullmakter</span><span>3. Spara underlag</span></span><span class="pi-choice-action">Välj Excel-import ${icon('arrow')}</span></button><button type="button" class="pi-choice-card" data-pi-mode="manual"><span class="pi-choice-top"><span class="pi-choice-icon">${icon('edit')}</span><span class="pi-tag">EN INFLYTTNING</span></span><h2>Fyll i själv</h2><p>Registrera hyresgästens uppgifter direkt i portalen och bifoga fullmakten i samma formulär.</p><span class="pi-choice-steps"><span>1. Fyll i uppgifter</span><span>2. Bifoga fullmakt</span><span>3. Spara underlag</span></span><span class="pi-choice-action">Välj manuell registrering ${icon('arrow')}</span></button></div><div class="pi-handover-note">${icon('check')}<p><strong>Ni har kontroll över överlämningen.</strong> Sparade underlag kan granskas och kompletteras. Förmedla dem sedan till Kraftringen när fullmakterna är bifogade.</p></div>${demoNote()}</div>`;
  }
  function attachments(files, rowIndex = '') {
    return `<div class="pi-attachment-list">${files.map((meta, index) => `<div class="pi-attachment"><span class="pi-file-icon">${icon('file')}</span><span><strong>${e(meta.name)}</strong><small>${Math.max(1,Math.round(meta.size / 1024))} kB · Fullmaktsbilaga</small></span><button class="icon-button" type="button" data-pi-download="${index}" data-pi-row="${rowIndex}" aria-label="Ladda ned ${e(meta.name)}">${icon('download')}</button><button class="icon-button" type="button" data-pi-remove="${index}" data-pi-row="${rowIndex}" aria-label="Ta bort ${e(meta.name)}">${icon('close')}</button></div>`).join('')}</div>`;
  }
  function uploadControl(files, index = '', busy = false) {
    const id = `pi-authority-${index === '' ? 'manual' : index}`;
    return `${attachments(files,index)}<label class="pi-file-button ${busy || files.length >= 3 ? 'pi-disabled' : ''}" for="${id}">${icon('plus')} ${files.length ? 'Bifoga ytterligare fullmakt' : 'Bifoga fullmakt'}<input id="${id}" type="file" data-pi-attachment="${index}" accept="application/pdf,image/png,image/jpeg,.pdf,.png,.jpg,.jpeg" multiple ${busy || files.length >= 3 ? 'disabled' : ''}></label><small class="pi-file-help">PDF, PNG eller JPG · högst 5 MB per fil, 3 filer per inflyttning</small>`;
  }
  const status = draft => `<p class="pi-draft-status ${storageWarning ? 'pi-warning-text' : ''}" id="pi-draft-status">${e(storageWarning || 'Utkastet sparas i den här fliken. Inget har skickats till Kraftringen.')}</p>`;
  const errorBox = error => error ? `<div class="pi-error" role="alert">${icon('alert')}<span>${e(error)}</span></div>` : '';
  function field(key,label,fields,type = 'text',hint = '',wide = false) {
    return `<label class="field ${wide ? 'pi-field-wide' : ''}" for="pi-${key}"><span>${label}${required.includes(key) ? ' <span aria-hidden="true">*</span>' : ' <small>valfritt</small>'}</span><input id="pi-${key}" name="${key}" type="${type}" value="${e(fields[key])}" maxlength="${limits[key]}" ${required.includes(key) ? 'required' : ''} ${key === 'postcode' ? 'inputmode="numeric" pattern="[0-9]{3} ?[0-9]{2}"' : ''} ${key === 'email' ? 'pattern="[^\\s@]+@[^\\s@]+\\.example"' : ''} ${key === 'moveDate' ? 'min="2000-01-01" max="2100-12-31"' : ''} autocomplete="off">${hint ? `<small>${hint}</small>` : ''}</label>`;
  }
  function renderSuccess() {
    const incomplete = receipt.created.filter(row => !row.authorityFiles?.length).length;
    return `<div class="pi-shell pi-success-shell"><section class="card pi-success"><span class="pi-success-icon">${icon('check')}</span><span class="eyebrow">UNDERLAG SPARAT</span><h1>${receipt.created.length === 1 ? 'Inflyttningen är registrerad.' : `${receipt.created.length} inflyttningar är registrerade.`}</h1><p>${receipt.saved ? 'Underlagen finns nu bland era inflyttningsärenden.' : 'Underlagen finns i denna flik. Webbläsaren kunde inte spara dem inför omladdning.'}</p><div class="pi-success-next"><strong>${incomplete ? `${incomplete} ${incomplete === 1 ? 'underlag saknar' : 'underlag saknar'} fullmakt` : 'Nästa steg: granska och förmedla'}</strong><span>${incomplete ? 'Bifoga de saknade fullmakterna i ärendelistan. Underlag med fullmakt kan förmedlas till Kraftringen.' : 'Ni väljer själva när underlagen ska förmedlas till Kraftringen. Registreringen har inte skickat något.'}</span></div>${receipt.draftCleared === false ? '<p class="pi-warning-text" role="alert">Underlaget är sparat, men det tidigare utkastet kunde inte rensas. Om det visas igen efter omladdning ska du använda ärendelistan för att komplettera det sparade underlaget.</p>' : ''}${receipt.duplicates.length ? `<p class="pi-warning-text">${receipt.duplicates.length} ${receipt.duplicates.length === 1 ? 'dubblett skapades' : 'dubbletter skapades'} inte.</p>` : ''}<div class="pi-success-actions"><button class="btn btn-primary" type="button" data-pi-records>Se & förmedla underlagen ${icon('arrow')}</button><button class="btn btn-secondary" type="button" data-pi-new>Registrera fler</button></div></section>${demoNote()}</div>`;
  }
  function renderManual() {
    if (!allowed()) return guard();
    if (receipt?.partner === P.partner) return renderSuccess();
    const draft = getDraft('manual'), f = draft.fields;
    return `<div class="pi-shell">${top('En inflyttning, ett samlat underlag.','Fyll i uppgifterna för hyresgästen och lägg till fullmakten.','manual')}${P.propertyDefaults?.field(draft.desiredProduct)||''}<form id="pi-manual-form" class="pi-manual-layout"><section class="card pi-form-card"><div class="pi-card-heading"><div><span class="pi-section-number">01</span><h2>Bostad & inflyttning</h2></div><button type="button" class="text-button" id="pi-fill-example">Fyll i ett exempel ${icon('arrow')}</button></div><div class="pi-field-grid">${field('address','Adress',f,'text','',true)}${field('apartment','Lägenhetsnummer',f)}${field('moveDate','Inflyttningsdatum',f,'date')}${field('postcode','Postnummer',f)}${field('city','Ort',f)}</div><div class="pi-card-heading pi-second-heading"><div><span class="pi-section-number">02</span><h2>Hyresgästens kontaktuppgifter</h2></div></div><div class="pi-field-grid">${field('name','Hyresgästens namn',f,'text','',true)}${field('email','E-post',f,'email','Exempel: kim@hyresgast.example')}${field('phone','Telefon',f,'tel')}</div></section><aside class="pi-manual-aside"><section class="card pi-authority-card"><span class="pi-aside-icon">${icon('file')}</span><h2>Bifoga fullmakten</h2><p>Koppla fullmakten till den här inflyttningen så följer den med underlaget.</p>${uploadControl(draft.authorityFiles,'',draft.busy)}${testAttachmentLink()}${!draft.authorityFiles.length ? '<div class="pi-missing-note">Du kan spara utan fullmakt och komplettera senare. Förmedlingen blir tillgänglig när bilagan finns.</div>' : '<div class="pi-attached-note">Bilagan är bifogad. Kraftringen granskar fullmakten vid handläggningen.</div>'}</section><div class="pi-next-note">${icon('arrow')}<p><strong>Kraftringen tar över efter överlämningen.</strong> Hyresgästen behöver inte fylla i något i portalen.</p></div></aside><section class="card pi-save-bar">${errorBox(draft.error)}<label class="check-field pi-demo-check"><input type="checkbox" name="demoOnly" ${draft.confirmed ? 'checked' : ''} required> <span>Jag använder enbart fiktiva exempeluppgifter och testfiler.</span></label><div class="pi-save-row"><div>${status(draft)}<small>Registrering skapar underlag. Elavtal och kickback hanteras separat.</small></div><button class="btn btn-primary" type="submit" ${draft.busy ? 'disabled' : ''}>${icon('check')} ${draft.busy ? 'Sparar…' : 'Spara underlag'}</button></div></section></form></div>`;
  }
  function renderImportRow(entry,index,draft) {
    const { row,errors,duplicate,valid } = entry, f = row.fields;
    return `<article class="pi-import-row ${!valid ? 'pi-row-invalid' : ''}"><div class="pi-row-top"><label class="pi-row-select"><input type="checkbox" data-pi-select="${index}" ${row.selected && valid ? 'checked' : ''} ${!valid || draft.busy ? 'disabled' : ''} aria-label="Välj rad ${row.rowNumber}: ${e(f.name || 'Namn saknas')}"><span>RAD ${row.rowNumber}</span></label><span class="pi-row-badge ${!valid ? 'pi-badge-error' : row.authorityFiles.length ? 'pi-badge-ready' : 'pi-badge-wait'}">${!valid ? duplicate ? 'Dubblett' : 'Kontrollera uppgifterna' : row.authorityFiles.length ? 'Fullmakt bifogad' : 'Fullmakt saknas'}</span></div><div class="pi-row-content"><div class="pi-row-person"><h3>${e(f.name || 'Namn saknas')}</h3><span>${e(f.email || 'E-post saknas')}</span><p>${e(f.address || 'Adress saknas')}${f.apartment ? ` · Lgh ${e(f.apartment)}` : ''}<br>${e(f.postcode)} ${e(f.city)}<br><strong>Inflyttning ${e(f.moveDate || 'Datum saknas')}</strong></p>${duplicate ? `<p class="pi-row-issue">${e(duplicate)}. Denna rad skapas inte igen.</p>` : ''}${errors.length ? `<ul class="pi-row-errors">${errors.map(error => `<li>${e(error)}</li>`).join('')}</ul>` : ''}</div><div class="pi-row-authority">${valid ? uploadControl(row.authorityFiles,index,draft.busy) : `<p class="pi-row-correction">${duplicate ? 'Komplettera redan registrerade underlag i ärendelistan.' : 'Rätta raden i Excel-filen och ladda upp den igen.'}</p>`}</div></div></article>`;
  }
  function renderImport() {
    if (!allowed()) return guard();
    if (receipt?.partner === P.partner) return renderSuccess();
    const draft = getDraft('import'), entries = inspectRows(draft), selected = entries.filter(entry => entry.valid && entry.row.selected), issues = entries.filter(entry => !entry.valid).length;
    return `<div class="pi-shell">${top('Alla inflyttningar i en fil.','Ladda upp Excel, kontrollera raderna och bifoga fullmakterna per hyresgäst.','import')}${P.propertyDefaults?.field(draft.desiredProduct)||''}<p>Valet ovan gäller de nya rader som sparas i denna import.</p><section class="card pi-import-upload"><div class="pi-upload-copy"><span class="pi-section-number">01</span><h2>Ladda upp er inflyttningslista</h2><p>Använd mallen så hamnar uppgifterna rätt. En rad per hyresgäst.</p><button type="button" class="text-button" id="pi-template" ${draft.busy ? 'disabled' : ''}>${icon('download')} Ladda ned Excel-mall med två exempel</button>${testAttachmentLink()}</div><label class="pi-dropzone ${draft.busy ? 'pi-disabled' : ''}" for="pi-excel-file"><span class="pi-upload-icon">${icon('file')}</span><strong>${draft.busy ? 'Läser filen…' : draft.filename ? e(draft.filename) : 'Välj eller dra hit en Excel-fil'}</strong><span>${draft.filename ? 'Välj en annan fil för att ersätta utkastet' : '.xlsx · högst 5 MB och 200 inflyttningar'}</span><input id="pi-excel-file" type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ${draft.busy ? 'disabled' : ''}></label></section>${errorBox(draft.error)}${entries.length ? `<section class="pi-import-preview"><div class="pi-preview-heading"><div><span class="pi-section-number">02</span><h2>Kontrollera & bifoga fullmakter</h2><p>${entries.length} rader i filen${issues ? ` · ${issues} ${issues === 1 ? 'rad behöver' : 'rader behöver'} kontrolleras` : ''}. ${selected.length} ${selected.length === 1 ? 'underlag är valt' : 'underlag är valda'} för registrering.</p></div><label class="pi-select-all"><input id="pi-select-all" type="checkbox" ${entries.some(entry => entry.valid) && entries.filter(entry => entry.valid).every(entry => entry.row.selected) ? 'checked' : ''} ${draft.busy ? 'disabled' : ''}> Välj alla giltiga rader</label></div><div class="pi-import-rows">${entries.map((entry,index) => renderImportRow(entry,index,draft)).join('')}</div><section class="card pi-save-bar"><label class="check-field pi-demo-check"><input id="pi-import-confirm" type="checkbox" ${draft.confirmed ? 'checked' : ''} ${draft.busy ? 'disabled' : ''}> <span>Jag använder enbart fiktiva exempeluppgifter och testfiler.</span></label><div class="pi-save-row"><div>${status(draft)}<small>${selected.filter(entry => !entry.row.authorityFiles.length).length ? 'Underlag utan fullmakt sparas för komplettering och kan inte förmedlas ännu.' : 'Ni granskar och förmedlar underlagen efter registreringen.'}</small></div><button id="pi-import-save" class="btn btn-primary" type="button" ${draft.busy || !selected.length ? 'disabled' : ''}>${icon('check')} ${draft.busy ? 'Sparar…' : `Spara ${selected.length} ${selected.length === 1 ? 'underlag' : 'underlag'}`}</button></div></section></section>` : `<div class="pi-template-hint">${icon('layers')}<div><strong>Mallen innehåller de uppgifter som behövs i demot.</strong><span>Adress, postnummer, ort, inflyttningsdatum, namn och e-post. Lägenhetsnummer och telefon är valfria.</span></div></div>`}${demoNote()}</div>`;
  }
  function exampleFields(index = 0) {
    return index ? { address: 'Demovägen 12', apartment: '1202', postcode: '211 22', city: 'Malmö', moveDate: '2026-11-15', name: 'Robin Exempel', email: 'robin@hyresgast.example', phone: '' } : { address: 'Exempelgatan 4', apartment: '1101', postcode: '222 22', city: 'Lund', moveDate: '2026-11-01', name: 'Kim Exempel', email: 'kim@hyresgast.example', phone: '' };
  }
  async function template() {
    if (!window.ExcelJS?.Workbook) throw new Error('Excel-mallen kunde inte laddas. Ladda om sidan och försök igen.');
    const book = new ExcelJS.Workbook(), sheet = book.addWorksheet('Inflyttningar');
    sheet.columns = columns.map(([key,header]) => ({ header, key, width: ['address','email','name'].includes(key) ? 30 : 22 }));
    sheet.addRow(exampleFields()); sheet.addRow(exampleFields(1));
    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF006B70' } };
    sheet.getRow(1).height = 26; sheet.views = [{ state: 'frozen', ySplit: 1 }];
    sheet.autoFilter = { from: 'A1', to: 'H3' };
    const buffer = await book.xlsx.writeBuffer();
    P.download('inflyttningar-exempelmall.xlsx', buffer, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  }
  function cellText(cell,key,errors,date1904 = false) {
    const value = cell.value;
    if (value === null || value === undefined) return '';
    if (typeof value === 'object' && !(value instanceof Date)) {
      if (value.formula || value.sharedFormula) { errors.push('Formler stöds inte. Klistra in värden i Excel-filen.'); return ''; }
      if (Array.isArray(value.richText)) return value.richText.map(item => item.text || '').join('').trim();
      if (value.hyperlink && typeof value.text === 'string') return value.text.trim();
      errors.push('Cellen innehåller ett värde som inte kan läsas.'); return '';
    }
    if (key === 'moveDate' && value instanceof Date) return Number.isNaN(value.getTime()) ? '' : value.toISOString().slice(0,10);
    if (key === 'moveDate' && typeof value === 'number') {
      const parsed = new Date((date1904 ? Date.UTC(1904,0,1) : Date.UTC(1899,11,30)) + Math.floor(value) * 86400000);
      if (Number.isNaN(parsed.getTime())) { errors.push('Inflyttningsdatumet kunde inte läsas som ett giltigt datum.'); return ''; }
      return parsed.toISOString().slice(0,10);
    }
    if (value instanceof Date) return value.toISOString().slice(0,10);
    return String(value).trim();
  }
  async function parseFile(file) {
    if (!file || !/\.xlsx$/i.test(file.name)) throw new Error('Välj en Excel-fil i formatet .xlsx.');
    if (file.name.length > 180 || /[\u0000-\u001f\u007f]/.test(file.name)) throw new Error('Använd ett filnamn på högst 180 tecken utan kontrolltecken.');
    if (file.size > 5 * 1024 * 1024) throw new Error('Excel-filen är för stor. Högst 5 MB är tillåtet.');
    if (!window.ExcelJS?.Workbook) throw new Error('Excel-läsaren kunde inte laddas. Ladda om sidan och försök igen.');
    const book = new ExcelJS.Workbook();
    try { await book.xlsx.load(await file.arrayBuffer()); }
    catch { throw new Error('Filen kunde inte läsas som Excel. Spara den som .xlsx och försök igen.'); }
    const sheet = book.worksheets[0];
    if (!sheet) throw new Error('Excel-filen saknar ett kalkylblad.');
    if (sheet.actualRowCount > 201 || sheet.rowCount > 10000) throw new Error('Filen har för många rader. Använd högst 200 inflyttningar per fil.');
    const aliases = { adress:'address',gatuadress:'address',lagenhet:'apartment',lagenhetsnummer:'apartment',postnummer:'postcode',ort:'city',stad:'city',inflyttningsdatum:'moveDate',inflyttning:'moveDate',namn:'name',hyresgast:'name',hyresgastensnamn:'name',epost:'email',email:'email',epostadress:'email',telefon:'phone',telefonnummer:'phone' };
    const mapping = new Map();
    sheet.getRow(1).eachCell((cell,index) => {
      const key = aliases[normalize(cell.text)];
      if (key) { if (mapping.has(key)) throw new Error(`Kolumnen ${columns.find(([name]) => name === key)[1]} finns flera gånger. Använd varje kolumn en gång.`); mapping.set(key,index); }
    });
    const missing = required.filter(key => !mapping.has(key));
    if (missing.length) throw new Error(`Kolumner saknas: ${missing.map(key => columns.find(([name]) => name === key)[1]).join(', ')}. Använd Excel-mallen.`);
    const rows = [];
    for (let number = 2; number <= sheet.rowCount; number++) {
      const parseErrors = [], fields = emptyFields();
      for (const [key,index] of mapping) fields[key] = cellText(sheet.getRow(number).getCell(index),key,parseErrors,book.properties.date1904 === true);
      if (!Object.values(fields).some(Boolean) && !parseErrors.length) continue;
      if (rows.length >= 200) throw new Error('Filen har fler än 200 inflyttningar. Dela upp den i mindre filer.');
      for (const [key,max] of Object.entries(limits)) fields[key] = fields[key].slice(0,max + 1);
      rows.push({ rowNumber: number, fields, parseErrors, authorityFiles: [], selected: true });
    }
    if (!rows.length) throw new Error('Filen innehåller inga inflyttningar. Fyll i minst en rad under kolumnrubrikerna.');
    return rows;
  }
  async function importFile(file) {
    const draft = getDraft('import');
    if (!file || draft.busy) return;
    if (draft.rows.length && !confirm('Ersätta det aktuella Excel-utkastet? Rader och tilldelade bilagor i utkastet ersätts. Redan registrerade ärenden påverkas inte.')) return;
    const token = ++generation, expected = context(); draft.busy = true; draft.error = ''; P.render();
    try {
      const rows = await parseFile(file);
      if (!active(token,expected,draft)) return;
      const oldFiles = draft.rows.flatMap(row => row.authorityFiles);
      draft.rows = rows; draft.filename = file.name; draft.batchId = crypto.randomUUID(); draft.confirmed = false;
      inspectRows(draft).forEach(entry => { entry.row.selected = entry.valid; });
      saveDraft(draft);
      for (const meta of oldFiles) await P.moveinAttachments?.removeUnreferenced(meta).catch(() => {});
    } catch (error) { if (active(token,expected,draft)) draft.error = error.message || 'Excel-filen kunde inte läsas.'; }
    finally { draft.busy = false; refreshDraft(draft); }
  }
  async function attachFiles(input,mode) {
    const draft = getDraft(mode), index = input.dataset.piAttachment, row = mode === 'manual' ? draft : draft.rows[Number(index)];
    if (!row || draft.busy || !input.files?.length) return;
    const files = Array.from(input.files), token = generation, expected = context();
    if (files.length + row.authorityFiles.length > 3) { draft.error = 'Välj högst 3 fullmaktsbilagor per inflyttning.'; input.value = ''; P.render(); return; }
    draft.busy = true; draft.error = ''; P.render();
    let stored = [];
    try {
      if (!P.moveinAttachments?.storeFiles) throw new Error('Bilagorna kunde inte sparas. Ladda om sidan och försök igen.');
      stored = await P.moveinAttachments.storeFiles(files,draft.partner);
      if (!active(token,expected,draft)) { for (const meta of stored) await P.moveinAttachments.removeUnreferenced(meta); return; }
      row.authorityFiles.push(...stored); saveDraft(draft);
    } catch (error) { if (active(token,expected,draft)) draft.error = error.message || 'Bilagan kunde inte sparas. Försök igen.'; }
    finally { draft.busy = false; refreshDraft(draft); }
  }
  async function fileAction(button,mode,remove) {
    const draft = getDraft(mode), row = mode === 'manual' ? draft : draft.rows[Number(button.dataset.piRow)], index = Number(remove ? button.dataset.piRemove : button.dataset.piDownload), meta = row?.authorityFiles[index];
    if (!meta || draft.busy) return;
    const token = generation, expected = context();
    if (remove) { draft.busy = true; draft.error = ''; P.render(); }
    try {
      if (remove) {
        await P.moveinAttachments.removeUnreferenced(meta);
        // Navigation may finish while IndexedDB deletes the file. Keep the captured
        // draft consistent, but never resurrect a draft discarded by a reset.
        if (cache.get(`${draft.partner}:${draft.mode}`) !== draft || (mode === 'import' && !draft.rows.includes(row))) return;
        const current = row.authorityFiles.findIndex(file => file.id === meta.id);
        if (current >= 0) row.authorityFiles.splice(current,1);
        saveDraft(draft);
      }
      else await P.moveinAttachments.download(meta);
    } catch (error) { if (active(token,expected,draft)) draft.error = error.message || 'Bilagan kunde inte hanteras.'; }
    finally { if (remove) { draft.busy = false; refreshDraft(draft); } else if (draft.error && active(token,expected,draft)) P.render(); }
  }
  async function submit(mode) {
    const draft = getDraft(mode);
    if (draft.busy || !allowed()) return;
    if (!draft.confirmed) { draft.error = 'Bekräfta att du använder fiktiva uppgifter och testfiler.'; P.render(); $('#pi-import-confirm')?.focus(); return; }
    let rows;
    if (mode === 'manual') {
      const errors = rowErrors(draft.fields);
      if (errors.length) { draft.error = errors.join('. ') + '.'; P.render(); return; }
      rows = [{ ...draft.fields, partner: draft.partner, authorityFiles: draft.authorityFiles }];
    } else rows = inspectRows(draft).filter(entry => entry.valid && entry.row.selected).map(entry => ({ ...entry.row.fields, partner: draft.partner, authorityFiles: entry.row.authorityFiles }));
    rows.forEach(row => { row.desiredProduct = draft.desiredProduct || ''; });
    if (!rows.length) { draft.error = 'Välj minst ett giltigt underlag att spara.'; P.render(); return; }
    const token = generation, expected = context(); draft.busy = true; draft.error = ''; P.render();
    try {
      if (!P.moveinService?.createPartnerRecords) throw new Error('Registreringen är inte tillgänglig. Ladda om sidan och försök igen.');
      const result = await P.moveinService.createPartnerRecords(rows,{ source: mode === 'import' ? 'excel' : 'manual', batchId: draft.batchId || '', filename: draft.filename || '' });
      if (!active(token,expected,draft)) return;
      if (!result.ok || !result.created?.length) {
        const errors = (result.errors || []).map(error => typeof error === 'string' ? error : error.message || error.error || 'Underlaget kunde inte sparas');
        draft.error = errors.join('. ') || (result.duplicates?.length ? 'Den här inflyttningen finns redan bland era ärenden. Öppna ärendelistan för att komplettera den.' : 'Underlaget kunde inte registreras. Kontrollera uppgifterna och försök igen.');
      } else {
        receipt = { partner: draft.partner, created: result.created, duplicates: result.duplicates || [], saved: result.saved !== false };
        receipt.draftCleared = clearDraft(mode,draft.partner);
      }
    } catch (error) { if (active(token,expected,draft)) draft.error = error.message || 'Underlaget kunde inte registreras.'; }
    finally { draft.busy = false; if (token === generation && context() === expected && allowed()) { P.render(); $('.pi-success h1')?.setAttribute('tabindex','-1'); $('.pi-success h1')?.focus(); } }
  }
  function bindCommon() {
    document.querySelector('#intake-product')?.addEventListener('change',event=>{const draft=getDraft(P.page==='property-import'?'import':'manual');if(draft.busy){event.target.value=draft.desiredProduct;return;}draft.desiredProduct=event.target.value;saveDraft(draft);});
    $('[data-pi-back]')?.addEventListener('click',() => { generation++; receipt = null; P.go(['property-intake','movein'].includes(P.page) ? 'overview' : 'property-intake'); });
    document.querySelectorAll('[data-pi-mode]').forEach(button => button.addEventListener('click',() => open(button.dataset.piMode)));
    $('[data-pi-records]')?.addEventListener('click',() => { generation++; receipt = null; P.go('property-registrations'); });
    $('[data-pi-new]')?.addEventListener('click',() => open('choice'));
  }
  function bindFiles(mode) {
    document.querySelectorAll('[data-pi-attachment]').forEach(input => input.addEventListener('change',() => attachFiles(input,mode)));
    document.querySelectorAll('[data-pi-remove]').forEach(button => button.addEventListener('click',() => fileAction(button,mode,true)));
    document.querySelectorAll('[data-pi-download]').forEach(button => button.addEventListener('click',() => fileAction(button,mode,false)));
  }
  function bindManual() {
    bindCommon(); if (!allowed() || receipt) return;
    const draft = getDraft('manual'), form = $('#pi-manual-form');
    if (draft.busy) form.querySelectorAll('input,button').forEach(input => { input.disabled = true; });
    for (const key of Object.keys(limits)) form.elements.namedItem(key).addEventListener('input',event => { draft.fields[key] = event.target.value; saveDraft(draft); });
    form.elements.demoOnly.addEventListener('change',event => { draft.confirmed = event.target.checked; });
    $('#pi-fill-example').addEventListener('click',() => { if (draft.busy) return; draft.fields = exampleFields(); saveDraft(draft); P.render(); $('#pi-address').focus(); });
    form.addEventListener('submit',event => { event.preventDefault(); submit('manual'); });
    bindFiles('manual');
  }
  function bindImport() {
    bindCommon(); if (!allowed() || receipt) return;
    const draft = getDraft('import');
    $('#pi-template').addEventListener('click',async () => { try { await template(); } catch (error) { draft.error = error.message; P.render(); } });
    $('#pi-excel-file').addEventListener('change',event => importFile(event.target.files[0]));
    const drop = $('.pi-dropzone');
    for (const name of ['dragenter','dragover']) drop.addEventListener(name,event => { event.preventDefault(); if (!draft.busy) drop.classList.add('pi-drag-over'); });
    for (const name of ['dragleave','drop']) drop.addEventListener(name,event => { event.preventDefault(); drop.classList.remove('pi-drag-over'); if (name === 'drop' && !draft.busy) importFile(event.dataTransfer.files[0]); });
    document.querySelectorAll('[data-pi-select]').forEach(input => input.addEventListener('change',event => { draft.rows[Number(input.dataset.piSelect)].selected = event.target.checked; saveDraft(draft); P.render(); $(`[data-pi-select="${input.dataset.piSelect}"]`)?.focus(); }));
    $('#pi-select-all')?.addEventListener('change',event => { inspectRows(draft).forEach(entry => { entry.row.selected = entry.valid && event.target.checked; }); saveDraft(draft); P.render(); $('#pi-select-all')?.focus(); });
    $('#pi-import-confirm')?.addEventListener('change',event => { draft.confirmed = event.target.checked; });
    $('#pi-import-save')?.addEventListener('click',() => submit('import'));
    bindFiles('import');
  }
  P.propertyIntake = { open, clearDrafts, parseFile, downloadTemplate: template, validate: rowErrors, draftPrefix: prefix };
  P.propertyDrafts = { clearAll: clearDrafts };
  P.openMovein = (partnerId = P.partner) => open('choice',partnerId);
  const previousAfterRender = P.afterRender;
  P.afterRender = () => { const nextContext = `${P.role}:${context()}`; if (nextContext !== previousContext) { generation++; previousContext = nextContext; } previousAfterRender?.(); };
  P.register('property-intake',{ render: renderChoice, bind: bindCommon });
  P.register('movein',{ render: renderChoice, bind: bindCommon });
  P.register('property-manual',{ render: renderManual, bind: bindManual });
  P.register('property-import',{ render: renderImport, bind: bindImport });
})();
