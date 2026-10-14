import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db/client';
export const dynamic='force-dynamic';
export async function GET() {
 try { const {error}=await getDb().from('profiles').select('id').limit(1); if(error) throw error; return NextResponse.json({status:'ok',banco:'conectado'}); }
 catch { return NextResponse.json({status:'erro',banco:'indisponivel'},{status:503}); }
}
