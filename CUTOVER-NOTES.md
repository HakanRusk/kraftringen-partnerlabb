# Övertagande till Håkan Rusk

GitHub-källan är https://github.com/HakanRusk/kraftringen-partnerlabb.
Övertagandet 23 oktober 2026 använder senaste verifierade main och ett nytt
privat Sites-projekt, med identitet i `.openai/hosting.json`. Ludwigs tidigare
Site lämnas orörd. Arkiv och Git-historik är belägg, inte aktuella publiceringsmål.

Aktuella instruktioner: AGENTS.md och RUNBOOK.md. Resultat, verifieringsgränser,
nya kontokrav och data-/mediebegränsningar: docs/HANDOVER-2026-10-23.md.
Exakt publicerad SHA, version och deployment förs i WORKLOG.md efter lyckad körning.

GitHub Actions QA finns aktiv i `.github/workflows/quality.yml`; den använder
inte secrets och publicerar inte. Den äldre filen under templates/ är en mall.
Ingen automatisk GitHub→Sites-synk finns. GitHub-anslutning, Sites-ägande,
medarbetaråtkomst, grenskydd, externa medier och utvecklingsagent är separata saker.

Ingen gammal timuppgift återanvänds, ändras eller aktiveras i denna överlämning.
Eventuell ny agent behöver Håkans beslut om mandat, schema/tidszon, rapportyta
och granskning före aktivering. Kontrollera separat om Ludwigs gamla uppgift
fortfarande kör mot repot; överföringen bevisar inte att den stannat.

Exempeldata och lokala material följer koden. Browserdata och appinstallationer
hör till sina respektive ursprung. Ingen verklig kunddata, backend, integration,
betalning eller ny tjänst ingår i övertagandet.
