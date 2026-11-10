(() => {
'use strict';
const P=window.Portal;if(!P)return;
const text=(x,y,s,size=16)=>`<text x="${x}" y="${y}" font-size="${size}" fill="currentColor" text-anchor="middle">${P.e(s)}</text>`;
const line=(x1,y1,x2,y2)=>`<path class="lf-wire" d="M${x1} ${y1} L${x2} ${y2}"/>`;
const box=(x,y,w,h)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="12" class="lf-surface"/>`;
const home=(x,y)=>`<g transform="translate(${x} ${y})" class="lf-object"><path d="M-30 0 L0-25 30 0 V40 H-30 Z"/><path d="M-7 40 V17 H7 V40 M-19 8 H-10 V17 H-19Z"/></g>`;
const tower=(x,y)=>`<g transform="translate(${x} ${y})" class="lf-object"><path d="M-22 60 L0-20 22 60 M-15 35 H15 M-11 10 H11 M-30 0 H30 M-23-12 H23 M-18 60 L14 10 M18 60 L-14 10"/></g>`;
const person=(x,y)=>`<g transform="translate(${x} ${y})" class="lf-object"><circle cy="-18" r="17"/><path d="M-30 42 V20 Q0-10 30 20 V42Z"/></g>`;
const heading={grid:'Samma nät – olika uppgifter',balance:'Planerat inköp och faktiskt uttag',market:'Fyra elområden – begränsad överföring',price:'Så byggs elhandelskostnaden upp',hedge:'Säkrad mängd och faktisk förbrukning',individual:'En egen profil för kundens behov',pool:'Flera kundprofiler blir en gemensam profil',direct:'Ett beslut – olika periodvärden',stable:'Samma totalvärde – jämnare fördelning',advice:'Lyssna, undersök och förklara'};
P.learningIllustration=(id,index)=>{
let art='',caption='Schematisk illustration. Inte en prognos eller ett produktlöfte.';
if(id==='grid'){
art=line(90,115,590,115)+tower(115,90)+tower(285,100)+home(475,110)+home(590,110)+text(115,205,'Stamnät')+text(285,205,'Regionnät')+text(470,205,'Lokalnät')+text(590,205,'Kund')+`<path class="lf-flow" d="M100 115H590"/><path class="lf-flow" d="M490 90V50H320V110"/>`+box(470,25,80,35)+text(510,49,'Solceller',12)+text(320,255,index===3?'kW = effekt · kWh = energi':'Produktion kan anslutas på flera nätnivåer',18);
caption='Schematiskt, ingen nätkarta. Elflöden kan gå i båda riktningar. Elhandelsavtalet ändrar inte kundens fysiska anslutning.';
}else if(id==='balance'){
art=box(50,65,230,120)+box(360,65,230,120)+text(165,105,'PLAN',14)+text(165,153,'80 MWh',32)+text(475,105,'UTFALL',14)+text(475,153,'95 MWh',32)+line(280,125,360,125)+text(320,225,'15 MWh underskott i exemplet',24)+text(320,265,index===1?'BRP: ekonomisk balans · BSP: balanstjänster':'Svenska kraftnät: systembalans i realtid',15);
caption='Fiktiva mängder. Obalanskostnaden kräver ett avräkningspris; figuren anger ingen kostnad.';
}else if(id==='market'){
art=[40,40,65,90].map((v,i)=>box(28+i*157,80,140,125)+text(98+i*157,115,'SE'+(i+1),24)+text(98+i*157,160,v+' öre',24)).join('')+line(60,235,580,235)+text(320,270,'Begränsad överföring kan ge olika priser',18);
caption='Fiktiva områdespriser, schematisk ordning och ingen geografisk karta. Vid tillräcklig överföring kan områdespriser sammanfalla.';
}else if(id==='price'){
art=box(45,40,550,235)+['100 kWh × 0,50 kr = 50 kr','300 kWh × 1,50 kr = 450 kr','Spotkostnad = 500 kr','500 kr / 400 kWh = 125 öre/kWh'].map((s,i)=>text(320,85+i*48,s,i===3?23:22)).join('');
caption='Fiktivt exempel: förbrukningsvägt spotpris. Påslag, avgifter, elnät och skatter tillkommer enligt respektive avtal och tillämpliga regler.';
}else if(id==='hedge'){
art=box(60,65,333,60)+box(60,155,520,60)+text(225,104,'80 MWh säkrat',24)+text(320,194,'125 MWh faktiskt uttag',24)+text(320,270,'80 / 125 = 64 %',30);
caption='Fiktiv volymillustration. En planerad säkringsandel är inte en garanterad faktisk säkringsgrad.';
}else if(id==='individual'||id==='pool'){
if(id==='individual')art=`<path class="lf-profile" d="M45 115 Q90 20 140 100T250 145T360 195T480 120T600 85"/>`+Array.from({length:18},(_,i)=>{const heights=[110,155,130,80,70,90,110,100,65,45,40,50,75,95,120,140,130,150];return `<rect class="lf-volume" x="${45+i*31}" y="${245-heights[i]}" width="20" height="${heights[i]}" style="--delay:${i*.08}s"/>`;}).join('')+text(320,280,'Kundens prognos styr säkringsprofilen',18);
else art=[60,130,200].map((y,i)=>`<path class="lf-profile" d="M30 ${y} Q60 ${y-45} 95 ${y} T165 ${y}"/>`+line(175,y,325,140)+text(95,y+34,'Kund '+String.fromCharCode(65+i),13)).join('')+`<path class="lf-profile" d="M330 140 Q380 45 430 120 T600 140"/>`+text(470,225,'Gemensam profil',22)+text(470,265,'Olika kunder kan avvika',15);
caption=id==='individual'?'Schematisk profil, inga mätvärden. Löpande säkringar kan anpassas till kundens prognostiserade förbrukning.':'Schematisk sammanvägning, inga mätvärden. En gemensam schablon matchar inte varje kund lika väl.';
}else if(id==='direct'||id==='stable'){
const vals=id==='direct'?[6000,3000,3000]:[4000,4000,4000];
art=box(20,30,145,60)+text(92,65,'Ett beslut',18)+[260,400,540].map(x=>line(165,60,x,100)).join('')+vals.map((v,i)=>`<rect class="lf-volume" x="${210+i*140}" y="${245-v/45}" width="100" height="${v/45}" style="--delay:${i*.2}s"/>`+text(260+i*140,233-v/45,v.toLocaleString('sv-SE')+' kr',18)+text(260+i*140,273,['Jan','Feb','Mar'][i],18)).join('');
caption='Illustrativ kronfördelning: totalt 12 000 kr i både Direkt och Stabil. Detta beskriver fördelningsprincipen, inte fastställd prisformel eller kundens totalfaktura.';
}else{
art=person(105,140)+person(535,140)+box(185,45,270,85)+text(320,80,'Vad vill kunden uppnå?',18)+text(320,110,'Kostnad · risk · flexibilitet',14)+box(185,170,270,90)+text(320,205,'Kontrollera underlaget',18)+text(320,237,'Förklara före rekommendation',14);
}
return `<figure class="lf-cinema" data-scene="${index}"><svg viewBox="0 0 640 300" role="img" aria-label="${P.e(heading[id])}"><title>${P.e(heading[id])}</title>${art}</svg><figcaption>${P.e(caption)}</figcaption></figure>`;
};
})();
