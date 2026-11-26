(() => {
  'use strict';
  const P=window.Portal,A=P?.prototypeUsers;
  if(!P||!A||P.demoMode)return;
  const allowed=()=>A.admin()&&P.role==='internal';
  P.register('commission-models',{
    render:()=>allowed()?`<div class="ow-page"><div class="page-head"><div><span class="eyebrow">KRAFTRINGEN / ADMINISTRATION</span><h1>Provisionsmodeller</h1><p>Planera ersättningar och följ historiken direkt i Partnerlabbet.</p></div></div><iframe title="Provisionsstudio – Kraftringens administration" src="admin-studio/index.html" style="display:block;width:100%;height:1250px;border:0;background:#f5f7f8" allow="clipboard-write"></iframe><details class="card"><summary>Om denna demofunktion och åtkomst</summary><p>Studion använder Partnerlabbets befintliga privata inloggning. Endast Kraftringens administratörsroll i intern demovy kan öppna denna arbetsyta. Demoroller är inte verklig serverbehörighet; hela portalen är fortsatt privat och endast tillgänglig för ägaren.</p><p>Alla avtal och partners i studion är fiktiva. Förslagen sparas separat i denna webbläsare och ändrar inga befintliga beräkningar. Eventuella tidigare förslag i den fristående studion finns kvar där och har inte automatiskt flyttats hit.</p></details></div>`:'<section class="card"><h1>Åtkomst saknas</h1><p>Provisionsmodeller är tillgängliga för Kraftringens administratörer i intern vy.</p></section>',
    bind:()=>{if(allowed()){const heading=document.querySelector('#current-page');if(heading)heading.textContent='Provisionsmodeller';}}
  });
})();
