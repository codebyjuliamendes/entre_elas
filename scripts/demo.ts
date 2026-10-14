import { mkdir,readFile,writeFile } from 'node:fs/promises';
import { z } from 'zod';
import { getDb,verificarErro } from '@/lib/db/client';
import { exigirDemo,variavel } from '@/lib/config';
import { seed } from './seed';
import { uuid } from './fixtures';
import { buscarMatch } from '@/lib/domain/match';
import * as f from '@/lib/domain/faisca';
import { processarFila,confirmarSaber } from '@/lib/domain/saber';
const stateSchema=z.object({faisca_id:z.uuid()});
async function main(){
 exigirDemo();for(const key of ['GEMINI_API_KEY','GROQ_API_KEY','STREAM_API_KEY','STREAM_API_SECRET','DAILY_API_KEY'])variavel(key);
 const inicio=Date.now();await seed();const db=getDb();
 const {count,error:ce}=await db.from('saberes').select('id',{count:'exact',head:true}).eq('fonte','perfil');verificarErro(ce);
 if(!count||count<12)throw new Error('Execute processar-saberes antes da demo.');
 let anterior:z.infer<typeof stateSchema>|null=null;
 try{anterior=stateSchema.parse(JSON.parse(await readFile('.local/demo-state.json','utf8')));}catch(error){if(!(error instanceof Error&&'code' in error&&error.code==='ENOENT'))throw error;}
 if(anterior){
  const {data:old,error:oe}=await db.from('faiscas').select('solicitante_id,convidada_id').eq('id',anterior.faisca_id).maybeSingle();verificarErro(oe);
  if(old&&(old.solicitante_id!==uuid(1)||old.convidada_id!==uuid(2)))throw new Error('O registro não pertence ao roteiro de demo.');
  for(const tabela of ['saberes','ia_jobs'] as const){const {error}=await db.from(tabela).delete().eq('fonte','faisca').eq('fonte_id',anterior.faisca_id);verificarErro(error);}
  const {error:pe}=await db.from('posts').delete().eq('origem_faisca_id',anterior.faisca_id);verificarErro(pe);
  const {error:fe}=await db.from('faiscas').delete().eq('id',anterior.faisca_id);verificarErro(fe);
 }
 const pedido='Preciso apresentar um projeto à diretoria';const matches=await buscarMatch(pedido,uuid(1));
 if(!matches.some(m=>m.profile_id===uuid(2)))throw new Error('Carla não apareceu nas indicações.');
 const horario=new Date(Date.now()+3600000).toISOString();let faisca=await f.criarFaisca({solicitante_id:uuid(1),convidada_id:uuid(2),pedido,tema:'Apresentação de projetos à diretoria',horarios_propostos:[horario]},uuid(1));
 await mkdir('.local',{recursive:true});await writeFile('.local/demo-state.json',JSON.stringify(stateSchema.parse({faisca_id:faisca.id})));
 faisca=await f.aceitarFaisca({faisca_id:faisca.id,horario},uuid(2));if(faisca.integracao_erros.length)throw new Error('Integrações da Faísca falharam.');
 await f.registrarAnotacoes({faisca_id:faisca.id,texto:'Aprendi a organizar uma apresentação de projeto à diretoria com objetivo, indicadores e decisão esperada.'},uuid(1));
 await f.registrarAnotacoes({faisca_id:faisca.id,texto:'Já apresentei projetos à diretoria. Ensinei a estruturar objetivo, indicadores e decisão esperada e a responder perguntas sobre orçamento.'},uuid(2));
 await f.concluirFaisca(faisca.id,uuid(1));await f.autorizarPublicacao(faisca.id,uuid(1));await f.autorizarPublicacao(faisca.id,uuid(2));const post=await f.publicarComoDica(faisca.id,uuid(1));
 const fila=await processarFila();if(fila.erros)throw new Error('A fila teve falhas.');
 const {data:saberes,error:se}=await db.from('saberes').select('id').eq('fonte','faisca').eq('fonte_id',faisca.id).eq('profile_id',uuid(2));verificarErro(se);
 if(!saberes?.length)throw new Error('Nenhum saber foi extraído para Carla.');for(const saber of saberes)await confirmarSaber(saber.id,uuid(2));
 const ms=Date.now()-inicio;console.log(JSON.stringify({faisca_id:faisca.id,post_id:post.id,saberes_carla:saberes.length,ms,menos_de_um_minuto:ms<60000}));if(ms>=60000)process.exitCode=1;
}
main().catch(error=>{console.error(error instanceof Error?error.message:'Falha na demo.');process.exitCode=1;});
