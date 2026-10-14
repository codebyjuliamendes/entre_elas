import { parseEnv } from 'node:util';
import { readFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
const [command,...args]=process.argv.slice(2);if(!command)throw new Error('Informe um comando.');
const local=parseEnv(readFileSync(new URL('../.env.local-db',import.meta.url),'utf8'));
if(local.NEXT_PUBLIC_SUPABASE_URL!=='http://127.0.0.1:54321')throw new Error('Configuração local inválida.');
const child=spawn(command,args,{stdio:'inherit',env:{...process.env,...local}});
child.on('exit',(code,signal)=>{if(signal)process.kill(process.pid,signal);else process.exitCode=code ?? 1;});
child.on('error',()=>{console.error('Falha ao iniciar comando local.');process.exitCode=1;});
