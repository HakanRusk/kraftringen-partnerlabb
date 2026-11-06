const json=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store','Referrer-Policy':'no-referrer'}});
export async function customerApproval(request,env){
  const url=new URL(request.url);
  if(!env.DB)return json({error:'Lagringen är inte tillgänglig.'},503);
  if(url.pathname==='/api/internal/approval'){
    if(!env.APPROVAL_SECRET||request.headers.get('Authorization')!==`Bearer ${env.APPROVAL_SECRET}`)return json({error:'Åtkomst nekad.'},403);
    if(request.method==='POST'){
      const raw=await request.text();if(raw.length>30000)return json({error:'För stort underlag.'},413);
      let data;try{data=JSON.parse(raw);}catch{return json({error:'Ogiltigt underlag.'},400);}
      if(!/^[a-zA-Z0-9-]{10,100}$/.test(data.id)||!Array.isArray(data.files)||!data.files.length||data.files.length>2||data.files.some(f=>typeof f.text!=='string'||typeof f.filename!=='string'))return json({error:'Ogiltiga handlingar.'},400);
      const token=crypto.randomUUID()+crypto.randomUUID();
      await env.DB.prepare('INSERT OR IGNORE INTO approvals (id, token, payload, expires_at) VALUES (?, ?, ?, ?)').bind(data.id,token,raw,Date.now()+14*86400000).run();
      const row=await env.DB.prepare('SELECT * FROM approvals WHERE id = ?').bind(data.id).first();
      if(row.payload!==raw)return json({error:'Denna dokumentversion är redan låst.'},409);
      return json({url:`${url.origin}/customer-approval.html?token=${encodeURIComponent(row.token)}`,expiresAt:row.expires_at});
    }
    const row=await env.DB.prepare('SELECT order_signed, poa_signed FROM approvals WHERE id = ?').bind(url.searchParams.get('id')).first();return json(row||{});
  }
  const token=url.searchParams.get('token');
  if(!/^[a-f0-9-]{72}$/.test(token||''))return json({error:'Länken är ogiltig.'},404);
  const row=await env.DB.prepare('SELECT * FROM approvals WHERE token = ?').bind(token).first();
  if(!row)return json({error:'Länken är ogiltig.'},404);
  if(row.expires_at<Date.now())return json({error:'Länken har gått ut. Kontakta din säljare.'},410);
  const data=JSON.parse(row.payload);
  if(request.method==='POST'){
    if(request.headers.get('Origin')!==url.origin)return json({error:'Öppna länken från mejlet.'},403);
    let input;try{input=await request.json();}catch{return json({error:'Ogiltigt svar.'},400);}
    if(!['order','poa'].includes(input.kind)||typeof input.name!=='string'||input.name.trim().length<2||input.name.length>160||input.accept!==true||input.kind==='poa'&&data.files.length!==2)return json({error:'Ange namn och bekräfta handlingen.'},400);
    const column=input.kind==='order'?'order_signed':'poa_signed';
    const receipt=JSON.stringify({name:input.name.trim(),at:new Date().toISOString(),version:row.id,method:'click-demo'});
    await env.DB.prepare(`UPDATE approvals SET ${column} = COALESCE(${column}, ?) WHERE token = ?`).bind(receipt,token).run();
    return json({accepted:true});
  }
  if(request.method!=='GET')return json({error:'Metoden stöds inte.'},405);
  return json({files:data.files,version:row.id,orderSigned:row.order_signed,poaSigned:row.poa_signed});
}
