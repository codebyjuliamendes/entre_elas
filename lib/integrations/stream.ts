import { StreamChat } from 'stream-chat';
import { z } from 'zod';
import { variavel } from '@/lib/config';
import { profile, id } from '@/lib/schemas/entities';
let client: StreamChat | undefined;
function stream() { return client ??= StreamChat.getInstance(variavel('STREAM_API_KEY'),variavel('STREAM_API_SECRET')); }
export async function sincronizarPerfil(entrada: unknown): Promise<true> { const p=profile.parse(entrada); await stream().upsertUser({ id:p.id,name:p.nome,image:p.foto_url ?? undefined }); return z.literal(true).parse(true); }
export function gerarToken(usuaria: string): string { return z.string().min(1).parse(stream().createToken(id.parse(usuaria),Math.floor(Date.now()/1000)+3600)); }
export async function criarCanal(entrada: unknown): Promise<string> {
 const input=z.object({ id:z.string().regex(/^[a-z0-9_-]+$/),participantes:z.array(id).min(1),criadora:id }).parse(entrada);
 const canal=stream().channel('messaging',input.id,{members:input.participantes,created_by_id:input.criadora}); await canal.create(); return z.string().parse(canal.id);
}
export async function adicionarMembro(canal: string, usuaria: string) { await stream().channel('messaging',z.string().parse(canal)).addMembers([id.parse(usuaria)]); return z.literal(true).parse(true); }
export async function removerMembro(canal: string, usuaria: string) { await stream().channel('messaging',z.string().parse(canal)).removeMembers([id.parse(usuaria)]); return z.literal(true).parse(true); }
export async function ultimasMensagens(canal: string, usuaria: string) {
 const c=stream().channel('messaging',z.string().parse(canal)); const data=await c.query({messages:{limit:10}});
 if(!data.members.some(m=>m.user_id===id.parse(usuaria))) throw new Error('Usuária não participa do canal.');
 return z.array(z.string()).max(10).parse(data.messages.map(m=>m.text ?? ''));
}
