(() => {
  'use strict';
  const P = window.Portal, A = P.prototypeUsers;
  if (!A) return;
  let previewPartner;
  const active = () => P.role === 'partner' && (['manager','seller'].includes(A.current()?.role) || A.internal() && previewPartner===P.partner);
  const main = [
    ['overview','Översikt','home'],
    ['partner-hub-services','Tjänster','layers'],
    ['partner-hub-results','Resultat & ersättning','chart'],
    ['partner-hub-learning','Kunskap & support','book'],
    ['partner-hub-agreement','Vårt samarbete','briefcase']
  ];
  const sales = () => P.productCatalog.allowedCategories(P.partner);
  const estate = () => A.allowed('estate-home');
  const property = () => P.getPartner().type === 'property';
  const label = {consumer:'Privatkundsförsäljning',business:'Företagsförsäljning'};
  const jump = (id,title,description='') => '<button class="hub-link" data-go="'+id+'"><strong>'+P.e(title)+'</strong>'+(description?'<small>'+P.e(description)+'</small>':'')+'<span aria-hidden="true">→</span></button>';
  const panel = (title,content) => '<section class="card hub-panel"><h2>'+P.e(title)+'</h2>'+content+'</section>';
  const page = (title,content) => '<div class="commercial-page hub-page"><header><span class="eyebrow">'+P.e(P.getPartner().name)+'</span><h1>'+P.e(title)+'</h1></header>'+content+'</div>';
  function services() {
    const links = sales().map(cat=>jump('partner-hub-'+cat,label[cat],cat==='consumer'?'Kunder, produkter och ordrar':'Kunder, portföljprodukter och offerter'));
    if (estate()) links.push(jump('estate-home','Fastigheter','Bestånd, inflyttningar och ärenden'));
    else if(property()) links.push(jump('property-intake','Inflyttningsservice'),jump('property-registrations','Serviceärenden'));
    if(P.getPartner().type==='employee')links.push(jump('employee-overview','Personalerbjudanden'));
    return links.join('') || '<p>Inga tjänster har aktiverats.</p>';
  }
  function salesPage(category) {
    if(!sales().includes(category))return page('Tjänster',services());
    const products=P.productCatalog.availableProducts(category,P.partner);
    const links=jump('order-customers','Kunder')+jump('order-list','Ordrar & resultat')+jump('products','Produkter och prislistor');
    const crm=P.getPartner().crmMode==='portal' && A.allowed('crm')?jump('crm','Kunddialoger och affärsmöjligheter'):'';
    return page(label[category],'<button class="btn btn-primary" data-hub-order="'+category+'">'+(category==='consumer'?'Skapa order':'Skapa offert')+'</button>'+panel('Kundarbete',links+crm)+panel('Tilldelade produkter','<ul>'+products.map(v=>'<li>'+P.e(v)+'</li>').join('')+'</ul>'));
  }
  function home() {
    if(property() && estate())return P.estatePortfolio.overview();
    const actions=sales().map(cat=>'<button class="btn btn-primary" data-hub-order="'+cat+'">'+(cat==='consumer'?'＋ Ny order':'Skapa offert')+'</button>').join('');
    const orders=sales().length?P.orderWorkspace.orders():[];
    let attention='';
    if(sales().length)attention+=jump('order-list','Ordrar & resultat',orders.filter(o=>['sent','needs_completion'].includes(o.status)).length+' ordrar väntar på svar eller komplettering');
    if(estate())attention+=jump('estate-cases','Fastighetsärenden',P.estatePortfolio.attention()+' ärenden att följa upp');
    return page('Översikt','<div class="hub-actions">'+actions+(estate()?P.estatePortfolio.shortcuts():'')+'</div>'+(attention?panel('Att följa upp',attention):'')+panel('Mina tjänster',services()));
  }
  function agreement() {
    const m=P.state.internalSales?.partners?.[P.partner] || {};
    return page('Vårt samarbete',panel('Partneruppgifter','<p>'+P.e(P.getPartner().name)+'</p><p>'+P.e(m.description || 'Beskrivning saknas.')+'</p><p>Ansvarig hos Kraftringen: '+P.e(m.owner || 'Ej angiven')+'</p>')+
      (property()?jump('property-partnership','Fastighetssamarbetet'):'')+(A.current().role==='manager'?panel('Partnerns användare','<ul>'+A.staff(P.partner).map(u=>'<li>'+P.e(u.name)+' · '+P.e(A.roles[u.role])+'</li>').join('')+'</ul>'):''));
  }
  const routes = {
    home, services:()=>page('Tjänster',services()),consumer:()=>salesPage('consumer'),business:()=>salesPage('business'),
    results:()=>page('Resultat & ersättning',(sales().length?jump('order-list','Ordrar & resultat'):'')+(sales().length && A.allowed('order-commission')?jump('order-commission','Provision och fakturaunderlag'):'')+(property()?jump('property-results','Kunder & kickback'):'')+(!sales().length&&!property()?'<p>Resultatunderlag saknas.</p>':'')),
    learning:()=>page('Kunskap & support',(sales().length?jump('academy','Utbildning')+jump('academy-library','Materialbibliotek'):'')+jump('product-facts','Avtalsfakta')+jump('support','Hjälp & support')),
    agreement
  };
  for(const [key,render] of Object.entries(routes))P.register('partner-hub-'+key,{render:()=>active()?render():'',bind:()=>{
    if(key==='home' && property() && estate())P.estatePortfolio.bind();
    document.querySelectorAll('[data-hub-order]').forEach(b=>b.onclick=()=>{
      const category=b.dataset.hubOrder,product=P.productCatalog.availableProducts(category,P.partner)[0];
      if(!product)return P.toast('Inga produkter är tilldelade.');
      P.orderWorkspace.startProductOrder({category,product,priceListId:P.productCatalog.selected(P.partner)});
    });
  }});
  function group(id) {
    if(main.some(([key])=>key===id))return id;
    if(['order-list','order-commission','property-results'].includes(id))return 'partner-hub-results';
    if(['academy','academy-library','product-facts','support'].includes(id))return 'partner-hub-learning';
    if(id==='property-partnership')return 'partner-hub-agreement';
    return 'partner-hub-services';
  }
  let section='partner-hub-services';
  function destination(id){
    if(!active())return id;
    if(id==='partner-hub-home')return 'overview';
    if(['partner-hub-services','partner-hub-consumer','partner-hub-business'].includes(id)){
      section='partner-hub-services';
      return property()?(estate()?'estate-home':'property-intake'):sales().length?'order-list':P.getPartner().type==='employee'?'employee-overview':'support';
    }
    if(id==='partner-hub-results'){
      section=id;return property()?'property-results':sales().length?(A.allowed('order-commission')?'order-commission':'order-list'):'employee-overview';
    }
    if(id==='partner-hub-learning'){section=id;return sales().length?'academy':'product-facts';}
    if(['order-customers','products','crm','estate-home','estate-cases','property-intake','property-registrations'].includes(id))section='partner-hub-services';
    return id;
  }
  const go=P.go;
  P.go=P.navigate=(id,options)=>go(destination(id),options);
  function directLinks(current){
    let links=[];
    if(current==='partner-hub-services'){
      if(property())links.push([estate()?'estate-home':'property-intake','Fastigheter & inflyttningar'],[estate()?'estate-cases':'property-registrations','Inflyttningsärenden']);
      if(sales().length){links.push(['order-list','Ordrar & resultat'],['order-customers','Kunder'],['products','Produkter & prislistor']);if(P.getPartner().crmMode==='portal'&&A.allowed('crm'))links.push(['crm','Kunddialoger']);}
      if(P.getPartner().type==='employee')links.push(['employee-overview','Personalerbjudanden']);
    }else if(current==='partner-hub-results'){
      if(property())links.push(['property-results','Kunder & kickback']);
      if(sales().length){if(A.allowed('order-commission'))links.push(['order-commission','Provision & fakturaunderlag']);links.push(['order-list','Ordrar & resultat']);}
    }else if(current==='partner-hub-learning'){
      if(sales().length)links.push(['academy','Utbildning'],['academy-library','Materialbibliotek']);
      links.push(['product-facts','Avtalsfakta'],['support','Hjälp & support']);
    }
    return links.length>1?'<nav class="hub-tabs" aria-label="Genvägar på arbetsytan">'+links.filter(([id])=>A.allowed(id)).map(([id,title])=>'<button type="button" data-go="'+id+'" aria-current="'+(P.page===id?'page':'false')+'">'+P.e(title)+'</button>').join('')+'</nav>':'';
  }
  const previous=P.render;
  P.render=()=>{
    P.page=destination(P.page);
    previous();
    if(P.role==='internal')previewPartner=undefined;
    if(!active())return;
    const current=P.page==='order-list'?section==='partner-hub-results'?section:'partner-hub-services':group(P.page);
    document.querySelector('#nav').innerHTML=main.map(([id,title,icon])=>'<button class="nav-button '+(id===current?'active':'')+'" data-go="'+id+'" aria-current="'+(id===current?'page':'false')+'">'+P.icon(icon)+'<span>'+title+'</span></button>').join('');
    document.querySelector('#view .ow-tabs')?.remove();
    document.querySelector('#view')?.insertAdjacentHTML('afterbegin',directLinks(current));
    const sectionTitle=main.find(([id])=>id===current)[1], heading=document.querySelector('#view h1')?.textContent || sectionTitle;
    document.querySelector('#current-page').textContent=heading===sectionTitle?sectionTitle:sectionTitle+' / '+heading;
  };
  P.partnerHub={active,openPreview(id){previewPartner=id;P.previewPartner(id);P.go('partner-hub-services');}};
})();
