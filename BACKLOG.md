# Prioriterad utvecklingskö

Gällande mandat i AGENTS.md; produktdefinitioner i docs/DECISIONS.md.
Avslutade uppgifter och äldre prioriteringar finns i docs/archive/2026-10-14/BACKLOG.md.

| Prioritet / ID | Nästa leverans | Klart när / beroende |
| --- | --- | --- |
| Klar v36 · QA-01 | Aktivera CI för Node/DOM och centrala Chromiumflöden | Faktisk grön GitHub-körning för aktuell PR-revision; ingen automatisk publicering. |
| Klar v36 · PERIOD-01 | Kronologiska periodval med rätt delperiodsmärkning | Månad/kvartal nyast först, september initialt, oförändrade data/jämförelser. |
| Klar v36 · DOC-01 | Kort arbetsminne, historik i arkiv, en definition per beslut | Gällande regler/bevarande/godkännandekrav kvar; beslut länkas. |
| Klar · PILOT-04A | Konkret litet backendunderlag för D-03 | Arkitektur, roller, data/dokument, API, migrering, drift och acceptans går att besluta om. |
| Klar v37 · CRM-03 | Kund-/anläggningsidentifierare i portal-CRM | Nya/befintliga kort, B2B/B2C, format, bevarande, export och tre browserstorlekar verifierade; kvittens i WORKLOG. |
| Klar v38 · CRM-02/04 | Vunnen-besked och nio operativa CRM-förbättringar | 13 Node-/DOM-sviter, Chromium vid 320/390/1440 px och publicering verifierade; kvittens i WORKLOG. |
| Klar v39 · CRM-05 | Svensk inmatning och finputs i CRM | Åtta punkter, 14 Node-/DOM-sviter, Chromium vid tre bredder och publicering verifierade; WORKLOG. |
| Pågår · MOBILE-01 | Få fram nyckeltal tidigare på mobil | PR #62: grön verifierad baslinje; mobil hopfällning under ny verifiering. Aktivt urval/tangentbord/före–efter, se WORKLOG. |
| Nästa · PILOT-03 | Reproducerad friktion i inflyttning/handläggning | Konkret före/efter, bevarad data, relevant verifiering. |
| Vid underlag · PILOT-00 | Uppdatera fakta/beslut från faktisk återkoppling | D-01–D-04 besvaras med källa, inte antaganden. |
| Förberedelse · PILOT-02 | Liten fiktiv import-/avstämningsmall | Service, avtal, års-MWh och kickback har separata källor/händelser. |
| Senare · PILOT-04 | Gemensam ärendelagring/behörighet | D-02/D-03 och uttryckligt genomförandemandat. |
| Senare · DATA-01 | Verkliga resultat/kickback/integrationer | D-04 och data-/integrationsmandat. |
| Öppet · RESEARCH-01 | Identifiera avsedd Saleshub innan jämförelse | Säker leverantör/källa; inga generella bäst-i-världen-påståenden. |

CRM-01 är publicerad i v35. Tidigare genomförda inflyttnings-, rapport-, partner-,
utbildnings- och appuppgifter ska bevaras, inte byggas om utifrån arkivets gamla
status. QA-städning, större kodomstrukturering och offlinestöd är framtida förslag,
inte del av detta pass. Grenskydd/Daniels åtkomst följs i GITHUB-ACCESS.md.
