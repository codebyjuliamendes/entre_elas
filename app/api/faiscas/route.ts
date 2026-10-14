import { resposta, corpo } from '@/lib/api';
import { getCurrentUser } from '@/lib/auth/current-user';
import { listarFaiscas, criarFaisca } from '@/lib/domain/faisca';
export async function GET() { return resposta(async()=>listarFaiscas((await getCurrentUser()).id)); }
export async function POST(request: Request) { return resposta(async()=>{const u=await getCurrentUser();return criarFaisca({...await corpo(request),solicitante_id:u.id},u.id);}); }
