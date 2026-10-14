import { describe,it,expect,vi,afterEach } from 'vitest';
import { extrairSaberes } from '@/lib/ai/curadora';
import { buscarMatch } from '@/lib/domain/match';
import { uuid } from '@/scripts/fixtures';
import { gerar } from '@/lib/ai/provider';
vi.mock('@/lib/ai/provider',()=>({gerar:vi.fn(),embed:vi.fn()}));
afterEach(()=>vi.useRealTimers());
describe('Curadora',()=>{
 it('aceita evidência literal e envia o resumo só como contexto',async()=>{vi.mocked(gerar).mockResolvedValue([{saber:'Apresentar',evidencia:'Apresentei projetos',confianca:0.8}]);const resumo={aprendizados:['Comunicar'],proximos_passos:[],rascunho_dica:{titulo:'Dica',corpo:'Planeje'}};const r=await extrairSaberes({texto:'Apresentei projetos à diretoria',autora:uuid(2),resumo_contexto:resumo});expect(r[0].evidencia).toBe('Apresentei projetos');expect(vi.mocked(gerar).mock.calls.at(-1)?.[0]).toContain('resumo_contexto');});
 it('rejeita evidência inventada mesmo com JSON correto',async()=>{vi.mocked(gerar).mockResolvedValue([{saber:'Liderar',evidencia:'Liderei cem pessoas',confianca:1}]);await expect(extrairSaberes({texto:'Apresentei projetos à diretoria',autora:uuid(2)})).rejects.toThrow('não consta');});
 it('encerra a busca em 9,5 segundos quando o provedor não termina',async()=>{vi.useFakeTimers();vi.mocked(gerar).mockImplementation(()=>new Promise(()=>{}));const result=buscarMatch('Preciso apresentar',uuid(1));const check=expect(result).rejects.toMatchObject({status:408});await vi.advanceTimersByTimeAsync(9500);await check;});
});
