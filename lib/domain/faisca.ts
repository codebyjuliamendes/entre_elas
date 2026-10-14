import { z } from 'zod';
import { getDb, verificarErro } from '@/lib/db/client';
import * as s from '@/lib/schemas/entities';
import { ErroDominio } from './erros';
import { exigirParticipante, validarRespostaConvite, validarPublicacao } from './regras';
import { obterPerfil } from './perfil';
import { gerarPauta, gerarResumo, gerarQuiz } from '@/lib/ai/curadora';
import { sincronizarPerfil, criarCanal } from '@/lib/integrations/stream';
import { criarSala, tokenSala } from '@/lib/integrations/daily';
export async function obterFaisca(entrada: unknown, usuaria: string) {
 const {data,error}=await getDb().from('faiscas').select('*').eq('id',s.id.parse(entrada)).maybeSingle(); verificarErro(error);
 if(!data) throw new ErroDominio('Faísca não encontrada.',404); const f=s.faisca.parse(data); exigirParticipante(f,usuaria); return f;
}
export async function listarFaiscas(usuaria: string) { const u=s.id.parse(usuaria); const {data,error}=await getDb().from('faiscas').select('*').or(`solicitante_id.eq.${u},convidada_id.eq.${u}`).order('created_at',{ascending:false}); verificarErro(error); return z.array(s.faisca).parse(data); }
export async function criarFaisca(entrada: unknown, usuaria: string) {
 const input=s.criarFaiscaInput.parse(entrada); const u=s.id.parse(usuaria);
 if(input.solicitante_id!==u || u===input.convidada_id) throw new ErroDominio('Solicitante inválida.');
 if(input.horarios_propostos.some(h=>Date.parse(h)<=Date.now())) throw new ErroDominio('Proponha horários futuros.');
 await obterPerfil(input.convidada_id);
 const {data,error}=await getDb().from('faiscas').insert(input).select('*').single(); verificarErro(error); return s.faisca.parse(data);
}
async function operar(fid: string, u: string, acao: string, dados: Record<string,unknown>={}) {
 const {data,error}=await getDb().rpc('operar_faisca',{faisca_id:s.id.parse(fid),usuaria_id:s.id.parse(u),acao,dados:z.record(z.string(),z.json()).parse(dados)});
 if(error) throw new ErroDominio(error.message,409); return s.faisca.parse(data);
}
export async function aceitarFaisca(entrada: unknown, usuaria: string) {
 const input=z.object({faisca_id:s.id,horario:z.iso.datetime({offset:true})}).parse(entrada); const f=await obterFaisca(input.faisca_id,usuaria); validarRespostaConvite(f,usuaria,input.horario);
 await operar(f.id,usuaria,'aceitar',{horario:input.horario}); return reprocessarIntegracoes(f.id,usuaria);
}
export async function recusarFaisca(entrada: unknown, usuaria: string) { const f=await obterFaisca(s.id.parse(entrada),usuaria); validarRespostaConvite(f,usuaria); return operar(f.id,usuaria,'recusar'); }
export async function cancelarFaisca(entrada: unknown, usuaria: string) { const f=await obterFaisca(s.id.parse(entrada),usuaria); return operar(f.id,usuaria,'cancelar'); }
export async function registrarAnotacoes(entrada: unknown, usuaria: string) { const input=z.object({faisca_id:s.id,texto:s.texto}).parse(entrada); await obterFaisca(input.faisca_id,usuaria); return operar(input.faisca_id,usuaria,'anotar',{texto:input.texto}); }
export async function concluirFaisca(entrada: unknown, usuaria: string) { const f=await obterFaisca(s.id.parse(entrada),usuaria); if(f.status!=='aceita') throw new ErroDominio('A Faísca precisa estar aceita.',409); const resumo=await gerarResumo({anotacoes:f.anotacoes}); return operar(f.id,usuaria,'concluir',{resumo,anotacoes:f.anotacoes}); }
export async function autorizarPublicacao(entrada: unknown, usuaria: string) { const f=await obterFaisca(s.id.parse(entrada),usuaria); return operar(f.id,usuaria,'autorizar'); }
export async function publicarComoDica(entrada: unknown, usuaria: string) {
 const f=await obterFaisca(s.id.parse(entrada),usuaria); validarPublicacao(f);
 const perguntas=await gerarQuiz(f.resumo!.rascunho_dica.corpo);
 const {data,error}=await getDb().rpc('publicar_faisca',{faisca_id:f.id,usuaria_id:s.id.parse(usuaria),perguntas}); verificarErro(error); return s.post.parse(data);
}
export async function reprocessarIntegracoes(entrada: unknown, usuaria: string) {
 const f=await obterFaisca(s.id.parse(entrada),usuaria);
 if(f.status!=='aceita' || !f.horario) throw new ErroDominio('A Faísca precisa estar aceita.',409);
 const perfis=await Promise.all([obterPerfil(f.solicitante_id),obterPerfil(f.convidada_id)]);
 const atualizacoes: {stream_channel_id?:string;daily_room_url?:string;pauta?:z.infer<typeof s.pauta>;integracao_erros:string[]}={integracao_erros:[]};
 await Promise.all([
  (async()=>{if(f.stream_channel_id) return; try { await Promise.all(perfis.map(sincronizarPerfil)); atualizacoes.stream_channel_id=await criarCanal({id:`faisca-${f.id}`,participantes:perfis.map(p=>p.id),criadora:f.solicitante_id}); } catch {atualizacoes.integracao_erros.push('Stream: falha ao criar canal.');}})(),
  (async()=>{if(f.daily_room_url) return; try {atualizacoes.daily_room_url=await criarSala({faisca_id:f.id,horario:f.horario});} catch {atualizacoes.integracao_erros.push('Daily: falha ao criar sala.');}})(),
  (async()=>{if(f.pauta) return; try {atualizacoes.pauta=await gerarPauta({perfis,tema:f.tema});} catch {atualizacoes.integracao_erros.push('IA: falha ao gerar pauta.');}})()
 ]);
 const {data,error}=await getDb().from('faiscas').update(atualizacoes).eq('id',f.id).select('*').single(); verificarErro(error); return s.faisca.parse(data);
}
export async function obterTokenVideo(entrada: unknown, usuaria: string) { const f=await obterFaisca(s.id.parse(entrada),usuaria); if(f.status!=='aceita' || !f.daily_room_url) throw new ErroDominio('Sala indisponível.',409); return z.object({url:z.url(),token:z.string()}).parse({url:f.daily_room_url,token:await tokenSala({faisca_id:f.id,profile_id:usuaria})}); }
