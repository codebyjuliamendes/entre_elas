import { z } from 'zod';
import { getDb, verificarErro } from '@/lib/db/client';
import * as s from '@/lib/schemas/entities';
import { verificarAcesso, listarComunidades } from './comunidade';
import { ErroDominio } from './erros';
import { corrigirQuiz } from './regras';
export async function obterPost(entrada: unknown, usuaria: string) {
 const {data,error}=await getDb().from('posts').select('*').eq('id',s.id.parse(entrada)).maybeSingle(); verificarErro(error);
 if(!data) throw new ErroDominio('Post não encontrado.',404); await verificarAcesso(data.community_id,usuaria); return s.post.parse(data);
}
export async function listarPosts(usuaria: string) {
 const u=s.id.parse(usuaria); const comunidades=await listarComunidades(u); const {data,error}=await getDb().from('posts').select('*').order('created_at',{ascending:false}); verificarErro(error);
 return z.array(s.post).parse(data?.filter(p=>!p.community_id || comunidades.some(c=>c.id===p.community_id)));
}
export async function criarPost(entrada: unknown, usuaria: string) {
 const input=s.postInput.parse(entrada); if(input.autora_id!==s.id.parse(usuaria) || input.origem_faisca_id) throw new ErroDominio('Autoria ou origem inválida.',403); await verificarAcesso(input.community_id,usuaria);
 const {data,error}=await getDb().from('posts').insert(input).select('*').single(); verificarErro(error); return s.post.parse(data);
}
export async function comentar(entrada: unknown, usuaria: string) {
 const input=s.commentInput.parse(entrada); if(input.autora_id!==s.id.parse(usuaria)) throw new ErroDominio('Autoria inválida.',403); await obterPost(input.post_id,usuaria);
 const {data,error}=await getDb().from('comments').insert(input).select('*').single(); verificarErro(error); return s.comment.parse(data);
}
export async function listarComentarios(entrada: unknown, usuaria: string) { const p=await obterPost(entrada,usuaria); const {data,error}=await getDb().from('comments').select('*').eq('post_id',p.id).order('created_at'); verificarErro(error); return z.array(s.comment).parse(data); }
export async function reagir(entrada: unknown, usuaria: string) {
 const input=s.reactionInput.parse(entrada); if(input.profile_id!==s.id.parse(usuaria)) throw new ErroDominio('Usuária inválida.',403); await obterPost(input.post_id,usuaria);
 const {data,error}=await getDb().from('reactions').upsert(input,{onConflict:'post_id,profile_id'}).select('*').single(); verificarErro(error); return s.reaction.parse(data);
}
export async function obterQuiz(entrada: unknown, usuaria: string) {
 const p=await obterPost(entrada,usuaria); const {data,error}=await getDb().from('quizzes').select('*').eq('post_id',p.id).maybeSingle(); verificarErro(error);
 if(!data) throw new ErroDominio('Quiz não encontrado.',404);
 const q=s.quiz.parse(data); return z.object({id:s.id,post_id:s.id,perguntas:z.array(s.pergunta.omit({correta:true})).length(3)}).parse({...q,perguntas:q.perguntas.map(({pergunta,alternativas})=>({pergunta,alternativas}))});
}
export async function responderQuiz(entrada: unknown, usuaria: string) {
 const input=z.object({quiz_id:s.id,respostas:z.array(z.number().int().min(0).max(3)).length(3)}).parse(entrada); const u=s.id.parse(usuaria);
 const {data:q,error:qe}=await getDb().from('quizzes').select('*').eq('id',input.quiz_id).single(); verificarErro(qe); const quiz=s.quiz.parse(q); await obterPost(quiz.post_id,u);
 const acertos=corrigirQuiz(quiz.perguntas,input.respostas);
 const {data,error}=await getDb().from('quiz_respostas').upsert({...input,profile_id:u,acertos},{onConflict:'quiz_id,profile_id'}).select('*').single(); verificarErro(error); return s.quizResposta.parse(data);
}
