import { describe, expect, it } from "vitest";
import {
  calcularDisponibilidade,
  descreverDisponibilidade,
} from "@/lib/domain/disponibilidade";
describe("Abro Faíscas: disponibilidade para convites", () => {
  it("abre vagas até o limite escolhido pela pessoa", () => {
    expect(calcularDisponibilidade(4, 1)).toEqual({ estado: "aberta", limite: 4, vagas: 3 });
    expect(descreverDisponibilidade(calcularDisponibilidade(2, 1))).toBe("1 vaga neste mês");
  });
  it("fecha quando o limite foi atingido, sem vagas negativas", () => {
    expect(calcularDisponibilidade(2, 5)).toEqual({ estado: "sem_vagas", limite: 2, vagas: 0 });
  });
  it("zero significa pausa, independentemente dos convites recebidos", () => {
    expect(calcularDisponibilidade(0, 0).estado).toBe("pausada");
  });
  it("recusa limites fora da faixa permitida", () => {
    expect(() => calcularDisponibilidade(21, 0)).toThrow();
    expect(() => calcularDisponibilidade(-1, 0)).toThrow();
  });
});
