# D-03: gemensam lagring för en liten pilot

**Status: granskningsbart förslag, 14 oktober 2026. Ingen backend är införd.**
Beslutet gäller en separat nästa etapp. Nuvarande statiska portal, lokala data
och Sites-delning ändras inte av detta dokument. D-01–D-04 finns i
[beslutskön](../PILOT-DECISIONS.md); produktgränser i [DECISIONS.md](DECISIONS.md).

## Rekommenderat första steg

Bygg ett gemensamt inflyttningsärende för **ett fastighetsbolag och en utsedd
Kraftringen-handläggare**, först med syntetiska uppgifter. Partnern registrerar
manuellt eller från granskad Excel, bifogar dokument och förmedlar. Handläggaren
ser samma referens, begär komplettering och återkopplar i portalen. Partnern ser
svaret efter uppdatering. En sparad portalåterkoppling är inte ett skickat mejl.

Första etappen omfattar inloggning, serverstyrda medlemskap, ärenden, dokument,
historik och fungerande återhämtning. Därefter kopplas befintligt portal-CRM till
samma servermodell. Avtal/resultat/kickback förblir separata underlag. Beest,
Dynamics, e-signering, externa utskick och verkliga samtalsinspelningar ingår inte.

| Alternativ | Fördel | Villkor före val |
| --- | --- | --- |
| A: Sites-server med D1 och privat R2 | Nära befintlig portal och native Sites-identitet; litet separat API | Bekräfta att miljö, avtal, dataplacering, loggar, återställning och inloggning godtas för pilotdata. Sites måste exponera nödvändiga driftkontroller. |
| B: API/databas/dokumentlager i Kraftringens godkända miljö | Kan följa befintlig identitet, drift och dokumentprocess | IT behöver ange plattform, API-identitet, ansvarig driftägare och koppling till portalen. Ingen befintlig Azure-/Entra-lösning antas. |

**Rekommendation:** välj A för minsta tekniska pilot om dess villkor godkänns;
välj B om organisationens identitet eller driftkrav kräver det. Ett fungerande
Sites-login bevisar inte att miljön är godkänd för verkliga kunddokument. Ett
regionval i Cloudflare är inte bevis för att samma val går att styra via Sites.

Alternativ A kräver övergång från enbart statisk hosting till en Sites-serverapp
med API. Befintligt gränssnitt kan återanvändas, men dagens krav på helt bygglös
dist/ behöver uttryckligen avgränsas för den nya serverleveransen. Ingen sådan
ändring görs i denna PR. Använd då aktuell Sites-starter och dess migrationsflöde;
kopiera inte in ett eget parallellt OAuth-system.

## Identitet och rättigheter

Sites native inloggning ger servern en betrodd användaridentitet. Använd det
Site-specifika stabila användar-ID:t, inte e-post som databasnyckel. Serverns
requireChatGPTUser (eller startermotsvarighet) ska skydda varje API-operation.
Autentiseringsheaders får bara betros genom Sites verifierade ingress, aldrig
från en direkt publikt åtkomlig alternativ origin. Service-token är inte en
inloggad person. Avsaknad av identitet ger 401, inte en intern standardroll.

| Roll, förslag | Läsning | Skrivning |
| --- | --- | --- |
| Partneranvändare | Egna partnerns ärenden, partnerdelad historik och godkända bilagor | Egna utkast/kompletteringar, bilagor och uttrycklig förmedling enligt tillåtna övergångar |
| Handläggare | Endast tilldelade partnerorganisationer, inklusive interna anteckningar | Handläggningsstatus, dokumentbedömning och återkoppling; inga medlemskap |
| Portaladministratör | Medlemskap/konfiguration; ärendeåtkomst kräver separat tilldelning | Aktivera/återkalla medlemskap, partnerkoppling och roller; ändringar loggas |

Administratör utses uttryckligen. Första identitet och medlemskap etableras
kontrollerat av driftägaren och verifieras mot personens inloggning. Ingen
första-besökaren-blir-admin-regel. Sites-visningsinbjudan skapar inte automatiskt
partnerroll. Borttaget medlemskap gäller nästa anrop, även för gamla dokumentlänkar.

Servern härleder tillåtna partner-ID från membership, kontrollerar resursens
partner vid varje anrop och returnerar minsta nödvändiga fält. Partnerns demovy-
eller partner-ID i URL är aldrig behörighet. Interna anteckningar skickas inte
till partnerns klient alls. Otillåten/okänd resurs ger samma 404 för att inte
läcka andra partners existens. Skydda skrivningar mot cross-site-anrop med
session/CSRF-skydd enligt starter samt same-origin-kontroll; CORS är inte behörighet.

## Minsta datamodell

Alla ID:n skapas av servern. Tider är server-UTC; kundens kalenderdatum sparas
separat som datum. Använd foreign keys, index och parametriserade frågor.

| Tabell | Nyckelfält / syfte |
| --- | --- |
| users | id, native_subject (unik), display_name, disabled_at |
| partners | id, name, type, sales_audiences, crm_mode, revision |
| memberships | user_id + partner_id (unik), role, active; separat adminroll |
| moveins | id, partner_id, reference, godkända kund-/inflyttningsfält, status, next_actor, revision, created_by/at, updated_at |
| case_events | id, partner_id, movein_id, actor_id, event_type, visibility (partner/internal), godkänd ändring, timestamp; append-only |
| documents | id, partner_id, movein_id, object_key (unik), original_name, mime, bytes, sha256, upload_status, assessment_status, revision, timestamps |
| idempotency | actor_id + partner_id + operation + key (unik), request_hash, result_reference, created_at, expires_at |
| import_batches | id, partner_id, source_hash, state, actor_id; radresultat med klientrad-ID och serverreferens |
| crm_records / crm_events, etapp 2 | Befintliga CRM-fält + partner_id, revision, actor/tider; ingen koppling som automatiskt skapar avtal |

Barnposter använder sammansatt partner-/resursreferens så att ett dokument eller
event inte kan länkas till fel partner. Spara bara fält som fastställs i D-02;
inför inte personnummer eller nya känsliga fält för att de skulle kunna bli användbara.
Partnern kan inte ändra partner_id, interna fält, revision eller actor_id fritt.
CRM:s byte av arbetssätt/segment bevarar tidigare rader enligt P-02.

## API och samtidighet

| Metod / resurs | Beteende |
| --- | --- |
| GET /api/me | Identitet, tillåtna partners/roller och tillåtna åtgärder |
| GET /api/partners/:id/moveins | Serveravgränsad, paginerad lista med explicit filter/observerad uppdatering |
| POST /api/partners/:id/moveins | Validera godkända fält, skapa utkast med Idempotency-Key |
| GET/PATCH /api/moveins/:id | Läs rätt fält; PATCH kräver aktuell revision (If-Match) |
| POST /api/moveins/:id/actions | Explicit åtgärd, t.ex. förmedla/begär komplettering/återkoppla; servern kontrollerar roll, status och revision |
| POST /api/moveins/:id/documents | Behörig binär uppladdning, tydlig pending/ready/rejected-status |
| GET /api/documents/:id/content | Ny behörighetskontroll; streama privat fil som attachment, no-store |
| POST /api/partners/:id/imports | Validerade, uttryckligt valda Excelrader; ett idempotent resultat per rad |

Läs servern vid öppning/uppdatering; en tydlig Uppdatera-knapp räcker i första
etappen. Ingen websocket/offlinekö krävs. UI visar sparad först när servern
bekräftat. Vid osäkert nätresultat läser klienten status med samma idempotensnyckel
innan den försöker igen. Samma nyckel + samma innehåll ger samma resultat;
ändrat innehåll med samma nyckel ger konflikt. Nycklars giltighet och importens
längre återförsöksfönster ska vara dokumenterade så att utgång inte orsakar dubbletter.

Optimistisk låsning: uppdatera bara när revision matchar, annars 409 med möjlighet
att läsa om utan att förlora egen inmatning. Statusändring, ny revision och historik
skrivs atomärt; misslyckad revisionskontroll får inte lämna ett event. För D1 måste
villkor/constraints och transaktionsgräns bevisas med samtidiga anrop, inte antas
från en följd av separata requests. Tillåtna statusövergångar fastställs med D-02.

Import bevarar originalradnummer och visar fel/registrerat/tidigare registrerat.
Matchning inom samma partner fastställs i D-02; olika partners dedupliceras inte
mot varandra. En felaktig rad får inte blockera senare korrekt rad. Ingen
kund-/avtals-/ekonomipost skapas automatiskt av import eller handläggning.

## Dokument och återhämtning

R2 är privat; ingen publik bucket eller varaktig publik URL. Föreslagen första
bilagetyp är PDF, max 10 MiB per fil och fem per ärende, **tekniska förslag för
D-02**, inte redan beslutade regler. Kontrollera storlek, signatur/filtyp och namn
på servern, generera egen objektnyckel. Godkänd skanning/karantän behövs innan fil
kan laddas ned; om lämplig kontroll saknas öppnas inte verklig dokumentpilot.
En godkänd filkontroll är inte verksamhetens godkännande av fullmakten.

Databas och objektlager delar inte transaktion. Skapa därför pending-post,
ladda upp till unik nyckel, verifiera hash/storlek/kontroll och markera ready.
Klienten ser väntande/misslyckat och kan återuppta säkert. Ett schemalagt,
auditloggat städjobb hanterar föräldralösa objekt och avbrutna uppladdningar efter
en beslutad karenstid. Ingen ersättning skriver över gammalt original: ny bilaga
får nytt ID, föregående version hålls enligt beslutad retention.

Original-Excel behöver inte sparas: tolka lokalt, skicka granskade rader och en
importmanifest/hash. Om verksamheten kräver originalfil är det separat beslut
med samma åtkomst/radering som övriga dokument. Lagra inga filer i Git, loggar
eller analytics. Åtkomstlogg innehåller aktör/resurs/åtgärd/resultat, inte dokumenttext.

## Migrering, drift och återställning

1. Behåll vanlig lokal demo i separat miljö. Skapa aldrig backendposter av
   demofrön eller automatiskt vid första inloggning. Riktiga API:t accepterar
   inte demo-/internrollen från klienten.
2. Börja pilotdatabasen tom med godkänd partner och medlemskap. Överför bara
   uttryckligt valda och granskade lokala ärenden. Visa förhandsgranskning av
   partner, fält, dokument och bortval; lokala app-ID:n blir importreferenser.
3. JSON-export räcker inte för bilagor. Använd separat dokumentmanifest med
   hash, filstorlek, lokal referens och server-ID. Hantera saknade binärer som
   saknade; markera inte en fil som överförd före serverkvittens. Import kan
   återupptas utan dubletter. Behåll lokal källa tills avstämningen godkänts.
4. Kör versionssatta, schema-only-migreringar genom vald Sites-starter före
   release; aldrig DDL i vanliga API-anrop. Ändra inte redan tillämpade migrationer.
   Utgå från att en avbruten deploy kan ha ändrat schema: kompatibla tillägg
   först, destruktiv städning senare efter backup/explicit granskning.
5. Återställningsplan omfattar både databas, dokumentmanifest och objekt.
   D1 Time Travel är ett möjligt databasverktyg; verifiera faktisk tillgång,
   retention och kontroll via Sites. Det återställer inte automatiskt R2-filer.
   Ordna separat objektbackup/export med beslutad retention och återställning.
   Versions-ID i appen är inte i sig backup mot lagringsförlust.
6. Föreslaget pilotmål: högst ett dygns dataförlust och återställning inom en
   arbetsdag; driftägaren fastställer målen. Kör ett verkligt återläsningstest
   av syntetiskt ärende + bilagor i isolerad miljö och dokumentera utfall.
7. Logga fel med korrelations-ID. Övervaka misslyckad sparning, dokumentkontroll,
   städning och backup. Namnge driftägare, supportväg och incidentrutin före pilot.
   Återkalla medlemskap utan ompublicering. Ange hur retention även når backup.

Kostnadsunderlag: API-anrop, D1 lagring/läsning/skrivning, R2 GB/operationer,
skanning, loggar/backup och driftinsats. Mät med syntetisk testserie och sätt
godkänd budget/larm. Ingen obekräftad gratisdrift eller prissumma utlovas.

## Acceptans före verkliga uppgifter

- Två separata inloggningar (partner och handläggare) ser samma ärendereferens,
  komplettering och återkoppling efter uppdatering, på varsin enhet/session.
- Partner A kan inte läsa/ändra partner B:s ärende, fil eller event via gissat
  ID, manipulerad URL/body/filter eller masshämtning. Interna fält saknas även
  i nätverkssvar. Okänd/avstängd identitet och återkallad roll nekas.
- Två samtidiga ändringar ger en sparning och en synlig konflikt; inga borttappade
  anteckningar eller felaktiga event. Nätavbrott/upprepat klick/import ger samma
  referens och högst en post/händelse för samma begäran.
- Riktig syntetisk XLSX och PDF provas: felaktiga rader, ändrade filer, avbruten
  uppladdning, överstor fil, ogiltig typ, skanningsfel och saknade dokument.
  Felstatus får inte döljas som lyckad uppladdning eller giltig fullmakt.
- Datalagring fungerar efter omstart och annan session. Avslag/nätfel lämnar
  inmatning återupptagbar. Ingen lokal framgångskvittens används som serverbevis.
- Status/CRM-Vunnen/serviceåtgärder skapar inga avtal, intäkter eller kickback.
  Legacydata och sparade segment består vid överföring och konfigurationsbyte.
- Återställ syntetiskt ärende, historik och rätt dokumenthash från separat backup;
  verifiera också medlemskap/rättigheter och beslutad radering. Gamla fil-URL:er
  ger inte åtkomst efter återkallande.
- Ansvariga godkänner testprotokoll, kända avvikelser och drift-/dokumentrutin.
  Fiktiv testserie är inte belägg för juridiskt giltiga fullmakter eller kundnytta.

## Konkreta beslut för nästa etapp

| Beslut | Färdigt förslag att ta ställning till |
| --- | --- |
| D-01 | En namngiven fastighetspartner, en handläggare och administratör; godkända inloggningsidentiteter. |
| D-02 | Fastställ minsta fält, tillåtna statusövergångar, fullmaktskontroll och föreslagna filgränser; avgör om original-Excel behövs. |
| D-03a | Välj A eller ange godkänd miljö för B. Bekräfta identitet, dataplacering, avtal, serveråtkomst, logg/backup och ansvarig driftägare. |
| D-03b | Bestäm lagring/radering och återställningsmål per ärende, dokument och logg; godkänn budget och avgränsat byggmandat. |
| D-04 | Behövs först när verkligt avtals-/ekonomiunderlag ska kopplas på; det ska inte hittas på i backendbygget. |

När D-03 byggmandat finns: leverera medlemskap + gemensamt syntetiskt ärende,
därefter dokument/import/konflikter, sedan återställning och acceptans. Beslut om
verklig pilot tas efter protokollet. Portal-CRM kan därefter anslutas utan att
blanda säljstatus med avtalsbekräftelse. Detta dokument startar inga tjänster.

## Tekniska källor, kontrollerade 14 oktober 2026

- Sites aktuella utvecklaranvisningar i denna miljö: storage (D1/R2, hosting,
  schema-only-migreringar) samt identity-and-secrets (native identitet och
  serverauktorisering). Dessa är plattformsanvisningar, inte besked om godkänd pilotdrift.
- [D1 Worker API](https://developers.cloudflare.com/d1/worker-api/): parametriserade
  operationer/batch. Implementationens atomicitet behöver egna samtidighetstester.
- [D1 Time Travel](https://developers.cloudflare.com/d1/reference/time-travel/):
  databasåterställning; dokumentbackup måste hanteras separat.
- [R2 data location](https://developers.cloudflare.com/r2/reference/data-location/):
  location hints och jurisdiction är olika kontrollnivåer. Sites faktiska konfiguration
  måste bekräftas; detta underlag lovar ingen viss dataplacering.
