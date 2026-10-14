import { buscarMatch } from '@/lib/domain/match';
import { pedidos,uuid } from './fixtures';
import { exigirDemo } from '@/lib/config';
async function main(){exigirDemo();let acertos=0;let falhas=0;for(const p of pedidos){const inicio=Date.now();try{const matches=await buscarMatch(p.pedido,uuid(1));const acertou=matches.some(m=>m.profile_id===p.esperada);acertos+=Number(acertou);console.log(JSON.stringify({pedido:p.pedido,acertou,ms:Date.now()-inicio}));}catch{falhas++;console.log(JSON.stringify({pedido:p.pedido,erro:'Falha ou tempo limite',ms:Date.now()-inicio}));}await new Promise(resolve=>setTimeout(resolve,Number(process.env.AI_QUEUE_DELAY_MS ?? '4500')));}console.log(`Acerto: ${acertos}/10 (${acertos*10}%). Falhas de execução: ${falhas}.`);if(falhas)process.exitCode=1;}
main().catch(()=>{console.error('Avaliação indisponível. Verifique as integrações.');process.exitCode=1;});
