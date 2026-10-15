# Senaste arbete och kvittenser

Äldre logg (2 278 rader) bevaras oförändrad i
[docs/archive/2026-10-14/WORKLOG.md](docs/archive/2026-10-14/WORKLOG.md).
Skriv nya faktiska resultat här; kopiera inte produktbesluten från docs/DECISIONS.md.

## 15 oktober 2026 · Operativt CRM, uppdrag 1

Källa: **Ludwig via Claude, 15 oktober**, med uttryckligt genomförande-, test-
och publiceringsuppdrag. Eget Codex-arbete från main
34b2760f2bba2c30dc563792bcf62aebd947a833, gren codex/crm-sales-workflow.
PR #55 (d7719ae67d7af01d6c67af8fc907d64637a428b7) lästes som befintligt
oberoende agentarbete. Dess Vunnen-besked och regressionskontroller har tagits
in och anpassats till v37, så att förslaget hanteras i denna samlade leverans.
Inga Daniels ändringar ingår.

Samtliga nio önskemål implementerade enligt docs/DECISIONS.md P-02. Nya
elavtalsfält återanvänder segmentCatalog från befintligt resultatunderlag;
ingen ny katalog, prislista eller resultatkoppling. Tidigare identifierare,
historik, sparfelsåterställning och demoavgränsning behålls. Äldre avslutsdatum
bevaras utan att hitta på datum för kort som saknar dem.

Lokal verifiering: npm test passerar 13 Node-/DOM-sviter, inklusive 12 nya
operativa CRM-scenarier, 13 befintliga CRM-scenarier och 8 identifierarscenarier.
Nya fall täcker datum/månadsslut/skottår/tidszon, katalog, tomma/utelämnade fält,
listgränser, partneravgränsning, klickbara kontakter, livesökning/fokus,
MWh-underlag, osparade stegbyten, sparfel, konflikter, omladdning och demo.
Python-syntax passerar för nya Chromiumsviten. Lokal browser saknar tillåten
styrning i miljön; Chromium körs via befintlig CI. Verifierad CI, integration
och publicering kvitteras efter faktisk körning, inte i förväg.

## Publicerad v37 · 15 oktober 2026

Kund-/anläggningsidentifierare i portal-CRM publicerade via
[PR #56](https://github.com/ludros93-prog/kraftringen-partnerlabb/pull/56),
HEAD bf2c19505f6646162ea5de336873dd97fecc4214.
GitHub-main och publicerad Sites-källa:
**19230f7574ab1590669d604881f712a82c8ffe9c**.
Testat/source-synkat träd: 87b7e68eadddf4f07656fb754dc312e915976400.
Öppen PR #55 ingår inte i denna version.

[CI-körning 38708091237](https://github.com/ludros93-prog/kraftringen-partnerlabb/actions/runs/38708091237)
passerade Node and DOM, Chromium flows och QA gate. 12 Node-/DOM-sviter,
inklusive 8 identifierarscenarier och 13 befintliga CRM-scenarier. Chromium:
195 befintliga kontroller och nya CRM-flödet vid 1440, 390 och 320 px.
Skapa, kundtypstyrt nummerfält, formatfel/fokus, fältbredd, omladdning och
ändring passerade i alla tre storlekar; inga scriptfel i de kontrollerade flödena.
Ingen lokal browserautomation gjordes; browserbeläggen kommer från CI.

Sites överfördes fast-forward från da858f3 med ren checkout och identiskt träd.
Version-ID: appgprj_6ac600ecf7d48191923687550810c1d4~appgver_887eec398c60819194cb7d3871962fd8.
Deployment-ID: appgdep_6ad0941a0668819197f73efea1d7a921.
Native **succeeded** 2026-10-15T08:51:58.031805+00:00:
https://kraftringen-partnerlabb.rosen123.chatgpt.site.
Befintlig custom-delning/policyrevision 4 bevarades utan åtkomständringar.

Denna efterhandskvittens uppdaterar endast WORKLOG, BACKLOG och GITHUB-STATUS.
Applikation, tester och workflow är oförändrade från publicerad v37. Uppgifterna
lagras fortfarande lokalt och identifierarna verifieras inte mot externa register.

## 15 oktober 2026 · CRM-kundens identifierare

Direkt användaruppdrag: anläggnings-ID, nätområdeskod och personnummer respektive
organisationsnummer på ny kund för partners med portal-CRM. Eget Codex-arbete
från main c781230b07dea395b4ddc2ffae50d197603c3c7e, gren
codex/crm-customer-identifiers. Öppen PR #55 (besked vid Vunnen) lästes som
överlappande men separat arbete; dess ändringar ingår inte i denna kandidat.

Fält på nya/befintliga kundkort, kundtypstyrt nummerfält och separat anläggningsdel.
Formatkontroll utan register-/identitetsverifiering. Fälten kan kompletteras senare;
18-siffriga värden lagras som strängar utan precisionsförlust. Identifierarändring
sparas även utan ny anteckning. Historiktext kopierar inte numren. Befintlig
partneravgränsning, sparfelsåterställning och demoisolering återanvänds.

Lokal verifiering: npm test passerar samtliga 12 Node-/DOM-sviter, inklusive
8 nya identifierarscenarier och 13 befintliga CRM-scenarier. Python-syntax och
git diff --check passerar. Ny Chromiumkontroll vid 320/390/1440 px ingår i CI;
CI/publicering kvitteras efter faktisk körning. Ingen backend,
verklig kunddata, delnings-, schema- eller affärsregeländring ingår.

## Publicerad v36 · 14 oktober 2026

PR [#53](https://github.com/ludros93-prog/kraftringen-partnerlabb/pull/53)
integrerad med HEAD 399559be6cc68e669f4d4aa7391edd1515270b11.
GitHub-main och publicerad källrevision:
**da858f3c5e1cea2936a7684bb45c8cd9c096299e**.
Testat/pushat träd: fea6350155a212054f220ca8831c89606b0dd6fc.

[GitHub Actions körning 38544546559](https://github.com/ludros93-prog/kraftringen-partnerlabb/actions/runs/38544546559)
är completed/success för aktuell PR-revision. Node and DOM, Chromium flows och
QA gate är gröna: 11 Node-/DOM-sviter och 195 browserkontroller (utkast 13,
service 67, partnertyper 115). Inga JavaScript-fel rapporterades i browserflödena.
Detta är verifierad CI, inte enbart en upplagd workflowfil. Grenskydd är fortsatt
inte verifierat och måste hanteras separat av ägaren enligt GITHUB-ACCESS.md.

Sites-källan överfördes fast-forward från ae18c0c till samma GitHub-main;
ren checkout och identiskt träd verifierades före paketering.
Version-ID: appgprj_6ac600ecf7d48191923687550810c1d4~appgver_1282ce4966c48191b1182d23cfaa4ab4.
Deployment-ID: appgdep_6acf4fe0b7b88191bd3130400f2ac47d.
Native status **succeeded**, 2026-10-14T09:48:30.970944+00:00:
https://kraftringen-partnerlabb.rosen123.chatgpt.site.
Befintlig custom-delning/policyrevision 4 bevarades; inga åtkomstverktyg ändrades.

QA-01, PERIOD-01, DOC-01 och PILOT-04A är klara. Backendunderlaget är ett
förslag inför D-03, ingen aktiverad backend eller delad data. Claudes automatiska
startimport är 86 rader AGENTS/MISSION; övrig läsning sker via aktuell läskarta.
Elva arkiverade original verifierades byte för byte mot main 2fe6381.

Denna efterhandskvittens ändrar enbart WORKLOG, BACKLOG och GITHUB-STATUS.
dist/, tester och workflow är oförändrade från den publicerade revisionen.

## 14 oktober 2026 · CI, perioder, arbetsminne och backendunderlag

Ludwigs uppdrag: ”Är det inte lättare att du gör det själv?” efter förslaget
att utföra granskningspunkterna 7, 3 och 11 samt backendunderlag för punkt 1.
Eget oberoende Codex-arbete från main 2fe6381613ce6e11c5a92affe5aa7e4f9bd414f7,
gren codex/partnerlabb-quality-and-pilot-spec. Inga andra PR:er var öppna vid start.

- CI: aktiva .github/workflows/quality.yml, låsta QA-beroenden och gemensamma
  kommandon för 11 Node-/DOM-sviter samt tre centrala Chromiumingångar. QA gate
  kräver båda jobb. Inga secrets eller automatisk merge/publicering.
- Perioder: månad och kvartal nyast först. September kvar som initial månad;
  oktober anger delperiod till 7 oktober. Inga ändrade fixtures/jämförelsebaser.
- Dokumentation: elva originalfiler arkiverade exakt; korta aktuella regler,
  läskarta och ett samlat produktbeslutsdokument. Daniels revisionsgodkännande,
  datagränser och publiceringsrutin bevarade. Ingen automation/åtkomst ändrad.
- D-03: konkret specifikation i docs/BACKEND-PILOT.md. Ingen backend byggd/aktiverad.
- Lokal verifiering: npm test passerar 11 sviter och JavaScript-syntax, inklusive
  13 CRM-scenarier och nya periodkontroller. DOM är inte browser-/layoutverifiering.
- Lokal Chromiumkörning saknas i denna miljö; faktisk CI och publicering kvitteras
  efter genomförandet, inte genom workflowfilens existens.

## Senast verifierat publicerad · v35 · 14 oktober 2026

Valbart CRM integrerat via PR #51; källrevision
ae18c0cd0ca5d4ef6cb11b5434bc0218c9bb64b8.
Native Sites version:
appgprj_6ac600ecf7d48191923687550810c1d4~appgver_3d23466657a08191966f5b56568effd1.
Deployment appgdep_6acf2dabe1b88191b5dc61231852641c bekräftade succeeded
2026-10-14T07:22:37.984067Z på
https://kraftringen-partnerlabb.rosen123.chatgpt.site.
Custom-delning oförändrad. Efterhandskvittens PR #52 gav main 2fe6381;
dist/ var oförändrad. Full historik/testbelägg i arkivets sista poster.
