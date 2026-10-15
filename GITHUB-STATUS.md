# Verifierad käll- och driftstatus

GitHub är aktiv huvudkälla: https://github.com/ludros93-prog/kraftringen-partnerlabb.
Publikt repo valt av Ludwig 8 oktober; kod/docs-synk och publicering bekräftad
igen 14 oktober. Källhistoriken bevaras. Sites är separat privat publiceringsmål.

- Senaste publiceringskvittens, exakta SHA/version/deployment: WORKLOG.md.
- Senast bekräftat publicerad: v38, operativt CRM, 15 oktober 2026
  via PR #58. Exakt käll-/publiceringskvittens finns i WORKLOG.md.
- Custom-delningen ska bevaras. GitHubs synlighet ändrar inte portalens inloggning.
- Daniels konto daniel-smail: senast verifierad publik läsning, ej bekräftad skrivåtkomst.
  Tidigare försök att ändra åtkomst och grenskydd nekades med 403.
- CODEOWNERS finns; obligatoriskt kodägargodkännande/grenskydd är inte verifierat.
  Manuella ägarsteg: GITHUB-ACCESS.md. Inget åtkomst-/skyddsbeslut ändras i detta pass.
- CI är aktiverad och verifierad grön via PR #53: Node/DOM, Chromium och QA gate.
  Workflow: .github/workflows/quality.yml; exakt körning/revision i WORKLOG.md.
  Den kör på varje PR och push till main men publicerar inte till Sites.
- Ingen automatisk GitHub→Sites-publicering eller gemensam appdata finns.

Befintlig timuppgift: Automation_e03c6b2fc3448191a58c63c969a090c0, Partnerlivs
pilotagent. Senaste historiska konfigurationsavläsning 10 oktober 21:21 UTC:
enabled=true, timschema Europe/Stockholm. Detta pass ändrar/återverifierar inte
schemat och gör inga påståenden om aktuell körning. Tidigare kvittenser och
övergångshistorik finns i docs/archive/2026-10-14/GITHUB-STATUS.md.
