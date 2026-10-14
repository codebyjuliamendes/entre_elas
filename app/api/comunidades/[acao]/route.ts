import { resposta,corpo,type RotaAcao } from '@/lib/api';
import { getCurrentUser } from '@/lib/auth/current-user';
import { entrarComunidade,sairComunidade,admitirMembro } from '@/lib/domain/comunidade';
import { id } from '@/lib/schemas/entities';
import { ErroDominio } from '@/lib/domain/erros';
export async function POST(request:Request,ctx:RotaAcao) {return resposta(async()=>{const u=await getCurrentUser();const input=await corpo(request);const {acao}=await ctx.params;if(acao==='admitir')return admitirMembro(input,u.id);const cid=id.parse(input.community_id);if(acao==='entrar')return entrarComunidade(cid,u.id);if(acao==='sair')return sairComunidade(cid,u.id);throw new ErroDominio('Operação não encontrada.',404);});}
