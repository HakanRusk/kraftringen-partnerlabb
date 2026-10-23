# GitHub för Codex och Claude Code

Destination: https://github.com/HakanRusk/kraftringen-partnerlabb

Användaren skapade repot och valde uttryckligen att låta det vara publikt
den 8 oktober 2026. Källkod och hela Git-historiken är uppladdade. GITHUB-STATUS.md
beskriver det aktiva arbetssättet och verifierade övergångsfakta.

GitHub-överföringen och HakanRusks läs/skriv/admin-åtkomst är verifierade.
Medarbetares aktuella åtkomst är separat och har inte ändrats. Se GITHUB-ACCESS.md.
Sites-visning innebär inte GitHub-skrivåtkomst. Ingen agent har aktiverats här.

## Börja utveckla

Klona den gemensamma källan:

```sh
git clone https://github.com/HakanRusk/kraftringen-partnerlabb.git
cd kraftringen-partnerlabb
```

Daniel startar Claude Code i katalogen. CLAUDE.md läser samma instruktioner
som Codex: AGENTS.md, MISSION.md, RUNBOOK.md, COLLABORATION.md och arbetsminnet.
Använd varsitt GitHub-konto och godkänd verktygsanslutning.

Arbeta i egna `claude/`, `codex/` eller `agent/`-grenar och lämna en pull
request till `main`. Håkan/Codex samordnar integration och publicering.
Se COLLABORATION.md och RUNBOOK.md för hela arbetsgången.

Håkan ska godkänna Daniels konkreta PR och aktuella revision före integration
och publicering. Daniel kan fortsätta utveckla i egen gren medan förslaget
väntar på godkännande. Se GITHUB-ACCESS.md för åtkomst och GitHubs granskningsregel.

Appen kan köras lokalt utan paketinstallation eller byggsteg:

```sh
python -m http.server 8000 --directory dist
```

Öppna http://localhost:8000. qa/ innehåller återkörbara kontroller som
kräver Python Playwright och Chromium enbart för verifieringen.

## Kod, testdata och publicering

Git-historiken bevaras, så koden kan föras till det nya Sites-projektet med
fast-forward. Ingen automatisk publicering eller gemensam databas finns. Aktiv QA-workflow
finns i .github/workflows/quality.yml; den kräver inga secrets och publicerar inte.
Äldre mall i templates/ är inte workflowens aktuella källa.

Testärenden lagras i varje webbläsare. GitHub delar koden, inte lokala
testärenden. Lägg aldrig tokens, webbläsarexporter eller riktiga
kunduppgifter i repot och dela inte verktygens credentials med varandra.

Det nya privata portalens mål är (publiceringskvittens i WORKLOG.md):
https://kraftringen-partnerlabb-hakan.wry-mite-1036.chatgpt.site.
