import { resposta, corpo } from '@/lib/api';
import { getCurrentUser } from '@/lib/auth/current-user';
import { listarPosts, criarPost } from '@/lib/domain/conteudo';
export async function GET() {return resposta(async()=>listarPosts((await getCurrentUser()).id));}
export async function POST(request:Request) {return resposta(async()=>{const u=await getCurrentUser();return criarPost({...await corpo(request),autora_id:u.id},u.id);});}
