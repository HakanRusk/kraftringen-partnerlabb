# Gällande produktbeslut

Samlad definition 14 oktober 2026. Källor är Ludwigs direkta instruktioner,
bevarade med datum i [ursprungligt arbetsminne](archive/2026-10-14/PILOT-FACTS.md)
och [ursprungliga regler](archive/2026-10-14/AGENTS.md). Tekniska val och
måttdefinitioner nedan är implementationsförslag, inte nya verksamhetsvillkor.
Vid nytt beslut: ändra definitionen här, notera källa/datum; länka från övriga dokument.
Öppna beslut D-01–D-04 definieras fortsatt enbart i ../PILOT-DECISIONS.md.

## P-01 · Partnertyper och kundsegment

Beslut 10–11 oktober: Partners samlar Säljpartner, Fastighetsbolag och Personalavtal.
Befintlig field-typ bevaras. Säljsegment väljs separat: företag/B2B, konsument/B2C
eller båda. Savera (syd) är B2B, Face2face (vast) är B2C och använder Beest enligt
bekräftelsen 8 oktober. Namnet styr inte funktioner eller katalog. Ingen Beest-
eller Dynamics-integration är beslutad; B2B Veckokollen är ett separat verktyg.

Implementerat: partnerProfiles kompletterar registret. Befintlig typ är låst;
namn får ändras för alla och segment för säljpartners. Historiska rader behåller
sitt segment. Nya partners får inga andra partners exempelutfall. estate1 och
estate2 är fiktiva fastighetsbolag; alla kund-/utfallsrader är exempel.

## P-02 · Valbart CRM

Beslut 14 oktober ersätter den äldre generella begränsningen till externt
säljverktyg: varje säljpartner kan välja Har eget CRM eller Använd Partnerportalen
som CRM vid skapande eller redigering. Befintliga profiler, inklusive Savera och
Face2face, behåller eget CRM om inget väljs. Typ och segment är separata val.

Implementerat: crmMode external/portal, crmRecords med kundkort, kontakt,
ansvarig, steg, nästa aktivitet/datum, förlustorsak och historik. Öppna affärer
kräver nästa aktivitet/datum; Förlorad kräver orsak. Sparat segment är låst;
byte av arbetssätt/konfiguration bevarar rader. Vunnen är en lokal säljstatus,
inte ett avtal, inskickat bekräftelseärende, resultat eller kickback. Delat CRM
återstår. Äldre säljunderlag/utkast bevaras utan att återinföras i aktiv meny.

## P-03 · Partnerns arbetsyta och intern uppföljning

Beslut 10–11 oktober: Kraftringens interna resultatöversikt är huvudvy. Generiska
Kunder & avtal och Insikter ligger under Partners, inte egna Savera-/Face2face-menyer.
Partnern ser egna resultat; interna kostnader/nettobidrag visas inte där.
Säljpartner med eget CRM har fyra stora ingångar: resultat, Avtalsfakta,
Academy och stöd. Portal-CRM ger vald partner en operativ arbetsyta.
Partnerresans åtta steg och två checklistmoment per steg är interna förslag,
sparade per partner i commercial.management; äldre state.journey bevaras.
Arbetslistor härleds ur befintliga poster, inte nya persistenta affärsobjekt.
Nästa insats/datum är inte SLA eller utlovad svarstid.

## P-04 · Inflyttning

Beslut 10 oktober: fastighetsbolaget gör allt aktivt portaljobb. Behåll manuell
registrering och Excel (.xlsx), förhandsgranskning, befintliga fullmaktsbilagor
per hyresgäst och uttrycklig förmedling. Inga aktiva hyresgästformulär, QR eller
direktlänkar; äldre länkar går till partnerns privata registreringsyta.
Kraftringen hanterar elhandel, behövlig elnätshantering och återkoppling.

Implementerat: separata moveins, utkast och lokala binära IndexedDB-bilagor.
Avbryt/navigation skapar inga ärenden. Saknade/misslyckade bilagor redovisas;
filens förekomst är inte verifierat samtycke eller giltig fullmakt. Äldre val,
fullmaktsdemomarkeringar och utkast bevaras utan nya befogenheter. JSON-export
innehåller inte filerna. Formulärfält/filgränser är demoförslag tills D-02 besvarats.

Beslut 11 oktober: Avtalsval har Kvartspris som initialt grundval, alternativ
Opti och Rörligt månadspris. propertyDefaults ger nya utkast en ändringsbar
ögonblicksbild; äldre utkast utan val och dubbletter skrivs inte om.
desiredProduct är önskemål, inte tecknat avtal, fullmakt eller offerChoice.

## P-05 · Fastighetssamarbetet

Beslut 11 oktober: Ert samarbete nås internt och av vald fastighetspartner.
Presentation: konkret inflyttning först, kundinflöde/kickback, föreslagen avlastning
av uthyrarnas elfrågor och egen fastighetsel. Övriga idéer är öppningsbar fördjupning.
Partnerns egen fastighetsel är en separat B2B-affär från hyresgästkanalen.

Bevara sex förslag: hyresgästernas elfrågor, underbyggda kostnadsintervall i
bostadsannonser, onödig förbrukning, elbehov före lokaluthyrning, energiöversikt
vid fastighetsaffär, samt laddning/solceller/batterier/styrning. De är inga
färdiga tjänster, belagda kundprioriteringar, SLA:er eller besparingslöften.
Lokala fokusval är diskussionsunderlag med återställning vid sparfel. De beställer
eller skickar inget. Egna avtals-/anläggnings-/pris-/volymuppgifter saknas och
ska inte lånas från säljpartnernas eller hyresgästernas resultat.

## P-06 · Personalavtal

Beslut 11 oktober: företaget är kanal till anställda; företagets egen el är
separat B2B-affär. Behåll partnertypen och översikten. Erbjudande, villkor,
registrering och ersättning saknar underlag. Bygg inte sådana flöden från typvalet.

## P-07 · Produktkataloger och utbildning

Bekräftade kataloger (senast 10 oktober):

| Segment | Produkter |
| --- | --- |
| B2B | Rörligt pris, Kvartspris, Poolportfölj Trygg, Poolportfölj Offensiv, Individuell portfölj, Kraftringen Stabil |
| B2C | Fastpris, Vintersäkrat, Opti, Kvartspris, Rörligt pris |

Avtalsfakta skiljs från utbildning. Produktnamn innebär inte pris-, behörighets-
eller produktvillkor. Exakt produktblad för Stabil/företagets Kvartspris saknas;
Individuell portfölj har allmän portföljkälla. Behåll källdatum och saknat underlag.
Fiber/andra produktområden ingår inte.

Beslut 8–11 oktober: bevara fullständiga Elakademin från v23, filmer/material,
självtest och sparade framsteg, fyra äldre demokurser samt B2C-samtalsbiblioteket.
B2B-fall/portföljprodukter märks som fördjupning för företag, inte konsumentutbud.
Kursens offentliga sakuppgifter kontrollerades 7 oktober; räkneexempel är antaganden.
Kurs-/självtestresultat är lokala, inte personverifierad partnercertifiering.
Länken till fristående Elakademin synkroniserar inte data. V34 tog bort det äldre
kurskortet, inte historiska framsteg. Samtalsljud/anteckningar ligger lokalt i
IndexedDB per partner och demoyta, ingår inte i JSON-export och delas inte mellan
användare. Använd bara syntetiskt ljud i utveckling.

## P-08 · Resultatmått och källgränser

Behov bekräftat 8–11 oktober; nedanstående måttdefinitioner är demoförslag för D-04.
Nya avtal följer stängningsdatum. MWh är avtalad årsvolym för periodens nya avtal,
inte levererad energi. Nettobidrag är manuellt exempelbidrag minus exempelpartnerkostnad.
Framtida potential ingår inte i utfall. Årsunderlaget 2026 slutar 7 oktober;
hel föregående årsbas saknas. Jämför delperioder med lika lång observerad period.

Aktiva kunder är unika kunder med startat, ej avslutat avtal vid observerat
periodslut; beståndet är inte nya avtal. Avslutades observerade kundtid skiljs
från aktivas ålder. Churn: avgångar ur periodens öppningskohort / samma kohort;
summera inte månaders nämnare för år/kvartal. Förstartsbortfall använder periodens
sålda avtal och avbrott observerade till datadatum, separat från churn.

Insikter anger period, urval, kohort/bas och datum. Popularitet bygger på samma
urval av nya avtal. Scenariot för fortsatt takt visar observerade kalenderdagar,
brytdatum och återstående horisont; saknad bas ger inget fabricerat scenario.
Inga intäkts-, MWh-, bestånds- eller kickbackprognoser utan motsvarande modell.

Fasta aggregat och fiktiva avtalsrader stäms av per månad för avtal/års-MWh.
Historik för bestånd/kundtid är separat fixture. Kundsegment på varje rad består
vid konfigurationsändring; nytt segment utan historik är saknat underlag.
Serviceanmälan, hjälpt inflyttare och nytt elhandelsavtal är skilda händelser.
Produktfilter gäller avtalsutfall, inte serviceaggregat.

Kickback är fristående manuella poster med egen källa/period och föreslagna
statusar. Postperiodens betalningar är inte kassaflöde per betalningsmånad.
Kund-/produkt-/veckofilter fabricerar ingen fördelning av månadsersättning.
Ingen automatisk avstämning mot partnerkostnad eller intjänad provision från
avtal/service finns. Verifierade regler, leadägande, exklusivitet och offertbefogenhet saknas.

## P-09 · Lokal prototyp och app

Nuvarande implementation är statisk och lokal, inte gemensam pilotdrift.
Sites-inloggningen skyddar testlänken; appens demovyer är ingen serverbehörighet.
Normal-/demoisolering och sparfel skyddar lokal användning. App på hemskärmen
använder samma manifest och vanlig portalrot utan partner-/demoparametrar.
Internet och befintlig inloggning behövs; ingen service worker/offlinesynk finns.
Appen och webbläsaren kan ha separat data. Installerad app ger ingen synkronisering.
