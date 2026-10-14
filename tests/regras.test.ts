import { describe,it,expect,vi } from 'vitest';
import { faisca } from '@/lib/schemas/entities';
import { validarRespostaConvite,exigirParticipante,validarPublicacao,corrigirQuiz } from '@/lib/domain/regras';
import { validarIndicacoes,diversificar } from '@/lib/ai/curadora';
import { assinarCookie,validarCookie } from '@/lib/auth/current-user';
import { uuid } from '@/scripts/fixtures';
vi.stubEnv('DEMO_COOKIE_SECRET','segredo-ficticio-exclusivo-dos-testes-0001');
const convite=faisca.parse({id:uuid(500),created_at:'2026-10-14T00:00:00Z',updated_at:'2026-10-14T00:00:00Z',solicitante_id:uuid(1),convidada_id:uuid(2),pedido:'Ajuda',tema:'Apresentação',horarios_propostos:['2026-11-01T10:00:00Z'],horario:null,status:'pendente',pauta:null,anotacoes:{},resumo:null,publicacao_autorizada_por:[],stream_channel_id:null,daily_room_url:null});
describe('Regras da Faísca',()=>{
 it('só a convidada responde ao convite',()=>{expect(()=>validarRespostaConvite(convite,uuid(1))).toThrow('Somente a convidada');expect(validarRespostaConvite(convite,uuid(2))).toBe(true);});
 it('não aceita horários fora da proposta',()=>{expect(()=>validarRespostaConvite(convite,uuid(2),'2026-11-02T10:00:00Z')).toThrow('horário');});
 it('não responde duas vezes',()=>{expect(()=>validarRespostaConvite({...convite,status:'aceita'},uuid(2))).toThrow('pendente');});
 it('bloqueia anotações de terceiros',()=>{expect(()=>exigirParticipante(convite,uuid(3))).toThrow('participantes');});
 it('exige conclusão e consentimento das duas',()=>{expect(()=>validarPublicacao(convite)).toThrow('concluída');const realizada={...convite,status:'realizada' as const,resumo:{aprendizados:['A'],proximos_passos:[],rascunho_dica:{titulo:'Dica',corpo:'Conteúdo'}},publicacao_autorizada_por:[uuid(1)]};expect(()=>validarPublicacao(realizada)).toThrow('duas');expect(validarPublicacao({...realizada,publicacao_autorizada_por:[uuid(1),uuid(2)]})).toBe(true);});
});
describe('Contratos e identidade',()=>{
 it('corrige quiz usando as respostas reais',()=>{const ps=[0,2,3].map(correta=>({pergunta:'P?',alternativas:['A','B','C','D'],correta}));expect(corrigirQuiz(ps,[0,1,3])).toBe(2);expect(()=>corrigirQuiz(ps,[4,0,0])).toThrow();});
 it('detecta cookie de demo alterado',()=>{const cookie=assinarCookie(uuid(1));expect(validarCookie(cookie)).toBe(uuid(1));expect(()=>validarCookie(cookie.replace(uuid(1),uuid(2)))).toThrow('inválida');});
});
describe('Match com evidência',()=>{
 const candidatas=[{profile_id:uuid(2),nome:'Carla',area:'Projetos',regional:'Sul',evidencias:['Apresentei à diretoria'],similaridade:0.9}];
 it('aceita somente evidência literal e motivo fundamentado',()=>{expect(validarIndicacoes({candidatas,solicitante_id:uuid(1),indicacoes:[{profile_id:uuid(2),motivo:'Porque: Apresentei à diretoria',evidencias:['Apresentei à diretoria']}]})).toHaveLength(1);expect(()=>validarIndicacoes({candidatas,solicitante_id:uuid(1),indicacoes:[{profile_id:uuid(2),motivo:'Tem experiência',evidencias:['inventado']}]})).toThrow();});
 it('bloqueia autoindicação e repetição',()=>{const indicacao={profile_id:uuid(2),motivo:'Apresentei à diretoria',evidencias:['Apresentei à diretoria']};expect(()=>validarIndicacoes({candidatas,solicitante_id:uuid(2),indicacoes:[indicacao]})).toThrow();expect(()=>validarIndicacoes({candidatas,solicitante_id:uuid(1),indicacoes:[indicacao,indicacao]})).toThrow();});
 it('favorece áreas e regionais diferentes entre candidatas próximas',()=>{const lista=[...candidatas,{...candidatas[0],profile_id:uuid(3),similaridade:0.88},{...candidatas[0],profile_id:uuid(4),area:'Dados',regional:'Norte',similaridade:0.85}];expect(diversificar({candidatas:lista,solicitante_id:uuid(1)}).map(c=>c.profile_id)).toEqual([uuid(2),uuid(4),uuid(3)]);});
});
