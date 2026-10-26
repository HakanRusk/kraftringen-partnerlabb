# Gällande produktbeslut

Samlad definition 14 oktober 2026. Källor är Ludwigs direkta instruktioner,
bevarade med datum i [ursprungligt arbetsminne](archive/2026-10-14/PILOT-FACTS.md)
och [ursprungliga regler](archive/2026-10-14/AGENTS.md). Tekniska val och
måttdefinitioner nedan är implementationsförslag, inte nya verksamhetsvillkor.
Vid nytt beslut: ändra definitionen här, notera källa/datum; länka från övriga dokument.
Öppna beslut D-01–D-04 definieras fortsatt enbart i ../PILOT-DECISIONS.md.

## P-01 · Partnertyper och kundsegment

Beslut 10–11 oktober: Partners samlar Säljpartner, Fastighetsbolag och Personalavtal.
Befintlig field-typ bevaras. Säljsegment väljs separat: företag/B2B, konsument/B2C
eller båda. Savera (syd) är B2B, Face2face (vast) är B2C och använder Beest enligt
bekräftelsen 8 oktober. Namnet styr inte funktioner eller katalog. Ingen Beest-
eller Dynamics-integration är beslutad; B2B Veckokollen är ett separat verktyg.

Implementerat: partnerProfiles kompletterar registret. Befintlig typ är låst;
namn får ändras för alla och segment för säljpartners. Historiska rader behåller
sitt segment. Nya partners får inga andra partners exempelutfall. estate1 och
estate2 är fiktiva fastighetsbolag; alla kund-/utfallsrader är exempel.

## P-02 · Valbart CRM

Beslut 14 oktober ersätter den äldre generella begränsningen till externt
säljverktyg: varje säljpartner kan välja Har eget CRM eller Använd Partnerportalen
som CRM vid skapande eller redigering. Befintliga profiler, inklusive Savera och
Face2face, behåller eget CRM om inget väljs. Typ och segment är separata val.

Implementerat: crmMode external/portal, crmRecords med kundkort, kontakt,
ansvarig, steg, nästa aktivitet/datum, förlustorsak och historik. Öppna affärer
kräver nästa aktivitet/datum; Förlorad kräver orsak. Sparat segment är låst;
byte av arbetssätt/konfiguration bevarar rader. Vunnen är en lokal säljstatus,
inte ett avtal, inskickat bekräftelseärende, resultat eller kickback. Delat CRM
återstår. Äldre säljunderlag/utkast bevaras utan att återinföras i aktiv meny.

Tillägg beslutat 15 oktober: kundkort i portal-CRM ska också ha anläggnings-ID,
nätområdeskod och personnummer respektive organisationsnummer. Implementationsval:
personnummer visas för B2C, organisationsnummer för B2B; anläggningsuppgifter
visas för båda. Uppgifter kan kompletteras senare utan att blockera tidig kontakt
eller äldre kundkort. Anläggnings-ID lagras som text (18 siffror), nätområdeskod
som tre versala bokstäver. Organisationsnummer har 10 siffror; personnummer
accepterar 10/12 siffror med bibehållet bindestreck/plustecken. Endast format
kontrolleras, ingen kontrollsiffra, identitetskontroll eller registerverifiering.
Historiken anger ändrade uppgifter utan att kopiera identifierarna till historiktext.

Formatunderlag kontrollerat 15 oktober:
[Kraftringens tecknaflöde](https://prod.kraftringen.se/foretag/el/teckna-elavtal/),
[Skellefteå Kraft om områdes-ID](https://www.skekraft.se/sv/faq/omrades-id-vad-ar-omrades-id/)
och [Skatteverkets individuppgifter](https://www7.skatteverket.se/portal-wapi/open/apier-och-oppna-data/utvecklarportalen/v1/getFile/tjanstebeskrivning-individuppgifter-api/pdf/1.5.0/tjanstebeskrivning-individuppgifter-v1.pdf).

### CRM-arbetsflöde · 15 oktober 2026

Källa: **Ludwig via Claude, 15 oktober**. Uppdraget omfattar genomförande,
test och publicering av nio förbättringar i portal-CRM:

- Tydligt besked vid val, återöppning och sparning av Vunnen; separat avtalsprocess
  kvarstår och inget skickas. Spara vunnet/förlorat datum och visa datum i kundlistan.
- Frivilligt **Elavtal i dag**: nuvarande elleverantör, avtalets slutdatum,
  elområde SE1–SE4, årsförbrukning i kWh och produktintresse från P-07 för kundens
  sparade segment. Inga priser eller besparingsberäkningar.
- Översikten visar kommande sju dagars aktiviteter samt avtal som löper ut inom
  sex månader, sorterade på slutdatum. Snabbdatum: idag, imorgon, en vecka, en månad.
- Klickbara telefon-/e-postuppgifter i lista och kort. Sökning filtrerar under
  inmatning i kunder, pipeline och aktiviteter.
- Pipeline summerar angiven årsförbrukning i MWh per steg. Nästa-steg-knappen
  öppnar ett osparat kundkort med nästa steg förvalt; nästa aktivitet kan fyllas i.
- Partnerns vänstermeny behålls och dubblerande CRM-flikar tas bort. Interna
  CRM-flikar finns kvar där motsvarande vänstermeny saknas.

Implementationsval: datum utgår från Europe/Stockholm. Kommande sju dagar är
imorgon till och med dag sju; utgående avtal är idag till och med samma datum
sex kalendermånader framåt (månadsslut kläms till sista giltiga dagen).
Avtalslistan omfattar alla kundkort med registrerat slutdatum, även avslutade
CRM-affärer, med synlig säljstatus. Saknad förbrukning räknas inte som noll;
pipelinen visar hur många affärer som har underlag. Detta är kundens uppgivna
förbrukning, inte avtalad volym eller försäljningsutfall. Vunnen/Förlorad är
slutsteg utan en automatisk nästa-steg-knapp.

Befintligt closedAt används för aktuellt avslut. wonAt/lostAt bevarar senaste
faktiska markering även vid återöppning; tidigare övergångar finns kvar i events.
Samma avslutade steg behåller datum vid redigering. Äldre kort utan datum visar
Datum saknas och får inget påhittat datum av en vanlig komplettering. Befintlig
v1→v2-migrering, normal-/demoisolering, identifierare och historik bevaras.
Äldre anrop som utelämnar nya fält raderar dem inte. Sparfel och flikkonflikter
hanteras fortsatt utan att skriva över tidigare sparade uppgifter.

### CRM-finputs · uppdrag 2, 15 oktober 2026

Källa: **Ludwig via Claude, 15 oktober**. Åtta korrigeringar med mandat att
genomföra, testa och publicera: svensk kWh-inmatning/visning, enhetliga svenska
datum, lika översiktsrubriker, summering av öppen pipeline utan förbrukningstext
i tomma steg, bibehållet huvudfokus utan ram, kompakta partner-/kunddialoger
med obligatorisk stjärna på samma rad, B2B-produktlista enligt P-07 samt en
kundkortssammanfattning före formuläret.

Nya/ändrade förbrukningsvärden anges i hela kWh. Vanligt mellanslag, hårt
mellanslag och smalt hårt mellanslag accepteras som grupper om tre siffror.
Sparat värde är fortsatt numerisk text; visningen använder svensk gruppering.
Tidigare accepterade decimalvärden bevaras exakt vid annan redigering och
visas med decimaler; de avrundas eller migreras inte automatiskt. Fältet kan
fortsatt lämnas tomt. Feltext: Ange årsförbrukningen i hela kWh, till exempel 250 000.

CRM-datum visas med svensk kort månad, med årtal utanför innevarande år i
Europe/Stockholm. Datumfält och lagring behåller ISO-format; historik sparas
oförändrad och formateras bara vid visning. Pipelinerutan omfattar öppna
affärer i aktuellt filter, med antal och summa angiven års-MWh/täckningsgrad.
Saknade uppgifter visas inte som noll. Kundkortets överblick visar status,
nästa aktivitet/datum, avtalslut, förbrukning och kontaktlänkar och följer
osparade ändringar i formuläret. Avbryt skriver inget.

## P-03 · Partnerns arbetsyta och intern uppföljning

Beslut 10–11 oktober: Kraftringens interna resultatöversikt är huvudvy. Generiska
Kunder & avtal och Insikter ligger under Partners, inte egna Savera-/Face2face-menyer.
Partnern ser egna resultat; interna kostnader/nettobidrag visas inte där.
Säljpartner med eget CRM har fyra stora ingångar: resultat, Avtalsfakta,
Academy och stöd. Portal-CRM ger vald partner en operativ arbetsyta.
Partnerresans åtta steg och två checklistmoment per steg är interna förslag,
sparade per partner i commercial.management; äldre state.journey bevaras.
Arbetslistor härleds ur befintliga poster, inte nya persistenta affärsobjekt.
Nästa insats/datum är inte SLA eller utlovad svarstid.

## P-04 · Inflyttning

Beslut 10 oktober: fastighetsbolaget gör allt aktivt portaljobb. Behåll manuell
registrering och Excel (.xlsx), förhandsgranskning, befintliga fullmaktsbilagor
per hyresgäst och uttrycklig förmedling. Inga aktiva hyresgästformulär, QR eller
direktlänkar; äldre länkar går till partnerns privata registreringsyta.
Kraftringen hanterar elhandel, behövlig elnätshantering och återkoppling.

Implementerat: separata moveins, utkast och lokala binära IndexedDB-bilagor.
Avbryt/navigation skapar inga ärenden. Saknade/misslyckade bilagor redovisas;
filens förekomst är inte verifierat samtycke eller giltig fullmakt. Äldre val,
fullmaktsdemomarkeringar och utkast bevaras utan nya befogenheter. JSON-export
innehåller inte filerna. Formulärfält/filgränser är demoförslag tills D-02 besvarats.

Beslut 11 oktober: Avtalsval har Kvartspris som initialt grundval, alternativ
Opti och Rörligt månadspris. propertyDefaults ger nya utkast en ändringsbar
ögonblicksbild; äldre utkast utan val och dubbletter skrivs inte om.
desiredProduct är önskemål, inte tecknat avtal, fullmakt eller offerChoice.

## P-05 · Fastighetssamarbetet

Beslut 11 oktober: Ert samarbete nås internt och av vald fastighetspartner.
Presentation: konkret inflyttning först, kundinflöde/kickback, föreslagen avlastning
av uthyrarnas elfrågor och egen fastighetsel. Övriga idéer är öppningsbar fördjupning.
Partnerns egen fastighetsel är en separat B2B-affär från hyresgästkanalen.

Bevara sex förslag: hyresgästernas elfrågor, underbyggda kostnadsintervall i
bostadsannonser, onödig förbrukning, elbehov före lokaluthyrning, energiöversikt
vid fastighetsaffär, samt laddning/solceller/batterier/styrning. De är inga
färdiga tjänster, belagda kundprioriteringar, SLA:er eller besparingslöften.
Lokala fokusval är diskussionsunderlag med återställning vid sparfel. De beställer
eller skickar inget. Egna avtals-/anläggnings-/pris-/volymuppgifter saknas och
ska inte lånas från säljpartnernas eller hyresgästernas resultat.

## P-06 · Personalavtal

Beslut 11 oktober: företaget är kanal till anställda; företagets egen el är
separat B2B-affär. Behåll partnertypen och översikten. Erbjudande, villkor,
registrering och ersättning saknar underlag. Bygg inte sådana flöden från typvalet.

## P-07 · Produktkataloger och utbildning

Bekräftade kataloger (senast 10 oktober):

| Segment | Produkter |
| --- | --- |
| B2B | Rörligt pris, Kvartspris, Poolportfölj Trygg, Poolportfölj Offensiv, Individuell portfölj, Kraftringen Stabil |
| B2C | Fastpris, Vintersäkrat, Opti, Kvartspris, Rörligt pris |

Avtalsfakta skiljs från utbildning. Produktnamn innebär inte pris-, behörighets-
eller produktvillkor. Exakt produktblad för Stabil/företagets Kvartspris saknas;
Individuell portfölj har allmän portföljkälla. Behåll källdatum och saknat underlag.
Fiber/andra produktområden ingår inte.

Beslut 8–11 oktober: bevara fullständiga Elakademin från v23, filmer/material,
självtest och sparade framsteg, fyra äldre demokurser samt B2C-samtalsbiblioteket.
B2B-fall/portföljprodukter märks som fördjupning för företag, inte konsumentutbud.
Kursens offentliga sakuppgifter kontrollerades 7 oktober; räkneexempel är antaganden.
Kurs-/självtestresultat är lokala, inte personverifierad partnercertifiering.
Länken till fristående Elakademin synkroniserar inte data. V34 tog bort det äldre
kurskortet, inte historiska framsteg. Samtalsljud/anteckningar ligger lokalt i
IndexedDB per partner och demoyta, ingår inte i JSON-export och delas inte mellan
användare. Använd bara syntetiskt ljud i utveckling.

## P-08 · Resultatmått och källgränser

Behov bekräftat 8–11 oktober; nedanstående måttdefinitioner är demoförslag för D-04.
Nya avtal följer stängningsdatum. MWh är avtalad årsvolym för periodens nya avtal,
inte levererad energi. Nettobidrag är manuellt exempelbidrag minus exempelpartnerkostnad.
Framtida potential ingår inte i utfall. Årsunderlaget 2026 slutar 7 oktober;
hel föregående årsbas saknas. Jämför delperioder med lika lång observerad period.

Aktiva kunder är unika kunder med startat, ej avslutat avtal vid observerat
periodslut; beståndet är inte nya avtal. Avslutades observerade kundtid skiljs
från aktivas ålder. Churn: avgångar ur periodens öppningskohort / samma kohort;
summera inte månaders nämnare för år/kvartal. Förstartsbortfall använder periodens
sålda avtal och avbrott observerade till datadatum, separat från churn.

Insikter anger period, urval, kohort/bas och datum. Popularitet bygger på samma
urval av nya avtal. Scenariot för fortsatt takt visar observerade kalenderdagar,
brytdatum och återstående horisont; saknad bas ger inget fabricerat scenario.
Inga intäkts-, MWh-, bestånds- eller kickbackprognoser utan motsvarande modell.

Fasta aggregat och fiktiva avtalsrader stäms av per månad för avtal/års-MWh.
Historik för bestånd/kundtid är separat fixture. Kundsegment på varje rad består
vid konfigurationsändring; nytt segment utan historik är saknat underlag.
Serviceanmälan, hjälpt inflyttare och nytt elhandelsavtal är skilda händelser.
Produktfilter gäller avtalsutfall, inte serviceaggregat.

Kickback är fristående manuella poster med egen källa/period och föreslagna
statusar. Postperiodens betalningar är inte kassaflöde per betalningsmånad.
Kund-/produkt-/veckofilter fabricerar ingen fördelning av månadsersättning.
Ingen automatisk avstämning mot partnerkostnad eller intjänad provision från
avtal/service finns. Verifierade regler, leadägande, exklusivitet och offertbefogenhet saknas.

## P-09 · Lokal prototyp och app

Nuvarande implementation är statisk och lokal, inte gemensam pilotdrift.
Sites-inloggningen skyddar testlänken; appens demovyer är ingen serverbehörighet.
Normal-/demoisolering och sparfel skyddar lokal användning. App på hemskärmen
använder samma manifest och vanlig portalrot utan partner-/demoparametrar.
Internet och befintlig inloggning behövs; ingen service worker/offlinesynk finns.
Appen och webbläsaren kan ha separat data. Installerad app ger ingen synkronisering.

## P-10 · Återställningsbart orderförslag · 26 oktober 2026

Källa: Håkans direkta nio-punktsuppdrag. Ny säljpartnerstart med orderstatus,
perioder, kund/orderregistrering och partnerspecifik provisionsstatistik.
Korrigering efter Håkans återkoppling 26 oktober: orderöversikten är standard
för säljpartners även via befintliga partnerval och workspace-länkar, utan opt-in.
Intern partnerprofil har **Visa ordrar & status**. Portal-CRM nås via **CRM-översikt**.
**Prova nya partnerflödet** väljer demoidentitet eller återaktiverar efter återgång.
Ett uttryckligt sparat av-val eller `?proposal=legacy` respekteras; vanlig intern
portalrot öppnar ingen demoinloggningsdialog om ingen identitet är vald.
**Återgå till tidigare vy** stänger av förslaget utan att radera data. Tidigare
arbetsytor, CRM, historiska resultat, utbildning och appinstallation bevaras.

- Demoidentiteten väljer partnerdomän och startvy, sparas lokalt och återanvänds
  när förslaget är aktivt. URL:ens uttryckliga workspace har företräde. Detta är
  inte autentisering/behörighet; riktig koppling mellan inloggad person och
  partnerorganisation kräver separat backend-/identitetsarbete. Sites-åtkomst oförändrad.
- Statusar är Utkast, Registrerad, Godkänd, Ej godkänd, Ångrad, Bekräftad.
  Registrerade ordrar går till godkänd/ej godkänd/ångrad, godkända till bekräftad
  eller ångrad; bekräftad/ej godkänd kan ångras. Statusbyte är uttrycklig demosimulering.
  Verkliga partners ska inte själva godkänna ordrar. Inga avtal skickas.
- Perioden baseras på registreringsdatum, utkast på skapandedatum. ISO-veckor
  måndag–söndag med veckoår. Statusrutorna är ömsesidigt uteslutande och summerar
  till periodens alla ordrar; detaljlistan har separat status- och sökfilter.
- Provisionsvyn räknar nu godkända inklusive bekräftade respektive bekräftade i
  registreringskohorten, inte händelser under bekräftelsemånaden. Ingen historisk
  bokslutsbild. Ångrade/ej godkända ger inget exempelbelopp. Illustrativa, ej avtalade
  regler: Face2face 250 kr/bekräftad order; Savera 30 kr/uppskattad års-MWh på
  bekräftade ordrar. Annan partner visar saknat regelunderlag och inget belopp.
- Kundens typ är Företag, Enskild firma eller Privatperson; kundnamn, nummer,
  post-/besöksadress, e-post och telefon. Namn/typ krävs; övriga kan kompletteras.
  Privatperson kopplas till Elhandel privat, övriga till Elhandel företag.
- Orderkatalogen i detta förslag ersätter P-07 för **ny orderinmatning**:
  privat: Rörligt månadspris, Rörligt kvartspris, Kraftringen Opti.
  företag: Rörligt månadspris, Rörligt kvartspris, Individuell indexportfölj,
  Kraftringen Stabil, Kraftringen Direkt, Poolportfölj – offensiv, Poolportfölj – trygg.
  Äldre utbildnings-/produktmaterial och historiska produktnamn skrivs inte om.
- Order har flera anläggningar med text-ID (18 siffror), uppskattad års-kWh och
  elområde; företag har dessutom nätområdeskod (3 bokstäver) och bindningstid i
  månader. Förslagets 0–120 månader är formulärgräns, inte ett produktvillkor.
  Individuell indexportfölj/Stabil/Direkt kräver tolv månaders kWh-profil per
  anläggning med summa lika års-kWh. Profilen avser januari–december i ett normalår.
  Önskat startdatum är ordergemensamt. Inga register- eller villkorskontroller.
- Additiv `state.orderWorkspace` med version, kunder, ordrar och statushistorik.
  Befintlig CRM/resultatdata migreras inte till orderstatus utan ett beslutat samband.
  Nya kunder här är orderkunder, inte automatiskt nya CRM-affärer. Sparfel/flikkonflikt
  återställer mutation. Normal-/inflyttningsdemoisolering och JSON-export bevaras.

Testinstruktion och återställning: [ORDER-PROPOSAL.md](ORDER-PROPOSAL.md).
