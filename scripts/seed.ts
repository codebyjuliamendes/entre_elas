import { pathToFileURL } from 'node:url';
import { getDb, verificarErro } from '@/lib/db/client';
import { exigirDemo } from '@/lib/config';
import { profiles,communities,posts,comments,events,uuid } from './fixtures';
export async function seed() {
 exigirDemo();const db=getDb();
 const {error:profilesError}=await db.from('profiles').upsert(profiles,{onConflict:'id',ignoreDuplicates:true});verificarErro(profilesError);
 const {error:communitiesError}=await db.from('communities').upsert(communities,{onConflict:'id',ignoreDuplicates:true});verificarErro(communitiesError);
 const membros=communities.flatMap(c=>profiles.filter(p=>!c.is_private || p.id===uuid(2) || posts.some(post=>post.community_id===c.id&&post.autora_id===p.id)).map(p=>({community_id:c.id,profile_id:p.id,papel:p.id===uuid(2)?'moderadora' as const:'membro' as const})));
 const {error:me}=await db.from('community_members').upsert(membros,{onConflict:'community_id,profile_id',ignoreDuplicates:true});verificarErro(me);
 const {error:postsError}=await db.from('posts').upsert(posts,{onConflict:'id',ignoreDuplicates:true});verificarErro(postsError);
 const {error:commentsError}=await db.from('comments').upsert(comments,{onConflict:'id',ignoreDuplicates:true});verificarErro(commentsError);
 const {error:eventsError}=await db.from('events').upsert(events,{onConflict:'id',ignoreDuplicates:true});verificarErro(eventsError);
 console.log('Seed fictício: 12 perfis, 4 comunidades, 15 posts, 15 comentários e 5 eventos.');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)seed().catch(()=>{console.error('Falha no seed. Verifique Supabase, migrations e DEMO_MODE.');process.exitCode=1;});
