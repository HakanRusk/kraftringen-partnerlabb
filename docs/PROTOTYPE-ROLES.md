# Lokal rollprototyp

Aktuellt produktbeslut: P-13 i DECISIONS.md. Ingen AD/CRM-anslutning behövs för
denna version. Den publicerade privata Site-åtkomsten ändras inte.

## Prova

1. Välj ett demokonto på portalens startsida. Face2face och Savera har säljledare
   och tre fiktiva säljare vardera. Kraftringen har admin och handläggare.
2. **Byt demokonto** avslutar den lokala sessionen och visar kontoväljaren.
3. Som säljare: välj oktober 2026 i resultatperioden för exempelutfall. Välj
   dag, vecka, månad eller år. Orderflödets registreringsperiod är ett eget urval.
4. Som säljledare: kryssa en eller flera säljare; **Alla säljare** tar bort urvalet.
   Provisionen använder hela partnerns orderunderlag, oberoende av säljarfilter.
5. Öppna en order för **Rätta order** eller **Omfördela order**. Båda kräver orsak.
   Produkt och pris på en registrerad order ändras inte. Status hanteras av
   Kraftringens handläggare/admin genom den befintliga demosimuleringen.
6. Som admin: **Användare & roller** → **Ny användare** eller **Ny partner**.
   Använd endast fiktiva namn och .example-adresser. Redigera roll/aktivflagga
   i samma vy. Inga mejl eller inbjudningar skickas.

## Roller

| Roll | Order-/resultaturval | Provision | Rätta/flytta order | Användare/partners |
| --- | --- | --- | --- | --- |
| Kraftringen admin | Alla partners via intern vy/förhandsvisning | Ja | Ja | Skapa/ändra/aktivera |
| Kraftringen handläggare | Alla partners via intern vy/förhandsvisning | Ja | Ja | Nej |
| Partnerns säljledare | Egen partner, en/flera/alla säljare | Ja | Inom egen partner | Nej |
| Partnerns säljare | Bara egna ordrar; gemensamma partnerkunder | Nej | Egna utkast | Nej |

Gamla rapporter har separat exempelunderlag och finns kvar för Kraftringen.
Säljarvyn använder ordermodellens faktiska ansvarig och daterade bindandehändelser.
Kundlistans orderantal är bara säljarens egna ordrar när en säljare är inloggad.
Manager får använda befintligt partner-CRM när partnern använder portal-CRM;
dess historiska affärsposter är ett separat underlag från nya ordermodellen.

## Datamodell och bevarande

`state.prototypeAccess = {version:1, users:[], audit:[]}` i samma befintliga
lokala portalstate. Användare: `id`, `name`, `email`, `role`, `partner`, `active`.
Interna användares partner är tom. Inloggat användar-ID ligger i sessionStorage
under `partnerlabb.demo-user.v1`; det finns inga lösenord, tokens eller externa
identiteter. Befintlig v2-läsning bevarar äldre tilläggsfält.

Ordern kan ha `sellerId` och `createdBy`. Ett nytt säljar-/säljledarutkast får
inloggad person som ansvarig. Order skapad av Kraftringen börjar utan säljare
och tilldelas genom orderdialogen. Äldre riktiga testregistreringar tilldelas
inte automatiskt. Endast kända, tydligt fiktiva `order-demo-*` och `flow2026`
exempel får en stabil, beräknad exempelsäljare utan att gamla ordrar skrivs om.

Omfördelning loggas i `events` med `actor`, `at`, orsak och `assignment.from/to`.
Rättning loggas med `changes` (före/efter). Befintliga statusdatum och historik
bevaras. Ingen ny prisreferens hittas på för äldre registrerade ordrar.
Ett avtal räknas i resultatet på tidigaste giltiga `confirmedAt` eller sparade
`statusHistory`-händelse `confirmed`. Saknade datum räknas inte in i en period.
Resultatet följer nuvarande ansvarig även efter omfördelning; historiken gör
förflyttningen spårbar. Detta kan behöva ett separat ursprungligt säljarkrediteringsfält
vid framtida CRM-integration, om affären ska tillgodoräknas ursprunglig säljare.

Sparfel återställer mutationer. Befintligt flikkonfliktskydd gäller fortfarande.
Ändring av användarregistret i en annan flik avslutar den aktuella demovyn och
kräver omladdning. Inaktiva konton får inte väljas eller få nya tilldelningar.
Alla tillhörande ordrar/historik finns kvar för ansvarig säljledare/handläggare.

## Gräns mot skarp drift

Detta är avsiktligt en kontoväljare och rollsimulering, inte säker autentisering.
Alla data finns fortfarande i webbläsaren och kan inspekteras/ändras där.
Endast fiktiva data får användas. Datorer delar inte konton eller ändringar.
Kunddemot `?demo=inflyttning` behåller sin separata lagring och sitt tidigare flöde.
Inga Microsoft-knappar som låtsas vara en verklig anslutning läggs till.

Före skarpa uppgifter krävs verklig identitet (t.ex. Microsoft Entra ID eller
e-postbaserad identitet), serverkontrollerad åtkomst per partner/ägare/roll,
delad datalagring, verkliga revisionsloggar och separat drift-/säkerhetsbeslut.
Val av sådana tjänster eller ändring av Sites åtkomst ingår inte här.

## Återgång

Baslinje före rollarbetet: GitHub-main
`231c08c4350c21c9c0cb51baee38cdce3c0e8b9d`, publicerad Site-version 13.
Vid integrerad ändring: skapa en revert-PR för rolländringen, verifiera och
publicera denna main-revision till samma Håkan-Site. En akut hostingåtergång
kan använda den verifierade tidigare versionen, men måste avstämmas med GitHub
innan nästa publicering. Radera inte portalens lokala state för att backa UI.
De äldre läsarna ignorerar nya roll-/ägarfält och orderhistoriken finns kvar.
Varken gamla Site-ID:n, rättigheter, scheman eller agentuppgifter ändras.
