import { describe, it, expect } from "vitest";
import { cleanAndAlternateHistory } from "../gemini.adapter.js";

describe("Gemini Adapter Helper: cleanAndAlternateHistory", () => {
  it("should return empty if history is empty", () => {
    const result = cleanAndAlternateHistory([]);
    expect(result).toEqual([]);
  });

  it("should merge contiguous user messages by appending text with a newline", () => {
    const history = [
      { role: "user", text: "Hola" },
      { role: "user", text: "Me interesa una bujía" },
      { role: "model", text: "¡Épale pana! Claro, sí tenemos." },
    ];

    const result = cleanAndAlternateHistory(history);
    expect(result).toEqual([
      { role: "user", text: "Hola\nMe interesa una bujía" },
      { role: "model", text: "¡Épale pana! Claro, sí tenemos." },
    ]);
  });

  it("should merge contiguous model messages by appending text with a newline", () => {
    const history = [
      { role: "user", text: "Hola" },
      { role: "model", text: "¡Épale!" },
      { role: "model", text: "¿En qué te puedo ayudar hoy?" },
    ];

    const result = cleanAndAlternateHistory(history);
    expect(result).toEqual([
      { role: "user", text: "Hola" },
      { role: "model", text: "¡Épale!\n¿En qué te puedo ayudar hoy?" },
    ]);
  });

  it("should drop leading model messages, ensuring the first message is 'user'", () => {
    const history = [
      { role: "model", text: "Mensaje perdido..." },
      { role: "user", text: "Buen día pana" },
      { role: "model", text: "Épale pana, buen día." },
    ];

    const result = cleanAndAlternateHistory(history);
    expect(result).toEqual([
      { role: "user", text: "Buen día pana" },
      { role: "model", text: "Épale pana, buen día." },
    ]);
  });

  it("should return empty if there are only model messages (no user message found)", () => {
    const history = [
      { role: "model", text: "Hola" },
      { role: "model", text: "Prueba" },
    ];

    const result = cleanAndAlternateHistory(history);
    expect(result).toEqual([]);
  });

  it("should handle alternating messages without changing them", () => {
    const history = [
      { role: "user", text: "Hola" },
      { role: "model", text: "Hola, pana" },
      { role: "user", text: "Tienes pastillas de freno?" },
      { role: "model", text: "Sí, de carbono y cerámicas." },
    ];

    const result = cleanAndAlternateHistory(history);
    expect(result).toEqual(history);
  });
});
