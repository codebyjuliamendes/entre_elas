// Contrato local: Auth simulado + PostgREST real. Nunca usar como servidor de produção.
import {createServer} from 'node:http';
import {readFileSync} from 'node:fs';
import {spawn} from 'node:child_process';
import {createHash,randomUUID} from 'node:crypto';
import {createClient} from '@supabase/supabase-js';
const env=Object.fromEntries(readFileSync('.env.local-db','utf8').split('\n').filter(l=>l.includes('=')).map(l=>{const p=l.indexOf('=');return [l.slice(0,p),l.slice(p+1)];}));
const db=createClient(env.NEXT_PUBLIC_SUPABASE_URL,env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false}});
const emails=['primeira@banca.test','livre@outra.test','terceira@banca.test'];
for(const email of emails){await db.from('piloto_limites').delete().eq('chave','login:'+createHash('sha256').update(email).digest('hex'));}
const usuarios=new Map(emails.map(email=>[email,{id:randomUUID(),email,email_confirmed_at:new Date().toISOString(),aud:'authenticated',role:'authenticated',app_metadata:{},user_metadata:{}}]));
const links=new Map();const tokens=new Map();
function sessao(user){const access=[{alg:'HS256',typ:'JWT'},{sub:user.id,email:user.email,exp:Math.floor(Date.now()/1000)+3600},'assinatura-apenas-do-teste'].map((x,i)=>i===2?Buffer.from(x).toString('base64url'):Buffer.from(JSON.stringify(x)).toString('base64url')).join('.');tokens.set(access,user);tokens.set('refresh-'+user.id,user);return {access_token:access,refresh_token:'refresh-'+user.id,expires_in:3600,token_type:'bearer',user};}
const server=createServer(async(req,res)=>{try{
 const url=new URL(req.url,'http://127.0.0.1:54322');
 if(url.pathname.startsWith('/rest/v1/')){const chunks=[];for await(const c of req)chunks.push(c);const r=await fetch(env.NEXT_PUBLIC_SUPABASE_URL+req.url,{method:req.method,headers:{...req.headers,host:'127.0.0.1:54321'},body:['GET','HEAD'].includes(req.method)?undefined:Buffer.concat(chunks)});res.writeHead(r.status,Object.fromEntries(r.headers));res.end(Buffer.from(await r.arrayBuffer()));return;}
 res.setHeader('Content-Type','application/json');
 if(url.pathname==='/test-cleanup'){await limpar();res.end('{}');return;}
 if(url.pathname==='/test-link'){const link=[...links].find(([,v])=>v.email===url.searchParams.get('email'));res.end(JSON.stringify({url:link?'http://127.0.0.1:3400/auth/callback?code='+link[0]:null}));return;}
 const chunks=[];for await(const c of req)chunks.push(c);const body=chunks.length?JSON.parse(Buffer.concat(chunks).toString()):{};
 if(url.pathname==='/auth/v1/otp'){if(!usuarios.has(body.email))usuarios.set(body.email,{id:randomUUID(),email:body.email,email_confirmed_at:new Date().toISOString(),aud:'authenticated',role:'authenticated',app_metadata:{},user_metadata:{}});const code=randomUUID();links.set(code,{email:body.email,challenge:body.code_challenge});res.end('{}');return;}
 if(url.pathname==='/auth/v1/token'){
  let user;
  if(url.searchParams.get('grant_type')==='pkce'){const link=links.get(body.auth_code);const challenge=createHash('sha256').update(body.code_verifier ?? '').digest('base64url');if(link?.challenge===challenge){user=usuarios.get(link.email);links.delete(body.auth_code);}}
  else user=tokens.get(body.refresh_token);
  if(!user){res.statusCode=401;res.end('{"message":"Sessão de teste inválida"}');return;}
  res.end(JSON.stringify(sessao(user)));return;
 }
 if(url.pathname==='/auth/v1/user'){const user=tokens.get(req.headers.authorization?.replace('Bearer ',''));if(!user){res.statusCode=401;res.end('{"message":"Token inválido"}');return;}res.end(JSON.stringify(user));return;}
 if(url.pathname==='/auth/v1/logout'){res.end('{}');return;}
 res.statusCode=404;res.end('{}');
 }catch{res.statusCode=500;res.end('{"message":"Falha no contrato local"}');}});
await new Promise(resolve=>server.listen(54322,'127.0.0.1',resolve));
const child=spawn('npm',['run','start','--','--port','3400'],{stdio:'inherit',env:{...process.env,...env,APP_MODE:'piloto',PILOT_STARTS_AT:new Date().toISOString(),APP_URL:'http://127.0.0.1:3400',NEXT_PUBLIC_SUPABASE_URL:'http://127.0.0.1:54322',NEXT_PUBLIC_SUPABASE_ANON_KEY:'chave-publica-apenas-do-teste',PILOT_LEADER_EMAILS:emails[0],GEMINI_API_KEY:'',GROQ_API_KEY:'',DAILY_API_KEY:'',STREAM_API_KEY:'',STREAM_API_SECRET:''}});
let terminando=false;
async function limpar(){
 for(const u of usuarios.values()){
  const {data:c}=await db.from('piloto_contas').select('profile_id').eq('auth_user_id',u.id).maybeSingle();
  if(!c)continue;const pid=c.profile_id;
  const {data:fs}=await db.from('faiscas').select('id').or(`solicitante_id.eq.${pid},convidada_id.eq.${pid}`);const ids=fs?.map(f=>f.id)??[];
  if(ids.length){await db.from('posts').delete().in('origem_faisca_id',ids);await db.from('faiscas').delete().in('id',ids);}
  await db.from('ia_jobs').delete().eq('profile_id',pid);await db.from('piloto_favoritos').delete().eq('profile_id',pid);await db.from('community_members').delete().eq('profile_id',pid);await db.from('event_participantes').delete().eq('profile_id',pid);await db.from('piloto_contas').delete().eq('auth_user_id',u.id);await db.from('piloto_limites').delete().eq('chave','ia:'+pid);await db.from('profiles').delete().eq('id',pid);
 }
}
async function encerrar(){if(terminando)return;terminando=true;child.kill('SIGTERM');server.close();await limpar();process.exit(0);}
process.on('SIGTERM',encerrar);process.on('SIGINT',encerrar);child.on('exit',()=>{if(!terminando)void encerrar();});
