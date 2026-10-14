import { resposta, corpo } from '@/lib/api';
import { getCurrentUser } from '@/lib/auth/current-user';
import { listarComunidades, criarComunidade } from '@/lib/domain/comunidade';
export async function GET() {return resposta(async()=>listarComunidades((await getCurrentUser()).id));}
export async function POST(request:Request) {return resposta(async()=>criarComunidade(await corpo(request),(await getCurrentUser()).id));}
