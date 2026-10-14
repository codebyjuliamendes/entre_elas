import { resposta } from '@/lib/api';
import { getCurrentUser } from '@/lib/auth/current-user';
import { obterIndicadores } from '@/lib/domain/indicadores';
export async function GET(){return resposta(async()=>obterIndicadores((await getCurrentUser()).id));}
