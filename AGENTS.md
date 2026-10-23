# Regler för arbete i Partnerlabb

## Läsning och mandat

Läs denna fil, MISSION.md och senaste posten i WORKLOG.md vid start. Hämta
aktuell GitHub-main och kontrollera öppna PR:er. Välj arbete i BACKLOG.md.
Läs därefter bara relevanta underlag enligt läskartan i README.md. Historik
under docs/archive är belägg, inte gällande instruktioner. Produktbeslut har
sin enda aktuella definition i docs/DECISIONS.md; läs berörda beslut före ändring.

Fortsätt självständigt med auktoriserade frontend-, demo- och kvalitetsförbättringar.
Saknad pilotkund stoppar inte fiktiv demo. Backend, verkliga integrationer,
kunddata och affärsvillkor kräver separat underlag och genomförandemandat enligt
PILOT-DECISIONS.md. Förbered konkreta förslag före frågor. Ändra aldrig schema,
agentprompt, aktivering eller åtkomst på eget initiativ. Skicka inga externa
meddelanden utan uttryckligt uppdrag.

## Kod, data och produkt

- Skriv svenska. Bevara marinblå/petrolfärgad design, responsivitet,
  tangentbord, etiketter och tydliga spar-/felbesked. Bildkällor hör till ASSETS.md.
- Servera dist/ utan installation eller byggsteg. package.json är enbart QA.
  Använd befintligt window.Portal, gemensam datamodell och modulregistrering.
- Använd fiktiva kunder/kontakter och .example-adresser. Lägg inga verkliga
  kundexporter, inspelningar, dokument eller hemligheter i publikt GitHub.
- Bevara v1→v2-migrering, giltig v2-data, äldre utkast/historik och isoleringen
  mellan normalyta och ?demo=inflyttning. Återställning/radering är uttryckliga val.
  Sparfel ska återställa aktuell mutation; flikkonflikter får inte skriva över nyare data.
- Kunddialog/CRM, inflyttningsservice, avtal, ekonomi och kickback är separata
  underlag. Registrering, Vunnen eller slutförd service skapar inga automatiska avtal
  eller pengar. Saknat resultat är Underlag saknas / —, inte påhittade nollutfall.
- Demovyer, dolda anteckningar och partnerfilter är inte behörighet. JSON-export
  är inte delad lagring eller fullständig backup. Påstå inga verkliga utskick,
  integrationer, villkor, certifieringar eller besparingar utan belägg.
- Bevara utbildningsmaterial, filmer och sparade framsteg. För återstående
  produktgränser och bekräftade kataloger gäller docs/DECISIONS.md.

## Samarbete och publicering

GitHub (HakanRusk/kraftringen-partnerlabb) är huvudkälla. Arbeta på egen
codex/, claude/ eller agent/-gren och lämna PR; ingen direkt push till main
eller Sites från utvecklingspass. Bevara historik, använd inte force-push.
Högst två färdiga pilotförslag får samtidigt vänta på granskning. Håkan/Codex
samordnar integration och publicering från verifierad main enligt RUNBOOK.md.
Aktuellt Sites-mål är `appgprj_6adb2c876a0c8191b1fa3c755a73f61a` med privat ägaråtkomst.
Publicera aldrig till tidigare ägares Site. Historiska ID:n är endast belägg.

**Övertagandet 23 oktober 2026:** Håkan har uttryckligen beställt kontroll av
senaste main, nya publiceringsinställningar och publicering i sin nya privata
Site. Detta avgränsade arbete får integreras efter verifiering och publiceras
till det nya målet. Det ger inget mandat att aktivera en agent, ett schema eller
framtida automatisk publicering. Övriga utvecklingspass följer PR-rutinen.

**Daniels ändringar:** Håkan måste uttryckligen godkänna konkret PR och aktuell
HEAD-SHA före GitHub-APPROVE, merge eller Sites-publicering. Dokumentera PR,
SHA och faktiskt godkännande i WORKLOG. Nya commits eller integrationsrättningar
kräver nytt godkännande. Kravet följer Daniels arbete mellan grenar; teknisk
användning av Håkans konto är inte mänskligt samtycke. Fabricera inga godkännanden
och kringgå inte skydd. Oberoende, redan auktoriserat agentarbete behåller sitt mandat.

CODEOWNERS är ingen verifierad teknisk spärr utan grenskydd. Faktisk åtkomst-
och skyddsstatus finns i GITHUB-STATUS.md; anta inte att manuella steg är gjorda.

## Verifiering och kvittens

Kör relevanta befintliga tester; npm test är den underhållna Node-/DOM-ingången.
För ändrad navigation/data, kontrollera berörda partnertyper, segment, sparfel,
omladdning och bevarad historik. Browserflöden och begränsningar finns i qa/README.md.
Dokumentation behöver inga egna tester. Uppdatera README när beteende eller
begränsningar ändras och WORKLOG med faktisk revision och verifiering.
Skilj lokal kandidat, PR, merge och lyckad publicering. Saknat verktyg är ett
konkret hinder, inte ett testresultat; slutför oberoende tillåtet arbete.
