# Claude i Partnerlabb

Läs projektets gemensamma instruktioner och arbetsminne:

@AGENTS.md
@GITHUB-STATUS.md
@MISSION.md
@PILOT-MISSION.md
@PILOT-FACTS.md
@PILOT-DECISIONS.md
@PILOT-ACCEPTANCE.md
@RUNBOOK.md
@COLLABORATION.md
@BACKLOG.md
@WORKLOG.md

Pilotmissionen styr nu prioriteringen före generell funktionsutbyggnad.
Fakta, förslag och saknat verksamhetsunderlag ska hållas isär. Samma data-
och godkännanderegler gäller; agentens skapande inför ingen riktig pilotdrift.

GitHub är utvecklingens huvudkälla. Användaren har uttryckligen valt det
publika repot https://github.com/ludros93-prog/kraftringen-partnerlabb.
Källkod och bevarad Git-historik har laddats upp och verifierats.
GITHUB-STATUS.md visar faktisk aktiveringsstatus, revisioner och behörigheter.
Daniels verifierade åtkomst är publik läsning, utan bekräftad skrivbehörighet.
GitHub har nekat anslutningen att ändra den behörigheten (403).
Kontrollera ditt eget kontos behörighet före push och rapportera konkreta
åtkomsthinder. RUNBOOK-SITES.md bevarar endast den äldre arbetsrutinen.
Den befintliga Sites-testportalens privata åtkomst ska bevaras.

Arbeta i en egen `claude/`-gren från aktuell `main` och lämna färdiga,
verifierade ändringar som en pull request.
Dokumentera problemet, användarnyttan och faktiskt körda kontroller i den.

Ludwig/Codex samordnar inledningsvis integration och publicering till den
befintliga Sites-webbplatsen. Ett avslutat utvecklingspass innebär en färdig
kandidat eller pull request; det innebär inte automatiskt att något är live.

För Daniels arbete måste Ludwig uttryckligen godkänna den konkreta PR:en och
dess aktuella HEAD-SHA innan integration i `main` och Sites-publicering.
Dokumentera PR, godkänd SHA och Ludwigs faktiska godkännande i WORKLOG.md.
Nya commits eller integrationskorrigeringar kräver nytt godkännande av den
uppdaterade revisionen. Fortsätt utveckla och testa i arbetsgrenen medan
godkännandet saknas; presentera en färdig ändring som Ludwig kan granska.

En agents användning av Ludwigs GitHub-konto är inget mänskligt godkännande.
Skapa inte en godkännande granskning eller kringgå skydd för Daniels arbete
utan Ludwigs faktiska samtycke till revisionen. Det tidigare bygguppdraget
godkänner inte Daniels enskilda leverans. Flytt till en annan gren eller
integrationskorrigering upphäver inte kravet. Oberoende, redan auktoriserat
agentarbete behåller sitt befintliga mandat.

CODEOWNERS anger Ludwig som kodägare. Branch protection är ännu inte
verifierat; anslutningens försök att aktivera skyddet nekades av GitHub (403).
Instruktionerna utgör därför ingen verifierad teknisk spärr. Se aktuell
behörighets- och skyddsstatus i GITHUB-STATUS.md.

Fortsätt självständigt inom det godkända prototypuppdraget och den aktiva
arbetsrutinen. Även återkommande arbete följer separat gren och pull request.
Gör ingen direkt push till `main` eller Sites från ett utvecklingspass.
Ändra inte scheman eller åtkomst på eget initiativ.

Om din miljö saknar ett verktyg eller en behörighet som nämns i RUNBOOK,
rapportera det konkreta hindret och slutför oberoende tillåtet arbete. Hitta
inte på testresultat, en skapad pull request eller en publicering.
