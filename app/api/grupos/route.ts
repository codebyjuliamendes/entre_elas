import { resposta,corpo } from '@/lib/api';
import { getCurrentUser } from '@/lib/auth/current-user';
import { listarGrupos,criarGrupo } from '@/lib/domain/grupo';
export async function GET(){return resposta(async()=>listarGrupos((await getCurrentUser()).id));}
export async function POST(request:Request){return resposta(async()=>{const u=await getCurrentUser();return criarGrupo({...await corpo(request),criado_por:u.id},u.id);});}
