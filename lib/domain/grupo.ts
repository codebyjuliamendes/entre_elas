import { z } from 'zod';
import { getDb, verificarErro } from '@/lib/db/client';
import * as s from '@/lib/schemas/entities';
import { obterPerfil } from './perfil';
import { sincronizarPerfil, criarCanal, adicionarMembro, removerMembro } from '@/lib/integrations/stream';
import { ErroDominio } from './erros';
export async function listarGrupos(usuaria: string) {
 const u=s.id.parse(usuaria); const {data:ms,error:me}=await getDb().from('grupo_members').select('grupo_id').eq('profile_id',u); verificarErro(me);
 const {data,error}=await getDb().from('grupos').select('*'); verificarErro(error); return z.array(s.grupo).parse(data?.filter(g=>!g.is_private || ms?.some(m=>m.grupo_id===g.id)));
}
export async function criarGrupo(entrada: unknown, usuaria: string) {
 const input=s.grupoInput.parse(entrada); const u=s.id.parse(usuaria); if(input.criado_por!==u) throw new ErroDominio('Criadora inválida.',403);
 const {data,error}=await getDb().from('grupos').insert(input).select('*').single(); verificarErro(error); const g=s.grupo.parse(data);
 const {error:me}=await getDb().from('grupo_members').insert({grupo_id:g.id,profile_id:u}); verificarErro(me);
 return reprocessarGrupo(g.id,u);
}
export async function reprocessarGrupo(entrada: unknown, usuaria: string) {
 const gid=s.id.parse(entrada); const u=s.id.parse(usuaria);
 const {data,error}=await getDb().from('grupos').select('*').eq('id',gid).single(); verificarErro(error); const g=s.grupo.parse(data);
 if(g.criado_por!==u) throw new ErroDominio('Somente a criadora pode reprocessar o grupo.',403);
 await sincronizarPerfil(await obterPerfil(u)); const canal=await criarCanal({id:`grupo-${g.id}`,participantes:[u],criadora:u});
 const {data:updated,error:ue}=await getDb().from('grupos').update({stream_channel_id:canal}).eq('id',gid).select('*').single(); verificarErro(ue); return s.grupo.parse(updated);
}
export async function entrarNoGrupo(entrada: unknown, usuaria: string) {
 const gid=s.id.parse(entrada); const u=s.id.parse(usuaria);
 const {data,error}=await getDb().from('grupos').select('*').eq('id',gid).single(); verificarErro(error); const g=s.grupo.parse(data);
 const {data:m,error:me}=await getDb().from('grupo_members').select('id').eq('grupo_id',gid).eq('profile_id',u).maybeSingle(); verificarErro(me);
 if(g.is_private && !m) throw new ErroDominio('Grupo privado: é necessário convite.',403);
 if(!g.stream_channel_id) throw new ErroDominio('Canal ainda não disponível.',409);
 await sincronizarPerfil(await obterPerfil(u)); await adicionarMembro(g.stream_channel_id,u);
 const {data:member,error:ie}=await getDb().from('grupo_members').upsert({grupo_id:gid,profile_id:u},{onConflict:'grupo_id,profile_id'}).select('*').single(); verificarErro(ie); return s.grupoMember.parse(member);
}
export async function convidarGrupo(entrada: unknown, usuaria: string) { const input=z.object({grupo_id:s.id,profile_id:s.id}).parse(entrada); const {data:g,error}=await getDb().from('grupos').select('criado_por').eq('id',input.grupo_id).single(); verificarErro(error); if(g?.criado_por!==s.id.parse(usuaria)) throw new ErroDominio('Somente a criadora pode convidar.',403); const {data,error:ie}=await getDb().from('grupo_members').upsert(input,{onConflict:'grupo_id,profile_id'}).select('*').single(); verificarErro(ie); return s.grupoMember.parse(data); }
export async function sairDoGrupo(entrada: unknown, usuaria: string) { const gid=s.id.parse(entrada); const u=s.id.parse(usuaria); const {data:g,error}=await getDb().from('grupos').select('stream_channel_id').eq('id',gid).single(); verificarErro(error); if(g?.stream_channel_id) await removerMembro(g.stream_channel_id,u); const {error:de}=await getDb().from('grupo_members').delete().eq('grupo_id',gid).eq('profile_id',u); verificarErro(de); return z.literal(true).parse(true); }
