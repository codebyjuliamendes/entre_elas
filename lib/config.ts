import { z } from 'zod';
export function variavel(nome: string): string { const value = process.env[nome]; if (!value) throw new Error(`Variável ${nome} não configurada.`); return value; }
export function dimensaoEmbedding(): number { return z.coerce.number().int().positive().max(2000).parse(process.env.EMBEDDING_DIM ?? '768'); }
export function exigirDemo(): void { if (process.env.DEMO_MODE !== 'true') throw new Error('Operação disponível somente em modo demo.'); }
