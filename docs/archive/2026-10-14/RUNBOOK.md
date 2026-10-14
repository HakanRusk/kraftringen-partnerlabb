# Utvecklingspass och publicering

## Aktiv gemensam källa

GitHub är huvudkälla: https://github.com/ludros93-prog/kraftringen-partnerlabb.
Koden och Git-historiken har laddats upp. GITHUB-STATUS.md anger verifierade
övergångsfakta och WORKLOG.md anger faktisk källöverföring och aktivering.
RUNBOOK-SITES.md bevarar den äldre rutinen som referens; nya utvecklingspass
följer denna fils gren- och PR-rutin.

## Uppdrag och huvudkälla

Arbeta enbart med Partnerlabb, Sites `appgprj_6ac600ecf7d48191923687550810c1d4`.
Användaren har aktiverat bygguppdraget i MISSION.md och därefter valt publikt
GitHub för gemensam utveckling med Codex och Claude. GitHub är huvudkälla för
kod och arbetsminne. Sites är publiceringsmål för den befintliga testportalen.

Rutinmässiga reversibla förbättringar inom frontendprototypen behöver ingen
ny godkännandefråga. Arbeta självständigt fram till verifierad kandidat och
pull request. Ludwig/Codex samordnar inledningsvis integration till `main`
och publicering. Daniels ändringar behöver Ludwigs uttryckliga godkännande
av konkret pull request och aktuell commit före integration eller publicering.
Affärsvillkor och verkliga integrationer är fortsatt öppna
frågor enligt AGENTS.md.

AGENTS.md, MISSION.md, PILOT-MISSION.md, PILOT-FACTS.md, PILOT-DECISIONS.md,
PILOT-ACCEPTANCE.md, RUNBOOK.md, COLLABORATION.md, BACKLOG.md och WORKLOG.md
är beständigt arbetsminne i GitHub. Deployment innehåller bara `dist/` och
`.openai/hosting.json`; den publicerade HTML-sidan räcker inte för att läsa
uppdraget. Ett färskt utvecklingspass ska hämta aktuell GitHub-källa, läsa
instruktionerna och kontrollera pågående pull requests. Förutsätt inte att
tidigare scratch-skript eller en lokal checkout finns i en ny miljö.

## Varje utvecklingspass

1. Hämta aktuell GitHub-`main` och kontrollera egna eller främmande ändringar,
   öppna pull requests och pågående arbete. Återuppta en dokumenterad egen
   uppgift eller välj högsta genomförbara backloguppgift. Undvik konkurrerande
   implementation av samma problem.
   Pilotmissionen styr prioriteringen. Räkna färdiga pilotförslag som väntar
   på granskning; högst två får vänta. När gränsen nåtts, förbättra befintlig
   verifiering eller beslutsunderlag och öppna inte ytterligare förslag.
2. Skapa en separat arbetsgren från aktuell bas. Använd `codex/`, `claude/`
   eller `agent/` som prefix och en tydlig uppgift i namnet. Parallella
   uppgifter använder separata checkouter/worktrees.
3. Bekräfta problemet med kod, reproduktion eller faktisk återkoppling.
   Dokumentera förutsättningar och implementera en avgränsad förbättring.
4. Kör relevanta kontroller för ändrade flöden. Bevara statisk
   `dist/`-portabilitet, lokal lagring och migreringar, partneravgränsning och
   fristående ekonomiska fixtures. Använd syntetiska testuppgifter.
5. Hämta aktuell huvudgren före slutförandet. Förena nytillkomna ändringar
   utan att skriva över andras arbete och kör om berörda kontroller. Använd
   aldrig force-push till den gemensamma huvudgrenen eller Sites-källan.
6. Uppdatera backlog och logg med faktiskt resultat. Commit/push endast din
   egen arbetsgren och öppna en pull request till `main`. Ange problem,
   användarnytta, testbelägg, begränsningar och nästa steg. Om PR-verktyg eller
   behörighet saknas, bevara kandidat och rapportera exakt vad som återstår.

Schemalagda masteragentpass följer samma arbetsgång. De lämnar en PR och gör
ingen direkt push till `main` eller Sites. En uppgift som behöver fler pass
fortsätter i sin dokumenterade kandidat; halvfärdig kod publiceras inte.
Schemaläggningen ger inget bevis för processlås, oavbruten drift, garanterad
återstart eller leverans varje timme. Körningen ändrar inte sitt eget eller
andras schema, prompt eller aktivering.

Spara verkliga nya fakta, beslut och nästa steg i den egna grenen/PR:en och
uppgiftsrapporten så att nästa pass kan återuppta arbetet även innan merge.
PILOT-FACTS ska alltid skilja källa och observation från hypotes. Rapportera
kort enligt PILOT-MISSION, med sammanfattning av dygnets väsentliga resultat
vid första passet efter kl. 08 svensk tid; undvik dubbla sammanfattningar
utifrån tillgänglig tidigare rapportstatus. Detta skapar inget nytt schema.

## Samordnarens integration och publicering

För Daniels ändringar ska samordnaren först presentera konkret PR, aktuell
HEAD-SHA, användarnytta, ändringar och verifiering för Ludwig. Vänta på hans
uttryckliga godkännande av den revisionen före GitHub-APPROVE, merge eller
Sites-publicering. Detta gäller också vidarebearbetningar som innehåller hans
arbete. Dokumentera godkänd PR och SHA samt var godkännandet lämnades.
Nya commits eller integrationskorrigeringar behöver förnyat godkännande av
aktuell revision. Ett allmänt bygguppdrag, repoåtkomst
eller användning av Ludwigs tekniska GitHub-identitet är inget godkännande.
Använd inte administratörens möjlighet att gå förbi GitHub-regler för att
föra in Daniels arbete utan hans godkännande. Oberoende arbete inom tidigare
mandat får fortsätta enligt instruktionerna.

1. Granska färdiga pull requests, förena dem med aktuell GitHub-`main` och
   testa den samlade kandidaten. Slå ihop färdiga ändringar enligt repots
   tillgängliga regler. Anta inte att GitHub-grenskydd eller CI finns förrän
   det faktiskt har aktiverats och verifierats.
2. Läs aktuell Sites-metadata, lyckad publicering och fjärrkälla med aktuell
   Sites-skill. Skilj sparad version, Sites-källrevision och publicerad version.
   Bevara Site-identitet och åtkomst. Kontrollera att ingen separat Sites-
   ändring eller publicering pågår.
3. Överför GitHubs verifierade `main` till Sites-källan med bibehållen Git-
   historik. När källorna delar historik ska överföringen vara fast-forward.
   Om Sites innehåller en senare, ej importerad ändring: stoppa överföringen,
   ta in ändringen via en GitHub-arbetsgren och PR, och kontrollera resultatet
   innan publicering. Ersätt inte Sites-historik med force-push.
4. Kontrollera att exakt GitHub-SHA finns i Sites-källan. Skapa deployment-
   arkivet från samma verifierade revision, utan lokala eller ocommittade
   ändringar. Statisk app behöver inget paketbygge. Lagra aldrig credentials
   i filer, loggar, Git, prompt eller arkiv; använd miljöns tillåtna överföring.
5. Spara den exakta revisionen som Sites-version och publicera genom verktyget
   för befintlig publik. Custom-delning ska bevaras. En GitHub-push eller
   en sparad Sites-version är inte ett publiceringsbevis.
6. Verifiera native deploymentkvittens. Följ bara icke-terminal deployment.
   `Succeeded` med rätt URL är publiceringsbevis. Registrera faktisk SHA,
   version-ID, deployment-ID, tester och datum i WORKLOG. Efterhandskvittensen
   kan läggas i en dokumentations-PR efter den publicerade revisionen; säg då
   uttryckligen att `dist/` är oförändrad.

Överföringsflödet ska verifieras vid första GitHub-publiceringen. Automatisk
synk och GitHub Actions-publicering ingår inte förrän ett sådant flöde har
implementerats och provats. Skapa inget nytt Sites-projekt och ändra inte
webbplatsens delning som del av en kodpublicering.

## När förutsättningar saknas

Rapportera ett konkret hinder om miljön saknar kodexecutor, GitHub-källåtkomst,
PR-behörighet eller publiceringsverktyg. Kalla inte research för implementation,
en begärd körning för en utförd körning eller en lokal kandidat för en öppnad
PR. Gör tillåtet oberoende arbete och spara det när det går.

Vid osäkert sparresultat: läs tillbaka innan du försöker igen så att inget
dupliceras. Återförsök endast ett verifierat tillfälligt fel. Skapa inga
återförsöksloopar, nya tjänster eller externa utskick på eget initiativ.

## Kort kvittens

Ange uppgift, användarnytta, faktiskt körda kontroller, arbetsgren/PR och
integrations- eller publiceringsstatus samt ett eventuellt konkret hinder.
Uppdatera bara belagda resultat. När ingen meningsfull ändring eller ny
blockerare finns: undvik rutinmässiga allt-ser-bra-ut-meddelanden och tomma
datum- eller kodcommits.
