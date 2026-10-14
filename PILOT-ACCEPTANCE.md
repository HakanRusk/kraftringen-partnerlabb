# Acceptanspaket för inflyttning, enkel partneruppföljning och Insikter

Mål: fastighetsbolaget ska registrera inflyttningar via Excel eller manuellt,
bifoga befintliga fullmakter och följa samma ärende genom Kraftringens
handläggning och återkoppling. Hyresgästen har inga aktiva steg i portalen.
Detta följer Ludwigs senaste arbetssätt och ersätter den tidigare aktiva
hyresgästdemon. Det är ett acceptanspaket för en fiktiv frontenddemo, inte
en kvittens på att Partnerlabb kan ta emot riktiga ärenden.

Slutför en mycket snygg, enkel och intuitiv demo utan att invänta faktisk
kund. Verkliga pilotförutsättningar redovisas separat sist.

## Testunderlag och gräns

Använd två fiktiva partners, `Exempelfastigheter AB` och `Exempelbo
Förvaltning`, samt `Test Hyresgäst` med `hyresgast@inflyttning.example`.
Bostadsuppgifter, Excelrader och bifogade dokument ska vara påhittade.
Ett testdatum är inte en svarstid eller ett leveranslöfte.

Demofält, filgränser och radvalidering är tekniska testförslag. De bekräftar
inte vilka person-, bostads- eller avtalsuppgifter verksamheten faktiskt
behöver. En bifogad fullmaktsfil visar endast ett lokalt dokument; den
bevisar inte juridisk giltighet, verifierat samtycke eller avtalsval.
Filer lagras lokalt i IndexedDB, med skilda scope för ordinarie labb och
kunddemo. JSON-exporten omfattar inte filinnehållet. Ingen delad backend
eller riktig behörighetskontroll finns.

## Fiktiva testfall

Kör fallen mot isolerade testprofiler. Anteckna källrevision, faktiskt
resultat och eventuellt fel. Ett fall som inte körts märks `Ej testat`.
En saknad beslutad förutsättning märks `Blockerat` bara för den uppgift
som behöver beslutet. Saknad pilotkund blockerar inte frontendarbete.

| Fall | Handling | Godkänt resultat i lokal demo |
|---|---|---|
| A1 — Manuell registrering | Fastighetsbolaget fyller en fiktiv hyresgästs kontakt-, bostads- och inflyttningsuppgifter, granskar och registrerar. | Exakt ett serviceunderlag får en referens och rätt partner. Ingen aktiv hyresgästvy krävs. Det är inte automatiskt förmedlat, ett kundrecord eller ett avtal. Avbrutet utkast skapar inget ärende. |
| A2 — Excelgranskning | Hämta fiktiv .xlsx-mall, ladda upp flera rader och granska före registrering. Prova tomma nödvändiga fält, felaktig e-post/datum och oläsbar fil. | Begripliga fil- och radfel visas. Läsning/förhandsgranskning skapar inga ärenden. Endast uttryckligt val registrerar validerade rader enligt granskningens tydliga urval. Inga påhittade fält eller ekonomiska värden skapas. |
| A3 — Dubbletter och upprepning | Prova identiska rader i filen och samma rad igen efter registrering inom samma partner. Prova också annan partner. | Dubbletter upptäcks och redovisas före en okontrollerad dubbelregistrering. Ny registrering knyts till rätt partner och unik inflyttning. Namn ensamt används inte som säker personidentifiering. Partneravgränsning och vald regel dokumenteras som demoförslag. |
| A4 — Bifogad fullmakt | Bifoga fiktiv PDF/PNG/JPEG och koppla den uttryckligt till rätt manuell post eller importerad rad. Prova fel filtyp/signatur och överskriden filgräns. | Tillåten fil går att återöppna efter omladdning. Filnamn, storlek och rätt ärende syns. Otillåten fil får korrekt fel. Filen ger inte verifierat samtycke, juridiskt godkänd fullmakt eller ny `authorityDemo`-markering. Äldre poster får inga fabricerade bilagor. |
| A5 — Saknad bilaga och förmedling | Registrera utan fullmakt och prova att förmedla; bifoga sedan korrekt fiktiv fil och förmedla uttryckligt. | Saknad fullmakt är synlig och nya partnerunderlag kan inte beskrivas som klara eller förmedlas utan faktiskt lagrad bilaga. Efter förmedling behåller samma ärende referens och historik. Kraftringens arbetslista visar nästa insats; partnern får inte redigera interna handläggningsfält. Äldre ärenden behandlas enligt sitt dokumenterade ursprung. |
| A6 — Handläggning och komplettering | Kraftringen anger nästa steg, begär konkret komplettering och partnern rättar underlag/bifogar dokument innan ny förmedling. | Referens och historik består. Elhandel, elnät och erbjudandeval följs separat. Intern anteckning visas inte i partnerns vy eller testkvitto. Partnerns tidigare kompletteringsplan/datum tillskrivs inte automatiskt Kraftringen; en uttrycklig senare intern plan behålls. Historiska tjänsteval ändras inte av ny bilaga. |
| A7 — Återkoppling utan avtal | Slutför den simulerade hjälpen utan ett accepterat elhandelserbjudande. | Slutförd service och delad återkoppling kan följas utan nytt kundrecord, avtal, intäkt eller kickback. Erbjudandevalet förblir separat och finansfixtures är oförändrade. Sparad återkoppling är inget faktiskt utskick. |
| A8 — Avbrott, fel och äldre data | Ladda om manuellt utkast/registrerat ärende/bilaga. Avbryt import. Prova felande localStorage/IndexedDB och ofullständig gammal data. | Utkast eller samma post återfinns utan dubblett där den aktuella lagringen stöder det. Importavbrott skapar inget ärende. Misslyckad lagring ger begripligt besked och ingen falsk sparad/förmedlad status. Äldre poster/utkast bevaras utan nya val eller befogenheter; giltig tidigare portaldata har företräde. |
| A9 — Mobil, tangentbord och visningsroller | Genomför båda inmatningsvägarna och berörda ärendesteg vid 320/390/1440 px och med tangentbord. Byt partner och intern/partnerdemovy. | Etiketter, fokus och centrala handlingar fungerar utan sidöverskjutning. Partner B:s vy blandar inte ihop partner A:s ärenden/bilagor. Äldre inflyttningslänkar öppnar partnerregistrering. Ingen direktlänk eller QR kräver hyresgästens arbete. Savera/Face2face och kommersiella exempel bevaras. |

A9 verifierar bara demots visningslogik. Perspektivbyte i en webbläsare
bevisar inte riktig autentisering eller serverstyrd åtkomstkontroll.

## Reproducerbar kunddemo utan riktig kund

Den separata demoytan via `?demo=inflyttning` ska återanvändas. Kontrollera
leveransstatus i WORKLOG/GITHUB-STATUS innan implementation eller publicering
beskrivs som genomförd. Historiska version 12-tester är inte bevis för det
nyare Excel-/manuella flödet.

| Fall | Godkänt när |
|---|---|
| G1 — Sammanhängande partnerresa | Fastighetsbolaget → Excel eller manuellt underlag → fullmakter → förmedling → Kraftringen → återkoppling kan genomföras. Guidens moment visar rätt aktör och begriplig nästa handling; inget moment påstår att hyresgästen fyller i portalen. Navigation skapar inga ärendehändelser. |
| G2 — Visuell kvalitet | Hierarki, text, knappar och fel-/sparbesked är konsekventa. Vid 320/390/1440 px täcks inga centrala handlingar; tangentbord, etiketter och synlig fokus fungerar. Designgranskning är inte uppmätt verklig användarnytta. |
| G3 — Ärende genom avbrott | Samma ärende och rätt fullmaktsbilaga kan följas efter omladdning. Kvitto och status återanvänder sparade poster. Excelupprepning skapar inga okontrollerade dubbletter. Relevanta A-fall gäller även när guidningen används. |
| G4 — Lokal isolering och omstart | Kunddemots ärenden, utkast och bilagor hålls åtskilda från ordinarie labbdata. Bekräftad demo-omstart återställer bara demoytan; avbruten omstart bevarar den. Normaldata, normala utkast/bilagor och kommersiella exempel är oförändrade. Felande bilagerensning redovisas. |
| G5 — Upprepning och kvittens | Börja om och kör båda vägarna med fiktiv provdata igen. Dokumentera kandidat-SHA, faktiskt körda kontroller och kvarvarande fel. Ingen verklig signering, extern filöverföring, elnätskontakt eller utskickad återkoppling påstås. |

Godkänn G1–G5 tillsammans med relevanta A-fall för en fungerande demo.
Verklig användarrespons, produktionsfält och driftberedskap kräver andra
belägg; deras frånvaro är inget skäl att lämna fiktiva flöden halvfärdiga.

## SAVERA-01 / INSIKTER-01 / PARTNER-01 — Senaste uppföljningskravet

Ludwigs senare instruktion den 10 oktober 2026 tillför den enkla interna
Savera-vyn, en separat Insikter-sida och partnerns kunder/kickback. Detta
är bekräftat frontenduppdrag; måttmodeller och all kund-/avtalshistorik i
demon är förslag med fiktiva data. Fallen nedan är acceptanskriterier,
ingen kvittens på genomförda kontroller eller publicering.

| Fall | Handling och godkänt resultat |
|---|---|
| S1 — År, månad och vecka | Välj varje periodtyp och olika perioder. Nya avtal räknas efter avtalsdatum och avtalad års-MWh följer samma valda avtal. Visa faktiska periodgränser och att 2026-data slutar 7 oktober; framtida/ej observerade dagar får inte se ut som uppmätt nollförsäljning. |
| S2 — Kundens avtal | Öppna periodens kundrader och filtrera på vardera av Saveras sex bekräftade avtalsprodukter, säljare och region. Avtal, kund, datum och års-MWh ska gå att stämma av med urvalet. Tabellsökning/visningsfilter ska ange om de endast påverkar tabellen, och inte ändra nyckeltal i smyg. |
| S3 — Aktivt bestånd | Visa unika kunder med påbörjat och ej avslutat avtal vid vald periods observerade slut, även från äldre kohorter. Beståndet är inte antal nya avtal under perioden; framtida starter och tidigare avslut ska hanteras med tydlig datumgräns. Datum ska stå vid måttet. |
| I1 — Observerad kundtid | Visa kundtid för kunder som faktiskt avslutats under vald period separat från ålder hos kunder som fortfarande är aktiva vid periodslut. Visa bas/antal och tydlig tomstatus. Aktiva kunder får inget fabricerat slutdatum eller slutlig kundlivslängd. |
| I2 — Populära avtal | Produktfördelningen bygger på nya avtal i samma period- och produkt-/säljar-/regionurval. Antal och andelar summerar till urvalets bas. Saknad bas ska förklaras; en enskild produktfiltervisning får inte kallas popularitet i hela kundbasen. |
| I3 — Scenario vid fortsatt tempo | Scenariot visar valda periodens observerade antal och kalenderdagar, takten, datadatum och återstående horisont. Visa redan observerat årsutfall separat från framtida scenario. Periodbyte/filter ska ändra rätt bas. Ingen observerad bas eller inget sålt avtal ger inget scenario; detta är inte bevis på verkligt nollutfall. Prognosen innebär inget löfte eller automatisk intäkt/kickback. |
| P1 — Partnerns egna kunder | Fastighetspartnern ser sina attribuerade nya elhandelskunder från det separata avtalsunderlaget. Exemplet räknar ett nytt elhandelsavtal som en ny kund; riktig kundidentifiering behöver fastställas. De skiljs från serviceanmälningar och hjälpta inflyttare. Annan partners kund- eller kickbackposter och interna kostnader/nettobidrag ska inte visas i den partnerarbetsytan. Detta verifierar demovisning, inte backendbehörighet. |
| P2 — Kickback från eget underlag | Vald partner/period visar endast relevanta manuella exempelposter, belopp och föreslagen status. Beloppen summerar till postunderlaget. Produkt-, sök- eller veckofilter får inte skapa en påhittad fördelning av månadsersättning. Tydliggör kickbackens egen period och om produkturvalet inte påverkar den. Registrering/förmedling/slutförd service ändrar inte posterna. |
| R1 — Avstämning och bevarande | Stäm av Savera-radernas månadsvisa nya avtal och avtalad års-MWh mot befintliga aggregat. Äldre bestånds-/kundtidsfixtures är separat historik. Filter/navigation ska inte ändra serviceärenden, kunddialoger, utkast, dokument eller manuella finansfixtures. Bevara Face2face och båda inflyttningsvägarna. |
| R2 — Mobil och begriplighet | Kontrollera berörda vyer vid 320/390/1440 px, tangentbordsåtkomst, tydliga kontrollnamn, tomma urval och återställning av filter. Tabeller får ha egen scroll men sidan ska inte skjuta ut. Period, bas, produkt och datadatum ska gå att förstå utan implementationstext i huvudarbetet. |

Reproducerbar testkod, faktiskt genomförda fall, kandidat-SHA och resultat
redovisas i WORKLOG.md. Saknad verklig kund begränsar uppmätt användarnytta
och produktionsvalidering, men stoppar inte att S-/I-/P-/R-fallen verifieras
med kontrollerade fiktiva underlag.

## CRM-01 — Valbart arbetssätt för säljpartner

| Fall | Handling och godkänt resultat |
|---|---|
| C1 — Skapa partner | Skapa B2B, B2C och blandad säljpartner med vartdera arbetssättet. Valet består efter omladdning och påverkar inte kundsegment eller resultathistorik. Äldre profiler blir Eget CRM. |
| C2 — Eget CRM | Partnern behåller de fyra befintliga ingångarna. Kundarbete visas inte i meny eller start, och direkt öppning anger att arbetsytan inte är aktiverad. |
| C3 — Portal-CRM | Partnern får Kundarbete i meny och start. En fiktiv kundaktivitet kan skapas och ändras med partnerns segment, `.example`-kontakt, teststatus och nästa steg. |
| C4 — Isolering och betydelse | Partner A ser inte partner B:s aktiviteter. Aktiviteten skapar inte avtal, resultat, intäkt eller kickback. Byte till Eget CRM döljer men raderar inte poster; återgång visar samma historik. |
| C5 — Fel och layout | Sparfel återställer tidigare data utan falsk kvittens. Dialog, lista och huvudhandling fungerar med tangentbord samt vid 320/390/1440 px. |

Detta verifierar en lokal frontenddemo. Verklig CRM-process, delad lagring,
behörighet och personuppgiftsbehandling kräver D-03/D-05 och separat mandat.

## Kodverifiering att återanvända och anpassa

- `qa/property-intake.py`: aktuella browserkontroller för manuellt/Excel,
  validering, dubbletter, bilagor, handläggning, isolering och responsivitet.
- `qa/customer-demo.py`: guidning och separat demoyta; kontrollera att
  aktuell revision använder partnerregistrering och relevanta G-fall.
- `qa/movein-drafts.py` och `qa/movein-service.py`: tidigare browseringångar;
  efter verksamhetsändringen måste de följa det nya arbetssättet eller
  hänvisa till aktuella kontroller. Återinför inte gamla tenantsteg för att
  få äldre testförväntningar att passera.
- `qa/movein-next-action.mjs`: ansvarsskiftet efter kompletterad förmedling.
- `qa/movein-receipt.mjs`: befintlig kvittoåteröppning utan dubblett.
  PR #1 är redan merged via PR #4. Bevara återanvändbar logik och uppdatera
  förväntningar när den nya partneringången ersätter den gamla vyn.

Detta är en verifieringsplan, ingen ny testkörning eller publiceringskvittens.
Körda kontroller och faktisk revision redovisas i WORKLOG.md.

## Innan samma paket kan användas i en riktig pilot

Följande ska vara beslutade och verifierade i den godkända pilotmiljön.
Lokal demodata eller tester i ett enda webbläsarkonto uppfyller inte kraven.

| Förutsättning | Bevis som behövs |
|---|---|
| Arbetssätt och ansvar | Namngiven pilotpartner och handläggare; nödvändiga manuella/Exceluppgifter, godkänd fullmakts- och avtalsprocess, dokumentkontroll och definition av slutförd hjälp. Föreslagna statusar fastställs eller ändras. Partnerns ansvar för registrering är redan bekräftat. |
| Gemensamt ärende och dokument | Partner och handläggare i separata sessioner ser samma verkliga pilotärende och rätt dokument från godkänd lagring. Referens och historik består; upprepad inskickning hanterar dubbletter. Dokumentlivscykel, radering och återhämtning är verifierade. |
| Riktiga behörigheter | Separata identiteter visar att endast avsedda ärenden och dokument är åtkomliga, även direkt. Interna anteckningar skyddas i tjänsten. |
| Verklig återkoppling | Beslutad mottagare får återkoppling genom godkänd kanal. Misslyckad återkoppling upptäcks och hanteras; sparad text är inte ett skickat meddelande. |
| Service, avtal och ekonomi | Slutförd service och aktiverat elhandelsavtal beläggs var för sig. Kickback stäms av mot godkänt underlag. Saknade uppgifter redovisas utan uppskattade ersättningsregler. |
| Pilotbeslut | Ansvariga accepterar flödestest, avvikelser och driftrutin innan riktiga hyresgästuppgifter eller dokument tas emot. |

Följ faktiskt genomförda steg, kompletteringar, handläggning och återkoppling
vid en liten överenskommen pilotserie. Anteckna var användarna fastnar och
vilka manuella insatser som krävs. Utlova ingen tidsbesparing eller
konvertering innan den har mätts.
