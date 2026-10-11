(() => {
  'use strict';
  // Installation is optional. No service worker, cache or portal-data writes:
  // the existing private Site and its regular updates remain the source.
  const displayMode = window.matchMedia('(display-mode: standalone), (display-mode: fullscreen), (display-mode: minimal-ui)');
  const isAppleMobile = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  let installPrompt = null;
  let installed = false;
  let prompting = false;
  const inApp = () => installed || displayMode.matches || navigator.standalone === true;
  const activeGuide = () => document.querySelector('#portal-dialog')?.open && document.querySelector('#install-app-guide');

  function refresh() {
    const entry = document.querySelector('#install-app');
    if (entry) entry.hidden = inApp();
    if (!activeGuide()) return;
    const button = document.querySelector('#install-app-confirm');
    button.hidden = !installPrompt || inApp();
    button.disabled = prompting;
  }

  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    if (!inApp()) installPrompt = event;
    refresh();
  });
  window.addEventListener('appinstalled', () => {
    installed = true;
    installPrompt = null;
    if (activeGuide()) document.querySelector('#install-app-status').textContent = 'Partnerlabb har lagts till. Öppna appen från dess ikon.';
    refresh();
  });
  displayMode.addEventListener('change', refresh);
  window.addEventListener('pageshow', refresh);

  document.addEventListener('DOMContentLoaded', () => {
    const P = window.Portal;
    const entry = document.querySelector('#install-app');
    if (!P || !entry) return;
    entry.addEventListener('click', () => {
      if (inApp()) return;
      // Reuse the menu's close/focus behavior without navigating or saving.
      if (document.querySelector('#sidebar').classList.contains('open')) document.querySelector('#menu-toggle').click();
      const steps = isAppleMobile
        ? '<li>Öppna Partnerlabb i <strong>Safari</strong>. Om du är i ChatGPT: öppna länken i Safari först.</li><li>Tryck på <strong>Dela</strong> och välj <strong>Lägg till på hemskärmen</strong>.</li><li>Behåll <strong>Öppna som webbapp</strong> aktiverat om valet visas. Tryck på <strong>Lägg till</strong>.</li>'
        : /Android/.test(navigator.userAgent)
          ? '<li>Öppna Partnerlabb i <strong>Chrome</strong> på mobilen.</li><li>Öppna webbläsarens meny <strong>⋮</strong> och välj <strong>Installera app</strong> eller <strong>Lägg till på startskärmen</strong>.</li><li>Bekräfta och öppna Partnerlabb från appikonen.</li>'
          : '<li>Öppna Partnerlabb i <strong>Chrome eller Edge</strong>. Välj installationsikonen vid adressfältet eller installationsvalet i webbläsarens meny.</li><li>På Mac med Safari: välj <strong>Arkiv → Lägg till i Dock</strong>.</li><li>Bekräfta och öppna Partnerlabb från appikonen. Om installationsvalet saknas kan du fortsätta använda webbplatsen.</li>';
      P.openDialog('Lägg till som app', `<section id="install-app-guide"><div class="install-app-heading"><img src="assets/app-icon-192.png" width="64" height="64" alt=""><div><strong>Partnerlabb</strong><p>Direkt från din hemskärm.</p></div></div><ol class="install-app-guide">${steps}</ol><p class="install-app-note">Internet och samma inloggning behövs. Sparade testuppgifter och utbildningsframsteg är lokala; de kan vara separata i appen och webbläsaren.</p><p id="install-app-status" class="install-app-status" role="status" aria-live="polite"></p><button type="button" id="install-app-confirm" class="btn btn-primary install-app-action" hidden>Installera Partnerlabb</button></section>`, () => {
        const button = document.querySelector('#install-app-confirm');
        const status = document.querySelector('#install-app-status');
        button.addEventListener('click', async () => {
          if (!installPrompt || prompting || inApp()) return;
          const prompt = installPrompt;
          installPrompt = null;
          prompting = true;
          button.disabled = true;
          try {
            await prompt.prompt();
            const choice = await prompt.userChoice;
            if (!installed) status.textContent = choice.outcome === 'accepted'
              ? 'Följ webbläsarens sista steg. Öppna sedan Partnerlabb från appikonen.'
              : 'Installationen avbröts. Du kan lägga till appen senare via webbläsarens meny.';
          } catch {
            status.textContent = 'Installationen kunde inte öppnas. Använd stegen ovan i webbläsaren.';
          } finally {
            prompting = false;
            // A late response must not change a different portal dialog.
            if (activeGuide() && document.querySelector('#install-app-confirm') === button) refresh();
          }
        });
        refresh();
      });
    });
    refresh();
  });
})();
