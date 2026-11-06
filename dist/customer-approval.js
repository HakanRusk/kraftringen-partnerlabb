(async()=>{
 const api='/api/customer-approval?token='+encodeURIComponent(new URL(location.href).searchParams.get('token')||'');
 const message=document.querySelector('#message'),container=document.querySelector('#documents');
 async function load(){
  const response=await fetch(api,{cache:'no-store'}),data=await response.json();if(!response.ok)throw Error(data.error);
  container.replaceChildren();message.textContent='';
  data.files.forEach((file,index)=>{
   const kind=index?'poa':'order',signed=index?data.poaSigned:data.orderSigned;
   const article=document.createElement('article');const title=document.createElement('h2');title.textContent=index?'Din fullmakt':'Din order';article.append(title);
   const details=document.createElement('details'),summary=document.createElement('summary'),pre=document.createElement('pre');summary.textContent=file.filename;pre.textContent=file.text;details.append(summary,pre);article.append(details);
   if(signed){const receipt=JSON.parse(signed),p=document.createElement('p');p.textContent=`Godkänd av ${receipt.name} ${new Date(receipt.at).toLocaleString('sv-SE')}. Kvittensen är sparad.`;article.append(p);}
   else{
    const form=document.createElement('form');form.innerHTML='<label>Ditt namn <input name="name" type="text" required minlength="2" maxlength="160" autocomplete="name"></label><label><input name="accept" type="checkbox" required> Jag har läst och godkänner handlingen.</label><button type="submit"></button>';
    const button=form.querySelector('button');button.textContent=index?'Godkänn fullmakten · test':'Godkänn ordern · test';
    form.onsubmit=async event=>{event.preventDefault();button.disabled=true;try{const response=await fetch(api,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({kind,name:form.elements.name.value,accept:form.elements.accept.checked})});const result=await response.json();if(!response.ok)throw Error(result.error);await load();}catch(error){message.textContent=error.message;button.disabled=false;}};article.append(form);
   }container.append(article);
  });
 }
 try{await load();}catch(error){message.textContent=error.message;}
})();
