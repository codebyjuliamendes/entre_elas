export function horarioDaDemo(dias: number): string {
  return new Date(Date.now() + (dias * 24 * 60 + 30) * 60000).toISOString();
}
