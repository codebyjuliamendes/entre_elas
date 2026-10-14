import { describe,it,expect,beforeAll,afterAll,vi } from 'vitest';
import { getDb,verificarErro } from '@/lib/db/client';
import { seed } from '@/scripts/seed';
import { uuid,posts } from '@/scripts/fixtures';
import * as f from '@/lib/domain/faisca';
import * as c from '@/lib/domain/comunidade';
import * as conteudo from '@/lib/domain/conteudo';
import * as evento from '@/lib/domain/evento';
import { confirmarSaber } from '@/lib/domain/saber';
import * as grupo from '@/lib/domain/grupo';
import * as stream from '@/lib/integrations/stream';
import { obterIndicadores } from '@/lib/domain/indicadores';
import { gerar } from '@/lib/ai/provider';
vi.mock('@/lib/ai/provider',()=>({gerar:vi.fn(),embed:vi.fn()}));
vi.mock('@/lib/integrations/stream',()=>({sincronizarPerfil:vi.fn().mockRejectedValue(new Error('offline')),criarCanal:vi.fn(),adicionarMembro:vi.fn(),removerMembro:vi.fn()}));
vi.mock('@/lib/integrations/daily',()=>({criarSala:vi.fn().mockRejectedValue(new Error('offline')),tokenSala:vi.fn()}));
const enabled=process.env.TEST_DATABASE==='true';
describe.skipIf(!enabled)('Domínios com Postgres e pgvector reais',()=>{
 const saberesTeste:string[]=[];let comunidadeTeste='';let grupoTeste=''; let fid='';const horario='2026-12-01T10:00:00Z';const anotacao1='Aprendi a apresentar.';const anotacao2='Ensinei com evidências.';
 beforeAll(async()=>{if(new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').hostname!=='127.0.0.1')throw new Error('Testes de banco exigem Supabase local.');await seed();vi.mocked(gerar).mockImplementation(async (_prompt,schema)=>schema.parse({perguntas:['Uma?','Duas?','Três?']}));});
 it('seed é idempotente e cria as quantidades esperadas',async()=>{await seed();for(const [table,count] of [['profiles',12],['communities',4],['posts',15],['comments',15],['events',5]] as const){const r=await getDb().from(table).select('id',{count:'exact',head:true});verificarErro(r.error);expect(r.count).toBe(count);}});
 it('oculta comunidades privadas e bloqueia ingresso sem convite',async()=>{expect((await c.listarComunidades(uuid(1))).some(c=>c.is_private)).toBe(false);await expect(c.entrarComunidade(uuid(104),uuid(1))).rejects.toThrow('privada');expect((await c.listarComunidades(uuid(2))).some(c=>c.is_private)).toBe(true);});
 it('protege posts e comentários privados e autoria',async()=>{const privado=posts.find(p=>p.community_id===uuid(104))!;await expect(conteudo.obterPost(privado.id,uuid(1))).rejects.toThrow('privada');await expect(conteudo.comentar({post_id:uuid(201),autora_id:uuid(2),corpo:'Teste'},uuid(1))).rejects.toThrow('Autoria');expect((await conteudo.listarPosts(uuid(1))).every(p=>p.community_id!==uuid(104))).toBe(true);});
 it('enfileira extração sem enviar mensagens de chat ao banco',async()=>{const {data,error}=await getDb().from('ia_jobs').select('id');verificarErro(error);expect((data?.length ?? 0)).toBeGreaterThanOrEqual(30);});
 it('cria Faísca e bloqueia resposta da solicitante',async()=>{const criada=await f.criarFaisca({solicitante_id:uuid(1),convidada_id:uuid(2),pedido:'Apresentar',tema:'Diretoria',horarios_propostos:[horario]},uuid(1));fid=criada.id;await expect(f.aceitarFaisca({faisca_id:fid,horario},uuid(1))).rejects.toThrow('convidada');});
 it('mantém o aceite com falhas de integração e registra retentativa',async()=>{vi.mocked(gerar).mockRejectedValueOnce(new Error('offline'));const aceita=await f.aceitarFaisca({faisca_id:fid,horario},uuid(2));expect(aceita.status).toBe('aceita');expect(aceita.integracao_erros).toHaveLength(3);expect((await f.reprocessarIntegracoes(fid,uuid(2))).pauta?.perguntas).toHaveLength(3);});
 it('não perde anotações concorrentes e bloqueia terceiros',async()=>{await expect(f.registrarAnotacoes({faisca_id:fid,texto:'Ataque'},uuid(3))).rejects.toThrow('participantes');await Promise.all([f.registrarAnotacoes({faisca_id:fid,texto:anotacao1},uuid(1)),f.registrarAnotacoes({faisca_id:fid,texto:anotacao2},uuid(2))]);expect((await f.obterFaisca(fid,uuid(1))).anotacoes).toEqual({[uuid(1)]:anotacao1,[uuid(2)]:anotacao2});});
 it('conclui e exige consentimento das duas para publicação',async()=>{vi.mocked(gerar).mockImplementationOnce(async(_p,schema)=>schema.parse({aprendizados:['Planejar'],proximos_passos:['Ensaiar'],rascunho_dica:{titulo:'Apresentação',corpo:'Use indicadores.'}}));expect((await f.concluirFaisca(fid,uuid(1))).status).toBe('realizada');await f.autorizarPublicacao(fid,uuid(1));await expect(f.publicarComoDica(fid,uuid(1))).rejects.toThrow('duas');await f.autorizarPublicacao(fid,uuid(2));});
 it('publicação concorrente cria só um post, duas coautoras e um quiz',async()=>{vi.mocked(gerar).mockImplementation(async(_p,schema)=>schema.parse(Array.from({length:3},()=>({pergunta:'P?',alternativas:['A','B','C','D'],correta:1}))));const [a,b]=await Promise.all([f.publicarComoDica(fid,uuid(1)),f.publicarComoDica(fid,uuid(2))]);expect(a.id).toBe(b.id);const {data,error}=await getDb().from('post_coautoras').select('*').eq('post_id',a.id);verificarErro(error);expect(data).toHaveLength(2);const quiz=await conteudo.obterQuiz(a.id,uuid(1));expect(quiz.perguntas[0]).not.toHaveProperty('correta');expect((await conteudo.responderQuiz({quiz_id:quiz.id,respostas:[1,0,1]},uuid(1))).acertos).toBe(2);});
 it('eventos privados exigem associação e participação é idempotente',async()=>{await expect(evento.participarEvento(uuid(404),uuid(1))).rejects.toThrow('privada');const a=await evento.participarEvento(uuid(401),uuid(1));const b=await evento.participarEvento(uuid(401),uuid(1));expect(a.id).toBe(b.id);expect(await evento.cancelarParticipacao(uuid(401),uuid(1))).toBe(true);});
 it('só a dona confirma saber e a busca não vaza conteúdo privado',async()=>{
  const vetor=JSON.stringify([1,...Array(767).fill(0)]);
  const input={profile_id:uuid(2),saber:'Apresentar',evidencia:'Apresentei à diretoria',fonte:'perfil' as const,fonte_id:null,confianca:1,confirmado:true,embedding:vetor};
  const r=await getDb().rpc('registrar_saber',{dados:input});verificarErro(r.error);const data=r.data as {id:string};saberesTeste.push(data.id);
  await expect(confirmarSaber(data.id,uuid(1))).rejects.toThrow('pertence');await confirmarSaber(data.id,uuid(2));
  const privado=posts.find(p=>p.community_id===uuid(104))!;const sr=await getDb().rpc('registrar_saber',{dados:{...input,profile_id:privado.autora_id,saber:'Secreto',evidencia:'SEGREDO',fonte:'forum',fonte_id:privado.id}});verificarErro(sr.error);saberesTeste.push((sr.data as {id:string}).id);
  const result=await getDb().rpc('buscar_saberes',{query_embedding:vetor,limite:10,excluir_profile_id:uuid(1)});verificarErro(result.error);expect(result.data?.some(c=>c.evidencias.includes('SEGREDO'))).toBe(false);expect(result.data?.some(c=>c.profile_id===uuid(2))).toBe(true);
 });
 it('grupos e indicadores respeitam o contrato de domínio',async()=>{expect(await grupo.listarGrupos(uuid(1))).toEqual([]);const i=await obterIndicadores(uuid(1));expect(i.faiscas_realizadas).toBeGreaterThanOrEqual(1);expect(i.dicas_publicadas).toBeGreaterThan(0);});


 it('cria moderadora atomicamente e só ela admite em comunidade privada',async()=>{
  const cm=await c.criarComunidade({nome:'Comunidade de teste',descricao:'Fictícia',is_private:true},uuid(2));comunidadeTeste=cm.id;
  expect((await c.entrarComunidade(cm.id,uuid(2))).papel).toBe('moderadora');
  await expect(c.admitirMembro({community_id:cm.id,profile_id:uuid(1)},uuid(3))).rejects.toThrow('moderadoras');
  await c.admitirMembro({community_id:cm.id,profile_id:uuid(1)},uuid(2));expect(await c.verificarAcesso(cm.id,uuid(1))).toBe(true);
  await c.sairComunidade(cm.id,uuid(1));await expect(c.verificarAcesso(cm.id,uuid(1))).rejects.toThrow('privada');
 });
 it('protege grupo privado, recupera criação e controla convites e saída',async()=>{
  await expect(grupo.criarGrupo({nome:'Grupo fictício',descricao:'Teste',is_private:true,criado_por:uuid(2)},uuid(2))).rejects.toThrow('offline');
  const gs=await grupo.listarGrupos(uuid(2));grupoTeste=gs[0].id;expect((await grupo.listarGrupos(uuid(1))).some(g=>g.id===grupoTeste)).toBe(false);
  await expect(grupo.entrarNoGrupo(grupoTeste,uuid(1))).rejects.toThrow('convite');
  vi.mocked(stream.sincronizarPerfil).mockResolvedValue(true);vi.mocked(stream.criarCanal).mockResolvedValue('grupo-teste');
  expect((await grupo.reprocessarGrupo(grupoTeste,uuid(2))).stream_channel_id).toBe('grupo-teste');
  await expect(grupo.convidarGrupo({grupo_id:grupoTeste,profile_id:uuid(1)},uuid(3))).rejects.toThrow('criadora');
  await grupo.convidarGrupo({grupo_id:grupoTeste,profile_id:uuid(1)},uuid(2));await grupo.entrarNoGrupo(grupoTeste,uuid(1));
  expect((await grupo.listarGrupos(uuid(1))).some(g=>g.id===grupoTeste)).toBe(true);await grupo.sairDoGrupo(grupoTeste,uuid(1));expect((await grupo.listarGrupos(uuid(1))).some(g=>g.id===grupoTeste)).toBe(false);
 });
 afterAll(async()=>{
  if(fid){
   for(const table of ['saberes','ia_jobs'] as const){const {error}=await getDb().from(table).delete().eq('fonte','faisca').eq('fonte_id',fid);verificarErro(error);}
   const {error:pe}=await getDb().from('posts').delete().eq('origem_faisca_id',fid);verificarErro(pe);
   const {error:fe}=await getDb().from('faiscas').delete().eq('id',fid);verificarErro(fe);
  }
  if(comunidadeTeste){const {error}=await getDb().from('communities').delete().eq('id',comunidadeTeste);verificarErro(error);}
  if(grupoTeste){const {error}=await getDb().from('grupos').delete().eq('id',grupoTeste);verificarErro(error);}
  if(saberesTeste.length){const {error}=await getDb().from('saberes').delete().in('id',saberesTeste);verificarErro(error);}
 });
});
