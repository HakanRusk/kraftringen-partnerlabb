# Kraftringen Partnerportal – frontendprototyp

## Bekräftad inriktning: resultat och utbildning (2026-10-11)

Källa: Ludwigs direkta förtydligande i uppgiften. Säljpartnernas affärer och nästa aktiviteter hanteras utanför Partnerlabb. Kraftringen följer resultat, Kunder & avtal, Insikter och villkorade scenarier under Partners. Säljpartners använder utbildning och stöd. Detta ersätter äldre mål om aktiv kundregistrering, pipeline, offertarbete och återkopplingsflöden för Savera/Face2face i portalen. Äldre lokala underlag och utkast bevaras; de blir inte resultathistorik. Fastighetsbolagens registrering, fullmaktsbilagor, förmedling och handläggning behåller operativa nästa steg. Ingen ny verksamhetsregel eller integration införs.

En klickbar partnerportal med **Kraftringens interna resultatöversikt som huvudvy** och separata arbetsytor för säljpartners, fastighetsbolag och företag med personalavtal. Designen följer referensbildernas marinblå och petrolfärgade uttryck.

Savera säljer Kraftringens elhandelsavtal till företagskunder och Face2face till konsumenter, enligt användarens bekräftelse. Face2face använder Beest; prototypen prioriterar nu intern resultatuppföljning och har ingen integration med Beest. Saveras eventuella användning av partnerarbetsytan kan utvecklas senare. Befintliga arbetsflöden bevaras som lokala testvyer. Fastighetspartners erbjuder inflyttningsservice vid hyresavtal och sköter allt aktivt arbete i portalen: Excel-import eller manuell registrering, fullmaktsbilagor och förmedling till Kraftringen. Hyresgästen har inga aktiva portalsteg. Kraftringen hanterar elhandel, nödvändig elnätshantering och återkoppling. Partnerns egen elförbrukning är en separat affär. Fiber och andra produktområden ingår inte.

Denna etapp omfattar frontend med exempeldata. Flöden, pipelinesteg, fyra demoutbildningar och partnerresan är förslag att testa. Elakademin är en färdig innehållskurs, tillagd i båda säljpartnernas arbetsytor på användarens uppdrag. Backend och integrationer ingår inte nu; ingen byggplattform är vald.

## Elakademin – fullständig partnerutbildning

Öppna [Elakademin](https://kraftringen-partnerlabb.rosen123.chatgpt.site/elakademin.html)
med portalens befintliga åtkomst, eller välj Utbildning i säljpartnerns arbetsyta.
18 utförliga kapitel börjar utan förkunskaper och leder vidare till alla tio
produkter, produktval och kunddialog. Företagsspåret har 15 kapitel och
privatkundsspåret 12; de gemensamma kapitlen återanvänds mellan spåren.
Partnerns konfigurerade kundsegment styr ingången.

Materialet omfattar ungefär 26 500 ord, 38 lösta räkneexempel, 18 kundfall,
72 kapitelövningar med förklarat facit, 20 slutfrågor per spår och en ordlista
med 65 begrepp. Räkneverktyg visar förbrukningsvägt komponentpris och
prognosbaserad säkring i relation till faktiskt uttag. PDF-handbok och
redigerbar PowerPoint med utförliga talaranteckningar kan laddas ner:
139 sidor respektive 463 bilder. Alla 18 kapitel har färdiga Arthur-filmer,
sammanlagt 95 minuter, med animerad guide och förklarande diagram;
filmernas berättartext finns även i kapitlet. Produktfakta följer användarens
säljarunderlag från 10 oktober 2026 och bekräftelsen att Stabil utjämnar
endast den säkrade delen. Aktuell offert och avtal styr kundens egna villkor.

Bokmärken, egna anteckningar, testsvar och klarmarkering sparas endast i
användarens webbläsare. Självtesten är lärandestöd; ingen formell certifiering,
central resultatrapportering eller delad kundlagring införs. Syntetiska
räkneexempel är inga offerter. De fem äldre Academy-kurserna och biblioteket
för lyckade B2C-samtal bevaras. Tidigare förhandsvisning länkar till hela kursen.
Faktisk medie-, export-, test- och publiceringskvittens finns i WORKLOG.md.

Kursdata och de godkända berättarmanusen finns i `dist/elakademin-data.json`.
Dokument kan återskapas med `python tools/build-elakademin-documents.py`
(Pillow, ReportLab, python-pptx, pypdf och DejaVu Sans behövs). Reproducerbar
kurskontroll: `PARTNERLABB_QA_URL=http://127.0.0.1:4186 node qa/elakademin-course.cjs`
med lokalt startad server, Playwright och Chromium. Resultat och bilder
skrivs i en separat temporär katalog. Video-/källfakta dokumenteras i ASSETS.md.

## Aktiv pilotagent

[PILOT-MISSION.md](PILOT-MISSION.md) styr nästa etapp: förbered en enkel pilot
med ett fastighetsbolag och en Kraftringen-handläggare, och genomför nu
Ludwigs senaste uppföljningskrav för generiska säljpartnervyer under
Partners, valbara kundsegment och partnerns egna
kunder/kickback. Agenten arbetar i egna
grenar och PR:er med högst två färdiga förslag i väntan på granskning.
[PILOT-FACTS.md](PILOT-FACTS.md) visar vad som är bekräftat,
[PILOT-DECISIONS.md](PILOT-DECISIONS.md) vad som behöver beslutas och
[PILOT-ACCEPTANCE.md](PILOT-ACCEPTANCE.md) vilka flöden som behöver verifieras.
Samma befintliga timuppgift används. Detta sätter inte backend eller riktiga
kundärenden i drift; frontendens data är fortfarande lokala och fiktiva.

## Förslag: ett bredare fastighetssamarbete

Publicerat som **version 24** via PR #28. Förslaget är granskat på dator
och mobil; faktisk källrevision och publiceringskvittens finns i WORKLOG.

Ludwigs senaste uppdrag är att visualisera fastighetsbolaget både som
partner för inflyttningar och som möjlig företagskund för **fastighetselen**.
Öppna **Partners → vald fastighetspartner → Se samarbetsförslaget**, eller välj
**Samarbetet** i fastighetspartnerns egen arbetsyta. Sidan heter **Ert samarbete**. Alla fastighetsbolag
använder samma upplägg, inklusive nya lokala partnerprofiler.

Inflyttningsservice, egna kunder och kickback behåller sina befintliga
underlag. Fastighetselen får en separat del: den ska kunna samla partnerns
egna elavtal och anläggningar när sådant underlag finns. Avtal, volym,
kostnad och omfattning saknar ännu källa och visas som **—** och
**Underlag saknas**. Fastighetsinställningar visar inte vilka anläggningar
ett elavtal omfattar. Ett hyresgästärende eller grundval tecknar inget eget
fastighetselavtal.

Sidan visar också sex idéer för fortsatt dialog:

- Avlasta uthyrarna från hyresgästernas elfrågor.
- Göra elkostnaden begriplig redan i bostadsannonsen med underbyggda intervall.
- Upptäcka onödig förbrukning i fastigheterna.
- Undersöka elbehov och förutsättningar före lokaluthyrning.
- Samla elöversikten inför köp eller försäljning av fastighet.
- Bedöma laddning, solceller, batterier och styrning av elanvändningen.

Första diskussionen föreslås fokusera på hyresgästfrågor och onödig
förbrukning. Fokusval sparas endast som lokalt diskussionsunderlag för
vald partner i samma webbläsare, skilt mellan labb och kunddemo. De skickar
inget meddelande och beställer ingen tjänst. Idéerna är förslag att pröva,
inte färdiga tjänster eller utlovade besparingar.

Inflyttningens Excel/manuella registrering och fullmaktsbilagor bevaras.
Hyresgästen får inga nya portalsteg. Personalavtal är fortsatt en egen
partnertyp vars erbjudande och anmälningsflöde behöver verksamhetsunderlag.
Verifiering och eventuell publicering av denna kandidat kvitteras separat
i WORKLOG.md; tidigare version 23 av Elakademin ska bevaras.

## Visa kunddemot

Öppna https://kraftringen-partnerlabb.rosen123.chatgpt.site/?demo=inflyttning#demo
eller välj **Visa kunddemot** i portalens övre demolist. Samma privata
Sites-åtkomst gäller. Demot använder befintliga funktioner och fiktiva
uppgifter med fastighetsbolaget som ansvarig aktör. Den senaste arbetsmodellen
är två registreringsvägar; test-/publiceringskvittens för aktuell kandidat
finns i WORKLOG.md och GITHUB-STATUS.md.

1. Fastighetsbolaget väljer **Excel-import** eller **Fyll i själv**.
2. Partnern granskar hyresgästuppgifterna och bifogar befintliga fullmakter
   till rätt rad eller ärende. Hyresgästen gör inget i portalen.
3. Partnern förmedlar det kompletta underlaget till Kraftringen.
4. Kraftringen handlägger elhandel och elnät separat, begär vid behov
   komplettering och dokumenterar återkoppling.
5. Partnern följer återkopplingen. Kommersiellt resultat och kickback är
   separata exempelunderlag; serviceärendet ändrar inte ekonomin.

Guidens knappar byter moment/perspektiv. Registrering, bifogning, förmedling
och återkoppling kräver sina egna handlingar; navigation skapar inget ärende.
Savera och Face2face ligger kvar under **Partners** och ska använda samma interna uppföljning för sina respektive kundsegment.

**Börja om** i guiden återställer endast kunddemots exempeldata efter ett
uttryckligt val. `partnerlabb.customerDemo.v1` håller demoärenden separat
från `partnerlabb.portal.v2`. Nya partnerutkast använder
`partnerlabb.demo.partnerIntake.v1.<partner-id>:<läge>` i sessionStorage,
medan normala utkast använder `partnerlabb.partnerIntake.v1.<partner-id>:<läge>`.
Bilagor har motsvarande scope i IndexedDB. Ordinarie labbdata och äldre
utkast bevaras; omstart är ingen delad kundlagring eller riktig behörighetsstyrning.

Portalen har gemensam lokalt serverad Inter-typografi, större text och
kontroller, en tydligare fastighetsyta, läsbara ärendekort på mobil och en
intern resultatöversikt med nettobidrag, avtal och avtalad årsvolym främst.

## Gemensam säljpartneruppföljning under Partners

Senaste utvecklingskandidaten ersätter de globala kategorierna Savera och
Insikter med gemensamma vyer under **Partners**. Publiceringskvittens och
verifierad revision finns i GITHUB-STATUS.md och WORKLOG.md.

Välj **Partners → Savera eller Face2face → Kunder & avtal**. Samma rapport
används för alla säljpartners; **Insikter** hör till den valda partnern.
Välj år, månad eller vecka och filtrera på elavtal, säljare och region.
En partner med båda kundsegmenten kan även filtreras på **Företag** eller
**Konsument**. Partnerns identitet följer länken och filtervalen hör till
rätt partner och labb-/demoyta.

Tre huvudmått skiljer nya avtal, avtalad årsvolym i MWh och aktiva kunder.
Kundlistan växlar mellan **Periodens avtal** och **Aktiva kunder** och visar
kundens produkt, segment, datum, säljare, region och status. Sökning och
statusfilter gäller bara kundlistan; rapportens period-, segment-, produkt-,
säljar- och regionurval styr nyckeltalen och Insikter.

### Skapa och ändra partner

Välj **Partners → Skapa partner** och därefter samarbetstyp:

- **Säljpartner:** välj **Företag (B2B)**, **Konsument (B2C)** eller **båda**.
  Kundsegmentet kan senare ändras med befintlig kundhistorik bevarad.
- **Fastighetsbolag:** den nya partnern får den befintliga
  inflyttningsservicen med Excel/manuell registrering, fullmaktsbilagor,
  förmedling och egna kunder/kickback. Kvartspris är initialt grundval under
  Avtalsval; Opti och Rörligt månadspris är alternativ. Ett grundval är ett
  önskemål, ingen avtalsteckning.
- **Personalavtal:** ett företag blir partnerkanal för ett erbjudande till
  sina anställda och får en egen översikt. Företagets egen elförbrukning är
  en separat B2B-affär. Erbjudande, produkter/villkor, anmälningsprocess och
  eventuell aktivitet för arbetsgivaren eller de anställda behöver
  verksamhetsunderlag. Denna etapp skapar inget sådant flöde.

Alla tre ligger under **Partners**. Namnet kan ändras för samtliga typer;
en redan skapad partners typ behålls så att sparade underlag inte byter
verksamhetsspår. Säljpartnerns produktkatalog styrs av kundsegmentet:

- **Företag:** Rörligt pris, Kvartspris, Poolportfölj Trygg,
  Poolportfölj Offensiv, Individuell portfölj och Kraftringen Stabil.
- **Konsument:** Fastpris, Vintersäkrat, Opti, Kvartspris och Rörligt pris.
  Den senaste konsumentlistan ersätter tidigare Opti/Kvartspris-urval.
- **Båda:** samma partner kan följas i båda segmenten; segmentet skiljer
  exempelvis ett företagsavtal med Kvartspris från ett konsumentavtal med
  samma produktnamn. Ändrad konfiguration skriver inte om kundhistoriken.
  Rapportkatalogen omfattar också tidigare avtalssegment, så historiska
  avtal fortfarande går att hitta när konfigurationen ändras.

Partnerprofiler med typen `sales`, `field`, `property` eller `employee`
sparas lokalt i `state.partnerProfiles`, skilt mellan vanlig labbyta och
kunddemo. En ny partner har inget resultatunderlag förrän ett
sådant finns: visa **Underlag saknas** i stället för påhittade nollresultat,
kunder, avtal, prognoser eller kickback. En ny fastighetspartner börjar med
egna tomma ärenden; en ny personalavtalspartner saknar kommersiellt underlag
och lånar inga demoresultat. Profilen skapar inget verkligt partneravtal,
ingen inloggning och ingen serverstyrd behörighet.

Savera är den bekräftade företagspartnern och Face2face den bekräftade
konsumentpartnern. Face2face arbetar fortsatt i Beest; detta är intern
uppföljning utan integration med eller ersättning av Beest. Saveras
framtida användning av portalen som säljverktyg är inte beslutad.

### Insikter och mått

**Insikter** använder samma rapporturval och visar avtalspopularitet,
observerad kundtid och ett scenario vid fortsatt försäljningstakt. Churn
efter avtalsstart och bortfall före start följs separat med egna baser.
Filter ändrar presentationen, inte kunddialoger, serviceärenden eller
sparade kommersiella regler.

- **Nya avtal:** avtal stängda under vald observerad period. Kund- och
  avtalsidentiteter är separata begrepp; i de fasta försäljningsexemplen
  har varje avtalsrad en unik kundidentitet.
- **Aktiva kunder:** unika kunder med påbörjat, ej avslutat avtal vid
  vald periods observerade slut, även från tidigare år. Visa alltid
  beståndsdatumet; periodens nya avtal och aktiva kunder är olika mått.
- **Avslutad kundtid:** tid från avtalsstart till avslut för kunder som
  lämnade under vald period. **Aktiv kundtid** är observerad ålder vid
  periodslut för de ännu aktiva kunderna. Den förutsäger inte när de lämnar
  och är inte uppmätt slutlig kundlivslängd för hela kundbasen.
- **Churn efter start:** avgångar ur samma kundbas som var aktiv vid
  periodstart, dividerat med den basen. Års-/kvartalsmått summerar inte
  månaders öppningskohorter eller procentsatser.
- **Bortfall före start:** avbrutna avtal bland periodens sålda avtal,
  observerade fram till rapportens angivna datum. Färska kohorter är
  fortfarande under observation; saknad nämnare är saknat underlag.
- **Fortsatt tempo:** valda periodens nya avtal per observerad kalenderdag
  används för dagarna efter 7 oktober till 31 december. Scenariot lägger
  denna möjliga fortsättning till observerat årsutfall i samma partner-,
  segment-, produkt-, säljar- och regionurval. Vald historisk månad/vecka
  är taktbasis; prognoshorisonten börjar alltid efter datadatumet.
  Ingen framtida churn, förstartsbortfall, pris eller kickback räknas fram.
  Saknat observerat underlag eller inga avtal ger inget scenario.

Datadatum är **7 oktober 2026**. Året visar 1 januari–7 oktober, oktober
visar 1–7 oktober och den sista veckan visar endast observerade dagar.
Vecka 1 går över årsskiftet; dagar före 1 januari har inget försäljnings-
underlag och räknas inte som nollförsäljning eller observerade basdagar.

`dist/savera-data.js` återanvänds som generiskt, fast och fiktivt
kund-/avtalsunderlag via `P.partnerSalesData.forPartner(id)`; befintliga
Savera-API:er bevaras som kompatibilitetsingångar. Filnamnet innebär ingen
separat Savera-modul i menyn.
Grundexemplet Savera har 207 nya avtal 2026, 8 175 MWh avtalad årsvolym och
134 äldre exempelkunder. Det publicerade version 15-underlaget hade 305
aktiva exempelkunder den 7 oktober; alla dessa värden är exempel, inte
verkliga affärsresultat. Äldre kohorters datum är inget verkligt kundutdrag.
Det publicerade Face2face-underlaget behåller tidigare månadsutfall: 437 nya
exempelavtal 2026 och 1 804 MWh avtalad årsvolym. Femproduktsfördelningen
är fiktiv. 785 kunder är aktiva vid årets start; fyra separat märkta äldre
väntande avtal börjar 2026. De hör till en fiktiv kökohort, inte till
2026 års nya försäljning eller öppningsaktiva kundbas. Denna åtskillnad
stämmer av 399 avtalsstarter med 990 aktiva kunder vid 7 oktober utan att
ändra de tidigare manuella månadsaggregaten. Verkliga källor och
måttdefinitioner behöver fastställas enligt D-04.

## Fastighetspartnerns kunder och kickback

Välj **Kunder & kickback** i fastighetspartnerns meny. Års- och månadsval
visar partnerns egna nya kunder från det separata avtalsunderlaget och
avstämd kickback, inklusive redan utbetalt. Utbetalt, kvar på avstämda
poster och under avstämning visas separat. I dessa fasta exempel motsvarar
ett nytt elhandelsavtal en ny kund; det är en demodefinition som behöver
riktig kund-/avtalsidentifiering i nästa etapp.

Serviceanmälningar och hjälpta inflyttare visas separat. En ny Excelrad,
registrering eller slutförd handläggning skapar ingen kund eller kickback
på resultatsidan. Årsvyn visar 1 januari–7 oktober 2026; oktober har endast
1–7 oktober. Kickback kommer från egna manuella periodposter och har
föreslagna statusar, inga uppfunna ersättningssatser. Saknad post visas
som **Underlag saknas**, inte ett verkligt nollbelopp. Interna kostnader
eller nettobidrag visas inte här. Partneravgränsningen är demovisning,
inte riktig serverstyrd behörighet.

## Starta lokalt

Kör från projektroten:

```sh
python -m http.server 8000 --directory dist
```

Öppna <http://localhost:8000>. Appen består av vanlig HTML, CSS och JavaScript i `dist/`; inga paket eller byggsteg krävs.

## Lärdomar från partnerplattformar

[BENCHMARK.md](BENCHMARK.md) jämför officiellt dokumenterade arbetssätt hos Salesforce, Impartner, ZINFI, PartnerStack och impact.com, kontrollerade 7 oktober 2026. Det är inspirationsunderlag, ingen världsrankning eller vald plattform.

Arbetsvyerna får en kort lista med nästa handling, vem som behöver agera och direktlänk till befintligt ärende. Listan härleds från aktuell lokal data; den skapar eller sparar inga separata uppgifter. Turordningen och handlingarna är testförslag utifrån status och sparat nästa steg, inte fastställda befogenheter eller tidslöften. Internt ligger kommersiella fakta och måttdefinitioner först. Fastighetsspåret låter partnern registrera via Excel eller manuellt, koppla fullmaktsbilagor och rätta underlaget vid komplettering. När en komplettering förmedlas på nytt avslutas partnerns tidigare kompletteringsplan i aktivitetshistoriken; Kraftringens arbetslista visar därefter en ny mottagningsinsats utan att ärva partnerns datum.

## Arbetsplatsens vyer

| Vy | Det går att testa |
| --- | --- |
| Kraftringens resultatöversikt | Resultatbidrag före partnerkostnad, partnerkostnad, nettobidrag, nya avtal och avtalad årsvolym i MWh. Välj månad, kvartal eller år, filtrera partnertyp, jämför utfall och exportera ekonomiska exempel som CSV. Framtida potential visas separat. |
| Partners & partnerprofil | Sök och sortera partners; skapa eller ändra en lokal partnerprofil med kundsegment företag, konsument eller båda. Intern ansvarig, nästa steg, uppföljningsdatum och anteckning bevaras. |
| Partners → Kunder & avtal, internt | Gemensam säljpartneruppföljning av nya avtal och avtalad års-MWh per år/månad/vecka, segment/produkt/säljare/region samt aktivt bestånd. Kundlista med varje kunds produkt och datum. Ny partner utan underlag visar saknat resultat, inte noll. |
| Partners → Insikter, internt | Vald partners rapporturval, avtalspopularitet, avslutad kundtid separat från aktiv kunds ålder, separata churn-/förstartsbortfallsmått och scenario vid fortsatt tempo till årets slut. Alla underlag är fiktiva. |
| Saveras översikt & pipeline | Nyckeltal från kundernas exempeldata, nästa steg, aktivitetshistorik och affärer per föreslaget steg. |
| Företagskunder | Registrera företag eller BRF, söka och filtrera, dokumentera kontakt och nästa steg. Internt team tilldelar demoansvarig, ändrar status eller pipelinesteg och delar återkoppling. |
| Offerter & avtal | Offertstudion har fyra steg: **Välj område → Beskriv behov → Välj kund → Granska & spara**. Sparade behovsunderlag kan öppnas igen, hämtas som TXT och markeras som skickade i en simulering. |
| Avtal & dokument | Prova lokala demosteg för fullmakt, avtal och signering samt öppna dokumentbiblioteket. |
| Kundsidor | Skapa och redigera kundsidans rubrik, introduktion, bild och kontaktknapp. Förhandsgranska och prova kontaktformuläret. |
| Partner Academy | Elakademin med sex textade kapitelfilmer, kapiteltext, filmmanus, tolv självtestfrågor med facit och PDF-kundguide. Därutöver fyra bevarade demokurser med tre textmoment vardera. Kategorifilter, bokmärken, klarmarkering och testsvar sparas lokalt per partner. En anmälan till en exempelgenomgång kan markeras i demo. |
| Material & kampanjer | Filtrera, förhandsvisa och hämta fyra TXT-mallar samt läsa en exempelbrief för kampanjplanering. |
| Provision | Visar öppna beslut och saknat underlag. **Ingen ersättning beräknas.** |
| Affärsutfall, internt | Periodvisa nya avtal och avtalad årsvolym, partneranpassad fördelning på elavtal, säljare och geografi. Face2face visar churn och bortfall före start separat; fastighetspartners visar anmälningar och hjälpta nyinflyttare separat från elhandelsavtal. |
| Kickback, internt | Manuella exempelposter per partner och period med avstämnings- och betalningsbelopp. Ingen ersättning beräknas från affärer eller ärenden. |
| Resultatrapport, internt | Ekonomiska nyckeltal och tabell för vald period och partnerurval samt CSV-export av exempelutfall. |
| Rapporter, säljpartner | Antal kunder och affärer per steg, aktivitetslogg och JSON-export av kunddata, offertutkast och kundsidor för vald demovy. |
| Partnerresan, endast internt | Följ varje partner separat genom åtta föreslagna steg: Rekrytera, Onboarda, Certifiera, Aktivera, Sälja, Leverera, Utveckla och Behålla. Två interna testaktiviteter per steg och exempelplacering kan sparas lokalt. |
| Kunder & kickback, fastighetspartner | Partnerns egna nya elhandelskunder och manuellt redovisade kickback med års-/månadsfilter. Avstämt, utbetalt, kvar och under avstämning; hjälpta inflyttare separat. Ingen automatisk ersättning från serviceärenden. |
| Fastighetsbolagets arbetsyta | Välj Excel-import eller manuell registrering, bifoga befintliga fullmakter och sök eller öppna lokala serviceärenden. Förmedla komplett underlag, lämna komplettering och följ Kraftringens delade återkoppling. |
| Inflyttningsärenden, internt | Filtrera på partner och ärendestatus. Följ elhandel, elnät och erbjudandeval separat, tilldela ansvarig, begär komplettering och skriv delad återkoppling eller intern anteckning. |
| Partnerns inflyttningsregistrering | **Excel:** ladda upp .xlsx, granska radfel och dubbletter, koppla fullmakter och registrera uttryckligt. **Manuellt:** ange fiktiv kontakt, bostad och inflyttningsdatum, bifoga befintlig fullmakt och registrera underlaget. Hyresgästen har inga aktiva steg. Avtal och ekonomi skapas inte från registreringen. |
| Hjälp & support / Test & beslut | FAQ, lokala testförfrågningar, öppna beslut, dataexport och återställning av exempeldata. |

Vid vanlig öppning visas den interna Kraftringen-vyn först. En äldre inflyttningslänk öppnar partnerns registreringsyta. Partnerns meny anpassas efter partnertyp. Interna testanteckningar döljs i partnervyerna. Varningen för identiska kundnamn är en testhjälp; regler för dubbla registreringar är inte beslutade.

| Partner i registret | Hur namnet används |
| --- | --- |
| Savera (`syd`) | Bekräftad partner för företagsförsäljning. Företagsaffärer och offertunderlag; alla statusar och resultat är exempel. |
| Face2face (`vast`) | Bekräftad partner för konsumentförsäljning. Separata konsumentunderlag med återkoppling; alla statusar, kanaler och resultat är exempel. |
| Exempelfastigheter AB (`estate1`) | Fiktivt fastighetsbolag med inflyttningsflöde. |
| Exempelbo Förvaltning (`estate2`) | Fiktivt fastighetsbolag med separat inflyttningsflöde. |

## Testa ett sammanhängande flöde

1. Börja i Kraftringens resultatöversikt och jämför alla partners med en vald partner. Anteckna exempelvärdena för avtal och nettobidrag samt period och urval.
2. Öppna Savera eller Face2face under Partners. Kontrollera Kunder & avtal och Insikter med period- och segmentfilter; öppna partnerns utbildning och stöd.
3. Kontrollera att säljpartnerns gamla affärslänkar går till översikten och att inga kunddialoger blir nästa-steg-uppgifter. Partnerresan avser samarbetet, inte partnerns affärsaktiviteter.
4. Öppna ett fastighetsbolag och välj **Fyll i själv**. Ange fiktiva kontakt-, bostads- och inflyttningsuppgifter och bifoga ett fiktivt fullmaktsdokument. Registrera underlaget uttryckligt. Prova också **Excel-import**: hämta exempelmall, ladda upp filen, granska rader/fel/dubbletter och koppla befintliga fullmakter före registrering. Avbruten granskning ska inte skapa ärenden.
5. Återgå till fastighetsbolagets **Inflyttningsärenden** och förmedla det nya underlaget till Kraftringen. Öppna Kraftringens interna **Inflyttningsärenden**, prova separat handläggning för elhandel och elnät samt dokumentera erbjudandeval och återkoppling. Kontrollera återkopplingen från partnersidan och ladda om för att kontrollera lokal lagring.
6. Kontrollera att avtal och nettobidrag är oförändrade för samma period och urval. Serviceanmälan, förmedling och slutförd demohandläggning skapar inga verkliga kunder, avtal eller intäkter.

Säljpartnerns Academy och stöd är aktiva. Äldre offertstudio, dokumentdemosteg och kundsidor finns kvar i källan för databevarande, men öppnas inte som aktiva arbetsflöden.

## Lokal data och demosteg

Använd enbart påhittade kund- och hyresgästuppgifter. Sparad testdata ligger i `localStorage` för aktuell webbplats och webbläsare under `partnerlabb.portal.v2`. `commercial.management` sparar intern partneruppföljning och partnerresans markeringar, `moveins` sparar serviceunderlag och äldre intresseanmälningar och `propertySettings` sparar fastighetsbolagets presentation. `partnerProfiles` kompletterar grundregistret med lokalt skapade eller ändrade partnerprofiler, typ (`sales`, `field`, `property`, `employee`) och säljkundsegment. Dessa kompletterar tidigare kunddata; ändrad partnerkonfiguration skriver inte om tidigare kund- eller avtalssegment. Gamla `journey`-markeringar bevaras i datan men visas inte i den nya interna partnerresan.

Manuella partnerutkast och Excelgranskningen är inte registrerade
serviceärenden. Utkast för lägena `manual` och `import` använder flikens
sessionStorage: `partnerlabb.partnerIntake.v1.<partner-id>:<läge>`, eller
`partnerlabb.demo.partnerIntake.v1.<partner-id>:<läge>` i kunddemot. Registrera först efter ett uttryckligt val. Utkast, bilagor
och registrerade poster ska knytas till rätt partner och aktuell demo-/labbyta.
Sparmeddelanden ska beskriva vad som faktiskt sparats eller misslyckats.
Äldre `partnerlabb.moveinDraft.v1.<partner-id>` och
`partnerlabb.demo.moveinDraft.v1.<partner-id>` bevaras utan att tolkas om
till ny fullmakt eller färdig förmedling. Lokal lagring delas inte mellan
personer eller datorer; använd fortsatt endast fiktiva uppgifter.

Fullmaktsfilernas innehåll lagras lokalt i IndexedDB-databasen
`partnerlabb.moveinAttachments.v1`, store `files`, med scope `demo` eller
`normal`. Ärendet sparar bara filmetadata och dokumentkoppling. JSON-exporten
innehåller inte filernas innehåll och är ingen fullständig dokumentbackup.
Bifogning innebär inte juridiskt giltig fullmakt eller verifierat samtycke.

Om giltig v2-data saknas läses tidigare kunddata från `partnerlabb.active.v1` på samma webbplats; kunder utan pipelinesteg får **Kunddialog**. Den gamla v1-posten raderas inte. Återställning tar bort lokala teständringar och laddar portalens exempeldata igen.

Två datorer delar inte data och öppna flikar synkas inte automatiskt. JSON-exporten är ett granskningsunderlag, ingen synkronisering eller fullständig säkerhetskopia av alla moduler.

Ekonomiskt utfall ligger som manuella exempelvärden i `commercial.js`, separat från kunddialoger och `moveins`. I demot är **nettobidrag = resultatbidrag före partnerkostnad − partnerkostnad**. MWh avser avtalad årsvolym för periodens nya exempelavtal, inte levererad el under perioden. Månad och kvartal har angivna jämförelseperioder; oktober och Q4 visar endast 1–7 oktober. Årsvyn visar 1 januari–7 oktober 2026 och saknar jämförbar föregående årsbas.

Framtida potential är en separat manuell ögonblicksbild och räknas inte in i utfallet. Inga belopp beräknas från elpris, avtalsvillkor, provisionsregler eller registreringar. **Intresseanmälan är varken avtal eller intäkt.** Ekonomiska definitioner och ersättningsregler behöver separat underlag.

Utskick, signering, kundsidepublicering, mötesbokning och supportkontakt är simuleringar. TXT-filer är demounderlag, inga kommersiella offerter, juridiska fullmakter eller avtal. Academy ger ingen verifierad partnercertifiering. Pris, aktuella produktvillkor, partnerns mandat och eventuell ersättning behöver stämmas av för den faktiska affären.

## Elakademin i säljpartnernas arbetsytor

**Elakademin – Förstå din elaffär** finns som en femte kurs under Utbildning för Savera (`syd`) och Face2face (`vast`). Kursen använder de sex slutliga kapitelfilmerna från den färdiga Elakademin, sammanlagt **11:29**, med svenskt tal och inbränd svensk text. Varje kapitel har full lästext, filmmanus, sammanfattning och två självtestfrågor med facit och förklaring. Inget nytt videomaterial har producerats för integrationen.

Kursen behandlar företagselhandel. Savera kan använda den som stöd inför företagsdialogen. För Face2face är den märkt som fördjupning: Lundverk AB är ett fiktivt företag och portföljuppläggen gäller företagskunder. Materialet beskriver inte Face2faces konsumentvillkor eller aktuella konsumenterbjudanden.

Bokmärken och kapitelmarkeringar använder befintliga `training[partner].bookmarks` respektive `training[partner].completed.elakademin`. Självtestens senaste val och kontrollstatus sparas separat i `training[partner].selfTests.elakademin[questionId]` som `{ selectedIndex, checked }`. Äldre kursframsteg och övrig portaldata behålls. Självtest ger återkoppling men klarmarkerar inte kapitel. Manuell klarmarkering verifierar inte filmvisning, ett godkänt slutprov eller partnercertifiering; ingen identitetskontroll eller delad rapportering tillkommer.

Kursen länkar till [hela Elakademin](https://kraftringen-elakademin.rosen123.chatgpt.site/) för räkneverktyg, slutprov och utbildningsintyg. Den utbildningens lokala framsteg sparas separat på dess egen webbplats och synkas inte med partnerportalen. Den 12-sidiga kundguiden ligger lokalt under `dist/assets/elakademin-kundguide.pdf`. Publika kundkällor och länkar till aktuella produktvillkor finns i kursdialogen.

Testa: Savera → Utbildning → Elakademin → se en kapitelfilm → kontrollera ett felaktigt och ett korrekt svar → klarmarkera ett kapitel → ladda om. Byt sedan till Face2face och kontrollera segmentmärkningen och separata framsteg. De fyra tidigare demokurserna, bokmärkena, kundunderlagen och ekonomiska exemplen ska finnas kvar.

Demovyerna styr visningen utan inloggning eller åtkomstskydd; även interna anteckningar finns i webbläsaren. Inga riktiga kunduppgifter eller anslutningar till Dynamics, Oneflow eller B2B Veckokollen används.

## Lyckade B2C-samtal i Utbildning

Partners med konsumenter som valt kundsegment får ett samtalsbibliotek i
**Utbildning**. Lägg till en ljudinspelning med rubrik, kategori och en kort
anteckning om vad som fungerade bra. Lyssna i portalen, sök eller filtrera
exemplen, redigera anteckningarna och ta bort ett exempel efter bekräftelse.
MP3, M4A, WAV, OGG och WebM stöds när webbläsaren kan spela ljudformatet;
högst 50 MB per fil. Filtyp och uppspelning kontrolleras före sparande.
Biblioteket börjar tomt; inga verkliga kundsamtal eller påstådda resultat
har lagts in. Använd fiktiva eller anonymiserade utbildningsexempel som får
användas i utbildningen.

Ljud och anteckningar sparas tillsammans i lokal IndexedDB, separat per
partner och mellan ordinarie portal och kunddemo. De finns kvar efter
omladdning i samma webbläsarprofil på samma webbplats. De delas inte mellan
datorer eller användare och ingår inte i portalens JSON-export. Rensning av
webbläsardata eller bekräftad återställning av den aktuella demoytan tar
bort dess lokala exempel. Delad lagring och hantering av verkliga
kundinspelningar behöver ett separat driftbeslut.

Den befintliga Elakademin, klarmarkeringar, självtest, kunder och
rapportunderlag bevaras. Ett samtalsexempel är utbildningsmaterial och
skapar inga kunder, avtal, certifieringar eller ekonomiska utfall.

Med en lokal server och Playwright/Chromium i utvecklingsmiljön kan
`node qa/b2c-calls.cjs` kontrollera uppladdning, uppspelning, filfel,
omladdning, partnerbyte, avbrott, återställning, mobil och tangentbord.
`PARTNERLABB_QA_URL` anger servern (standard `http://127.0.0.1:4183`);
`PARTNERLABB_QA_OUTPUT` anger valfri katalog för testresultat och bilder.
Testet använder en syntetisk WAV-ton, inga kundinspelningar.

## Den privata testlänken

Den privata Sites-testlänken delas med Håkans två e-postidentiteter som externa besökare (**viewers**). Det ger visningsåtkomst, inte rätt att redigera byggprojektet. Sites-delningen och appens demovyer är olika saker; demovyerna skapar inga säkerhetsgränser i appen.

Partnerns inflyttningsregistrering (`#property-intake`,
`#property-manual` och `#property-import`) ligger bakom samma
privata testlänk. Hyresgästen använder inte portalen; någon publik
hyresgästsida sätts inte i drift.

## Filer

- `dist/app.js`: gemensam navigation, lokal data, kunder, pipeline, översikt och rapporter.
- `dist/design.css`: gemensam typografi, kontrast, knappar och portalens visuella standard.
- `dist/demo.js` och `dist/demo.css`: kunddemots guidade moment och perspektivbyten.
- `dist/studio.js`: offertstudio och simulerade dokumentsteg.
- `dist/academy.js`: Elakademin, bevarade demokurser och lokala utbildningsframsteg/självtest.
- `dist/b2c-calls.js` och `.css`: lokalt ljudbibliotek med utbildningsanteckningar för konsumentpartners.
- `dist/elakademin-data.js`: sex slutliga kapitelfilmer, kapiteltexter, filmmanus, tolv originalfrågor och publika kundkällor.
- `dist/partner.js`: säljpartnerns kundsidor, material och support.
- `dist/commercial.js`: intern resultatöversikt och partneruppföljning med ekonomisk exempeldata.
- `dist/property.js`: fastighetsbolagens arbetsyta och ingång till partnerregistrering.
- `dist/property-intake.js` och `.css`: valet mellan registrering, manuellt underlag och Excelgranskning.
- `dist/movein-attachments.js` och `.css`: lokal bilagelagring och dokumentkoppling.
- `dist/vendor/exceljs-4.4.0.min.js`: lokalt paketerad ExcelJS för .xlsx-läsning och mall; MIT-licens följer med.
- `dist/movein-service.js`: gemensam ärendedata, förmedling, kompletteringar och Kraftringens interna handläggningsvy.
- `dist/partner-setup.js` och `.css`: lokala partnerprofiler, val av säljpartner/fastighetsbolag/personalavtal vid skapande samt ändring av namn och säljkundsegment.
- `dist/savera-data.js`: generiskt fiktivt kund-/avtalsregister för säljpartners, perioder, segment, bestånd, kundtid och scenario vid fortsatt tempo.
- `dist/savera-reports.js` och `.css`: gemensamma interna vyer `partner-sales` och `partner-insights` under Partners. Partner-ID bevaras som `?partner=<id>`; äldre Savera-/Insikter-länkar är kompatibilitetsingångar.
- `dist/property-results.js` och `.css`: fastighetspartnerns egna kunder, serviceutfall och manuella kickbackposter.
- `dist/business.js`: Saveras översikt och affärsunderlag för företagskunder.
- `dist/consumer.js`: Face2faces konsumentaffärer, återkoppling, säljstöd och försäljningsrapport.
- [ASSETS.md](ASSETS.md): bildkällor. Bilderna är illustrationer, inte antagna godkända Kraftringen-bilder.

## Gemensam utveckling med Codex och Claude

Användaren har uttryckligen valt att låta GitHub-repot vara publikt för kod,
instruktioner och arbetsminne. Destinationen är
<https://github.com/ludros93-prog/kraftringen-partnerlabb>. Källkod och bevarad
Git-historik har laddats upp och verifierats. Daniel har bekräftat
GitHub-kontot `daniel-smail`; hans verifierade åtkomst är publik läsning.
Skrivbehörighet är ännu inte bekräftad och behöver ordnas av repoägaren.
GitHub har nekat anslutningens försök att ändra behörigheten (403).

[GITHUB-STATUS.md](GITHUB-STATUS.md) visar faktisk aktiveringsstatus,
revisioner och behörigheter. GitHub är huvudkälla och Sites är publiceringsmål.
[RUNBOOK-SITES.md](RUNBOOK-SITES.md) bevarar den äldre rutinen som referens.

Ludwig använder ChatGPT/Codex och Daniel Claude Code. Utveckling sker på
egna grenar med pull requests till `main`. Även
masteragentens timpass lämnar gren och PR. Ludwig/Codex samordnar
integration och publicering till samma privata Partnerlabb-länk. Automatisk
synk är inte förutsatt och testdata ligger kvar i respektive webbläsare.

**Daniels ändringar kräver Ludwigs uttryckliga godkännande av den konkreta
PR:en och aktuella HEAD-SHA före integration till `main` och publicering.**
Godkännandet dokumenteras med PR och SHA i WORKLOG.md. Nya commits eller
integrationskorrigeringar i Daniels ändring kräver nytt godkännande av den
uppdaterade revisionen. Granskning och tester kan göras i förväg. Agenter får
inte skapa skenbart mänskligt godkännande genom Ludwigs GitHub-konto.
Oberoende, redan auktoriserat agentarbete behåller sitt befintliga mandat.

CODEOWNERS anger Ludwig som kodägare. GitHub har nekat anslutningen att
aktivera branch protection (403), så obligatoriskt kodägargodkännande är
ännu inte tekniskt verifierat. [GITHUB-STATUS.md](GITHUB-STATUS.md) visar
faktisk status; dokumentationen och CODEOWNERS är ingen verifierad teknisk
spärr utan en aktiverad skyddsregel.

[COLLABORATION.md](COLLABORATION.md) och [RUNBOOK.md](RUNBOOK.md) beskriver
det gemensamma arbetssättet. [CLAUDE.md](CLAUDE.md) importerar gemensamma
instruktioner. En PR-mall finns i `.github/pull_request_template.md` och en
GitHub Actions-mall för syntax och befintliga inflyttningsflöden finns i
`templates/github-actions-qa.yml`. Actions-mallen är inte aktiverad och krävs
inte för grunduppladdningen. Inget Actions-resultat eller automatisk
publicering har verifierats.

## Anpassade partnersidor

- **Savera:** översikt för företagsförsäljning, kunder/pipeline, offertstudio och nytt affärsunderlag med årsvolym, antal anläggningar, avtalsdatum, önskad start, underlagsfrågor och nästa steg. Underlaget sparas i `businessDetails` per kund. Det är inte en prisberäkning.
- **Face2face:** separat översikt för konsumentförsäljning, registrering och uppföljning av fiktiva konsumentunderlag, kompletteringsärenden, säljstöd och rapport över exempelantal. `consumerSales` hålls åtskilt från företagsrecord. Kraftringens interna vy kan användas för att simulera återkoppling.
- **Kraftringen:** ekonomiskt utfall först på respektive partnerprofil, därefter segmentanpassad operativ översikt. Intern partnerresa är fortsatt separat. Alla finansiella fixtures är oförändrade och påverkas inte av nya underlag.
- Academy anpassas till vald partners kundsegment och behåller lokala utbildningsframsteg.

Direktlänkar till arbetsytorna: `?workspace=syd#overview`, `?workspace=vast#overview` och `?workspace=estate1#overview`. Dessa väljer demovy och bevarar perspektivet efter omladdning. De ger inga nya behörigheter.

Befintlig v2-data behålls. Äldre Face2face-exempel med företag/BRF finns kvar i lagringen men visas inte som konsumenter och ingår inte i de nya företagsvyerna. Registrering av konsumentunderlag innebär varken ett ingånget avtal eller finansiellt utfall. Statuser, kanaler, underlagschecklistor och återkopplingsprocess är testförslag, inte fastställda affärsregler.

Testa: Savera → Affärsunderlag → spara nästa steg → kontrollera samma kunddialog. Face2face → registrera konsumentunderlag → Kraftringen/Konsumentaffärer → simulera återkoppling → Face2face/Återkoppling. Ladda om för att kontrollera lokal lagring och säkerställ att ekonomiskt utfall för samma period är oförändrat.

## Inflyttningsservice

Fastighetsbolag, BRF:er och förvaltare erbjuder service vid hyresavtal och
sköter allt aktivt arbete i portalen. De väljer mellan Excel-import och
manuell registrering och bifogar befintliga fullmakter. Hyresgästen fyller
inte i portalformulär. Partnern förmedlar underlaget; Kraftringen står för
elkompetensen, elhandelsavtal, nödvändig elnätshantering och återkoppling.
Partnerns egen elförbrukning är en separat B2B-affär.

### Två registreringsvägar

- **Manuellt:** fyll i en hyresgästs fiktiva namn, e-post, adress, postnummer,
  ort och inflyttningsdatum. Lägenhetsnummer och telefon är valfria demofält.
  Bifoga befintlig fiktiv fullmakt och registrera underlaget uttryckligt.
- **Excel:** använd en liten lokal .xlsx-mall eller en fil med dess kolumner.
  Granska radfel och dubbletter före registrering. Koppla varje fullmakt till
  rätt rad/ärende och välj uttryckligt att registrera. En förhandsgranskning
  eller avbruten import skapar inga ärenden.

Mallens kolumner är **Adress, Lägenhet, Postnummer, Ort, Inflyttningsdatum,
Namn, E-post, Telefon**. Alla utom Lägenhet och Telefon är obligatoriska
demofält. Filgränsen är 5 MB och högst 200 rader. Mallfält, gränser och
valideringsregler är demoförslag, inte en godkänd verksamhetsmall.
Importen sker lokalt med paketerad ExcelJS; inga filer laddas upp till
Kraftringen eller externa parsertjänster i denna frontendprototyp.

### Fullmakter och ärenden

PDF/PNG/JPEG kan bifogas som lokala testfiler; högst tre dokument per ärende
och högst 5 MB per fil är tekniska demogränser. Filtyp/signatur kontrolleras,
men innehållet juridiskt verifieras inte. En bilaga innebär aldrig automatiskt
samtycke, giltigt uppdrag, signering eller elhandelsavtal. Faktisk fullmaktsmall,
omfattning och kontrollprocess behöver godkänt verksamhetsunderlag.

`dist/movein-service.js` ger den gemensamma ärendekedjan: registrering →
förmedling → intern handläggning/komplettering → återkoppling. Nya partnerposter
har `intakeSource` (`manual`/`excel`), importreferens/filnamn och
`authorityFiles`-metadata. `serviceRequested` är partnerns servicebegäran;
`authorityDemo` är fortsatt separat och sätts inte av en filbilaga. Nya
partnerunderlag visar **Fullmakt saknas** eller **Klart att förmedla**;
förmedling kräver en faktiskt lagrad fullmaktsbilaga enligt demoregeln.

Äldre intressen, registreringar, tjänsteval och fullmaktsdemomarkeringar
bevaras utan fabricerade bilagor, nytt samtycke eller nya befogenheter.
Återöppning använder samma post och aktuella status, aldrig automatisk
dubblett. Elhandel, elnät och erbjudandeval följs separat; registrering,
förmedling och slutförd service skapar inga avtal eller ekonomiska utfall.

Kommersiellt resultat visas fortfarande först på den interna partnerprofilen. Ärendeantal, underlag, kompletteringar och demobekräftelser är operativ uppföljning för alla datum. Ekonomiska fixtures för vald period är fristående och ändras inte när ett serviceärende registreras, förmedlas eller bekräftas.

Regelbakgrunden är verifierad i Ei:s nyhet 25 juni 2026: automatisk anvisning av elhandelsavtal avskaffas **1 juli 2027**. Det är en beslutad framtida ändring, inte en redan gällande förändring vid prototypens datum. Uppgiften används inte som produktlöfte. Källa: https://ei.se/om-oss/nyheter/2026/2026-06-25-tva-nya-lagar-ersatter-ellagen

## Affärsutfall och kickback

Öppna **Affärsutfall** internt eller en partners profil för den bredare kanalrapporten. Dess periodval är gemensamt med den ekonomiska resultatöversikten och den interna kickbackvyn. Den enklare generiska uppföljningen i **Partners → Kunder & avtal / Insikter** har ett gemensamt år/månad/vecka-urval per partner och filter på kundsegment; fastighetspartnerns **Kunder & kickback** har eget år/månad-urval. Säljare, regioner, produktfördelning och alla belopp är manuella exempel. Nyttigheten är elhandel. Face2face har konsumentprodukterna Fastpris, Vintersäkrat, Opti, Kvartspris och Rörligt pris, enligt senaste användarbeskedet. Saveras företagsutbud är rörligt pris, kvartspris, Poolportfölj Trygg, Poolportfölj Offensiv, individuell portfölj och Kraftringen Stabil. Produktkatalogen följer kundsegmentet. En säljpartner kan ha båda segmenten; produkt och segment hålls isär även när produktnamnen är lika. Alla partners visar den samlade katalogen. Fastighetspartners tidigare produktfördelning är fortsatt exempeldata och utbudet behöver bekräftas. Det innebär inga antaganden om produktvillkor.

För Savera prioriteras nya avtal, avtalad årsvolym i MWh, säljare och avtalstyp. MWh för september avser årsförbrukning enligt september månads nya exempelavtal, inte levererad el i september. Face2face följs efter avtalstyp och geografi, med Beest angivet som möjlig framtida datakälla. Ingen data hämtas från Beest. Fastighetspartners visar hjälpta nyinflyttare och serviceanmälningar separat från elhandelsavtal. Produktfilter ändrar endast avtal/MWh; serviceutfall avser tjänsten, inte en avtalstyp.

Churn är ett testförslag: kunder ur periodens öppningskohort som lämnat efter avtalsstart dividerat med kunder i samma öppningskohort. Års- och kvartalsmått använder sin egen öppningskohort, inte summerade månadsnämnare. Bortfall före start visas separat: avbrutna avtal bland periodens sålda avtal, observerade till 7 oktober. Färska avtalskohorter är fortfarande under observation. Saknad nämnare visas som saknat underlag.

Kickbackuppföljningen omfattar samtliga partnerkanaler, enligt användarens förtydligande. Kickback visar manuellt angivna exempelbelopp, föreslagen avstämningsstatus och registrerade betalningar mot dessa poster. Det är uppföljning av postperiodens underlag, inte betalningsmånadens kassaflöde. Faktiska beräkningsregler och partneravtal saknas. Kostnader i den ekonomiska resultatöversikten och kickbackposterna är separata exempelunderlag; ingen automatisk ersättningsberäkning eller avstämning görs.

- `dist/partner-results-data.js`: fristående aggregat och kohorter för kanalutfall.
- `dist/partner-results.js` och `.css`: interna rapporter och partnerprofilens utfallspanel.
- `dist/partner-kickback.js` och `.css`: manuella ersättningsexempel och statusuppföljning.

## Masteragent och återkommande utveckling

Användaren har aktiverat ett självständigt bygguppdrag för Partnerlabb.
[PILOT-MISSION.md](PILOT-MISSION.md) styr nu prioriteringen;
[MISSION.md](MISSION.md) bevarar grunduppdraget. [RUNBOOK.md](RUNBOOK.md)
beskriver källåtkomst och leverans, [BACKLOG.md](BACKLOG.md) belagda uppgifter
och [WORKLOG.md](WORKLOG.md) faktiskt resultat. Arbetsminnet följer GitHub;
dessa rotfiler ingår inte i den statiska deploymenten. Varje molnpass ska
därför hämta aktuell GitHub-main och läsa instruktionerna där.

Den befintliga länkade Sites-molnuppgiften **Partnerlivs pilotagent** har oförändrat timschema i Europe/Stockholm från 8 oktober 2026 kl. 23.00. Det avsedda aktuella uppdraget prioriterar generiska säljpartnervyer under Partners med valbara B2B-/B2C-segment, samma Kunder & avtal/Insikter för Savera och Face2face samt partnerns egna kunder/kickback, samtidigt som fastighetsbolagets Excel-/manuella registrering med fullmaktsbilagor bevaras. Snygg och enkel frontenddemo slutförs utan att invänta faktisk kund. Hyresgästen har inga aktiva portalsteg. Native återläsning i WORKLOG kvitterar faktisk promptuppdatering. Agenten använder aktuell GitHub-main, egen `agent/`-gren och pull request. Aktuell aktivering redovisas i GITHUB-STATUS.md; sparat schema, påbörjad körning och utförd/publicerad förbättring är separata resultat. Oavbruten processdrift, hårda tids-/kostnadsgränser eller garanterad återstart har inte verifierats. Schema och faktisk leveranskvittens finns i WORKLOG.md.

Tidigare leveranser av utkast och kvittoåteröppning är återanvändbara
byggstenar, men deras hyresgäststyrda gränssnitt ersätts nu av partnerns två
registreringsvägar. Återinför inte äldre tenantsteg för att passa gamla tester.

### Återkörbara webbläsarkontroller

`qa/property-intake.py` samlar aktuella browserkontroller för manuellt/Excel,
validering, dubbletter, fullmaktsfiler, ärendekedja och isolerad kunddemo.
Äldre browseringångar (`movein-drafts.py`, `movein-service.py` och
`customer-demo.py`) ska följa det nya arbetssättet eller hänvisa till den
aktuella regressionen. `qa/movein-next-action.mjs` och
`qa/movein-receipt.mjs` bevarar modulregressioner för ansvarsskifte och samma
ärendereferens. Exakt körd revision och utfall redovisas i WORKLOG.md;
historiska version 12-resultat verifierar inte de nya registreringsvägarna.

Med servern ovan igång, Python Playwright och Chromium tillgängliga:

```sh
python qa/property-intake.py
```

`PARTNERLABB_QA_URL` kan ange en annan lokal testserver. Frontendappen behöver fortsatt inga paket eller byggsteg; Playwright behövs enbart för utvecklingskontrollerna.

Säljpartnernas fiktiva rapportdata och datum-/segmentbaser kontrolleras med
`node qa/savera-data.mjs`; `python qa/savera-insights.py` återanvänder
browserflöden för rapporter, Insikter och fastighetspartnerns egna resultat.
Filnamnen är bevarade för kontinuitet och innebär ingen Savera-kategori i
produkten. Faktiskt körda kontroller och kandidatrevision redovisas i
WORKLOG; ett äldre testantal är inget bevis för den nya implementationen.

### Arbetsytor och segment utan resultatunderlag

Nya säljpartners och partners med ändrad eller blandad segmentkonfiguration
får en egen grundvy med utbildning, support och sina produktkataloger.
De visar inte Saveras eller Face2faces redigerbara demo-underlag. Savera och Face2face använder samma generiska uppföljning i interna och
egna partnervyer. Äldre lokala säljutkast bevaras men har inga aktiva
pipeline- eller registreringsingångar, enligt PARTNER-05.

`coveredAudiences` och `availableForSegment(segment)` skiljer observerade
segment från ny konfiguration. Ett nyvalt segment utan kundhistorik visar
**Underlag saknas** och **—**, även om partnerns andra segment har
resultat. Det skapar varken nollutfall, kundtid eller prognos. Historiska
kundsegment och tidigare dialogers nästa steg bevaras. Kickbackens
partnerurval inkluderar nya partners med tydligt saknat underlag.

## 2026-10-11 · PARTNER-05 publicerad som version 20

PR #20 integrerad; GitHub/Sites publicerad källrevision `66d8046558728fd21dd6be09373e2a4eaeddc364`. Sites version `appgprj_6ac600ecf7d48191923687550810c1d4~appgver_cfab5f7d13c88191b334487f90012965`, deployment `appgdep_6acabb57a94881918954329a003a92a8`, succeeded 2026-10-10 22:25:42 UTC (11 oktober 00:25 Stockholm). URL https://kraftringen-partnerlabb.rosen123.chatgpt.site. Custom-delning revision 4 bevarad. Alla åtta qa/*.mjs och JS-syntaxkontroller passerade på publicerad källa. Browser-/mobil-/tangentbords-/videouppspelning inte verifierad i denna miljö.

Säljpartnerns meny: Mina resultat, Insikter, Avtalsfakta, Utbildning och support. Endast egna rapportdata i partnervy; inga interna kostnader/nettobidrag. Fastighetsbolag: Avtalsval med Kvartspris som grundval, Opti och Rörligt månadspris som alternativ. Nya utkast får en ändringsbar kopia av grundvalet; äldre underlag bevaras. Excelval gäller hela urvalet nya rader. Ingen automatisk avtalsteckning.

Faktakort har officiella källänkar och relevanta befintliga Elakademin-filmer, inte kompletta produktspecifika filmer. Saknade exakta produktblad för Stabil/B2B Kvartspris och specifikation av Individuell portfölj är nästa innehållsbehov, inte ett skäl att fabricera villkor. Detta är en efterhandskvittens, dist/ oförändrad.


## 2026-10-11 · Tre partnerupplägg publicerade i version 22

Partners → Ny partner erbjuder Säljpartner (B2B/B2C/båda), Fastighetsbolag
och Personalavtal för företag. Nya fastighetsbolag får befintliga egna
manuella/Excel-flöden och fullmaktsbilagor. Personalavtal har egen översikt
med saknat resultatunderlag; erbjudande och anmälningsprocess är ännu öppna.
Befintlig partnertyp och sparad historik bevaras; namn kan ändras för alla.

PR #24 integrerad, publicerad källrevision `9b935a533229881e2ca0bef83d3c84f5fc9468dd`. Sites version 22
och succeeded-kvittens finns i WORKLOG.md. Befintligt timuppdrag är
återaktiverat med uppdaterad, native återläst prompt.
Browserregression för de nya typerna: `python qa/partner-types.py`.
