# GitHubövergångens status

- Status: `active` — GitHub är huvudkälla för kod och arbetsminne.
- Repo: https://github.com/ludros93-prog/kraftringen-partnerlabb
- Synlighet: publikt, uttryckligen valt av användaren den 8 oktober 2026.
- Första importen är pushad och återläst från GitHub-main:
  `344dead6445cbdd3e3faa81472f06062b9116add`.
- Aktuell Sites-källa vid importen:
  `7b8f4988aff6aac4712a3c411e0d6c2770b14488`. Hela historiken och den
  senaste frontendversionen ingår. GitHub-main kan därefter ha nyare commits.
- Daniel: GitHub-kontot `daniel-smail` har verifierad `read`-behörighet.
  Publik läsning ger inte skrivåtkomst. Anslutningen nekades att bjuda in
  honom med HTTP 403; repoägaren behöver ordna utvecklaråtkomst i Collaborators.
- Aktiv arbetsrutin: RUNBOOK.md och COLLABORATION.md, egen gren + pull request.
  Ludwig/Codex samordnar integration till main och Sites-publicering.
- Godkännande: Daniels ändringar behöver Ludwigs uttryckliga godkännande av
  konkret PR och aktuell commit före integration och Sites-publicering.
- Kodägare: .github/CODEOWNERS anger @ludros93-prog för alla filer. Tekniskt
  grenskydd är inte verifierat: anslutningen nekades att läsa och ändra
  granskningsregler med HTTP403. Ägaren behöver aktivera kravet i GitHub.
  Se GITHUB-ACCESS.md. CODEOWNERS-filen ensam spärrar inte direkt push.
- Samma timuppgift `Automation_e03c6b2fc3448191a58c63c969a090c0` heter
  **Partnerlivs pilotagent**. Den 10 oktober 2026 kl. 21:21 UTC bekräftade
  privat återläsning enabled=true och exakt prompt enligt
  PILOT-AGENT-PROMPT.txt, med oförändrat timschema och Europe/Stockholm.
  Uppdraget omfattar nu generiska säljpartners under Partners, valbara
  B2B/B2C/båda, gemensamma Kunder & avtal och Insikter samt fem B2C-produkter.
  Kunder/kickback och stabil Excel-/manuell inflyttning består.
  Fastighetsbolaget gör allt aktivt portalarbete; hyresgästen har inga
  portalsteg. Egen agent/-gren + PR och Daniels godkännandekrav består.
  Ingen extra automation skapades. Senaste registrerade körning är
  21:08:14 UTC; next_run_time saknar värde. Detta verifierar konfiguration
  och aktivering, inte att den nya prompten redan har körts.

## Publicerad portal och källöverföring

Sites är publiceringsmål för det befintliga projektet
`appgprj_6ac600ecf7d48191923687550810c1d4`. Portalen har fortfarande custom-
åtkomst enligt samma delningspolicy. GitHub-repots publika kod ändrar inte
Sites-inloggningen.

Senast verifierade lyckade publicering är version 18 med SHA
`19f7a08063fc516bd9ee7fc954ffcd1f063353c7` på
https://kraftringen-partnerlabb.rosen123.chatgpt.site.
PR #16 lägger till lyckade B2C-samtal i Partner Academy med lokal ljudlagring,
utbildningsanteckningar, uppspelning och redigering. Funktionen följer
partnerns konfigurerade konsumentsegment. Version 17:s generiska Partners,
avtalsöversikt/Insikter och fastighetspartnerns rapportperiod bevaras.
GitHub-main överfördes fast-forward till Sites utan force-push.

Native deployment `appgdep_6acaaefde7d48191b08c65d53e558673` bekräftade
`succeeded` den 10 oktober 2026 kl. 21:33:01 UTC. Version-ID:
`appgprj_6ac600ecf7d48191923687550810c1d4~appgver_d067e7e584ac81919c7c04c6c16df6db`.
Färsk metadata bekräftade version 18 och oförändrad custom-delning,
policyrevision 4. Paketet är byggt från och pushat med samma SHA.

Verifiering av samtalsbiblioteket: 69 oberoende browserkontroller, fyra
fokuserade ljudformatkontroller och 13 kontroller på den faktiskt
publicerade privata sidan passerar. Befintliga register- (8), rapportdata-
(23) och sparad fastighetsperiodkontroller passerar. Publikt anonymt anrop
kan fortfarande inte läsa portalen eller den nya scriptfilen. Ljud,
anteckningar, avbrott, reset, mobil, tangentbord och lokal isolering är
kontrollerade. Tidigare versioners breda verifiering finns i WORKLOG.

Samtalsexempel finns via `?workspace=vast#academy` för Face2face och i
Utbildning för andra konfigurerade B2C-/blandade säljpartners. Ljud och
anteckningar sparas lokalt och delas inte mellan användare.
Öppna Partners och välj Savera eller Face2face. Direktlänkar:
`?partner=syd#partner-sales`, `?partner=vast#partner-insights`.
Äldre `#savera` och `#insikter` öppnar samma Savera-underflöden.
Fastighetspartnerns resultat finns via `?workspace=estate1#property-results`
och kunddemot via `?demo=inflyttning#demo`. All data är fiktiv och lokal.
Efterhandskvittensen ändrar endast dokumentation, inte dist/ eller manifest.

För över GitHub-main med bibehållen historik och fast-forward enligt RUNBOOK.
Första överföringen är verifierad med gemensam SHA
`c777983132282ffef40c0cdde503b00eb2ab2002`; senare dokumentationscommits kan
följa. Aktuell kvittens står i WORKLOG.md. Automatisk synk, GitHub Actions, grenskydd
eller centralt delad testdata införs inte genom denna källflytt.

## 2026-10-11 · PR #18 integrerad och publicerad som version 19

Ludwigs direkta uppdrag ”Publicera” följde presentationen av PR #18. Oberoende Codex-revision `04b542964614b326675c6feaf1289b0ed8f825bd` integrerad genom PR #18; GitHub-main och exakt publicerad Sites-källa: `35874dfc5ef017926316cc09593a904e4dd1a8e0`. Sites överfördes fast-forward från v18, utan att skriva över nyare arbete.

- Version: `appgprj_6ac600ecf7d48191923687550810c1d4~appgver_edd41b5f23048191843ec65203f42847` (19).
- Deployment: `appgdep_6acab861afa88191acd51fcda0072721`, `succeeded` 2026-10-10 22:13:04 UTC (11 oktober 00:13 Stockholm).
- URL: https://kraftringen-partnerlabb.rosen123.chatgpt.site
- Befintlig custom-delning revision 4 bevarad; inget åtkomst- eller schemaarbete.
- Alla sju qa/*.mjs samt syntaxkontroll av alla dist/*.js passerade på överföringskandidaten; mergeträdet är identiskt. Webbläsar-/mobil-/tangentbordskontroll kunde inte köras med miljöns tillgängliga kapabiliteter och är fortfarande en verifieringsbegränsning. Ingen verklig kund- eller produktionsvalidering påstås.
- PARTNER-04 är integrerad och publicerad. Tidigare kandidatstatus ovan är historik. Denna efterhandskvittens ändrar enbart dokumentation; dist/ är oförändrad och kräver ingen ny publicering.

## 2026-10-11 · PARTNER-05 publicerad som version 20

PR #20 integrerad; GitHub/Sites publicerad källrevision `66d8046558728fd21dd6be09373e2a4eaeddc364`. Sites version `appgprj_6ac600ecf7d48191923687550810c1d4~appgver_cfab5f7d13c88191b334487f90012965`, deployment `appgdep_6acabb57a94881918954329a003a92a8`, succeeded 2026-10-10 22:25:42 UTC (11 oktober 00:25 Stockholm). URL https://kraftringen-partnerlabb.rosen123.chatgpt.site. Custom-delning revision 4 bevarad. Alla åtta qa/*.mjs och JS-syntaxkontroller passerade på publicerad källa. Browser-/mobil-/tangentbords-/videouppspelning inte verifierad i denna miljö.

Säljpartnerns meny: Mina resultat, Insikter, Avtalsfakta, Utbildning och support. Endast egna rapportdata i partnervy; inga interna kostnader/nettobidrag. Fastighetsbolag: Avtalsval med Kvartspris som grundval, Opti och Rörligt månadspris som alternativ. Nya utkast får en ändringsbar kopia av grundvalet; äldre underlag bevaras. Excelval gäller hela urvalet nya rader. Ingen automatisk avtalsteckning.

Faktakort har officiella källänkar och relevanta befintliga Elakademin-filmer, inte kompletta produktspecifika filmer. Saknade exakta produktblad för Stabil/B2B Kvartspris och specifikation av Individuell portfölj är nästa innehållsbehov, inte ett skäl att fabricera villkor. Detta är en efterhandskvittens, dist/ oförändrad.


## 2026-10-11 · Senaste applikationsleverans: PARTNER-06 / version 22

PR #24 är integrerad. GitHub/Sites publicerad källrevision
`9b935a533229881e2ca0bef83d3c84f5fc9468dd`. Native version 22 och deployment `appgdep_6acb44b7f54081919734b72a86af7ab7`
har succeeded-kvittens 08:11:51 UTC på https://kraftringen-partnerlabb.rosen123.chatgpt.site.
Tre partnerupplägg under Partners; tidigare egna säljrapporter, utbildning
och befintlig inflyttningsservice är bevarade. Delning och Daniels
granskning före integration är oförändrade. Befintliga pilotagenten är
återaktiverad med exakt uppdaterad prompt och oförändrat timschema;
native återläsning kvitterad i WORKLOG. Denna dokumentationsrevision
ändrar inte den publicerade appen.

## 2026-10-11 · Elakademin publicerad i version 23

PR #26 är integrerad. Verifierad GitHub/Sites-källrevision
`c5d4076dc30aae84e2c6fc1d83d5023d688d35b9` innehåller senaste PARTNER-06
och hela Elakademin: 18 kapitel, 18 Arthur-filmer med svensk textning,
139-sidig PDF och 463-bilders redigerbar PowerPoint. Native deployment
`appgdep_6acb4815b5e08191a55100a4c80bb532` bekräftar succeeded
2026-10-11 08:26:17 UTC. Full kurslänk:
https://kraftringen-partnerlabb.rosen123.chatgpt.site/elakademin.html
Den publicerade sidan passerar 102 kontroller; custom-åtkomst revision 4
är bevarad. B2C-samtalsbibliotek och lokala framsteg består. Detaljer i
WORKLOG. Efterhandskvittensen ändrar ingen dist-fil eller deployment.

## 2026-10-11 · Samarbetsförslag för fastighetsbolag publicerat i version 24

PR #28 är integrerad från kandidat `24d4cf4a481d8a7e79bda84cbf319ba5b3f7b74e`.
GitHub/Sites publicerad källrevision är `a88628d7b3dc99a4316a30e7969542431ca31e16`.
Native version 24 och deployment `appgdep_6acb4e3f7edc8191805fde3bffc72e98`
bekräftar succeeded 2026-10-11 08:52:32 UTC på befintlig Partnerlabb-URL.
Ert samarbete nås från vald fastighetspartners interna profil och egen meny
Samarbetet. Inflyttning och egen fastighetsel visualiseras med separata
underlag; sex förslagsidéer har lokala diskussionsfokus. Elakademin v23 är
bevarad. Delning och Daniels godkännandekrav ändrades inte. Befintligt
timuppdrag är återaktiverat med exakt återläst uppdaterad prompt och samma
schema. Denna efterhandskvittens ändrar inga dist-filer.

### 2026-10-11 · Felgranskning publicerad i version 25

PR #30 är integrerad. Verifierad GitHub/Sites-källrevision:
`e9e261ca4d76ee25f717ca8087019a9399e3da4e`.
Native version 25:
`appgprj_6ac600ecf7d48191923687550810c1d4~appgver_07a9340f47c48191ae1fff528e356c6f`.
Deployment `appgdep_6acb561ea23c819188333333c1253f8e` bekräftar **succeeded**
2026-10-11 09:26:11 UTC på
https://kraftringen-partnerlabb.rosen123.chatgpt.site.
Custom-åtkomst revision 4 och samma Site-identitet är bevarade; inga
schema- eller åtkomständringar ingår.

251 nya riktade browserkontroller och 916 lokala ytkontroller passerar.
Ytgranskningen omfattar 288 vykontroller i desktop/mobil och 29 lokala
destinationsURL:er. På den faktiskt publicerade sidan passerar 102
oberoende medie-/åtkomstkontroller.
Bred verifiering på samma publicerade version passerar också 916/916,
288 vykombinationer och alla 29 interna länkdestinationer utan script-
eller HTTP-fel. Faktisk kursnavigation bevarar partner/spår även efter
Sites normala omdirigering till kanonisk adress.
Full kvittens, rättningar och verifieringsgränser finns i WORKLOG.
Kvittens-PR:en uppdaterar dokumentation och testhjälparens nätverksanrop.
Den ändrar inte dist/ eller manifest och kräver ingen ny publicering.

## 2026-10-11 · Andra felgranskningen publicerad i version 26

PR #32 integrerad. Exakt publicerad GitHub/Sites-källrevision:
`209a98fbb2144a253ee6495c1af25792dea32822`.
Native version `appgprj_6ac600ecf7d48191923687550810c1d4~appgver_d8b896a9e8e08191858ff688702422e5`.
Deployment `appgdep_6acb5e6ed9a88191b2d3e6faf8c54b2d` bekräftar succeeded
2026-10-11 10:01:35 UTC på https://kraftringen-partnerlabb.rosen123.chatgpt.site.
Samma Site-identitet och custom-policy revision 4 bevarade; inga schemaändringar.

157 nya riktade kontroller passerar lokalt. Publicerad v26 passerar 916
breda kontroller över 288 vykombinationer och 29 interna destinationer,
130 riktade flik-/navigation-/rapport-/Excel-/bilagekontroller och 102
medie-/åtkomstkontroller utan script-/resursfel. Flikkonflikter, avbrutna
ljudändringar, testspår/URL, demo-historik, inflyttningsunderlag och äldre
data har rättats. Full kurs och tidigare rapport-/serviceunderlag bevaras.
Full kvittens och verifieringsgränser finns i WORKLOG. Kvittens-PR ändrar
bara dokumentation och testets väntan på nytt dokument, inte dist/ eller
manifest; ingen ny publicering krävs.

## 2026-10-11 · Inflyttningen först, publicerad i version 27

PR #34 är integrerad. Exakt publicerad GitHub/Sites-källrevision:
`5794d27122ff0b6be7c99527d2864ceddc9b6987`.
Native version `appgprj_6ac600ecf7d48191923687550810c1d4~appgver_1072adfb024481919756db9a4c70ed82`.
Deployment `appgdep_6acb60b3c950819182bc379686c92783` bekräftar succeeded
2026-10-11 10:11:14 UTC på https://kraftringen-partnerlabb.rosen123.chatgpt.site.
Samma Site och befintlig custom-policy revision 4 bevaras. Ingen ändring
av agentens prompt, schema eller aktivering gjordes.

Ert samarbete börjar med Excel/manuell inflyttning och tre tydliga steg
för fullmaktsunderlag, överlämning och återkoppling. Därefter visas egna
kunder/kickback, föreslagen avlastning av elfrågor och egen fastighetsel.
Fyra ytterligare idéer ligger i en öppningsbar fördjupning; alla sex idéers
detaljer och lokala fokusval finns kvar. Nya partnerresultat fabriceras inte.

Den samlade integrationen med version 26:s rättningar passerade 172
samarbetskontroller och 67 servicekontroller utan JavaScript-fel.
Visuellt granskat på dator/mobil och tangentbord verifierat. Full kurs,
tidigare underlag, delning och Daniels godkännandekrav består.
Full kvittens i WORKLOG. Dokumentationskvittensen ändrar inte dist/ eller
manifest och kräver ingen ny publicering.

## 2026-10-11 · Tredje felgranskningen publicerad som version 28

PR #36 är integrerad. GitHub-main och exakt publicerad Sites-källa är
`ccd1988f4db4268baf72aa9b45c2a6c012a5a6e4`. Fast-forward från v27, med
testat identiskt merge-/kandidatträd. Native version 28:
`appgprj_6ac600ecf7d48191923687550810c1d4~appgver_9a16b8e205b081919014a832bc092750`.
Deployment `appgdep_6acb65a3ab4c8191bc37cbb1b4899ed9` succeeded
2026-10-11 10:32:21 UTC på
https://kraftringen-partnerlabb.rosen123.chatgpt.site.

Sex reproducerade felklasser rättade: bilageval under pågående radering,
konflikter mellan ljuddialoger i flera flikar, förlust av profilmetadata,
överskrivning av oläsbart samarbetsunderlag, felaktiga quizflaggor och
kalenderdagar i olika tidszoner. På publicerad version passerar 135 nya
riktade, 916 breda och 102 medie-/material-/åtkomstkontroller utan fel.
Samma Site, custom-delning revision 4, full utbildning, scheman och
ekonomiska exempelunderlag bevaras. Full kvittens/gränser i WORKLOG.
Denna efterhandskvittens ändrar bara dokumentation; dist/ och hosting
är identiska med publicerad v28 och kräver ingen ny publicering.

## 2026-10-11 · Hela portalens flödesgranskning publicerad som version 29

PR #38 är integrerad. Exakt GitHub-main och publicerad Sites-källa:
`35dff3b40a14333a7f57390050d3b44fdd4fd7b3`. Testat kandidat-/mergeträd
är identiskt; Sites-källan överfördes fast-forward från v28.
Native version 29:
`appgprj_6ac600ecf7d48191923687550810c1d4~appgver_1b751a071bc881919b6ca46f7435dcf8`.
Deployment `appgdep_6acb67846c488191919840088943471c` succeeded
2026-10-11 10:40:20 UTC på
https://kraftringen-partnerlabb.rosen123.chatgpt.site.

Sex fel rättade: utbildningsretur, lämnat förmedlingsformulär, nya partners
i rapportväljaren, två fokusreturer och mobilt periodval. V28:s rättningar
bevaras. 273 nya riktade, 919 breda och 160 klick-/layoutkontroller är gröna
lokalt; även den gemensamma integrationen är verifierad. På den faktiskt
publicerade versionen passerar 919 breda kontroller utan script-/HTTP-fel.
Samma custom-policy revision 4, full utbildning, sparade data och schema
består. Full kvittens/gränser i WORKLOG. Dokumentationskvittensen ändrar
inte dist/ eller hosting och kräver ingen ny publicering.

## 2026-10-11 · Installerbar Partnerlabb publicerad som version 32

PR #44 är integrerad. Exakt GitHub-main och publicerad Sites-källa:
`7f8dce30ca1bfdd34cbac09ae83e5cc7cfc02353`. Native version
`appgprj_6ac600ecf7d48191923687550810c1d4~appgver_5bd355f4305c8191a7b61d524aadc8ed`
och deployment `appgdep_6acbd4ea83c081918ffcff0057040889` bekräftar
**succeeded** 2026-10-11 18:27:08 UTC på
https://kraftringen-partnerlabb.rosen123.chatgpt.site.

Partnerlabb har nu gemensamt webbappmanifest, appikoner och menyvalet
**Lägg till som app** med iPhone/iPad-, Android- och datorsteg. Befintlig
custom-policy revision 4 och samma Site-identitet bevarades. Ingen offline-
cache, backend, dataflytt, App Store-publicering, åtkomst- eller schemaändring
ingår. Syntetiska installations- och befintliga resultat-/självservice-
kontroller passerar. Fysisk telefoninstallation och visuell browserkontroll
återstår; full kvittens finns i WORKLOG.
