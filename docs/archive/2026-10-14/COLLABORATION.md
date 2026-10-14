# Arbeta tillsammans i Partnerlabb

Användaren har uttryckligen valt det publika repot
https://github.com/ludros93-prog/kraftringen-partnerlabb. Källkod och bevarad
Git-historik har laddats upp och verifierats. GITHUB-STATUS.md visar faktisk
aktiveringsstatus, revisioner och behörigheter. GitHub är huvudkälla;
RUNBOOK.md beskriver utveckling och Sites-publicering. RUNBOOK-SITES.md
bevarar den äldre arbetsrutinen som referens.

GitHub är den gemensamma källan för kod, instruktioner och arbetsminne.
Ludwig använder ChatGPT/Codex och Daniel använder Claude Code med
GitHub-kontot `daniel-smail`.
Verktygen arbetar mot samma repo med varsitt konto och separata arbetsgrenar.
Tillgång till repot och till den publicerade portalen hanteras separat;
Daniels verifierade GitHub-åtkomst är publik läsning. Skrivbehörighet är
ännu inte bekräftad och behöver ordnas av repoägaren innan han skickar
arbetsgrenar till det gemensamma repot.
GitHub har nekat anslutningens försök att ge Daniel skrivbehörighet (403).

## En uppgift per arbetsgren

1. Läs AGENTS.md, MISSION.md, PILOT-MISSION.md, PILOT-FACTS.md,
   PILOT-DECISIONS.md, PILOT-ACCEPTANCE.md, RUNBOOK.md, BACKLOG.md och senaste WORKLOG.md.
   Läs öppna pull requests innan du börjar, så att samma uppgift inte byggs
   två gånger.
2. Hämta aktuell `main`. Skapa en egen gren, exempelvis
   `codex/inflytt-nasta-steg`, `claude/partner-resultat` eller
   `agent/inflytt-02`. Parallella uppgifter använder olika grenar/checkouter.
3. Beskriv vilket problem du tar och genomför en avgränsad förbättring.
   Bevara fungerande flöden, lokalt sparad data och de bekräftade affärsfakta
   som finns i AGENTS.md.
4. Kör kontroller som är relevanta för ändringen. Starta appen med
   `python -m http.server 8000 --directory dist` om du vill testa lokalt.
5. Skicka din gren till GitHub och öppna en pull request till `main`.
   Ange användarnytta, berörda flöden, faktiskt körda tester och eventuella
   begränsningar. Ett kodförslag är färdigt när det går att granska och testa.

Om någon annan ändrat samma del hämtar du den nya basen och löser konflikten
i din egen gren. Kör berörda kontroller igen. Skriv inte över någon annans
arbete och använd aldrig force-push till den gemensamma huvudgrenen.

## Integrera och publicera

Ludwig/Codex är inledningsvis samordnare. Samordnaren granskar och testar
förslagen, för in färdiga ändringar i `main` och publicerar den samlade,
verifierade versionen till samma Partnerlabb-länk:

https://kraftringen-partnerlabb.rosen123.chatgpt.site

För Daniels arbete gäller ett särskilt godkännandesteg: Ludwig måste
uttryckligen godkänna den konkreta pull requesten och dess aktuella HEAD-SHA
innan samordnaren integrerar ändringen i `main` eller publicerar den på Sites.
Samordnaren kan granska, testa och förbereda en färdig ändring innan dess.
Dokumentera PR-länk, godkänd SHA och Ludwigs faktiska godkännande i WORKLOG.md.
Om Daniel lägger till commits, eller om integrationen kräver korrigeringar i
hans ändring, behöver Ludwig godkänna den uppdaterade revisionen igen.

Codex och andra agenter får inte använda Ludwigs GitHub-identitet för att
fabricera mänskligt godkännande eller kringgå skydd för Daniels arbete.
Det tidigare självständiga bygguppdraget godkänner inte Daniels enskilda
revision. Kravet följer hans ändring även om den flyttas till en annan gren.
Oberoende, redan auktoriserat agentarbete behåller sitt befintliga mandat.

CODEOWNERS anger `ludros93-prog` som kodägare. GitHub nekar anslutningen att
aktivera branch protection (403), så obligatoriskt kodägargodkännande är
ännu inte tekniskt verifierat. CODEOWNERS och detta arbetssätt ersätter inte
en aktiverad skyddsregel. GITHUB-STATUS.md redovisar faktisk status och de
inställningar repoägaren behöver slutföra.

Sites används som publiceringsmål. Ändringar ska först finnas i GitHubs
`main`; Sites-källan ska inte utvecklas separat. Det finns ingen antagen
automatisk synk. Följ den verifierade källöverföringen i RUNBOOK vid varje
publicering och bevara webbplatsens nuvarande åtkomst.

Återkommande masteragentpass följer också arbetsgren och pull request.
Agenten kan utveckla självständigt, men publicerar inte vid sidan av
samordnaren. Dokumentera uppnått resultat: kandidat, öppnad pull request,
integrerad ändring och lyckad publicering är olika steg.

## Gemensam kod och lokal testdata

Alla arbetar på samma kodbas. Testärenden, demoframsteg och formulärdata
lagras fortfarande i respektive webbläsare; de delas inte genom GitHub.
Lägg inte webbläsarexporter, kunduppgifter, tokens eller personliga
åtkomstuppgifter i repot. En framtida gemensam datalagring är ett separat
utvecklingsbeslut och ingår inte i flytten till GitHub.
