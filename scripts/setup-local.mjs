import { execFileSync,spawn } from 'node:child_process';
import { mkdirSync,writeFileSync,readFileSync,readdirSync } from 'node:fs';
import { randomBytes,createHmac,createHash } from 'node:crypto';
const root=new URL('..',import.meta.url).pathname;
const docker=(args,options={})=>execFileSync('docker',args,{encoding:'utf8',stdio:['pipe','pipe','pipe'],...options});
const psql=(sql)=>docker(['exec','-i','entre-elas-db','psql','-h','127.0.0.1','-U','postgres','-At','-v','ON_ERROR_STOP=1'],{input:sql});
const exists=(kind,name)=>{try{docker([kind,'inspect',name]);return true;}catch{return false;}};
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
try{
 mkdirSync(root+'.local',{recursive:true});
 let keys;
 try{keys=JSON.parse(readFileSync(root+'.local/local-keys.json','utf8'));}catch(error){if(error.code!=='ENOENT')throw error;keys={jwt:randomBytes(32).toString('hex'),cookie:randomBytes(32).toString('hex')};writeFileSync(root+'.local/local-keys.json',JSON.stringify(keys),{mode:0o600,flag:'wx'});}
 if(typeof keys.jwt!=='string'||keys.jwt.length<32||typeof keys.cookie!=='string')throw new Error('Configuração local inválida.');
 const payload=[{alg:'HS256',typ:'JWT'},{role:'service_role',iss:'entre-elas-local'}].map(x=>Buffer.from(JSON.stringify(x)).toString('base64url')).join('.');
 const token=payload+'.'+createHmac('sha256',keys.jwt).update(payload).digest('base64url');
 if(!exists('network','entre-elas-local'))docker(['network','create','entre-elas-local']);
 if(!exists('container','entre-elas-db')){
  docker(['run','--name','entre-elas-db','--network','entre-elas-local','-e','POSTGRES_HOST_AUTH_METHOD=trust','-p','127.0.0.1:54330:5432','-v','entre-elas-db-data:/var/lib/postgresql/data','-d','pgvector/pgvector:pg17']);
 }else docker(['start','entre-elas-db']);
 for(let i=0;i<60;i++){try{psql('select 1;');break;}catch{if(i===59)throw new Error('Postgres indisponível.');await wait(500);}}
 psql("do $$ begin if not exists(select from pg_roles where rolname='service_role') then create role service_role nologin bypassrls; end if; if not exists(select from pg_roles where rolname='anon') then create role anon nologin; end if; end $$; create schema if not exists entre_elas_setup; create table if not exists entre_elas_setup.migrations(versao text primary key, checksum text not null);");
 for(const file of readdirSync(root+'supabase/migrations').filter(f=>f.endsWith('.sql')).sort()){
  const source=readFileSync(root+'supabase/migrations/'+file,'utf8');const checksum=createHash('sha256').update(source).digest('hex');
  const previous=psql(`select checksum from entre_elas_setup.migrations where versao='${file.replaceAll("'","''")}';`).trim();
  if(previous){if(previous!==checksum)throw new Error('Migration aplicada foi alterada; use uma nova migration.');continue;}
  psql(`begin;\n${source}\ninsert into entre_elas_setup.migrations values('${file.replaceAll("'","''")}','${checksum}');\ncommit;`);
 }
 psql('grant usage on schema public to anon,service_role; grant all on all tables in schema public to service_role; grant all on all sequences in schema public to service_role;');
 if(!exists('container','entre-elas-rest')){
  docker(['run','--name','entre-elas-rest','--network','entre-elas-local','-e','PGRST_DB_URI=postgres://postgres@entre-elas-db:5432/postgres','-e','PGRST_DB_SCHEMAS=public','-e','PGRST_DB_ANON_ROLE=anon','-e','PGRST_JWT_SECRET','-p','127.0.0.1:54331:3000','-d','postgrest/postgrest:v14.3'],{env:{...process.env,PGRST_JWT_SECRET:keys.jwt}});
 }else{docker(['start','entre-elas-rest']);docker(['kill','--signal','SIGUSR1','entre-elas-rest']);}
 let proxyAtivo=false;
 try{const r=await fetch('http://127.0.0.1:54321/rest/v1/profiles?select=id&limit=1',{headers:{Authorization:`Bearer ${token}`},signal:AbortSignal.timeout(1000)});proxyAtivo=r.ok;}catch{}
 if(!proxyAtivo){const child=spawn(process.execPath,[root+'scripts/local-rest.mjs'],{cwd:root,detached:true,stdio:'ignore'});child.unref();}
 for(let i=0;i<60;i++){try{const r=await fetch('http://127.0.0.1:54321/rest/v1/profiles?select=id&limit=1',{headers:{Authorization:`Bearer ${token}`},signal:AbortSignal.timeout(1000)});if(r.ok){if(!Array.isArray(await r.json()))throw new Error();break;}if(i===59)throw new Error();}catch{if(i===59)throw new Error('REST indisponível.');}await wait(500);}
 const config=`NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321\nSUPABASE_SERVICE_ROLE_KEY=${token}\nDEMO_MODE=true\nDEMO_COOKIE_SECRET=${keys.cookie}\nGEMINI_MODEL=gemini-2.5-flash-lite\nEMBEDDING_MODEL=gemini-embedding-001\nEMBEDDING_DIM=768\nGROQ_MODEL=llama-3.3-70b-versatile\nAI_QUEUE_DELAY_MS=4500\n`;
 writeFileSync(root+'.env.local-db',config,{mode:0o600});
 try{writeFileSync(root+'.env.local',config,{mode:0o600,flag:'wx'});}catch(error){if(error.code!=='EEXIST')throw error;}
 console.log('Postgres + pgvector + PostgREST locais verificados. Credenciais locais geradas e guardadas em arquivos ignorados. .env.local existente foi preservado. Storage/Auth do Supabase não são simulados.');
}catch(error){console.error('Falha na configuração local:',error.message);process.exitCode=1;}
