# Bildkällor

## Excel-import

`dist/vendor/exceljs-4.4.0.min.js` är ExcelJS 4.4.0, hämtad den 10 oktober
2026 från https://cdn.jsdelivr.net/npm/exceljs@4.4.0/dist/exceljs.min.js.
Den serveras lokalt och läser/skapar `.xlsx` i webbläsaren. Inga filer skickas
till en extern importtjänst. Projektkälla: https://github.com/exceljs/exceljs.
MIT-licensen sparas i `dist/vendor/exceljs-license.txt` från samma versionspaket.

`dist/assets/inflyttning-testbilaga.pdf` skapades i detta projekt den 10 oktober
2026 med ReportLab. Det är en tydligt märkt fiktiv fil för uppladdningsprov,
utan underskrift, personuppgifter, fullmaktsvillkor eller rättsverkan.
Dokumentet är ingen föreslagen eller godkänd fullmaktsmall.

## Typografi

`dist/assets/inter-variable.woff2` är Inter Variable från projektets officiella
källa: https://github.com/rsms/inter/tree/master/docs/font-files.
Den hämtades den 10 oktober 2026 och serveras lokalt utan extern fontförfrågan.
SIL Open Font License finns i `dist/assets/inter-license.txt` och originalet på
https://github.com/rsms/inter/blob/master/LICENSE.txt.

Prototypen använder följande bilder från Unsplash. Filerna är sparade lokalt under `dist/assets/`.

| Fil | Källa |
| --- | --- |
| `dist/assets/wind.jpg` | [Unsplash – vindkraft](https://images.unsplash.com/photo-1466611653911-95081537e5b7) |
| `dist/assets/office.jpg` | [Unsplash – kontorsmiljö](https://images.unsplash.com/photo-1497366811353-6870744d04b2) |
| `dist/assets/solar.jpg` | [Unsplash – solenergi](https://images.unsplash.com/photo-1509391366360-2e959784a276) |
| `dist/assets/home.jpg` | [Unsplash – bostadsillustration](https://images.unsplash.com/photo-1600585154340-be6161a56a0c) |

Bilderna illustrerar energi och arbetsmiljö i översikten, Academy, materialvyn och kundsideförhandsvisningar. De visar inte verifierade kunder, anläggningar eller verksamhetsplatser hos Kraftringen och antas inte vara godkända Kraftringen-bilder. En solenergibild innebär inte att solprodukter ingår i portalens beslutade produktutbud.

Fotografernas namn och bildsidornas adresser har inte verifierats; källänkarna ovan dokumenterar de använda bildresurserna utan tillskrivning som saknar underlag.

## Elakademin

| Resurs | Källa och användning |
| --- | --- |
| `dist/assets/elakademin-cover.png` | Omslag från den färdiga Elakademins egen Higgsedit-komposition. Innehåller utbildningsgrafik och ett genererat vuxenporträtt. Porträttet föreställer ingen verifierad Kraftringen-medarbetare. |
| Sex MP4-länkar i `dist/elakademin-data.js` | Slutliga, redan publicerade kapitelfilmer från Elakademin. Kapitel 4 använder den korrigerade filmen. 1920 × 1080, H.264/AAC, svenskt tal och inbränd svensk text; sammanlagd speltid 11:29. Filerna spelas från Higgsfields media-CDN och har inte kopierats eller producerats på nytt. |
| `dist/assets/elakademin-kundguide.pdf` | Elakademins färdiga kundguide på 12 sidor, kopierad från samma utbildningsportal. Innehåller företagsinriktade undervisningsexempel, ordlista, checklista och publika källor. |

Kursens text och originalfrågor kommer från den färdiga Elakademin (`/workspace/training/course.json`); de slutliga filmerna och filmmanusen från dess `video-manifest.json`. Publika produktkällor finns i kursdialogen. Interna Gamma-original, interna presentationsbilder och administrativa videoprojekt har inte lagts till i partnerportalens publika filer. Omslaget är utbildningsmaterial som byggts för denna utbildning och antas inte vara en separat godkänd Kraftringen-varumärkestillgång.

## Elakademin v2 – fullständig partnerutbildning

Användarens produktunderlag ”Produktspecifikationer för säljare”, daterat
10 oktober 2026, är huvudkälla för alla tio produkter. Det sparas redan som
`dist/utbildning-preview/produktspecifikationer.pdf`. De bifogade originalen
”Elhandel från grunden B2B v1” används för grunder och källhänvisningar.
Originalsjälvstudierna finns i
`dist/elakademin-material/Kraftringen-Grundunderlag-v1.pdf` (91 sidor).
Ludwigs direkta precisering styr att Stabils gemensamma pris gäller endast
den säkrade månadsutjämnade delen. Källsidnummer anges i kapiteldata.

Ny självstudiehandbok och redigerbar PowerPoint i
`dist/elakademin-material/` skapades för denna kurs från samma kanoniska
`dist/elakademin-data.json`. De innehåller utbildningsexempel, inte verkliga
kundpriser. Generatorscript finns i `tools/build-elakademin-documents.py`.
Redigerbara diagram visar viktning, prognos/faktiskt uttag, Optis hela
månadsjämförelse och Vintersäkrats standardkalender. De är författade från
produktkällan och verifierade beräkningar, inte genererade prisuppgifter.

Ny berättarröst är exakt Higgsfield-preset Arthur,
`30fc8796-ceb6-4a66-b3a7-4a145ef7f346`, via ElevenLabs Text-to-Speech V2.
Figuren bygger på användarens uttryckligen inskickade referensbild med
3D-figur i mörkblå keps och arbetskläder. Godkänd restaurering bevarar
karaktären; en underkänd variant med påhittat skägg används inte. Figuren
är kursens tecknade guide och föreställer ingen verifierad medarbetare.

Kapitelfilmernas fullständiga berättarmanus finns i varje kapitel och i
PowerPointens talaranteckningar. Native Higgsedit-projekt ritar 270
innehållsanpassade grafiktillstånd över 18 lektioner. Faktiskt mätta svenska
ordtider synkar förklaringar, diagram och de kanoniska WebVTT-filerna i
`dist/elakademin-material/textning/`. Textningen har kontrollerats ord för
ord mot alla 8 693 godkända manusord och har giltiga cue-tider. Den mätta
kapitelfilmspeltiden är 95 min 10,715 s, plus 16,939 s introduktion.
Alla 18 filmer, originalinläsningar, postrar och ett gemensamt paket med
19 redigerbara projekt är native-bekräftade och oberoende granskade.
Paketet har 325 filer och 229 682 163 bytes, SHA256
`6a93ccaf8a8754e3adc5976654bbc1b3f641b01d6c3ad00d662fb0e690593ba3`.
Samtliga relativa runtime-assets, fonter och 19 originalinläsningar finns
och matchar verifierade SHA. Inga credentials eller presignerade receipts
ingår. Publika ursprungsreferenser i metadata behövs inte för lokal rendering.
Fryst mediemanifest har SHA256
`62e06483a929d2ab4445fd82d05d51002c24b7066bbbf69606b26b0c8ed1e152`.
Bild-/talproduktion och publiceringskvittens finns i WORKLOG; bara
bekräftade permanenta HTTPS-media-URL:er publiceras i kursdata.

Filmformat är H.264/AAC, 1280 × 720, 24 fps. Native animerad grafik och
illustrerad guide följer berättarrösten; figuren har ingen läppsynk.
Redigerbara projektarkiv anges per färdig film i dess mediaobjekt.
Higgsfields media-CDN serverar filmer och postrar; inga presignerade
uppladdningsadresser eller credentials läggs i Git. Slutliga video-URL:er
är leveransresurser, inte en garanti för separat kundbehörighet på CDN.
Portalens befintliga Sites-åtkomst bevaras. Inga riktiga kundsamtal eller
kunduppgifter producerades eller publicerades i denna kurs.
