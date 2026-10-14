import { z } from 'zod';
import { getDb, verificarErro } from '@/lib/db/client';
import * as s from '@/lib/schemas/entities';
import { extrairSaberes } from '@/lib/ai/curadora';
import { embed } from '@/lib/ai/provider';
import { obterPerfil } from './perfil';
import { ErroDominio } from './erros';
export async function confirmarSaber(entrada: unknown, usuaria: string) {
 const sid=s.id.parse(entrada); const pid=s.id.parse(usuaria);
 const {data,error}=await getDb().from('saberes').update({confirmado:true}).eq('id',sid).eq('profile_id',pid).select('*').maybeSingle(); verificarErro(error);
 if(!data) throw new ErroDominio('Saber não encontrado ou pertence a outra usuária.',403); return s.saber.parse(data);
}
async function gravar(input:z.infer<typeof s.saberInput>) { const {data,error}=await getDb().rpc('registrar_saber',{dados:s.saberInput.parse(input)}); verificarErro(error); return s.saber.parse(data); }
async function pausaIA() { await new Promise(resolve=>setTimeout(resolve,z.coerce.number().int().min(0).max(60000).parse(process.env.AI_QUEUE_DELAY_MS ?? '4500'))); }
export async function processarPerfil(entrada: unknown) {
 const pid=s.id.parse(entrada); const p=await obterPerfil(pid);
 const {data,error}=await getDb().from('saberes').select('*').eq('profile_id',pid).eq('fonte','perfil');verificarErro(error);
 const existentes=z.array(s.saber).parse(data);const resultados=[];
 for(const texto of p.interesses) {
  const existente=existentes.find(x=>x.saber===texto&&x.embedding);
  if(existente){resultados.push(existente);continue;}
  resultados.push(await gravar({profile_id:pid,saber:texto,evidencia:`${p.nome} declara no perfil: ${texto}`,fonte:'perfil',fonte_id:null,confianca:1,confirmado:true,embedding:JSON.stringify(await embed(texto))}));
  await pausaIA();
 }
 const removidos=existentes.filter(x=>!p.interesses.includes(x.saber)).map(x=>x.id);
 if(removidos.length){const {error}=await getDb().from('saberes').delete().in('id',removidos);verificarErro(error);}
 return z.array(s.saber).parse(resultados);
}
export async function processarTroca(entrada: unknown) {
 const input=z.object({profile_id:s.id,texto:s.texto,fonte:s.fonte.exclude(['perfil']),fonte_id:s.id,contexto:s.resumo.nullable().optional()}).parse(entrada);
 const lista=await extrairSaberes({texto:input.texto,autora:input.profile_id,resumo_contexto:input.contexto}); await pausaIA();const resultados=[];
 for(const x of lista) {resultados.push(await gravar({profile_id:input.profile_id,...x,fonte:input.fonte,fonte_id:input.fonte_id,confirmado:false,embedding:JSON.stringify(await embed(x.saber))}));await pausaIA();}
 return z.array(s.saber).parse(resultados);
}
export async function listarSaberes(usuaria: string) {
 const {data,error}=await getDb().from('saberes').select('*').eq('profile_id',s.id.parse(usuaria)); verificarErro(error); return z.array(s.saber).parse(data);
}
export async function processarFila() {
 let concluidos=0; let erros=0;
 for(;;) {
  const {data,error}=await getDb().rpc('pegar_job'); verificarErro(error); if(!data) break;
  const j=z.object({id:s.id,profile_id:s.id,texto:s.texto,fonte:s.fonte.exclude(['perfil']),fonte_id:s.id,contexto:s.resumo.nullable().optional()}).parse(data);
  try { await processarTroca(j); const {error}=await getDb().from('ia_jobs').update({estado:'concluido',erro:null}).eq('id',j.id); verificarErro(error); concluidos++; }
  catch { const {error}=await getDb().from('ia_jobs').update({estado:'erro',erro:'Falha no processamento; verifique configuração e disponibilidade dos provedores.'}).eq('id',j.id); verificarErro(error); erros++; }
  await pausaIA();
 }
 return z.object({concluidos:z.number().int(),erros:z.number().int()}).parse({concluidos,erros});
}
