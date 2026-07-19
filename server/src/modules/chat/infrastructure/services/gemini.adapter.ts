import mongoose from "mongoose";
import { Result } from "../../../../../../shared-domain/src/shared/result.js";
import { DomainError } from "../../../../../../shared-domain/src/shared/errors.js";
import { ILlmAdapter, IExtractedData } from "../../application/use-cases/process-incoming-message.use-case.js";
import { CalculateDeliveryFee } from "../../application/use-cases/calculate-delivery-fee.use-case.js";
import { CreateClient } from "../../../client/application/use-cases/create-client.js";
import { CreateOrder } from "../../../order/application/use-cases/create-order.js";
import { LogUnsatisfiedDemand } from "../../application/use-cases/log-unsatisfied-demand.use-case.js";
import { IAgentRepository } from "../../application/repositories/agent.repository.js";
import { ChatSettingsModel } from "../chat-settings.model.js";
import { cleanAndAlternateHistory } from "./gemini.utils.js";
import {
  GEMINI_SYSTEM_PROMPT,
  GEMINI_JSON_FORMAT_PROMPT,
  GEMINI_CONVERSATIONAL_RULES_PROMPT,
} from "./gemini.prompts.js";
import { buildToolDeclarations, dispatchToolCall } from "./gemini.tool-dispatcher.js";
import { GeminiConstants } from "./gemini.constants.js";

export { cleanAndAlternateHistory } from "./gemini.utils.js";

export const makeGeminiLlmAdapter = (dependencies: {
  calculateDeliveryFee: CalculateDeliveryFee;
  createClient: CreateClient;
  createOrder: CreateOrder;
  logUnsatisfiedDemand: LogUnsatisfiedDemand;
  agentRepository: IAgentRepository;
}): ILlmAdapter => {
  const apiKey = process.env.GEMINI_API_KEY || "";
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const getDefaultSellerId = async (whatsappId: string): Promise<string> => {
    const ChatSession = mongoose.model("ChatSession");
    const session = await ChatSession.findOne({ whatsappId }).exec();
    if (session?.assignedUserId) {
      return session.assignedUserId.toString();
    }
    const User = mongoose.model("User");
    let user = await User.findOne({ user: "admin" }).exec();
    if (!user) {
      user = await User.findOne().exec();
    }
    return user?._id.toString() || "00000000-0000-0000-0000-000000000000";
  };

  return {
    generateResponse: async (
      from: string,
      text: string,
      history: Array<{ role: string; text: string }> = [],
      options?: {
        isFromCrm?: boolean;
        isOutOfHours?: boolean;
        systemPrompt?: string;
        enabledTools?: string[];
        historicalSummary?: string | null;
      }
    ): Promise<Result<{ reply: string; isDrift: boolean; extractedData?: IExtractedData | null }, DomainError>> => {
      if (!apiKey) {
        return Result.ok({
          reply: "System notice: WhatsApp Bot is active. (API key is not configured)",
          isDrift: false,
        });
      }

      try {
        const settings = await ChatSettingsModel.findOne().exec();
        const bank = settings?.pagoMovilBank || "Banesco";
        const phone = settings?.pagoMovilPhone || "04121234567";
        const idVal = settings?.pagoMovilId || "V-12345678";
        const baseSystemPrompt = options?.systemPrompt || settings?.systemPrompt || GEMINI_SYSTEM_PROMPT;

        const summaryPrepend = options?.historicalSummary
          ? `==================================================
CONTEXTO DE CONVERSACIONES ANTERIORES (RESUMEN HISTÓRICO DE ESTE CLIENTE):
${options.historicalSummary}
==================================================\n\n`
          : "";

        const dynamicSystemPrompt = `${summaryPrepend}${baseSystemPrompt}

${GEMINI_JSON_FORMAT_PROMPT}

${GEMINI_CONVERSATIONAL_RULES_PROMPT}

IMPORTANT: Datos de Pago Móvil vigentes para confirmación de compra:
- Banco: ${bank}
- Teléfono: ${phone}
- Cédula/RIF: ${idVal}

${
  options?.isFromCrm
    ? `
EXCLUSIVO PARA USO INTERNO DESDE EL CRM:
Has sido consultado por un operador del CRM. Tienes habilitada la herramienta "queryMongoDB" para realizar consultas analíticas o de lectura directamente sobre la base de datos de MongoDB.
Úsala para responder preguntas como volumen de ventas, productos de baja rotación, mejores clientes, etc.
Tu respuesta en este caso debe centrarse en responder la consulta del operador del CRM de forma ejecutiva.`
    : ""
}

${
  options?.isOutOfHours
    ? `
👉 ATENCIÓN: El negocio está actualmente CERRADO (Fuera de Horario de Atención).
- Debes saludar cordialmente y responder consultas sobre disponibilidad, stock, o precios de repuestos usando "searchStock" y costos de entrega usando "calculateDeliveryFee" normalmente.
- Informa de manera amigable y asertiva que los operadores humanos se encuentran fuera de su jornada y revisarán confirmaciones de pedidos, pagos o trámites administrativos a primera hora del siguiente día hábil.
- Amigablemente establece la expectativa de que el procesamiento del pedido y despacho se realizarán en el siguiente turno comercial (lunes a domingo de 10:00 am a 6:00 pm, hora de Caracas).
- NO ofrezcas confirmar compras inmediatas ni realices promesas de despacho para el mismo día. Mantén un tono sumamente servicial, empático y profesional.`
    : ""
}`;

        const systemInstruction = {
          parts: [{ text: dynamicSystemPrompt }],
        };

        const declarations = buildToolDeclarations(options?.isFromCrm);

        let filteredDeclarations = declarations;
        if (options?.enabledTools) {
          filteredDeclarations = declarations.filter((d) =>
            options.enabledTools!.includes(d.name as string) || (d.name === "queryMongoDB" && options.isFromCrm)
          );
        }

        const tools = filteredDeclarations.length > 0 ? [{ functionDeclarations: filteredDeclarations }] : undefined;

        const fullHistory = history.map((h: { role: string; text: string }) => ({
          role: h.role === "user" ? "user" : "model",
          text: h.text,
        }));
        fullHistory.push({
          role: "user",
          text: text,
        });

        const cleanedHistory = cleanAndAlternateHistory(fullHistory);

        const contents: Array<Record<string, unknown>> = cleanedHistory.map((h: { role: string; text: string }) => ({
          role: h.role,
          parts: [{ text: h.text }],
        }));

        const makeRequest = async (currentContents: Array<Record<string, unknown>>): Promise<Record<string, unknown>> => {
            const requestBody: Record<string, unknown> = {
              contents: currentContents,
              systemInstruction,
            };
            if (tools) {
              requestBody.tools = tools;
            }

            const response = await fetch(apiUrl, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(requestBody),
            });

          if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Gemini API error: ${response.status} - ${errText}`);
          }

          return response.json() as Promise<Record<string, unknown>>;
        };

        let resultJson = await makeRequest(contents);

        const candidates = resultJson.candidates as Array<{ content?: { parts?: Array<{ functionCall?: { name: string; args: Record<string, unknown> } }> } }> | undefined;
        const candidate = candidates?.[0];
        const parts = candidate?.content?.parts || [];
        const functionCallPart = parts.find((p) => p.functionCall);

        if (functionCallPart && functionCallPart.functionCall) {
          const { name, args } = functionCallPart.functionCall;

          const toolResult = await dispatchToolCall(
            name,
            args,
            from,
            {
              calculateDeliveryFee: dependencies.calculateDeliveryFee,
              createClient: dependencies.createClient,
              createOrder: dependencies.createOrder,
              logUnsatisfiedDemand: dependencies.logUnsatisfiedDemand,
              getDefaultSellerId,
            },
            { isFromCrm: options?.isFromCrm },
          );

          contents.push({
            role: "model",
            parts: [
              {
                functionCall: {
                  name,
                  args,
                },
              },
            ],
          });

          contents.push({
            role: "function",
            parts: [
              {
                functionResponse: {
                  name,
                  response: toolResult,
                },
              },
            ],
          });

          resultJson = await makeRequest(contents);
        }

        const finalCandidates = resultJson.candidates as Array<{ content?: { parts?: Array<{ text?: string }> } }> | undefined;
        const finalCandidate = finalCandidates?.[0];
        const finalParts = finalCandidate?.content?.parts || [];
        const textPart = finalParts.find((p) => p.text);

        if (!textPart || !textPart.text) {
          return Result.fail(
            new DomainError("Gemini returned empty or invalid response parts")
          );
        }

        const rawText = textPart.text.trim();
        const sanitized = rawText
          .replace(/^```json\s*/i, "")
          .replace(/```$/, "")
          .trim();

        try {
          const parsed = JSON.parse(sanitized);
          return Result.ok({
            reply: parsed.reply || "",
            isDrift: !!parsed.isDrift,
            extractedData: parsed.extractedData || null,
          });
        } catch (jsonErr) {
          return Result.ok({
            reply: rawText,
            isDrift: false,
            extractedData: null,
          });
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        return Result.fail(
          new DomainError(`Gemini service failed: ${message}`)
        );
      }
    },

    compactMemory: async (
      previousSummary: string | null | undefined,
      historyText: string
    ): Promise<Result<string, DomainError>> => {
      if (!apiKey) {
        return Result.fail(new DomainError("Gemini API key is not configured"));
      }

      try {
        const compactionPrompt = `Eres un agente compactador de memoria de Repuestos Caracas. Tu tarea es consolidar y actualizar el resumen de la conversación entre el asistente virtual (Repuestos Caracas) y el cliente de forma asertiva.
Recibirás el resumen anterior (si existe) y el texto de las últimas conversaciones cronológicas.

 Debes generar un NUEVO resumen consolidado que:
1. Incluya los puntos clave, acuerdos, información del cliente extraída y pedidos previos.
2. Mantenga la información más importante para que el asistente de ventas la use en el futuro.
3. Sea conciso y directo, con un límite máximo absoluto de ${GeminiConstants.MAX_COMPACTION_WORDS} palabras.
4. Esté escrito en español.

Resumen anterior:
${previousSummary || "No hay resumen anterior todavía."}

Últimas conversaciones:
${historyText}

Genera únicamente el nuevo resumen consolidado (sin explicaciones, saludos ni formato JSON):`;

        const requestBody = {
          contents: [
            {
              role: "user",
              parts: [{ text: compactionPrompt }],
            },
          ],
        };

        const response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`Gemini API compaction error: ${response.status} - ${errText}`);
        }

        const resultJson = (await response.json()) as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
        const candidate = resultJson.candidates?.[0];
        const parts = candidate?.content?.parts || [];
        const text = parts.map((p) => p.text ?? "").join(" ").trim();

        if (!text) {
          throw new Error("Empty response from Gemini compaction API");
        }

        return Result.ok(text);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        return Result.fail(new DomainError(message));
      }
    },
  };
};

export default makeGeminiLlmAdapter;
