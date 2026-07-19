import React, { useEffect, useState, useRef } from "react";
import { useQuery, useSubscription, gql } from "@apollo/client";
import { ConnectionStatus } from "@shared-domain/chat/agent.entity";
import { QrCode, RefreshCw, AlertCircle, WifiOff, CheckCircle } from "lucide-react";

export const GET_WHATSAPP_CONNECTION_STATE = gql`
  query GetWhatsAppConnectionState {
    getWhatsAppConnectionState {
      status
      qr
    }
  }
`;

export const WHATSAPP_CONNECTION_UPDATED = gql`
  subscription OnWhatsAppConnectionUpdated {
    whatsAppConnectionUpdated {
      status
      qr
    }
  }
`;

interface QrPortalProps {
  onConnected?: () => void;
}

export const QrPortal: React.FC<QrPortalProps> = ({ onConnected }) => {
  const [status, setStatus] = useState<ConnectionStatus>(ConnectionStatus.DISCONNECTED);
  const [qrToken, setQrToken] = useState<string | null>(null);

  const onConnectedRef = useRef(onConnected);
  onConnectedRef.current = onConnected;
  const triggeredRef = useRef(false);

  const handleStatusChange = (newStatus: ConnectionStatus) => {
    setStatus(newStatus);
    if (newStatus !== ConnectionStatus.CONNECTED) {
      triggeredRef.current = false;
    } else if (newStatus === ConnectionStatus.CONNECTED && !triggeredRef.current) {
      triggeredRef.current = true;
      onConnectedRef.current?.();
    }
  };

  const { data: initialData } = useQuery(GET_WHATSAPP_CONNECTION_STATE);

  const { data: subscriptionData } = useSubscription(WHATSAPP_CONNECTION_UPDATED);

  useEffect(() => {
    if (initialData?.getWhatsAppConnectionState) {
      const { status: initialStatus, qr } = initialData.getWhatsAppConnectionState;
      setQrToken(qr);
      handleStatusChange(initialStatus);
    }
  }, [initialData]);

  useEffect(() => {
    if (subscriptionData?.whatsAppConnectionUpdated) {
      const { status: updatedStatus, qr } = subscriptionData.whatsAppConnectionUpdated;
      setQrToken(qr);
      handleStatusChange(updatedStatus);
    }
  }, [subscriptionData]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 max-w-lg mx-auto bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-xl space-y-8 animate-[fadeIn_0.3s_ease-out]">
      <div className="text-center space-y-3">
        <div className="inline-flex p-3 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-xl">
          <QrCode className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-stone-900 dark:text-stone-50 tracking-tight">
          WhatsApp CRM Portal
        </h2>
        <p className="text-sm text-stone-500 dark:text-stone-400 max-w-sm mx-auto font-medium leading-relaxed">
          Authenticate your device to sync messages, clients, and orders in real-time with our Sales Copilot.
        </p>
      </div>

      <div className="relative w-72 h-72 flex items-center justify-center bg-stone-50 dark:bg-stone-950 border border-stone-100 dark:border-stone-800 rounded-2xl p-4 shadow-inner overflow-hidden">
        {status === ConnectionStatus.CONNECTING && (
          <div className="flex flex-col items-center space-y-4">
            <RefreshCw className="w-12 h-12 text-emerald-600 dark:text-emerald-400 animate-spin" />
            <span className="text-sm font-bold text-stone-600 dark:text-stone-400">
              Initializing socket...
            </span>
          </div>
        )}

        {status === ConnectionStatus.DISCONNECTED && (
          <div className="flex flex-col items-center space-y-4 p-4 text-center">
            <WifiOff className="w-12 h-12 text-stone-400" />
            <div>
              <span className="block text-sm font-bold text-stone-800 dark:text-stone-200">
                Disconnected
              </span>
              <span className="block text-xs text-stone-400 mt-1">
                Waiting for backend connection to start.
              </span>
            </div>
          </div>
        )}

        {status === ConnectionStatus.QR && qrToken && (
          <div className="relative group p-2 bg-white dark:bg-stone-950 rounded-lg animate-[scaleIn_0.2s_ease-out]">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrToken)}`}
              alt="WhatsApp QR Code"
              className="w-64 h-64 select-none"
            />
          </div>
        )}

        {status === ConnectionStatus.CONNECTED && (
          <div className="flex flex-col items-center space-y-4 animate-[scaleIn_0.2s_ease-out]">
            <CheckCircle className="w-12 h-12 text-emerald-600 dark:text-emerald-400" />
            <span className="text-sm font-bold text-stone-800 dark:text-stone-200">
              Connected successfully!
            </span>
          </div>
        )}
      </div>

      <div className="w-full pt-4 border-t border-stone-100 dark:border-stone-800">
        <div className="flex items-start gap-3 bg-stone-50 dark:bg-stone-950 p-4 rounded-xl">
          <AlertCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <div className="text-xs text-stone-600 dark:text-stone-400 font-medium leading-relaxed">
            <p className="font-bold text-stone-800 dark:text-stone-200 mb-1">How to connect:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Open WhatsApp on your mobile phone.</li>
              <li>Tap Menu or Settings and select Linked Devices.</li>
              <li>Point your phone's camera at this screen to scan the code.</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QrPortal;
