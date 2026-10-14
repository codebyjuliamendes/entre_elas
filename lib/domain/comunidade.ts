import { z } from 'zod';
import { getDb, verificarErro } from '@/lib/db/client';
import * as s from '@/lib/schemas/entities';
import { ErroDominio } from './erros';
export async function verificarAcesso(comunidadeId: string | null, usuaria: string) {
 const cid=s.id.nullable().parse(comunidadeId); const u=s.id.parse(usuaria);
 if(!cid) return z.literal(true).parse(true);
 const {data:c,error}=await getDb().from('communities').select('*').eq('id',cid).maybeSingle(); verificarErro(error);
 if(!c) throw new ErroDominio('Comunidade não encontrada.',404);
 if(c.is_private) { const {data:m,error}=await getDb().from('community_members').select('id').eq('community_id',cid).eq('profile_id',u).maybeSingle(); verificarErro(error); if(!m) throw new ErroDominio('Comunidade privada: acesso restrito a membros.',403); }
 return z.literal(true).parse(true);
}
export async function listarComunidades(usuaria: string) {
 const u=s.id.parse(usuaria); const db=getDb();
 const {data:members,error:me}=await db.from('community_members').select('community_id').eq('profile_id',u); verificarErro(me);
 const {data,error}=await db.from('communities').select('*'); verificarErro(error);
 return z.array(s.community).parse(data?.filter(c=>!c.is_private || members?.some(m=>m.community_id===c.id)));
}
export async function criarComunidade(entrada: unknown, usuaria: string) {
 const input=s.communityInput.parse(entrada); const {data,error}=await getDb().rpc('criar_comunidade',{dados:input,usuaria_id:s.id.parse(usuaria)}); verificarErro(error); return s.community.parse(data);
}
export async function entrarComunidade(entrada: unknown, usuaria: string) {
 const cid=s.id.parse(entrada); const u=s.id.parse(usuaria); await verificarAcesso(cid,u);
 const {data,error}=await getDb().from('community_members').upsert({community_id:cid,profile_id:u},{onConflict:'community_id,profile_id',ignoreDuplicates:true}).select('*').maybeSingle(); verificarErro(error);
 if(data) return s.member.parse(data);
 const {data:m,error:me}=await getDb().from('community_members').select('*').eq('community_id',cid).eq('profile_id',u).single(); verificarErro(me); return s.member.parse(m);
}
export async function sairComunidade(entrada: unknown, usuaria: string) {
 const {error}=await getDb().from('community_members').delete().eq('community_id',s.id.parse(entrada)).eq('profile_id',s.id.parse(usuaria)); verificarErro(error); return z.literal(true).parse(true);
}
export async function admitirMembro(entrada: unknown, usuaria: string) {
 const input=z.object({community_id:s.id,profile_id:s.id}).parse(entrada); const u=s.id.parse(usuaria);
 const {data:m,error:me}=await getDb().from('community_members').select('papel').eq('community_id',input.community_id).eq('profile_id',u).maybeSingle(); verificarErro(me);
 if(m?.papel!=='moderadora') throw new ErroDominio('Somente moderadoras podem admitir membros.',403);
 const {data,error}=await getDb().from('community_members').upsert({...input,papel:'membro'},{onConflict:'community_id,profile_id',ignoreDuplicates:true}).select('*').maybeSingle(); verificarErro(error);
 if(data) return s.member.parse(data);
 const {data:existing,error:ee}=await getDb().from('community_members').select('*').eq('community_id',input.community_id).eq('profile_id',input.profile_id).single(); verificarErro(ee); return s.member.parse(existing);
}
