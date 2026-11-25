# Partnerlabbet – integrationsspecifikation för fastighetsbestånd

Version 1.0 • 25 november 2026 • Tekniskt förslag för utveckling och systemverifiering

## 1. Leverans och avgränsning

Behåll `estateContractFacts[partner][unit][trade|network]` och befintliga bestånds-, lägenhets- och ärendevyer. En serverbaserad integrationskomponent ska läsa verifierade fakta via Dynamics 365/Dataverse och projicera ett relevant elhandelsavtal respektive elnätsavtal till modellen. Gazelle och nätägaren bidrar med separata bekräftelser och ursprungsreferenser, som ska kunna följas genom CRM. Portalen ska inte behöva sammanfoga motstridiga råbesked från tre system.

Detta dokument specificerar ett målkontrakt, inte befintliga API:er. Alla nya fältnamn, statuskoder, endpointnamn, uppdateringsintervall och testvärden nedan är förslag. Exakta Dataverse-tabeller, Gazelle-gränssnitt och nätägarbesked är ännu inte verifierade. Inga produktionssystem har anslutits och inga GitHub-filer har ändrats.

### Verifierat i källkoden

- P-18 kräver separata slutdatum/statusar, CRM som källa till avtalsinformation, ingen automatisk visningsel och ingen härledning av fysisk uthyrning från uppsagd elhandel.
- `contractStatus(unit, kind, at)` använder de fyra fälten `contractId`, `status`, `endsOn`, `updatedAt`.
- Ett giltigt `endsOn` har företräde framför `status`: till och med datumet visas ”Uppsagt · gäller till …”; först dagen efter visas ”Avslutat …”. Annars känner funktionen igen `active`.
- Saknad faktarad faller tillbaka på `descriptions(status(unit,at))`, med `source:'demo'`. Saknat ID eller uppdateringstid ger ”Underlag saknas”. Alla övriga faktarader märks `source:'crm'`, utan faktisk kontroll av ursprung.
- `status()` räknar från lokala `estateEvents`. Detta är inte en tillförlitlig fysisk uthyrningsstatus eller bekräftad leveransstatus.
- Beståndsmatchning i import använder adress, ort, postnummer och lägenhetsnummer. Det är användbart för granskningsförslag men otillräckligt som integrationsnyckel.
- Lokala demoavtal och mejlkvittens finns kvar. De får inte upphöjas till verkliga avtal, aktiveringar eller intjänad kickback.

Granskade blobbar: `dist/estate-portfolio.js`: `e939934e84e76185650451c1c293da490aafa7aa`; `docs/DECISIONS.md`: `574832ea9b5575505e5f6b3e37b4b5b1fac95a6e`. PR 123 är mergad, merge-commit `80193bdafb5bd9d43c256b075a88e96c0d7af887`. Blob-SHA identifierar filinnehåll, inte hela main-grenens commit.

## 2. Fyra informationsslag och deras ägare

| Informationsslag | Föreslagen informationsägare och källa | Portalbeteende |
|---|---|---|
| Faktiskt elhandelsavtal | Kraftringens avtalsansvariga. CRM publicerar fakta med referens till verifierat affärssystem/Gazelle-besked | Endast verifierade fakta påverkar `trade` |
| Faktiskt elnätsavtal | Respektive nätägare är yttersta källa. CRM förmedlar verifierat nätbesked, direkt eller via Gazelle | Endast verifierade nätfakta påverkar `network`; CRM-order räcker inte |
| Fysisk uthyrning | Fastighetsägaren/förvaltaren eller dess fastighetssystem | Separat uppgift: `occupied`, `vacant`, `unknown`; faktiskt datum och källa |
| Beställd förändring | Partnern äger önskemålet; Kraftringens handläggning äger utförandestatus | Befintligt ärende visar önskat datum, delresultat och fel, utan att skriva avtalsfakta |

Fysisk inkoppling är dessutom en egen nätuppgift (`connected`, `disconnected`, `unknown`), inte en avtalsstatus. Den får bara visas som bekräftad efter nätbesked. Beställningen `keep-connected` är ett önskemål och ger aldrig själv status `connected`.

CRM är portalens publiceringspunkt men inte automatiskt sanningskälla för varje råfält. En accepterad Gazelle-instruktion, ett CRM-statusbyte på en order och en levererad e-post är inte bevis för aktivt nätavtal. För elhandel måste systemägarna fastställa vilket Gazelle-/affärssystembesked som är auktoritativt.

## 3. Föreslagen integrationskedja

1. Gazelle-/nätägaradapter tar emot eller hämtar besked. Validerar avsändare, meddelande-ID, avtal, anläggning och datum. Sparar råreferens och bekräftelsegrad i CRM/integrationsjournal.
2. CRM publicerar normaliserade avtalsfakta när de kan verifieras. Råbesked som saknar korrelation läggs i avvikelsekö.
3. Projektorn läser CRM-förändringar, resolverar serverkontrollerad partner–lägenhet–anläggning, uppdaterar historik och bygger portalens två separata faktarader.
4. Portalens backend returnerar endast den inloggades tillåtna bestånd. Webbläsaren läser fakta; beställningar går en separat skrivväg till befintliga ärenden.
5. Återkoppling om en beställning uppdaterar dess delstatus. Endast en separat verifierad faktahändelse ändrar avtalsmodellen. Händelserna länkas med `correlationId`, men är inte utbytbara.

**Transportförslag:** initial fullständig CRM-synk följd av Dataverse change tracking om berörda tabeller stöder det. Microsoft beskriver aktivering per tabell och delta-länkar för efterföljande förändringar [M1]. Alternativt avtalad webhook/kö med återläsning. Använd beständig inbox, outbox och avstämningsjobb; anta minst-en-gång-leverans. Inga Dataverse-anrop från webbläsaren.

Föreslaget driftmål att godkänna: deltaavläsning varje minut, högst fem minuter från CRM-publicering till portal vid normal drift, nattlig avstämning, varning vid mer än 15 minuters utebliven lyckad synk. Källans egen fördröjning redovisas separat; ett dygnsgammalt nätbesked blir inte färskt för att det nyss importerats.

## 4. Identifierare och mappningsregister

| Nyckel | Format och regel | Mappning/ägare |
|---|---|---|
| `partnerId` | Befintlig portalnyckel; unik inom portalens miljö | Kopplas explicit till CRM-konto-GUID och organisationsidentitet. Organisationsnummer ensamt avgör inte behörighet |
| `unitId` | Befintligt `estateRegistry.units[].id`; aldrig lägenhetsnumret ensamt | Förvaltarens stabila objekts-ID och föreslaget CRM-objekt-GUID |
| `buildingId` | Befintlig beståndsnyckel | CRM-/fastighetssystemets fastighetsobjekt. Adress är beskrivning |
| `meteringPointId` | Text, föreslagen validering 18 siffror enligt projektets anläggningsformat; formatet verifieras med källägare | Kopplas till unit med giltighetsintervall och nätägar-ID. Behåll inledande nollor |
| `sourceContractId` | Källans oförändrade avtals-ID som text | Unikt tillsammans med källsystem, miljö, avtalstyp och eventuell leverantör |
| `contractId` | Ogenomskinligt kanoniskt integrations-ID | Stabilt samma ID genom uppsägning och rättning; nytt vid nytt avtal |
| `crmRecordId` | Dataverse GUID | Primär postreferens, separat från affärsavtalsnummer |
| `requestId` / `correlationId` | Befintligt ärende-ID / stabil korrelationsnyckel | Koppling till Gazelle-beställning och nätägarens ärendenummer |
| `eventId` | Unik per källström | Dubblettnyckel `(sourceSystem, sourceEnvironment, eventId)` |
| `sourceRevision` | Monoton revision per källpost, om tillgänglig | Jämför bara inom samma källpost; inte mellan olika system |

Mappningsrad ska även innehålla `validFrom`, `validTo`, `verifiedAt`, `verifiedBy`, `mappingVersion` och status `verified|pending|conflict`. CRM kan använda alternativa nycklar för unika externa identiteter [M2]; nyckeln måste vara tekniskt tillåten och indexet aktivt innan användning.

**Resolverregel:** kontrollera autentiserad systemidentitet → källpost/avtal → verifierad anläggning → giltig unit-koppling → behörig partnerrelation vid aktuell tid. Noll träffar ger `MAPPING_MISSING`; flera träffar ger `MAPPING_AMBIGUOUS`. Ingen automatisk adressmatchning eller nytt beståndsobjekt från en inkommande avtalsuppdatering. Adressmatchning får skapa granskningsförslag. Bestånd skapas fortsatt genom befintligt granskat import-/registreringsflöde.

Första versionen stöder exakt en relevant elanläggning per unit och tid. Om en lägenhet har flera mätpunkter ska kopplingen blockeras för manuell modellverifiering; skriv aldrig godtyckligt över samma `trade`-slot. Ägar-/förvaltarbyte ska tidsbegränsa åtkomst och skapa en ny projektion för rätt partner utan att exponera tidigare kunduppgifter.

## 5. Fältmappning och datakontrakt

Källkolumnnamnen nedan är **logiska begrepp att mappa**, inte verifierade Dataverse-scheman. Avtalsinformation ska inte läsas direkt ur opportunity-/orderstatus utan godkänd mappning.

| Målfält | CRM-begrepp | Gazelle/nätägare | Transformering och krav |
|---|---|---|---|
| `contractId` | Avtalspost + extern referens | Källans avtalsnummer | Resolver skapar/bevarar kanoniskt ID. Order-ID är inte avtals-ID |
| `status` | Verifierad avtalslivscykel | Typat bekräftelse-/avslutsbesked | Versionsstyrd statusöversättning; okänd kod → karantän |
| `endsOn` | Bekräftad sista giltighetsdag | Bekräftat slutdatum | ISO-datum eller null; inklusive sista dagen, separat per avtalstyp |
| `updatedAt` | Tid då normaliserade fakta ändrades i CRM | Källans ändringstid sparas separat | RFC3339 UTC; ändras inte vid dubblett/pollning |
| `startsOn` (backend) | Bekräftad första giltighetsdag | Leverans-/avtalsstart, inte önskad start | ISO-datum; behövs för urval mellan gamla och nya avtal |
| `holderRef`, `holderRole` (backend) | Avtalspart och roll | Bekräftad avtalspart | Skilj `tenant`/`landlord`; undvik personuppgifter i läsprojektionen |
| `payerRef` (backend) | Bekräftad betalare | Faktureringsansvar enligt källan | Får inte hämtas från beställningens önskade betalare |
| `originSystem`, `originRecordId` | Ursprungsreferens | Verifierat besked | Obligatoriskt för nätfakta; CRM förmedling ska inte dölja ursprung |
| `sourceUpdatedAt`, `receivedAt` | Källtid / mottagningstid | Beskedets tid / transporttid | Används för aktualitet och felsökning, inte som ensamt ordningsbevis |
| `verifiedAt`, `verificationRef` | Verifieringstid och beskedsreferens | Ack/bevis för affärshändelsen | Transport-ACK accepteras inte som affärsbekräftelse |
| `occupancy.status`, `effectiveOn` | Separat fastighetsuppgift om sådan finns | Normalt förvaltaren | Ingen kopiering från `trade` eller `network` |
| `requestedOn`, `requestedPayer`, `supplyAction` | Serviceärende | Utgående instruktion | Sparas i beställningen, aldrig i faktaraden |

### Kärnmodell och kompletterande metadata

De fyra befintliga fälten behålls. Historik, startdatum, avtalsparter, råstatus och revision lagras på servern, inte i en ny portalstruktur. Ett separat metadataobjekt i lässvaret föreslås för `freshness`, `verification`, `originSystem`, `lastSuccessfulSyncAt`, `projectedAt`, `projectionVersion` och avvikelser. Detta är tillägg, inte befintlig funktionalitet.

`null` betyder uttryckligen inget bekräftat slutdatum för den aktuella revisionen. Saknat fält i ett fullständigt snapshot är ett schemafel. Vid återtagen uppsägning måste ett nytt komplett snapshot uttryckligen ange `endsOn:null`; en vanlig merge får inte behålla det gamla slutdatumet.

## 6. Statusövergångar och urval

Föreslaget normaliserat `status`: `active`, `termination_scheduled`, `ended`, `unknown`. Framtida bekräftade avtal och annullerade avtal lagras i backendhistoriken, men blir inte dagens faktarad innan giltig start. `unknown` används när tidigare fakta uttryckligen återkallats eller underlag saknas; en transportstörning raderar inte senast kända fakta.

| Händelse | Övergång | Villkor |
|---|---|---|
| Verifierad avtalsstart | unknown → active | Giltigt ID, startdatum, verifiering och unik koppling |
| Bekräftad uppsägning | active → termination_scheduled | `endsOn >= startsOn`; källan bekräftar slutdatum |
| Sista giltighetsdag passerar | termination_scheduled → ended i projektionen | Stockholm-datum > endsOn. Detta är datumhärledning från bekräftat avtal, inte ett nytt nätbesked |
| Återtagen uppsägning | termination_scheduled → active | Högre giltig revision, uttrycklig återtagning och `endsOn:null` |
| Retroaktiv rättning | ended → active/termination_scheduled | Uttrycklig verifierad korrigering, orsak och historik; aldrig vanlig gammal replay |
| Ny hyresgäst/ägare tar över | Nytt contractId väljs | Nytt bekräftat avtal med uppnådd start; gammalt avtal kvar i historiken |
| Avtalsbesked återkallas | tidigare status → unknown | Explicit återkallelse; avvikelse visas tills ny verifiering |

**Urval per `(partner, unit, kind, asOfDate)`:**

1. Ta endast verifierade, behöriga, ej återkallade avtal med `startsOn <= asOfDate`.
2. Om exakt ett avtal täcker datumet, välj det. Ett framtida avtal får inte ersätta det.
3. Om inget täcker datumet, välj senaste avslutade avtalet som historiskt avslutat; ange separat att pågående avtal inte är verifierat. Ett avslutat Kraftringen-avtal bevisar inte att kunden saknar elavtal hos andra leverantörer.
4. Om flera avtal täcker datumet, använd bara uttrycklig verifierad ersättningsrelation om den löser överlappet. Annars: konflikt, underlag behöver verifieras, ingen godtycklig vinnare.
5. Om inget relevant avtal finns: ”Underlag saknas”. Behåll ingen demo-fallback i integrationsläge.
6. Reprojektorn kör vid faktauppdatering och datumskifte Europe/Stockholm; återhämta missade datumjobb vid omstart. UTC används för tidsstämplar, lokala kalenderdatum för giltighet.

Uppsagd/avslutad handel förändrar aldrig nätstatus, uthyrning eller anslutning. Visningsel är en tjänst/betalarrelation, inte en egen avtalsstatus. Ett aktivt ägaravtal kan visas som ”Aktivt – visningsel” endast när avtalets ändamål och betalare är verifierade för just den avtalstypen.

## 7. Exempel på payloads

Alla värden är fiktiva och avsedda för en isolerad testmiljö. JSON-exemplen är kontraktsförslag; de motsvarar inte Gazelles eller nätägarens dokumenterade wireformat.

### 7.1 Inkommande komplett CRM-faktahändelse

```json
{
  "schemaVersion": "1.0",
  "eventId": "evt-test-1001",
  "eventType": "contract.snapshot",
  "sourceSystem": "dynamics365",
  "sourceEnvironment": "test",
  "sourceRecordId": "00000000-0000-4000-8000-000000000101",
  "sourceRevision": "42",
  "occurredAt": "2026-11-25T09:00:00Z",
  "correlationId": "case-test-termination-01",
  "mappingRef": "map-test-a1-v1",
  "contract": {
    "sourceContractId": "EL-TEST-001",
    "kind": "trade",
    "meteringPointId": "000000000000000001",
    "lifecycle": "termination_scheduled",
    "startsOn": "2026-01-01",
    "endsOn": "2026-11-30",
    "holderRef": "tenant-test-01",
    "holderRole": "tenant",
    "payerRef": "tenant-test-01",
    "sourceUpdatedAt": "2026-11-25T08:59:00Z",
    "updatedAt": "2026-11-25T09:00:00Z",
    "verification": {
      "state": "verified",
      "originSystem": "gazelle-test",
      "originRecordId": "gaz-msg-test-501",
      "verifiedAt": "2026-11-25T09:00:00Z",
      "evidenceType": "business-confirmation"
    }
  }
}
```

Servern hämtar partner och unit ur `mappingRef` och kontrollerar anläggning/källpost. Klientens val av partner är aldrig behörighetsbevis. Revisionen är här en decimalsträng i testkontraktet, inte ett löfte om Gazelles revisionsformat. En verklig Dataverse-ETag behandlas enligt sitt eget protokoll, inte som en global räknare.

### 7.2 Läsprojektion efter separat nätbesked

```json
{
  "estateContractFacts": {
    "estate1": {
      "a1": {
        "trade": {
          "contractId": "ctr-test-trade-001",
          "status": "termination_scheduled",
          "endsOn": "2026-11-30",
          "updatedAt": "2026-11-25T09:00:00Z"
        },
        "network": {
          "contractId": "ctr-test-network-001",
          "status": "termination_scheduled",
          "endsOn": "2026-12-02",
          "updatedAt": "2026-11-25T10:00:00Z"
        }
      }
    }
  }
}
```

Den 1 december visar denna modell handel ”Avslutat 2026-11-30” och nät ”Uppsagt · gäller till 2026-12-02”. Radernas uppdateringstider ska inte skrivas om av kalenderövergången. `projectedAt` ligger separat. JSON:en visar 25 november-snapshot; ett senare servergenererat snapshot kan ha `trade.status:"ended"` med samma `updatedAt`.

### 7.3 Beställning av visningsel – separat skrivmodell

```json
{
  "schemaVersion": "1.0",
  "requestId": "req-test-viewing-001",
  "idempotencyKey": "estate1-a1-viewing-test-001",
  "type": "viewing",
  "unitId": "a1",
  "requestedOn": "2026-12-01",
  "requestedPayer": {"trade": "estate1", "network": "estate1"},
  "supplyAction": "keep-connected",
  "authorityRef": "authority-test-landlord-01",
  "expectedProjectionVersion": "projection-test-17"
}
```

Servern tillför autentiserad aktör, partner och mottagningstid. `expectedProjectionVersion` används för att upptäcka ändrat beslutsunderlag, inte för att förbjuda beställning under pågående hyresgästavtal. Svaret kan vara `202` med ärendestatus `received`; det betyder inte att betalare eller avtal ändrats.

### 7.4 Partiellt utförd beställning

```json
{
  "requestId": "req-test-viewing-001",
  "status": "partially_confirmed",
  "trade": {
    "status": "confirmed",
    "confirmedStartsOn": "2026-12-01",
    "contractRef": "ctr-test-trade-landlord-001"
  },
  "network": {
    "status": "needs_review",
    "requestedStartsOn": "2026-12-01",
    "proposedStartsOn": "2026-12-03",
    "reasonCode": "EXISTING_CONTRACT_OVERLAP"
  },
  "supply": {"requested": "keep-connected", "confirmedStatus": "unknown"}
}
```

Bekräftat handelssvar måste följas av en verifierad faktahändelse innan `trade` ändras. Föreslagen nätstart kräver nytt besked/handläggningsbeslut. Ändra inte beställningens ursprungliga önskade datum; spara accepterat datum separat.

### 7.5 Ny hyresgäst och fysisk inflyttning

```json
{
  "requestId": "req-test-movein-002",
  "type": "movein",
  "unitId": "a1",
  "requestedOn": "2026-12-15",
  "customerRef": "tenant-test-02",
  "authorityRef": "authority-test-02",
  "requestedServices": ["trade", "network"],
  "tradeProductRef": "product-test-01",
  "status": "received"
}
```

```json
{
  "eventId": "occupancy-test-002",
  "type": "occupancy.confirmed",
  "unitId": "a1",
  "status": "occupied",
  "effectiveOn": "2026-12-15",
  "sourceSystem": "landlord-test",
  "recordedAt": "2026-12-15T10:00:00Z"
}
```

Separata framtida avtal använder nya ID:n och `startsOn:"2026-12-15"`. Gamla ägaravtal får inte avslutas av inflyttningsbeställningen; deras slut 14 december måste bekräftas för respektive avtalstyp.

## 8. Fiktiv genomspelning – olika slutdatum och två överlämningar

Utgångsläge: estate1/a1 har en verifierad mätpunkt. Hyresgäst T1 är fysiskt boende enligt förvaltaren. Handel T1 och nät T1 är aktiva. Datumen avser Europe/Stockholm.

| Datum/händelse | Elhandel i beståndet | Elnät i beståndet | Fysisk uthyrning | Beställning/avvikelse |
|---|---|---|---|---|
| 25 nov: två CRM-besked | T1 uppsagt, sista dag 30 nov | T1 uppsagt, sista dag 2 dec | Fortsatt bebodd | Ingen automatisk visningsel |
| 26 nov: visningsel beställs från 1 dec | Oförändrat | Oförändrat | Oförändrat | Mottagen. Överlapp för nät 1–2 dec flaggas |
| 28 nov: handel för ägaren bekräftas från 1 dec | Fortfarande T1 till 30 nov | Fortfarande T1 till 2 dec | Bebodd | Handelsdel bekräftad; nät behöver hantering |
| 30 nov, även kl. 23:59 lokal tid | T1 gäller fortfarande | T1 gäller fortfarande | Bebodd tills separat utflyttbesked | Inget tidigt avslut |
| 1 dec: förvaltaren bekräftar utflyttning | Ägarens handel aktiv från 1 dec | T1 gäller till 2 dec | Ledig från 1 dec | Visningsel delvis utförd. Nätbetalare är ännu T1 enligt faktan |
| 2 dec: nätägaren bekräftar ägaravtal från 3 dec och fortsatt inkoppling | Ägarens handel aktiv | T1 gäller hela 2 dec | Ledig | Reviderat nätstartdatum dokumenteras, anslutning separat bekräftad |
| 3 dec | Ägarens handel aktiv | Ägarens nätavtal aktivt | Ledig | Båda avtalsdelarna verifierade; tjänsten kan markeras utförd |
| 5 dec: inflyttning T2 beställs till 15 dec | Oförändrat | Oförändrat | Fortsatt ledig | Inflyttning planerad, inga automatiska avtalsavslut |
| 10 dec: handel T2 från 15 dec och ägarhandel slut 14 dec bekräftas | Ägarhandel uppsagd till 14 dec | Ägarnät aktivt utan bekräftat slut | Ledig | Inflyttning delvis bekräftad |
| 12 dec: nät T2 från 15 dec och ägarnät slut 14 dec bekräftas | Oförändrat | Ägarnät uppsagt till 14 dec | Ledig | Båda avtalen planerade, ej dagens aktiva T2-avtal |
| 15 dec: startdatum uppnått; förvaltaren bekräftar faktisk inflyttning | T2 aktiv | T2 aktiv | Bebodd från 15 dec | Fullföljt; tidigare avtal kvar i historik |

**Gren A – inga ägarbekräftelser:** den 1 december visas avslutad T1-handel, nätet gäller till 2 december. Från 3 december är båda gamla avtalen avslutade. Visningsel står kvar som beställd/ej verifierad. Inkoppling och eventuella andra leverantörers avtal är okända.

**Gren B – nätet för T2 försenas:** den 15 december visas aktiv T2-handel och senaste verifierade nätstatus för ägaren (eller avslutat ägarnät om slutet är bekräftat). Fysisk inflyttning kan ändå vara bekräftad. Ärendet får `partially_confirmed` och nätavvikelse. Ingen konstgjord gemensam slut-/startdag.

**Gren C – utflyttning saknas:** den 1 december står fysisk uthyrning kvar som bebodd/ej uppdaterad även om båda avtalen skulle ha upphört. Avvikelse kan begära verifiering hos förvaltaren, men status ändras inte automatiskt.

**Gren D – nätavtal hos extern aktör saknar insyn:** visa ”Nätstatus saknar verifierat underlag” och aktualitet. Härled inte ”Ej tecknat” eller ”Frånkopplat” från att CRM saknar rad.

## 9. Uppdateringshändelser och konsistens

| Händelse | Åtgärd i integrationen | Får inte göra |
|---|---|---|
| CRM-avtal skapat/ändrat | Läs komplett relevant snapshot; validera, journalför, projicera rätt kind | Uppdatera båda avtalen slentrianmässigt |
| Gazelle affärsbekräftelse | Korrelera till ärende/avtal och publicera verifierbara fakta via CRM | Tolka mottagen instruktion som leveransstart |
| Nätägarbesked om start/slut/rättning | Verifiera anläggning, avtal, avsändare och datum | Likställa nätavtal med fysisk inkoppling |
| Visningsel-/inflyttningsorder | Skapa idempotent ärende, separata delsteg | Skriva `estateContractFacts` |
| Fysisk utflytt/inflytt bekräftad | Uppdatera separat occupancy med källa och datum | Avsluta eller aktivera energiavtal |
| Mappning rättad | Versionssätt och omprojicera berörda fakta efter granskning | Flytta historiska personuppgifter till obehörig partner |
| Källpost raderad | Journalför tombstone; markera verifieringsbehov/återkallad post enligt källkontrakt | Tolka radering som uppsagt avtal |
| Datumskifte/återstart | Räkna om avtalsurval från verifierad historik | Skapa beställningar eller nätkommandon |

Transaktion per inkommande faktahändelse ska omfatta inboxregistrering, historikrevision, projektion och utgående notifiering. Kvittera inte före beständig lagring. Använd versionsvillkor/optimistisk låsning per projektion, så samtidiga trade- och network-händelser inte tappar varandras ändringar. Frontend uppdaterar bara de nycklar som servern levererat, med versionskontroll; hela state får inte ersättas från ett gammalt snapshot.

Dataverse change tracking är en förändringskälla för synk, inte en garanti att varje mellanliggande affärsövergång finns som händelse. Om full händelsehistorik behövs krävs separat journal/outbox eller avtalad auditkälla. Cursor flyttas först när hela sidan hanterats beständigt; följ paginering. Vid ogiltig/utgången cursor: kontrollerad full omsynk, inte radering av lokala fakta. Jämför snapshot mot källan före tombstones.

## 10. Felhantering, säkerhet och drift

| Fel | Föreslagen hantering | Visning/ansvar |
|---|---|---|
| Dubblett, samma nyckel och innehåll | Kvittera idempotent utan mutation | Ingen extra beställning eller uppdateringstid |
| Samma eventId men olika innehåll | Karantän `EVENT_ID_COLLISION` | Integrationsförvaltare utreder |
| Äldre revision | Journalför ignorerad; behåll nyare | Inget bakåtsteg |
| Ingen ordningsgaranti | Läs om komplett auktoritativ källpost, jämför källversion; annars karantän | Använd inte enbart mottagningstid |
| Saknad/tvetydig koppling | Karantän; ingen beståndsmutation | CRM-/masterdataansvarig rättar och återspelar |
| Ogiltigt datum/status/typ | `SCHEMA_INVALID`/`STATUS_UNMAPPED` | Behåll senast verifierade fakta med avvikelse |
| Motstridiga källbesked | Stoppa berörd kind, bevara historik och visa konflikt | Källägare avgör; senaste mottagning vinner inte |
| 429/timeout/5xx | Respektera Retry-After, exponentiell retry med jitter; föreslaget 8 försök, därefter DLQ | Larm efter 15 min; kontrollerad replay med samma ID |
| 401/403 | Stoppa relevant flöde och larma | Ingen upprepning som belastar systemet; driftansvarig |
| Källsystem otillgängligt | Visa senaste kända fakta med tidsstämpel och stale-markering | Aldrig demo eller ny ”aktiv”-gissning |
| En avtalsdel misslyckas | Behåll lyckad del; ärende delvis bekräftat | Handlägg separat. Ingen automatisk annullering av lyckat avtal |
| Begärt startdatum har passerat | Eskalera för nytt bekräftat datum | Ingen automatisk bakdatering |
| Bekräftelse på mail saknas | Separat kommunikationsavvikelse | Avtalsstatus ändras inte |

För ny beställning: idempotency key med samma innehåll returnerar befintligt ärende; samma nyckel med olika innehåll ger 409. Schemafel ger 400/422; obehörig beståndsåtkomst 403 eller konsekvent 404. Integrationsinbox kan returnera 202 efter beständig mottagning, även innan projektion; processing-status måste då gå att följa. Endast autentiserade avsändare får skicka faktahändelser.

Servern ska verifiera tenant-/partner-/unit-behörighet vid varje läsning och skrivning. Portalens demoroller/localStorage är inte produktionsbehörighet. API-hemligheter stannar på servern. Minimera kundpersonuppgifter; portalprojektionen behöver avtalsreferens och status, inte personnummer. Fullmakter lagras separat med åtkomstkontroll. Revisioner, replay, rättningar och mappningsändringar loggas med aktör och orsak. Lagringstid och historisk åtkomst beslutas med informationsägarna.

Driftmått: senaste lyckade synk per källa, källfördröjning, antal saknade kopplingar, karantän/DLQ, konflikter, stale faktarader och beställningar utan affärsbekräftelse. Transport framgång och affärsmässigt utförande mäts separat.

## 11. Nödvändiga ändringspunkter i befintlig kod – senare implementation

1. Behåll nyckelstrukturen och befintliga vyer. Inför explicit demo-/integrationsläge; saknade fakta i integrationsläge ska ge ”Underlag saknas”. Avaktivera fallback till lokala servicehändelser för verklig avtalsvisning.
2. Utöka `contractStatus()` till strikt validerad normaliserad status och kvalitet. Nu kan vilket giltigt `endsOn` som helst dominera status. Okända/motsägande kombinationer måste få avvikelse, inte felaktig uppsägning.
3. Separera `status()` för lokal planering från faktisk occupancy. Använd separat bekräftad uthyrningsuppgift vid relevant presentation; låt inte gamla demoavtal styra produktionsvalidering. Planerad inflyttning kan registreras före faktisk utflyttning, med konfliktkontroll på önskad period.
4. Lägg serveradapter och kontrollerad read-only inläsning till `estateContractFacts`; metadata hålls separat. Demo-state får inte sändas till produktionsintegrationen.
5. Återanvänd befintliga ärenden för visningsel/inflyttning, med delstatus, begärt/bekräftat datum och korrelation. Behåll nuvarande registreringsvägar och bilagor.
6. Anpassa demots kvittenstexter inför skarp drift. ”Två avtal skapade” och ”Elnätsavtal har också skapats” får inte skickas vid enbart registrerad beställning. Skilj mottagningskvitto, avtalsbekräftelse och slutlig leveransstart; visa varje tjänsts datum.
7. Aktivering/kickback kräver separat verifierad affärshändelse enligt beslutad provisionsmodell. Varken lokal order, visningsel eller att ett datum passerat är i sig provisionsunderlag.

Ändringspunkterna är planerade arbete; ingen sådan ändring ingår i denna leverans.

## 12. Acceptanstester för utvecklarna

Testerna nedan är körbara som testfall efter implementation. De är specificerade, inte körda mot Partnerlabbet eller verkliga system i denna leverans. Använd fast testklocka, isolerad fiktiv data och stubbar för alla transporter.

| ID | Given / When | Then – förväntat resultat |
|---|---|---|
| AT01 | T1 handel slut 30 nov, nät slut 2 dec; klocka 1 dec | Handel avslutad, nät uppsagt men giltigt. Ingen occupancy-/orderändring |
| AT02 | Samma data; 30 nov 23:59:59 Stockholm, därefter 1 dec 00:00 | Handel avslutas först efter datumgränsen; testa även server i UTC |
| AT03 | Handel avslutas, nät saknar faktarad i integrationsläge | Nät ”Underlag saknas”, inte handelsstatus eller demo |
| AT04 | Visningsel beställs från bebodd unit | Ärende skapas; fakta och occupancy byte-för-byte oförändrade |
| AT05 | Visningsel från 1 dec, T1 nät slut 2 dec | Överlapp 1–2 dec flaggas; nätbetalare/startdatum ändras inte automatiskt |
| AT06 | Handelsdelen bekräftas, nätdelen får timeout | Trade-fakta kan uppdateras efter verifierad händelse; network oförändrat; ärende partiellt |
| AT07 | Nytt avtal från 15 dec anländer 10 dec | Ägaravtalet visas fram till och med 14 dec; nytt ID först 15 dec |
| AT08 | Enbart inflyttningsorder från 15 dec | Inga nya aktiva avtal eller faktisk occupancy; ingen kickback |
| AT09 | Fysisk inflyttning bekräftas men nätbekräftelse saknas | Occupied kan visas; nät förblir senast känt/okänt med avvikelse |
| AT10 | Samma faktahändelse levereras två gånger | En historikrevision; oförändrat updatedAt; inga dubbla notifieringar |
| AT11 | Revision 43 tillämpad, därefter revision 42 | Ingen återgång; äldre händelse journalförd som ignorerad |
| AT12 | Samma eventId med annat endsOn | Karantän; ingen mutation |
| AT13 | Uppsägning återtas med ny revision och endsOn:null | Aktivt avtal utan gammalt slutdatum; gamla revisioner bevarade |
| AT14 | 2026-02-30 eller slut före start | Valideringsfel, ingen projektion av felvärdet |
| AT15 | Okänd CRM-statuskod eller enbart transport-ACK från Gazelle | Ingen verifierad avtalsstatus skapas |
| AT16 | Unit saknas eller mätpunkt matchar två units | Karantän; ingen automatisk adressbaserad skapelse |
| AT17 | estate1-användare begär estate2:s unit | Ingen data läcker; beställning nekas; serverkontroll testas |
| AT18 | Samtidiga trade-/network-händelser för samma unit | Båda uppdateringarna kvar efter versionskonflikt/retry |
| AT19 | CRM otillgängligt över stale-gränsen | Senast kända fakta synliga med varning/tid; ingen demo-fallback |
| AT20 | Omstart efter lagring men före ACK | Replay ger samma slutresultat utan dubbla affärsåtgärder |
| AT21 | Nätpost raderas i CRM | Inte automatiskt ”Avslutat”; källavvikelse/återkallelse hanteras |
| AT22 | Två verifierade överlappande handelsavtal utan ersättningsrelation | Konflikt markeras, ingen godtycklig avtalsvinnare |
| AT23 | Framtida avtal annulleras före start | Gammalt avtal påverkas inte; annullerat avtal väljs aldrig |
| AT24 | Omsynk med utgången cursor | Full återläsning utan tappade fakta; deduplicering kvar |
| AT25 | `keep-connected` beställs utan nätbesked | Fysisk anslutning förblir unknown, aldrig connected |
| AT26 | Nätägaren bekräftar fortsatt inkoppling men inte avtal | Anslutningsuppgift uppdateras, nätavtal oförändrat |
| AT27 | Ny beställning återförsöks med samma idempotency key | Samma requestId; ändrad payload med samma nyckel ger 409 |
| AT28 | Ägarbyte begränsar partnerrelationen | Gammal partner tappar aktuell åtkomst; historik exponeras bara enligt beslutade rättigheter |
| AT29 | Kalenderjobb missas under driftstopp | Återstart väljer korrekt avtal för dagens datum utan affärskommandon |
| AT30 | Mail accepterat men inga avtalsbekräftelser | Ärendet visar kommunikationskvittens, inte två skapade avtal |

### Referenspseudokod för de viktigaste invarianten

```text
handleFact(event):
  authenticateSource(event)
  validateSchemaAndDates(event)
  beginTransaction()
  if inbox.sameKeyDifferentHash(event): quarantineAndCommit()
  if inbox.alreadyApplied(event): commitNoOp()
  mapping = resolveVerifiedMapping(event)
  if mapping.missingOrAmbiguous: quarantineAndCommit()
  if event.revisionOlderThanStored: recordIgnoredAndCommit()
  verifyBusinessEvidenceAndAllowedTransition(event)
  persistContractRevision(event, mapping)
  projectOnlyAffectedKind(mapping, event.kind, stockholmToday())
  persistInboxAndOutbox()
  commit()

handleRequest(request, actor):
  authorizeUnit(actor, request.unitId)
  checkIdempotencyAndPeriodConflicts(request)
  persistServiceRequestWithOutbox(request)
  // Invariant: inga skrivningar till avtalsfakta eller fysisk occupancy.

project(unit, kind, date):
  selectVerifiedContractForDateOrLatestEnded(unit, kind, date)
  rejectUnresolvedOverlaps()
  renderMissingWithoutDemoFallback()
```

Karantän och ignorerade händelser ska avsluta hanteringen explicit; pseudokoden ska inte fortsätta efter dessa grenar. Validering av en högre revision måste också hantera otillåten statusövergång. En högre räknare ensam gör inte fakta korrekta.

## 13. Verifieringslista per system och beslut före implementation

| System/ägare | Exakt uppgift att verifiera | Bevis som behövs för att stänga punkten |
|---|---|---|
| Dynamics 365/CRM | Vilka tabeller representerar verkliga handel-/nätavtal, bostäder, mätpunkter, betalare och partnerrelationer? | Metadataexport och anonymiserade exempel; tabell/kolumn/typ/nullable/ägare i mappningsbilaga |
| Dynamics 365/CRM | Statuscode/statecode, start/slut-semantik, återtagning, borttagning, tidszon | Godkänd statusmatris och daterade exempel; CRM-order skiljs från avtal |
| Dynamics 365/CRM | Change tracking-stöd, cursorlivslängd, API-behörigheter, throttling, revisionsmodell | Sandboxprov på initial synk, delta, radering, återstart och 429 |
| Dynamics 365/CRM | Var bevaras nätägarens och Gazelles ursprungsbevis? | Länkbar originRecordId/verificationRef och ansvarig informationsägare |
| Gazelle | Vilken produkt/version/instans avses, vilka API-/fil-/köformat finns? | Leverantörens gränssnittsspecifikation; inga endpointnamn antas |
| Gazelle | Skillnad mellan mottagen, accepterad, registrerad, startad och avslutad; stöd för återtagning/rättning | Beskedslista med verkliga kodvärden och fiktiva/anonymiserade payloads |
| Gazelle | Avtals-ID kontra order-/transaktions-ID, revisions-/dubblettgaranti | Dokumenterad korrelation och återspelningsprov |
| Gazelle | Stöd för nätbeställning/visningsel och vidareförmedling av nätbekräftelser | Verifierad ansvarsfördelning; annars separat nätägaradapter |
| Nätägare, per aktör | Hur nätavtal/slutdatum bekräftas och får återges till fastighetsägare | Överenskommet gränssnitt/behörighet och exempel på affärsbekräftelse |
| Nätägare, per aktör | Sista giltighetsdag, överlapp, betalare, rättning och fortsatt inkoppling | Bekräftade datumregler och separata koder för avtal respektive anslutning |
| Fastighetsägare/förvaltare | Stabil objektsnyckel, mätpunktskoppling, fysisk inflytt/utflytt | Granskad mappningsfil och avtalad källa till occupancy |
| Kraftringens produktägare | Hur partiell visningsel och datumkonflikter handläggs | Beslut om kontaktväg, eskalering, accepterade datum och kvittenstexter |
| Kraftringens drift/informationsägare | Aktualitetsmål, retention, åtkomst, rättningsansvar | Godkända driftmål och ansvariga roller |

Start-/slutdatum per avtal måste kunna skilja sig även om ett formulär har ett gemensamt önskat inflyttningsdatum. Det ska verifieras om bekräftad framtida start räcker som giltighetsbevis eller om separat aktiveringsbesked krävs för respektive system. Om aktiveringsbesked krävs ska datumskifte ensamt inte välja det nya avtalet som aktivt.

### Föreslagen leveransordning

1. Fastställ systemmappning och beskedskoder med systemägarna. Märk varje mappning verifierad eller öppen; stoppa bara berörd faktaart vid osäkerhet.
2. Implementera historik, resolver och projektor med fiktiva snapshots och AT01–AT30. Behåll portalens befintliga struktur.
3. Implementera adapters i isolerade testmiljöer. Kör kontraktstester för varje verkligt format och källa.
4. Genomför avstämning i läsläge mot ett godkänt testbestånd: samma unit, avtals-ID, status, datum och ursprung i källor och portal.
5. Separat driftbeslut efter verifiering. Det här underlaget auktoriserar ingen produktionsanslutning eller ändring i GitHub.

## 14. Källor och evidensgräns

- [G1 – PR 123](https://github.com/HakanRusk/kraftringen-partnerlabb/pull/123): granskad PR-metadata, beskrivning och diff. PR:ns historiska testuppgifter är utvecklarens uppgifter, inte testkörningar i denna leverans.
- [G2 – estate-portfolio.js](https://github.com/HakanRusk/kraftringen-partnerlabb/blob/main/dist/estate-portfolio.js): granskad aktuell fil 25 november 2026; blob-SHA ovan. Stöd för beskrivningen av dagens läsmodell, fallback och lokala ärenden.
- [G3 – DECISIONS.md, P-18](https://github.com/HakanRusk/kraftringen-partnerlabb/blob/main/docs/DECISIONS.md): granskad aktuell fil 25 november 2026; blob-SHA ovan. Stöd för verksamhetsregler och kvarvarande integrationsarbete.
- [M1 – Microsoft: Change tracking](https://learn.microsoft.com/en-us/power-apps/developer/data-platform/use-change-tracking-synchronize-data-external-systems): läst 25 november 2026. Stöd för tekniskt transportalternativ, inte för Kraftringens faktiska konfiguration.
- [M2 – Microsoft: Alternate keys](https://learn.microsoft.com/en-us/power-apps/developer/data-platform/define-alternate-keys-entity): läst 25 november 2026. Stöd för möjlighet till externa unika nycklar, inte för en redan existerande identifierarmappning.

Inga Gazelle-/nätägargränssnitt eller kundspecifika Dynamics-scheman har tillhandahållits eller verifierats. All sådan mappning är därför uttryckligen ett förslag med verifieringskrav ovan.
