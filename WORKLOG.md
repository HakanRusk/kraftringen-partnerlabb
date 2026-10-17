# Senaste arbete och kvittenser

Äldre logg (2 278 rader) bevaras oförändrad i
[docs/archive/2026-10-14/WORKLOG.md](docs/archive/2026-10-14/WORKLOG.md).
Skriv nya faktiska resultat här; kopiera inte produktbesluten från docs/DECISIONS.md.

## 17 oktober 2026 · Mobilfilter, fortsättning av PR #62

Baslinje c61cc22 verifierad med grön CI 39023266108: samtliga 14 Node-/DOM-
sviter, befintliga Chromiumflöden och tolv rapportkombinationer passerade.
Sparat domänunderlag var oförändrat. Artifact 12096654545 innehåller geometri
och skärmbilder. Savera Kunder & avtal 390 px, Face2face Insikter 320 px och
Savera 1440 px granskade. Filtren var 410 px höga på mobil; första resultatet
började 987–1034 px ned. Desktop: 192 / 672 px. Detta är layoutbelägg,
inte en användarstudie eller skärmläsarkvittens.

Fortsätter på samma agent/report-mobile-verification, ingen konkurrerande PR.
Kandidaten fäller ihop rapportkontrollerna vid högst 600 px med Visa/Dölj filter,
aria-controls/expanded och bibehållet knappfokus. Period/datadatum/aktivt urval
ligger utanför. Desktopkontrollerna är alltid synliga. Öppningen sparas inte:
omladdning/partnerbyte stänger mobilkontroller utan att rensa rapportfiltren.
Samma urval/mått/fixtures och befintliga extrafilter återanvänds.

DOM-regression täcker toggle/fokus, aktivt säljarurval, sidbyte, partnerisolering,
återställning och oförändrade nyckeltal/domändata. Browsersekvensen utökad med
tangentbord, mobil→desktop-breddbyte och före/efter-geometri. Ny CI krävs för
den ändrade kandidaten; tidigare grön CI gäller endast baslinjen. Ingen merge,
publicering, backend, migrering, åtkomst eller ändrade verksamhetsbeslut.
Lokalt passerar alla 14 Node-/DOM-sviter inklusive nya rapportfallen, Python-
syntax och git diff --check. Lokal browser är fortsatt otillgänglig.

## 17 oktober 2026 · Riktad rapportverifiering för MOBILE-01

Uppföljning av första CI-försöket 39019844112 på c719afc: Node/DOM samt
befintliga Chromiumflöden passerade. Rapportsekvensens fyra 1440 px-flöden
passerade, men slutkontrollen av hela state stoppade före mobilbredderna.
Testet hade inte sparat den initiala översiktens lazily initierade exempeldata
före omladdning; appens readState läser då ett nytt seed. Testfixturen sparas
nu uttryckligt i sin isolerade browserkontext före baslinjen. Djupjämförelse
anger ändrade toppnycklar och en separat kontroll kräver oförändrat sparat
domänunderlag. Ingen appändring eller försvagad domänkontroll. Ny CI krävs;
320/390 px är ännu inte verifierade. Första körningens artifact finns sparat.

Eget agentarbete från main 0876eaeedc5e8f69a3b18403c1d3d9748fa5b830,
gren agent/report-mobile-verification. Inga öppna PR:er vid start.
Ingen ändring i dist/, affärsregler, data, åtkomst eller publicering.

Lokal installation av Playwright 1.63.0 lyckades, men Chromium v1243 gav
åter oläsbart 0 MiB-arkiv (ZIP central directory saknas); browserflödet är
inte lokalt kört. För att få belägg i befintlig CI tillkommer en avgränsad
rapportsekvens: Savera/Face2face, båda rapportsidorna, 320/390/1440 px,
filter/fokus/omladdning/återställning och oförändrade domändata.
Skärmbilder och geometri sparas som CI-artifact även vid lyckad körning.
Filterhöjd/första resultatets position registreras utan att påstå uppmätt
användarnytta eller redan reproducerad mobilbrist. Ingen designändring föreslås nu.

Python-syntax, git diff --check och alla 14 Node-/DOM-sviter passerar lokalt.
Faktisk CI-status kvitteras i PR efter körning. Nästa steg: granska rapportbilder och
geometri från aktuell PR-HEAD, åtgärda bara belagd friktion. D-01–D-04 ändras inte.

## Publicerad v39 · 15 oktober 2026

Alla åtta punkter i uppdrag 2 (**Ludwig via Claude, 15 oktober**) levererade
via [PR #60](https://github.com/ludros93-prog/kraftringen-partnerlabb/pull/60).
PR-HEAD: 41a163ae907a397fef4db96d8bde1d8b824ac044.
Verifierad GitHub-main och publicerad Sites-källa:
**c561f1d75ef72f70a382774217da8b2a3726a719**.
Exakt testat/överfört träd: 78dad76a837579e46438a274edb7fff9014e357f.

[CI-körning 38751827132](https://github.com/ludros93-prog/kraftringen-partnerlabb/actions/runs/38751827132)
completed/success: 14 Node-/DOM-sviter, Chromium flows och QA gate.
Åtta nya DOM-scenarier täcker talgruppering, ogiltiga värden, exakta äldre
decimaler, överblick/avbryt, svenska datum/årtal, öppna pipelinevolymer,
partnerkatalog och omladdning/demo. Befintliga sviter behålls.
Chromium passerar vid **1440, 390 och 320 px**: partner-/kunddialogernas
rubrikavstånd, stjärnans rad, B2B-produkter, fokusflytt utan main-ram,
rubrikstil, formaterad förbrukning, datum, sammanfattningar och tidigare
CRM-/identifierarflöden. Inga scriptfel i kontrollerade flöden. Browserbelägg
kommer från CI; ingen lokal visuell helhets- eller skärmläsargranskning påstås.

Sites uppdaterades fast-forward från v38; ren checkout och exakt testat träd.
Version-ID: appgprj_6ac600ecf7d48191923687550810c1d4~appgver_2af8c40759fc8191b560cf2c6d439288.
Deployment-ID: appgdep_6ad0e42aef688191a253b568ecf75988.
Native **succeeded** 2026-10-15T14:33:30.119333+00:00:
https://kraftringen-partnerlabb.rosen123.chatgpt.site.
Custom-delning/policyrevision 4 bevarad. Inga ändringar av åtkomst, automation,
backend, migrering eller resultatregler. Sparade decimaler och historik bevaras.

CRM-05 är klar. Denna efterhandskvittens ändrar endast WORKLOG, BACKLOG och
GITHUB-STATUS; app, tester och workflow är identiska med publicerad v39.

## 15 oktober 2026 · CRM-finputs, uppdrag 2

Källa: **Ludwig via Claude, 15 oktober**, uttryckligt uppdrag att genomföra,
testa och publicera åtta punkter. Eget arbete från main
7e6ca9765a163847c9f1d0155b20abf14802e52f, gren codex/crm-polish.
Inga öppna PR:er vid start. Beteende och bevarande dokumenteras i P-02.

Svensk kWh-inmatning med grupperade heltal och formaterad visning. Äldre
v38-decimaler bevaras exakt vid annan redigering; ingen tyst avrundning.
Gemensam CRM-datumvisning även för historikens genererade aktivitetsdatum,
utan att skriva om lagrade datum eller historik. Pipeline- och kundkortssummering,
enhetliga rubriker och tomsteg. Partnernamnets stjärna har gemensam textrad;
B2B-kortet listar P-07. Dialogavståndet rättas där styles.css och design.css
lade marginal/padding ovanpå varandra. main behåller fokus men utan ram.

Befintliga sviter behålls; förväntade datum/visningsvärden uppdateras för det
nya beteendet. npm test passerar 14 Node-/DOM-sviter; åtta nya DOM-regressioner
passerar även efter skärpt kontroll av talgruppering. Python-syntax och diffkontroll
passerar. Utökad befintlig Chromiumsekvens vid 320/390/1440 px körs i CI; lokal
browserstyrning saknas. Faktisk CI och publicering kvitteras efter körningen.
Ingen ändring av migration, affärsresultat, åtkomst, automation eller backend.

## Publicerad v38 · 15 oktober 2026

Samtliga nio operativa CRM-förbättringar enligt uppdraget **Ludwig via Claude,
15 oktober** publicerade via [PR #58](https://github.com/ludros93-prog/kraftringen-partnerlabb/pull/58).
Verifierad PR-HEAD: 49bb376ff116de82f699a4c31554e8e5cb2896d6.
GitHub-main och publicerad Sites-källa:
**ef2c08a1076a7d64d6113ae8d3d71c21e1606e99**.
Verifierat och överfört träd: ee6941f75de0a3c0d15b7395559fb45294af68bd.

[CI-körning 38747767459](https://github.com/ludros93-prog/kraftringen-partnerlabb/actions/runs/38747767459)
är completed/success för aktuell HEAD: Node/DOM, Chromium flows och QA gate.
13 Node-/DOM-sviter, inklusive 12 operativa CRM-scenarier, 13 tidigare CRM-
scenarier och 8 identifierarscenarier. Chromium körde de befintliga
inflyttnings-/partnertypsflödena samt både identifierarflödet och det nya
CRM-arbetsflödet vid **1440, 390 och 320 px**. Fältbredd, köer, länkar,
sökning under inmatning med bibehållet fokus, pipeline, avbrutet stegbyte,
avslutsdatum och omladdning passerade utan scriptfel i kontrollerade flöden.
Ingen lokal browserkontroll eller fullständig visuell/skärmläsargranskning påstås.

Första browserförsöket upptäckte ett testurval som räknade kontaktlänkar både
i synlig lista och stängd dialog. Testet avgränsades till kundlistan; slutlig
CI ovan kör alla krav. Riktad regression säkerställer också att äldre kända
closedAt behålls som wonAt/lostAt vid återöppning. Okända datum fabriceras inte.

Sites-källan uppdaterades fast-forward från v37 med ren checkout och exakt
samma träd som grön CI. Version-ID:
appgprj_6ac600ecf7d48191923687550810c1d4~appgver_0c4c854d81608191b452fdac85db75c4.
Deployment-ID: appgdep_6ad0ddc97f248191acc1971ff5bdf01c.
Native **succeeded** 2026-10-15T14:06:17.763634+00:00:
https://kraftringen-partnerlabb.rosen123.chatgpt.site.
Custom-delning/policyrevision 4 bevarad; inga åtkomst-, schema- eller backendändringar.

PR #55:s vägledning och regressioner är återanvända i #58; #55 stängdes som
ersatt utan separat merge av den äldre grenen. CRM-02/04 är klara. Tidigare
CRM-val och kund-/anläggningsidentifierare är klara i v35/v37. Gemensam lagring
är fortsatt ett separat förslag enligt D-03, med färdigt underlag men utan backend.
Vunnen skapar fortsatt inga avtal, resultat, utskick eller kickback.

Denna efterhandskvittens ändrar bara WORKLOG, BACKLOG och GITHUB-STATUS.
Applikation, tester och workflow är identiska med publicerad v38.

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
