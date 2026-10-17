# Underhållna QA-ingångar

`npm ci && npm test` (Node 24) kör syntaxkontroll för dist-JavaScript och 14
utvalda sviter: partnerregister, resultat utan CRM, partnersjälvservice,
rapportdata, importdubbletter, nästa handling, kvittoåteröppning,
fastighetsperiod, appmanifest, portal-CRM, kund-/anläggningsidentifierare, CRM-arbetsflöden, CRM-finputs och kommersiella periodval.
jsdom verifierar DOM-händelser/data, inte riktig rendering eller layout.

Browserflöden körs i GitHub Actions med Python 3.12 och Chromium. I en miljö
som tillåter lokal browserautomatisering:

```sh
python -m pip install -r qa/requirements.txt
python -m playwright install --with-deps chromium
python -m http.server 8000 --bind 127.0.0.1 --directory dist
# I en annan terminal:
PARTNERLABB_QA_URL=http://127.0.0.1:8000/ python qa/run-browser.py
```

Runnern kör movein-drafts.py, movein-service.py (båda använder property-intake.py)
samt partner-types.py, crm-identifiers-browser.py, crm-workflow-browser.py och
report-mobile-browser.py. De provar riktig Excel, bilagor, handläggning, sparfel,
isolering och nya partnertyper med fiktiva data. Vid CI-fel sparas tillgängliga
skärmbilder och serverlogg i sju dagar. Det är inte visuell granskning av hela portalen.

Workflowen kör för varje PR utan path-filter så att en eventuell obligatorisk
QA gate inte fastnar på dokumentations-PR:er. Båda jobben måste lyckas; misslyckade
kontroller ignoreras inte. CI ger ingen automatisk merge eller publicering.

Övriga audit/round/bug-skript är historiska, riktade undersökningar. De raderas
inte här och körs inte blint som en enda stabil svit. Välj dem efter berört område
eller konsolidera i separat uppgift. Godkända tester och revision kvitteras i WORKLOG.

Identifierarsviterna använder enbart uppenbart fiktiva nummersträngar. DOM
kontrollerar format, byte av kundsegment, precision, ändring/rensning, äldre poster,
sparfel, export och demoisolering. Chromium provar skapa/ändra/omladdning,
felmeddelande/fokus och fältens bredd vid 320, 390 och 1440 px.

CRM-arbetsflöden provar katalog per kundsegment, frivilliga fält, sparfel,
ändringskonflikter, avslutsdatum/äldre kort, kalendergränser, arbetslistor,
kontaktlänkar, livesökning med fokus, MWh-underlag, avbrutna stegbyten och
navigation per roll. Chromium kör nya flödet vid 320, 390 och 1440 px.

CRM-finputs verifierar grupperad heltalsinmatning, exakta äldre decimalvärden,
datum med årsskifte/tidszon, överblick, öppna volymer och B2B-katalog. Den
befintliga CRM-browsersekvensen kontrollerar också dialogavstånd, stjärnans rad,
svensk formattering, fokus utan huvudram och sammanfattning vid tre bredder.

Rapportkontrollen provar Savera och Face2face, Kunder & avtal och Insikter vid
320/390/1440 px: sidbredd, filter inom sidan, tangentbordsöppning av extrafilter,
fokus efter filterbyte/återställning, aktivt säljarurval även när kontrollerna
fälls ihop, omladdning och periodbyte. Domändata ska vara oförändrade.
`report-mobile-evidence` sparar skärmbilder och `report-layout.json` i sju dagar
även vid lyckad CI. JSON/loggen visar filterhöjd och första resultatets position
som underlag för MOBILE-01, utan godtycklig godkäntgräns för skärmhöjd.
Mobilsekvensen öppnar/stänger primärfilter med tangentbord, kontrollerar
aria-expanded/fokus, synligt urval, återöppning efter omladdning och synliga
desktopkontroller efter breddbyte. Filterhöjden ska minska minst 250 px mot
den dokumenterade 410 px-baslinjen; det är ett geometriskt regressionskrav,
inte en gräns för verklig användarnytta. DOM-fallen ingår i commercial-periods.
Detta ersätter inte manuell visuell granskning, skärmläsare eller verklig användarrespons.
