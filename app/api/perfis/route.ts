import { resposta, corpo } from '@/lib/api';
import { getCurrentUser } from '@/lib/auth/current-user';
import { listarPerfis, atualizarPerfil } from '@/lib/domain/perfil';
export async function GET() { return resposta(async()=>{await getCurrentUser();return listarPerfis();}); }
export async function PATCH(request: Request) { return resposta(async()=>{const u=await getCurrentUser();return atualizarPerfil(u.id,await corpo(request));}); }
