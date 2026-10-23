# Verifierad käll- och driftstatus

Övertagande kontrollerat 23 oktober 2026. Huvudkälla:
https://github.com/HakanRusk/kraftringen-partnerlabb.
GitHub-anslutningen identifierar HakanRusk och bekräftar läs-, skriv- och
administratörsbehörighet. Repo-ID 1410943706 är överfört till HakanRusk;
gamla repo-adressen returnerar samma nya ägare och ID. Repot är fortsatt publikt.

Ny privat Site: `appgprj_6adb2c876a0c8191b1fa3c755a73f61a`.
https://kraftringen-partnerlabb-hakan.wry-mite-1036.chatgpt.site
Sites bekräftar Håkan Rusk som ägare och endast ägaren i åtkomstlistan
(policyrevision 1). Ludwigs tidigare Site lämnas orörd.

- Exakt publiceringskvittens: WORKLOG.md. Registrerad Site är inte i sig publicerad.
- Detaljer, testbegränsningar och återstående kontosteg: docs/HANDOVER-2026-10-23.md.
- Baslinje main b09d2c8c6e608bb85f35d80e8ab2c2da53bb2787 hade grön CI
  39142634577. Nya revisioner kräver egna verifierade resultat.
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
