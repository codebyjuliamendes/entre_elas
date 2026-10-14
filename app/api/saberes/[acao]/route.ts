import { resposta,corpo,type RotaAcao } from '@/lib/api';
import { getCurrentUser } from '@/lib/auth/current-user';
import { confirmarSaber } from '@/lib/domain/saber';
import { id } from '@/lib/schemas/entities';
import { ErroDominio } from '@/lib/domain/erros';
export async function POST(request:Request,ctx:RotaAcao){return resposta(async()=>{const u=await getCurrentUser();const {acao}=await ctx.params;if(acao!=='confirmar')throw new ErroDominio('Operação não encontrada.',404);return confirmarSaber(id.parse((await corpo(request)).saber_id),u.id);});}
