import { z } from 'zod';
import { faisca, id, quizPerguntas, type Faisca } from '@/lib/schemas/entities';
import { ErroDominio } from './erros';
export function exigirParticipante(entrada: Faisca, usuaria: string): true {
 const f = faisca.parse(entrada); const u = id.parse(usuaria);
 if(u !== f.solicitante_id && u !== f.convidada_id) throw new ErroDominio('Somente participantes podem realizar esta operação.',403);
 return z.literal(true).parse(true);
}
export function validarRespostaConvite(entrada: Faisca, usuaria: string, horario?: string): true {
 const f = faisca.parse(entrada); const u = id.parse(usuaria);
 if(u !== f.convidada_id) throw new ErroDominio('Somente a convidada pode aceitar ou recusar.',403);
 if(f.status !== 'pendente') throw new ErroDominio('A Faísca não está pendente.',409);
 if(horario !== undefined && !f.horarios_propostos.some(h=>Date.parse(h)===Date.parse(z.iso.datetime({offset:true}).parse(horario)))) throw new ErroDominio('O horário não está entre os propostos.');
 return z.literal(true).parse(true);
}
export function validarPublicacao(entrada: Faisca): true {
 const f = faisca.parse(entrada);
 if(f.status !== 'realizada' || !f.resumo) throw new ErroDominio('A Faísca precisa estar concluída.',409);
 if(![f.solicitante_id,f.convidada_id].every(u=>f.publicacao_autorizada_por.includes(u))) throw new ErroDominio('As duas participantes precisam autorizar a publicação.',403);
 return z.literal(true).parse(true);
}
export function corrigirQuiz(perguntas: unknown, respostas: unknown): number {
 const p=quizPerguntas.parse(perguntas); const r=z.array(z.number().int().min(0).max(3)).length(3).parse(respostas);
 return z.number().int().min(0).max(3).parse(p.reduce((total,q,i)=>total+Number(q.correta===r[i]),0));
}
