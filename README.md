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

## Nytt orderförslag att prova

Välj **Partner · förhandsvisning** och partner (t.ex. Face2face eller Savera),
så öppnas orderöversikten direkt. Från intern partnerprofil: **Visa ordrar & status**.
**Prova nya partnerflödet** väljer också demoidentitet. **Ordrar & resultat** samlar översikt, orderlista och resultatutveckling med
år/månad/vecka. Ett kompakt flöde visar hur många som nått varje steg;
**just nu** filtrerar på aktuell status. Bortfall visas mellan stegen, med uppsägningar före start i ett gemensamt band. Klicka på en
order för daterad statushistorik. Saknade äldre datum markeras utan att fyllas i. Tolv statusar följer ordern fram
till aktivt avtal och eventuellt bortfall. Samma områdesväljare finns även på
Avtalsfakta, Utbildning och Hjälp & support. Kundtyp styr produktkatalogen;
ordertabellen visar total årsvolym och rörlig eller tidsbestämd avtalstid. **Återgå till tidigare vy**
bevarar alla testdata. [Testväg, begränsningar och full återgång](docs/ORDER-PROPOSAL.md).
Detta är lokal demoinloggning, inte nya partnerbehörigheter. Face2faces provisionsvy använder den bekräftade modellen med 1 500 kr per avtal
och 80 % garanterat förskott per godkännandemånad. Månadssammanfattningen har
fördjupning under **Så här har vi räknat** och ett separat räkneexempel.
90 nya fiktiva Face2face-ordrar (juli–september, sena bekräftelser till oktober)
läggs till en gång utan att ändra gamla ordrar. Välj dessa i provisionsvyn för
ett komplett daterat underlag. Äldre resultatrapporter finns under den
utfällbara resultatutvecklingen och blandas inte med orderstatistiken.
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

15 underhållna Node-/DOM-sviter plus JavaScript-syntaxkontroll. Browsermiljö och
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
