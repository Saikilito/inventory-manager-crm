import makeWASocket, {
  DisconnectReason,
  WASocket,
  BaileysEventMap,
} from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import { Result } from "../../../../../../shared-domain/src/shared/result.js";
import { NonEmptyStringVO } from "../../../../../../shared-domain/src/shared/value-objects/non-empty-string.vo.js";
import { IdVO } from "../../../../../../shared-domain/src/shared/value-objects/id.vo.js";
import { IBaileysAuthRepository } from "../../application/repositories/baileys-auth.repository.js";
import { ChatMessageSender, IChatMessageRepository } from "../../application/repositories/chat-message.repository.js";
import { ProcessIncomingMessage } from "../../application/use-cases/process-incoming-message.use-case.js";
import { IIncomingMessageCollector } from "./incoming-message-collector.js";
import { useMongooseAuthState } from "./baileys-auth-state.js";
import { pubSubInstance } from "../pubsub.js";
import { WhatsAppConstants } from "./whatsapp-constants.js";

export interface IWhatsAppGateway {
  sendMessage(
    to: string,
    text: string,
    options?: { alreadySaved?: boolean; skipPublish?: boolean; messageId?: string }
  ): Promise<Result<void, Error>>;
  initialize(
    processIncomingMessage: ProcessIncomingMessage,
    incomingMessageCollector?: IIncomingMessageCollector
  ): Promise<Result<void, Error>>;
  getSocket(): WASocket | null;
  getConnectionState(): { status: "DISCONNECTED" | "CONNECTING" | "QR" | "CONNECTED"; qr: string | null };
}

const jidToPhone = (jid: string): string => {
  const match = jid.match(/^(\d+)(?:@s\.whatsapp\.net|@lid)$/);
  return match ? `+${match[1]}` : jid;
};

const phoneToJid = (phone: string): string => {
  if (phone.includes("@")) return phone;
  const cleanPhone = phone.replace(/^\+/, "");
  return `${cleanPhone}@s.whatsapp.net`;
};

export const makeBaileysGateway = (dependencies: {
  baileysAuthRepository: IBaileysAuthRepository;
  chatMessageRepository: IChatMessageRepository;
  incomingMessageCollector?: IIncomingMessageCollector;
}): IWhatsAppGateway => {
  let sock: WASocket | null = null;
  let isInitializing = false;
  let reconnectTimeout: NodeJS.Timeout | null = null;
  let activeCollector: IIncomingMessageCollector | undefined = dependencies.incomingMessageCollector;
  const sessionId = WhatsAppConstants.DEFAULT_BAILEYS_SESSION_ID;

  let connectionState: {
    status: "DISCONNECTED" | "CONNECTING" | "QR" | "CONNECTED";
    qr: string | null;
  } = { status: "DISCONNECTED", qr: null };

  const setConnectionState = (
    status: "DISCONNECTED" | "CONNECTING" | "QR" | "CONNECTED",
    qr: string | null = null
  ) => {
    connectionState = { status, qr };
    pubSubInstance.publish("WHATSAPP_CONNECTION_UPDATED", {
      whatsAppConnectionUpdated: {
        status: connectionState.status,
        qr: connectionState.qr,
      },
    });
  };

  const initialize = async (
    processIncomingMessage: ProcessIncomingMessage,
    incomingMessageCollector?: IIncomingMessageCollector
  ): Promise<Result<void, Error>> => {
    if (incomingMessageCollector) {
      activeCollector = incomingMessageCollector;
    }
    if (isInitializing) {
      return Result.ok<void, Error>();
    }
    isInitializing = true;

    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
      reconnectTimeout = null;
    }

    if (sock) {
      try {
        sock.ev.removeAllListeners("creds.update");
        sock.ev.removeAllListeners("connection.update");
        sock.ev.removeAllListeners("messages.upsert");
        sock.end(undefined);
      } catch (err) {
        console.warn("[Gateway] Error closing existing socket reference:", err);
      }
    }

    setConnectionState("CONNECTING");
    try {
      const { state, saveCreds } = await useMongooseAuthState(
        dependencies.baileysAuthRepository,
        sessionId
      );

      sock = makeWASocket({
        auth: state,
        qrTimeout: WhatsAppConstants.QR_TIMEOUT_MS,
        printQRInTerminal: true,
      });

      sock.ev.on("creds.update", saveCreds);

      sock.ev.on("connection.update", async (update: BaileysEventMap["connection.update"]) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          setConnectionState("QR", qr);
        }

        if (connection === "close") {
          const disconnectError = lastDisconnect?.error;
          const statusCode = disconnectError instanceof Boom
            ? disconnectError.output?.statusCode
            : undefined;
          const isLoggedOut = statusCode === DisconnectReason.loggedOut;
          const isNormalRestart = statusCode === 515 || statusCode === DisconnectReason.restartRequired || statusCode === 408;
          
          console.warn(
            `[Gateway] WhatsApp connection closed. Status code: ${statusCode}. Logged out (401): ${isLoggedOut}. Normal restart: ${isNormalRestart}`
          );
          
          setConnectionState("CONNECTING");
          
          if (reconnectTimeout) {
            clearTimeout(reconnectTimeout);
            reconnectTimeout = null;
          }

          if (isLoggedOut) {
            console.warn("⚠️ [Gateway] Authentication failed or session logged out. Clearing stale auth from DB and starting a fresh session...");
            const sessionIdVO = NonEmptyStringVO.create(sessionId);
            await dependencies.baileysAuthRepository.deleteBySessionId(sessionIdVO);
            reconnectTimeout = setTimeout(async () => {
              reconnectTimeout = null;
              await initialize(processIncomingMessage);
            }, WhatsAppConstants.RECONNECT_DELAY_NORMAL_MS);
          } else {
            const delay = isNormalRestart ? WhatsAppConstants.RECONNECT_DELAY_FAST_MS : WhatsAppConstants.RECONNECT_DELAY_AFTER_TIMEOUT_MS;
            reconnectTimeout = setTimeout(async () => {
              reconnectTimeout = null;
              await initialize(processIncomingMessage);
            }, delay);
          }
        } else if (connection === "open") {
          setConnectionState("CONNECTED");
        }
      });

      sock.ev.on("messages.upsert", async (m: BaileysEventMap["messages.upsert"]) => {
        if (m.type === "notify") {
          for (const msg of m.messages) {
            if (msg.key.remoteJid && (
              msg.key.remoteJid.endsWith("@g.us") ||
              msg.key.remoteJid.endsWith("@broadcast") ||
              msg.key.remoteJid.endsWith("@newsletter")
            )) {
              continue;
            }
            if (!msg.key.fromMe && msg.message) {
              let fromJid = msg.key.remoteJid;
              if (fromJid && fromJid.endsWith("@lid") && msg.key.remoteJidAlt) {
                fromJid = msg.key.remoteJidAlt;
              }
              if (!fromJid) continue;

              if (
                fromJid.endsWith("@g.us") ||
                fromJid.endsWith("@broadcast") ||
                fromJid.endsWith("@newsletter")
              ) {
                continue;
              }

              let text =
                msg.message.conversation ||
                msg.message.extendedTextMessage?.text ||
                "";

              let mediaType: "audio" | "image" | null = null;

              if (msg.message.audioMessage) {
                mediaType = "audio";
                text = "🎵 [Audio recibido]";
              } else if (msg.message.imageMessage) {
                mediaType = "image";
                const caption = msg.message.imageMessage.caption;
                text = caption ? `📷 [Imagen recibida]: ${caption}` : "📷 [Imagen recibida]";
              } else if (!text && msg.message.locationMessage) {
                const lat = msg.message.locationMessage.degreesLatitude;
                const lng = msg.message.locationMessage.degreesLongitude;
                if (lat !== undefined && lng !== undefined) {
                  text = `https://maps.google.com/?q=${lat},${lng}`;
                }
              }

              if (text) {
                const cleanPhone = jidToPhone(fromJid);
                const systemActorId = IdVO.generateNil();

                const createRes = await dependencies.chatMessageRepository.create(
                  {
                    whatsappId: NonEmptyStringVO.create(cleanPhone),
                    text: NonEmptyStringVO.create(text),
                    sender: ChatMessageSender.CUSTOMER,
                  },
                  systemActorId
                );

                let savedMsg;
                if (!createRes.isFailure) {
                  savedMsg = createRes.getValue();
                }

                const msgObj = {
                  id: savedMsg?.id?.toString() || msg.key.id || IdVO.generate().toString(),
                  text,
                  sender: ChatMessageSender.CUSTOMER,
                  createdAt: savedMsg?.createdAt?.toString() || new Date().toISOString(),
                };

                pubSubInstance.publish(`CHAT_MESSAGE_RECEIVED_${cleanPhone}`, {
                  chatMessageReceived: msgObj,
                });

                if (activeCollector) {
                  await activeCollector.enqueue({
                    from: cleanPhone,
                    text,
                    mediaType,
                  });
                } else {
                  const processRes = await processIncomingMessage({
                    from: cleanPhone,
                    text,
                    mediaType,
                    alreadySaved: true,
                  });

                  if (processRes.isFailure) {
                    console.error(
                      `❌ [Gateway] Failed to process incoming message from ${cleanPhone}:`,
                      processRes.getError().message
                    );
                  } else {
                    const output = processRes.getValue();

                    pubSubInstance.publish("CHAT_SESSION_UPDATED", {
                      chatSessionUpdated: {
                        id: output.sessionId,
                        _id: output.sessionId,
                        whatsappId: cleanPhone,
                        status: output.status,
                        driftCount: output.driftCount,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                      },
                    });
                  }
                }
              }
            }
          }
        }
      });

      isInitializing = false;
      return Result.ok<void, Error>();
    } catch (err: unknown) {
      isInitializing = false;
      console.error("Failed to initialize Baileys Gateway:", err);
      return Result.fail(err instanceof Error ? err : new Error(String(err)));
    }
  };

  const sendMessage = async (
    to: string,
    text: string,
    options?: { alreadySaved?: boolean; skipPublish?: boolean; messageId?: string }
  ): Promise<Result<void, Error>> => {
    if (!sock) {
      return Result.fail(new Error("WhatsApp socket not initialized"));
    }

    try {
      const jid = phoneToJid(to);
      await sock.sendMessage(jid, { text });

      const cleanPhone = jidToPhone(jid);
      const systemActorId = IdVO.generateNil();

      let savedMsg;
      if (!options?.alreadySaved) {
        const createRes = await dependencies.chatMessageRepository.create(
          {
            whatsappId: NonEmptyStringVO.create(cleanPhone),
            text: NonEmptyStringVO.create(text),
            sender: ChatMessageSender.BOT,
          },
          systemActorId
        );
        if (!createRes.isFailure) {
          savedMsg = createRes.getValue();
        }
      }

      if (!options?.skipPublish) {
        const msgObj = {
          id: options?.messageId || savedMsg?.id?.toString() || IdVO.generate().toString(),
          text,
          sender: ChatMessageSender.BOT,
          createdAt: savedMsg?.createdAt?.toString() || new Date().toISOString(),
        };

        pubSubInstance.publish(`CHAT_MESSAGE_RECEIVED_${cleanPhone}`, {
          chatMessageReceived: msgObj,
        });
      }

      return Result.ok<void, Error>();
    } catch (err: unknown) {
      return Result.fail(err instanceof Error ? err : new Error(String(err)));
    }
  };

  const getSocket = (): WASocket | null => sock;
  const getConnectionState = () => connectionState;

  return {
    initialize,
    sendMessage,
    getSocket,
    getConnectionState,
  };
};

export default makeBaileysGateway;
