# Verifierad käll- och driftstatus

Senaste publicering och GitHub-anslutning kontrollerad 5 november 2026.
Övertagandets historiska kontroller är från 23 oktober. Huvudkälla:
https://github.com/HakanRusk/kraftringen-partnerlabb.
GitHub-anslutningen identifierar HakanRusk och bekräftar läs-, skriv- och
administratörsbehörighet. Repo-ID 1410943706 är överfört till HakanRusk;
gamla repo-adressen returnerar samma nya ägare och ID. Repot är fortsatt publikt.

Ny privat Site: `appgprj_6adb2c876a0c8191b1fa3c755a73f61a`.
https://kraftringen-partnerlabb-hakan.hakan-rusk.chatgpt.site
Sites bekräftar Håkan Rusk som ägare och endast ägaren i åtkomstlistan
(policyrevision 1). Ludwigs tidigare Site lämnas orörd.

- Senaste publicering: native succeeded 5 november 2026, version 14.
  Källa `3199fc59c2998bf61e3cf7b720e621ac616fa0ff`, integrerad via PR #91.
  Lokal demoinloggning med admin, handläggare, säljledare och säljare;
  egna orderresultat, gruppurval, rättning och omfördelning. Ingen skarp autentisering.
  Exakta version-/deployment-ID:n och verifieringsgränser finns i WORKLOG.md.
- CI 42028104658 passerade samtliga 17 Node-/DOM-sviter, nio Chromium-sviter
  och QA gate för `3f2c6622cce1a4b13ae8dbd52c4e197e14c6e0a9`.
  Rollvyer och centrala flöden verifierades vid 320/390/1440 px; publicerad main
  har exakt samma träd. Återgång till version 13: docs/PROTOTYPE-ROLES.md.
- Övertagandet: samtliga dåvarande 99 filer verifierades via HTTPS 23 oktober.
  Detta är historiskt belägg, inte en ny bytekontroll av v2. Enhetsinstallation
  och interaktiv live-inloggning återstår. Detaljer: docs/HANDOVER-2026-10-23.md.
- `.github/workflows/quality.yml` kör Node/DOM, Chromium och QA gate. Den är
  aktiv, använder inga secrets och publicerar inte. Automatisk GitHub→Sites-synk finns inte.
- CODEOWNERS uppdateras till @HakanRusk. Main returnerade protected=false,
  protection.enabled=false och inga required status checks; rulesets var tom.
  Inget tekniskt grenskydd är aktiverat enligt dessa läsningar. Inga inställningar
  ändrades. Medarbetares aktuella rättigheter är inte verifierade; se GITHUB-ACCESS.md.
- Ingen Partnerlabb-automation hittades i det nya kontots uppgiftslista.
  Nya Site saknar scheman. Ingen agent, prompt, aktivering eller tjänst har satts i drift.
- Gamla kontots taskstatus och mediekonto har inte överförts eller ändrats.
  Gamla ID:n i historiken är belägg, inte mål eller aktiva uppdrag här.
- Prototypens data ligger lokalt i respektive webbläsare/ursprung. Gamla lokala
  ärenden, bilagor, ljud och framsteg följer inte nya adressen automatiskt.
