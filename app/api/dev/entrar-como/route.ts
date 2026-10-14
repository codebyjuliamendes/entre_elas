import { cookies } from 'next/headers';
import { resposta, corpo } from '@/lib/api';
import { assinarCookie } from '@/lib/auth/current-user';
import { obterPerfil } from '@/lib/domain/perfil';
import { id } from '@/lib/schemas/entities';
import { ErroDominio } from '@/lib/domain/erros';
export async function POST(request: Request) { return resposta(async()=>{
 if(process.env.DEMO_MODE!=='true') throw new ErroDominio('Modo demo desativado.',404);
 const input=await corpo(request); const p=await obterPerfil(id.parse(input.profile_id));
 (await cookies()).set('entre_elas_demo',assinarCookie(p.id),{httpOnly:true,sameSite:'strict',secure:new URL(request.url).protocol==='https:',path:'/',maxAge:86400});
 return {profile:p};
}); }
