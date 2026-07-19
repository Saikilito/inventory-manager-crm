import { initAuthCreds, BufferJSON, proto, SignalDataSet, AuthenticationCreds } from "@whiskeysockets/baileys";
import { BaileysCredsModel, BaileysKeyModel } from "../baileys-auth.model.js";

export const useMongooseAuthState = async (
  _baileysAuthRepository: unknown, // kept for backward compatibility signature
  sessionId: string
) => {
  const credsDoc = await BaileysCredsModel.findOne({ sessionId }).exec();
  let creds: AuthenticationCreds = credsDoc
    ? JSON.parse(credsDoc.creds, BufferJSON.reviver)
    : initAuthCreds();

  const saveState = async () => {
    if (creds.me && creds.registered === false) {
      console.warn("⚠️ [Auth State] Forcing creds.registered to true because 'me' is populated!");
      creds.registered = true;
    }

    const credsStr = JSON.stringify(creds, BufferJSON.replacer);

    await BaileysCredsModel.findOneAndUpdate(
      { sessionId },
      { $set: { creds: credsStr } },
      { upsert: true }
    ).exec();
  };

  return {
    state: {
      creds,
      keys: {
        get: async <T extends keyof import("@whiskeysockets/baileys").SignalDataTypeMap>(
          category: T,
          ids: string[]
        ): Promise<{ [id: string]: import("@whiskeysockets/baileys").SignalDataTypeMap[T] }> => {
          if (ids.length === 0) return {};

          const docs = await BaileysKeyModel.find({
            sessionId,
            category: category as string,
            keyId: { $in: ids },
          }).exec();

          const data: { [id: string]: import("@whiskeysockets/baileys").SignalDataTypeMap[T] } = {};
          for (const doc of docs) {
            let value: unknown = JSON.parse(doc.data, BufferJSON.reviver);
            if (category === "app-state-sync-key" && value) {
              value = proto.Message.AppStateSyncKeyData.fromObject(value as object);
            }
            (data as Record<string, unknown>)[doc.keyId] = value;
          }
          return data;
        },
        set: async (data: SignalDataSet) => {
          for (const [category, values] of Object.entries(data)) {
            if (!values) continue;

            for (const [id, value] of Object.entries(values)) {
              if (value === null) {
                await BaileysKeyModel.deleteOne({ sessionId, category, keyId: id }).exec();
              } else {
                const dataStr = JSON.stringify(value, BufferJSON.replacer);
                await BaileysKeyModel.findOneAndUpdate(
                  { sessionId, category, keyId: id },
                  { $set: { data: dataStr } },
                  { upsert: true }
                ).exec();
              }
            }
          }
        },
      },
    },
    saveCreds: async () => {
      await saveState();
    },
  };
};

export default useMongooseAuthState;
