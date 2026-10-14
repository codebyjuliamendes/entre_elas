import { getDb, verificarErro } from '@/lib/db/client';
import { indicadores, profile, id } from '@/lib/schemas/entities';
import { z } from 'zod';
import { ErroDominio } from './erros';
export async function obterIndicadores(usuaria: string) {
 id.parse(usuaria); if(process.env.DEMO_MODE!=='true') throw new ErroDominio('Indicadores requerem autorização de liderança via SSO.',403);
 const db=getDb(); const [fs,ss,ps,perfis]=await Promise.all([db.from('faiscas').select('solicitante_id,convidada_id').eq('status','realizada'),db.from('saberes_publicos').select('saber'),db.from('posts').select('id,community_id').eq('tipo','dica'),db.from('profiles').select('*')]);
 for(const r of [fs,ss,ps,perfis]) verificarErro(r.error);
 const {data:cs,error:ce}=await db.from('communities').select('id,is_private');verificarErro(ce);
 const dicas=ps.data?.filter(p=>!p.community_id || cs?.some(c=>c.id===p.community_id&&!c.is_private)).length ?? 0;
 const pessoas=z.array(profile).parse(perfis.data); const regionais=new Map(pessoas.map(p=>[p.id,p.regional]));
 const cruzadas=fs.data?.filter(f=>regionais.get(f.solicitante_id)!==regionais.get(f.convidada_id)).length ?? 0;
 const contagens=new Map<string,number>(); for(const s of ss.data ?? []) if(s.saber)contagens.set(s.saber,(contagens.get(s.saber) ?? 0)+1);
 return indicadores.parse({faiscas_realizadas:fs.data?.length ?? 0,saberes_mapeados:ss.data?.length ?? 0,percentual_entre_regionais:fs.data?.length ? 100*cruzadas/fs.data.length:0,dicas_publicadas:dicas,saberes_frequentes:[...contagens].map(([saber,quantidade])=>({saber,quantidade})).sort((a,b)=>b.quantidade-a.quantidade).slice(0,10)});
}
