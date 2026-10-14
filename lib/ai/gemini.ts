import { z } from 'zod';
import { variavel, dimensaoEmbedding } from '@/lib/config';
import { ErroIA } from '@/lib/domain/erros';
import type { Gerador } from './provider';
async function chamar(modelo: string, operacao: string, body: unknown, signal: AbortSignal): Promise<unknown> {
 const resposta = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelo)}:${operacao}`, { method:'POST',headers:{ 'Content-Type':'application/json','x-goog-api-key':variavel('GEMINI_API_KEY') },body:JSON.stringify(body),signal });
 if(!resposta.ok) throw new ErroIA(`Gemini respondeu HTTP ${resposta.status}.`,resposta.status);
 return resposta.json();
}
export const gerarGemini: Gerador = async (prompt,schema,signal) => {
 const data = await chamar(process.env.GEMINI_MODEL ?? 'gemini-2.5-flash-lite','generateContent',{ contents:[{ role:'user', parts:[{ text:prompt }] }],generationConfig:{ responseMimeType:'application/json',responseJsonSchema:schema } },signal);
 const parsed = z.object({ candidates:z.array(z.object({ content:z.object({ parts:z.array(z.object({ text:z.string().optional() })) }) })).min(1) }).parse(data);
 return parsed.candidates[0].content.parts.map(p=>p.text ?? '').join('');
};
export async function embedGemini(texto: string): Promise<number[]> {
 const data = await chamar(process.env.EMBEDDING_MODEL ?? 'gemini-embedding-001','embedContent',{ content:{ parts:[{text:texto}] },outputDimensionality:dimensaoEmbedding() },AbortSignal.timeout(8000));
 return z.object({ embedding:z.object({ values:z.array(z.number()) }) }).parse(data).embedding.values;
}
