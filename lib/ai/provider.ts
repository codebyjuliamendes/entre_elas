import { consumirIA } from "@/lib/piloto/ia";
import { createHash } from 'node:crypto';
import { z } from 'zod';
import { ErroIA } from '@/lib/domain/erros';
import { getDb, verificarErro } from '@/lib/db/client';
import { dimensaoEmbedding } from '@/lib/config';
import { gerarGemini, embedGemini } from './gemini';
import { gerarGroq } from './groq';
export type Gerador = (prompt: string, schema: Record<string, unknown>, signal: AbortSignal) => Promise<string>;
export interface Cache { ler(chave: string): Promise<unknown | null>; gravar(chave: string, resposta: unknown): Promise<void> }
export interface DependenciasIA { gemini: Gerador; groq: Gerador; embedding: (texto: string) => Promise<number[]>; cache: Cache; timeoutMs?: number }
export interface OpcoesIA { cache?: boolean; versao?: string; prazoMs?: number }
const cacheDb: Cache = {
 async ler(chave) { const { data, error } = await getDb().from('ia_cache').select('resposta').eq('chave',chave).maybeSingle(); verificarErro(error); return data?.resposta ?? null; },
 async gravar(chave,resposta) { const { error } = await getDb().from('ia_cache').upsert({ chave, resposta: z.json().parse(resposta) }, { onConflict:'chave' }); verificarErro(error); }
};
export function criarProvider(deps: DependenciasIA) {
 return {
 async gerar<T>(prompt: string, schema: z.ZodType<T>, opcoes: OpcoesIA = {}): Promise<T> {
  z.string().min(1).parse(prompt);
  const jsonSchema = z.toJSONSchema(schema) as Record<string, unknown>;
  const chave = createHash('sha256').update(JSON.stringify([prompt,opcoes.versao ?? '1',jsonSchema,process.env.GEMINI_MODEL,process.env.GROQ_MODEL])).digest('hex');
  if (opcoes.cache) { const cached = await deps.cache.ler(chave); if(cached !== null) return schema.parse(cached); }
  const prazo = opcoes.prazoMs ?? 16000;
  const inicio = Date.now();
  async function tentar(gerador: Gerador, tempo: number): Promise<T> {
   const controller = new AbortController();
   let timer: ReturnType<typeof setTimeout> | undefined;
   const trabalho = (async () => {
    for(let tentativa=0; tentativa<2; tentativa++) {
     const resposta = await gerador(prompt + (tentativa ? '\nCorrija a saída anterior: responda apenas JSON válido no schema fornecido.' : ''),jsonSchema,controller.signal);
     try { return schema.parse(JSON.parse(resposta)); }
     catch { if(tentativa === 1) throw new ErroIA('A IA retornou JSON inválido após duas tentativas.'); }
    }
    throw new ErroIA('Não foi possível gerar a resposta.');
   })();
   try { return await Promise.race([trabalho,new Promise<never>((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(new ErroIA('Tempo limite da IA excedido.',408));},tempo);})]); }
   finally { clearTimeout(timer); controller.abort(); }
  }
  let result: T;
  try { result = await tentar(deps.gemini,Math.min(deps.timeoutMs ?? 8000,prazo)); }
  catch(error) {
   const fallback = error instanceof ErroIA && (error.status === 429 || error.status === 408);
   if(!fallback) throw error;
   const restante = prazo - (Date.now()-inicio);
   if(restante <= 0) throw new ErroIA('Prazo total da IA excedido.',408);
   result = await tentar(deps.groq,restante);
  }
  if(opcoes.cache) await deps.cache.gravar(chave,result);
  return schema.parse(result);
 },
 async embed(texto: string): Promise<number[]> {
  z.string().trim().min(1).max(20000).parse(texto);
  const chave = 'embed:'+createHash('sha256').update(JSON.stringify([process.env.EMBEDDING_MODEL ?? 'gemini-embedding-001',dimensaoEmbedding(),texto])).digest('hex');
  const cached=await deps.cache.ler(chave);
  const valores = z.array(z.number().finite()).length(dimensaoEmbedding()).parse(cached ?? await deps.embedding(texto));
  const norma = Math.sqrt(valores.reduce((sum,x)=>sum+x*x,0));
  if(!norma) throw new ErroIA('Embedding nulo retornado pela IA.');
  const normalizado=valores.map(x=>x/norma);
  if(cached===null)await deps.cache.gravar(chave,normalizado);
  return z.array(z.number().finite()).length(dimensaoEmbedding()).parse(normalizado);
 }
 };
}
const provider = criarProvider({ gemini: gerarGemini, groq: gerarGroq, embedding: embedGemini, cache: cacheDb });
export async function gerar<T>(prompt:string,schema:z.ZodType<T>,opcoes:OpcoesIA={}) { await consumirIA(); return provider.gerar(prompt,schema,opcoes); }
export async function embed(texto:string) { await consumirIA(); return provider.embed(texto); }
