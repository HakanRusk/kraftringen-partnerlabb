# Produktguidens underlag · 27 oktober 2026

Katalogen följer Håkans tio orderprodukter (DECISIONS P-10/P-11).
Produktbeskrivningar är korta sammanfattningar; målgrupp, kundvärden och
samtalsargument är redaktionella förslag. Ingen besparingsgaranti.

## Lästa offentliga källor

- https://www.kraftringen.se/privat/el/vara-elavtal/rorligt-manadspris/
- https://www.kraftringen.se/privat/el/vara-elavtal/rorligt-kvartspris/
- https://www.kraftringen.se/privat/el/vara-elavtal/kraftringen-opti/
- https://www.kraftringen.se/foretag/el/vara-elavtal/rorligt-elpris/
- https://www.kraftringen.se/foretag/el/vara-elavtal/poolportfolj/
- https://www.kraftringen.se/foretag/el/vara-elavtal/portfoljforvaltning/
- https://www.kraftringen.se/privat/el/vara-elpriser/

Opti jämför sina två alternativ, inte alla marknadens avtal. Pool-/individuell
webbsida är generell och innebär inte att olika produktnamn har identiska
villkor. Projektets bekräftade säljarunderlag och Stabil-definition från
Avtalsfakta bevaras. Utbildnings-PDF och lektioner länkas utan filändringar.
Kraftringen Direkt saknar verifierad definition. Företagens kvartspris saknar
exakt produktblad. Dessa begränsningar visas på sidan.

## Prisdata

Inga numeriska webbpriser har importerats. Webbplatsens rörliga total-/jämförpriser
kan avse föregående månad och är inte en godkänd partnerprislista.
Alla inbyggda belopp är fiktiva testkomponenter. Konsumentbelopp anges inkl.
moms, företag exkl. moms. Standard och separata partnerexempel gör det möjligt
att testa växling. Offertprodukter visar saknat prisunderlag.

För riktiga listor behövs ID/version, giltighetstid, partneromfattning,
produkt, elområde/volym/avtalstid om tillämpligt, moms och fullständig prisformel.
Verklig åtkomstkontroll kräver serverstöd innan konfidentiella priser används.

## Prova

Välj Face2face och Produkter. Växla prislista och öppna Skapa order på Opti.
Kontrollera produkt/kategori/lista, skapa kund vid behov, spara utkast eller
registrera komplett fiktiv order. Orderdetaljen visar den sparade prisreferensen.
Välj Företag och Direkt: offertunderlag saknas och inga nollpriser visas.
Byt till Savera: Face2faces lista ska inte visas. Gamla Avtalsfakta-länkar ska
öppna guiden med bevarade fördjupningslänkar. Fastighetspartner bevarar sin vy.

## Jämförelse och partnerurval · 27 oktober 2026

Jämförelsetabellerna sammanfattar samma källunderlag som produktkorten: prismodell,
lämplig kund, påverkansmöjlighet, risk och avgift/påslag enligt vald exempelprislista.
Direkt och offertpriser markeras fortfarande som saknat underlag. Ikonerna är
lokala dekorativa SVG:er; produktnamnet är alltid utskrivet. Tabellen har egen
sidledsrullning på små skärmar och klickbara genvägar till detaljerna.

`salesAudiences` förblir enda källan för kundkategorier. `partnerProfiles[id].catalogAccess`
innehåller produktnycklar (`kategori:namn`) och prislist-ID:n. Saknad konfiguration
använder tidigare standardurval; explicit tom eller skadad konfiguration ger inget
urval. Alla listor är fiktiva, och internrollen kan uttryckligen tilldela valfri
exempellista. Publik frontend/rollväljare är inte säker åtkomstkontroll.

Sparning använder partnerprofilens befintliga atomiska lagring och konfliktspärr.
Orderns sparfunktion validerar kategori, produkt och prislista tillsammans;
historik och registrerade prisreferenser skrivs inte om. Borttagna val i äldre
utkast visas som inte tillgängliga i stället för att bytas tyst.
