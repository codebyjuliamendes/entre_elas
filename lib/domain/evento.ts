import { z } from 'zod';
import { getDb, verificarErro } from '@/lib/db/client';
import * as s from '@/lib/schemas/entities';
import { verificarAcesso, listarComunidades } from './comunidade';
import { ErroDominio } from './erros';
export async function listarEventos(usuaria: string) { const cs=await listarComunidades(s.id.parse(usuaria)); const {data,error}=await getDb().from('events').select('*').order('inicio'); verificarErro(error); return z.array(s.event).parse(data?.filter(e=>!e.community_id || cs.some(c=>c.id===e.community_id))); }
export async function criarEvento(entrada: unknown, usuaria: string) { const input=s.eventInput.parse(entrada); await verificarAcesso(input.community_id,s.id.parse(usuaria)); const {data,error}=await getDb().from('events').insert(input).select('*').single(); verificarErro(error); return s.event.parse(data); }
export async function participarEvento(entrada: unknown, usuaria: string) {
 const eid=s.id.parse(entrada); const u=s.id.parse(usuaria); const {data:e,error:ee}=await getDb().from('events').select('*').eq('id',eid).maybeSingle(); verificarErro(ee); if(!e) throw new ErroDominio('Evento não encontrado.',404); await verificarAcesso(e.community_id,u);
 const {data,error}=await getDb().from('event_participantes').upsert({event_id:eid,profile_id:u},{onConflict:'event_id,profile_id'}).select('*').single(); verificarErro(error); return s.eventParticipante.parse(data);
}
export async function cancelarParticipacao(entrada: unknown, usuaria: string) { const {error}=await getDb().from('event_participantes').delete().eq('event_id',s.id.parse(entrada)).eq('profile_id',s.id.parse(usuaria)); verificarErro(error); return z.literal(true).parse(true); }
