import { z } from 'zod';
import { getDb, verificarErro } from '@/lib/db/client';
import * as s from '@/lib/schemas/entities';
import { sugerirMensagens, sugerirAssunto } from '@/lib/ai/curadora';
import { ultimasMensagens } from '@/lib/integrations/stream';
import { obterFaisca } from './faisca';
import { ErroDominio } from './erros';
export async function sugerirMensagensFaisca(entrada: unknown, usuaria: string) {
 const f=await obterFaisca(s.id.parse(entrada),usuaria); if(!f.stream_channel_id) throw new ErroDominio('Canal indisponível.',409);
 // Mensagens existem somente na memória desta chamada e no Stream; nunca são persistidas nem geram saberes.
 return s.sugestoes.parse(await sugerirMensagens({tema:f.tema,mensagens:await ultimasMensagens(f.stream_channel_id,usuaria)}));
}
export async function sugerirAssuntoGrupo(entrada: unknown, usuaria: string) {
 const gid=s.id.parse(entrada); const u=s.id.parse(usuaria); const {data:ms,error}=await getDb().from('grupo_members').select('profile_id').eq('grupo_id',gid); verificarErro(error);
 if(!ms?.some(m=>m.profile_id===u)) throw new ErroDominio('Somente participantes podem pedir sugestões.',403);
 const {data:ps,error:pe}=await getDb().from('profiles').select('*').in('id',ms.map(m=>m.profile_id)); verificarErro(pe);
 return s.assuntos.parse(await sugerirAssunto({interesses:z.array(s.profile).parse(ps).map(p=>p.interesses)}));
}
