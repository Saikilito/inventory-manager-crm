import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { GET_CHAT_SETTINGS } from "../../../modules/chat/infrastructure/graphql/queries";
import { UPDATE_CHAT_SETTINGS } from "../../../modules/chat/infrastructure/graphql/mutations";
import {
  X,
  Save,
  MessageSquareCode,
  DollarSign,
  MapPin,
  Loader2,
  CheckCircle,
} from "lucide-react";



interface BotSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BotSettingsModal: React.FC<BotSettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { data, loading, error } = useQuery(GET_CHAT_SETTINGS, {
    skip: !isOpen,
  });

  const [updateSettings, { loading: saving }] =
    useMutation(UPDATE_CHAT_SETTINGS);

  const [pagoMovilBank, setPagoMovilBank] = useState("");
  const [pagoMovilPhone, setPagoMovilPhone] = useState("");
  const [pagoMovilId, setPagoMovilId] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [binancePayUser, setBinancePayUser] = useState("");
  const [whatsappOriginLatitude, setWhatsappOriginLatitude] = useState(10.5051512);
  const [whatsappOriginLongitude, setWhatsappOriginLongitude] = useState(-66.9392015);
  const [whatsappAlertGroupJid, setWhatsappAlertGroupJid] = useState("");

  const [activeTab, setActiveTab] = useState<"prompt" | "payment" | "delivery">(
    "prompt"
  );
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    if (data?.getChatSettings) {
      const s = data.getChatSettings;
      setPagoMovilBank(s.pagoMovilBank);
      setPagoMovilPhone(s.pagoMovilPhone);
      setPagoMovilId(s.pagoMovilId);
      setSystemPrompt(s.systemPrompt);
      setBinancePayUser(s.binancePayUser);
      setWhatsappOriginLatitude(s.whatsappOriginLatitude);
      setWhatsappOriginLongitude(s.whatsappOriginLongitude);
      setWhatsappAlertGroupJid(s.whatsappAlertGroupJid);
    }
  }, [data]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateSettings({
        variables: {
          input: {
            pagoMovilBank,
            pagoMovilPhone,
            pagoMovilId,
            systemPrompt,
            binancePayUser,
            whatsappOriginLatitude: typeof whatsappOriginLatitude === 'string' ? parseFloat(whatsappOriginLatitude) : whatsappOriginLatitude,
            whatsappOriginLongitude: typeof whatsappOriginLongitude === 'string' ? parseFloat(whatsappOriginLongitude) : whatsappOriginLongitude,
            whatsappAlertGroupJid,
          },
        },
      });
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (err) {
      console.error("Failed to save chat settings:", err);
    }
  };

  return (
    <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto animate-[fadeIn_0.2s_ease-out]">
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 dark:border-stone-800">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-stone-900 dark:text-stone-50">
              Bot Settings & Prompt Configuration
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
              Customize your assistant's knowledge and payment parameters in real-time.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400 hover:text-stone-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex border-b border-stone-100 dark:border-stone-800 px-6 bg-stone-50/50 dark:bg-stone-950/20">
          <button
            onClick={() => setActiveTab("prompt")}
            className={`py-3 px-4 text-sm font-semibold tracking-wide border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "prompt"
                ? "border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400"
                : "border-transparent text-stone-500 hover:text-stone-700 dark:hover:text-stone-300"
            }`}
          >
            <MessageSquareCode className="w-4 h-4" />
            System Prompt
          </button>
          <button
            onClick={() => setActiveTab("payment")}
            className={`py-3 px-4 text-sm font-semibold tracking-wide border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "payment"
                ? "border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400"
                : "border-transparent text-stone-500 hover:text-stone-700 dark:hover:text-stone-300"
            }`}
          >
            <DollarSign className="w-4 h-4" />
            Payment Details
          </button>
          <button
            onClick={() => setActiveTab("delivery")}
            className={`py-3 px-4 text-sm font-semibold tracking-wide border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "delivery"
                ? "border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400"
                : "border-transparent text-stone-500 hover:text-stone-700 dark:hover:text-stone-300"
            }`}
          >
            <MapPin className="w-4 h-4" />
            Store Delivery & Alerts
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400 animate-spin" />
              <p className="text-sm text-stone-500 dark:text-stone-400 mt-3 font-medium">
                Loading configuration...
              </p>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm font-medium">
              Failed to load chat configuration: {error.message}
            </div>
          ) : (
            <div className="space-y-6">
              {/* TAB 1: SYSTEM PROMPT / BOT KNOWLEDGE */}
              {activeTab === "prompt" && (
                <div className="space-y-4 animate-[fadeIn_0.2s_ease-out]">
                  <div>
                    <label className="block text-sm font-bold text-stone-800 dark:text-stone-200 mb-1.5">
                      Business Identity & Custom System Instructions
                    </label>
                    <p className="text-xs text-stone-500 dark:text-stone-400 mb-3 leading-relaxed">
                      This large prompt dictates exactly how Gemini behaves on WhatsApp. Describe your motorcycle shop, sales policies, return criteria, supported brands, tone of voice, etc.
                    </p>
                    <textarea
                      value={systemPrompt}
                      onChange={(e) => setSystemPrompt(e.target.value)}
                      rows={10}
                      className="w-full rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 p-4 text-sm font-medium text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 shadow-inner"
                      placeholder="Escribe las directrices principales de atención..."
                      required
                    />
                  </div>
                </div>
              )}

              {/* TAB 2: PAYMENT DETAILS */}
              {activeTab === "payment" && (
                <div className="space-y-6 animate-[fadeIn_0.2s_ease-out]">
                  {/* Pago Movil Section */}
                  <div className="space-y-4 border-b border-stone-100 dark:border-stone-800 pb-5">
                    <h3 className="text-sm font-bold text-stone-950 dark:text-stone-50 uppercase tracking-wider flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      Pago Móvil (Venezuela)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-stone-600 dark:text-stone-400 mb-1">
                          Banco / Bank Name
                        </label>
                        <input
                          type="text"
                          value={pagoMovilBank}
                          onChange={(e) => setPagoMovilBank(e.target.value)}
                          className="w-full rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          placeholder="e.g. Banesco"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-stone-600 dark:text-stone-400 mb-1">
                          Teléfono / Phone
                        </label>
                        <input
                          type="text"
                          value={pagoMovilPhone}
                          onChange={(e) => setPagoMovilPhone(e.target.value)}
                          className="w-full rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          placeholder="e.g. 04121234567"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-stone-600 dark:text-stone-400 mb-1">
                          Cédula / RIF / ID
                        </label>
                        <input
                          type="text"
                          value={pagoMovilId}
                          onChange={(e) => setPagoMovilId(e.target.value)}
                          className="w-full rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          placeholder="e.g. V-12345678"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Binance Pay Section */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-stone-950 dark:text-stone-50 uppercase tracking-wider flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      Binance Pay
                    </h3>
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-stone-600 dark:text-stone-400 mb-1">
                          Usuario / Correo Binance
                        </label>
                        <input
                          type="text"
                          value={binancePayUser}
                          onChange={(e) => setBinancePayUser(e.target.value)}
                          className="w-full rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          placeholder="e.g. caracasrepuestos@gmail.com"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: STORE DELIVERY & ALERTS */}
              {activeTab === "delivery" && (
                <div className="space-y-6 animate-[fadeIn_0.2s_ease-out]">
                  {/* Store Coordinates */}
                  <div className="space-y-4 border-b border-stone-100 dark:border-stone-800 pb-5">
                    <h3 className="text-sm font-bold text-stone-950 dark:text-stone-50 uppercase tracking-wider">
                      Store Coordinates (Google Maps GPS)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-stone-600 dark:text-stone-400 mb-1">
                          Latitude
                        </label>
                        <input
                          type="number"
                          step="any"
                          value={whatsappOriginLatitude}
                          onChange={(e) =>
                            setWhatsappOriginLatitude(parseFloat(e.target.value))
                          }
                          className="w-full rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-stone-600 dark:text-stone-400 mb-1">
                          Longitude
                        </label>
                        <input
                          type="number"
                          step="any"
                          value={whatsappOriginLongitude}
                          onChange={(e) =>
                            setWhatsappOriginLongitude(parseFloat(e.target.value))
                          }
                          className="w-full rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Group Alerts JID */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-stone-950 dark:text-stone-50 uppercase tracking-wider">
                      Support Alerts Group
                    </h3>
                    <div>
                      <label className="block text-xs font-bold text-stone-600 dark:text-stone-400 mb-1">
                        WhatsApp Group JID
                      </label>
                      <input
                        type="text"
                        value={whatsappAlertGroupJid}
                        onChange={(e) => setWhatsappAlertGroupJid(e.target.value)}
                        className="w-full rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder="e.g. 120363123456789012@g.us"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </form>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-stone-50 dark:bg-stone-950/40 border-t border-stone-100 dark:border-stone-800 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="h-10 px-4 rounded-xl text-sm font-semibold text-stone-600 hover:text-stone-700 hover:bg-stone-100 dark:text-stone-300 dark:hover:text-stone-100 dark:hover:bg-stone-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSave}
            disabled={loading || saving}
            className="h-10 px-5 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>

      {/* Success Toast */}
      {showToast && (
        <div className="fixed bottom-6 right-6 bg-stone-900 text-white dark:bg-emerald-50 dark:text-emerald-950 border border-emerald-500/30 px-5 py-3 rounded-xl shadow-lg z-50 flex items-center gap-3 animate-[slideIn_0.3s_ease-out]">
          <CheckCircle className="w-5 h-5 text-emerald-500" />
          <span className="text-sm font-bold">Settings saved successfully!</span>
        </div>
      )}
    </div>
  );
};
