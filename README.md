# Partnerlabb – B2B-prototyp

Kraftringens interna resultatöversikt och arbetsytor för säljpartners,
fastighetsbolag och personalavtal. [Öppna portalen](https://kraftringen-partnerlabb.rosen123.chatgpt.site).
Privat Sites-inloggning gäller; källkoden är publik.

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

14 underhållna Node-/DOM-sviter plus JavaScript-syntaxkontroll. Browsermiljö och
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
