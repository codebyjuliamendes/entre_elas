import { resposta,corpo } from '@/lib/api';
import { getCurrentUser } from '@/lib/auth/current-user';
import { listarEventos,criarEvento } from '@/lib/domain/evento';
export async function GET(){return resposta(async()=>listarEventos((await getCurrentUser()).id));}
export async function POST(request:Request){return resposta(async()=>criarEvento(await corpo(request),(await getCurrentUser()).id));}
