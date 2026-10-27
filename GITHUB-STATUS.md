# Verifierad käll- och driftstatus

Senaste publicering kontrollerad 27 oktober 2026; övertagandets åtkomstkontroller
är från 23 oktober. Huvudkälla:
https://github.com/HakanRusk/kraftringen-partnerlabb.
GitHub-anslutningen identifierar HakanRusk och bekräftar läs-, skriv- och
administratörsbehörighet. Repo-ID 1410943706 är överfört till HakanRusk;
gamla repo-adressen returnerar samma nya ägare och ID. Repot är fortsatt publikt.

Ny privat Site: `appgprj_6adb2c876a0c8191b1fa3c755a73f61a`.
https://kraftringen-partnerlabb-hakan.wry-mite-1036.chatgpt.site
Sites bekräftar Håkan Rusk som ägare och endast ägaren i åtkomstlistan
(policyrevision 1). Ludwigs tidigare Site lämnas orörd.

- Senaste publicering: native succeeded 27 oktober 2026 kl. 16:19 svensk tid.
  Källa 06b671fe08559b9729b08891345062c62153941d, integrerad via PR #87.
  Version 12 har gemensam Kundrum-stil och avstämt vattenfall; mobil visar
  lodrätt flöde. Statusar, provisionsmodell, material och orderdata bevaras.
  Exakt version/deployment och verifiering: WORKLOG.md.
- Valbart orderförslag med återgång: docs/ORDER-PROPOSAL.md. Tidigare versioner kvar.
  Face2faces modell är bekräftad; alla orderdata är exempel. Inga verkliga
  fakturor, betalningar eller partnerbehörigheter skapas.
- CI 40528809087 passerade Node/DOM, Chromium 320/390/1440 px och QA gate
  för e3337c2939729bca6ff517d1a596482df4599094. Publicerad main har samma träd.
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
