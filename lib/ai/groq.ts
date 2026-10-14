import { z } from 'zod';
import { variavel } from '@/lib/config';
import { ErroIA } from '@/lib/domain/erros';
import type { Gerador } from './provider';
export const gerarGroq: Gerador = async (prompt,schema,signal) => {
 const resposta = await fetch('https://api.groq.com/openai/v1/chat/completions',{ method:'POST',headers:{ 'Content-Type':'application/json',Authorization:`Bearer ${variavel('GROQ_API_KEY')}` },body:JSON.stringify({ model:process.env.GROQ_MODEL ?? 'llama-3.3-70b-versatile',response_format:{type:'json_object'},messages:[{role:'system',content:`Responda apenas JSON válido no objeto {"resultado": ...}, cujo campo resultado segue este schema: ${JSON.stringify(schema)}`},{role:'user',content:prompt}] }),signal });
 if(!resposta.ok) throw new ErroIA(`Groq respondeu HTTP ${resposta.status}.`,resposta.status);
 const content = z.object({ choices:z.array(z.object({message:z.object({content:z.string()})})).min(1) }).parse(await resposta.json()).choices[0].message.content;
 try { return JSON.stringify(z.object({resultado:z.unknown()}).parse(JSON.parse(content)).resultado); } catch { return content; }
};
