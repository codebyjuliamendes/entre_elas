import { processarPerfil,processarFila } from '@/lib/domain/saber';
import { listarPerfis } from '@/lib/domain/perfil';
import { exigirDemo } from '@/lib/config';
async function main(){
 exigirDemo();for(const p of await listarPerfis())await processarPerfil(p.id);
 const resultado=await processarFila();console.log(resultado);if(resultado.erros)process.exitCode=1;
}
main().catch(()=>{console.error('Falha ao processar saberes. Configure banco e Gemini e confira o modelo de embedding.');process.exitCode=1;});
