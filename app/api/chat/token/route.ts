import { resposta } from '@/lib/api';
import { getCurrentUser } from '@/lib/auth/current-user';
import { sincronizarPerfil,gerarToken } from '@/lib/integrations/stream';
export async function GET(){return resposta(async()=>{const u=await getCurrentUser();await sincronizarPerfil(u);return {token:gerarToken(u.id),api_key:process.env.STREAM_API_KEY};});}
