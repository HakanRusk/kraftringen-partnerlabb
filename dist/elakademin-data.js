/* Slutligt Elakademin-material. Publika kundkällor; inga interna originalbilder. */
window.PartnerElakademin = {
  "title": "Elakademin – Förstå din elaffär",
  "description": "Elmarknaden, elavtal och portföljprodukter – sex textade filmer med kapiteltext och självtest.",
  "durationLabel": "11:29",
  "academyUrl": "./elakademin.html",
  "guideUrl": "assets/elakademin-kundguide.pdf",
  "cover": "assets/elakademin-cover.png",
  "modules": [
    {
      "id": "elsystemet",
      "title": "Från kraftverk till verksamhet",
      "subtitle": "Förstå vilka som gör vad – och skillnaden mellan energi och effekt.",
      "eyebrow": "Kapitel 1 · Grunderna",
      "learningGoals": [
        "Skilja elhandel från elnät.",
        "Förklara varför elsystemet behöver vara i balans.",
        "Skilja kWh, MWh och kW åt."
      ],
      "sections": [
        {
          "heading": "Möt Lundverk AB",
          "body": [
            "Lundverk AB är ett påhittat verkstadsföretag i Lund. I utbildningens exempel använder företaget 100 MWh el per år, alltså 100 000 kWh. Alla priser, andelar och kostnader som vi räknar med är antaganden för att visa principerna.",
            "Årsförbrukningen säger hur mycket el företaget använder, men inte när den används. Den skillnaden blir viktig när vi kommer till priser och avtalsval."
          ]
        },
        {
          "heading": "Fyra roller att känna igen",
          "body": [
            "Producenter tillverkar el, till exempel i vindkraftverk, vattenkraftverk och kärnkraftverk. Elhandelsbolaget köper in el och säljer ett elavtal till verksamheten. Elnätsbolaget ansvarar för nätet som transporterar elen till anläggningen.",
            "Du kan välja elhandelsbolag. Vilket elnätsbolag som gäller beror på var anläggningen finns. Svenska kraftnät har systemansvaret för Sveriges elsystem och arbetar för att produktion och användning hela tiden ska vara i balans.",
            "El kan lagras, exempelvis i batterier. Samtidigt måste elsystemets produktion, import, användning, export och förluster hela tiden balanseras. Elhandeln hjälper marknadens aktörer att planera för den balansen."
          ]
        },
        {
          "heading": "kWh mäter mängd, kW mäter effekt",
          "body": [
            "Kilowatt, kW, beskriver hur stor effekt en maskin använder vid ett tillfälle. Kilowattimme, kWh, beskriver hur mycket energi som används över tid. En maskin som använder 10 kW under en timme använder 10 kWh.",
            "Två sådana maskiner samtidigt använder tillsammans 20 kW. Kör de en timme blir energin 20 kWh. En megawattimme, MWh, är 1 000 kWh. Hög samtidig effekt kan påverka nätkostnaden om nätavtalet har en effektavgift."
          ]
        }
      ],
      "takeaways": [
        "Elhandeln gäller elavtalet; elnätet transporterar elen.",
        "Elsystemet behöver hela tiden vara i balans.",
        "kWh är energi över tid. kW är effekt vid ett tillfälle."
      ],
      "script": "Välkommen till Förstå din elaffär. Här följer vi Lundverk AB, ett påhittat verkstadsföretag i Lund. I våra exempel använder företaget hundra megawattimmar el per år. Det är hundratusen kilowattimmar. Siffrorna hjälper oss att förstå principerna och är inga erbjudanden.\n\nVi börjar med vilka som gör vad. Producenter tillverkar el i exempelvis vindkraftverk och vattenkraftverk. Elhandelsbolaget köper in el och säljer elavtalet till företaget. Elnätsbolaget ansvarar för ledningarna som transporterar elen till verkstaden. Du kan välja elhandelsbolag. Elnätsbolaget följer platsen där anläggningen ligger.\n\nSvenska kraftnät har systemansvaret. Produktion och användning behöver hela tiden balanseras, tillsammans med import, export och förluster. Batterier kan hjälpa till genom att lagra energi, men behovet av balans finns varje sekund.\n\nNu två enheter som lätt blandas ihop. Kilowatt beskriver effekt, alltså hur mycket en maskin använder vid ett tillfälle. Kilowattimme beskriver energimängden över tid. En maskin på tio kilowatt som körs i en timme använder tio kilowattimmar. Två likadana maskiner samtidigt ger tjugo kilowatt i effekt. Efter en timme har de använt tjugo kilowattimmar.\n\nLundverk behöver därför hålla koll på både mängden el och när maskinerna körs. En årsförbrukning berättar hur mycket el som används, men tidpunkterna kan också påverka kostnaden. I nästa kapitel ser vi hur priset bildas.",
      "quiz": [
        {
          "id": "elsystemet-1",
          "question": "Lundverk byter elhandelsbolag. Vad innebär det för elnätet?",
          "options": [
            "Ledningarna byts till det nya elhandelsbolagets nät.",
            "Elnätsbolaget är fortfarande det som gäller för anläggningens plats.",
            "Företaget behöver inte längre ett elnätsavtal."
          ],
          "correctIndex": 1,
          "explanation": "Elhandel och elnät har olika uppgifter. Ett byte av elhandelsbolag ändrar inte vilket elnätsbolag som ansvarar för nätet på platsen."
        },
        {
          "id": "elsystemet-2",
          "question": "En maskin använder 10 kW och körs i två timmar. Hur mycket energi använder den?",
          "options": [
            "20 kWh.",
            "5 kWh.",
            "20 kW."
          ],
          "correctIndex": 0,
          "explanation": "Energin är effekt gånger tid: 10 kW × 2 timmar = 20 kWh. kW är effekt och kWh är energi."
        }
      ],
      "video": {
        "url": "https://d2ol7oe51mr4n9.cloudfront.net/user_3Ie1Iki0WR4cljmRAWwmFoTWjNm/ce47686d-2f83-4bb0-98fd-45c38641db3b.mp4",
        "durationLabel": "1:54",
        "poster": "assets/elakademin-cover.png"
      }
    },
    {
      "id": "elmarknaden",
      "title": "Varför elpriset förändras",
      "subtitle": "Utbud, efterfrågan, kvartar och Sveriges fyra elområden.",
      "eyebrow": "Kapitel 2 · Marknaden",
      "learningGoals": [
        "Beskriva hur utbud och efterfrågan påverkar spotpriset.",
        "Förstå varför olika elområden kan ha olika priser.",
        "Förklara vad ett kvartspris innebär."
      ],
      "sections": [
        {
          "heading": "Priset möter behovet",
          "body": [
            "På dagen före-marknaden lämnar producenter och köpare bud för kommande dygn. När utbud och efterfrågan matchas bildas spotpriser för olika tidsperioder och elområden. Nord Pool är en central marknadsplats i Norden.",
            "Väder påverkar bland annat vindkraft, vattenkraft och uppvärmningsbehov. Efterfrågan, driftstopp och möjligheten att överföra el mellan områden påverkar också marknadsläget. Ett enskilt vädertecken räcker därför inte för att säkert förutsäga priset.",
            "När prognoser ändras används intradaghandel för justeringar närmare leverans. Balansmarknaden hjälper sedan till att hantera avvikelser i realtid. Företagskunden behöver förstå principen, men behöver inte själv handla på dessa marknader."
          ]
        },
        {
          "heading": "En kvart är en prisperiod",
          "body": [
            "På kvartsmarknaden är en prisperiod 15 minuter. Ett normalt dygn med 24 timmar innehåller 96 sådana perioder. Dygn när klockan ställs om har ett annat antal perioder.",
            "Med ett kvartsprisavtal kopplas energikostnaden till förbrukningen under respektive kvart och det pris som gäller då, tillsammans med avtalets övriga prisdelar. Samma antal kWh kan därför ge olika kostnad beroende på när elen används.",
            "Lundverk kan undersöka om exempelvis fordonsladdning går att flytta. En möjlig besparing måste jämföras med verksamhetens behov, styrkostnader och eventuella effekttoppar. Lägre spotpris betyder inte automatiskt lägre total kostnad."
          ]
        },
        {
          "heading": "Platsen spelar roll",
          "body": [
            "Sverige har fyra elområden: SE1, SE2, SE3 och SE4. Lund ligger i SE4. Om överföringskapaciteten mellan områden inte räcker kan priserna skilja sig åt.",
            "Ett lågt pris i ett annat elområde behöver alltså inte vara priset som gäller för Lundverk. Utgå från anläggningens elområde när du jämför marknadsuppgifter och avtal."
          ]
        }
      ],
      "takeaways": [
        "Spotpriset påverkas av flera faktorer, bland annat utbud och efterfrågan.",
        "Ett normalt 24-timmarsdygn har 96 kvartar.",
        "Elområde och förbrukningens tidpunkter kan påverka energikostnaden."
      ],
      "script": "Varför kan el vara billig en stund och dyrare nästa? Priset påverkas av hur mycket el som finns tillgänglig och hur mycket som efterfrågas. Vind, nederbörd, temperatur, driftstopp och överföringskapacitet kan alla påverka läget. Ingen av dessa faktorer berättar ensam vad framtidens pris blir.\n\nPå dagen före-marknaden lämnar producenter och köpare bud för nästa dygn. När buden möts bildas spotpriser för olika elområden och tidsperioder. När prognoser sedan ändras kan handeln justeras närmare leverans. Svenska kraftnät arbetar också med att hantera avvikelser i realtid.\n\nEn prisperiod på kvartsmarknaden är femton minuter. Ett normalt dygn med tjugofyra timmar har därför nittiosex kvartar. Med ett kvartsprisavtal får tidpunkten för användningen betydelse. Två lika stora energimängder kan kosta olika mycket om de används under olika kvartar. Avtalets övriga kostnader tillkommer.\n\nLundverk kan exempelvis undersöka när företagets fordon laddas. Men flyttad laddning behöver passa verksamheten och inte skapa nya kostnader genom hög samtidig effekt.\n\nÄven platsen spelar roll. Sverige är indelat i fyra elområden, från SE1 till SE4. Lund ligger i SE4. När ledningarna mellan områden inte kan överföra all efterfrågad el kan områdespriserna skilja sig åt. Jämför därför alltid priser för rätt elområde. Nästa steg är att förstå hur marknadspriset hänger ihop med avtalet och fakturan.",
      "quiz": [
        {
          "id": "elmarknaden-1",
          "question": "Lundverk ser ett lågt spotpris i SE1. Vad behöver företaget kontrollera först?",
          "options": [
            "Om SE1 alltid har samma pris som SE4.",
            "Om företagets elnätsbolag också producerar vindkraft.",
            "Vilket pris som gäller i företagets eget elområde, SE4."
          ],
          "correctIndex": 2,
          "explanation": "Begränsad överföringskapacitet kan ge olika priser mellan elområden. En anläggning i Lund ligger i SE4, så uppgifter från SE1 räcker inte för jämförelsen."
        },
        {
          "id": "elmarknaden-2",
          "question": "Lundverk kan flytta laddning till en billigare kvart. Vilken bedömning är mest relevant?",
          "options": [
            "Jämföra energipriset och samtidigt beakta verksamhetens behov och möjliga effekttoppar.",
            "Flytta allt eftersom ett lägre spotpris alltid sänker totalfakturan.",
            "Ignorera tidpunkten eftersom varje kWh alltid kostar lika mycket."
          ],
          "correctIndex": 0,
          "explanation": "Med kvartspris kan tidpunkten påverka energikostnaden. Totalnyttan beror också på övriga villkor, möjlig effektavgift och vad som fungerar i verksamheten."
        }
      ],
      "video": {
        "url": "https://d2ol7oe51mr4n9.cloudfront.net/user_3Ie1Iki0WR4cljmRAWwmFoTWjNm/0eb8dc81-a7e2-4c90-843c-1d474e07cdca.mp4",
        "durationLabel": "1:49",
        "poster": "assets/elakademin-cover.png"
      }
    },
    {
      "id": "elavtalet",
      "title": "Från spotpris till faktura",
      "subtitle": "Förstå kostnadens delar och skillnaden mellan avtalsformer.",
      "eyebrow": "Kapitel 3 · Ditt elavtal",
      "learningGoals": [
        "Skilja råvarupris från total elkostnad.",
        "Beskriva skillnaden mellan kvartspris, rörligt månadspris och fastpris.",
        "Förstå varför fast enhetspris inte betyder fast totalfaktura."
      ],
      "sections": [
        {
          "heading": "Flera delar bygger elkostnaden",
          "body": [
            "Spotpriset är en del av bilden. Elhandelsavtalet kan också innehålla påslag, balans- och profilkostnader, månadsavgift, ursprungsgarantier och andra produktkostnader. I ett portföljavtal påverkar även prissäkringarnas resultat prisberäkningen.",
            "Elnätskostnaden är separat från elhandeln och kan innehålla fast avgift, överföringsavgift och effektavgift enligt nätavtalet. Energiskatt, tillämplig moms och andra avgifter behöver också beaktas. Delarna kan visas på en gemensam faktura eller på olika fakturor.",
            "Jämför offerter på samma grund: samma tidsperiod, prisdelar, skatter och momsbehandling. Fråga vilka kostnader som ingår och vilka som tillkommer."
          ]
        },
        {
          "heading": "Tre sätt att bestämma priset",
          "body": [
            "Kvartspris: den faktiska förbrukningen kopplas till priset under respektive kvart. Tidpunkten för användningen påverkar energikostnaden.",
            "Rörligt månadspris: ett månadspris beräknas enligt avtalet. Det bygger på marknadspriser och kan innehålla viktning och andra prisdelar. Din egen flytt av el mellan kvartar slår inte igenom på samma direkta sätt som i ett kvartsprisavtal.",
            "Fastpris: ett avtalat enhetspris gäller under den avtalade perioden och enligt avtalsvillkoren. Det ger inte en fast totalfaktura. Förbrukning, nätkostnader, skatt och andra kostnader kan ändras."
          ]
        },
        {
          "heading": "Ett enkelt exempel utan tillägg",
          "body": [
            "Anta att Lundverk använder 100 000 kWh och att det illustrerade energipriset är 0,95 kr/kWh. Energidelen i exemplet blir 95 000 kr. Om användningen i stället blir 120 000 kWh blir samma beräkning 114 000 kr, trots oförändrat enhetspris.",
            "Detta är enbart en pedagogisk energiberäkning. Profil-, områdes- och balanskostnader, elnät, skatt, moms, påslag och övriga avgifter ingår inte. Exemplet beskriver inget erbjudande och ingen faktisk totalfaktura."
          ]
        }
      ],
      "takeaways": [
        "Spotpriset är inte hela elkostnaden.",
        "Avtalets prisberäkning avgör hur marknadspriset påverkar dig.",
        "Fast pris per kWh ger ingen garanti för samma totalfaktura."
      ],
      "script": "Nu tittar vi på fakturan. Spotpriset är marknadens råvarupris, men företagets elkostnad består av flera delar. Elhandeln kan innehålla påslag, månadsavgift, balans- och profilkostnader och andra avtalade delar. Elnätet har sina egna avgifter. Energiskatt och tillämplig moms behöver också räknas med. När Lundverk jämför offerter behöver företaget därför fråga vad som ingår. Ett lågt pris i rubriken säger inte vad den samlade kostnaden blir. Jämför samma period och samma kostnadsdelar. Hur marknadspriset slår igenom beror på avtalet. Med kvartspris kopplas förbrukningen till priset för respektive kvart. Med rörligt månadspris får kunden ett månadspris som beräknas enligt avtalet, med den viktning och de tillägg som gäller där. En egen flytt mellan kvartar påverkar då inte priset på samma direkta sätt. Ett fastprisavtal ger ett avtalat pris per kilowattimme under en viss period. Men det låser inte hela fakturan. Anta att Lundverk använder 100 000 kilowattimmar till ett illustrerat energipris på 95 öre. Det blir 95 000 kronor. Använder företaget 120 000 kilowattimmar blir det 114 000 kronor, med samma pris per kilowattimme. Det här exemplet visar enbart energiberäkningen. Profil-, områdes- och balanskostnader, elnät, skatt, moms, påslag och andra avgifter är utelämnade. Se därför alltid både enhetspriset och kostnaderna runt omkring. I nästa kapitel undersöker vi hur delar av ett framtida pris kan säkras.",
      "quiz": [
        {
          "id": "elavtalet-1",
          "question": "Lundverk har ett fast pris per kWh men använder mer el än tidigare. Kan totalfakturan öka?",
          "options": [
            "Nej, fastpris betyder alltid ett fast belopp per månad.",
            "Ja, fler kWh ökar energikostnaden och andra kostnadsdelar kan också ändras.",
            "Bara om företaget byter elområde."
          ],
          "correctIndex": 1,
          "explanation": "Ett fast enhetspris låser inte energimängden eller hela fakturan. Förbrukningen och exempelvis nätkostnader kan förändras."
        },
        {
          "id": "elavtalet-2",
          "question": "Två offerter visar olika pris per kWh. Vad ger en rättvisare jämförelse?",
          "options": [
            "Att enbart jämföra det lägsta talet i rubriken.",
            "Att anta att alla avgifter ingår i båda priserna.",
            "Att kontrollera prisberäkning, ingående kostnader, tillägg, period och momsbehandling."
          ],
          "correctIndex": 2,
          "explanation": "Ett pris kan avse olika delar i olika offerter. En jämförelse blir användbar först när samma kostnadsdelar och villkor ställs mot varandra."
        }
      ],
      "video": {
        "url": "https://d2ol7oe51mr4n9.cloudfront.net/user_3Ie1Iki0WR4cljmRAWwmFoTWjNm/25e35771-0c51-4ded-95ed-6cb682c51917.mp4",
        "durationLabel": "1:52",
        "poster": "assets/elakademin-cover.png"
      }
    },
    {
      "id": "prissakring",
      "title": "Så fungerar prissäkring",
      "subtitle": "Ett blandpris, två marknadsutfall och risker som finns kvar.",
      "eyebrow": "Kapitel 4 · Pris och risk",
      "learningGoals": [
        "Förklara hur prissäkring skiljer sig från fysisk elleverans.",
        "Räkna fram ett förenklat blandpris.",
        "Identifiera profil-, volym- och områdesrisk."
      ],
      "sections": [
        {
          "heading": "Leveransen och priset är två saker",
          "body": [
            "Fysisk handel gäller elen som ska levereras och användas. Finansiell prissäkring används för att påverka prisutfallet för en bestämd framtida volym och period. Ett finansiellt kontrakt levererar inte el till anläggningen.",
            "Portföljförvaltning innebär att elinköp och prissäkringar görs enligt en strategi, ofta vid flera tillfällen. Syftet kan vara att begränsa vissa prisrisker och sprida besluten över tid. Det garanterar inte lägst pris eller en bestämd total kostnad."
          ]
        },
        {
          "heading": "Lundverks blandpris – enbart ett räkneexempel",
          "body": [
            "Anta 100 000 kWh, att 80 procent är säkrat till 0,75 kr/kWh och att 20 procent följer ett antaget spotpris. Anta också att säkringen matchar volym och period. Andelarna är valda för undervisningen och beskriver ingen produkts utlovade eller aktuella säkringsgrad.",
            "Vid spotpris 1,00 kr/kWh blir den förenklade råenergin 80 000 × 0,75 + 20 000 × 1,00 = 80 000 kr. Blandpriset är 0,80 kr/kWh.",
            "Vid spotpris 1,50 kr/kWh blir blandpriset 0,90 kr/kWh och råenergin 90 000 kr. Vid spotpris 0,50 kr/kWh blir blandpriset 0,70 kr/kWh och råenergin 70 000 kr. När spotpriset faller under säkringspriset blir blandpriset här högre än ett helt osäkrat råenergipris.",
            "Formeln är 0,80 × 0,75 + 0,20 × spotpriset. Profil-, områdes- och balanskostnader, elnät, skatt, moms, påslag och övriga avgifter är helt utelämnade. Resultaten är inga fakturaprognoser eller produktlöften."
          ]
        },
        {
          "heading": "Vad kan fortfarande variera?",
          "body": [
            "Öppen prisrisk: den osäkrade delen påverkas av marknaden. Profilrisk: elen används vid andra tidpunkter än vad säkringen eller prognosen motsvarar. Volymrisk: den faktiska energimängden blir större eller mindre än väntat.",
            "Områdesrisk uppstår när priset i anläggningens elområde skiljer sig från prisreferensen i säkringen. Ett nordiskt systempris är ett referenspris utan samma hänsyn till nätets flaskhalsar som områdespriserna. Därför behöver man veta hur områdesskillnaden hanteras.",
            "Balans- och andra avtalskostnader kan också påverka resultatet. Fråga vad som säkras, hur avvikelser hanteras och vilka delar som fortfarande är rörliga."
          ]
        }
      ],
      "takeaways": [
        "En finansiell prissäkring påverkar prisutfallet; den levererar inte fysisk el.",
        "En säkrad del kan dämpa en prisuppgång och begränsa nyttan av ett prisfall.",
        "Säkringsgrad är ingen garanti för fast totalpris eller lägsta kostnad."
      ],
      "script": "Prissäkring handlar om framtidens pris. Den fysiska elen behöver fortfarande levereras till Lundverk. En finansiell säkring påverkar prisutfallet för en bestämd volym och period, men skickar ingen el genom ledningarna. I en portfölj kan delar av framtida behov säkras vid olika tillfällen enligt en strategi. Då samlas inte alla prisbeslut till en enda dag. Det ger ingen garanti om lägst pris.\n\nVi räknar på ett förenklat exempel. Lundverk använder 100 000 kilowattimmar. Vi antar att 80 procent, alltså åtta av tio delar, säkras till 75 öre per kilowattimme. Det motsvarar noll komma sju fem kronor per kilowattimme. De återstående 20 procenten följer spotpriset. Vi antar också att volym och period matchar säkringen. Dessa andelar är undervisningsexempel, inga produktvillkor. Om spotpriset är en krona blir den säkrade delen 60 000 kronor och den öppna delen 20 000 kronor.\n\nTillsammans blir det 80 000 kronor, eller 80 öre per kilowattimme. Om spotpriset i stället är 1 krona och 50 öre blir blandpriset 90 öre. Om spotpriset är 50 öre blir blandpriset 70 öre. Säkringen dämpar alltså uppgången i exemplet, men ger mindre nytta av prisfallet. Vi har utelämnat profil-, områdes- och balanskostnader, elnät, skatt, moms, påslag och övriga avgifter.\n\nDetta är råenergi, ingen fakturaprognos. Även en prissäkrad portfölj kan påverkas av när elen används, hur stor förbrukningen blir och skillnader mellan elområdets pris och säkringens referenspris. Fråga därför både hur mycket som säkras och hur kvarvarande risker hanteras. En hög säkringsgrad betyder inte automatiskt ett fast totalpris.",
      "quiz": [
        {
          "id": "prissakring-1",
          "question": "I vårt exempel är 80 % säkrat till 0,75 kr/kWh och 20 % öppet. Spotpriset är 1,00 kr/kWh. Vad blir blandpriset före alla utelämnade kostnader?",
          "options": [
            "0,80 kr/kWh.",
            "0,75 kr/kWh.",
            "1,00 kr/kWh."
          ],
          "correctIndex": 0,
          "explanation": "0,80 × 0,75 + 0,20 × 1,00 = 0,80 kr/kWh. Det är ett förenklat råenergipris; profil, område, balans, elnät, skatt, moms och avgifter ingår inte."
        },
        {
          "id": "prissakring-2",
          "question": "Lundverk har prognostiserat 100 MWh men använder 120 MWh. Vilken risk illustrerar skillnaden främst?",
          "options": [
            "Områdesrisk, eftersom alla prisområden har ändrats.",
            "Profilrisk, eftersom en större årsmängd alltid betyder nattförbrukning.",
            "Volymrisk, eftersom faktisk förbrukning avviker från prognosen."
          ],
          "correctIndex": 2,
          "explanation": "Volymrisk gäller avvikelsen i energimängd. Profilrisk gäller när energin används och områdesrisk gäller skillnader mellan prisreferenser och elområden."
        }
      ],
      "video": {
        "url": "https://d2ol7oe51mr4n9.cloudfront.net/user_3Ie1Iki0WR4cljmRAWwmFoTWjNm/34de3997-51c9-4dae-9f21-4350aea330d0.mp4",
        "durationLabel": "2:06",
        "poster": "assets/elakademin-cover.png"
      }
    },
    {
      "id": "portfoljer",
      "title": "Kraftringens tre portföljupplägg",
      "subtitle": "Kundanpassad eller gemensam portfölj – och olika sätt att förvalta.",
      "eyebrow": "Kapitel 5 · Produkterna",
      "learningGoals": [
        "Skilja en individuell portfölj från en gemensam pool.",
        "Beskriva skillnaden i förvaltningsinriktning mellan Trygg och Offensiv.",
        "Veta vilka produktspecifika uppgifter som behöver framgå av aktuellt avtal."
      ],
      "sections": [
        {
          "heading": "Individuell Portfölj",
          "body": [
            "Individuell Portfölj är en kundspecifik portfölj. Strategin kan anpassas utifrån verksamhetens förbrukning, elområde och behov av att hantera prisrisk. Inköp, prognoser och uppföljning utgår från kundens förutsättningar.",
            "Hur anpassningen går till, vem som fattar beslut och vilket mandat förvaltningen har behöver vara tydligt i erbjudandet och avtalet. En individuell portfölj innebär ingen garanti för ett fast totalpris eller det lägsta priset."
          ]
        },
        {
          "heading": "Poolportfölj Trygg",
          "body": [
            "I en pool samlas flera kunders behov i en gemensam portfölj. Inköp och säkringar görs för poolens samlade volym. Det skiljer sig från en egen kundspecifik portfölj.",
            "Trygg bygger på löpande prissäkring och inköp som sprids över tid enligt en strukturerad indexmodell. Inriktningen är stabilitet och förutsägbarhet. Produktnamnet innebär ingen garanti för ett visst pris eller utfall."
          ]
        },
        {
          "heading": "Poolportfölj Offensiv",
          "body": [
            "Offensiv bygger på samma gemensamma pool- och indexgrund som Trygg och kompletterar den med aktiv förvaltning av delar av inköpen utifrån strategi och marknadsläge. Det gör förvaltningens mandat och uppföljning särskilt viktiga att förstå.",
            "Mer aktiv förvaltning garanterar inte bättre resultat. Vilka risker kunden bär beror på strategi, säkringar, prognoser och avtalsvillkor. Produkterna kan därför inte rangordnas säkert med en enda generell riskskala."
          ]
        },
        {
          "heading": "Kontrollera vad som gäller för dig",
          "body": [
            "Be om aktuella uppgifter om säkringsgrad, öppen andel, prisberäkning, hur poolens kostnader och säkringsresultat fördelas, avtalstid, avgifter och hantering av profil-, volym- och områdesavvikelser.",
            "Fråga också hur ofta uppföljning sker och vilka beslut du själv kan påverka. Utbildningens 80/20-exempel anger inte produkternas faktiska fördelning. Lundverks 100 MWh är ett pedagogiskt antagande och avgör inte automatiskt vilket avtal som erbjuds eller passar."
          ]
        }
      ],
      "takeaways": [
        "Individuell Portfölj utgår från en kund; en pool samlar flera kunder.",
        "Trygg fokuserar på löpande prissäkring; Offensiv har samma grund med aktiv förvaltning av delar av inköpen.",
        "Aktuellt avtal anger fördelning, mandat, kostnader och kvarvarande risker."
      ],
      "script": "Kraftringen har tre portföljupplägg som vi går igenom här. Vi börjar med den viktigaste skillnaden: en egen portfölj eller en gemensam pool.\n\nIndividuell Portfölj utgår från en kunds förbrukning, elområde och behov. Strategin kan anpassas efter verksamhetens förutsättningar. Kunden behöver förstå hur besluten tas, vilket mandat förvaltningen har och hur uppföljningen fungerar.\n\nI en pool samlas flera kunders behov. Inköp och prissäkringar görs för den gemensamma volymen. Poolportfölj Trygg beskrivs som ett mer systematiskt upplägg med löpande säkring och inköp som sprids över tid enligt en strukturerad modell. Namnet Trygg innebär ingen garanti om ett visst pris.\n\nPoolportfölj Offensiv bygger också på en gemensam pool. Här finns större utrymme för aktiva beslut utifrån strategi och marknadsläge. Aktiv förvaltning garanterar inte bättre resultat. Det är därför viktigt att fråga vilka beslut som kan tas och vilka risker de innebär.\n\nLundverk ska inte välja enbart utifrån produktnamnet eller sina hundra megawattimmar. Företaget behöver be om aktuella villkor för säkringsgrad, öppen andel, prisberäkning, avgifter och avtalstid. I en pool behöver kunden även förstå hur kostnader och säkringsresultat fördelas.\n\nVårt tidigare åttio tjugo-exempel var en räkneövning. Den verkliga fördelningen framgår av det aktuella avtalet. Alla tre upplägg behöver bedömas utifrån samma frågor: vad hanteras, vad kan fortfarande variera och hur följer vi upp resultatet?",
      "quiz": [
        {
          "id": "portfoljer-1",
          "question": "Vad är den centrala skillnaden mellan Individuell Portfölj och en poolportfölj?",
          "options": [
            "Individuell Portfölj levererar annan fysisk el genom nya ledningar.",
            "Individuell Portfölj är kundspecifik, medan en pool samlar flera kunders behov.",
            "En pool innebär alltid ett fast totalpris."
          ],
          "correctIndex": 1,
          "explanation": "Skillnaden gäller hur portföljen organiseras och förvaltas. Det är inte ett byte av fysisk elnätslösning och ger ingen garanti för fast totalpris."
        },
        {
          "id": "portfoljer-2",
          "question": "Vilken beskrivning av Trygg och Offensiv stämmer?",
          "options": [
            "Trygg har löpande prissäkring; Offensiv har samma grund med aktiv förvaltning av delar av inköpen.",
            "Offensiv garanterar lägre kostnad än Trygg.",
            "Trygg saknar profil-, volym- och områdesrisk."
          ],
          "correctIndex": 0,
          "explanation": "Produkterna har en gemensam grund men olika förvaltningsinriktning. Resultat och risk beror på det faktiska mandatet, säkringarna och avtalet; inga prisgarantier följer av namnen."
        }
      ],
      "video": {
        "url": "https://d2ol7oe51mr4n9.cloudfront.net/user_3Ie1Iki0WR4cljmRAWwmFoTWjNm/ecd10022-ebe4-4a55-8a9a-68a457ca3bf1.mp4",
        "durationLabel": "1:56",
        "poster": "assets/elakademin-cover.png"
      }
    },
    {
      "id": "ditt-val",
      "title": "Gör ett genomtänkt avtalsval",
      "subtitle": "Samla rätt uppgifter, ställ rätt frågor och följ upp ditt val.",
      "eyebrow": "Kapitel 6 · Nästa steg",
      "learningGoals": [
        "Samla ett användbart underlag om verksamhetens elbehov.",
        "Formulera frågor om budget, flexibilitet och risk.",
        "Jämföra alternativ utifrån villkor och olika möjliga utfall."
      ],
      "sections": [
        {
          "heading": "Börja med verksamheten",
          "body": [
            "Samla historisk förbrukning, gärna med tidsupplösning som visar när elen används. Lista anläggningar och elområden. Beskriv planerade förändringar, exempelvis nya maskiner, laddning, öppettider eller egen produktion.",
            "Lundverk använder 100 MWh i vårt grundexempel, men ett nytt produktionsskift kan ändra både mängden och tidpunkterna. Ett avtalsval behöver därför bygga på mer än föregående års totalsiffra."
          ]
        },
        {
          "heading": "Vad behöver budgeten tåla?",
          "body": [
            "Bedöm hur stora kostnadsvariationer verksamheten klarar och under vilken period. Fråga om ni prioriterar ett känt enhetspris, möjlighet att följa marknadspriset eller ett strukturerat upplägg med prissäkring.",
            "Undersök vilken användning som faktiskt kan flyttas utan att störa verksamheten. Bestäm hur mycket tid ni vill lägga på uppföljning och vem som ansvarar för beslut. Ett bra upplägg behöver fungera både ekonomiskt och praktiskt."
          ]
        },
        {
          "heading": "Ta med dessa frågor till genomgången",
          "body": [
            "Hur räknas vårt pris fram, vilka kostnader ingår och vilka tillkommer? Vilken volym och period säkras, och hur stor del är öppen? Hur hanteras profil, områdesskillnader och förändrad förbrukning?",
            "Hur fördelas gemensamma kostnader i en pool? Vad får förvaltaren besluta? Vilken avtalstid, uppsägning och ändringsmöjlighet gäller? Vilka rapporter får vi och när följer vi upp?",
            "Be om beräkningar för både högre och lägre marknadspris samt ändrad förbrukning. Använd samma kostnadsdelar i alternativen. Scenarier hjälper er förstå konsekvenser; de förutsäger inte vilket utfall som kommer att inträffa."
          ]
        },
        {
          "heading": "Lundverks nästa steg",
          "body": [
            "Lundverk samlar förbrukningsdata, beskriver sin planerade expansion och sätter en tydlig ram för budgetvariation. Därefter jämför företaget aktuella erbjudanden tillsammans med sin kontaktperson.",
            "När ett upplägg är valt dokumenteras ansvar, villkor och uppföljning. Nya maskiner eller ändrade arbetstider tas upp tidigt, så att prognoser och eventuell förvaltning kan ses över enligt avtalet."
          ]
        }
      ],
      "takeaways": [
        "Årsvolym, tidpunkter, elområde och planerade förändringar behövs i underlaget.",
        "Jämför villkor och scenarier utifrån vad verksamhetens budget klarar.",
        "Dokumentera ansvar och följ upp förändringar i förbrukningen."
      ],
      "script": "Nu har vi byggstenarna för ett genomtänkt avtalsval. Börja med verksamheten. Hur mycket el används, när används den och i vilket elområde ligger anläggningen? Samla förbrukningsdata och beskriv planerade förändringar.\n\nLundverk använder hundra megawattimmar i vårt exempel. Men ett nytt produktionsskift kan öka mängden och flytta användningen till andra tider. Den gamla årssiffran räcker därför inte som beslutsunderlag.\n\nNästa fråga gäller budgeten. Hur stor kostnadsvariation klarar företaget? Vill ni ha ett känt pris per kilowattimme, följa marknaden eller använda ett strukturerat upplägg där delar prissäkras? Undersök också vilken förbrukning som faktiskt kan flyttas och vem som ansvarar för uppföljningen.\n\nTa sedan med konkreta frågor till genomgången. Hur räknas priset fram? Vilka kostnader ingår? Vad säkras och vad är öppet? Hur hanteras förändrad förbrukning, områdesskillnader och tidpunkterna när elen används? För en pool, fråga hur gemensamma kostnader fördelas.\n\nBe om scenarier med både högre och lägre marknadspris och med ändrad förbrukning. Jämför samma kostnadsdelar och kontrollera avtalstid, uppsägning och förvaltarens mandat. Scenarier visar konsekvenser, inte framtiden.\n\nTill sist bestämmer ni hur valet ska följas upp. Ta upp nya maskiner, ändrade öppettider och andra större förändringar tidigt. Målet är att förstå vad ni köper, vilken osäkerhet som finns kvar och vem som hjälper er när förutsättningarna ändras.",
      "quiz": [
        {
          "id": "ditt-val-1",
          "question": "Lundverk planerar ett extra produktionsskift. Vilket underlag bör företaget uppdatera?",
          "options": [
            "Bara företagets logotyp på avtalet.",
            "Bara föregående års årsförbrukning, utan nya antaganden.",
            "Prognosen för både energimängd och när elen kommer att användas."
          ],
          "correctIndex": 2,
          "explanation": "Ett nytt skift kan påverka både volym och förbrukningsprofil. Det behöver beskrivas i prognosen och tas upp vid avtalsgenomgången."
        },
        {
          "id": "ditt-val-2",
          "question": "Vad är det viktigaste syftet med att jämföra högre och lägre prisscenarier?",
          "options": [
            "Att säkert förutsäga vilket spotpris som kommer att gälla.",
            "Att förstå hur avtalen kan påverka budgeten under olika förutsättningar.",
            "Att bevisa att ett visst produktnamn alltid är billigast."
          ],
          "correctIndex": 1,
          "explanation": "Scenarier hjälper företaget förstå möjliga konsekvenser och sin budgettolerans. De är inga prognosgarantier eller bevis för vilket avtal som blir billigast."
        }
      ],
      "video": {
        "url": "https://d2ol7oe51mr4n9.cloudfront.net/user_3Ie1Iki0WR4cljmRAWwmFoTWjNm/2f2c3969-800e-4164-a3b8-b9bf5c55be34.mp4",
        "durationLabel": "1:52",
        "poster": "assets/elakademin-cover.png"
      }
    }
  ],
  "sources": [
    {
      "title": "Poolportfölj för företag",
      "url": "https://www.kraftringen.se/foretag/el/vara-elavtal/poolportfolj/"
    },
    {
      "title": "Portföljavtal",
      "url": "https://www.kraftringen.se/foretag/el/vara-elavtal/portfoljforvaltning/"
    },
    {
      "title": "Avtalsvillkor för elhandel – företag",
      "url": "https://www.kraftringen.se/foretag/el/vara-elavtal/avtalsvillkor/"
    },
    {
      "title": "Kraftringens avtalsvillkor för portföljförvaltning, reviderade 2026-05-01",
      "url": "https://www.kraftringen.se/globalassets/kraftringen/media/dokument-ny-sajt/avtalsvillkor/elhandel/naringsidkare/avtalsvillkor-kraftringen-portfoljforvaltning-2026-05-01.pdf"
    },
    {
      "title": "Ei kallar nu rörligt elavtal för avtal med månadspris",
      "url": "https://ei.se/konsument/aktuellt-for-energikunder/aktuellt-pa-energimarknaderna/2026-03-27-ei-kallar-nu-rorligt-elavtal-for-avtal-med-manadspris"
    },
    {
      "title": "Elbörserna går över till att handla el per kvart",
      "url": "https://ei.se/om-oss/nyheter/2025/2025-09-29-elborserna-gar-over-till-att-handla-el-per-kvart"
    },
    {
      "title": "Elområden",
      "url": "https://www.svk.se/om-kraftsystemet/om-elmarknaden/elomraden/"
    },
    {
      "title": "Så påverkar olika kraftslag elsystemet",
      "url": "https://www.svk.se/om-kraftsystemet/sa-paverkar-olika-kraftslag-systemet/"
    },
    {
      "title": "Energilagring med batterier och vätgas",
      "url": "https://www.svk.se/om-kraftsystemet/energilagring-med-batterier-och-vatgas/"
    }
  ]
};
