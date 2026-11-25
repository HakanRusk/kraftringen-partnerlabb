# Avtalsfakta för fastighetsbestånd – implementation 25 november 2026

Utgångspunkt: [specifikationsbaseline](ESTATE-INTEGRATION-SPEC.md) och P-18.
Specifikationens tidigare besked om ingen GitHub-ändring gäller framtagningen av
underlaget. Håkan beställde därefter ”Gör uppdateringarna!”. Detta utvecklingspass
förbereder koden i en separat PR. Ingen CRM-/Gazelle-/nätägaranslutning,
publicering, verklig kunddata eller ny serverbehörighet ingår.

## Implementerat

- `dist/estate-contracts.js`: transportfri, deterministisk ingest/projektor, laddbar
  i webbläsaren och med Node `require`. En värd måste själv autentisera, validera
  behörighet och lagra transaktionen. Modulen är inte en backend eller säkerhetsgräns.
- Validerade fullständiga snapshots med ursprungsbesked, exakt identifierarmappning,
  versionsordning, dubblettskydd, händelse-/revisionskollision, karantän och explicit
  återspelning efter mappningsrättning. Flera mätpunkter per lägenhet avskiljs.
- Historik behålls och datumstyrt urval väljer ett handel-/nätavtal var. Framtida
  avtal väntar på sitt startdatum. Oförklarade överlapp ger konflikt. Återtagen
  uppsägning kräver uttrycklig ändringsorsak och null; retroaktiv återöppning kräver
  rättning. `cancelled` betyder annullerat före start, `withdrawn` återkallat
  faktaunderlag. Annullering får inte gömma det tidigare gällande avtalet.
- `project()` returnerar `{facts, metadata}` för en explicit partner/unit och
  kalenderdag. `facts` är de oförändrade fyra fälten per `trade|network`; sätt dem
  på `estateContractFacts[partner][unit]`, metadata på `estateContractMeta[partner][unit]`.
  **Ersätt hela unit-snapshotet**, inklusive borttagna/okända slots, och spara båda
  objekten i samma transaktion. En gammal faktarad får inte överleva en återkallelse.
- Beståndsvyn använder samma läsmodell som tidigare. Saknade fakta visar Underlag
  saknas och hämtas aldrig från en beställning. Äldre rader utan metadata läses
  kompatibelt men märks ”äldre testunderlag, ej verifierat”; sparade rader skrivs
  inte om. Ny metadata aktiverar strikt validering.
- Fysisk uthyrning läses separat från `estateOccupancy[partner][unit]`, en lista av
  `{status, effectiveOn, recordedAt, source}`. `occupied|vacant|unknown` är tillåtna.
  Framtida uppgifter väntar på datumet. Saknad uppgift ger Underlag saknas; seed,
  uppsägning och servicebeställning är inte källa till fysisk uthyrning.
- Nya lokala förändringar är mottagna beställningar. Dubblett av samma typ/datum
  blockeras. Mottagningskvitto lovar inte att avtal skapats. Historiska handlingar
  bevaras. Önskad betalare och fortsatt inkoppling visas som önskemål.
- ”Visa fiktivt avtalsflöde” i lägenhetsdetaljen öppnar 12 daterade steg, från
  hyresgästens uppsägningar via partiell visningsel till nästa hyresgäst. Scenariot
  räknas av samma projektor i minnet; inga skrivningar i Portal.state/localStorage,
  inga affärskommandon och inga externa anrop. Datum och bekräftelser är fiktiva.

## API för offlineadapter och tester

```js
const C = require('./dist/estate-contracts.js');
const S = require('./dist/estate-contract-scenario.js');
let journal = C.empty();
const result = C.ingest(journal, S.steps[0].events[0], S.mappings, {
  asOf: '2026-11-24',
  receivedAt: '2026-11-24T12:00:00Z'
});
// I en framtida server: lagra result.state atomärt före kvittens.
journal = result.state;
const {facts, metadata} = C.project(journal, {
  partnerId: 'estate1', unitId: 'a1', asOf: '2026-11-24',
  now: '2026-11-24T12:00:00Z',
  lastSuccessfulSyncAt: '2026-11-24T11:59:00Z'
});
// Backend/läsadapter levererar dessa till befintlig läsmodell, aldrig klientorder.
```

`ingest()` returnerar `applied`, `duplicate`, `unchanged`, `ignored` eller
`quarantined` samt vid avvikelse `code`. Indata ändras inte; även karantän/inbox
måste sparas av värden. Återspelning efter rättad mappning kräver
`replayQuarantined:true`, samma eventId och samma payload. Rättat källinnehåll får
nytt eventId och högre källrevision. Inga automatiska retries eller bakgrundsjobb
startas av biblioteket. Testkontraktets `sourceRevision` är en decimalsträng;
Dataverse-ETag måste mappas av en verifierad adapter, aldrig jämföras mellan system.

Färskhet mäts från värdens senaste lyckade synk, inte från tidpunkten för senaste
avtalsändring. Uppdaterat-datum ändras inte vid midnatt eller dubblett. Projektorn
kan återköras efter driftstopp utan att skapa order eller provisionsunderlag.

## Verifiering och begränsningar

`node qa/estate-contracts.mjs` kör 32 offlinefall. `qa/estate-workspace.mjs` testar
DOM, befintlig läsmodell, beställningar, rollback, scenariots isolering och separat
uthyrningsstatus. `qa/user-roles.mjs` kontrollerar mottagningskvittot och bevarad
omladdning. Samtliga ingår i `npm test`.

`qa/estate-workspace-browser.py` kontrollerar bestånd, inflyttning, visningsel,
scenario, oförändrad domändata, omladdning och sidbredd vid 320/390/1440 px i CI.
Lokal browserkontroll har kontrollerat desktop och de olika datumen visuellt.
Aktuell körstatus dokumenteras i WORKLOG och PR:ns CI; detta dokument påstår
inte att externa systems kontraktstester är körda.

De 32 offlinefallen är **inte** samma sak som att alla specifikationens 30
systemacceptanstester är implementerade. Följande kräver kvarvarande arbete:

| Område | Återstår före verklig anslutning |
| --- | --- |
| Systemadapters | CRM-tabeller/fält, Gazelle-format och per-nätägares koder/besked ska verifieras; därefter transport, initial-/deltasynk och korrelation |
| Säkerhet | Serveridentitet, partner-/objektbehörighet och åtkomst vid ägarbyte; klientfilter/ren projektor är inte dessa kontroller |
| Beständighet | Databastransaktion, samtidighetsvillkor, inbox/outbox, cursor och omstart under verkligt avbrott |
| Drift | Retry/429/timeout, DLQ, larm, avstämning, nattlig projektion och mappningsändringar som kräver historikomprojektion |
| Orderåterkoppling | Verkliga delbekräftelser och affärs-idempotency key; lokalt skydd mot samma typ/datum ersätter inte detta |
| Nät | Verifierad anslutningsstatus och faktureringsansvar, inget härlett ur beställning |
| Startvillkor | Projektorn antar att affärsbekräftad start räcker. Om källan kräver separat aktiveringsbesked måste adapter/urval utökas innan anslutning |
| Ersättning | Verifierade aktiveringar och beslutad kickback, inga nya pengar från denna funktion |

Om framtida aktivering eller samtidiga avtal inte kan tolkas säkert ska adaptern
avskilja uppgiften. Implementera inte leverantörsspecifika gissningar i portalen.

## Återgång

Återställ PR:ns kodcommit vid behov. Nya fält är additiva och gamla lokala
handlingar oförändrade. Scenario saknar lagring. Ta inte bort sparade
`estateEvents`, `estateContractFacts`, bestånd, bilagor eller kunddemots separata
lagringsnyckel vid återgång.
