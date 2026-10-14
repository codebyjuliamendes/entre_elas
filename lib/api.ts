import { NextResponse } from 'next/server';
import { z } from 'zod';
import { ErroDominio, ErroIA } from '@/lib/domain/erros';
export async function resposta(acao: () => Promise<unknown>) {
 try { return NextResponse.json(await acao()); }
 catch(error) {
  if(error instanceof z.ZodError) return NextResponse.json({erro:'Dados inválidos.',detalhes:error.issues.map(i=>({campo:i.path.join('.'),mensagem:i.message}))},{status:400});
  if(error instanceof ErroDominio) return NextResponse.json({erro:error.message},{status:error.status});
  if(error instanceof ErroIA) return NextResponse.json({erro:error.message},{status:error.status===408?504:502});
  return NextResponse.json({erro:'Operação indisponível. Verifique as integrações e a configuração do servidor.'},{status:503});
 }
}
export async function corpo(request: Request): Promise<Record<string,unknown>> {
 const origem=request.headers.get('origin');
 if(origem && origem!==new URL(request.url).origin) throw new ErroDominio('Origem da requisição não permitida.',403);
 if(Number(request.headers.get('content-length') ?? '0')>100000) throw new ErroDominio('Requisição muito grande.',413);
 try { return z.record(z.string(),z.unknown()).parse(await request.json()); } catch { throw new ErroDominio('Corpo JSON inválido.'); }
}
export type RotaAcao = {params:Promise<{acao:string}>};
