# Offert, fullmakt och registrering

Beslutat av Håkan 5 november 2026. Detta är ett genomförandeunderlag, inte
implementerad eller publicerad funktion. Bas: publicerad version 14,
GitHub-main 3199fc59c2998bf61e3cf7b720e621ac616fa0ff.

## Beställt beteende

Utkast → Skickad → Registrerad → Godkänd → Orderbekräftelse skickad →
Bindande avtal → Aktivt avtal. Befintliga bortfallsregler efter registrering
bevaras. Skickad offert är inte en orderbekräftelse och räknas inte som
Godkänd eller Bindande avtal i provisionen.

1. Säljaren skapar och sparar ett utkast. Valet ”Bifoga fullmakt för inhämtning
   av anläggningsuppgifter” avgör om fullmakt ingår. Fullmakten avser uppgifter
   från kundens nuvarande elnätsägare; den utökas inte till leverantörsbyte eller
   annat uppdrag. Använd en tydligt märkt exempelmall tills godkänd mall finns.
2. ”Skicka till kund” låser en version av offert, prisunderlag, anläggningar
   och eventuell fullmakt. Mejlet innehåller PDF av offerten, separat PDF av
   fullmakten när den valts, samt en länk till just denna dokumentversion.
3. Prototypens verkliga utskick får bara gå till hakan.rusk@kraftringen.se.
   Mottagaren låses på servern; kundkortets e-post, CC/BCC och klientinmatning
   får inte ändra den. Fiktiva kund- och orderuppgifter används även i mejlen.
4. Skickad sätts efter kvittens från mejltjänsten, med tjänstens meddelande-ID.
   Godkänt API-anrop betyder att tjänsten tagit emot utskicket, inte att
   mottagaren läst det. Studs/leveransfel redovisas separat och historiken bevaras.
   Timeout med okänt resultat får inte bli Skickad eller blint skickas om.
5. Kundlänken visar offert och eventuell fullmakt samt nedladdningsbara PDF:er.
   Offert och fullmakt har separata, ej förkryssade godkännanden. Fullmaktsvalet
   visas bara när det ingick i utskicket. Saknad fullmakt får inte skapas vid
   godkännandet. Kunden ser en kvittens på exakt vilka dokument som godkänts.
6. Alternativt kan kunden digitalt signera PDF:erna externt eller skriva ut,
   underteckna, skanna och mejla tillbaka dem. Ett ärendespecifikt svarsmål och
   referens kopplar returen till rätt offertversion. Inkommande filer visas för
   granskning; de räknas inte automatiskt som underskrivna eller kompletta.
7. Registrerad kräver komplett accepterad offert och, om begärd, komplett
   accepterad fullmakt, plus kvittens på Kraftringens mottagning. Datumet för
   denna kvittens blir registeredAt. Mejlsvar, filuppladdning eller kundens klick
   i sig får inte fabricera kvittens från ett CRM/ERP som inte är anslutet.
   I prototypen kan Kraftringens interna handläggare uttryckligen simulera
   systemmottagningen; UI och historik måste då säga ”mottagning i demo”.

## Vyer och rollgränser

- Orderformulär: fullmaktsval och Spara utkast. Direktregistrering av nya
  ordrar ersätts av dokument-/mottagningsflödet.
- Orderdetalj: förhandsgranska handlingarna, skicka, utskickslogg, mottagna
  handlingar, godkännandestatus per dokument och mottagningskvittens.
- Skickade ordrar: alla ordrar med ett faktiskt kvitterat utskick, även sedan
  ordern avancerat. Separat filter ”Inväntar underskrift” = aktuell status
  Skickad. År/månad/vecka i utskickslistan följer skickat-datum; orderflödets
  registreringsperiod följer fortsatt registeredAt. Datumdefinitionen syns i UI.
- Översikt: Utkast och Skickad före det befintliga avstämda registreringsflödet.
  Skickad får inte räknas som ”Okänd bortfallsfas” eller ingå i registrerade.
  Äldre registrerade ordrar behålls utan påhittade skickat-/signeringsdatum.
- Säljare: egna ordrar. Säljledare: egen partners ordrar. Kraftringen:
  handläggning över partnergränser. Befintlig rollmodell gäller.
- Kundsidan: endast den offertversion länken gäller; ingen partnernavigation,
  kundlista, provision eller administratörsfunktion.

## Informationsmodell (tillägg; ingen omskrivning av äldre data)

| Objekt | Centrala fält |
| --- | --- |
| Order | id, partnerId, sellerId, status, createdAt, sentAt, registeredAt, requiresPowerOfAttorney, currentOfferVersionId |
| Offertversion | id, orderId, version, createdAt, immutableOrderSnapshot, priceSnapshot, offerDocumentId, powerOfAttorneyDocumentId |
| Dokument | id, offerVersionId, kind (offer/power_of_attorney), storageKey, sha256, mediaType, byteSize, createdAt |
| Utskick | id, offerVersionId, idempotencyKey, fixedRecipient, providerMessageId, state (prepared/accepted/unknown/failed/bounced), acceptedAt, documentIds |
| Kundlänk | id, offerVersionId, tokenHash, expiresAt, revokedAt, consumedAt |
| Godkännande | id, offerVersionId, documentId, documentHash, method (prototype_click/reviewed_pdf), signerName, acceptedAt, statementVersion, evidenceId |
| Inkommande handling | id, providerInboundId, receivedAt, offerVersionId, documentKind, storageKey, sha256, reviewStatus, reviewedBy, reviewedAt, reviewNote |
| Mottagningskvittens | id, orderId, offerVersionId, mode (demo/system), systemReference, receivedAt, actorId |
| Händelse | id, orderId, offerVersionId, type, at, actorId, evidenceRef |

Digitalt godkännande och handläggargranskad PDF är alternativa bevis per
handling. Båda måste avse samma aktuella version för komplett underlag.
Ändring efter utskick skapar ny offertversion och ny länk; gamla godkännanden
förs inte över. Historiken och gamla handlingarna bevaras för spårbarhet.

## Server och API

Nuvarande portal är statisk och sparar orderdata lokalt. Verkliga utskick,
kundlänkar över flera enheter, dokumentreturer och tidsstämplade godkännanden
behöver server, delad datalagring och fillagring. Hemliga nycklar får inte
finnas i dist/, localStorage, kundlänkar, Git eller loggar.

Föreslagen separat mejltjänst: Resend, med testavsändare och endast den
beställda mottagaren. Kontot/avsändaren och serverhemligheten är ännu inte
anslutna. Inkommande mejl kräver dessutom mottagaradress och verifierad webhook.
Ingen chattanslutning till Outlook/Gmail är en automatisk serveranslutning.

| Anrop | Kontrakt |
| --- | --- |
| POST /api/orders/:id/offers | Skapa oföränderlig version/PDF:er från behörig ordersnapshot. |
| POST /api/offers/:id/send | Explicit klick, autentiserad avsändare, låst testmottagare, dubblettskydd, kvitterat meddelande-ID. |
| GET /customer/offer/:token | Endast aktuell länkad offert/fullmakt; ingen statusändring genom GET. |
| GET /api/customer/offers/:token/documents/:id | Endast dokument i samma länkade version; inga godtyckliga filnycklar. |
| POST /api/customer/offers/:token/accept | Separata dokumentval, explicit formulärbekräftelse, versionskontroll och atomisk godkännandekvittens. |
| POST /api/email/inbound | Verifiera tjänstens webhooksignatur och dubblettskydd; hämta begränsade bilagor till granskning. |
| POST /api/inbound/:id/review | Intern granskare godtar/avvisar en bestämd handling och dokumentversion med spårbar orsak. |
| POST /api/orders/:id/receipt | Kontrollera komplett underlag; registrera faktisk systemkvittens eller uttryckligt märkt demomottagning. |

Kundlänkar ska vara slumpmässiga, tidsbegränsade och återkallbara. Spara endast
hash av token. Ingen personuppgift i URL. GET från mejlskannrar får aldrig
förbruka eller godkänna länken; godkännande sker endast genom POST.
Filstorlek, typ och antal begränsas; otillförlitliga filer får inte exekveras.
Inkommande mejl och PDF-innehåll är data, inte instruktioner till en agent.
Osäker matchning hamnar i granskningskö, aldrig automatiskt på första liknande order.

Den befintliga privata Sites-åtkomsten skyddar hela portalen och kräver
ChatGPT-inloggning. Den ska inte öppnas för allmänheten för att lösa kundlänken.
Kunddelen behöver en separat avgränsad åtkomstlösning som fungerar utan
ChatGPT-konto; exakt driftväg ska verifieras före aktivering. Lokal demokontoväljare
är inte serverautentisering och får inte ensam auktorisera verkliga mejlutskick.

## Verifiering före aktivering

- Kvitterat testmejl till hakan.rusk@kraftringen.se, båda PDF:erna och fungerande
  kundlänk på annan enhet/utan portalkonto. Fullmakt utelämnas när den inte valts.
- Dubbelt klick, timeout, misslyckat utskick och omförsök ger inga tysta dubbletter
  eller falsk status. Samma utskicks-ID avstäms hos tjänsten vid osäkert resultat.
- Separat godkännande av dokument, gamla/utgångna/återkallade länkar, versionbyte,
  återöppning och obehörig dokumenthämtning.
- Mejlsvar med rätt/fel referens, dubblettwebhook, felaktig signatur, saknad PDF,
  för stor fil samt skannad men ej granskad handling.
- Registrering blockeras vid saknat godkännande/fullmakt eller mottagningskvittens.
  Registreringsdatum får inte ersättas av utskicks-/godkännandedatum.
- Säljar-/partneravgränsning, äldre ordrar och historik, provision oförändrad,
  avstämt vattenfall, sparfel och mobilvy.

## Kvarvarande externa beroenden

Anslut separat mejlkonto och serverhemlighet, konfigurera mottagning/webhook,
serverlagring och avgränsad kundåtkomst. Slutlig godkänd fullmakts-/offertmall
behövs innan verkliga kundärenden används. Prototypens klickgodkännande är
inte verifierad BankID- eller e-signering. Ingen riktig kunddata, CRM-koppling,
BankID, domänändring eller publik åtkomst till huvudportalen har aktiverats.
