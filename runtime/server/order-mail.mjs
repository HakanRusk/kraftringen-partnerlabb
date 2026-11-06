export const RECIPIENT = 'hakan.rusk@kraftringen.se';
const json = (body, status=200) => Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
const field = (value, max=200) => typeof value==='string' ? value.replace(/[\r\n\x00-\x1f]/g,' ').trim().slice(0,max) : '';
const base64 = text => btoa(String.fromCharCode(...new TextEncoder().encode(text)));
export function documents(order) {
  const lines=['KRAFTRINGEN PARTNERLABB – TESTUTSKICK','Fiktiv order. Inte ett bindande avtal.', '',
    `Order-ID: ${order.id}`,`Kund: ${order.customer}`,`Partner: ${order.partner}`,`Säljare: ${order.seller || 'Ej tilldelad'}`,
    `Produkt: ${order.product}`,`Prisunderlag: ${order.price || 'Underlag saknas'}`,`Önskad start: ${order.startDate || 'Ej angiven'}`,`Avtalstid: ${order.term || 'Ej angiven'}`,
    `Fullmakt begärd: ${order.poa ? 'Ja' : 'Nej'}`,'',...order.facilities.map((f,i)=>`Anläggning ${i+1}: ${f.id || 'ID saknas'} | ${f.area || 'Elområde saknas'} | ${f.kwh || 'Förbrukning saknas'} kWh/år | Nätområde: ${f.network || '—'}`),
    '', 'Detta testar utskicket. Kundsignering, mejlreturer och mottagning i CRM är inte anslutna.'];
  const files=[{filename:`order-${order.id}.txt`,text:lines.join('\r\n')}];
  if(order.poa)files.push({filename:`fullmakt-${order.id}.txt`,text:`FULLMAKT – TESTUNDERLAG\r\nOrder: ${order.id}\r\nKund: ${order.customer}\r\n\r\nAvsedd omfattning: inhämta anläggningsspecifika uppgifter från kundens nuvarande elnätsägare.\r\nDetta är endast ett test av dokumentflödet, inte en godkänd fullmaktsmall eller verifierad underskrift.`});
  return files;
}
export async function sendOrderMail(request, env, transport=fetch, now=Date.now()) {
  if(request.method!=='POST')return json({error:'Använd POST.'},405);
  // This endpoint is deployed ONLY behind the existing owner-private Sites gate.
  if(request.headers.get('origin')!==new URL(request.url).origin)return json({error:'Öppna utskicket från portalen.'},403);
  if(!request.headers.get('content-type')?.startsWith('application/json'))return json({error:'JSON krävs.'},415);
  if(Number(request.headers.get('content-length')||0)>24000)return json({error:'För stort underlag.'},413);
  let input;
  try {const text=await request.text();if(text.length>24000)return json({error:'För stort underlag.'},413);input=JSON.parse(text);}catch{return json({error:'Ogiltigt underlag.'},400);}
  const created=Date.parse(input.createdAt), age=now-created;
  if(!/^[a-zA-Z0-9-]{10,100}$/.test(input.attemptId||'')||!Number.isFinite(created)||age< -60000||age>22*3600000)return json({error:'Utskicksförsöket är för gammalt eller ogiltigt. Kontrollera Resend innan något nytt utskick görs.'},409);
  const raw=input.order;
  if(!raw || !/^[a-zA-Z0-9_-]{1,100}$/.test(raw.id||'')||!Array.isArray(raw.facilities)||raw.facilities.length<1||raw.facilities.length>50)return json({error:'Order-ID och 1–50 anläggningar krävs.'},400);
  const order={id:raw.id,customer:field(raw.customer),partner:field(raw.partner),seller:field(raw.seller),product:field(raw.product),price:field(raw.price,1500),startDate:field(raw.startDate),term:field(raw.term),poa:raw.poa===true,
    facilities:raw.facilities.map(f=>({id:field(f?.id,30),area:field(f?.area,10),kwh:field(f?.kwh,20),network:field(f?.network,30)}))};
  if(!order.customer||!order.partner||!order.product)return json({error:'Kund, partner och produkt krävs.'},400);
  if(!env.RESEND_API_KEY)return json({error:'Mejltjänstens servernyckel saknas.'},503);
  const files=documents(order);
  const payload={from:'Partnerlabb test <onboarding@resend.dev>',to:[RECIPIENT],subject:`[Partnerlabb TEST] Order ${order.id}`,text:files[0].text,
    attachments:files.map(f=>({filename:f.filename,content:base64(f.text)}))};
  try {
    const response=await transport('https://api.resend.com/emails',{method:'POST',headers:{'Authorization':`Bearer ${env.RESEND_API_KEY}`,'Content-Type':'application/json','Idempotency-Key':`partnerlabb/${input.attemptId}`},body:JSON.stringify(payload),signal:AbortSignal.timeout(20000)});
    const result=await response.json();
    if(!response.ok||typeof result.id!=='string')return json({error:response.status===401?'Resend accepterar inte nyckeln. Kontrollera API-nyckeln i Site-inställningarna.':response.status===403?'Resend nekar utskicket. Kontrollera att testmottagaren är kontots egen adress och att nyckeln får skicka.':`Resend accepterade inte utskicket (HTTP ${response.status}). Försök igen med samma sparade utskick.`,providerStatus:response.status},502);
    return json({accepted:true,providerMessageId:result.id,acceptedAt:new Date(now).toISOString(),recipient:RECIPIENT,documents:files.map(f=>f.filename)});
  }catch{return json({error:'Utskickets resultat är okänt. Kontrollera eller försök igen med samma sparade utskick inom 22 timmar; skapa inte ett nytt.'},504);}
}
