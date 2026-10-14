import { resposta,corpo,type RotaAcao } from '@/lib/api';
import { getCurrentUser } from '@/lib/auth/current-user';
import { participarEvento,cancelarParticipacao } from '@/lib/domain/evento';
import { id } from '@/lib/schemas/entities';
import { ErroDominio } from '@/lib/domain/erros';
export async function POST(request:Request,ctx:RotaAcao){return resposta(async()=>{const u=await getCurrentUser();const input=await corpo(request);const {acao}=await ctx.params;const eid=id.parse(input.event_id);if(acao==='participar')return participarEvento(eid,u.id);if(acao==='cancelar')return cancelarParticipacao(eid,u.id);throw new ErroDominio('Operação não encontrada.',404);});}
