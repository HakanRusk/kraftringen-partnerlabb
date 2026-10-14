# Underhållna QA-ingångar

`npm ci && npm test` (Node 24) kör syntaxkontroll för dist-JavaScript och 11
utvalda sviter: partnerregister, resultat utan CRM, partnersjälvservice,
rapportdata, importdubbletter, nästa handling, kvittoåteröppning,
fastighetsperiod, appmanifest, portal-CRM och kommersiella periodval.
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
och partner-types.py. De provar riktig Excel, bilagor, handläggning, sparfel,
isolering och nya partnertyper med fiktiva data. Vid CI-fel sparas tillgängliga
skärmbilder och serverlogg i sju dagar. Det är inte visuell granskning av hela portalen.

Workflowen kör för varje PR utan path-filter så att en eventuell obligatorisk
QA gate inte fastnar på dokumentations-PR:er. Båda jobben måste lyckas; misslyckade
kontroller ignoreras inte. CI ger ingen automatisk merge eller publicering.

Övriga audit/round/bug-skript är historiska, riktade undersökningar. De raderas
inte här och körs inte blint som en enda stabil svit. Välj dem efter berört område
eller konsolidera i separat uppgift. Godkända tester och revision kvitteras i WORKLOG.
