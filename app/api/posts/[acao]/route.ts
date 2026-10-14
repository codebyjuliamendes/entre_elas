import { resposta,corpo,type RotaAcao } from '@/lib/api';
import { getCurrentUser } from '@/lib/auth/current-user';
import * as c from '@/lib/domain/conteudo';
import { id } from '@/lib/schemas/entities';
import { ErroDominio } from '@/lib/domain/erros';
export async function POST(request:Request,ctx:RotaAcao) {return resposta(async()=>{const u=await getCurrentUser();const input=await corpo(request);const {acao}=await ctx.params;switch(acao){case 'obter':return c.obterPost(id.parse(input.post_id),u.id);case 'comentar':return c.comentar({...input,autora_id:u.id},u.id);case 'comentarios':return c.listarComentarios(id.parse(input.post_id),u.id);case 'reagir':return c.reagir({...input,profile_id:u.id},u.id);case 'quiz':return c.obterQuiz(id.parse(input.post_id),u.id);case 'responder-quiz':return c.responderQuiz(input,u.id);default:throw new ErroDominio('Operação não encontrada.',404);}});}
