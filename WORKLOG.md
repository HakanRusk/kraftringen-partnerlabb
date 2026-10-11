# Arbetslogg

## 2026-10-09 — Kandidat: hitta sparat testunderlag efter omladdning

- Uppgift: INFLYTT-03. `receipt` i `property.js` var endast modulminne, trots
  att samma registrering redan sparades i `moveins`. Efter omladdning visades
  därför ett nytt tomt flöde utan direkt väg tillbaka till testkvittot.
- Kandidat: hyresgästsidans första steg visar den senaste återställbara lokala
  registreringen för vald fastighetspartner. Den öppnar samma `moveins`-post,
  visar aktuell teststatus och anpassat nästa steg samt kan skapa ett nytt
  TXT-testkvitto. Knappen för ny registrering säger uttryckligen att det gäller
  ett annat underlag.
- Avgränsning: återställning skapar ingen ny post, kund, affär, intäkt eller
  kickback. Seedade exempel, äldre intressen utan uttryckligt tjänsteval och
  andra partners poster filtreras bort. All data är fortsatt lokal och fiktiv.
- Verifiering: `node --check dist/property.js`,
  `node qa/movein-receipt.mjs`, `node qa/movein-next-action.mjs`, Python-AST
  för den utökade `qa/movein-service.py` och `git diff --check` passerar.
  Den nya modulregressionen kontrollerar senaste post, partnerisolering,
  seedfiltrering, aktuell status och oförändrat antal ärenden. Browser-QA
  kördes inte eftersom föreskriven Sites-browserkontroll saknades i passet.
- Leveransläge: egen gren `codex/inflytt-03-kvitto`, kandidatcommit
  `4d99e14f40967f6870f63e45f79b3fae3fb28531` och GitHub PR #1:
  https://github.com/ludros93-prog/kraftringen-partnerlabb/pull/1.
  PR:en är öppnad mot oförändrad `main` på
  `347f02a1a1cdfe47e2abb33793e9f24b1575f758`. Ingen integration till `main`
  eller Sites-publicering gjordes i detta utvecklingspass.
- Nästa uppgift efter granskning: välj en ny belagd backlogpunkt; DATA-01 väntar
  fortsatt på verkligt verksamhetsunderlag och RESEARCH-01 kräver säker
  identifiering av Saleshub.

## 2026-10-08 — Rätt nästa insats efter kompletterad överlämning

- Uppgift: INFLYTT-02. Koden reproducerade att ett återförmedlat
  `needs_info`-ärende bytte ansvar till Kraftringen men behöll partnerns gamla
  kompletteringsplan och datum i den gemensamma arbetslistan.
- Ändring: återförmedlingen markeras som komplettering, tidigare plan och datum
  avslutas och sparas i den delade aktivitetshistoriken, och Kraftringens lista
  visar "Ta emot kompletterat underlag och fortsätt handläggningen". En senare
  uttrycklig intern plan visas oförändrat.
- Avgränsning: inga ändringar av serviceval, fullmaktsmarkering, handläggnings-
  statusar, avtal, kommersiella fixtures eller kickback. Befintlig lokal v2-data
  kräver ingen migrering; äldre ärenden utan den nya markeringen behåller sin
  tidigare generella arbetslistetext.
- Verifiering före publicering: `node --check` för berörda moduler,
  `node qa/movein-next-action.mjs`, Python-AST för den utökade
  `qa/movein-service.py` samt `git diff --check`. Den beroendefria regressionen
  bekräftar ansvarsskifte, rensat datum, bevarad historik och företräde för en
  senare intern plan. Browser-QA kördes inte eftersom föreskriven Sites-
  browserkontroll inte var tillgänglig i detta pass.
- Publicering: version 11 publicerades med native Sites-kvittens `succeeded`
  2026-10-08 kl. 21:03:31 UTC på
  https://kraftringen-partnerlabb.rosen123.chatgpt.site.
  - Pushad/publicerad SHA: `6882cde49905a672087809b7829d23d3fa59c117`.
  - Version-ID: `appgprj_6ac600ecf7d48191923687550810c1d4~appgver_dfa6ce6c536c8191a5af73efb1d44d44`.
  - Deployment-ID: `appgdep_6ac80515215c8191b2610ca02802e87d`.
  - Publiceringen använde arkivet från exakt samma SHA och bevarade Site-ID och
    befintlig custom-åtkomst.
- Nästa uppgift: avgränsa INFLYTT-03 i gränssnittet så att ett redan registrerat
  testkvitto kan hittas efter omladdning utan att ett nytt ärende skapas.

## 2026-10-08 — Etablering av masteragent och första förbättringspass

- Uppdrag: användarens inklistrade masterprompt aktiverar självständig utveckling
  av Partnerlabb inom befintlig frontendprototyp och delad testmiljö.
- Verifierad bas: Site version 9, aktuell källrevision
  `a44a8de7a73a2d8c4863936ccbd4aef85bf38d7c`, custom-åtkomst. Sites-källan
  öppnades och fjärrrevisionen verifierades före ändringar.
- Agentminne: MISSION.md, RUNBOOK.md och BACKLOG.md är etablerade i Git-källan.
- Granskning: modul-API:er reproducerade förlust av pågående underlag efter
  omladdning och en gammal kompletteringsuppgift efter förmedling. Ingen riktig
  kunddata, handläggning eller användarbeteende granskades.
- Första förbättring: INFLYTT-01 implementerad. Fält/steg sparas i
  sessionStorage per fastighetspartner och återupptas i samma flik. Sparstatus,
  explicit Börja om och rensning vid avstående/lyckad registrering/återställning
  tillkom. Utkast är åtskilda från registrerade ärenden. Fördröjda ändrings-
  händelser från gamla formulär får inte skriva till ett annat partnerutkast.
- Verifiering: JavaScript-syntax och diffkontroll; riktad Playwright-regression
  för utkast/partnerisolering/frivillighet/lagringsfel samt 71 befintliga
  inflyttningskontroller. Hela kedjan förmedling → handläggning → återkoppling,
  legacy-data, ekonomi, Savera/Face2face och 1440/390/320 px passerade utan
  webbläsarfel. Mobilbildens sparstatus och omstart granskades visuellt.
- Återkörbara kontroller finns nu i Git under qa/movein-drafts.py och
  qa/movein-service.py. De förutsätter en lokal testserver och Python Playwright
  med Chromium; appen har fortfarande inga nya beroenden eller byggsteg.
- Publicering: version 10 publicerades med native Sites-kvittens `succeeded`
  2026-10-08 kl. 20:11:51 UTC. URL:
  https://kraftringen-partnerlabb.rosen123.chatgpt.site
  - Pushad/publicerad SHA: `9bbed09df2bdcd23a1912f9af062b259df17c44a`.
  - Version-ID: `appgprj_6ac600ecf7d48191923687550810c1d4~appgver_e64334d5b788819199e331d0adaea519`.
  - Deployment-ID: `appgdep_6ac7f8f760a481919036c5dacf07c2b0`.
  - Ny Site-läsning bekräftade version 10 och oförändrad custom-åtkomst med
    samma användare och roller. Loggens denna efterhandskvittens ligger i en
    dokumentationsrevision efter den publicerade SHA:n; dist är oförändrad.
- Återkommande körning: en Sites-länkad molnuppgift är sparad och aktiverad;
  inga tidigare Partnerlabb-uppgifter fanns. Uppgift:
  `Automation_e03c6b2fc3448191a58c63c969a090c0`, Partnerlabbs masterutvecklare.
  Schemat är varje hel timme, dygnet runt, Europe/Stockholm, från
  `DTSTART;TZID=Europe/Stockholm:20261008T230000`, `RRULE:FREQ=HOURLY`.
  Verktygskvittensen bekräftar schemat; den bevisar ännu inte en genomförd
  självständig molnkörning eller oavbruten drift. Varje körning ska läsa aktuell
  Git-källa och rapportera implementation/publicering eller konkret hinder.
- Försök att starta ett första fristående molnpass direkt med
  automations_run_now gav `NOT_FOUND`, HTTP 404 "Action not found", före
  action invocation. Ingen direktstart bekräftades. Det sparade timschemat är
  verifierat men dess första faktiska körning/utveckling/publicering är ännu
  inte bekräftad. Verktygsfelet ska inte kallas misslyckad kodutveckling.
- Nästa uppgift: INFLYTT-02 efter att INFLYTT-01 testats och levererats.

## 2026-10-08 — Förberedd privat GitHub-övergång för Codex och Claude

- Användaren har uttryckligen bett att Partnerlabb läggs på GitHub för
  gemensam utveckling med Codex och Claude. GitHub-kontot `ludros93-prog`
  verifierades både genom anslutningen och gh. Daniel har angett
  `daniel-smail`; det kontot verifierades via GitHub API.
- Ingen befintlig privat Partnerlabb-destination hittades. Skapandet av
  `ludros93-prog/kraftringen-partnerlabb` nekades med
  `Resource not accessible by integration (createRepository)`. Andra projekt
  har inte ändrats och koden har inte laddats upp till ett annat repo.
- Användaren har tillfrågats om URL till ett tomt privat GitHub-repo. Daniel
  har ännu inte bjudits till något repo; hans Sites-visningsåtkomst är separat.
- Färsk Sites-källa öppnades och basen d6da7a72b57032f7d856b7074b8a0243614b2d0a
  verifierades. En separat stagingcheckout i
  /workspace/staging/partnerlabb-github innehåller förberedd Claude-konfiguration,
  gemensamma instruktioner, PR-mall och inaktiv GitHub Actions-mall.
  Övergångsstatus är prepared; ingen ny GitHub-huvudkälla påstås aktiv.
- Hela Git-historiken behålls. 107 historiska textblobs kontrollerades utan
  träff på vanliga GitHub-/OpenAI-tokenmönster eller privata nycklar. Inga
  credentials läggs i paketet. Frontend, Sites-manifest och publicerad version
  10 är oförändrade.
- Befintliga timuppgiften pausades kort under försöket och återaktiverades
  efter nekad reposkapning. Ursprunglig prompt och schema är bevarade;
  Site-läsning bekräftade återaktiveringen. Agenten ska fortsätta från Sites
  tills riktig privat uppladdning och nya gemensamma rutinen har verifierats.
- Återuppta genom att läsa färsk Sites-källa igen, verifiera privat målrepo,
  föra över bevarad historik, ge daniel-smail redigeringsåtkomst och ändra samma
  timuppgift till GitHub/egen gren/PR. Skapa ingen andra timagent och skriv
  inte över senare Sites-ändringar från ett äldre stagingpaket.

### Stagingpaket för överföring

- Staging bygger på Sites-revision f6b0e4872885f01540a27dbd72e51a7c2bffbffc
  med bevarad Git-historik. GITHUB-STATUS.md är prepared. CLAUDE-importer,
  PR-mall, statusstyrda samarbetsinstruktioner och GITHUB-START.md är klara.
- templates/github-actions-qa.yml är en inaktiv kandidat. YAML, Bash och
  inbäddad Python-syntax är validerade; Playwright 1.62.0 finns både lokalt
  och som publicerad PyPI-version. Ingen Actions-körning påstås genomförd.
- dist/ och .openai/hosting.json är identiska med Sites-källan. Paketeringen
  tillför inga frontendändringar, nya affärsregler eller backend.
- Ett ZIP-paket med källfiler och partnerlabb-history.bundle förbereds för
  överföring. Aktivering, GitHub-push och Daniels inbjudan återstår tills
  destinationen finns och dess privata åtkomst är verifierad.

## 2026-10-08 — Publik GitHub-destination vald av användaren

- Repoägaren skapade ludros93-prog/kraftringen-partnerlabb. GitHub API
  bekräftade publik synlighet och ett tomt repo. Anslutningen nekades att
  ändra synlighet med HTTP 403. Användaren valde därefter uttryckligen
  att låta repot vara publikt; detta ersätter den tidigare privata planen.
- Försök att bjuda in daniel-smail med utvecklaråtkomst nekades också med
  HTTP 403. Repoägaren behöver ordna hans åtkomst under Collaborators.
  Någon accepterad inbjudan eller skrivbehörighet påstås inte.
- Samma timuppgift är tillfälligt pausad för övergången. Färsk Sites-källa
  är fortsatt f6b0e4872885f01540a27dbd72e51a7c2bffbffc. Git-historiken
  är bevarad, Claude-importer verifierade och frontend/manifest oförändrade.
- Git-push till målrepot nekades med HTTP 403. Både GitHub-anslutningen och
  API-listan över installationens repositories bekräftade att det nya repot
  inte ingår i appens valda repositories. Den dokumenterade API-vägen att
  lägga till just detta repo nekades också med HTTP 403. Användaren har fått
  installationens inställningslänk för att ge källåtkomst. Ingen uppladdning
  eller aktivering påstås innan en faktisk GitHub-push verifierats.
- Efter fortsatt nekad källåtkomst återaktiverades samma timuppgift med
  oförändrad Sites-prompt och samma schema. Återläsning bekräftade aktivering,
  prompt och schema. GitHubövergången står kvar som prepared; ingen
  konkurrerande timagent eller ny frontendpublicering skapades.

## 2026-10-08 — GitHub-källan uppladdad och gemensam rutin aktiverad

- Användaren valde Partnerlabb i ChatGPT Codex Connector-installationens
  repositories. GitHub API bekräftade att anslutningen nu har repoåtkomst.
- Samma timuppgift pausades under övergången. Färsk Sites-källa hade hunnit
  bli 7b8f4988aff6aac4712a3c411e0d6c2770b14488 efter ett faktiskt timpass.
  Den senaste förbättringen och hela historiken importerades med en vanlig
  merge; inga commits eller appändringar skrevs över.
- GitHub-main pushades och återlästes som
  344dead6445cbdd3e3faa81472f06062b9116add. Repot är publikt enligt det
  uttryckliga användarvalet. Frontend och hostingmanifest är identiska med
  den färska Sites-källan. 146 historiska textblobs kontrollerades utan
  träff på credentialmönster; Claude-importerna var giltiga. Beroendefria
  qa/movein-next-action.mjs passerade båda regressionskontrollerna.
- Native Sites-kvittens bekräftade senast publicerad version 11 som
  succeeded, SHA6882cde49905a672087809b7829d23d3fa59c117 och deployment
  appgdep_6ac80515215c8191b2610ca02802e87d. Befintlig URL och custom-åtkomst
  är kvar. GitHubflytten gör inga frontendändringar eller nya avtal.
- Samma befintliga timuppgift har fått en ny prompt: färsk GitHub-main,
  gemensamma instruktioner, egen agent/-gren och pull request. Ingen direkt
  main-/Sites-push från ett timpass. Sparad prompt och fortsatt paus lästes
  tillbaka; schema och Europe/Stockholm är oförändrade. Återaktivering och
  källöverföring kvitteras separat efter faktisk verifiering.
- GITHUB-STATUS är active. Ludwig/Codex samordnar integration/publicering;
  Daniel/Claude Code följer samma arbetsminne och egen claude/-gren + PR.
  daniel-smail har just nu verifierad read-behörighet. Skrivinbjudan nekades
  tidigare med HTTP403; ägaren behöver ge utvecklaråtkomst i Collaborators.
  Publik läsning innebär inte skickad eller accepterad skrivinbjudan.
- GitHubs aktiveringsrevision c777983132282ffef40c0cdde503b00eb2ab2002
  hämtades till Sites-källan och fördes in med fast-forward. Sites-push och
  återläst fjärr-SHA bekräftade samma revision. Dist och hostingmanifest
  förblev identiska med den importerade Sites-basen; version 11 och
  custom-delning är oförändrade enligt ny native Site-läsning.
- Samma timuppgift återaktiverades. Privat återläsning bekräftade enabled,
  exakt ny GitHub-prompt, oförändrat timschema och Europe/Stockholm. Detta
  verifierar aktivering, inte en redan utförd körning med den nya PR-rutinen.
  Denna efterhandskvittens är en dokumentationsrevision efter källöverföringen.
- Ett nytt försök att bjuda in daniel-smail efter beviljad källåtkomst
  nekades fortfarande med HTTP403. Appen har kod- och PR-behörigheter men
  saknar behörighet att administrera Collaborators. Repoägaren behöver
  bjuda in Daniel; källuppladdningen och timagenten är genomförda.

## 2026-10-08 — Ludwig ska godkänna Daniels ändringar

- Användaren bad uttryckligen om utvecklaråtkomst för Daniel med eget
  godkännande av hans arbete. daniel-smail har fortsatt verifierad read.
  Ny inbjudan med skrivåtkomst nekades med GitHub HTTP403.
- Läsning av main-protection och en riktad ändring av kravet på kodägarens
  granskning nekades också med HTTP403. Befintliga statuskontroller eller
  andra branch-regler ändrades inte. Tekniskt skydd är inte verifierat.
- .github/CODEOWNERS anger ludros93-prog som kodägare för alla filer.
  GITHUB-ACCESS.md beskriver exakt inbjudan och branch protection som
  repoägaren behöver slutföra. CODEOWNERS ensam ger ingen teknisk spärr.
- Gemensamma Codex/Claude-instruktioner, RUNBOOK och PR-mall kräver Ludwigs
  faktiska godkännande av Daniels konkreta PR och aktuella revision före
  GitHub-APPROVE, integration och Sites-publicering. Godkänd PR, HEAD-SHA och
  verkligt godkännande ska dokumenteras. Ny kod eller integrationskorrigering
  behöver förnyat godkännande; kravet följer arbetet mellan grenar.
- En agent får inte använda ägarens tekniska identitet eller tidigare
  byggmandat som ett skenbart mänskligt godkännande. Oberoende arbete inom
  redan godkänt mandat kan fortsätta utan att Daniels ogranskade arbete tas in.
- Samma timagent har fått denna instruktion i sin prompt. Privat återläsning
  bekräftade exakt sparad prompt, fortsatt enabled och oförändrat schema och
  Europe/Stockholm. Ingen extra automation skapades.
- Detta är arbetsinstruktioner och kodägarinformation, inga appändringar.
  Senast publicerad frontendversion 11 och befintlig Sites-delning bevaras.

## 2026-10-10 — Pilotagentens uppdrag och första arbetsminne

- Ludwig bad uttryckligen ”Skapa agenten” efter resonemanget om återkommande
  hjälp att göra Partnerlabb enkelt och användbart. Samma befintliga timuppgift
  återanvänds; den pausades tillfälligt under konfigurationsbytet. Ingen dubbel
  agent skapas. Aktivering kvitteras separat efter faktisk återläsning.
- Färsk GitHub-main vid start: 347f02a1a1cdfe47e2abb33793e9f24b1575f758.
  Arbetet görs i separat codex/partnerliv-pilotagent-worktree. Pilotmissionen
  styr prioriteringen före generell utbyggnad medan befintliga mandat består.
- PILOT-FACTS skiljer bekräftat, förslag och saknat underlag med källor.
  PILOT-DECISIONS konkretiserar D-01–D-04: deltagare, godkänd process/fullmakt,
  driftmiljö/persondata och kommersiella datakällor/ersättningsregler.
- PILOT-ACCEPTANCE anger åtta fiktiva flödesfall samt separata förutsättningar
  för verklig drift. Detta är ett testunderlag, ingen ny testkvittens.
- Befintligt PR #1 (INFLYTT-03), HEAD feff078d6eb797ce0226071b855227d443a29f00
  vid läsningen, är öppet och ska återanvändas. Ingen dubblett byggs eller
  funktionell PR integreras som del av denna agentkonfiguration.
- Högst två färdiga pilotförslag får vänta på granskning. Arbetsminne sparas i
  egen gren/PR och uppgiftsrapport. Schemalagda pass gör ingen direkt push till
  main/Sites eller publicering. Daniels konkreta PR/SHA kräver fortsatt
  Ludwigs faktiska godkännande; tekniskt grenskydd påstås inte vara verifierat.
- Ändringen omfattar endast uppdrag, arbetskö och dokumentation. dist/ och
  hostingmanifest bevaras. Backend, verkliga integrationer, nya priser och
  riktiga kundärenden har inte införts.

## 2026-10-10 — Pilotagenten aktiverad och återläst

- Uppdrags- och arbetsminnespaketet integrerades via PR #2:
  https://github.com/ludros93-prog/kraftringen-partnerlabb/pull/2.
  GitHub bekräftade merge till main på revision
  30fab305d1f722c407c66d727633d840d7128934 kl. 18:39:21 UTC.
- Verifierat före integration: giltiga lokala dokumentlänkar och Claude-importer,
  git diff --check samt ingen diff i dist/ eller .openai/hosting.json.
  Separat granskning bekräftade konsekventa pilot-, fakta-, mandat-, kö- och
  godkännanderegler. Inga nya funktionella appkontroller behövdes.
- Samma Automation_e03c6b2fc3448191a58c63c969a090c0 fick titeln
  ”Partnerlivs pilotagent” och exakt prompt enligt PILOT-AGENT-PROMPT.txt.
  Sparad pausad konfiguration återlästes före aktivering. Därefter bekräftade
  en ny privat lookup kl. 18:39 UTC enabled=true, samma uppgifts-ID, exakt
  prompt, oförändrat RRULE:FREQ=HOURLY och Europe/Stockholm.
- DTSTART;TZID=Europe/Stockholm:20261008T230000 bevarades. Inget nytt schema
  eller någon extra automation skapades. Morgonsammanfattning är en
  instruktion i samma uppgift, inte ett separat garanterat klockslag.
- Lookupens senaste registrerade körning var fortfarande 18:03:50 UTC och
  next_run_time saknade värde. Aktiveringen är verifierad; ingen utförd körning
  med nya pilotprompten, ständig processdrift eller leverans varje timme
  påstås. Första leveransen i detta pass är fakta-, beslut- och acceptanspaketet.
- PR #1 är fortsatt öppet och räknas som väntande pilotförslag. Agenten ska
  kontrollera aktuell status och ta vid befintligt arbete. Denna kvittens
  ändrar endast dokumentation; ingen Sites-version eller delning ändras.

## 2026-10-10 — Kunddemo färdig och lokalt verifierad

- Ludwig bad att komma så långt som möjligt utan en faktisk kund och göra
  portalen mycket snygg, enkel och intuitiv inför kundmöten. Aktuell
  GitHub-main d547135059d3fe9ab8ec4209478dbec4159bcb60 hämtades till den egna
  grenen codex/customer-demo. Sites-källan öppnades och fjärrverifierades på
  347f02a1a1cdfe47e2abb33793e9f24b1575f758 före ändringarna.
- Befintliga PR #1, HEAD feff078d6eb797ce0226071b855227d443a29f00, införlivades
  med bevarad historik. Återupptagning av befintligt kvitto återanvänds;
  ingen parallell kvittolösning eller Daniel-ändring ingår i leveransen.
- ?demo=inflyttning öppnar en separat lokal kunddemo med fem guidade
  perspektiv, verkliga testhandlingar och återöppning av den registrerade
  posten. Omstart kräver ett eget val och återställer enbart demoytans
  exempeldata och utkast; ordinarie labbdata och utkast bevaras.
- Gemensam lokalt serverad Inter-typografi, större kontroller, en
  bostadsillustration, lugnare fastighetssida och responsiva ärendekort
  infördes. Kommersiell översikt visar nettobidrag, avtal och avtalad
  årsvolym först. Mått, ekonomiska exempel och partnerutbud bevaras.
- Verifierat: 75 browserkontroller i qa/movein-service.py, hela
  qa/movein-drafts.py och 34 kontroller i qa/customer-demo.py passerar.
  De två vardera kontrollerna i movein-receipt.mjs och movein-next-action.mjs
  passerar. JavaScript-syntax och git diff --check är godkända.
  Desktop, 390/320 px, tangentbord, omladdning, komplettering, överlämning,
  handläggning, kvitto, avstående, lagringsfel och isolerad omstart ingår.
  Visuell granskning genomfördes i Chromium med sparade skärmbilder.
- En befintlig utkastkontroll anpassades till formulärets tydligare rubrik
  med stegets namn; samma steg- och återställningsbeteende kontrolleras.
  Serviceregistrering och guidning skapar inte avtal, intäkt eller kickback.
- Agentens uppdrag och acceptansfall uppdaterades till samma mål. Timuppgiften
  är tillfälligt pausad under samordnad integration/publicering. Faktisk
  GitHub-merge, Sites-publicering och återaktivering kvitteras separat.
  All ärende- och resultatinformation är fortfarande fiktiv och lokal.

## 2026-10-10 — Kunddemot publicerat och timagenten återaktiverad

- Kunddemokandidaten c0be93d1084f516c604d3a461024ff58356aabba öppnades som
  PR #4: https://github.com/ludros93-prog/kraftringen-partnerlabb/pull/4.
  GitHub bekräftade merge till main c956ab385493df4479338cec6a60ccfed1f69bc3
  kl. 19:05:23 UTC. Ingen admin-bypass eller skenbar mänsklig granskning
  användes. Leveransen innehåller inget nytt Daniel-arbete.
- PR #1 ingår med bevarad historik. Färsk native GitHub-läsning bekräftade
  merged kl. 19:05:25 UTC; kvittouppgiften är inte längre ett väntande förslag.
- Sites-fjärrkällan öppnades åter på 347f02a1a1cdfe47e2abb33793e9f24b1575f758.
  GitHub-main överfördes fast-forward till exakt c956ab385493df4479338cec6a60ccfed1f69bc3,
  pushades till samma Sites-källa och fjärrverifierades. Rent arbetsutrymme
  användes för arkivet med endast dist/ och .openai/hosting.json.
- Native Sites-publicering bekräftade succeeded kl. 19:06:58 UTC:
  - Version: 12.
  - Version-ID: appgprj_6ac600ecf7d48191923687550810c1d4~appgver_2315b6a9b218819183b7e40c5ee7ced0.
  - Deployment-ID: appgdep_6aca8cc17318819186048a8a728e1ed9.
  - Publicerad SHA: c956ab385493df4479338cec6a60ccfed1f69bc3.
  - URL: https://kraftringen-partnerlabb.rosen123.chatgpt.site.
  - Kunddemo: https://kraftringen-partnerlabb.rosen123.chatgpt.site/?demo=inflyttning#demo.
- Färsk Sites-läsning kl. 19:07 UTC bekräftade version 12, samma URL och
  custom-åtkomst med policyrevision 4 och tre externa visningsanvändare.
  Site-identitet och delning ändrades inte.
- Samma Automation_e03c6b2fc3448191a58c63c969a090c0 uppdaterades medan pausad
  med exakt PILOT-AGENT-PROMPT.txt och återaktiverades efter publicering.
  Privat återläsning kl. 19:07 UTC bekräftade enabled=true, titel
  Partnerlivs pilotagent, exakt prompt samt bevarat schema:
  DTSTART;TZID=Europe/Stockholm:20261008T230000 och RRULE:FREQ=HOURLY.
  default_timezone är fortsatt Europe/Stockholm. Ingen extra uppgift skapades.
- Senaste registrerade körning är fortfarande 18:03:50 UTC och next_run_time
  saknar värde. Uppdaterad konfiguration och aktivering är verifierade;
  en redan genomförd körning med det nya uppdraget påstås inte.
- Slutgranskningen fann inga publiceringshinder. En mindre orienteringsdetalj
  kvarstår: omladdning av steg 5 visar rätt underlag men markerar steg 3.
  DEMO-03 dokumenterar en konkret nästa uppgift; data eller ärenden påverkas
  inte. Själva kunddemot, serviceflödet och omstarten är verifierade enligt
  föregående arbetslogg.
- Denna efterhandskvittens ändrar bara dokumentation. dist/ och
  hostingmanifest är identiska med publicerad version 12. Ingen extra
  frontendpublicering behövs för kvittensen.

## 2026-10-10 — Fastighetsbolaget sköter inflyttningsregistreringen

- Ludwig förtydligade att hyresgästen inte gör något aktivt i portalen.
  Fastighetsbolaget arbetar på två sätt: Excel-import med befintliga
  fullmaktsbilagor eller manuell registrering med fullmakt. Detta ersätter
  tidigare antaganden om hyresgästformulär, aktivt tjänsteval i portalen och
  hyresgästlänkdelning; samtycke eller fullmaktens giltighet har inte därmed
  blivit automatiskt godkända.
- Ny arbetsgren codex/property-intake bygger på färsk GitHub-main
  b5deb0231a76764247eb6dd166d38f10f2770469. Sites-källan öppnades och
  fjärrverifierades på c956ab385493df4479338cec6a60ccfed1f69bc3 före redigering.
  Samma timuppgift pausades tillfälligt under samordnad utveckling.
- Registreringsytan får två tydliga ingångar, .xlsx-mall och förhandsgranskning
  före registrering. Befintliga fullmakter kopplas uttryckligen till rätt
  ärende. Ett underlag utan fullmakt kan sparas för komplettering; förmedling
  kräver en faktiskt tillgänglig bilaga i de nya partnerärendena.
- Nytt partnerunderlag och befintliga historiska demomarkeringar skiljs åt.
  Filnamn eller bifogad fil bevisar inte giltig fullmakt, samtycke eller avtal.
  Äldre ärenden och utkast bevaras utan att bli tillskrivna nya bilagor.
- ExcelJS 4.4.0 (MIT) serveras lokalt för .xlsx-läsning och mallgenerering.
  Testbilagornas faktiska filer sparas i IndexedDB, separat för kunddemo och
  ordinarie labb. Detta är en lokal frontendfunktion, ingen delad lagring
  eller verklig filöverföring till Kraftringen.
- Agentens instruktioner, aktuell affärsbeskrivning och acceptansfall ändras
  till samma arbetssätt. Färdig QA, GitHub-integration, Sites-publicering och
  återaktivering kvitteras efter faktisk verifiering.

- Implementationen är färdig och fryst för integration. Nya webbläsarsviten
  qa/property-intake.py passerar i fyra fokuserade körningar: service 61,
  utkast 13, demo 30 och integritet 5 — totalt 109 faktiska kontroller.
  Äldre Python-entrypoints använder relevanta delar av denna nya svit;
  tidigare aktiva hyresgäststeg finns inte längre i testförväntningarna.
- Kontrollerna omfattar manuell registrering utan/med fullmakt, riktiga
  XLSX-filer och mallnedladdning, rätt skilda PDF-bilagor per rad,
  identisk filnedladdning efter omladdning, rad-/filfel, dubbletter,
  förmedling, komplettering, handläggning, återkoppling, lagringsfel,
  partnerbyte under filinläsning, äldre data, tangentbord och 1440/390/320 px.
  Vanliga labbdata, utkast och faktiska PDF-filer bevaras efter demoomstart.
  Berörda Savera-/Face2face-flöden och fristående ekonomi verifierades också.
- Node-kontrollerna passerar: movein-receipt.mjs 3 och
  movein-next-action.mjs 2. Separat slutgranskning körde sex riktade
  browserkontroller av atomisk validering, uteblivna fabricerade tjänsteval,
  partnerbyte, förmedlingsrollback, faktisk fil och oförändrade affärsdata.
  Två hittade async-/rollbackfel korrigerades och återtestades utan blocker.
- JavaScript-syntax, Python-AST, dokumentlänkar och diffkontroll passerar.
  Desktop/mobil granskades visuellt i Chromium. Testbilagan
  inflyttning-testbilaga.pdf kan hämtas från båda registreringsvägarna för
  filprov; den är tydligt märkt och är ingen fullmaktsmall. Båda länkarna
  laddar ned identiska bytes och saknar mobilöverflöde.

## 2026-10-10 — Partnerns Excel-/manuella flöde publicerat

- Kandidaten edeed4148316d2c7f877bfdc704d7179f35164fa öppnades som PR #6:
  https://github.com/ludros93-prog/kraftringen-partnerlabb/pull/6.
  GitHub bekräftade merge till main eaa303f8f09df2e9ed4ab74324b799607877729e
  kl. 19:30:33 UTC. Inga nya Daniel-bidrag, administrativ bypass eller
  skenbar mänsklig granskning ingår.
- Färsk Sites-fjärrkälla c956ab385493df4479338cec6a60ccfed1f69bc3 förenades
  fast-forward med exakt GitHub-main. Rent arbetsutrymme och fjärrverifierad
  push användes för arkivet med endast dist/ och .openai/hosting.json.
- Native publicering bekräftade succeeded kl. 19:31:55 UTC:
  - Version: 13.
  - Version-ID: appgprj_6ac600ecf7d48191923687550810c1d4~appgver_25c3f58b9e748191b7ecad2c9f30f564.
  - Deployment-ID: appgdep_6aca929a5bc081919ed8eae49a118b38.
  - SHA: eaa303f8f09df2e9ed4ab74324b799607877729e.
  - URL: https://kraftringen-partnerlabb.rosen123.chatgpt.site.
  - Partnerdemo: https://kraftringen-partnerlabb.rosen123.chatgpt.site/?demo=inflyttning&workspace=estate1#overview.
- Färsk Sites-läsning kl. 19:32 UTC bekräftade version 13, rätt URL och
  bevarad custom-åtkomst med policyrevision 4 och tre externa visningsanvändare.
- Samma Automation_e03c6b2fc3448191a58c63c969a090c0 fick exakt den uppdaterade
  PILOT-AGENT-PROMPT.txt medan pausad och återaktiverades efter publicering.
  Privat återläsning kl. 19:32 UTC bekräftade enabled=true och exakt prompt,
  oförändrat RRULE:FREQ=HOURLY, DTSTART;TZID=Europe/Stockholm:20261008T230000
  samt default_timezone Europe/Stockholm. Inga nya scheman skapades.
- Agenten ska fortsätta med fastighetsbolagets två vägar och befintliga
  bilagor; aktiva hyresgäststeg/QR återinförs inte. Schemats senaste
  registrerade körning är fortfarande 18:03:50 UTC, next_run_time saknar
  värde. Uppdaterad aktivering är verifierad, ingen redan genomförd körning
  med den nya prompten påstås.
- Denna efterhandskvittens ändrar bara dokumentation. dist/ och
  hostingmanifest är identiska med publicerad version 13. Verklig
  fullmaktsgiltighet, gemensam lagring och produktionsprocess har inte
  verifierats eller införts genom frontenddemon.

## 2026-10-10 — Kandidat: korrigerad Excel-rad efter felaktig dubblett

- Uppgift: PILOT-03A. Filgranskningen lät en felaktig rad reservera sin
  ärendeidentitet. En senare fullständig rad för samma inflyttning märktes då
  som dubblett fast den första raden inte kunde registreras.
- Ändring: endast rader utan rad- eller parsefel deltar nu i den interna
  dubblettkontrollen. En korrigerad rad förblir vald och registrerbar, medan en
  ytterligare giltig upprepning fortfarande spärras. Befintliga dubbletter mot
  partnerns sparade underlag blockeras oförändrat.
- Avgränsning: inga fält, bilagor, fullmaktsbedömningar, servicehändelser,
  avtal, ekonomi eller lagringsnycklar har ändrats. Regeln är fortsatt ett
  tekniskt demoförslag och använder inga riktiga kunduppgifter.
- Verifiering: `node --check dist/property-intake.js`,
  `python -m py_compile qa/property-intake.py` och
  `node qa/property-intake-dedup.mjs` passerar. Den fokuserade kontrollen
  reproducerar felaktig → korrigerad → verklig dubblett. Browserregressionen i
  `qa/property-intake.py` är utökad men kunde inte köras i passet eftersom
  Chromium/Python Playwright saknas i exekveringsmiljön.
- Samordning: aktuell `main` var
  `3387a24101aa3d4c80a1113b37fed520ef63312c` och inga PR:er var öppna före
  arbetet. Egen gren `codex/pilot03-excel-corrected-row`; kodcheckpoint
  `9cde5371afba83472e72ce45c28eccef917566b7`. Ingen direkt push till
  `main`, merge, Sites-ändring eller publicering gjordes.
- Beslut: inga nya verksamhetsbeslut krävs för denna avgränsade korrigering.
- Nästa steg: granska PR-kandidaten och kör hela
  `qa/property-intake.py --suite service` i Chromium före integration och
  samordnad publicering.

## 2026-10-10 — PILOT-03A integrerad och publicerad som version 14

- Ludwigs direkta uppmaning ”Fixa fixa fixa! Kör” följdes som ett
  samordnaruppdrag att slutföra den befintliga kandidaten, PR #8:
  https://github.com/ludros93-prog/kraftringen-partnerlabb/pull/8.
  PR-HEAD var 644c776d666ab79edb2dc8cb0f8a16a7d848aa04 och aktuell main
  3387a24101aa3d4c80a1113b37fed520ef63312c. PR #8 var ensam öppen och
  konfliktfri. Inga Daniel-bidrag eller fabricerade mänskliga godkännanden ingår.
- Nytta: en tidigare felaktig Excel-rad blockerar inte längre en senare
  fullständig rad för samma inflyttning. En verklig giltig upprepning spärras
  fortfarande. Inga fält, fullmaktsregler, lagringsnycklar eller affärsdata ändras.
- Faktiskt körd verifiering på kandidat: `git diff origin/main --check`,
  `node --check dist/property-intake.js`, Python-AST för
  `qa/property-intake.py` samt Node-kontrollerna
  `qa/property-intake-dedup.mjs`, `qa/movein-next-action.mjs` och
  `qa/movein-receipt.mjs` passerade. Regressionstestet kördes dessutom mot
  tidigare mains property-intake.js och föll med AssertionError på det
  tidigare felet; samma test passerade på rättningen.
- GitHub bekräftade merge till main b05a5d5863852349ea372e089f34b679bb10f728.
  Hela trädet var identiskt med den testade PR-kandidaten. De tre
  Node-kontrollerna kördes om och passerade på exakt denna revision.
- Begränsning och verifieringsbeslut: den tidigare planerade fullständiga
  browserkörningen före integration kunde inte genomföras. Miljön är managed
  Linux utan control-browser, Chromium eller Python Playwright. Aktuell
  Sites-skill förbjuder improviserad browserinstallation/preview i detta
  läge och medger riktad verifiering när inget hårt browserkrav finns.
  Samordnaren slutförde denna lilla logikkorrigering med direkt körning av
  verklig renderings- och ärendekod. Browserregression, visuell kontroll och
  hela servicekedjan har inte körts om i denna leverans. Tidigare browser-
  belägg för version 13 är historiska, inte nya testresultat.
- Aktuell Sites-källa öppnades före överföring. GitHubs sammanslagna main
  överfördes med bibehållen historik och vanlig fast-forward-push. Helpern
  verifierade fjärr-SHA och paketerade rent, oförändrat källträd.
- Native publiceringskvittens:
  - Version: 14.
  - Version-ID: appgprj_6ac600ecf7d48191923687550810c1d4~appgver_4ee014a9b6748191ac63c26986715477.
  - Deployment-ID: appgdep_6acaa273de2c8191a9b7a0c0baf051fa.
  - SHA: b05a5d5863852349ea372e089f34b679bb10f728.
  - Status: succeeded, 2026-10-10T20:39:30.317193+00:00.
  - URL: https://kraftringen-partnerlabb.rosen123.chatgpt.site.
  - Kunddemo: https://kraftringen-partnerlabb.rosen123.chatgpt.site/?demo=inflyttning#demo.
- Återläst Sites-metadata bekräftade version 14, rätt URL, custom-åtkomst,
  policyrevision 4 och tre externa visningsanvändare. Ingen åtkomst,
  schemakonfiguration eller aktivering ändrades.
- Beslut: inga nya verksamhetsbeslut krävs för rättningen. D-01–D-04 består.
  Nästa genomförbara steg i browserkapabel miljö är att köra
  `qa/property-intake.py --suite service` med den nya regressionen och
  därefter fortsätta endast från ny, reproducerad demofriktion.
- Denna efterhandskvittens ändrar endast WORKLOG, BACKLOG och GITHUB-STATUS;
  dist/ och hostingmanifest är oförändrade jämfört med publicerad version 14.


## 2026-10-10 — Enklare Savera-uppföljning och partnerns resultat

- Ny användarstyrning: fastighetspartnern ska kunna följa kunder som den gett
  Kraftringen samt kickback. Kraftringens Savera-uppföljning ska visa nya
  avtal per år, månad och vecka, kundernas avtalstyper med filter och aktiva
  kunder. En egen sida Insikter ska visa kundtid, populära avtal och en
  villkorad prognos om försäljningstakten fortsätter. Tydlighet och enkelhet
  prioriteras; fastighetsbolagets Excel-/manuella inflyttning kvarstår.
- Färsk GitHub-main 3387a24101aa3d4c80a1113b37fed520ef63312c användes som bas
  i codex/savera-insights. Timagentens separata PR #8, korrigerad Excel-rad,
  var öppen och är inte inblandad i rapportimplementationen. Dess filer
  lämnas orörda. Samma timuppgift pausades under samordningen, utan nytt
  schema; återaktivering och exakt uppdrag kvitteras efter faktisk kontroll.
- Sites-källan öppnades autentiserat och fjärrverifierat på publicerad
  revision eaa303f8f09df2e9ed4ab74324b799607877729e. Samma projekt och custom-
  åtkomst bevaras. GitHub är fortsatt huvudkälla; ingen separat Sites-
  implementation och ingen import av Daniels ändringar ingår.
- Implementation, verifiering och publicering redovisas när de faktiskt
  är genomförda. Exempeldata, faktisk ersättning och framtidsprognos är
  fortfarande skilda underlag; nya serviceärenden skapar inget utfall.

- Ny huvudrevision upptäcktes före integration: GitHub-main
  247644ac1e5d42db5902a72b4e5509b605bc235e har PR #8 och dess kvittens-PR #9.
  Native Sites-läsning bekräftade att version 14 redan publicerats av annan
  samordning. Den nya importlogiken och båda kvittenserna bevaras i kandidaten.
  Samtidiga dokumenttillägg förenades utan att historik eller andras
  ändringar skrevs över; uppföljningskoden utvecklades oberoende. Den
  kombinerade kandidaten verifieras efter integration, inklusive den
  uppdaterade servicekedjan som version 14-kvittensen saknade browserbelägg för.


## 2026-10-10 — Samlad Savera-/Insikter-kandidat verifierad

- Kodkandidat efter integration med aktuell huvudkälla:
  0329c3c48570aff8e7cddf5c8051491400b48e16. Ny intern Savera-sida och
  separat Insikter delar period-/produkt-/säljar-/områdesfilter. Sökning
  och status gäller bara kundlistan. Aktiva kunder är hela beståndet vid
  observerat periodslut, inte antalet nya avtal i perioden.
- Ny fiktiv kundledger stämmer exakt mot alla tidigare månads- och
  dimensionsceller för försäljning och års-MWh. Exempel till 7 oktober:
  207 nya avtal, 8 175 års-MWh och 305 aktiva kunder. Vecka 1 observeras
  från 1 januari och senaste vecka till 7 oktober. Ny service skapar
  inga kunder, avtal, MWh eller kickback i denna uppföljning.
- Insikter håller avslutad kundtid separat från aktiva kunders tid hittills.
  Scenariot adderar vald periods observerade dagstakt över årets återstående
  85 dagar till samma urvals årsutfall hittills. Detta är ett villkorat
  räkneexempel; ingen prognos för kundstock, intäkt eller kickback.
- Fastighetspartnern får Kunder & kickback för sina egna månads-/årsutfall,
  separata hjälpta inflyttningar och manuella avstämnings-/betalningsposter.
  Saknat underlag är fortsatt saknat; ett nytt avtal motsvarar en kund
  endast i den uttryckligt beskrivna exempelmodellen.
- Faktiskt körda browserkontroller efter integration:
  - qa/savera-insights.py: 104 passerar; inga JavaScript-fel.
  - qa/property-intake.py --suite service: 62 passerar, inklusive
    regressionen från PR #8 för felaktig → korrigerad Excel-rad.
  - qa/property-intake.py --suite integrity: 5 passerar.
  - Desktop 1440 och mobil 390/320 px är visuellt granskade, utan overflow.
- Node-kontroller: qa/savera-data.mjs 13 passerar,
  qa/property-intake-dedup.mjs 1 passerar, qa/movein-receipt.mjs 3 passerar
  och qa/movein-next-action.mjs 2 passerar. JS-syntax, Python-AST och
  diffkontroll passerar på den frysta kandidaten.
- Oberoende granskning hittade fel i intern partnerselektion och fokus vid
  sidbläddring. Båda är korrigerade och browserverifierade; mobilens viktiga
  förklaringar är minst 12 px, formulärfält 16 px och knappar 44 px.
- Samma timuppgift har fått exakt nya PILOT-AGENT-PROMPT.txt medan pausad;
  schema och tidszon är oförändrade. Återaktivering och native publicering
  kvitteras separat efter faktisk leverans. Verklig drift/data och
  besluten D-01–D-04 är fortfarande inte införda av denna demoförbättring.


## 2026-10-10 — Savera, Insikter och partnerresultat publicerade

- Kandidat-HEAD 4f6e1353a02e652dcc0e0f4c0cba2d5b89f4cbbe öppnades som PR #10:
  https://github.com/ludros93-prog/kraftringen-partnerlabb/pull/10.
  GitHub bekräftade merge kl. 20:50:54 UTC till
  3e1b873f5a2fdacf1dbd14e733155a226d53f5ed. Inga nya Daniel-bidrag,
  skenbara mänskliga godkännanden eller administrativ bypass ingår.
- Färsk Sites-fjärrkälla b05a5d5863852349ea372e089f34b679bb10f728 öppnades
  och förenades fast-forward med exakt GitHub-main. dist/ och hostingmanifest
  är identiska med kodkandidaten vars 104+62+5 browserkontroller passerade.
  Rent källträd, fjärrverifierad push och oförändrat arkiv användes.
- Native publiceringskvittens bekräftade succeeded kl. 20:52:37 UTC:
  - Version: 15.
  - Version-ID: appgprj_6ac600ecf7d48191923687550810c1d4~appgver_948b364251f08191a24280bf34cc0866.
  - Deployment-ID: appgdep_6acaa585ed088191b855c17684a773c3.
  - SHA: 3e1b873f5a2fdacf1dbd14e733155a226d53f5ed.
  - URL: https://kraftringen-partnerlabb.rosen123.chatgpt.site.
  - Savera: https://kraftringen-partnerlabb.rosen123.chatgpt.site/#savera.
  - Insikter: https://kraftringen-partnerlabb.rosen123.chatgpt.site/#insikter.
  - Fastighetspartner: https://kraftringen-partnerlabb.rosen123.chatgpt.site/?workspace=estate1#property-results.
- Färsk Sites-läsning efter publicering bekräftade version 15, samma
  custom-åtkomst och policyrevision 4. Ingen åtkomstpolicy har ändrats.
- Samma Automation_e03c6b2fc3448191a58c63c969a090c0 återaktiverades efter
  publicering. Privat återläsning kl. 20:53 UTC bekräftade enabled=true
  och exakt uppdaterad PILOT-AGENT-PROMPT.txt. Schema:
  RRULE:FREQ=HOURLY, DTSTART;TZID=Europe/Stockholm:20261008T230000;
  default_timezone Europe/Stockholm. Ingen extra automation skapades.
  Senaste registrerade körning är fortfarande 20:06:42 UTC och next_run_time
  saknar värde; ingen utförd körning med den nya prompten påstås.
- Efterhandskvittensen uppdaterar endast dokumentation. dist/ och
  hostingmanifest ändras inte och behöver ingen extra publicering.
  D-01–D-04, verkliga kommersiella källor och ersättningsregler består.


## 2026-10-10 — Förtydligat uppdrag: generiska säljpartners och kundsegment

- Efter version 15 bekräftade Ludwig att Savera, Face2face och övriga
  säljpartners ska ligga under Partners. Kunder & avtal och Insikter
  ska vara generiska partnervyer; fristående globala Savera-/Insikter-
  kategorier ersätts. Partnern ska kunna väljas för B2B, B2C eller båda
  när den skapas. Konfigurationsändring är ett implementationsförslag
  som ska bevara befintliga kunders och avtalsraders segment.
- Senaste konsumentlista: Fastpris, Vintersäkrat, Opti, Kvartspris och
  Rörligt pris. Den ersätter den äldre begränsningen till Opti/Kvartspris.
  Företagskatalogens sex produkter består. Samma rapport-/insiktsfunktioner
  ska användas för Face2face och Savera med separata churn-/förstartsmått.
  Face2face använder fortsatt Beest; ingen integration eller ersättning
  av deras säljverktyg är beställd.
- AGENTS, MISSION, PILOT-MISSION, PILOT-FACTS, README, BACKLOG och den
  avsedda PILOT-AGENT-PROMPT har uppdaterats för samma uppdrag.
  Historiska kvittenser från version 15 är bevarade. Nya PARTNER-02,
  PARTNER-03 och FACE2FACE-02 markeras under utveckling tills verifiering
  och faktisk publicering kvitteras av samordnaren.
- Ny partner utan resultatunderlag ska visa saknat underlag. Lokal profil
  eller ändrat kundsegment skapar inget avtal, kundutfall eller kickback.
  Fastighetspartnerns Excel/manuella registrering och lokal normal-/demo-
  isolering bevaras. Verklig behörighet, gemensam lagring, datakällor och
  kickbackregler kräver fortfarande D-01–D-04 och separat mandat.
- Den avsedda agentprompten har ändrats i repo. Faktisk native uppdatering,
  aktivering, schema och publiceringsrevision kvitteras separat först
  efter samordnarens verktygsåterläsning; ingen ny leverans påstås här.
- Datakandidatens Face2face-underlag har dokumenterad exempelavstämning:
  437 nya avtal/1 804 års-MWh; 785 kunder aktiva vid årets början och fyra
  separat märkta äldre väntande avtal som börjar 2026. Den äldre kön är
  inte nya avtal sålda 2026 och inte årets öppningsaktiva churnbas.
  Modellen ska ge 399 starter och 990 aktiva vid 7 oktober. Detta beskriver
  konstruerad demohistorik och måltal från befintliga aggregat; faktiskt
  körd verifiering och publiceringsrevision kvitteras separat.

### Verifierad generisk partnerkandidat – 10 oktober 2026

Säljpartners öppnas nu under Partners med samma Kunder & avtal och
Insikter. Partnerinställningar väljer B2B, B2C eller båda; lokala
profiler och historiska radsegment bevaras. Face2face har fem
konsumentprodukter och separata churn-/förstartsbortfallsmått.
Nya partners eller segment utan underlag visar —, inga fabricerade
resultat, prognoser eller kickbackposter. Nya/blandade arbetsytor
visar inte de äldre partnerdemornas kundunderlag.

Faktiskt körd verifiering på kandidatens kod:
- qa/partner-segments.py: 105 browserkontroller, inklusive omladdning,
  normal-/demoisolering, återställning, blandade segment, perpartnerfilter,
  nya partners, HTML-liknande namn, mobil 320/390 och desktop.
- qa/savera-data.mjs: 23 datum-, kundbestånds-, produkt-/volym- och
  kohortkontroller; qa/partner-registry.mjs: åtta registerkontroller.
- qa/property-intake.py --suite service: 62; --suite integrity: fem.
  Båda inflyttningsvägarna, riktiga lokala bilagor, förmedling och
  separation från avtal/ekonomi fungerar fortsatt.
- Befintliga riktade browserregressioner för Savera data/vy och
  fastighetsutfall passerade enligt QA:s separata körningar.
- Excel-dubblettregression: en; kvitto: tre; nästa handling: två.
- All projekt-JavaScript parsar; git diff --check passerar.

Oberoende granskning hittade och verifierade rättningar för isolering
av nya partnerytor, borttagna partners efter reset, blandade
företagsdialoger och förnyat avtal som inte ska bli kundchurn.
Ingen faktisk kunddata eller integration har införts.

Samma timuppgifts prompt uppdaterades med generiska partnerkrav;
uppgiften är tillfälligt pausad under denna leverans. Återaktivering
och publiceringskvittens dokumenteras efter native verifiering.
Separat schemalagd kandidat PR #12 om fastighetspartnerns periodval
är inte inkluderad eller sammanslagen i denna leverans.
## 2026-10-10 — Kandidat: bevara fastighetspartnerns rapportperiod

- Belägg: `property-results.js` höll års-/månadsvalet endast i en modul-lokal
  `Map`. Septembervyn återställdes därför till helår efter omladdning, trots
  att Savera/Insikter redan bevarar sina filter. Inga öppna PR:er fanns och
  färsk `main` var `d19380699f4d6e810d8b4b58c63b00889a66243e`.
- Ändring: valt år/månadsläge och månad sparas i `sessionStorage` per
  fastighetspartner. Ordinarie labb och `?demo=inflyttning` använder separata
  nycklar. Saknad, ogiltig eller otillgänglig lagring ger tidigare säkra
  standardläge utan att ändra kund-, service-, avtals- eller kickbackdata.
- Nytta: fastighetspartnern kan lämna rapporten eller ladda om och fortsätta
  på samma period, utan att estate1:s val följer med estate2 eller demoytan.
- Verifiering: `node --check dist/property-results.js`, ny beroendefri
  `qa/property-results-period.mjs`, `qa/savera-data.mjs`,
  `qa/property-intake-dedup.mjs`, `qa/movein-receipt.mjs`,
  `qa/movein-next-action.mjs`, Python-AST och `git diff --check` passerar.
  Den befintliga browserregressionen är utökad med omladdningsfallet men
  kunde inte köras här: managed Sites-miljön saknar `control-browser`,
  Chromium och Python Playwright. Ingen browser installerades eller
  alternativ previewväg improviserades enligt aktuell Sites-skill.
- Avgränsning: inga affärsmått, priser, ersättningsregler, integrationer,
  fullmaktsbedömningar eller verkliga data ändras. Ingen merge, Sites-push
  eller publicering görs i detta schemalagda pass. Arbetsgren:
  `codex/property-results-period-persistence`. Nästa steg är samordnad
  browserkontroll av PARTNER-01A och därefter granskning/integration av PR:n.

### Samordning med uppdaterad huvudkälla

Under avslutningen sammanslogs oberoende PR #12 till main som
042f40acc77175f257bb141335d29057b29c07b4 och Sites gick till version 16.
Kandidaten uppdaterades genom normal merge från main. Båda arbetsloggarna
bevarades vid dokumentkonflikten. Fastighetsperiodens nya sessionlagring
ingår därmed i den slutliga koden; den tidigare kandidatnoteringen om
separat väntande PR #12 beskriver status före denna samordning.
qa/property-results-period.mjs passerade efter sammanslagningen.
Fastighetsutfallets browserregression passerade 20 kontroller efter merge,
inklusive periodval efter omladdning, normal-/demoisolering och mobil.

## 2026-10-10 — PR #12 integrerad och rapportperiod publicerad

- Ludwig bad uttryckligen i den direkta konversationen att integrera och
  publicera med hänsyn till tidigare ändringar. Detta var samordning efter
  utvecklingspasset; inget schema, prompt, aktivering eller åtkomst ändrades.
- PR #12, oberoende Codex-arbete, granskades vid HEAD
  `33d179614ee2a5b15ed23bb46da514ea9d8ff395`:
  https://github.com/ludros93-prog/kraftringen-partnerlabb/pull/12.
  Färsk main var `d19380699f4d6e810d8b4b58c63b00889a66243e`.
  GitHub bekräftade merge till `042f40acc77175f257bb141335d29057b29c07b4`.
  Inga Daniel-bidrag, skenbara godkännanden eller admin-bypass ingick.
- Bevarandekontroll: Sites version 15 och fjärrkällan kontrollerades före
  överföring. Källhistoriken förenades fast-forward utan force-push.
  Den samlade GitHub-main har exakt samma filträd som testad PR-HEAD.
  Jämfört med version 15 ändras endast `dist/property-results.js` i
  publiceringsinnehållet; inga filer tas bort. Savera, Insikter, Excel/
  manuell inflyttning, bilagor, migreringar och övriga moduler är oförändrade.
- Faktiskt körda kontroller: JavaScript-syntax i alla dist-moduler,
  alla fem qa/*.mjs (20 rapporterade kontroller), Python-AST i samtliga
  QA-skript samt git diff --check. Samtliga Node-regressioner kördes om
  efter merge på den exakta huvudrevisionen och passerade.
- Ytterligare VM-kontroller på faktisk rapportmodul passerade: nekad
  läsning/skrivning i sessionStorage, ogiltiga lagrade JSON-värden,
  ogiltigt månadsevent, fördröjt event efter partnerbyte, separata
  demo-/normalval efter omladdning och oförändrade orelaterade datanycklar.
  Sparfel behåller fungerande filter i minnet men garanterar inte återläsning.
- Begränsning: visuell browser-/tangentbordskontroll och den utökade
  qa/savera-insights.py kördes inte om här. Managed Sites-miljön saknar
  tillgänglig control-browser. Enligt Sites-skill installerades ingen
  alternativ browser/previewväg; relevant kod-QA och publicering genomfördes.
  Version 15:s historiska browserbelägg är inte en ny browserkörning.
- Native Sites-kvittens: version 16, succeeded 2026-10-10 kl. 21:16:36 UTC.
  - SHA: `042f40acc77175f257bb141335d29057b29c07b4`.
  - Version-ID: `appgprj_6ac600ecf7d48191923687550810c1d4~appgver_67a3b4aaca588191b2f391ce2fcd4bac`.
  - Deployment-ID: `appgdep_6acaab2f57c88191bb7afa714431b704`.
  - URL: https://kraftringen-partnerlabb.rosen123.chatgpt.site.
  Arkivet byggdes från samma rena, fjärrverifierade GitHub-SHA.
  Efter publicering bekräftades version 16 och exakt oförändrad
  custom-delning, policyrevision 4 och tre externa visningsbehörigheter.
- Nästa steg: kör den utökade browserregressionen när föreskriven
  browsermiljö finns. Inga nya verksamhetsbeslut krävs för denna rättning;
  D-01–D-04 består. Denna efterhandskvittens ändrar endast dokumentation;
  dist/ och hostingmanifest förblir identiska med publicerad version 16.

## 2026-10-10 — Publiceringskvittens: generiska partnersidor

- PR #13 slogs ihop som 3ca57eb96816a5eae16f4dd9d96e8f7289361807
  den 10 oktober kl. 21:19:35 UTC. Testad kandidat-HEAD var
  b81150e8ab7215b43f4f14affcff2468fa0b145b. dist/ och hostingmanifest
  är identiska mellan testad kandidat och publicerad merge.
- Källan överfördes fast-forward till befintligt Sites-projekt och
  source helper verifierade push av exakt samma SHA. Arkiv:
  /workspace/library-files/partnerlabb-partner-segments-v17.tar.gz.
- Native save gav version **17**, ID
  appgprj_6ac600ecf7d48191923687550810c1d4~appgver_cd98ef6a3bd481918dd7ea256e03d789,
  med arkivets sha256:23abedba2fb01a4134cb8c8cc47353be5d4dc193b20d8ad94656353ded9924b3.
- Deployment appgdep_6acaac334bcc8191aab0aadc92004c4f bekräftade
  **succeeded** kl. 21:21:08 UTC på
  https://kraftringen-partnerlabb.rosen123.chatgpt.site.
- Färsk metadata bekräftar samma projekt, version 17, samma länk och
  custom-delning med policyrevision 4. Inga åtkomständringar gjordes.
- Samma timuppgift Automation_e03c6b2fc3448191a58c63c969a090c0
  återaktiverades. Privat återläsning kl. 21:21 UTC verifierade enabled=true
  och exakt aktuell PILOT-AGENT-PROMPT.txt med oförändrat timschema och
  Europe/Stockholm. Senaste registrerade körning: 21:08:14 UTC;
  next_run_time=null. Detta är konfigurationsbevis, inte bevis för att
  den nya prompten redan har körts.
- Verifieringen ovan gäller funktionerna med fiktiva data. Nya/blandade
  partners, historiska segment, kundbestånd, kohorter, missing-data,
  kickbackurval, sparfel, reset, migration och mobil är kontrollerade.
- Denna efterhandskvittens ändrar enbart dokumentation. dist/ och
  hostingmanifest förblir identiska med den publicerade versionen.

## 2026-10-10 — Lyckade B2C-samtal i Partner Academy

- Direktuppdrag från Ludwig i utbildningschatten: möjlighet att lägga till
  lyckade telefonsamtal som B2C-utbildningsexempel. Kandidaten utgår från
  färsk GitHub-main `1f68c67185c26aaa8793ff4904a9af28f24d59f3`, med Sites
  version 17:s funktioner bevarade. Egen gren: `codex/b2c-call-examples`.
- Konsument- och blandade säljpartners får ett bibliotek i Utbildning.
  Titel, fokusområde och utbildningsanteckning följer inspelningen; stöd
  för uppladdning, förhandslyssning, uppspelning, sökning, filter,
  metadataredigering och bekräftad radering. Biblioteket börjar tomt.
- Ljud och metadata sparas atomiskt i lokal IndexedDB, separat per partner
  och mellan ordinarie portal och kunddemo. Ingen delad backend, verklig
  kundinspelning, Beest-integration eller ny Sites-åtkomst tillkommer.
  Portalens JSON-export omfattar inte samtalsbiblioteket.
- Återställning nämner samtalsexempel uttryckligen, rensar bara aktuell
  demoyta och redovisar filfel. Misslyckad localStorage-sparning före
  återställning behåller inspelningarna. Avbrott stoppar spelare och
  metadataavläsning; fördröjda åtgärder hålls till rätt arbetsyta.
- Oberoende browser-QA `qa/b2c-calls.cjs`: **69/69 kontroller passerar** på
  fryst implementation. Syntetisk WAV, byteidentisk lagring efter
  omladdning, uppspelning, fil-/lagringsfel och återförsök, edit/delete,
  avbrott, reset, partner-/demoisolering, bevarad kurs- och kunddata,
  tangentbord och mobil kontrollerade. Inga oväntade JavaScript- eller
  konsolfel. Fryst `b2c-calls.js` sha256:
  `0847192e0943ea15a68fcd80f76b59fb0a34bedfc1717025adc27a62c8e6a05b`.
- Oberoende kodgranskning, JavaScript-syntax och `git diff --check` passerar.
  Fyra kompletterande formatkontroller passerar: syntetisk MP3, M4A/AAC,
  OGG/Opus och WebM/Opus går att ladda upp, spela, spara och återöppna
  byteidentiskt efter omladdning. Inga webbläsarfel.
  Befintliga registerkontroller (8), säljpartnerdata (23) och regression
  för fastighetspartnerns sparade rapportperiod passerar. Faktisk
  PR-integration och Sites-publicering kvitteras separat efter utförandet.

## 2026-10-10 — Publiceringskvittens: lyckade B2C-samtal

- [PR #16](https://github.com/ludros93-prog/kraftringen-partnerlabb/pull/16)
  med HEAD `9a2259c4b43641a4fe8396004750202243b4a2d6` integrerades som
  `19f7a08063fc516bd9ee7fc954ffcd1f063353c7`. Kandidat och merge har
  identiska `dist/`-filer och hostingmanifest. Inga nya Daniel-ändringar
  ingår. Codex samordnade integrationen inom Ludwigs direkta bygguppdrag.
- Exakt GitHub-main överfördes fast-forward till samma Sites-källa;
  fjärr-SHA verifierades före arkivering. Arkiv:
  `/workspace/b2c-calls/partnerlabb-b2c-calls-v18.tar.gz`.
- Native save gav version **18**, ID
  `appgprj_6ac600ecf7d48191923687550810c1d4~appgver_d067e7e584ac81919c7c04c6c16df6db`,
  arkivhash `sha256:cd6eca5e41e7d0238fab508b222560b139a9a9c70a92353bccad310a6e1ad226`.
- Deployment `appgdep_6acaaefde7d48191b08c65d53e558673` bekräftade
  **succeeded** 2026-10-10 kl. 21:33:01 UTC på
  https://kraftringen-partnerlabb.rosen123.chatgpt.site.
- Färsk metadata bekräftade version 18 och exakt bevarad custom-publik,
  policyrevision 4 och samma besökar-/grupptilldelningar. Ingen åtkomst
  eller automation ändrades.
- Kontroller på den publicerade privata sidan: **13/13 passerar**.
  Anonym åtkomst fortsatt skyddad, fem kurser kvar, syntetisk ljudfil
  sparad och återöppnad efter omladdning, uppspelning, dialogstängning,
  mobil utan överflöde, bekräftad radering, separat B2B-vy och inga
  scriptfel. Testet använder en tillfällig separat browserprofil; inga
  riktiga samtal eller gemensamt lagrade data skapades.
- Denna efterhandskvittens ändrar enbart dokumentation. `dist/` och
  hostingmanifest är identiska med publicerad version 18. Gemensam
  lagring/hantering av verkliga inspelningar återstår som separat beslut.
# 2026-10-11 · PARTNER-04 · Resultat och utbildning, inte sälj-CRM

- Källa: Ludwigs direkta förtydligande att affärernas nästa steg ligger hos säljpartnern utanför portalen. Oberoende Codex-arbete på `codex/results-only-workbench`, bas `4107ded20c282d84324539e116c2f2fd03b66aca`.
- Säljpartners får gemensam utbildnings-/stödingång. Intern profil behåller Kunder & avtal, Insikter, resultat och kickback men visar inte operativa affärsuppgifter, pipelinepotential eller kunddialogaktivitet. Äldre säljflödeslänkar leder till relevant översikt. Arbetslistan omfattar fastighetsärenden och fastighetssamarbete.
- Äldre records, consumerSales och offers bevaras, ingen datamigrering eller omtolkning till resultathistorik. Registrering och handläggning för fastighet består. Academy/B2C-samtalsbibliotek och rapportmoduler ändras inte.
- Verifierat: alla sju `qa/*.mjs` passerar, inklusive nytt VM-test av faktisk navigation/profilrendering och databevarande, 23 resultatdatakontroller, 8 partnerregisterkontroller samt tidigare kvitto-/dubblett-/lagrings-/periodkontroller. `node --check` för samtliga dist-JS och `git diff --check` passerar.
- Begränsning: ingen webbläsar-QA i detta pass; tillgänglig miljö saknar Sites föreskrivna browser-kapabilitet. 320/390/1440 px, tangentbord och verklig omladdning behöver visuell kontroll före integration. VM-kontroller är inte användarutfall.
- Före slutförande: färsk main oförändrad, inga öppna PR:er. Ingen Daniels-kod hämtad. Inget nytt verksamhetsbeslut krävs för denna avgränsning; D-01–D-04 kvarstår för verklig pilot.
- Checkpoint: kandidat för PR, inte integrerad eller publicerad. Nästa steg är visuell kontroll och samordnarens integration av granskad revision; senaste publicerade version lämnas orörd. Ingen schema-/prompt-/åtkomständring.

## 2026-10-11 · PR #18 integrerad och publicerad som version 19

Ludwigs direkta uppdrag ”Publicera” följde presentationen av PR #18. Oberoende Codex-revision `04b542964614b326675c6feaf1289b0ed8f825bd` integrerad genom PR #18; GitHub-main och exakt publicerad Sites-källa: `35874dfc5ef017926316cc09593a904e4dd1a8e0`. Sites överfördes fast-forward från v18, utan att skriva över nyare arbete.

- Version: `appgprj_6ac600ecf7d48191923687550810c1d4~appgver_edd41b5f23048191843ec65203f42847` (19).
- Deployment: `appgdep_6acab861afa88191acd51fcda0072721`, `succeeded` 2026-10-10 22:13:04 UTC (11 oktober 00:13 Stockholm).
- URL: https://kraftringen-partnerlabb.rosen123.chatgpt.site
- Befintlig custom-delning revision 4 bevarad; inget åtkomst- eller schemaarbete.
- Alla sju qa/*.mjs samt syntaxkontroll av alla dist/*.js passerade på överföringskandidaten; mergeträdet är identiskt. Webbläsar-/mobil-/tangentbordskontroll kunde inte köras med miljöns tillgängliga kapabiliteter och är fortfarande en verifieringsbegränsning. Ingen verklig kund- eller produktionsvalidering påstås.
- PARTNER-04 är integrerad och publicerad. Tidigare kandidatstatus ovan är historik. Denna efterhandskvittens ändrar enbart dokumentation; dist/ är oförändrad och kräver ingen ny publicering.

## 2026-10-11 · PARTNER-05 · Egna resultat, avtalsfakta och grundval

Ludwigs direkta korrigering: säljpartners ska också se sina egna resultat. Utbildning och Avtalsfakta ska vara separata ingångar för B2B/B2C. Fastighetsbolag väljer grundval mellan Opti, Kvartspris och Rörligt månadspris; Kvartspris är initialt grundval. Detta är uttryckligt frontendmandat, ingen automatisk avtalsteckning eller ny ersättningsregel.

Implementering på codex/partner-results-product-facts från f30f86739bf5fb60ccc7e09e2f9fca5545b2c7e2: gemensamma kund-/avtalsrapporter och Insikter avgränsas till P.partner i partnervy, oavsett intern vald partner. Inga interna kostnader, nettobidrag eller partnerinställningar exponeras i dessa vyer. Rapportfilter bevaras separat per perspektiv/partner. Lokal visningsavgränsning är inte autentisering.

Avtalsfakta har sex B2B- och fem B2C-kort, källdatum och officiella produkt-/villkorslänkar. Befintliga Elakademin-filmer länkas som principutbildning, inte kompletta produktspecifika genomgångar. Verifierat exakt produktblad saknas för Kraftringen Stabil och företagets Kvartspris; Individuell portfölj har bara allmän portföljkälla. Saknade detaljer markeras, inga priser eller bindningstider gissas.

Grundval sparas i propertyDefaults i befintlig normal-/demoisolerad state. Nya manuella/Excel-utkast får en ögonblicksbild som går att ändra; importens val gäller valda nya rader. Äldre utkast utan val förblir utan val. Registrerad desiredProduct är ett önskemål; fullmakt och offerChoice förändras inte. Dubbletter skriver inte om tidigare val; sparfel återställer data.

Verifiering: samtliga åtta qa/*.mjs och JS-syntaxkontroller passerar. Nytt test täcker egna rapporter/filter, segment/faktakort/video, partnerisolerade grundval, manuella och Excel-utkast, gamla utkast, dubbletter och återställning efter lagringsfel. Ingen browser-kapabilitet finns i denna managed-miljö; visuell mobil-/tangentbordskontroll inte körd. Nästa steg: samordnad integration/publicering av denna korrigering; inga andra PR:er öppna vid start.

## 2026-10-11 · PARTNER-05 publicerad som version 20

PR #20 integrerad; GitHub/Sites publicerad källrevision `66d8046558728fd21dd6be09373e2a4eaeddc364`. Sites version `appgprj_6ac600ecf7d48191923687550810c1d4~appgver_cfab5f7d13c88191b334487f90012965`, deployment `appgdep_6acabb57a94881918954329a003a92a8`, succeeded 2026-10-10 22:25:42 UTC (11 oktober 00:25 Stockholm). URL https://kraftringen-partnerlabb.rosen123.chatgpt.site. Custom-delning revision 4 bevarad. Alla åtta qa/*.mjs och JS-syntaxkontroller passerade på publicerad källa. Browser-/mobil-/tangentbords-/videouppspelning inte verifierad i denna miljö.

Säljpartnerns meny: Mina resultat, Insikter, Avtalsfakta, Utbildning och support. Endast egna rapportdata i partnervy; inga interna kostnader/nettobidrag. Fastighetsbolag: Avtalsval med Kvartspris som grundval, Opti och Rörligt månadspris som alternativ. Nya utkast får en ändringsbar kopia av grundvalet; äldre underlag bevaras. Excelval gäller hela urvalet nya rader. Ingen automatisk avtalsteckning.

Faktakort har officiella källänkar och relevanta befintliga Elakademin-filmer, inte kompletta produktspecifika filmer. Saknade exakta produktblad för Stabil/B2B Kvartspris och specifikation av Individuell portfölj är nästa innehållsbehov, inte ett skäl att fabricera villkor. Detta är en efterhandskvittens, dist/ oförändrad.

## 2026-10-11 · UTBILDNING-PREVIEW-01 · Läsbar ny utbildning

Ludwigs direkta ”Länka så får jag se” efter genomgång av det 31-sidiga
säljarunderlaget auktoriserar denna avgränsade innehållsförhandsvisning.
Egen Codex-gren från a901c7f9705783606d0dbad0ad6c121e72de137d; ingen
Daniel-ändring eller ny verksamhetsregel ingår.

Fristående utbildning-preview.html innehåller fyra grundkapitel, Savera-
och Face2face-spår, tio produkter med källsidnummer, Direkt/Stabil-jämförelse,
viktad komponentpriskalkyl, fem facitövningar och nio Arthur-manusutkast.
Stabil avser endast säkrat, månadsutjämnat SYS/EPAD-pris. Osäkrad volym,
dygnsprofil och andra kostnader hålls separata. PDF-källan är användarens
säljarunderlag från 10 oktober 2026. Exemplen är syntetiska, inga kunddata.
De nya Arthur-/avatarvideorna, presentationen och självstudierna återstår.

Verifiering: 48/48 Playwright/Chromium-kontroller passerar i portabel miljö:
produktkort, sökning/spårfilter, tangentbordstabbar, fem facit, nio manus,
80/75/-10 öres viktning, nollvolym/overflow, PDF och kvarvarande portal.
Alla tre flikar utan horisontellt överflöde vid 320/390/1440 px. Desktop-
och mobilbilder har granskats. Inga webbläsar-/scriptfel. Samtliga åtta
befintliga qa/*.mjs, JS-syntax och diffkontroll passerar. Oberoende
innehållsgranskning bekräftar exakt matchning mot katalog och lektionsutkast.

Befintliga portalmoduler, fem Academy-kurser, B2C-samtal, sparade data och
hostingmanifest ändras inte. Publicering ska bevara custom-publik revision 4.
GitHub PR/integration och exakt Sites-version kvitteras efter utförandet.

## 2026-10-11 · UTBILDNING-PREVIEW-01 publicerad som version 21

PR #22 integrerad som `4c30c0c3ecf15302361ef513b89a01fa356829fd`.
GitHub-main och fast-forward-överförd Sites-källa är exakt samma revision;
alla åtta uppladdade filer och integrerat dist/ matchar den testade kandidaten.
Native save: version 21,
`appgprj_6ac600ecf7d48191923687550810c1d4~appgver_da6f1dcc2bd08191bc91d6cf182cc631`.
Deployment `appgdep_6acb32c39460819186f7722812b8bb14` bekräftar succeeded
2026-10-11 06:55:16 UTC. URL:
https://kraftringen-partnerlabb.rosen123.chatgpt.site/utbildning-preview.html

Färsk metadata bekräftar exakt bevarad custom-publik, policyrevision 4.
Tolv kontroller på publicerad sida passerar: rätt HTML/data, tio produkter,
B2C-filter, 80-öreskalkyl, fem övningar, nio manus, mobil utan överflöde,
PDF med exakt källfilslängd, anonym åtkomst skyddad och inga browserfel.
Ingen verklig kunddata eller inspelning skapades. En separat Node HTTP-
kontroll kunde inte använda miljöns IPv6-rutt; samma PDF kontrollerades
framgångsrikt genom webbläsaren. Inga begränsningar i den verifierade
webbläsarleveransen kvarstår. Arthur-/avatarfilmer återstår som tidigare.

Denna efterhandskvittens ändrar enbart dokumentation; dist/ och hosting-
manifest är identiska med publicerad version 21 och behöver inte publiceras igen.


## 2026-10-11 · PARTNER-06 · Fastighetsbolag och personalavtal som partneralternativ

Ludwigs direkta senaste instruktion är att Fastighetsbolag eller ett företag
med Personalavtal också ska kunna väljas när en partner skapas. Ny kandidat
på codex/partner-types från GitHub-main
`aafa6244836a8ad86978af6d788c1db7c35eaa3e` behåller allt under Partners och
skiljer samarbetstyp från säljpartnerns B2B/B2C/båda. Befintlig utbildnings-
förhandsvisning i version 21, Academy/B2C-samtal och partnernas egna resultat
ska bevaras.

Ny fastighetspartner ska få det befintliga Excel-/manuella flödet med egna
ärenden, bilagor och Avtalsval (Kvartspris initialt, Opti och Rörligt
månadspris som alternativ). Personalavtal avser ett företag som kanal till
anställda, skilt från företagets egen B2B-el. Kandidaten avgränsas till
klassificering och egen översikt; erbjudande, produkt-/ersättningsvillkor
och eventuell anmälningsprocess kräver fortsatt verksamhetsunderlag.
Nya profiler får inget påhittat kundutfall eller kickback. Namn får ändras
för alla typer, medan befintlig typ och historik behålls.

AGENTS, README, pilotfakta/mission, MISSION, BACKLOG och agentprompt har
uppdaterats för detta mandat och dess gränser. Dokumentationsgranskningen
ändrar inga affärsregler. Kandidatens testresultat, GitHub-integration och
native Sites-publicering kvitteras efter att de utförts.


## 2026-10-11 · PARTNER-06 · Verifierad kandidat

Tre partnerupplägg i samma skapandedialog: Säljpartner (B2B/B2C/båda),
Fastighetsbolag och Personalavtal för företag. Alla ligger under Partners.
Nya fastighetsbolag använder befintligt manuellt/Excel-flöde med egna
fullmaktsbilagor och Kvartspris som initialt grundval. Personalavtal har
egen intern/partneröversikt, inte ett uppfunnet anmälningsflöde eller
produktutbud. Ny profil har inget kommersiellt utfall. Befintlig typ och
historik bevaras, namn får ändras på samtliga typer.

Verifierat på denna kandidat, lokal Chromium på 127.0.0.1:8000:
- node qa/partner-registry.mjs: 16 godkända kontroller.
- node qa/savera-data.mjs: 23 godkända kontroller.
- node qa/property-results-period.mjs: godkänd period-/partner-/demoisolering.
- python qa/partner-types.py: 106 godkända kontroller i komplett körning.
  Efter riktad typografikorrigering och nio nya kontrollpunkter: layoutdelen
  46 godkända; nya kontroller omfattar typfilter, minst 12 px knapptext och
  faktisk mobilregistrering efter rullning av dialogen.
- python qa/partner-segments.py: 105 godkända kontroller i komplett körning;
  äldre QA-förväntningar uppdaterade till bekräftad resultat-/utbildningsvy.
- PARTNERLABB_QA_URL=http://127.0.0.1:8000 node qa/b2c-calls.cjs: 69
  godkända kontroller. Det inledande försöket använde testets standardport
  4183 utan server; rätt previewadress gav ren terminalkvittens.
- 26 app-JavaScript-filer passerar syntaxkontroll; 48 statiska script-/
  stilreferenser finns; git diff --check passerar.

Browserkontroller verifierar riktiga syntetiska PDF/XLSX-bytes, sparning,
omladdning, uttrycklig överlämning, ny intern partnerfiltrering, utebliven
automatisk kund-/avtals-/kickbackgenerering och normal-/demoisolering.
Personalavtalens egna direktlänkar, namn, meny och saknade resultat är
verifierade. Separat granskning verifierar gamla direktlänksalias och att
fastighetsresultatens ärendelänk öppnar rätt bolag, utan sidfel.

Skärmbilder granskade för 1440/390/320 px. Befintlig version 21:s
utbildningsförhandsvisning, partnernas egna rapporter och B2C-samtalsbibliotek
är bevarade. Verkliga villkor, delad drift och integrationer tillkommer inte.
GitHub-integration, Sites-publicering och native agentprompt kvitteras
efter genomförandet; den befintliga timuppgiften är tillfälligt pausad under
samordnad leverans och ska återaktiveras efteråt.


## 2026-10-11 · PARTNER-06 · Publicerad version 22 och agent återaktiverad

PR #24 https://github.com/ludros93-prog/kraftringen-partnerlabb/pull/24
integrerad 08:10:17 UTC. Kandidat b32218a4d54e993ff6219cd0026ef720c7320829;
GitHub-main och exakt pushad Sites-källa: `9b935a533229881e2ca0bef83d3c84f5fc9468dd`.
Arkivet innehåller bara `.openai/hosting.json` och `dist/` från denna SHA.
Native saved version 22: `appgprj_6ac600ecf7d48191923687550810c1d4~appgver_10835f3ffdd08191ae6d1d18cdc533d1`.
Native publish deployment: `appgdep_6acb44b7f54081919734b72a86af7ab7`; **succeeded**
2026-10-11 08:11:51 UTC. URL https://kraftringen-partnerlabb.rosen123.chatgpt.site. Befintlig custom-delning revision 4
bevarad genom publicering på samma Site utan åtkomständringar.

Valen finns under Partners → Ny partner: Säljpartner, Fastighetsbolag,
Personalavtal. Säljsegment ligger bara på Säljpartner. Nya fastighetsbolag
har egna registreringsvägar och saknat resultatunderlag; personalavtal
har egen avgränsad översikt. Verifieringskvittens finns i föregående post.

Befintliga Partnerlivs pilotagent
`Automation_e03c6b2fc3448191a58c63c969a090c0` uppdaterad med exakt
PILOT-AGENT-PROMPT.txt och återaktiverad. Native återläsning bekräftar
is_enabled=true, exakt prompt och oförändrat timschema i Europe/Stockholm
från 2026-10-08 23:00. Inga andra automationer har ändrats. Det verifierar
konfigurationen, inte oavbruten processdrift eller framtida leverans.
Denna efterhandskvittens ändrar ingen dist-fil och skapar ingen ny deployment.

## 2026-10-11 · UTBILDNING-FULL-02 · Komplett utbildningskandidat

Ludwigs direkta uppdrag ”skapa det” och ”mycket noggrannare och matigare”
auktoriserar denna fullständiga kurs och de tidigare beställda Arthur-/avatar-
filmerna. Egen Codex-gren codex/elakademin-full-20261011 från
`aafa6244836a8ad86978af6d788c1db7c35eaa3e`; ingen Daniel-revision ingår.
GitHub-main och öppna PR:er kontrollerade; inga främmande pågående ändringar
identifierades. Befintlig Sites-källa är en förfader till GitHub-main.

Kursen i dist/elakademin-data.json omfattar 18 kapitel, ungefär 26 500 ord,
38 lösta räkneexempel, 18 fiktiva kundfall, 72 kapitelövningar, 20 avslutande
frågor per spår och en ordlista med 65 begrepp. Gemensam grund och tre
gemensamma prisprodukter återanvänds mellan företagsspårets 15 och
privatkundsspårets 12 kapitel. Alla tio produkter från användarens
31-sidiga säljarunderlag, 10 oktober 2026, ingår. Originalpresentationens
91 bilder och originalsjälvstudiernas 91 sidor används för grundbegrepp.
Källsidnummer anges per kapitel; aktuell offert och avtal styr kundvillkor.

Kritiska skillnader genomgår särskilda kundfall, beräkningar och facit:
SYS/EPAD skiljs från profil och osäkrad volym; Stabils gemensamma pris gäller
endast den säkrade månadsutjämnade delen. Förväntad och faktisk volym skiljs;
80/125 ger 64 procent och 80/60 ungefär 133 procent. Opti jämför två hela
månadsutfall på samma volym och omfattning. Vintersäkrats standardvinter har
alla elhandelsdelar fasta inklusive dygnsprofil. Poolernas strategifördelning
är inte en utförd position. Individuell horisont är inte avtalslängd.
Alla priser och kundfall är syntetiska; inga nya skattesatser, kundvillkor,
volymtoleranser eller resultatgarantier hittas på.

Oberoende innehållsgranskning jämförde produktunderlaget, tio tillämpande
lektioner och 50 manussegment samt 82 omräknade numeriska led. Separat
slutgranskning läste alla 65 begrepp och 40 slutfrågor med alternativ,
facit och bedömningsstöd; tio numeriska svar och solelexemplet 310 MWh
kontrollerades separat. Två små preciseringar i ordlista och slutprov är
rättade i såväl kursdata som dokumentexporter.

Självstudiehandboken har 139 sidor, 21 PDF-bokmärken och klickbar innehålls-
förteckning. PowerPointen har 463 redigerbara bilder och full undervisning
samt alla 90 berättarsegment i talaranteckningarna. Fyra pedagogiska diagram
är redigerbara former. Faktisk PDF-/PPT-text innehåller alla 198 undervisnings-
stycken, 38 exempel med mellanled, 18 fall, 112 frågor, 65 begrepp och
34 källreferenser. Alla 463 bilder renderades med LibreOffice och scannades
för textöverlapp och text utanför bilden: noll av vardera. Långa bilder,
figurer, titel och innehållsförteckning har även granskats visuellt.
Microsoft Office har inte provats. Alla fyra materialhämtningar är exakt
jämförda med lokal fil. PDF SHA256:
`bd6517b2256c6d6324f853e3d52f6ac262128eb2df86734906342bac38754653`.
PPTX SHA256:
`9c4bb2152a2c9299e23457600f0b5d9396d3eef23e372586acfc3ffb2c41ec15`.

Komplett kursvy klarar 168 Playwright/Chromium-kontroller på samtliga
18 kapitel och 40 slutfrågor: spår, alla facit, ordlista, viktning,
negativa priser, noll/overflow, över-/undersäkring, anteckningar,
bokmärken, testsvar, klarmarkering, omladdning och ärligt lagringsfel.
Alla fem vyer saknar horisontellt överflöde vid 320/390/1440 px.
Inga browser-/scriptfel. Separata UI-kontroller verifierar tangentbord,
portalens kursingångar och tidigare kurser. Samtliga åtta befintliga
qa/*.mjs, JS-syntax och diffkontroll passerar. Ingen orelaterad lokal
lagring skrivs över. Metaversionen avgränsar den nya kursens framsteg.

Arthur är exakt Higgsfield-preset `30fc8796-ceb6-4a66-b3a7-4a145ef7f346`,
genererad via ElevenLabs Text-to-Speech V2. Den ursprungliga inskickade
figuren hittades och används som referens för den godkända restaurerade
3D-figuren. En första bild med felaktigt skägg och en sämre talprobe
underkändes och används inte. Alla 18 fulla kapitelinläsningar är färdiga;
270 native grafiktillstånd är författade för innehållet. Faktiska svenska
ordtider styr förklaringar och textning. Första hela filmmastern och tre
faktiska intro-/Direkt-bilder är renderade och granskade. Samlad film-
leverans, slutlig AV-kontroll och publicering kvitteras efter utförandet;
ingen pågående render räknas som publicerad film.

Befintliga fem Academy-kurser, B2C-samtalsbibliotek, portalmoduler och äldre
lagring bevaras. Den nya ingången följer partnerns konfigurerade kundsegment.
Anteckningar, självtest och uppladdade samtal är fortsatt lokal lagring;
ingen formell certifiering, central resultatrapportering eller verklig
kundintegration införs. Äldre förhandsvisning får länk till hela kursen.
Hostingmanifest och custom-publik revision 4 ändras inte. Integration och
exakt Sites-publicering följer RUNBOOK efter slutlig media-kontroll.

### FULL-02 · Slutlig media och samlad integrationskontroll

Alla 18 kapitelfilmer och introduktionen är färdiga, native-bekräftade och
oberoende granskade. Sammanlagd kapitelspeltid är 5 710,715 sekunder
(95 min 10,715 s); introduktionen 16,939 s. H.264/AAC, 1280 × 720 och
nominalt 24 fps. Alla 8 693 kanoniska berättarord finns i giltig svensk
WebVTT; alla 18 fullständiga ASR-transkript är granskade för materiella
utelämningar och felaktiga kritiska tal. Direkt genomlyssning görs inte.

Full fontkontroll av fyra inkluderade Montserrat-varianter omfattar 270
scener och 2 321 textfält. Ej stödda pil-/relationssymboler ersattes med
tydliga ord; åtta filmer exporterades om. Oberoende slutgranskning läste
31 faktiskt avkodade bildrutor, inklusive alla 12 rättade scener och deras
17 textfält, utan kvarstående fel eller materiell klippning. En separat
granskare inspekterade även slutbilder för samtliga 18 filmer. Figuren är
en animerad illustrerad guide utan läppsynk.

Varaktighet avviker högst 1 ms från manifest, ljud/video-slut högst 28 ms
och hela AAC-spårets längd från original-MP3 högst 18,286 ms. Första
30 sekunderna av varje faktiskt MP4/AAC-spår och hela introduktionen
matchar rätt godkända Arthur-original, minsta korrelation 0,999730094 och
ingen förskjutning. Detta är ljudidentitet och tekniska/visuella stickprov,
inte fullständig genomlyssning av varje slutfilm.

Ett gemensamt native-bekräftat källpaket innehåller 19 portabla projekt,
325 filer och 229 682 163 bytes. CRC, alla relativa media/fontreferenser,
asset-hashar och 19 kanoniska originalinläsningar passerar oberoende kontroll;
noll saknade filer, hashfel, credentials eller presignerade receipts.
Arkiv SHA256 `6a93ccaf8a8754e3adc5976654bbc1b3f641b01d6c3ad00d662fb0e690593ba3`.
Fryst mediemanifest SHA256
`62e06483a929d2ab4445fd82d05d51002c24b7066bbbf69606b26b0c8ed1e152`.
Slutliga mediafält är exakt lika den oberoende granskade kandidaten;
endast manifestets QA/statusmetadata ändrades vid frysning.

Parallell PARTNER-06 levererades via PR #24 och dokumenterades i PR #25
under arbetet. Full kurs är därför förenad med verifierad färsk main
`a77255ab32ce27a5b7a6c61f9fb5a0ef6413cca1`. Dess samtliga ändringar och
nyare instruktioner bevaras. WORKLOGs samtidiga tillägg förenades genom
att bevara hela senaste main-loggen och därefter hela kursposten.
Git-objekt återlästes och SHA-verifierades mot GitHub/Sites; inga force-
uppdateringar eller Daniels ändringar ingår i denna integrationsåtgärd.

På den samlade kandidaten passerar åter 168 fullkurskontroller, 101
kontroller av faktisk uppspelning/textning/materialhämtning, alla åtta
qa/*.mjs, syntax för samtliga dist/*.js och diffkontroll för textfiler.
PDF/PPTX verifieras bytevis med SHA; deras formatwhitespace ändras inte.
Nya partnertyper
kontrolleras separat med qa/partner-types.py: 115 browserkontroller,
inga scriptfel. Alla 18 filmer har faktiska metadata, poster och textning;
fem representativa filmer och introduktionen spelas och söks på riktigt.
Alla fyra PDF/PPTX-källhämtningar är bytekontrollerade. Mobil-layout,
båda säljspåren, tidigare kurser och B2C-bibliotek är bevarade. Lyckad
GitHub-integration och exakt Sites-publicering kvitteras efter utförandet.

### FULL-02 · Publicerad som version 23

PR #26 https://github.com/ludros93-prog/kraftringen-partnerlabb/pull/26
integrerad från kandidat `3f02f545352e708498019bbfed00ff78b7f7a4dd`.
GitHub-main och exakt fast-forward-pushad Sites-källa:
`c5d4076dc30aae84e2c6fc1d83d5023d688d35b9`.
Mergeträdet `e558c452d666e84b940c35e179ba2e5a8098ced7` är exakt samma
byteverifierade träd som den testade kandidaten. Inga andra ändringar
tillkom efter integrationskontrollen; ingen force-push användes.

Native saved version 23:
`appgprj_6ac600ecf7d48191923687550810c1d4~appgver_cac3365f6b54819198f0479697c1c5d9`.
Deployment `appgdep_6acb4815b5e08191a55100a4c80bb532` är **succeeded**
2026-10-11 08:26:17 UTC. Arkivet på 10 591 773 bytes byggdes direkt från
denna SHA och innehåller bara hostingmanifest och dist/, 97 poster.
Kursen: https://kraftringen-partnerlabb.rosen123.chatgpt.site/elakademin.html
Färsk Sites-metadata bekräftar exakt bevarad custom-publik, revision 4.
Inga scheman, åtkomstregler eller verkliga kunddata ändras av denna leverans.

På publicerad version passerar 102 faktiska Chromium-kontroller:
18 kompletta filmlänkar och verklig metadata, poster och svensk VTT;
uppspelning och hopp i fem representativa kapitelfilmer samt intro;
alla fyra materialnedladdningar med exakt filstorlek och format; mobil
utan sidöverflöde; rätt företag-/privatspår från Savera/Face2face;
fem tidigare kurser och B2C-bibliotek; äldre förhandsvisnings kurslänk;
skyddad anonym åtkomst och noll script-/resursfel. Lokal kurs-, partner-
och regressionskvittens finns ovan. Framsteg och uppladdade samtal är
fortsatt lokala i webbläsaren; ingen central certifiering eller delad
resultatdatabas påstås.

Denna efterhandskvittens ändrar enbart rot-dokumentation. dist/ och
hostingmanifest är exakt oförändrade mot publicerad version 23 och
behöver inte publiceras igen.

## 2026-10-11 · FASTIGHET-FORSLAG-01 · Kandidat för bredare partnersamarbete

Ludwig bad att också visualisera kundens egen fastighetsel i samarbetet
och därefter ”Bygg ett förslag” efter sex idéer för ytterligare partnerhjälp.
Uppdraget tas fram på `codex/property-partnership-proposal` från aktuell
GitHub-main `22f174741dc5b493337d26365c2a8577fb1354c5`; fullständig Elakademin och senaste partnerupplägg
bevaras. Detta är ett frontendförslag, inget underlag för redan tecknat
fastighetselavtal eller leverans av nya tjänster.

Planerad Ert samarbete-vy håller inflyttningskanal och egen fastighetsel
samman i presentationen, med separata underlag. Egna avtal, omfattning,
volym och kostnad saknar källa. De sex idéerna omfattar hyresgästfrågor,
underbyggda kostnadsintervall till bostadsannonser, onödig förbrukning,
elbehov före lokaluthyrning, elöversikt vid köp/försäljning och bedömning
av laddning/solceller/batterier/styrning. De två första diskussionsfokusen
föreslås vara hyresgästfrågor och onödig förbrukning.

AGENTS, README, PILOT-FACTS, BACKLOG och den sparade agentpromptens fil
avgränsar förslaget: lokala partneravgränsade fokusval är diskussionsunderlag,
inte utskick, beställningar, ärenden, avtal eller ekonomi. Excel/manuell
inflyttning, fullmaktsbilagor, Kvartspris som grundval, befintliga resultat
och alla utbildningsdelar ska bevaras. Personalavtalens erbjudande och
process är fortsatt öppna. Inget verksamhetsbehov, regelverk, pris eller
besparingsutfall uppfinns.

Denna post kvitterar dokumentationskandidaten. UI-implementation,
verifiering, GitHub-integration, eventuell Sites-publicering och native
agentpromptuppdatering kvitteras först efter respektive faktisk åtgärd.

### Verifierad implementationskandidat

`property-partnership.js/css` visar Ert samarbete för samma valda
fastighetsbolag i intern profil och egen meny **Samarbetet**. Två spår
visualiserar inflyttningsservice respektive föreslagen egen fastighetsel.
Sex fördjupningar har behov, möjlig hjälp och första underlag. Fokusval
sparas lokalt per partner, med återställning vid lagringsfel; inga ärenden,
avtal eller ekonomiska resultat skapas. Saknade fastighetselavtal,
anläggningar och avtalsperioder markeras. En diskret ingång finns även på
den befintliga operativa översikten; Excel och manuell registrering består.

Verifiering på kandidatens kod: `python qa/property-partnership.py`
111 kontroller, `python qa/partner-types.py` 115 kontroller och
`python qa/property-intake.py --suite service` 67 kontroller passerade,
utan JavaScript-fel. Browserkontroller omfattar 1440/390/320 px, rätt
partner/route, nya partners, fördjupningar, normal-/demoisolering,
omladdning, lagringsfel, felaktig lagrad data och HTML-escaping. Befintliga
Excel/PDF-/fullmaktsflöden och Savera/Face2faces egna resultat verifierades.
En föråldrad service-regression för borttagna säljflöden ersattes med
nuvarande egna rapporter/Insikter och bevarande av gamla säljunderlag.

Ett köat native dialog-close kunde konsumera nästa öppnings återfokus.
Det är rättat och ingår som deterministisk browserregression; oberoende
snabb stäng/öppna/toggle/Escape-granskning passerade 12/12 cykler.
JS-syntax, Python compile, `git diff --check`, partner-registry (16),
savera-data (23) och property-results-period passerade. Fulla Elakademin
v23:s kursfiler/material, Academy och B2C-samtalsbibliotek är byteoförändrade
mot GitHub-main. GitHub/Sites-integration återstår tills separat kvittens.

### Publicerad version 24 och återaktiverad pilotagent

PR #28 https://github.com/ludros93-prog/kraftringen-partnerlabb/pull/28
integrerades från exakt granskad kandidat
`24d4cf4a481d8a7e79bda84cbf319ba5b3f7b74e` till GitHub-main
`a88628d7b3dc99a4316a30e7969542431ca31e16` 08:51:09 UTC.
Samma revision fast-forwardades till befintlig Sites-källa, pushades utan
force och verifierades på source-remoten. Arkivet
`/workspace/library-files/partnerlabb-property-partnership-20261011.tar.gz`
skapades från den rena revisionens hostingmanifest och dist.

Native saved version **24**:
`appgprj_6ac600ecf7d48191923687550810c1d4~appgver_8206e50a4ad8819180a3ada70eb3e5d9`,
source.commit_sha `a88628d7b3dc99a4316a30e7969542431ca31e16`.
Deployment `appgdep_6acb4e3f7edc8191805fde3bffc72e98` bekräftade **succeeded**
2026-10-11 08:52:32 UTC på
https://kraftringen-partnerlabb.rosen123.chatgpt.site.
Före publicering var åtkomst custom revision 4; ingen åtkomstmutation
gjordes. Ingångar: Partners → fastighetsbolaget → Se samarbetsförslaget,
eller fastighetspartnerns meny **Samarbetet**. Förslaget är ingen
beställnings- eller avtalsintegration.

Samordnaren pausade tillfälligt befintligt timuppdrag under arbete och
publicering. `Automation_e03c6b2fc3448191a58c63c969a090c0` återaktiverades
med exakt `PILOT-AGENT-PROMPT.txt` från integrerad källa. Native återläsning
bekräftade promptlikhet, is_enabled=true och oförändrat schema:
DTSTART;TZID=Europe/Stockholm:20261008T230000; RRULE:FREQ=HOURLY.
Ingen ny automation skapades. Nästa pass ska läsa aktuell GitHub-main och
behålla samarbetsförslagens avgränsning samt fulla Elakademin. Detta är
kvittens av inställningarna, inte belägg för oavbruten exekvering.

Denna efterhandskvittens ändrar enbart rotdokumentation. Applikationen
och hostingmanifestet är oförändrade mot publicerad version 24.


## 2026-10-11 · Felgranskning av hela portalen

Ludwigs direkta uppdrag: ”Leta nu fel på hela sidan och fixa alla buggar”.
Färsk kanonisk GitHub-main `c9dd58781326fd0b037097b8dc39c06c7e1ba7ff`
och publicerad Sites version 24 verifierades före arbetet, utan öppna PR:er.
Separat worktree/gren `codex/whole-site-bugfix-20261011` bevarar hela
Elakademin och samarbetsförslaget. Sex oberoende delgranskningar och
samordnarens granskning använder fiktiva, isolerade browserkontexter.

### Bekräftade före/efter-rättningar

- Menybyten skrev tidigare över historikposten; bakåt/framåt fungerar nu
  mellan vyer, roller och partners. Skipplänkar behåller aktuell portalvy
  eller lektion. Fokus följer navigation och kapitelhopp. Mobilmenyn
  stängs med Escape, har tangentbordsfokus och återställs vid desktopbyte.
  Ärvt objektnamn som `constructor` får inte bli en router.
- Misslyckad lagring visade tidigare falsk framgång och lämnade data ändrade
  i minnet. Support, partnerresans tre interna sparflöden, handläggning
  och de bevarade äldre kund-/offert-/konsumentmodulerna återställer berörda
  poster och händelser. Formulär och inmatning finns kvar för nytt försök.
  Academy beskriver uttryckligen när framsteg endast gäller under besöket.
- En skadad kundrad kunde ersätta övrig giltig v2-data med demots seed och
  senare skriva över den. Sparat underlag och okända fält bevaras nu även
  när en enskild rad eller kundlistans format är skadat. Läsare filtrerar
  felaktiga rader; mutationer av okänt format avvisas. Äldre supportdatum,
  management, ärenderader och ljudmetadata kraschar inte giltiga vyer.
- JSON-export avgränsar konsument- och affärsunderlag till rätt partner;
  defekta äldre behållare blockerar inte övrig export. Senaste aktiviteter
  sorteras efter datum. CSV behandlar formelliknande partnernamn som text
  och behåller numeriska utfall som tal. Flera rapportkontroller behåller
  tangentbordsfokus efter omritning.
- Excel med 1904-datumsystem kunde registrera ett datum 1 462 dagar fel.
  Arbetsbokens verkliga datumsystem används för numeriska datum; redan
  formaterade datum får ingen dubbel förskjutning. 1900/1904 kontrolleras
  med faktisk import och registrering.
- Misslyckad städning av ett registrerat utkast kunde lämna en bilagereferens
  som sedan raderade bytes från ett sparat ärende. Bortkoppling bevarar
  filer med kvarvarande ärendereferens; sista uttryckliga bortkopplingen
  rensar filen. Städningsfel rapporteras. Sök/statusfilter hålls per
  fastighetspartner och en tom sökträff beskrivs som ett filtrerat urval.
- Kurslänkar behåller ursprunglig partner och isolerad demoyta, även efter
  spårbyte. Nya B2C-partners får sitt konfigurerade kursinnehåll. Filmfel
  på source-element visar läsbart alternativ, och dold/ersatt kursmedia
  pausas. Strömmad WebM utan inledande längdmetadata mäts med avgränsad
  probe och kan laddas upp. Gamla synliga demoövningar hänvisar nu till
  säljarbete utanför portalen; kurs-/fråge-ID och framsteg bevaras.
- Avtalsfakta innehöll äldre antaganden om saknat Stabil-/Kvartsprisunderlag
  och fel vinterkalender. Korten följer befintliga säljarunderlaget,
  Stabil-bekräftelsen och hela produktlektioner med källavsnitt. Officiella
  webbkällor och aktuella villkor hålls åtskilda från utbildningsunderlaget.
- Giltiga 90-teckens partnernamn utan mellanslag sprängde desktop/mobilvy,
  och långa samtalsrubriker överflödade ljuddialogen. Text och flex/grid
  bryts nu inom sidan/dialogen utan att skriva om det sparade namnet.

### Verifiering på den samlade kandidaten

Alla åtta befintliga qa/*.mjs och syntax för samtliga dist/*.js passerar.
Nya regressioner: navigation 41, fastighet 36, rapporter 89, support/fakta
24, bevarade moduler 20 och utbildning/ljud 41 kontroller; samtliga godkända
utan scriptfel. En första samlad utbildningskörning upptäckte överflödet
i ljuddialogen vid 320 px; det rättades och omkörning passerar 41/41.

Befintliga breda browserkontroller: partnertyper 115, partnersegment 105,
Insikter/resultat 105, fastighetssamarbete 111 och inflyttning 112. Fullkurs
168 och B2C-bibliotek 69 passerar. Efter sista ljud-CSS passerar B2C åter
69/69. Faktisk lokal uppspelning/metadata/textning/materialhämtning passerar
101 kontroller för samtliga 18 filmer och fem uppspelade stickprov plus
intro. Inga JS-/resursfel. Sites worker-errorlogg returnerar 0 felhändelser.

Alla PDF/PPTX, källspecifikation, kapiteldata, framstegsnycklar och godkända
media-URL:er är byteoförändrade. Ekonomiska fixtures, hostingmanifest,
Site-identitet, custom-publik revision 4 och befintliga scheman bevaras.
Ingen backend, nya affärsregler, verkliga kunduppgifter eller externa
utskick ingår. Chromium-verifieringen ersätter inte kontroll i andra
webbläsarmotorer eller faktisk produktionsbehörighet. Bred slutlig
ytgranskning, GitHub-integration och native publicering kvitteras nedan
först efter utförandet.

Slutlig oberoende ytgranskning efter samtliga rättningar: nya
qa/bug-surface.py passerar **916/916** kontroller med **288** aktiva
vykombinationer i 320/390/1440 px och **29** lokala destinationsURL:er
med HTTP 200. Inga JavaScriptfel, misslyckade HTTP-svar, duplicerade ID
eller synliga olabelerade formulärkontroller. Långa partnernamn testas
för sälj-, fastighets- och personalpartners. Även 11 unika officiella
produkt-/villkorslänkar svarar 200. Slutlig textdiff/syntax passerar.
Detta är lokal syntetisk browserverifiering; native publicering följer.

### 2026-10-11 · Felgranskningen integrerad och publicerad som version 25

PR #30, https://github.com/ludros93-prog/kraftringen-partnerlabb/pull/30,
är integrerad. Verifierad GitHub-main och publicerad Sites-källrevision:
`e9e261ca4d76ee25f717ca8087019a9399e3da4e`. Det testade mergeträdet är
`e757eabbab36c661c28bb98799b1162514df4cf2`; dist-trädet är
`9f9a55462639a6fe44a8657371e9fe7742df483a`.

Native version **25**:
`appgprj_6ac600ecf7d48191923687550810c1d4~appgver_07a9340f47c48191ae1fff528e356c6f`.
Deployment `appgdep_6acb561ea23c819188333333c1253f8e` bekräftade **succeeded**
2026-10-11 kl. **09:26:11.031261 UTC** på
https://kraftringen-partnerlabb.rosen123.chatgpt.site.
Samma Site-identitet och befintliga custom-publik, policyrevision 4, är bevarade.
Åtkomst och befintliga scheman ändrades inte av felgranskningen.

Rättningarna omfattar navigation/historik, tangentbordsfokus och mobilmeny,
återställning vid sparfel, bevarande av äldre lokala data, partneravgränsning
och rapportexport, Excel-datum, bilagereferenser, fastighetsfilter,
kursreturlänkar/mediafel, uppdaterade Avtalsfakta samt långa texter.
Detaljer och före/efter-belägg står i föregående granskningsavsnitt.
Fulla Elakademin, tidigare Academy-kurser, ljudbibliotek och ekonomiska
exempelunderlag bevaras. Ingen backend eller ny affärsregel infördes.

Verifiering av den samlade publiceringskandidaten:

- **251/251 nya riktade browserkontroller**: navigation 41, fastighet 36,
  rapporter 89, support/Avtalsfakta 24, bevarade äldre moduler 20 och
  utbildning/ljud 41. Samtliga godkända utan JavaScriptfel.
- **916/916 kontroller i den lokala breda ytgranskningen**, med 288
  vykontroller vid 320, 390 och 1440 px samt 29 lokala destinationsURL:er
  som svarar 200. Inga JavaScriptfel eller misslyckade HTTP-svar.
  Granskningen omfattar samtliga aktiva intern-/partnerupplägg, nya partners,
  90-teckens namn, etiketter, unika ID, tangentbordsnavigation, exporter med
  felaktig äldre data och bevarande av giltiga kunddialoger/okända fält.
- Alla åtta befintliga qa/*.mjs och syntax för samtliga dist/*.js passerade.
  Övriga befintliga browserregressioner och lokala mediekontroller har sina
  separata kvittenser i föregående avsnitt.
- **102/102 oberoende medie-/åtkomstkontroller på den faktiskt publicerade
  sidan** passerade utan script-/resursfel. Filmer, textning, materialhämtning,
  representativ uppspelning/sökning, partneringångar, tidigare utbildning
  och skyddad anonym åtkomst är verifierade.
- **916/916 breda browserkontroller på den faktiskt publicerade sidan**
  passerar: 288 vykombinationer i 320/390/1440 px, 29 interna
  länkdestinationer och samtliga tangentbords-/äldre exportfall.
  Inga JavaScriptfel eller misslyckade HTTP-svar. Rapporten finns i
  granskningsartefakten surface/hosted-verified/bug-surface-report.json.
  Första hosted-länkkontrollen stoppades av testverktygets nätverksanrop
  och omdirigeringsförbud. Sites ger normalt 307 från .html till en
  kanonisk adress på samma origin. qa/bug-surface.py använder nu faktisk
  browser-fetch med omdirigering och verifierar slutlig origin; auth
  läggs endast på portalens egen origin. Oberoende faktisk navigation
  till fyra kursadresser svarar 200 och behåller track/workspace och
  partnerns returlänk. Ingen dist-rättning eller ny publicering behövdes.


Verifieringen använder Chromium och fiktiva isolerade browserkontexter.
Den ersätter inte provning i andra webbläsarmotorer, verkliga kundutfall
eller produktionsbehörighet. Lokal lagring är fortsatt lokal.

Denna efterhandskvittens ändrar dokumentation och QA-hjälparens
nätverkskontroll. dist/ och
hostingmanifestet är oförändrade mot publicerad version 25; ingen ny
deployment följer av kvittens-PR:en.

## 2026-10-11 · FASTIGHET-FORSLAG-02 · Kandidat: inflyttningen först

Ludwig har sagt ”Bygg det och publicera sedan” efter vår bedömning att
fastighetskundens främsta värde är enkel inflyttning med liten extra
administration. Presentationen tas fram på
`codex/property-service-priority` från verifierad GitHub-main
`edb6fa5efaa7f6aefc9a60b52207b3b0ce54cd81` efter kvittens-PR #31.
Version 25:s felrättningar och version 23:s fullständiga Elakademin ska
bevaras, liksom befintliga data och Site-åtkomst.

Avgränsad omarbetning av `property-partnership.js/css`: börja Ert samarbete
med konkret Excel/manuell inflyttning, fullmaktsbilaga och befintlig status
för överlämning och nästa aktör. Visa därefter egna kunder/kickback,
föreslagen hjälp med uthyrarnas elfrågor och separat fastighetsel.
Alla sex rådgivningsidéer, detaljvyer och partnerns lokala fokusval behålls;
fyra idéer samlas i stängd fördjupning. Onödig förbrukning diskuteras i
fastighetseldelen och får ingen fabricerad analys eller besparing.

Detta är ett godkänt presentationsuppdrag, inte belagd kundrespons eller
nya servicevillkor. Befintliga registrerings-, ärende- och resultatflöden
återanvänds utan nya händelser, avtal eller ersättningsberäkning. Inga
verkliga supportärenden, SLA:er, backendflöden eller persondata införs.
Saknade fastighetselmått förblir **Underlag saknas** och **—**.
README, AGENTS, PILOT-FACTS och BACKLOG beskriver den nya prioriteringen.
PILOT-AGENT-PROMPT och den befintliga automationens prompt, schema och
aktivering ska lämnas oförändrade.

Status vid denna kandidatanteckning: implementation och verifiering pågår.
Ingen ny QA- eller publiceringskvittens påstås här. Faktiskt testresultat,
integrerad PR/SHA och native deployment ska dokumenteras efter utfört arbete.

### Slutförd implementation och verifiering

Inflyttningsservicen har två huvudknappar som öppnar vald fastighetspartners
befintliga Excel- respektive manuella registrering. Tre steg förklarar
underlag/fullmakt, granskning och överlämning, sedan återkoppling. Befintliga
kund- och kickbackresultat återanvänds från propertyResults för samma partner;
nya partners får inga lånade exempel. Elfrågor och egen fastighetsel får
tydliga kort, medan fyra ytterligare idéer ligger i en stängd fördjupning.
Alla sex idéers detaljer och lokala fokusval behålls.

Verifierat: 172 unika samarbetskontroller (117 funktionella, 41 layout/
tangentbord och 15 äldre data, med upprepad JS-slutkontroll räknad en gång),
samt 67 inflyttningsservicekontroller. Inga JavaScript-fel i slutförda sviter.
Resultatknappens text/storlek och detaljdialogens stängknapp är rättade
lokalt i denna modul. Fastighetselens fält är läsbara vid 320 px.
Visuellt granskat vid 1440, 390 och 320 px; tangentbord, fokusretur,
normal-/demoisolering, sparfel och befintliga fokusval kontrollerade.
Periodtest för fastighetsresultat, JavaScript-/Python-syntax och
git diff --check passerade.

Övriga dist-filer, fullständiga Elakademin och hostingmanifest är oförändrade
mot verifierad main. Inga avtals-, ersättnings-, support- eller agentregler
ändras. GitHub-integration och native publiceringskvittens återstår och
dokumenteras med faktiskt PR, SHA och version efter utförd publicering.
## 2026-10-11 · Direktuppdrag: andra felgranskningen

Ludwigs ”Kör en runda till” fortsätter den breda granskningen från GitHub-main
`edb6fa5efaa7f6aefc9a60b52207b3b0ce54cd81`, publicerad version 25 och
Sites-källa `e9e261ca4d76ee25f717ca8087019a9399e3da4e`. Ingen öppen PR eller
separat Sites-revision hittades. Samma projekt och custom-policy behålls.
Egen kandidat: codex/audit-round2-20261011.

Nya reproducerade fel och rättningar:

- Två flikar kunde spara hela sin gamla state och radera den andra flikens
  nya partner eller supportfråga. Sparningen jämför nu med den senast lästa
  eller sparade strängen innan den skriver. En äldre flik avvisas med
  instruktion att kopiera osparad inmatning och ladda om. Formulärens
  återställning bevarar inmatningen. En stale omstart stoppas före rensning
  av bilagor/samtal. Separat kunddemo och oförändrade bytes blockeras inte.
  Detta är konfliktkontroll för lokal frontenddata, ingen gemensam backend.
- Avbryt/navigering/partnerbyte kunde lämna en köad IndexedDB-skrivning
  som sedan skapade, redigerade eller raderade samtalet ändå. Den verkliga
  transaktionen registreras nu i sessionens befintliga avbrottshantering.
  Native blockerade transaktioner används i testet; tidigare ljud och
  anteckningar bevaras när operationen avbryts.
- Globalt spårbyte under sluttestet visade B2C men behöll B2B i URL och
  återgick vid omladdning. Testets segment och hash synkas vid rendering;
  svar/facit förblir separata, partner- och demo-parametrar bevaras.
- Kunddemots stegmarkering ersatte föregående historikpost innan sidbyte.
  Steg 3 och 5 använder samma vy, så Back hoppade över steg 3. Sid-/steg-
  URL skrivs nu i ett enda navigationssteg. Giltigt kodade djuplänkar
  avkodas; felaktig kodning ger en fungerande reservvy. Fokus bevaras
  efter supportsparning och återgår till menyknappen när sidebar döljs.
- Excelgranskning missade kontrolltecken och valde en felaktig rad som
  därefter blockerade hela registreringen. Radvis förhandsvalidering
  följer registrerings-API:ts fältregler. Separatorn | i tillåtna adress-
  och lägenhetsfält gav falska dubbletter; identiteten kodas nu som tuple.
- Bilageuppdatering ritade om kompletteringsdialogen och tappade skriven
  återkoppling och rättade bostadsuppgifter. Fälten återställs efter
  uppdatering. Ett fördröjt raderingsfel kunde återställa en gammal hel
  ärendekopia över en ny filkoppling. Återställning görs endast när
  ärendet fortfarande har samma revision; nyare ändringar behålls och
  rensfelet redovisas. En äldre operation tar inte över en annan dialog.
- Ny personalavtalspartner kunde inte öppna sin partnerresa, och sparad
  reseplacering visades som Ny partner när ekonomiskt underlag saknades.
  Registry-ID synkas före navigation och placeringen visas oberoende av
  ekonomins saknade värden. Reserverade rapport-ID slog upp prototyp-
  egenskaper och kraschade; egen-nyckelkontroll ger saknat underlag.
- Supportöppning ersatte äldre support-/kundsidebehållare med tomma
  listor och senare sparning tog bort underlaget. Felaktig container
  bevaras; nya supportskrivningar avvisas när supportformatet är okänt.
  Datumobjekt kunde krascha före validering; datumtyper kontrolleras
  före konvertering. Giltiga tomma arrayer får fortfarande demodata.

Verifiering på den samlade kandidaten:

- Nya riktade browserregressioner: storage 28, navigation 30, rapporter 47,
  fastighet 25 och utbildning/ljud 27; totalt **157/157**, inga scriptfel.
- Bred slutgranskning **916/916**: **288** aktiva vykombinationer i
  320/390/1440 px och **29** interna länkdestinationer. Inga JavaScript-
  eller HTTP-fel, överbredd, duplicerade ID eller olabelerade kontroller.
- Alla åtta befintliga qa/*.mjs passerar. JS-syntax, Python-kompilering
  och textdiff kontrolleras före integration.
- Tidigare berörda browserregressioner passerar: navigation 41,
  support/Avtalsfakta 24, fastighet 36, inflyttning 112, utbildning 41
  och B2C-bibliotek 69. Native IndexedDB-avbrott, kvotfel, reload och
  sena bilageoperationer verifieras med fiktiva isolerade fixtures.

Källspecifikation, kapiteldata, PDF/PPTX, media-URL:er, framstegsnycklar,
finansiella fixtures och hostingmanifest ändras inte. Ingen affärsregel,
backend, verkliga kunduppgifter, extern kommunikation eller schemaändring.
Chromium är den verifierade webbläsarmotorn. Granskningens artefakter finns
utanför repot i /workspace/bug-audit2; reproducerbara nya tester i qa/round2-*.
Faktisk integration/publicering och hosted-resultat kvitteras först efter
utförandet nedan.

### 2026-10-11 · Andra granskningen publicerad som version 26

PR #32 https://github.com/ludros93-prog/kraftringen-partnerlabb/pull/32
är integrerad. Verifierad GitHub-main och exakt publicerad Sites-källa:
`209a98fbb2144a253ee6495c1af25792dea32822`. Kandidat `ebf63485bfa43744ba3e067e6a4feb97f36ebcf2`
och mergeträdet är identiska: `b60d7a280c7f37f4b55fab942366d7e29b2df8e5`.
Publicerat dist-träd: `d3aeb459ec662dd1fc5117e6a446f3d01e17de53`.
GitHub-main överfördes fast-forward till samma Sites-projekt utan force.
Arkivet från samma revision innehåller endast hostingmanifest och dist.

Native version **26**:
`appgprj_6ac600ecf7d48191923687550810c1d4~appgver_d8b896a9e8e08191858ff688702422e5`.
Deployment `appgdep_6acb5e6ed9a88191b2d3e6faf8c54b2d` bekräftade **succeeded**
2026-10-11 **10:01:35.710693 UTC** på
https://kraftringen-partnerlabb.rosen123.chatgpt.site.
Färsk native metadata bekräftade version 26 och exakt oförändrad custom-
policy, revision 4. Ingen schema-/åtkomständring eller separat Site.

Verifierat på den faktiskt publicerade versionen:

- Bred browsergranskning **916/916**, **288** vykombinationer i
  320/390/1440 px, **29** interna länkdestinationer. Inga script-/HTTP-fel.
- Nya riktade fall återkörda hosted: flikkonflikter **28/28**, navigation/
  kunddemo **30/30**, rapporter/register/support **47/47**, Excel/bilagor
  **25/25**; totalt **130/130**, inga scriptfel.
- Medier/material/åtkomst **102/102**: alla 18 kapitel och intro,
  svensk textning, faktisk representativ uppspelning/sökning, fyra
  materialhämtningar och fortsatt skyddad anonym åtkomst. Inga resursfel.
- Utbildningens nya testsvit **27/27**, med verkligt blockerade
  ljudtransaktioner, är tidigare lokalt verifierad på samma publicerade scriptrevision.
  Tillsammans med övriga riktade suites är kandidatens nya utfall 157/157.

Första hosted-navigationskörningen stoppades efter 19 godkända kontroller
av testets egen Portal-referens under ett helt dokumentbyte. QA-pollningen
väntar nu på window.Portal innan den läser demoMode. Omkörningen slutförde
alla 30/30 med errors[]. Ingen app- eller deploymentändring behövdes för
att rätta testets väntan. Failure- och finalartefakter behålls separat.

Efterhandskvittensen ändrar dokumentation och qa/round2-navigation.py.
dist/ och hostingmanifest är identiska med publicerad version 26; ingen
ny deployment behövs. All verifiering använder Chromium och isolerade
fiktiva browserdata. Andra webbläsarmotorer, verkliga kundutfall och
produktionsbehörighet påstås inte verifierade. Detaljer i föregående
avsnitt och artefakter /workspace/bug-audit2.

### FASTIGHET-FORSLAG-02 · Integration med andra felgranskningen

Under slutkontrollen anlände PR #32 och dess kvittens-PR #33. Båda togs in
med bibehållen historik från main
`ed5af0988104f6c74220ceac93679eeb89070cd9`. Endast parallella tillägg i
WORKLOG krävde konfliktlösning; båda avsnitten bevarades. Samarbetsförslagets
appdelta är fortsatt enbart property-partnership.js/css. Version 26:s
flikkonflikt-, navigations-, bilage- och utbildningsrättningar bevaras.

Den integrerade inflyttningsservicen passerade åter 67/67 kontroller.
Samarbetstestet stoppade först när dess assertion läste returfokus före
det köade native close-eventet efter Escape. En uttrycklig väntan på samma
returfokus som layouttestet använder rättar QA-synkroniseringen; produktens
dialogbeteende eller kontrollens krav ändras inte. Den fullständiga
integrationskörningen passerade därefter 172/172 samarbetskontroller med
javascript_errors: []; inflyttningen 67/67. Ingen produktändring behövdes
för integrationen. Loggar finns separat i
/tmp/partnerlabb-service-priority-integration-partnership.log och
/tmp/partnerlabb-service-priority-integration-intake.log. Faktisk
GitHub-PR och native publicering kvitteras efter utförandet.

### FASTIGHET-FORSLAG-02 · Publicerad som version 27

PR #34 https://github.com/ludros93-prog/kraftringen-partnerlabb/pull/34
är integrerad från verifierad kandidat
`7ae2f18906958eaaf078d0a6bc4ad1f324832475`. Exakt GitHub-main och publicerad
Sites-källa: `5794d27122ff0b6be7c99527d2864ceddc9b6987`. Kandidat och merge
har samma träd `3ea855e18f4f09825facbc439eaaa99b107792b7`.
Sites-källan överfördes fast-forward från version 26:s revision, utan force
eller separat utveckling. Arkivet är byggt från samma pushade revision och
innehåller bara dist/ samt hostingmanifestet.

Native version **27**:
`appgprj_6ac600ecf7d48191923687550810c1d4~appgver_1072adfb024481919756db9a4c70ed82`.
Deployment `appgdep_6acb60b3c950819182bc379686c92783` bekräftade **succeeded**
2026-10-11 **10:11:14.600518 UTC** på
https://kraftringen-partnerlabb.rosen123.chatgpt.site.
Färsk metadata före publiceringen bekräftade samma Site och custom-policy
revision 4. Publiceringen ändrar inga åtkomstinställningar, tunnelbindningar
eller automationer. Agentens prompt, schema och aktivering lämnades orörda.

Den samlade publicerade koden är lokalt verifierad med 172/172
samarbetskontroller och 67/67 inflyttningsservicekontroller utan
JavaScript-fel. Dator/mobil, tangentbord, fokusretur, äldre fokusval,
partner-/demoisolering, saknade resultat och sparfel ingår. Inga breda nya
hosted-kontroller påstås för v27; native succeeded med rätt URL kvitterar
publiceringen. Version 26:s oberoende felrättningar och hela Elakademin
bevaras. Ingen verklig kund- eller produktionsvalidering påstås.

Direkt partneringång till förslaget:
https://kraftringen-partnerlabb.rosen123.chatgpt.site/?workspace=estate1#property-partnership

Denna efterhandskvittens ändrar endast README, BACKLOG, WORKLOG och
GITHUB-STATUS. dist/ och hostingmanifestet är identiska med publicerad
revision; ingen ny deployment följer av kvittens-PR:en.

## 2026-10-11 · Direktuppdrag: hela portalens flöden efter version 27

Ludwig har bett: ”Kör en koll på hela portalen och säkerställ flöde osv”.
Granskningen utgår från GitHub-main
`6115dfa41edc5fb01b65742d23dbe84c0b7c20f8`, publicerad version 27 med
Sites-källa `5794d27122ff0b6be7c99527d2864ceddc9b6987`, samma projekt och
custom-policy revision 4. Inga öppna PR:er hittades. Egen arbetsgren:
`codex/portal-audit3-20261011`.

Omfattning: alla aktiva interna/partnernavigationer, nya partnertyper,
egna rapporter/Insikter/kickback, inflyttningens båda ingångar och fullmakter,
handover/komplettering, samarbetsförslaget, hela utbildningen och ljud,
mobil/tangentbord, lokala sparfel/avbrott och bevarade äldre data.
Reproduktioner använder enbart fiktiva isolerade browserkontexter.

Den faktiskt publicerade versionens breda baseline passerade 916/916
kontroller över 288 vy-/perspektiv-/skärmkombinationer och 29 interna
länkdestinationer utan JavaScript- eller HTTP-fel. Samma lokala baseline
passerade. Alla åtta qa/*.mjs och dist-JavaScript-syntax passerade, liksom
20 bevarade legacy-modulfall. Första legacy-körningen använde testets gamla
standardport och avbröts; rätt preview-URL ger full grön körning.

Sammanhängande klickvägar har därutöver reproducerat nya konkreta fel i
retur från produktlektioner, sent avslutad ärendedialog och nya partners i
rapportväljaren. Rättning och slutlig samlad verifiering pågår; faktisk
integration/publicering kvitteras efter utfört arbete. Detta ändrar inga
affärsvillkor, ekonomiska fixtures, backend, verkliga data, åtkomst eller
agentkonfiguration.

### PORTAL-FLODE-01 · Sex verifierade rättningar

1. Avtalsfakta → produktlektion → tillbaka behåller rätt perspektiv,
   partner och produktsegment, även efter omladdning och i demoytan.
2. En fördröjd fullmaktskontroll avbryts före förmedling om användaren
   lämnat formuläret. Den kan inte stänga eller ändra en annan dialog.
3. Försäljningsutfalls partnerlista följer partnerregistret. Nya partners
   visar sitt eget saknade underlag, inte alla partners eller Savera.
4. Intern återställning placerar tangentbordsfokus i den nya innehållsvyn.
5. Sista Visa fler placerar fokus på det första nyvisade ärendet.
6. Fastighetspartnerns periodtyp och perioddatum får egna rader på smal
   mobil. År och Månad är läsbara även vid 320 px.

På fryst kandidat passerar 273 nya riktade kontroller: navigation 70,
inflyttning 37, fastighetsresultat 39, rapporter 49 och utbildningsretur 78.
Slutlig bred kontroll: 919/919 över 288 vykombinationer och 32 lokala
länkdestinationer; inga script-/HTTP-fel. Sammanhängande klick-, fokus- och
layoutvägar: 160/160 vid 1440/390/320 px, med 42 screenshots.

Berörda befintliga regressioner passerar. Hela Elakademin 168/168,
utbildning 41/41 och 27/27, ljudbibliotek 69/69. Alla 43 kontrollerade
media/materialresurser är tillgängliga; tre faktiska videospelningar
inklusive svensk textning passerar. QA:s fasta 100 ms för ljudstart
ersattes med begränsad väntan på faktisk uppspelning; kravet är oförändrat
och första felloggen bevarad. Alla åtta Node-sviter, JS/Python-syntax och
diffkontroll är gröna. Artefakter: /workspace/portal-audit3.

Under slutkontrollen anlände den oberoende Codex-granskningens PR #36,
integrerad som ccd1988f4db4268baf72aa9b45c2a6c012a5a6e4 och publicerad
som version 28. Dess bilage-ID-, ljudkonflikt-, sparad profil/fokus-,
utbildnings- och datumrättningar ska bevaras. Gemensam integration och
omkörning kvitteras efter utförd kontroll före vår publicering.


### FELGRANSKNING-03 · Tredje rundan på publicerad version 27

Direktuppdrag: Ludwig ”Kör en runda till”. Färsk GitHub-main är
`6115dfa41edc5fb01b65742d23dbe84c0b7c20f8`, inklusive v27:s kvittens-PR #35.
Sites-källan `5794d27122ff0b6be7c99527d2864ceddc9b6987` har identiska
runtimefiler med denna bas. Egen gren: `codex/audit-round3-20261011`.
Senaste AGENTS, pilotunderlag, arbetsrutin och öppna PR:er kontrollerade.
Samarbetssidan behåller inflyttningens nya prioritering och alla sex idéer.

Sex nya felklasser har browserreproducerats och rättats:

1. Under fördröjd radering av A flyttades arrayindex för B/C. Fortfarande
   synliga B-knappar kunde hämta eller radera C. Händelser binds nu till
   bilagans stabila ID; en bortkopplad fil får korrekt felmeddelande.
2. En gammal ljuddialog kunde skriva över eller radera en annan fliks
   nyare metadata i IndexedDB. Redigering/radering jämför nu den öppnade
   versionens tidsstämpel och alla tre redigerbara fält i samma native
   skrivtransaktion. Konflikt behåller nyare data och användarens dialog.
3. Normalisering och namnredigering tappade extra fält i giltiga sparade
   partnerprofiler; ett supportbesök kunde permanenta förlusten. Fälten
   bevaras, men endast validerad identitet/typ/segment styr visningen.
4. Fokusval på Ert samarbete ersatte sparad root/partnerpost av annan typ
   eller oläsbart fokusfält. Mutation avvisas nu med tydligt besked och
   bevarar exakt tidigare payload; giltig initiering och andra fält består.
5. `checked: 'false'` öppnade facit och räknades som kontrollerat i båda
   kursversionerna. Bara boolean true gäller; svar, anteckningar,
   bokmärken och klarmarkering bevaras.
6. Datum utan klockslag, exempelvis 2026-10-12, visades som 11 oktober i
   västliga tidszoner. Kalenderdagar formateras nu utan förskjutning;
   tidsstämplar för aktiviteter följer fortfarande läsarens lokala tid.
   Omöjliga kalenderdatum behandlas som saknade.

Ny verifiering på fryst runtime: datum/lagring 22/22, navigation/samarbete
19/19, bilagor/Excelgränser/avbrott 32/32, profiler 22/22, utbildning/ljud
40/40; totalt **135/135**, inga scriptfel. De fem nya qa/round3-sviterna
använder isolerade fiktiva browserdata och syntetiskt ljud. Tvåflikstestet
använder riktiga native transaktioner och identiska tidsstämplar; lagrade
ljudbytes jämförs med SHA-256. Förebevis finns i /workspace/bug-audit3.
Excelgranskningen omfattar 1900/1904, numeriska/formaterade datum,
skottår, 2000/2100-gränser och partnerbyte; ingen ytterligare datumbugg
hittades där. Läsande Samarbete-granskning omfattade 12 perspektiv/layouts.

Bred Chromiumkontroll passerar **916/916**: 288 vykombinationer vid
320/390/1440 px och 29 interna länkdestinationer, inga script-/HTTP-fel.
Relevanta befintliga regressioner passerar: samarbete 172, navigation 30,
inflyttning 112, föregående bilagekontroller 25, utbildning 27, B2C-ljud 69,
rapporter 47, flikkonflikter 28 samt partnertyper 115. Alla åtta Node-sviter,
JS-syntax, Python-syntax och diffkontroll passerar. Nya utbildningstestets
fixture korrigerades för kapitelvyns beforeunload-sparning och rätt
formulärselektor; slutkörningen 40/40 är godkänd, utan ny runtimeändring.

Endast sju runtime-JS-filer ändras. Kursdata/material/media, ekonomiska
fixtures, hostingmanifest, datanycklar, normal-/demoisolering och Sites-
custom-policy revision 4 bevaras. Inga nya backend-/affärsregler, riktiga
kunduppgifter, åtkomst- eller schemaändringar. Andra webbläsarmotorer och
verkliga kundutfall påstås inte verifierade. Integration och native
publicering kvitteras först efter faktisk framgång och livekontroll.

### FELGRANSKNING-03 · Integrerad och verifierad publicering v28

PR #36 https://github.com/ludros93-prog/kraftringen-partnerlabb/pull/36
är integrerad från kandidat `d8cdd866f1b3251a9fee8a895d5e4b0312aaaaf0`.
Exakt GitHub-main och publicerad Sites-källa:
`ccd1988f4db4268baf72aa9b45c2a6c012a5a6e4`. Kandidat och merge har samma
testade träd `eb4f17c7a33220619f5d26a73a00dc0bd432c25f`; dist-träd
`930429588ad2095e485478ef5bdfc19ae3be56bc`.
Sites-källan överfördes fast-forward från v27 med bevarad historik.
Arkivet från samma pushade revision innehåller bara hostingmanifest och dist.

Native version **28**:
`appgprj_6ac600ecf7d48191923687550810c1d4~appgver_9a16b8e205b081919014a832bc092750`.
Deployment `appgdep_6acb65a3ab4c8191bc37cbb1b4899ed9` bekräftade
**succeeded** 2026-10-11 **10:32:21.514183 UTC** på
https://kraftringen-partnerlabb.rosen123.chatgpt.site.
Färsk metadata bekräftar version 28 och exakt oförändrad custom-policy,
revision 4. Ingen Site-, schema-, agent- eller åtkomständring.

Verifierat på den faktiskt publicerade versionen, i nya browserkontexter:

- Alla fem nya riktade sviter: 22 datum, 19 navigation/samarbete,
  32 bilagor/Excel/avbrott, 22 profiler och 40 utbildning/ljud. **135/135**.
  Även tvåflikars ljudkonflikter med samma tidsstämpel och verkliga
  native transaktioner passerar på portalens publicerade origin.
- Bred granskning **916/916**: 288 vykombinationer i 320/390/1440 px,
  29 interna länkdestinationer, inga script- eller HTTP-fel.
- Medier/material/åtkomst **102/102**: alla 18 kapitel och intro har
  faktisk metadata och svensk textning; representativ uppspelning/sökning,
  fyra oförändrade materialhämtningar och skyddad anonym åtkomst passerar.

Alla livekontroller har errors[]. Artefakter: /workspace/bug-audit3/hosted-*,
surface/hosted och media. Browseråtkomst använder en minneshållen bearer
som bara skickas till portalens origin; externa medier får ingen sådan
header. Inga credentials läggs i källkod, argv eller rapporter.
Chromium och fiktiv lokal data är verifieringsgränsen; inga påståenden om
andra browsermotorer eller verklig produktion. Efterhandskvittensen ändrar
endast README, BACKLOG, WORKLOG och GITHUB-STATUS. dist/ och hosting är
byteidentiska med publicerad v28, så ingen extra deployment behövs.

### PORTAL-FLODE-01 · Gemensam integration verifierad

PR #36 och dess kvittens-PR #37 har integrerats med bevarad historik.
Endast WORKLOG-tilläggen i första mergen krävde konfliktlösning; båda
granskningarnas avsnitt bevaras. Gemensam runtime verifierades på ce74f88.
Kvittensmergen b3d1b928 ändrar endast dokumentation; dist/ och hosting är
byteidentiska med den testade integrationen.

Efter integrationen passerar bred kontroll 919/919 och klick/fokus/layout
160/160; inga script- eller HTTP-fel. Navigation/lagring/profiler/datum
161/161, inflyttningsguard/bilage-ID/Excel/service 136/136 och utbildnings-
retur/svarnormalisering/ljud/fullkurs 355/355 passerar. Alla åtta Node-
sviter och JavaScript-syntax är gröna. Oberoende kodgranskning bekräftar
att båda rundornas rättningar består, utan blockerande fynd. Artefakter
finns i /workspace/portal-audit3/*/integration och static-integration.json.

Färsk Sites-källöppning verifierar exakt v28-källa ccd1988 och samma
custom-policy revision 4. Nästa överföring sker fast-forward från verifierad
GitHub-main. Faktisk PR, käll-SHA, sparad version, lyckad deployment och
hosted slutkontroll dokumenteras efter utförandet. Detta uppdrag ändrar
inte agentprompt/schema, åtkomst, kunddata eller affärs-/ersättningsregler.

### PORTAL-FLODE-01 · Publicerad version 29 och hosted slutkontroll

PR #38 https://github.com/ludros93-prog/kraftringen-partnerlabb/pull/38
integrerades från verifierad kandidat
`15db562e14cabb894c220acc1f88afcce6340f77`. Exakt GitHub-main och
publicerad Sites-källa: `35dff3b40a14333a7f57390050d3b44fdd4fd7b3`.
Kandidat och merge har identiskt träd
`6ad9fcfd7dafcc2d2238902c37cbd458e190d189`, dist-träd
`6b733c830b219ed0ad469925bd2fcfd1c72251ad`.

Sites-källan överfördes fast-forward från v28:s ccd1988 utan force eller
separata ändringar. Arkivet byggdes från samma pushade, rena revision och
innehåller endast dist/ och hostingmanifestet.

Native version **29**:
`appgprj_6ac600ecf7d48191923687550810c1d4~appgver_1b751a071bc881919b6ca46f7435dcf8`.
Deployment `appgdep_6acb67846c488191919840088943471c` bekräftade
**succeeded** 2026-10-11 **10:40:20.127029 UTC** på
https://kraftringen-partnerlabb.rosen123.chatgpt.site.
Färsk metadata efter publiceringen visar version 29 och custom-policy
revision 4. Samma portal, åtkomst, tunnelbindningar och automationer består.

Slutkontroll på den faktiskt publicerade versionen passerar **919/919**:
288 vykombinationer vid 320/390/1440 px och 32 interna länkdestinationer.
Inga JavaScript- eller HTTP-fel. Artefakt:
/workspace/portal-audit3/hosted-final/bug-surface-report.json.
Åtkomstbearer hölls i minne och skickades via dolt stdin endast till
portalens origin; inga credentials lagras i källkod, argv eller rapporter.

Denna kvittens ändrar endast README, BACKLOG, WORKLOG och GITHUB-STATUS.
dist/ och hosting är byteidentiska med publicerad v29; ingen ny deployment
krävs för dokumentationen. All kontroll använder fiktiv browserdata i
Chromium. Andra browsermotorer, verklig kundnytta och produktionsbehörighet
påstås inte verifierade. Inga öppna, reproducerade fel återstår inom denna
gransknings omfattning; detta garanterar inte att okända fel saknas.
