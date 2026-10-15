import { z } from "zod";
import { quizPerguntas } from "@/lib/schemas/entities";
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
  perguntas: quizPerguntas,
});
export const fonteDemoSchema = z.enum(["ia", "demonstracao"]);
export const resultadoMatchSchema = matchSchema.extend({
  fonte: fonteDemoSchema,
});
export const resultadoPautaSchema = z.object({
  perguntas: pautaDemoSchema,
  fonte: fonteDemoSchema,
});
export const resultadoDicaSchema = dicaQuizSchema.extend({
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
  step: stepSchema,
  pedido: z.string().max(1500),
  match: resultadoMatchSchema.nullable(),
  pauta: resultadoPautaSchema.nullable(),
  aprendizado: z.string().max(3000),
  resultado: resultadoDicaSchema.nullable(),
  consentimento_ana: z.boolean(),
  consentimento_convidada: z.boolean(),
  horario: z.string().nullable(),
  inicio_chamada: z.number().nullable(),
});
export const publicacaoDemoSchema = z.object({
  id: z.uuid(),
  perfil_id: z.uuid(),
  autora_id: z.uuid(),
  titulo: z.string(),
  dica: z.string(),
  saber_reconhecido: z.string(),
  perguntas: quizPerguntas,
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
  id: z.uuid(),
  perfil_id: z.uuid(),
  tema: z.string(),
  horario: z.string(),
  status: z.enum(["aceita", "realizada", "cancelada"]),
});
export const estadoDemoSchema = z.object({
  versao: z.literal(1),
  jornada: jornadaSchema,
  publicacoes: z.array(publicacaoDemoSchema).max(50),
  convites: z.array(conviteDemoSchema).max(50),
  mensagens: z.array(mensagemDemoSchema).max(200),
  comunidades: z.array(z.string()),
  eventos: z.array(z.string()),
  salvos: z.array(z.string()),
  perfil: z.object({
    bio: z.string().max(300),
    saberes: z.array(z.string().min(1).max(80)).max(15),
  }),
});
export type EstadoDemo = z.infer<typeof estadoDemoSchema>;
export type JornadaDemo = z.infer<typeof jornadaSchema>;
