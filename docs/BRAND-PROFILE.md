# Grafisk profil i Partnerlabb

Källa: Håkans bifogade **Kraftringen grafiska riktlinjer 2022** och
**OneDrive_1_2026-10-28.zip**, mottagna 28 oktober 2026. Manualen gäller före
tidigare färguppskattningar från Kundrum-bilden. Originalmanualen och ZIP-filen
läggs inte i det publika kodarkivet.

## Gemensam implementation

`dist/brand-profile.css` laddas sist i alla tre HTML-ingångar. Samtliga
modulers CSS använder samma `--kf-*`-palett. `brand-palette.json` är en
maskinläsbar förteckning. Ändringar av profilvärden görs här, inte med nya
lokala färger per vy.

| Regel | Tillämpning |
| --- | --- |
| Poppins, s. 11–13 | Lokala WOFF2: Light 300, Regular 400, Medium 500, Bold 700, Light/Medium Italic. Inga externa fontanrop. |
| Marinblå #013c57 | Navigation, huvudtext, diagramtotaler och utvalda sammanfattningar. |
| Rosa #f8c3c6 | Primära handlingsknappar med marinblå text. |
| Orange #fbc34e | Aktiv huvudmeny, utvalda nyckeltal och väntande ordrar. |
| Korall #eb5f4b | Små signalmarkeringar för bortfall/fel; inga koralltoningar. |
| Komplementfärger, s. 10 | #f6a924, #ee7d11, #00acd6, #007da8 samt svart/vitt. |
| Toningar | 80/60/40/20 procent av färg mot vitt, utom korall. Vita arbetsytor begränsar tonade ytor. |
| Kontrast, s. 9 | Marinblå text på rosa/orange; vit text på marinblått. |
| Rundningar, s. 15 | Webbanpassning: cirka 12 px på knappar och 18 px på kort. |

Manualens färgandelar 50/20/20/högst 10 procent används som kompositionsriktning,
inte bokstavlig pixelräkning av vita arbetsytor. Rubrikstorlekar anpassas till
datatäta tabeller och mobilskärmar; vikter och hierarki följer manualen.
Manualens RGB-/HEX-uppgifter skiljer sig för vissa färger. Webbens CSS använder
de uttryckligt angivna HEX-värdena. Originallogotypens blå pixelvärde #083c57
bevaras i själva filen; logotyper färgas aldrig om för att matcha CSS.

## Godkända logotyper

De tre originalen kopieras byte för byte till `dist/assets/brand/`:

| Fil | Original | SHA-256 |
| --- | --- | --- |
| logo-white.png | kraftringen_logo_NEG.png | 593f66a7b324a823aa05f1e588cadb7fe740744a601c4d7941bc11e08d3493d5 |
| logo-blue.png | kraftringen_logo_RGB.png | 1ec8f63a877c92d7aede43365c9c00ae71599f6b470ab57b6322ffef49e8d32a |
| logo-black.png | kraftringen_logo_black.png | 15db4b626c5c06d7db50c8e652e5c572faf424cfe7f507d351eaef8b2747da67 |

Vit originalfil används upptill till vänster på marinblå bakgrund i portalen
och de båda fristående utbildningsingångarna. Svart är en reserv för tillåtna
undantag, inte portalens standard. Proportionen 1170:199 bevaras. Friytan ska
minst motsvara f-höjden: 145/1170 av bildens bredd. CSS ger 1/8 av bredden
på samtliga sidor, även på mobil. Namnet Elakademin ligger utanför friytan.

Appikoner och favicon använder originalets symbol, tillåten enligt s. 8.
`tools/build-app-icons.py` beskär exakt symbolområdet (0,0,230,184), skalar
likformigt och centrerar det på marinblå bakgrund med friyta och maskable-marginal.
Ingen symbol ritas om eller konstrueras av bokstäver/cirklar.

## Typsnitt och licens

Poppins hämtades från Google Fonts officiella `ofl/poppins`-katalog:
https://github.com/google/fonts/tree/main/ofl/poppins.
Fullständiga TTF-filer konverterades till WOFF2 utan teckenurval eller ändrade
konturer. SIL Open Font License finns i `dist/assets/fonts/Poppins-OFL.txt`.
Äldre Inter-filer bevaras som historisk resurs men laddas inte av gränssnittet.

## Gräns för granskningen

Hela appens HTML/CSS-gränssnitt, utbildningssidornas skal, formulär, diagram,
navigation, favicon och appikoner omfattas. Funktioner, data, produktsortiment,
historik och provisionsmodell ändras inte.

Fotografierna är fortfarande dokumenterade demoillustrationer från Unsplash,
inte verifierat godkända Kraftringen-fotografier. ZIP-filen innehöll logotyper,
men inget bild- eller ikonbibliotek. Befintliga funktionella linjeikoner är
gränssnittssymboler, inte påstått officiella varumärkesikoner.
Inbyggd grafik/typografi i befintliga filmer, posterbilder, PDF:er och PowerPoint
är bevarad och har inte omproducerats eller fullständigt profilgranskats.
Detta är en dokumenterad kvarstående innehållsgranskning, inte ett påstående
om att utbildningsmaterialet är grafiskt godkänt i sin helhet.

## Verifiering och återställning

`npm test` skyddar befintliga data-/affärsflöden. Chromium-sviten testar
320/390/1440 px; profilkontrollen mäter inläst Poppins, logotypens proportioner
och friyta, primärknapparnas kontrast och avsaknad av sidöverflöde på alla tre
HTML-ingångarna. Befintliga browserflöden kontrollerar order, provision,
produkter, historik, formulär, utbildning och olika partnertyper.
Fysisk installation på iOS/Android och varje filmruta verifieras inte av CI.

Återställ genom Git-revert av profiländringen och publicera verifierad main
till Håkans befintliga privata Site. Ingen lokal datamigrering behövs.
