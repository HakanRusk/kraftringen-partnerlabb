# Partnerflöde – förslag 26 oktober 2026

Öppna den ordinarie privata portalen, välj **Partner · förhandsvisning** och
Face2face/Savera. Orderstatusrutorna visas direkt utan särskild aktivering.
Från intern partnerprofil fungerar **Visa ordrar & status** också.
För att spara en demoidentitet: välj **Prova nya partnerflödet**.
Välj Face2face eller Savera som demoidentitet. Appen öppnar automatiskt
**Partner · förhandsvisning** med vald partnerdomän. Valet kan ändras med
**Byt demoinloggning**. Inga verkliga partners eller åtkomster skapas.

## Prova de nio önskemålen

1. Välj Face2face i demoinloggningen och kontrollera partnerfältet.
2. Startsidan visar samtliga sex statusar och en total. Exempelordrar finns i
   september/oktober 2026; välj dessa perioder om dagens månad är en annan.
3. Växla År/Månad/Vecka, välj period. Vecka är ISO-vecka och veckoår.
4. Klicka en statusruta: listan får samma period och vald status. Byt status
   i listan eller sök kund/produkt/order-ID.
5. Öppna provisionsstatistik. Välj månad och jämför Face2face/Savera. Formeln
   och dess påhittade villkor visas. Nya partners har inget regelunderlag.
6. **Ny kund** och **Ny order** finns på startsidan och de nya arbetsvyerna.
7. Skapa en fiktiv kund; öppna Kunder för att komplettera samtliga kontaktfält.
8. Skapa order, lägg till anläggningar, spara utkast eller registrera. Savera
   visar företagsfält och tolv månadsfält för de tre angivna portföljprodukterna.
   Registrerade ordrar öppnas som detaljer; simulera statussteg med bekräftelse.
9. Utbildning, Avtalsfakta och Hjälp & support nås från kort på startsidan.
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
verkliga provisionsregler och avtalshantering ingår inte. Nya ordrar är ett
separat underlag; äldre resultat/CRM läggs inte automatiskt ihop med dem.
Exporten tar med sparade orderkunder/ordrar per demovy men är ingen komplett
backup av bilagor/ljud. Gamla sparade uppgifter bevaras.

Produktdefinitioner/antaganden finns samlat i DECISIONS.md P-10.
