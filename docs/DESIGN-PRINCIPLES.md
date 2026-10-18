# Designprinciper för Partnerlabb

Senast uppdaterad: 18 oktober 2026.

Detta är ett arbetsunderlag för frontendprototypen. Principerna är informerade
av etablerad designvägledning men är inte bevis för hur Kraftringens faktiska
användare arbetar. Verkliga utfall kräver senare observation med ett
fastighetsbolag och en Kraftringen-handläggare.

## Källor och lärdomar

- [Google PAIR – People + AI Guidebook](https://pair.withgoogle.com/guidebook/):
  utgå från användarens behov, ge begriplig återkoppling och behåll användarens
  kontroll när systemet kan vara osäkert.
- [Microsoft HAX – Guidelines for Human-AI Interaction](https://www.microsoft.com/en-us/haxtoolkit/ai-guidelines/):
  gör förmåga, status och felhantering begripliga över hela interaktionen.
- [IBM Carbon – Carbon for AI](https://carbondesignsystem.com/guidelines/carbon-for-ai/):
  skilj AI-genererat eller härlett innehåll från annat innehåll och gör
  underlag och begränsningar synliga när AI faktiskt används.
- [Nielsen Norman Group – Progressive Disclosure](https://www.nngroup.com/articles/progressive-disclosure/):
  visa de viktigaste valen först och låt avancerade eller sällan använda val
  öppnas vid behov.

Partnerlabb innehåller i dag ingen AI-funktion. AI-märkning ska därför inte
läggas till som dekoration. Relevansen är designmetoden: tydlig omfattning,
synligt underlag, förutsägbara konsekvenser och mänsklig kontroll.

## Sex regler för gränssnittet

1. **En synlig nästa handling.** Första skärmbilden ska svara på vad användaren
   behöver göra nu. Sekundära förklaringar och filter får öppnas vid behov.
2. **Tillstånd före katalog.** Öppna ärenden, fel eller saknat underlag går före
   allmän presentation. En tom partner behöver däremot en tydlig startväg.
3. **Status, bas och datum nära värdet.** Visa vad siffran avser, observerat
   slutdatum, period och källa. Saknat underlag visas som saknat, aldrig som noll.
4. **Förhandsgranska före konsekvens.** Import, registrering och förmedling ska
   ha granskning och uttrycklig bekräftelse. Navigation får inte skapa händelser.
5. **Bevara kontroll och återhämtning.** Avbryt, omladdning och sparfel ska inte
   fabricera status eller förlora tidigare data. Fokus ska hamna begripligt.
6. **Skilj fakta, förslag och scenario.** Fiktiva data, lokala diskussionsval och
   villkorade scenarier ska vara märkta och hållas åtskilda från verkliga avtal.

## DESIGN-01 · Nästa testbara hypotes

### Problem att mäta

Fastighetsöversikten visar i dag introduktion, två registreringsval, resultat,
status, uppmärksamhetslista och senaste ärenden i samma fasta ordning. För en
partner med öppna ärenden kan det operativa nästa steget därför hamna efter
generell information. För en ny partner är introduktion och registrering däremot
rimligast först. Detta är en kod- och layoutobservation, inte användarbevis.

### Avgränsat förslag

- **Ny eller tom partner:** startförklaring och valen manuell/Excel först.
- **Öppna ärenden eller saknade bilagor:** “Behöver uppmärksamhet” och relevant
  status först, med en tydlig väg till ärendet.
- **Ingen dold funktion:** registrering, resultat, samarbete och senaste ärenden
  finns kvar; bara ordning och progressiv visning prövas.
- **Ingen automatisk handling:** vyval skapar inte tjänsteval, förmedling,
  avtal, intäkt eller kickback.

### Acceptans före färdig PR

- dokumenterad före/efter-geometri vid 320, 390 och 1440 px;
- hela vägen manuell/Excel → fullmakt → förmedling är fortsatt nåbar;
- tangentbordsordning och fokus är logiska i båda tillstånden;
- omladdning, avbrott och simulerat sparfel bevarar data och korrekt status;
- ny lokal fastighetspartner lånar inte exempeldata från annan partner;
- kort observationstest med fastighetsbolag och handläggare planeras separat;
  kodtest får inte beskrivas som bevisad intuitivitet.

DESIGN-01 konkurrerar inte med ett nytt tjänsteflöde. Om baslinjen inte visar
att ordningen faktiskt skymmer nästa handling ska ingen ändring göras.
