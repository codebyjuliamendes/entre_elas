import { z } from 'zod';
import { getDb, verificarErro } from '@/lib/db/client';
import { id, profile, profileInput } from '@/lib/schemas/entities';
import { ErroDominio } from './erros';
export async function obterPerfil(profileId: string) {
 const {data,error}=await getDb().from('profiles').select('*').eq('id',id.parse(profileId)).maybeSingle(); verificarErro(error);
 if(!data) throw new ErroDominio('Perfil não encontrado.',404);
 return profile.parse(data);
}
export async function listarPerfis() { const {data,error}=await getDb().from('profiles').select('*').order('nome'); verificarErro(error); return z.array(profile).parse(data); }
export async function atualizarPerfil(usuaria: string, entrada: unknown) {
 const pid=id.parse(usuaria); const input=profileInput.parse(entrada);
 const {data,error}=await getDb().from('profiles').update(input).eq('id',pid).select('*').single(); verificarErro(error); return profile.parse(data);
}
