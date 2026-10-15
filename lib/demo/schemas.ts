import { z } from "zod";
import { leituraCuradoriaSchema } from "./curadoria";
import { fotoLocalSchema } from "./foto";
export const quizDemoSchema = z
  .array(
    z.object({
      pergunta: z.string().trim().min(1).max(500),
      alternativas: z.array(z.string().trim().min(1).max(300)).length(4),
      correta: z.number().int().min(0).max(3),
    }),
  )
  .length(3);
export const pedidoSchema = z
  .string()
  .trim()
  .min(5, "Conte um pouquinho mais: use pelo menos 5 caracteres.")
  .max(1500, "Use até 1.500 caracteres.");
export const matchSchema = z.object({
  perfil_sugerido_id: z.uuid(),
  motivo_conexao: z.string().min(10).max(1000),
  evidencia: z.string().min(10).max(1000),
});
export const pautaDemoSchema = z.array(z.string().min(5).max(500)).length(3);
export const dicaQuizSchema = z.object({
  titulo: z.string().min(5).max(160),
  dica: z.string().min(20).max(5000),
  saber_reconhecido: z.string().min(3).max(120),
  perguntas: quizDemoSchema,
});
export const fonteDemoSchema = z.enum(["ia", "demonstracao"]);
export const resultadoMatchSchema = matchSchema.extend({
  fonte: fonteDemoSchema,
  leitura: leituraCuradoriaSchema.nullable().default(null),
});
export const resultadoPautaSchema = z.object({
  perguntas: pautaDemoSchema,
  fonte: fonteDemoSchema,
});
export const resultadoDicaSchema = dicaQuizSchema.extend({
  trecho_aprendizado: z.string().min(10).max(3000).nullable().default(null),
  fonte: fonteDemoSchema,
});
export type MatchDemo = z.infer<typeof resultadoMatchSchema>;
export type DicaDemo = z.infer<typeof resultadoDicaSchema>;
export const stepSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
  z.literal(6),
]);
export type Step = z.infer<typeof stepSchema>;
export const jornadaSchema = z.object({
  convite_id: z.uuid().nullable().default(null),
  step: stepSchema,
  pedido: z.string().max(1500),
  match: resultadoMatchSchema.nullable(),
  pauta: resultadoPautaSchema.nullable(),
  aprendizado: z.string().max(3000),
  resultado: resultadoDicaSchema.nullable(),
  consentimento_ana: z.boolean(),
  consentimento_convidada: z.boolean(),
  horario: z.iso.datetime({ offset: true }).nullable(),
  inicio_chamada: z.number().finite().nonnegative().nullable(),
});
export const publicacaoDemoSchema = z.object({
  id: z.uuid(),
  perfil_id: z.uuid(),
  autora_id: z.uuid(),
  titulo: z.string().min(5).max(160),
  dica: z.string().min(20).max(5000),
  saber_reconhecido: z.string().min(3).max(120),
  perguntas: quizDemoSchema,
  created_at: z.iso.datetime(),
  consentimentos: z.array(z.uuid()).length(2),
  fonte: fonteDemoSchema,
});
export const mensagemDemoSchema = z.object({
  id: z.uuid(),
  canal: z.string(),
  texto: z.string().min(1).max(1000),
  autora: z.enum(["ana", "contato"]),
  created_at: z.iso.datetime(),
});
export const conviteDemoSchema = z.object({
  rascunho: jornadaSchema.nullable().default(null),
  id: z.uuid(),
  perfil_id: z.uuid(),
  tema: z.string(),
  horario: z.iso.datetime({ offset: true }),
  status: z.enum(["aceita", "realizada", "cancelada"]),
});
export const postComunidadeSchema = z.object({
  id: z.uuid(),
  comunidade_id: z.enum(["tecnologia", "lideranca", "campo", "bem-estar"]),
  autora_id: z.uuid(),
  titulo: z.string().trim().min(5).max(160),
  corpo: z.string().trim().min(10).max(5000),
  created_at: z.iso.datetime(),
});
export const comentarioDemoSchema = z.object({
  id: z.uuid(),
  post_id: z.uuid(),
  autora_id: z.uuid(),
  corpo: z.string().trim().min(1).max(1500),
  created_at: z.iso.datetime(),
});
export const estadoDemoSchema = z.object({
  versao: z.literal(2),
  posts: z.array(postComunidadeSchema).max(100).default([]),
  comentarios: z.array(comentarioDemoSchema).max(500).default([]),
  curtidas: z.array(z.string().max(100)).max(500).default([]),
  notificacoes_lidas: z.array(z.string().max(100)).max(500).default([]),
  jornada: jornadaSchema,
  publicacoes: z.array(publicacaoDemoSchema).max(50),
  convites: z.array(conviteDemoSchema).max(50),
  mensagens: z.array(mensagemDemoSchema).max(200),
  comunidades: z.array(z.string().max(100)).max(30),
  eventos: z.array(z.string().max(100)).max(200),
  salvos: z.array(z.string().max(200)).max(200),
  perfil: z.object({
    foto: fotoLocalSchema,
    bio: z.string().max(300),
    objetivos: z.array(z.string().trim().min(3).max(160)).max(5).default([]),
    saberes: z.array(z.string().min(1).max(80)).max(15),
  }),
});
export type EstadoDemo = z.infer<typeof estadoDemoSchema>;
export type JornadaDemo = z.infer<typeof jornadaSchema>;
