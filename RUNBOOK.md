# Utveckling och publicering

GitHub är huvudkälla: https://github.com/HakanRusk/kraftringen-partnerlabb.
Sites-mål: appgprj_6adb2c876a0c8191b1fa3c755a73f61a,
https://kraftringen-partnerlabb-hakan.wry-mite-1036.chatgpt.site.
Regler/mandat och särskilt godkännande för Daniels arbete finns i AGENTS.md.
RUNBOOK-SITES.md hänvisar till denna aktuella rutin.
Övertagandet och verifieringsgränser dokumenteras i docs/HANDOVER-2026-10-23.md.

## Utvecklingspass

1. Hämta aktuell main, kontrollera lokala ändringar och öppna PR:er. Följ
   AGENTS läsordning. Återuppta egen uppgift eller välj högsta genomförbara backlog.
2. Skapa egen codex/, claude/ eller agent/-gren. Bekräfta problemet och gör en
   avgränsad förbättring. Samordna befintliga förslag; starta inte en konkurrerande kopia.
3. Kör relevanta kontroller. `npm ci && npm test` installerar bara QA-beroenden.
   Statisk portal körs med `python -m http.server 8000 --directory dist`.
   Browserkörning beskrivs i qa/README.md; följ miljöns tillgängliga verktyg.
4. Hämta aktuell main före slutförandet. Förena nya ändringar utan att skriva
   över andras arbete och verifiera berörda flöden igen.
5. Uppdatera BACKLOG/WORKLOG med faktiskt resultat, commit/pusha egen gren,
   öppna PR med problem, ändring, verifiering och kvarstående begränsningar.
   Kontrollera CI på aktuell HEAD; antag inte att workflowfil betyder grön körning.

Eventuella framtida schemalagda pass följer denna rutin och PILOT-MISSION.md.
Ingen Partnerlabb-automation är aktiverad i Håkans konto vid övertagandet.
Ingen körning ändrar sitt schema eller publicerar vid sidan av samordnaren.

## Samordnarens integration och publicering

1. Kontrollera aktuella PR-HEAD, nödvändigt användargodkännande enligt AGENTS
   och gröna kontroller. Integrera endast verifierat, auktoriserat arbete i main.
2. Läs aktuell Sites-skill, metadata, publicering och fjärrkälla. Bevara den nya Site-identiteten
   och privata ägaråtkomsten; kontrollera att ingen separat ändring/publicering pågår.
3. Överför verifierad GitHub-main till Sites-källan med bibehållen historik och
   fast-forward. Om Sites har ny oimporterad ändring: ta in via GitHub-gren/PR
   och verifiera innan publicering. Ingen force-push.
4. Kontrollera exakt SHA/träd och ren checkout. Paketera samma revision med
   Sites-flödet; statisk app kräver inget bygge. Credentials får inte hamna i
   filer, loggar, Git eller arkiv. Följ skillens säkra överföringssätt.
5. Spara version och publicera till befintlig publik. Följ bara icke-terminal
   deployment. `succeeded` med rätt URL är kvittens; push/sparad version är det inte.
6. Registrera SHA, version-ID, deployment-ID, datum och tester i WORKLOG.
   En separat dokumentations-PR kan kvittera publiceringen; ange då att dist/
   är oförändrad. GITHUB-STATUS länkar till loggens senaste kvittens.

CI publicerar inte till Sites. Grenskydd, automatisk synk och delad data får
bara kallas införda efter faktisk verifiering. Deploymentarkivet är inte hela
arbetsminnet: läs alltid aktuell GitHub-källa i ett nytt pass.

## Hinder och osäkra resultat

Läs tillbaka före nytt skrivförsök när resultatet är osäkert. Återförsök bara
verifierat tillfälligt fel; kringgå inga behörigheter. Slutför oberoende tillåtet
arbete och rapportera konkret hinder, inte uppfunnen PR/test/publicering.
Inga tomma statuscommits eller rutinrapporter utan meningsfull ändring/nytt hinder.
