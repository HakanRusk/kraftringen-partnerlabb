# Partnerflöde – förslag 26 oktober 2026

Öppna den ordinarie privata portalen, välj **Partner · förhandsvisning** och
Face2face/Savera. Ordrar & resultat visas direkt utan särskild aktivering.
Från intern partnerprofil fungerar **Visa ordrar & status** också.
För att spara en demoidentitet: välj **Prova nya partnerflödet**.
Välj Face2face eller Savera som demoidentitet. Appen öppnar automatiskt
**Partner · förhandsvisning** med vald partnerdomän. Valet kan ändras med
**Byt demoinloggning**. Inga verkliga partners eller åtkomster skapas.

## Prova de nio önskemålen

1. Välj Face2face i demoinloggningen och kontrollera partnerfältet.
2. Startsidan samlar orderflöde, resultat och lista. Välj år 2026 för att se
   alla exempel, eller juli–oktober för olika månadsgrupper.
3. Växla År/Månad/Vecka, välj period. Vecka är ISO-vecka och veckoår.
4. Klicka ett flödessteg för alla som nått det, eller **just nu** för aktuell
   status. Bortfall är separata filter. Stegen är kumulativa och ska inte
   summeras. Klicka på en order för statusdatum; äldre saknade datum markeras.
   Resultatutveckling och äldre rapporter finns i en utfällbar sektion.
5. Öppna Face2faces Provision: välj månad och kontrollera godkända, bindande avtal
   och berättigad provision. Öppna Så här har vi räknat för gruppavräkning.
   Räkneexemplet januari–april visar 120 000 / 60 000 / 15 000 / 7 500 kr.
   Välj **90 nya Face2face-exempel** för månadsutfallen juli 36 000, augusti
   36 000, september 40 500 och oktober 4 500 kr. Dessa ordrar läggs till en
   gång utan att ändra tidigare sparade ordrar. Savera har illustrativa villkor.
6. **Ny kund** och **Ny order** finns på startsidan och de nya arbetsvyerna.
7. Skapa en fiktiv kund; öppna Kunder för att komplettera samtliga kontaktfält.
8. Skapa order och välj kundtyp: privatperson, företag eller enskild firma.
   Prova båda produktkategorierna och skapa kund direkt från orderdialogen.
   Lägg till anläggningar och välj Rörlig eller Antal månader som avtalstid.
   Företag visar nätområdeskod och de tre portföljprodukterna tolv månadsfält.
   Kontrollera total årsvolym och avtalstid i listan.
   Registrerade ordrar öppnas som detaljer; simulera statussteg med bekräftelse.
9. Utbildning, Avtalsfakta och Hjälp & support nås från kort på startsidan
   och samma områdesväljare överst på varje sida. Växla tillbaka där.
   Befintliga material/filmer och övriga arbetsytor bevaras.

## Ångra eller jämför

**Återgå till tidigare vy** stänger av förslaget i denna webbläsare. Befintligt
CRM, orderförslagets testkunder/-ordrar, utbildningsframsteg och historik raderas
inte. Välj **Prova nya partnerflödet** för att öppna förslaget igen.

Detta är en vyväxel, inte en återställning av redan ändrade testorderstatusar.
För full kodåtergång kan samordnaren återställa denna PR via en ny revert-PR
utan force-push, testa main och publicera igen. Den tidigare oförändrade
frontendversionen finns som Sites version 1, källa dea10e9dc0cab224ca6507b5b2b786efe188cc7c.
GitHub-bas före förslaget: e10aa76b1d7ca0fa9583c497b1a7ceecf810009f.
Sites-ID: appgprj_6adb2c876a0c8191b1fa3c755a73f61a. Ingen återgång riktas mot Ludwigs Site.

## Gränser

Prototyp med lokal lagring. Riktig partnerinloggning och serverbehörighet,
verkliga avtal, fakturor och betalningar ingår inte. Face2faces beräkningsmodell
är bekräftad av Håkan men underlaget är fortfarande fiktiva exempel. Nya ordrar är ett
separat underlag; äldre resultat/CRM läggs inte automatiskt ihop med dem.
Exporten tar med sparade orderkunder/ordrar per demovy men är ingen komplett
backup av bilagor/ljud. Gamla sparade uppgifter bevaras.

Produktdefinitioner/antaganden finns samlat i DECISIONS.md P-10.

Bindande avtal omfattar nu väntan på avtalsstart. Nästa steg är Aktivt avtal,
med Uppsagd före start respektive Uppsagd efter start som avgreningar.
Äldre awaiting_start visas som Bindande avtal men lagrade rader och datum
bevaras. Historiken märker väntesteget som tidigare status. Provisionen
använder fortsatt ursprungligt confirmedAt; inga nya datum antas.
Återgång via revert av sammanslagningsändringen återställer föregående vy.

Kompakt ordervy publicerad som version 5 via PR #73. Föregående version är 4.
För återgång av just denna ändring används revert av PR #73 och ny publicering.
Sparade exempelordrar och historik raderas inte av kodåtergång.


## Orderbekräftelse och bindande avtal · 27 oktober 2026

Godkänd → Orderbekräftelse skickad → Bindande avtal. Ångrad är en avgrening
från utskickssteget, före bindande avtal. Därefter används Bortfall före/efter
start. Utskick är en uttrycklig demosimulering, inget dokument skickas.

Provisionen använder fortfarande godkännandedatum och datum då avtalet blev
bindande, även över månadsgränser. Utskicksdatum skapar ingen extra provision.
Tidigare Bekräftad visas som Bindande avtal med samma datum och belopp.
Äldre ångerhistorik bevaras; saknade utskicksdatum rekonstrueras inte.

Vid kodåtergång efter denna ändring måste nya confirmation_sent-ordrar bevaras
och fortsatt kunna visas. Publicera därför en verifierad återgång med stöd för
lagrade statusar; återställ inte blint version 7 som saknar det nya statusvärdet.
Byt inte nya utskicksstatusar till bindande avtal och radera inte deras datum.

## Bortfall mellan stegen · 27 oktober 2026

Ej godkänd 1–2, Kan inte bekräftas 2–3, Ångrad 3–4 och Uppsagd efter start
visas efter 5. Uppsagd före start spänner över 1–4 och kan väljas från alla
pågående statusar före aktivering. Behöver kompletteras är ett eget vänteläge.
Orsaker sparas i historiken; återgång till Godkänd behåller godkännandedatum.
Äldre data ändras inte. Vid återgång måste cannot_confirm, needs_completion och
cancellationFrom fortfarande läsas så att nya ordrar inte försvinner eller räknas
som bindande av misstag. Återställ i första hand layouten, inte datastödet.
