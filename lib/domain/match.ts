import { z } from 'zod';
import * as s from '@/lib/schemas/entities';
import { interpretarPedido, buscarCandidatas, ranquear } from '@/lib/ai/curadora';
import { ErroIA } from './erros';
export async function buscarMatch(entrada: unknown, usuaria: string) {
 const pedido=s.texto.parse(entrada); const u=s.id.parse(usuaria); let timer:ReturnType<typeof setTimeout>|undefined;
 try { return s.indicacoes.parse(await Promise.race([
 (async()=>{const interpretado=await interpretarPedido(pedido);const candidatas=await buscarCandidatas({...interpretado,solicitante_id:u});return ranquear({pedido,candidatas,solicitante_id:u});})(),
 new Promise<never>((_,reject)=>{timer=setTimeout(()=>reject(new ErroIA('Busca excedeu o prazo de 9,5 segundos. Tente novamente para usar o cache.',408)),9500);})
 ])); } finally {clearTimeout(timer);}
}
export const buscarInput=z.object({pedido:s.texto});
