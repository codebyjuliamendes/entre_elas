import { describe,it,expect,vi } from 'vitest';
import { z } from 'zod';
import { criarProvider,type Cache } from '@/lib/ai/provider';
import { ErroIA } from '@/lib/domain/erros';
const schema=z.object({resposta:z.string()});
function setup(){const cache:Cache={ler:vi.fn().mockResolvedValue(null),gravar:vi.fn().mockResolvedValue(undefined)};const gemini=vi.fn().mockResolvedValue('{"resposta":"sim"}');const groq=vi.fn().mockResolvedValue('{"resposta":"alternativa"}');return {gemini,groq,cache,embedding:vi.fn().mockResolvedValue(Array.from({length:768},(_,i)=>i===0?2:0)),timeoutMs:20};}
describe('Provider de IA',()=>{
 it('valida o JSON e o contrato de saída',async()=>{const d=setup();expect(await criarProvider(d).gerar('Pergunta',schema)).toEqual({resposta:'sim'});expect(d.groq).not.toHaveBeenCalled();});
 it('repete uma vez quando o JSON é inválido',async()=>{const d=setup();d.gemini.mockResolvedValueOnce('texto').mockResolvedValueOnce('{"resposta":"corrigido"}');expect(await criarProvider(d).gerar('Pergunta',schema)).toEqual({resposta:'corrigido'});expect(d.gemini).toHaveBeenCalledTimes(2);});
 it('rejeita saída incompatível após a segunda tentativa',async()=>{const d=setup();d.gemini.mockResolvedValue('{"resposta":123}');await expect(criarProvider(d).gerar('Pergunta',schema)).rejects.toThrow('JSON inválido');expect(d.gemini).toHaveBeenCalledTimes(2);expect(d.groq).not.toHaveBeenCalled();});
 it('usa Groq em erro 429',async()=>{const d=setup();d.gemini.mockRejectedValue(new ErroIA('Limite',429));expect(await criarProvider(d).gerar('Pergunta',schema)).toEqual({resposta:'alternativa'});});
 it('aborta Gemini após o limite e usa Groq',async()=>{const d=setup();d.gemini.mockImplementation(()=>new Promise(()=>{}));expect(await criarProvider(d).gerar('Pergunta',schema)).toEqual({resposta:'alternativa'});const signal=d.gemini.mock.calls[0][2] as AbortSignal;expect(signal.aborted).toBe(true);});
 it('não encobre falhas de autenticação com fallback',async()=>{const d=setup();d.gemini.mockRejectedValue(new ErroIA('Sem acesso',403));await expect(criarProvider(d).gerar('Pergunta',schema)).rejects.toThrow('Sem acesso');expect(d.groq).not.toHaveBeenCalled();});
 it('lê o cache antes de chamar provedores',async()=>{const d=setup();vi.mocked(d.cache.ler).mockResolvedValue({resposta:'cache'});expect(await criarProvider(d).gerar('Pergunta',schema,{cache:true})).toEqual({resposta:'cache'});expect(d.gemini).not.toHaveBeenCalled();});
 it('grava cache e isola versões de prompt',async()=>{const d=setup();const p=criarProvider(d);await p.gerar('Pergunta',schema,{cache:true,versao:'1'});await p.gerar('Pergunta',schema,{cache:true,versao:'2'});const calls=vi.mocked(d.cache.gravar).mock.calls;expect(calls[0][0]).not.toBe(calls[1][0]);expect(calls[0][1]).toEqual({resposta:'sim'});});
 it('normaliza embeddings e valida dimensão',async()=>{const d=setup();const p=criarProvider(d);expect((await p.embed('Saber'))[0]).toBe(1);d.embedding.mockResolvedValue([1,2]);await expect(p.embed('Saber')).rejects.toThrow();});
 it('rejeita vetores nulos',async()=>{const d=setup();d.embedding.mockResolvedValue(Array(768).fill(0));await expect(criarProvider(d).embed('Saber')).rejects.toThrow('Embedding nulo');});
});
