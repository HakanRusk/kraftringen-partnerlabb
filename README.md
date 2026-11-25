# Partnerlabb – B2B-prototyp

Kraftringens interna resultatöversikt och arbetsytor för säljpartners,
fastighetsbolag och personalavtal. [Öppna portalen](https://kraftringen-partnerlabb-hakan.wry-mite-1036.chatgpt.site).
Privat Sites-inloggning gäller; källkoden är publik.

Ägare och samordnare: **Håkan Rusk (HakanRusk)**. Huvudkälla:
[HakanRusk/kraftringen-partnerlabb](https://github.com/HakanRusk/kraftringen-partnerlabb).
Övertagandet använder en ny, separat privat Site. Endast projekt-ID i
`.openai/hosting.json` är publiceringsmål; Ludwigs tidigare Site ska inte ändras.
Verifierad publiceringsstatus och kvarstående kontroller finns i WORKLOG.md
och GITHUB-STATUS.md. Utvecklingsagent och schemaläggning aktiveras separat.

## Gemensamt periodurval

Ett enda periodfält visar vald månad, vecka, år eller datumperiod. Ett klick
väljer en period och stänger väljaren. Välj intervall låter användaren klicka
på början och slutet; musdragning är en genväg. Alla mellanliggande perioder
ingår, även över årsskiften. Escape avbryter ett påbörjat intervall. Samma
princip gäller kvartal i den äldre ekonomivyn. Begränsade exempelunderlag
behåller sina tillåtna perioder och delperiodmarkeringar. Tidigare sparade
rapportfilter med luckor läses som ett sammanhängande intervall.
Operativa datum och bokföringsfält använder fortfarande sina datumfält.

## Nytt orderförslag att prova

Välj ett fiktivt demokonto på startsidan. Fyra roller finns: Kraftringens
administratör och handläggare samt partnerns säljledare och säljare.
Säljaren ser sina egna ordrar/resultat och partnerns gemensamma kunder.
Säljledaren väljer en, flera eller alla säljare och kan rätta/omfördela ordrar.
Provision visas endast för säljledare och Kraftringen. **Användare & roller**
finns för administratören; där skapas demokonton och partners och roller/aktivitet ändras.
Kraftringenkonton har kvar **Partner · förhandsvisning** för handläggning.

**Ordrar & resultat** samlar en kurva för bindande avtal per dag/vecka/månad/år
med orderlistan och det befintliga vattenfallet. Försäljningsresultatet använder
bindandedatum; flödet använder ett separat urval efter registreringsdatum.
**Kvar här** och bortfallen filtrerar samma ordergrupp. Orderdialogen visar
sparad statushistorik, ansvarig säljare och loggade rättningar/omfördelningar.
Den registrerade orderns produkt, prisbild, status och historiska datum bevaras.

Detta är lokal rollsimulering utan lösenord, AD, e-postutskick eller
serverbehörighet. Kontoväljaren ersätter inte Sites privata åtkomst. Data delas
inte mellan datorer. Se [roller, datamodell och återgång](docs/PROTOTYPE-ROLES.md).
Äldre växeln **Återgå till tidigare vy** används inte i rollprototypen; en riktig
versionsåtergång görs via GitHub och Sites. Face2faces provisionsvy använder den bekräftade modellen med 1 500 kr per avtal
och 80 % garanterat förskott per godkännandemånad. Månadssammanfattningen har
fördjupning under **Så här har vi räknat** och ett separat räkneexempel.
90 nya fiktiva Face2face-ordrar (juli–september, sena bekräftelser till oktober)
läggs till en gång utan att ändra gamla ordrar. Välj dessa i provisionsvyn för
ett komplett daterat underlag. Äldre resultatrapporter finns kvar i Kraftringens partnerprofiler och blandas
inte med orderstatistiken.
Savera har fortsatt illustrativa villkor. Alla orderdata är exempel; inga betalningar görs.

## Produkter och prislistor

**Produkter** samlar produktguiden och säljpartnerns tidigare Avtalsfakta.
Välj Konsumenter/Företag och prislista. Varje produkt visar beskrivning,
passande kund, kundvärden, säljargument och länkar till befintliga filmer,
produktspecifikationer och villkor. **Skapa order** förifyller produkt,
kategori och prislista; kund kan skapas i samma flöde. Äldre Avtalsfakta-länkar
fungerar; fastighetspartnerns avgränsade avtalsfakta bevaras.

Alla belopp är tydligt märkta fiktiva exempel, inte webbplatsens skarpa priser.
Standard visas för alla; Face2face/Savera har varsin separat exempelprislista.
Urvalet är en demofunktion, inte serverbaserad behörighet. Individuella
företagsprodukter visar Prisunderlag saknas. Nya ordrar sparar list-ID,
version, datum och priskomponenter; registrerade ordrar ändras inte när
prislistvalet ändras. Äldre ordrar får inga påhittade prisreferenser.

Komplettera med godkända prislistor, giltighet, omfattning, moms och fulla
prisformler samt produktblad för framför allt Kraftringen Direkt och
företagens kvartspris. Källor och avgränsningar: docs/PRODUCT-CATALOG.md.

## Skapa partner och välj CRM

I Kraftringens interna demovy: **Partners → Ny partner**. Välj partnertyp;
för Säljpartner väljer du företag, konsumenter eller båda samt **Har eget CRM**
eller **Använd Partnerportalen som CRM**. Befintliga partners behåller eget CRM.
**Redigera partner** kan ändra arbetssätt utan att kundhistoriken försvinner.

Portal-CRM nås via **Öppna CRM** på partnerprofilen eller partnerns arbetsyta.
Kundkort har kontakt, ansvarig säljare, anteckningar och historik.
Organisationsnummer visas för B2B och personnummer för B2C. Anläggnings-ID
och nätområdeskod finns under Anläggningsuppgifter. Fälten kan kompletteras
senare och sparas även på befintliga kundkort. Ifyllda värden formatkontrolleras;
ingen kontroll mot kund- eller anläggningsregister görs. Pipeline:
Ny kontakt, Dialog pågår, Möte bokat, Offert skickad, Vunnen och Förlorad.
Öppna affärer behöver nästa aktivitet/datum; Förlorad behöver orsak.
**Elavtal i dag** samlar frivillig elleverantör, slutdatum, elområde, årsförbrukning
(hela kWh, exempelvis 250 000) och produktintresse från kundsegmentets bekräftade katalog. Översikten visar
idag/försenat, kommande sju dagar och avtal som löper ut inom sex månader.
Telefon och e-post är klickbara i kundlista och kundkort. Sökning i kunder,
pipeline och aktiviteter filtrerar direkt medan du skriver. Nästa aktivitet har
snabbval för idag, imorgon, om en vecka och om en månad.

Kundkortet börjar med en överblick över status, nästa aktivitet, avtalslut,
förbrukning och klickbara kontaktuppgifter. Formuläret finns under överblicken.
Datum visas med svensk kort månad och årtal för andra år. Äldre sparade decimaler
i förbrukningen bevaras exakt när andra uppgifter ändras.

Pipeline visar antal öppna affärer och deras angivna års-MWh för aktuellt filter,
samt årsförbrukning per steg och hur många affärer som har underlag. **Flytta till nästa steg** öppnar kortet med nästa steg förvalt;
du kan fylla i nästa aktivitet och spara eller avbryta. Avslutade steg har ingen
sådan knapp. Partnern använder vänstermenyn utan dubbla flikar; interna CRM-vyer
behåller flikarna.

Vunnen ger ett tydligt besked på kortet och efter sparning om separat
avtalsprocess och att inget har skickats. Datumkolumnen visar avslutsdatum för
Vunnen/Förlorad; okänt äldre datum visas som Datum saknas. Datum och historik
bevaras vid redigering. Vunnen skapar inget avtal eller resultat.
Använd fiktiva uppgifter; data delas ännu inte mellan användare.

## Övriga arbetsflöden

- Interna **Partners → Kunder & avtal / Insikter** visar fiktiva periodutfall,
  bestånd och villkorade scenarier. Periodlistor är nyast först; september är
  initialt månadsval. Oktober/kvartal 4/år 2026 har underlag till **7 oktober**.
  På mobil öppnas kontrollerna med **Visa filter**; period, datadatum och aktivt
  urval syns även när filtren är stängda. **Dölj filter** ändrar inga urval.
  Desktop visar kontrollerna direkt. Öppningen är tillfällig och återgår till
  stängd vid omladdning eller partnerbyte utan att rensa sparade rapportfilter.
- Säljpartner ser egna resultat, Avtalsfakta, Academy och stöd; portal-CRM
  tillkommer för partnern som valt det arbetssättet.
- Fastighetsbolag registrerar manuellt eller granskar Excel, bifogar befintliga
  fullmakter och förmedlar till Kraftringen. Hyresgästen har inga portalsteg.
  **Ert samarbete** visar inflyttning, egna resultat och ytterligare tjänsteförslag.
- Personalavtal har partnertyp/översikt; erbjudande och anmälningsflöde inväntar underlag.
- Fullständiga Elakademin, äldre demokurser och B2C-samtalsbibliotek finns kvar.

## Lokal data och app på hemskärmen

All appdata sparas lokalt i webbläsaren (localStorage/IndexedDB). Demoväljaren
är inget behörighetssystem. **?demo=inflyttning** har separat fiktiv lagring.
JSON-export innehåller inte fullmaktsfiler eller samtalsljud och är inte en
fullständig backup. Testa inte med verkliga kunduppgifter.

**Lägg till som app** i menyn ger instruktioner; på iPhone används Safari →
Dela → Lägg till på hemskärmen. Chrome/Edge kan erbjuda direkt installation.
Internet och Sites-inloggning behövs. App/webbläsare kan ha separat lokal data;
installation synkroniserar inget. Ingen service worker/offlinekopia finns.

Den nya webbadressen har egen webbläsarlagring. Exempeldata följer med koden;
personliga utkast, bilagor, samtalsljud och utbildningsframsteg från den gamla
adressen flyttas inte automatiskt. En gammal appikon öppnar fortfarande den
gamla portalen: lägg till appen från den nya adressen. Den inbyggda fullständiga
Elakademin och lokala materialfiler följer med. Filmer strömmas fortfarande
från sina befintliga externa medieadresser; ingen ny medietjänst har aktiverats.

## Kör och testa

Portalen har inget byggsteg eller runtimeberoende:

```sh
python -m http.server 8000 --directory dist
```

QA använder Node 24 och Python 3.12:

```sh
npm ci
npm test
```

16 underhållna Node-/DOM-sviter plus JavaScript-syntaxkontroll. Browsermiljö och
kommandon: [qa/README.md](qa/README.md). GitHub Actions kör Node/DOM och centrala
Chromiumflöden på PR, push till main och manuell start. **QA gate** kräver båda
jobben. Workflowen använder inga secrets och publicerar inte. Grenskydd måste
aktiveras separat för att tekniskt kräva kontrollen; status finns i GITHUB-STATUS.md.

## Läskarta

| Behov | Läs |
| --- | --- |
| Starta utvecklingspass | AGENTS.md, MISSION.md, senaste WORKLOG-posten |
| Produktbeslut eller ändra flöde | docs/DECISIONS.md, berörd QA |
| Välj nästa uppgift | BACKLOG.md |
| GitHub, integration, publicering | RUNBOOK.md, GITHUB-STATUS.md; samarbete i COLLABORATION.md |
| Förbereda pilot | PILOT-MISSION.md, PILOT-FACTS.md, PILOT-ACCEPTANCE.md |
| Öppna verksamhetsbeslut | PILOT-DECISIONS.md |
| Konkret förslag till gemensam lagring | docs/BACKEND-PILOT.md |
| Historiskt belägg | docs/archive/2026-10-14/INDEX.md och Git-historik |

Historik arkiveras; nya beslut skrivs en gång i beslutsdokumentet och länkas
från övrigt arbetsminne. Arkivets gamla instruktioner gäller inte framför aktuella regler.

Produktguiden har en kompakt jämförelsetabell med ikoner och genvägar till
produktkorten. I Kraftringens vy: **Produkter → Partnerns produktsortiment**
(även **Sortiment & prislistor** på partnerns flikrad) väljs kundkategorier,
produkter och prislistor per säljpartner. Valen styr produktguiden och nya
order/utkast; äldre registrerade ordrar och prisögonblicksbilder behålls.
Ett äldre utkast med borttaget val måste ändras uttryckligen innan det kan sparas.
Inställningarna är lokala demodata, inte serverbehörighet eller delad lagring.
Utan tilldelade produkter/prislistor spärras nya ordrar. Standard utan sparad
konfiguration följer partnerprofilens kundkategorier och tidigare prislisturval.

Orderflödet använder nu **Godkänd → Orderbekräftelse skickad → Bindande avtal**.
Ånger visas som en avgrening efter utskicket och är bara valbar före bindande
avtal. Provisionsförskott/avräkning utgår fortsatt från Godkänd respektive
Bindande avtal (tidigare Bekräftad); utskicket i sig ger ingen ytterligare
provision. Äldre orderdatum, priser och historik bevaras. Inga verkliga utskick.

Bindande avtal omfattar även väntan på avtalsstart; nästa steg är Aktivt avtal.
Äldre väntestatus visas sammanslagen utan att ändra sparad historik eller provision.

Kan inte bekräftas är slutligt bortfall före utskick. Behöver kompletteras är
ett separat vänteläge med sparad orsak, utan att räknas som slutligt bortfall.

**Så stämmer siffrorna** visar avstämningen för varje fas. Äldre ordrar med
okänd bortfallsfas finns kvar i totalen men redovisas utanför det avstämda flödet.

## Gemensam Kundrum-stil

Marinblå navigation, gul aktiv huvudmeny, rosa primärknappar och ljusblå
informationsytor följer Håkans bildreferens från 27 oktober. Samma tema används
i partner- och internvyer, formulär, produktguide och fristående utbildning.
Från 28 oktober följer gränssnittet den bifogade grafiska manualen: lokal
Poppins, exakta profilfärger och godkända originallogotyper med friyta även
i utbildningssidor och appikoner. Korall visar bortfall, orange väntande arbete.
Se [grafisk profil](docs/BRAND-PROFILE.md) för regler, källor och avgränsningar.
Befintliga filmer, dokument och demoillustrationer är bevarade; deras inbyggda
grafik är inte därmed fullständigt profilgranskad.
Stilen och diagramvisningen kan återställas via Git-revert och ny publicering
utan att kund-/orderdata, historik eller provisionsvillkor ändras.

## Textmejl i prototypen

Spara utkast, öppna ordern och välj **Skicka testmejl med TXT**. Fullmaktsvalet ger en separat testtext. Alla verkliga mejl går till hakan.rusk@kraftringen.se via Resend. Servernyckeln finns endast i Sites.

Nya testutskick sparar bilagornas exakta text i orderns avsnitt **Skickade dokument**. Öppna filnamnet för att läsa texten eller välj **Skicka om testmejlet** för att skicka samma bilagor. Återsändningen loggas med tid och meddelande-ID. Äldre utskick visar de sparade filnamnen.

Resends kvittens sätter **Skickad**, aldrig Registrerad. Filtrera på **Skickade ordrar (utskicksdatum)** för även senare registrerade utskick. Intern handläggare kan efter kontroll av kompletta handlingar uttryckligen simulera mottagning. Inga kundsigneringar eller mejlreturer är anslutna. Orderdata och utskickskvittenser sparas fortfarande i webbläsaren. Ett osäkert utskick återupptas med samma låsta underlag inom 22 timmar; därefter krävs manuell avstämning i Resend. Ingen automatisk omsändning.

`dist/` är fortsatt frontendkällan för QA. `runtime/` använder Sites Vinext-starter och `POST /api/order-mail`. `npm run build` kopierar frontend till runtime och genererar ignorerade `dist/server`, `dist/client` och `dist/.openai` för publicering. Kör Sites installation i runtime vid ny checkout. Huvudportalen måste behålla ägarprivat Sites-åtkomst: API:et förlitar sig på den plattformsgränsen, inte demokontot. Ingen publik kundlänk införs i detta steg.


## Kundportal · anonym tjänstedemo

Välj Alex Kund, Sam Förvaltning eller Robin Kundadmin i demoinloggningen. Exempelköpings kommun, dess förvaltningar, personer, avtal och sensorer är fiktiva. Kundportalen visar avtal och utrustning, dialogförfrågningar, sensorbeställningar och support. Kraftringens handläggare öppnar Kundärenden för status och återkoppling.

Kundanvändaren ser egna ärenden inom sin förvaltning. Förvaltningsansvarig ser förvaltningens ärenden. Kundadministratören ser alla förvaltningar och kan hantera kundroller. Delningen är en lokal demosimulering i samma webbläsare. Kommunens Dynamics-registrering, vidarebefordran och mötesbokning simuleras. Kalender, priser, teknisk kundportal och verklig integration behöver konfigureras inför pilot. Beställningar över 20 sensorer och möjliga dubletter flaggas med illustrativa regler.

### Excelbaserat fakturaunderlag för Face2face

Under Provision kan partnerns säljledare och Kraftringen välja månad och ladda ned fakturaunderlag som Excel. Vyn och exporten använder Godkända avtal, Bindande avtal som täcks av förskott och Bindande avtal utöver förskotten. Varje godkännandemånad avräknas separat; ett delvis täckt avtal räknas i tredje gruppen med endast återstående ersättning.

Exporten omfattar partnerns underlag oberoende av säljarfilter och innehåller formler, månadsöversikt, avräkning och order-ID utan kunduppgifter. Ofullständiga händelsedatum stoppar export; fristående räkneexempel kan inte exporteras som försäljningsunderlag. Ett uttryckligen valt exempelpaket märks som urval. Säljare och kundroller saknar funktionen. Rollsepareringen är fortfarande lokal prototyplogik. Andra partners saknar bekräftad provisionsmodell och får inte Face2faces fakturaunderlag.

Filen visar beräknad ersättning, inte faktisk betalning eller tidigare fakturering. Den skickar ingen faktura. Kraftringens export innehåller separat konfigurerbar merkostnad (39 kr); partnerexporten innehåller ingen intern kostnad.

### Inloggning och kontakt i prototypen
Startsidan visar demoinloggning och partnerinformation. Använd en adress från
**Testanvändare** och lösenordet `demo`, eller välj profilen direkt på testsidan.
**Logga ut** återgår till startsidan. Detta är inte säker autentisering.
Konto- och partnerförfrågningar sparas endast i aktuell webbläsare och kan läsas
av administratörens demokonto under **Användare & roller**. Ingen e-post skickas.
En verklig mottagare och leverans behöver anslutas inför pilot.
Kundstartsidan visar högst tre öppna ärenden; **Mina ärenden** innehåller hela listan.
Periodfilter ligger före berörda siffror; bindandedatum och registreringsdatum
är separata urval eftersom de svarar på olika frågor.

### Kraftringens arbetsyta (november 2026)
Kraftringens demokonton har fem arbetsområden: Översikt, Försäljningsanalys,
Partners, Ordrar och Provision & fakturaunderlag. Partner- och kundroller behåller
sina befintliga vyer. Flödesstaplar öppnar exakt motsvarande orderurval.
Analysen använder lokala ordrar, inte fristående äldre rapportfixturer. Inkomna
ordrar är skapade i perioden (registreringsdatum används om skapandedatum saknas),
exklusive utkast. Händelse-KPI använder första sparade händelsedatum; önskat
startdatum ersätter aldrig en saknad aktiv-händelse. Vattenfallet visar däremot
ordergruppens hittills uppnådda steg, även efter vald period.

Kostnader allokeras explicit per partner och inkomstmånad. CAC för delurval visas
bara när hela kostnadsgruppen täcks; okända kostnader blir inte noll. Administratören
kan välja **Ladda fiktivt analysunderlag** för illustrativa kostnader och
bortfallsorsaker för befintliga exempelordrar. Befintliga värden ersätts inte.
Kompletteringarna ändrar inte orderhistorik eller faktisk provisionsberäkning.
Nya ordrar utan kanal visas som Ej angiven. Fält/telefon för ursprungliga
exempelpaket är uttryckliga demoantaganden.

Partnerarbetsrummen samlar profil, ansvar, användare, modellbeskrivningar och
underlag. Modellversioner är daterade förslag, inte aktiverade nya beräkningsregler.
Face2faces befintliga motor och Excel-export återanvänds; saknade datum blockerar
summor. Granskningsstatus och anteckningar är lokal demo, inte fakturering eller
betalning. Äldre ekonomiskt underlag finns kvar via en separat ingång i ekonomivyn.

Excel-exportens flik **Indata** visar godkännandemånad på rader och
bindandemånad i kolumner, med antal godkända, bindande och ännu inte bindande
vid exportmånadens slut. Matrisen fylls automatiskt från samma orderurval som
fakturaunderlaget. Orderunderlag visar båda månaderna per order. Årsskiften stöds;
framtida bindandedatum räknas inte före exportens brytdatum.

Kraftringens gemensamma periodfilter stödjer flera valfria månader inom valt år.
Välj Period → Månad och kryssa i månaderna. Minst en månad behålls; ett årsbyte
flyttar valda månader till det nya året. Diagrammet Från order till aktivt avtal
visar perioden uttryckligen och dess orderurval följer samma månader. Trenddiagrammet
visar en punkt per vald period.

### Utbildningsprogram med personliga kunskapsprov

Utbildning öppnar nu ett program med tio moment och tre tillämpningsfrågor per moment. Alla svar ska vara rätt i samma försök; förkunskaper måste vara godkända. Interaktiva övningar visar nätroller, balans, områdespriser, förbrukningsvägt pris, säkringsgrad och fördelning av säkringsvärde. Produktinnehållet bygger på beställarens bilder och länkade källor; exakta affärsvillkor och Stabils avräkningsenhet måste produktgranskas.

Resultat sparas per demokonto och innehållsversion. Äldre filmer, Elakademin och klarmarkeringar finns via Filmer & tidigare material, men ger inga automatiska provgodkännanden. Förvald orderregel för partnersäljare och säljledare kräver de fem grundmomenten; de fyra portföljprodukterna kräver även relevant produktmoment. Intern handläggning är undantagen. Spärren kontrolleras när utkast sparas, order registreras via orderfunktionen och dokument skickas; befintliga ordrar bevaras. Administratören kan ändra kraven per produkt under Utbildning → Kraftringen · utbildningsuppföljning och krav. Reglerna gäller alla partners som har produkten.

Resultat, krav och ändringslogg är lokala prototypdata med återställning vid sparfel. Detta är inte en säker certifieringslösning: identitet, provrättning, resultat och orderkontroll måste flyttas till server vid skarp drift.

### Berättade utbildningsfilmer

Varje moment inleds med en automatiskt spelad bildfilm med fem avsnitt, undertexter,
svensk webbläsartalsyntes när tillgänglig, tempo, paus och repetition. Utan svensk
röst eller vid ljudfel fortsätter tidsatta undertexter med tydligt besked. Det är
webbfilmer, inte inspelade MP4-filer. Filmvisning ger aldrig provgodkännande.
Flikbyte pausar, sid-/kontobyte avslutar ljudet. Manus och kundfrågor finns i
expanderbar fördjupning; grundsammanfattning och interaktiva övningar bevaras.
Tio manus med sammanlagt femtio avsnitt fördjupar kunddialog, prisreferenser,
profil-/volymrisk och produktjämförelser. Diagrammens räknevärden är illustrativa.
Provversionen och befintliga godkännanden ändras inte av denna innehållsutökning.
Rapporterna använder ett enda periodfält. Öppna det för att välja månad, vecka,
år eller datum (äldre ekonomirapport har även kvartal). På mobilen öppnas en
bred dialog nederst på skärmen. En period markeras med ett tryck och bekräftas
med Visa. Sammanhängande period aktiverar start- och slutmarkering; alla perioder
däremellan ingår. Avbryt/Escape lämnar både periodtyp och rapporturval oförändrade.
Veckor visar även datum. Ingen dragning, periodbrickor eller fristående tillägg.
Samma urval styr resultat på bindandedatum och orderflöde på registreringsdatum.
Äldre rapporter begränsas av tillgängligt exempelunderlag. Aktiva kundbestånd
avser senaste brytdatum; sammanhängande churn använder periodens ingående bas.
Provision visas per månad utan dubbelräkning av kumulativa saldon. Dag-/veckourval
i fakturaunderlag visar uttryckligen hela berörda månadsunderlag. Detaljgranskning
och Excel öppnas från respektive månadsrad och gäller den månaden.
Enskilda händelsedatum, exempelvis leveransstart, är fortsatt ett datum.

Provisionsfliken har en enda tabell med godkända avtal, nya bindande avtal,
förskott, tillägg och total provision per vald månad. Visa beräkning öppnar
månadens avräkning i en dialog. Fakturaunderlag (Excel) exporterar just den
radens månad, oavsett vilken beräkning som senast öppnades. Saknat underlag
eller fristående räkneexempel spärrar export med förklaring vid raden.
Ordrar & resultat har ett gemensamt periodval ovanför resultat och orderflöde.

### Utbildning och säljstöd

Gemensam navigation skiljer Kurser & prov från Samtalsexempel, Säljmanus,
Förstå elfakturan, Viktiga länkar och Filmer & handböcker. De 18 befintliga
Elakademin-filmerna, PowerPoint och PDF:er har direkta ingångar. Äldre
demokurser, bokmärken och klarmarkeringar finns kvar via tidigare översikt.
B2C-ljudbiblioteket fungerar även på academy-library; dess partner-/demoavgränsning
och lokala IndexedDB bevaras. Skrivna bra/dåliga dialogexempel är fiktiva.
Nya kursillustrationer är animerade SVG-diagram, inte nyproducerade MP4-filmer.
Paus och reducerad rörelse respekteras. Godkännanden och orderkrav ändras inte.

### Fastighetsbestånd
Välj testkontot Lo Förvaltare och öppna Fastighetsbestånd. På lägenheten kan
förvaltaren föranmäla inflyttning, utflyttning och visningsel. Inflyttning med
bekräftad testfullmakt skapar två lokala avtalsreferenser och ett oföränderligt
bekräftelseunderlag. Ett testmejl adresseras till labbets fasta testmottagare.
Leverantörens kvittens visas i historiken. Ingen nätägare eller Gazelle ansluts.
Kraftringens administratör styr funktionen per partner under Samarbete & produkter.

Partnerkonton delar fem menyingångar. Tjänster visar partnerns tilldelade
säljinriktningar och aktiverade fastighetsfunktion. Under Fastigheter finns
Översikt, Fastighetsbestånd och Ärenden. Inflyttning från startsidan och
lägenheten använder samma registrering. Excelimportens serviceunderlag har
kvar sin tidigare handläggning. Under Partners → Tjänster kan Kraftringen
förhandsvisa den valda partnerns arbetsyta.

### Fastighetspartnerns huvudflöde
Översikten visar Mina fastigheter för fastighetspartner med aktiverad funktion.
Sök bostad eller öppna en fastighet. Anmäl inflyttning förifyller bostaden och
använder det befintliga flödet för fullmaktsbilagor. Excel matchar befintliga
bostäder och skapar nya fastigheter/lägenheter tillsammans med underlagen efter
granskningssteget. Manuellt underlag utan lägenhetsnummer kan fortfarande sparas,
men kopplas inte till beståndet. Äldre ärenden och demoavtal bevaras.
Visningsel registrerar en lokal beställning med fastighetsägaren som betalare för
både nät och handel; inga verkliga avtal eller nätåtgärder utförs. CRM-läsmodellen
håller nät/handel och deras slutdatum separata. Den verkliga integrationen är
inte ansluten. Se P-18 i docs/DECISIONS.md.

### Sammanhängande perioder och fastighetsprovision
Perioddialogen visar tydligt En/Flera för vald typ. Intervall omfattar alla
mellanliggande dagar, ISO-veckor, månader eller år, även över årsskiften.
Provisionsvyer erbjuder månad och år; år visas som månadsrader.
Fastighetspartnerns Kunder & kickback visar beståndsvattenfall, aktiveringar,
fast ersättning × aktiverade elhandelsavtal, beräkningsdetaljer och Excel per månad.
Ingen ersättning betalas i förskott. Lokala inflyttningar/visningsel skapar inte
aktiveringar eller pengar. Demots aktiveringar är separata månadsaggregat;
enskilda avtals-ID:n saknas. Saknat underlag visas som saknat, inte noll.
Belopp per aktivering har inte angetts av Håkan: det anges som ett lokalt
beräkningsvärde per partner och session, med samma belopp för valda månader.
Det är inte verifierade affärsvillkor. Historiska manuella betalningsposter
bevaras separat och får inte summeras med den nya beräkningen. Excel är ett
preliminärt exempelunderlag; export varken fakturerar eller bokför en betalning.

### Direkta arbetsvyer och Excel · 20 november 2026
Den gemensamma vänstermenyn leder till arbetsvyer med innehåll. Tjänster öppnar
Ordrar & resultat för säljpartners, bestånd/inflyttningar för fastighetspartner
eller personalerbjudanden. Kunder, produkter/prislistor och andra aktiverade
funktioner nås via genvägar på sidan. Resultat & ersättning öppnar provision
för säljledare, orderresultat för säljare och Kunder & kickback för fastigheter.
Kunskap & support öppnar utbildningen för säljpartners, med material och hjälp
på samma navigationsrad. Äldre hubblänkar är kompatibla direktlänkar.
Provisionsintervall visas alltid som separata månadsrader. Varje rad har sin
Excelknapp; saknade/ogiltiga underlag blockerar export med förklaring.
Excel sparas via webbläsarens Spara-dialog där tillgänglig. Annars startas en
vanlig nedladdning med en kvarvarande, klickbar reservlänk. Sparad kvitteras
bara efter verifierad filskrivning. Webbläsarens vanliga nedladdning kan inte
kvitteras som sparad av webbappen. Inbäddad vy erbjuder öppning i egen flik.
