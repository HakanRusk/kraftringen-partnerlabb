# Instruktioner för arbete i Kraftringen Partnerportal

## Senaste direktuppdrag: valbart CRM – 14 oktober 2026

Ludwig vill vid skapande av säljpartner välja **Har eget CRM** eller
**Använd Partnerportalen som CRM**. Det förtydligar den äldre generella
inriktningen att säljpartners arbetar utanför portalen: den gäller fortsatt
partners med eget CRM, inklusive Savera/Face2face som standard. Valbart
portalarbetssätt är nu uttryckligen beställt. Partnertyp och B2B/B2C/båda är
fortsatt separata val. Inget schema eller befintlig åtkomst ändras.

`partnerProfiles.crmMode` styr arbetssättet (`external`/`portal`). Äldre
profiler utan val behåller eget CRM. Båda alternativen kan väljas i
partnerinställningar; byte bevarar kundhistorik. Fastighetsbolag och
personalavtal påverkas inte. Portal-CRM har kundkort, ansvarig säljare,
kontaktuppgifter, säljsteg, nästa aktivitet/datum, förlustorsak och historik.
Kundsegment låses på sparad rad. `state.crmRecords` använder befintlig
normal-/demoisolerad lagring; inga äldre underlag omklassificeras.

Denna leverans är lokal frontend. Vunnen CRM-status skapar inga bindande
avtal, resultat eller kickback. Gemensam lagring och identitetsbaserad
partnerbehörighet är fortfarande en separat etapp. Verifiera formulär,
B2B/B2C/båda, segment-/arbetssättsbyte, sparfel, flikkonflikt, omladdning,
filter, partneravgränsning och bevarade ekonomiska/serviceunderlag.


## Senaste direktuppdrag: inflyttningen först – 11 oktober 2026

- Ludwig har sagt **”Bygg det och publicera sedan”** efter vår rekommendation att börja fastighetskundens demo med en konkret inflyttning och visa hela överlämningen. Prioritera enkel inflyttningsservice: Excel eller manuell registrering, fullmaktsbilaga, status, saknat underlag och vem som behöver agera. Återanvänd befintliga flöden; hyresgästen får inga aktiva portalsteg.
- Omarbeta **Ert samarbete** så att inflyttningen kommer först, därefter kundinflöde/kickback, föreslagen avlastning av uthyrarnas elfrågor och egen fastighetsel. Behåll samtliga sex idéer och tidigare lokala fokusval. De övriga fyra idéerna visas som stängd, öppningsbar fördjupning; underbyggd analys av onödig förbrukning hör till diskussionen om fastighetselen.
- Detta är godkänd presentation och frontendutveckling, inte belägg för faktisk tidsbesparing eller kundernas prioriteringar. Avlastning av elfrågor och förbrukningsanalys är fortfarande tjänsteförslag utan fastställd supportprocess, SLA eller besparingslöfte. Resultat kommer från egna befintliga underlag; saknade fastighetselmått förblir **Underlag saknas** och **—**.
- Bevara version 25:s felrättningar, fullständiga Elakademin från version 23, alla lokala data och befintlig åtkomst. Denna omarbetning ändrar inte agentprompt, schema eller aktivering. Test och publicering kvitteras efter faktisk verifiering.

## Senaste direktuppdrag: bredare fastighetssamarbete – 11 oktober 2026

- Ludwig vill även visualisera elavtalet för fastighetsbolagets **egen fastighetsel** i samarbetet. Samma fastighetspartner kan vara kanal till hyresgäster och företagskund för den egna elen. Visa båda delarna samlat, men håll hyresgästärenden, hyresgästernas avtal/kickback och partnerns egna B2B-avtal åtskilda. Instruktionen bekräftar behovet, inte att ett visst fastighetsbolag har tecknat avtal.
- Ludwigs ”Bygg ett förslag” efterfrågar en konkret frontendvisualisering av ytterligare hjälp för fastighetsbolagen. **Ert samarbete** (`property-partnership`) ska nås från vald fastighetspartners interna profil och från fastighetspartnerns egen meny. Bevara befintlig inflyttningsservice och båda registreringsvägarna.
- De sex rådgivningsidéerna är våra förslag: avlastning av hyresgästernas elfrågor; underbyggda kostnadsintervall till bostadsannonser; upptäcka onödig fastighetsförbrukning; undersöka elbehov före lokaluthyrning; elöversikt vid köp/försäljning av fastighet; bedöma laddning, solceller, batterier och styrning av elanvändningen. Den senaste presentationsprioriteringen ovan ersätter den tidigare rekommendationen att börja direkt med hyresgästfrågor och onödig förbrukning. Inget av detta är belagt som avtalad eller färdig Kraftringen-tjänst.
- Lokala fokusval på samarbetssidan är endast diskussionsunderlag per fastighetspartner. Bevara normal-/demoisolering och återställ värdet vid sparfel. Val skapar inga supportärenden, utskick, servicebeställningar, elavtal, intäkter eller kickback.
- Fastighetsbolagets egna elavtal, anläggningar som omfattas, volymer, priser, kostnader, avtalsperiod och eventuell besparing saknar källa. Visa **Underlag saknas** och **—**; låna inte säljpartnernas resultat eller dra slutsatser från fastighetsinställningar/hyresgästärenden. Ändra inte partnertyp eller historiska data för att visa två delar av samarbetet.
- Bevara fullständiga Elakademin från version 23, dess filmer, material och sparade framsteg samt tidigare Academy-kurser och B2C-samtalsbibliotek. Test- och publiceringskvittens för det nya fastighetsförslaget dokumenteras först efter faktisk verifiering/publicering.

## Senaste partnertyper – 11 oktober 2026

- Ludwigs senaste instruktion lägger till **Fastighetsbolag** och **Personalavtal** som val när en partner skapas, tillsammans med **Säljpartner**. Alla ligger under **Partners**. Säljpartners väljer fortsatt företag (B2B), konsument (B2C) eller båda; partnertyp och säljkundsegment är skilda val.
- Fastighetsbolag får befintlig arbetsyta för Excel/manuell registrering, fullmaktsbilagor, förmedling och egna kunder/kickback. Detta gäller också nyregistrerade fastighetspartners, inte bara `estate1`/`estate2`. Bevara Avtalsval: Kvartspris som initialt grundval, med Opti och Rörligt månadspris som alternativ. Grundval/önskemål innebär inget tecknat avtal.
- **Personalavtal** avser ett företag som partnerkanal till sina anställda. Företagets egen elförbrukning är en separat B2B-affär. Denna etapp omfattar partnertyp och egen översikt. Erbjudande, anmälan, eventuella arbetsgivar-/anställdsteg, produktvillkor och ersättningsregler är inte fastställda; inför inget sådant flöde från detta val.
- Lokala profiler accepterar nya `sales`, `property` och `employee` samt bevarar befintlig `field`-typ. En redan registrerad partners typ ska inte ändras och historiska ärenden/avtal ska inte omklassificeras. Namnet får ändras för alla typer; säljpartnerns kundsegment får ändras med historiken bevarad.
- Nya fastighets- och personalavtalspartners får inga andra partners exempelresultat eller kickbackposter. Skilj tom lokal ärendelista från saknat kommersiellt underlag: resultat utan källa visas som **Underlag saknas** och **—**. Bevara lagringsfel/återställning, befintlig v2-data och normal-/demoisolering.

## Bekräftad inriktning: resultat och utbildning (2026-10-11)

Källa: Ludwigs direkta förtydligande i uppgiften. Säljpartnernas affärer och nästa aktiviteter hanteras utanför Partnerlabb. Kraftringen följer resultat, Kunder & avtal, Insikter och villkorade scenarier under Partners. Säljpartners använder utbildning och stöd. Detta ersätter äldre mål om aktiv kundregistrering, pipeline, offertarbete och återkopplingsflöden för Savera/Face2face i portalen. Äldre lokala underlag och utkast bevaras; de blir inte resultathistorik. Fastighetsbolagens registrering, fullmaktsbilagor, förmedling och handläggning behåller operativa nästa steg. Ingen ny verksamhetsregel eller integration införs.

## Aktiv pilotprioritering – 10 oktober 2026

- Senaste uppföljningskrav: säljpartners ska ligga under **Partners**, med samma generiska vyer för **Kunder & avtal** och **Insikter**. Skapa inte separata globala kategorier för Savera, Face2face eller Insikter. Vid skapande och ändring av partner ska kundsegment kunna väljas: företag (B2B), konsument (B2C) eller båda. Savera är bekräftad B2B-partner och Face2face B2C-partner; namnet får inte styra rapportens funktioner. Visa nya avtal per år/månad/vecka, kundens elavtal, produkt/säljare/geografi, aktivt kundbestånd samt kundtid, popularitet och scenario vid fortsatt tempo. Face2face ska ha samma uppföljning och Insikter, med churn efter start och bortfall före start som separata mått. Fastighetspartnern ska se egna nya kunder och kickback, skilt från serviceunderlag och slutförd hjälp. Detta uttryckliga uppdrag prioriteras tillsammans med stabil inflyttning.
- Senaste arbetssätt: fastighetsbolaget sköter all registrering och förmedling. Erbjud två vägar: ladda upp en Excel-fil (.xlsx), granska raderna och bifoga befintliga fullmakter per hyresgäst, eller fyll i ett enskilt underlag manuellt och bifoga fullmakt. Hyresgästen har inga aktiva steg i portalen. Återinför inte hyresgästformulär, direktlänkar eller QR som arbetsflöde. Detta ersätter tidigare demoantaganden om hyresgästens aktivitet.
- Nyare styrning: kom så långt som möjligt utan faktisk kund och gör kunddemot mycket snyggt, enkelt och intuitivt. Slutför oberoende frontend-, demo- och testarbete självständigt; saknad pilotkund är inte ett stoppvillkor för en fungerande fiktiv demo. Läs aktuell leveransstatus innan nya kopior av redan färdiga förbättringar byggs.
- `?demo=inflyttning` är en separat lokal kunddemoyta. Bevara normaldata och utkast utanför denna yta vid omstart; demo-navigation får aldrig skapa tjänsteval, förmedlingshändelser, avtal eller ekonomi automatiskt. Lokal dataisolering är inte produktionsbehörighet. Delad backend/persondata kräver fortfarande eget underlag och mandat.

- Användaren har bett oss skapa agenten för att göra Partnerlabb redo för en enkel verklig pilot. Läs PILOT-MISSION.md, PILOT-FACTS.md, PILOT-DECISIONS.md och PILOT-ACCEPTANCE.md tillsammans med arbetsminnet vid varje pass. Pilotmissionen och senaste bekräftade uppföljningskrav styr prioritering före generell funktionsutbyggnad; affärs-, data-, frontend- och samarbetsgränserna nedan består.
- Förbered ett fastighetsbolag och en handläggare, verifiera först flödet med fiktiva ärenden och ersätt antaganden med källbelagda fakta. Pilotdeltagare, fullmakt, faktiska nödvändiga fält, driftmiljö och kickbackregler saknas; agentens skapande är inte ett godkännande av backend eller persondata.
- Återanvänd samma timuppgift och befintliga PR:er. Högst två färdiga pilotförslag väntar på granskning samtidigt. Därefter förbättras befintlig verifiering och beslutsunderlag; skapa inte fler förslag eller tomma ändringar för att fylla arbetspass.

## Förankrade fakta och öppna beslut

- Ludwig Rosenberg är teamchef för B2B-sälj på Kraftringen Kundcenter sedan juni 2026. Håkan Rusk är hans chef; någon ytterligare titel för Håkan är inte angiven.
- Säljpartnerns aktiva affärsarbete sker utanför portalen. Bevara marinblå/petrolfärgad design; backend ingår inte.
- Den interna Kraftringen-vyn är nu huvudvy och ska fokusera på kommersiellt resultat för alla partners eller vald partner. Partnerresan är endast intern och följs separat per partner.
- Användaren har bekräftat att Savera säljer Kraftringens elhandelsavtal till företagskunder och Face2face till konsumenter. Face2face använder Beest enligt användarens bekräftelse den 8 oktober 2026; den interna resultatuppföljningen ska prioriteras. Bevara befintlig konsumentdemo men beskriv den inte som ersättning för Beest. Savera kan eventuellt använda partnerportalen senare; användningen är inte beslutad. Befintliga företag/BRF-underlag och konsumentunderlag behåller sina ursprungliga segment. Nya säljpartners får konfigurerade kundsegment; en partner kan sälja till båda. Fastighetspartner erbjuder inflyttningsservice vid hyresavtal och sköter allt arbete i portalen: Excel-import eller manuell registrering, bifogade befintliga fullmakter, granskning och förmedling. Hyresgästen gör inget aktivt i portalen. Kraftringen hanterar elhandel, behövlig elnätshantering och bekräftelser. Partnerns egen elförbrukning är en separat affär. Fastighetsbolag har en separat arbetsyta för fiktiva inflyttningsunderlag. Detta bostadsspår är godkänt; fiber och andra produktområden är fortsatt utanför scope.
- Partnerregistret har grundexemplen `syd` = Savera (B2B), `vast` = Face2face (B2C), `estate1` = Exempelfastigheter AB och `estate2` = Exempelbo Förvaltning. Savera och Face2face är användarens namn; alla kunder, utfall, statusar och kanaler är exempel. Nya partnerprofiler och ändrade kundsegment är lokal frontenddata, inte verkligt partneravtal eller behörighet. Att skapa en partner utan resultatunderlag ska ge **Underlag saknas**, inte påhittade nollutfall, avtal eller kickback.
- Arbetsflöden, pipelinesteg, partnerresans åtta steg, utbildningsinnehåll, befogenheter, informationsdelning och plattformsval är förslag eller öppna beslut.
- B2B Veckokollen är ett tidigare separat verktyg. Integration med det eller Dynamics är inte beslutad.
- Skilj i gränssnitt och dokumentation mellan användarens beslut, våra förslag och sådant som behöver verifieras. Hitta inte på kommersiella regler eller Kraftringens interna processer.

## Data och funktioner

- Skriv gränssnitt, exempeltexter och användardokumentation på svenska.
- Använd fiktiva kunder, hyresgäster och kontaktpersoner samt exempeladresser med `.example`. Lägg inte in riktiga kunduppgifter. Savera är ett namn som användaren lämnat, inte underlag för verkliga resultat, partnerstatus eller villkor.
- Kommersiella data är manuella exempelutfall för resultatbidrag före partnerkostnad, kostnad, avtal och MWh. Demots nettobidrag är angivet bidrag minus angiven partnerkostnad. MWh är avtalad årsvolym för periodens nya exempelavtal, inte periodens levererade el. Framtida potential är separat och ingår inte i utfallet. Beskriv inget av detta som verifierad ekonomi eller en ersättningsmodell. Registrering av kunddialog eller inflyttningsintresse får aldrig skapa ett avtal eller ekonomiskt utfall.
- Äldre säljflödens data och utkast bevaras, men flödena visas inte i aktiv navigation. De är aldrig bindande avtal.
- Inför inte backend, riktiga integrationer, priser, produktvillkor, provisionsberäkning, leadägande, exklusivitet eller offertbefogenhet utan nytt underlag och instruktion från användaren. Provisionsvyn visar saknat regelunderlag tills regler faktiskt lämnas. Den interna kickbackvyn får visa fristående, manuella exempelposter och statusuppföljning, men ingen intjänad ersättning får räknas fram från avtal eller serviceärenden.
- Academys fyra introduktionskurser innehåller demotextmoment, bokmärken och lokal klarmarkering. Elakademin har separat befintligt utbildningsmaterial, filmer och lokala självtest. Beskriv inget av detta som personverifierad certifiering eller central resultatrapportering. Material, kampanjbrief och partnerresan är fortsatt testförslag tills underlag har lämnats.
- Säljpartnernas kundsidor är lokala redigerbara förhandsvisningar. Fastighetspartnerns inflyttningsyta används av fastighetsbolaget, inte hyresgästen. Äldre inflyttningslänkar ska öppna partnerns registreringsyta bakom samma privata testlänk. Supportfrågor, utskick, anmälningar, dokumentsteg och kontaktformulär ska inte göra verkliga externa åtgärder.
- Visa partnerresan endast för den interna Kraftringen-vyn och spara två checklistaktiviteter per steg samt exempelplacering per partner i `commercial.management`. Äldre `state.journey` bevaras men dess gamla partnervy visas inte. Aktiva säljpartners och fastighetsbolag ska ha menyer anpassade till sina arbetsuppgifter.
- Bevara korta, tydliga demomärkningar. Samla utförligare begränsningar i Test & beslut och dokumentationen, så att produktflödena främst hjälper användaren genom sin uppgift.
- Demovyer och dolda interna anteckningar styr visningen; de är inget åtkomstskydd. All data är lokal och delas inte mellan datorer. Beskriv inte JSON-export som synkronisering eller som säkerhetskopia av alla moduler.
- Håkans två e-postidentiteter får extern visningsåtkomst på den privata Sites-testlänken. Detta innebär inte redigeringsåtkomst till byggprojektet. Blanda inte ihop Sites-delning med appens demovyväljare eller med säkerhetsgränser i appen.

## Teknik och verifiering

- Bevara prototypens statiska portabilitet: körbara filer ligger i `dist/` och ska kunna serveras utan paketinstallation eller byggsteg.
- `app.js` tillhandahåller `window.Portal`, partnerregistret och navigationen. `partner-setup.js` kompletterar grundregistret med lokala partnerprofiler i `state.partnerProfiles`; bevara befintliga kund-, service- och ekonomidata när profiler ändras. `studio.js`, `academy.js`, `partner.js`, `commercial.js`, `property.js`, `movein-service.js`, `business.js` och `consumer.js` registrerar sina vyer mot samma objekt. Behåll en gemensam lokal datamodell.
- Bevara kunddata och migreringen från `partnerlabb.active.v1` till `partnerlabb.portal.v2`. Giltig v2-data har företräde. Återställning ska fortsatt vara ett tydligt användarval.
- Nya dataområden `commercial.management`, `moveins` och `propertySettings` ska behålla befintliga kunddata och annan v2-data. De fasta ekonomiska exemplen i `commercial.js` ska hållas åtskilda från hyresgästers intresseregistreringar.
- Inflyttningsflödet har två ingångar i partnerns arbetsyta: manuell registrering och Excel-import (.xlsx) med förhandsgranskning. Registrera endast efter ett uttryckligt val. Matcha bifogade fullmakter med rätt ärende och redovisa saknade eller misslyckade bilagor. Bilagans förekomst är inte verifierat samtycke eller juridiskt giltig fullmakt. Den nya demofunktionen får använda lokala binära bilagor i IndexedDB, skilda mellan ordinarie labb och kunddemo. Bevara äldre poster och utkast utan att tillskriva dem nya befogenheter. Registrering skapar separata `moveins`-poster och testkvitton, aldrig kundrecord, offerter, avtal eller ekonomiskt utfall.
- Bevara responsiv layout, tangentbordsanvändning, formuläretiketter och tydliga sparmeddelanden.
- Dokumentera bildkällor i ASSETS.md. Anta inte att externa illustrationer eller referensbilder är godkända varumärkestillgångar från Kraftringen.
- Efter funktionella ändringar, kontrollera berörda användarflöden: intern resultatöversikt → Partners → skapa säljpartner/fastighetsbolag/personalavtal eller ändra namn/kundsegment → vald säljpartners Kunder & avtal/Insikter → segment-/period-/produktfilter och aktivt bestånd. Kontrollera B2B, B2C och båda, lagringsfel, omladdning och att historiska rader behåller sitt segment. Verifiera också en ny fastighetspartners egna menyer/grundval/ärenden och en personalavtalspartners egen översikt med saknat resultatunderlag; avvisa typbyte på befintliga profiler utan dataförlust. Verifiera även fastighetsbolag → manuell registrering eller Excel-granskning → fullmaktsbilagor → förmedling → intern uppföljning utan ny intäkt eller nytt avtal. Partnerresan finns endast internt och är separat per partner.
- Bevara Academy för säljpartners och sparade äldre kund-/offertunderlag utan att återinföra aktiv affärshantering. Kontrollera relevant lagring efter omladdning och perspektivbyten mellan partnertyper. Breda kontroller behövs när gemensam navigation eller data ändras.
- Uppdatera README när verkliga funktioner eller begränsningar ändras. Dokumentationsändringar behöver inte egna tester.
- Lova inte samtidig kodredigering eller parallellt AI-arbete utan aktuellt officiellt underlag för vald miljö. Skilj på att bygga samma projekt och att använda den publicerade portalen tillsammans.

## Bekräftad segmentering och nya dataområden

- Kundsegment är en konfiguration för varje säljpartner: företag (B2B), konsument (B2C) eller båda. Vid skapande väljs först Säljpartner, Fastighetsbolag eller Personalavtal. B2B/B2C/båda gäller säljpartnern. Säljpartnerns interna rapporter ligger under Partners; samma rapportkomponent används oavsett partnernamn. Blandade partners ska kunna följas samlat och filtreras på kundsegment.
- Kund- och avtalsrader behåller eget segment. Ändrad partnerkonfiguration får inte omklassificera sparade kunder, flytta företag till konsumentdata eller skriva om historiska avtal. Produkter med samma namn i båda katalogerna ska kunna skiljas genom segmentet. Rapportkatalogen får inkludera historiska avtalssegment för att bevara sökbar historik även när aktuella segment ändras. Lokala partnerprofiler måste bevara övrig v2-data och vara avskilda mellan normal labbyta och kunddemo.

- Savera (`syd`) har `business-overview` och `business-brief`; affärsunderlag i `businessDetails` är kopplat till befintliga företagsrecord. Sparat nästa steg/datum följer kunddialogen.
- Face2face (`vast`) har `consumer-overview`, `consumer-sales`, `consumer-followup`, `consumer-material` och `consumer-reports`. Fiktiva privatpersoner ligger i separat `consumerSales`. Konsumentregistrering skapar underlag, aldrig verkliga avtal eller finansiellt utfall.
- Gamla `vast`-record med företag/BRF bevaras i lokal data men visas inte i de nya företags- eller konsumentflödena. Nya konsumentexempel ska inte konverteras från dessa företag.
- Partnerinterna kostnader/nettobidrag visas i Kraftringens vy, inte i partnerarbetsytorna. Statusdefinitioner, handläggningssteg, kanaler och utbildningsinnehåll är testförslag tills verkligt underlag lämnats.
- Direktlänkar `?workspace=syd#overview` och `?workspace=vast#overview` öppnar respektive demovy; det är visningsval, inget åtkomstskydd.

## Inflyttningsservice – senaste affärsmodell

- Fastighetsbolag, BRF:er och förvaltare är partners och väg till hyresgästen vid hyresavtal/inflyttning. Kraftringen står för elkompetens och avtalshantering.
- Fastighetsbolaget gör allt aktivt portalarbete på hyresgästens vägnar. Att hyresgästen inte använder portalen upphäver inte behovet av ett giltigt uppdrag/fullmakt eller ett separat avtalsval enligt godkänd process. Registrering och en bifogad fil är inte automatiskt samtycke, avtal, kund eller kommersiellt resultat.
- `movein-service.js` tillhandahåller ärende-API och intern `movein-cases`. Partnerregistrerade underlag följer samma ärendekedja och hålls skilda från äldre intressen. Bevara befintliga `serviceRequested`, `authorityDemo`, `handoverStatus`, `processing` och `events` utan att tolka om tidigare val. Dokument- och importmetadata ersätter inte juridisk kontroll. Gamla intressen får inte automatiskt samtycke, fullmakt eller överlämning.
- Överlämning och statusar är lokala testförslag. Elhandel, elnät och hyresgästens erbjudandeval följs separat. Inga riktiga elnätsbolag kontaktas; bekräftelser och fullmaktsteg är simuleringar.
- Inflyttningsärenden ingår inte i företagspartnernas eller Face2faces kunddata. Finansiella fixtures är fortsatt fristående, även vid bekräftat demoärende.
- Egen elförbrukning hos partnern behandlas som en separat B2B-affär och skapas inte från hyresgästärendet.
- Regelbakgrunden används inte som ett produktlöfte. Eventuella laguppgifter ska ha officiell källa och ikraftträdandedatum; undvik att beskriva framtida regler som redan gällande.

## Arbetslistor och internationella förebilder

- `workspace.js` härleder nästa handling från befintliga kunddialoger, konsumentunderlag, inflyttningsärenden och intern partneruppföljning. Uppgifter är inga nya persistenta affärsobjekt. Filter är endast visningsval.
- Visa vem som har nästa insats och en direkt väg till befintligt underlag. Turordning och sortering är testförslag, inte beslutade SLA:er eller ansvarsvillkor. Använd endast redan angivna datum; inflyttningsdatum är inte en utlovad svarstid.
- Behåll kommersiellt resultat först internt. Ekonomiska signaler ska förklaras med period och mått, utan automatiska hälsopoäng eller slutsatser om partnerkvalitet.
- Fastighetspartner lämnar och kompletterar underlag samt bifogar befintliga fullmakter. Bevara äldre tjänsteval och fullmaktsdemomarkeringar i historiska poster; bilagor får inte skriva över dem eller påstå godkänd fullmakt. Ett avbrutet manuellt underlag eller en avbruten importgranskning skapar inget ärende.
- Benchmarkunderlaget i BENCHMARK.md skiljer dokumenterade leverantörsfunktioner från vår anpassning. Påstå inte att någon leverantör är objektivt bäst i världen eller att prototypen har deras backendförmågor.

## Elakademin – tillagd utbildning

- Den 8 oktober 2026 bad användaren att den redan färdiga Elakademin läggs in som utbildning för både Savera och Face2face. Återanvänd kursen Förstå din elaffär på https://kraftringen-elakademin.rosen123.chatgpt.site/ och dess slutliga filmer. De fyra tidigare demokurserna och deras framsteg ska bevaras.
- Kursens offentliga sakuppgifter kontrollerades den 7 oktober 2026. Räkneexemplen är förenklade antaganden, inga produktvillkor eller erbjudanden. Nytt material ska inte fylla i saknade konsumentvillkor eller kundspecifika villkor.
- Face2face arbetar med konsumenter. Elmarknadsgrunderna är relevant baskunskap; företagsfallen och portföljprodukterna ska märkas som B2B-fördjupning och får inte presenteras som konsumentprodukter.
- Klarmarkering och självtest lagras lokalt och separat per exempelpartner i portalens befintliga modell. Ingen backend, identitetskontroll eller synkronisering med den fristående Elakademin ingår. Länken dit erbjuder dess räkneverktyg, slutprov och lokala utbildningsintyg; intyget är ingen partnercertifiering.
- Befintlig Sites-åtkomst ska bevaras. Att lägga in en kurs eller byta demovy ger ingen ny användare åtkomst till den privata testportalen.

## Lyckade B2C-samtal – användaruppdrag 10 oktober 2026

- Användaren har uttryckligen bett att kunna lägga upp lyckade telefonsamtal som B2C-utbildningsexempel. Detta avgränsade uppdrag gäller trots att generell Academy-utbyggnad ligger senare i pilotkön.
- Samtalsbiblioteket ligger i Academy för säljpartners vars konfigurerade kundsegment omfattar konsumenter, inklusive Face2face och blandade/framtida B2C-partners. Partnernamnet avgör inte funktionen. Ingen Beest-integration tillkommer.
- Ljudfil och utbildningsanteckningar sparas tillsammans lokalt i IndexedDB, avskilda per partner och mellan normal labbyta och kunddemo. Visa att de sparas i samma webbläsare och inte delas mellan användare. JSON-exporten innehåller inte samtalsbiblioteket.
- Lägg inte in verkliga kundinspelningar eller påstådda lyckade exempel utan underlag. Utveckling och verifiering använder syntetiskt ljud och fiktiva uppgifter. Funktionen ersätter inte beslut om gemensam lagring, åtkomst och hantering av verkliga inspelningar.
- Bevara befintlig kursdata och övriga moduler. Redigering ändrar samtalets utbildningsanteckningar, inte kundunderlag, avtal eller ekonomi. Radering och återställning av lokala samtal ska vara uttryckliga val och lagringsfel redovisas.

## Enkel uppföljning och Insikter – förtydligat 10 oktober 2026

- Bekräftat behov: fastighetspartnerns egen översikt över förmedlade kunder och kickback; gemensam intern säljpartneruppföljning under **Partners** för Savera, Face2face och framtida partners. **Kunder & avtal** visar år/månad/vecka, kundens produkt och aktiva kunder; **Insikter** är den valda partnerns sida för kundtid, populära avtal, separata churn-/förstartsbortfallsmått och scenario vid fortsatt tempo. Båda sidorna delar begripligt partner-, segment- och rapporturval. Användaren vill ha inspiration från Saleshub; leverantören är fortfarande inte säkert identifierad.
- Måttdefinitionerna är implementationsförslag att verifiera mot riktiga källor. Nya avtal hör till datumet när avtalet stängdes. Aktiva kunder är ett bestånd vid vald periods observerade slut, med avtalsstart och avslut som grund; det är inte periodens nytillkomna kunder. Samma kund räknas en gång i beståndet. Visa datum och urval vid måttet.
- Visa avslutade kunders observerade kundtid separat från ålder hos kunder som fortfarande är aktiva. Aktiva kunder har ingen observerad slutlig livslängd. Kundtid, produktpopularitet och försäljningstakt måste ange kohort, period och bas; inga påståenden om hela verkliga kundlivslängden från ofullständig demohistorik.
- Prognosen är ett scenario från valda exempelavtal och observerade kalenderdagar: om den takten fortsätter under återstående dagar. Visa bas, brytdatum och prognoshorisont. Saknad/obegriplig bas ska ge saknat underlag, inte en fabricerad prognos. Använd inte intäkts-, MWh-, kundbestånds- eller kickbackprognos utan motsvarande underlag/modell.
- Fiktiva kund- och avtalsrader ska vara tydligt skilda från sparade kunddialoger och serviceärenden. `P.partnerSalesData.forPartner(id)` tillhandahåller den gemensamma rapportmodellen; gamla Savera-API:er kan bevaras som kompatibilitetsingångar. Nya exempelrader för Savera och Face2face ska kunna stämmas av mot respektive månadsaggregat för avtal och avtalad års-MWh. Produktfördelningen är fiktiv även när produktnamnen är bekräftade. Varje rad har eget segment; en konfigurationsändring skapar ingen ny historik. Fristående äldre kundhistorik för bestånd/kundtid är exempelunderlag, ingen verklig import. En period eller produkt utan exempelavtal är inte belägg för verkligt nollutfall.
- Partnern ska bara få sin egen resultatpresentation och kickbackposter; visa inte interna kostnader/nettobidrag i partnerarbetsytan. Manuella kickbackposter har egen period/källa och ska inte fabriceras på kundnivå eller ändras av serviceärenden. Lokal visningsavgränsning är fortfarande inte produktionsbehörighet.

## Kanalutfall och kickback – förtydligat 8 oktober 2026

- Följ båda säljpartnernas nya avtal, avtalad årsvolym i MWh, aktiva kunder, säljare, avtalstyp och geografi per år/månad/vecka i samma generiska uppföljning under Partners. Båda har Insikter. Churn efter start och bortfall före start ska vara separata mått med egen bas; Face2face använder fortsatt Beest som säljverktyg och prototypen har ingen koppling dit.
- Nyttigheten är elhandel. Senaste bekräftade konsumentkatalog är **Fastpris, Vintersäkrat, Opti, Kvartspris och Rörligt pris**; detta ersätter det tidigare urvalet Opti/Kvartspris. Företagskatalogen är **Rörligt pris, Kvartspris, Poolportfölj Trygg, Poolportfölj Offensiv, Individuell portfölj och Kraftringen Stabil**. Savera säljer B2B, Face2face säljer B2C. Katalogerna väljs efter kundsegment, inte partnernamn; en partner med båda segmenten ska kunna följa båda katalogerna och filtrera dem separat. Fastighetspartners tidigare produktfördelning är fortsatt obekräftad exempeldata. Deras förekomst i aggregat är fiktiv; skriv inga pris-, behörighets- eller produktvillkor från detta.
- `partner-results-data.js` har fasta manuella aggregat. Avtal och MWh ska summera till samma periodutfall som `commercial.js`. Produkt-, säljar- och regionfilter ändrar endast visningen. Helårsvyn för 2026 visar 1 januari–7 oktober och saknar jämförbar föregående årsbas.
- Fastighetspartners serviceanmälningar och hjälpta nyinflyttare följs separat från nya elhandelsavtal. Ett hjälpt serviceärende behöver inte ha lett till vårt avtal. Serviceaggregat har ingen avtalstyp; produktfilter avser endast avtalsutfallet.
- Churnförslaget använder kunder aktiva vid periodstart som nämnare och samma kohorts avgångar som täljare. Summera inte månaders öppningskohorter för års- eller kvartalsmått. Bortfall före start följer periodens sålda avtal och avbrott observerade till datadatum; färska perioder är inte färdigutfall. Måttdefinitionerna är testförslag.
- Användaren har bekräftat att kickback ska följas för samtliga partnerkanaler. `partner-kickback.js` visar manuella exempelposter, avstämning och betalningsbelopp, med föreslagna statusnamn. Postperiodens betalningar är inte ett kassaflöde per betalningsmånad. Kickback och kommersiell partnerkostnad är skilda exempelunderlag utan automatisk avstämning. Faktiska ersättningsvillkor, integrationer och datakällor kräver separat underlag.

## Aktiverad masteragent – 8 oktober 2026

- Användaren har aktiverat masterprompten som löpande bygguppdrag. Läs MISSION.md, RUNBOOK.md, BACKLOG.md och WORKLOG.md vid varje pass. Utför och testa förbättringar självständigt inom befintlig frontendprototyp och lämna dem som pull requests utan rutinmässig ny godkännandefråga. Ludwig/Codex samordnar integration och publicering. Saknade affärsregler parkeras medan oberoende arbete fortsätter.
- Arbetsminnet är i aktuell GitHub-källa. Deploymentarkivet har inte dessa rotfiler; hämta aktuell GitHub-main och läs instruktionerna där. Följ aktuell källa, instruktioner, parallellt arbete och exakt publiceringsproveniens.
- Återkommande pass ska utveckla produkten, inte bara bevaka. Bevara användarnas data, statisk portabilitet, korrekt partnerutbud, separat service/avtal/ekonomi och befintlig Sites-åtkomst.
- Ingen körning ändrar sitt eget eller andras schema, prompt eller aktivering. Schemalagda timpass innebär inte bevis för oavbruten exekvering eller garanterad körningsåterstart. Rapportera faktisk körning/publicering och konkret hinder.

## Gemensam GitHub-utveckling

- Användaren har uttryckligen valt det publika repot https://github.com/ludros93-prog/kraftringen-partnerlabb för gemensam utveckling med ChatGPT/Codex och Claude Code. Källkod och bevarad Git-historik har laddats upp och verifierats. GitHub-kontot `daniel-smail` är bekräftat för Daniel; hans verifierade åtkomst är publik läsning, utan bekräftad skrivbehörighet. Den befintliga Sites-testportalens privata åtkomst är separat och ska bevaras.
- GitHub är huvudkälla för kod och arbetsminne. Sites är publiceringsmål, och RUNBOOK-SITES.md dokumenterar endast den äldre rutinen. GITHUB-STATUS.md redovisar faktisk aktiveringsstatus, källrevisioner och behörigheter. Ändra inte scheman eller åtkomst på eget initiativ.
- Läs AGENTS.md, MISSION.md, RUNBOOK.md, COLLABORATION.md, BACKLOG.md och WORKLOG.md samt öppna PR:er från aktuell GitHub-källa vid varje pass. Den befintliga timuppgiftens sparade uppdrag använder samma GitHub-källa och arbetsgren plus PR; skapa ingen dubbel timagent.
- Utför och testa förbättringar självständigt inom prototypen på en separat `codex/`, `claude/` eller `agent/`-gren och lämna färdiga ändringar som en pull request till `main`. Detta gäller även masteragentens timpass. Gör ingen direkt push till `main` eller Sites från ett utvecklingspass. Ludwig/Codex samordnar integration och publicering från verifierad GitHub-main till samma Sites-projekt enligt RUNBOOK.
- Nyare användarbeslut: Daniel får utveckla på sin egen `claude/`-gren, men Ludwig måste uttryckligen godkänna Daniels konkreta PR och aktuella HEAD-SHA innan ändringen integreras i `main` eller publiceras på Sites. Dokumentera PR, godkänd SHA och Ludwigs faktiska godkännande i WORKLOG.md. Nya commits eller integrationskorrigeringar i Daniels ändring kräver nytt godkännande av den uppdaterade revisionen. Granskning, tester och fortsatt arbete i grenen kan göras före godkännandet.
- Codex och andra agenter får inte använda Ludwigs GitHub-identitet för att skapa ett skenbart mänskligt godkännande eller kringgå skyddet för Daniels arbete. Det tidigare självständiga bygguppdraget godkänner inte en viss Daniel-revision. Kravet gäller också Daniels arbete som flyttats till en annan gren eller korrigerats vid integration; oberoende, redan auktoriserat agentarbete fortsätter enligt sitt befintliga mandat.
- CODEOWNERS anger Ludwig som kodägare, men är ingen verifierad teknisk spärr utan aktiverat branch protection. GitHub nekar den aktuella anslutningen att ändra Daniels skrivbehörighet och aktivera skyddet (403); Daniel har fortsatt endast verifierad READ-åtkomst och skyddet är inte verifierat. Följ GITHUB-STATUS.md för faktisk status och skilj arbetsinstruktioner från tekniskt upprätthållna regler.
- Bevara Git-historik och använd inte force-push till gemensam huvudkälla eller Sites. Rapportera kandidat, öppnad PR, integrerad ändring och lyckad publicering som olika resultat. Automatisk GitHub–Sites-synk, CI-resultat och centralt delad testdata ska bara beskrivas som införda när de har implementerats och verifierats.

## 2026-10-11 · PARTNER-05 · Egna resultat, avtalsfakta och grundval

Ludwigs direkta korrigering: säljpartners ska också se sina egna resultat. Utbildning och Avtalsfakta ska vara separata ingångar för B2B/B2C. Fastighetsbolag väljer grundval mellan Opti, Kvartspris och Rörligt månadspris; Kvartspris är initialt grundval. Detta är uttryckligt frontendmandat, ingen automatisk avtalsteckning eller ny ersättningsregel.

Implementering på codex/partner-results-product-facts från f30f86739bf5fb60ccc7e09e2f9fca5545b2c7e2: gemensamma kund-/avtalsrapporter och Insikter avgränsas till P.partner i partnervy, oavsett intern vald partner. Inga interna kostnader, nettobidrag eller partnerinställningar exponeras i dessa vyer. Rapportfilter bevaras separat per perspektiv/partner. Lokal visningsavgränsning är inte autentisering.

Avtalsfakta har sex B2B- och fem B2C-kort, källdatum och officiella produkt-/villkorslänkar. Befintliga Elakademin-filmer länkas som principutbildning, inte kompletta produktspecifika genomgångar. Verifierat exakt produktblad saknas för Kraftringen Stabil och företagets Kvartspris; Individuell portfölj har bara allmän portföljkälla. Saknade detaljer markeras, inga priser eller bindningstider gissas.

Grundval sparas i propertyDefaults i befintlig normal-/demoisolerad state. Nya manuella/Excel-utkast får en ögonblicksbild som går att ändra; importens val gäller valda nya rader. Äldre utkast utan val förblir utan val. Registrerad desiredProduct är ett önskemål; fullmakt och offerChoice förändras inte. Dubbletter skriver inte om tidigare val; sparfel återställer data.
