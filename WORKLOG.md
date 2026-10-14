# Senaste arbete och kvittenser

Äldre logg (2 278 rader) bevaras oförändrad i
[docs/archive/2026-10-14/WORKLOG.md](docs/archive/2026-10-14/WORKLOG.md).
Skriv nya faktiska resultat här; kopiera inte produktbesluten från docs/DECISIONS.md.

## 14 oktober 2026 · CI, perioder, arbetsminne och backendunderlag

Ludwigs uppdrag: ”Är det inte lättare att du gör det själv?” efter förslaget
att utföra granskningspunkterna 7, 3 och 11 samt backendunderlag för punkt 1.
Eget oberoende Codex-arbete från main 2fe6381613ce6e11c5a92affe5aa7e4f9bd414f7,
gren codex/partnerlabb-quality-and-pilot-spec. Inga andra PR:er var öppna vid start.

- CI: aktiva .github/workflows/quality.yml, låsta QA-beroenden och gemensamma
  kommandon för 11 Node-/DOM-sviter samt tre centrala Chromiumingångar. QA gate
  kräver båda jobb. Inga secrets eller automatisk merge/publicering.
- Perioder: månad och kvartal nyast först. September kvar som initial månad;
  oktober anger delperiod till 7 oktober. Inga ändrade fixtures/jämförelsebaser.
- Dokumentation: elva originalfiler arkiverade exakt; korta aktuella regler,
  läskarta och ett samlat produktbeslutsdokument. Daniels revisionsgodkännande,
  datagränser och publiceringsrutin bevarade. Ingen automation/åtkomst ändrad.
- D-03: konkret specifikation i docs/BACKEND-PILOT.md. Ingen backend byggd/aktiverad.
- Lokal verifiering: npm test passerar 11 sviter och JavaScript-syntax, inklusive
  13 CRM-scenarier och nya periodkontroller. DOM är inte browser-/layoutverifiering.
- Lokal Chromiumkörning saknas i denna miljö; faktisk CI och publicering kvitteras
  efter genomförandet, inte genom workflowfilens existens.

## Senast verifierat publicerad · v35 · 14 oktober 2026

Valbart CRM integrerat via PR #51; källrevision
ae18c0cd0ca5d4ef6cb11b5434bc0218c9bb64b8.
Native Sites version:
appgprj_6ac600ecf7d48191923687550810c1d4~appgver_3d23466657a08191966f5b56568effd1.
Deployment appgdep_6acf2dabe1b88191b5dc61231852641c bekräftade succeeded
2026-10-14T07:22:37.984067Z på
https://kraftringen-partnerlabb.rosen123.chatgpt.site.
Custom-delning oförändrad. Efterhandskvittens PR #52 gav main 2fe6381;
dist/ var oförändrad. Full historik/testbelägg i arkivets sista poster.
