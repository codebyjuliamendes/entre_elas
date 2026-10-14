import { resposta,corpo,type RotaAcao } from '@/lib/api';
import { getCurrentUser } from '@/lib/auth/current-user';
import * as g from '@/lib/domain/grupo';
import { id } from '@/lib/schemas/entities';
import { ErroDominio } from '@/lib/domain/erros';
export async function POST(request:Request,ctx:RotaAcao){return resposta(async()=>{const u=await getCurrentUser();const input=await corpo(request);const {acao}=await ctx.params;if(acao==='convidar')return g.convidarGrupo(input,u.id);const gid=id.parse(input.grupo_id);if(acao==='entrar')return g.entrarNoGrupo(gid,u.id);if(acao==='sair')return g.sairDoGrupo(gid,u.id);if(acao==='reprocessar')return g.reprocessarGrupo(gid,u.id);throw new ErroDominio('Operação não encontrada.',404);});}
