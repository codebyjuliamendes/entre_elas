import { resposta } from '@/lib/api';
import { getCurrentUser } from '@/lib/auth/current-user';
import { listarSaberes } from '@/lib/domain/saber';
export async function GET(){return resposta(async()=>listarSaberes((await getCurrentUser()).id));}
