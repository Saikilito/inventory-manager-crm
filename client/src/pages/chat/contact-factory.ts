import { Contact } from "./types";

const SESSION_COMPANY_LABELS: Record<string, string> = {
  BOT: "AI Assistant (BOT)",
  PENDING_HUMAN: "Escalated Support (PENDING)",
};

const DEFAULT_WHATSAPP_COMPANY = "Human Support (OPERATOR)";

export const buildLiveContact = (params: {
  whatsappId: string;
  clientName: string;
  status: string | undefined;
}): Contact => ({
  id: params.whatsappId,
  name: params.clientName,
  company: SESSION_COMPANY_LABELS[params.status ?? ""] ?? DEFAULT_WHATSAPP_COMPANY,
  avatar: "WA",
  lastMessage: "Live Session",
  time: "Just now",
  unreadCount: 0,
  tier: "Basic",
  phone: params.whatsappId,
  email: "",
  avgOrderValue: "$0",
  totalAggregated: "$0",
  notes: "Live WhatsApp session",
  online: true,
  purchases: [],
});

export interface ClientNameLookup {
  whatsapp: string;
  firstName?: string | null;
  lastName?: string | null;
}

export const resolveClientName = (params: {
  whatsappId: string;
  clients: ClientNameLookup[] | undefined;
}): string => {
  const { clients, whatsappId } = params;
  if (!clients) return whatsappId;
  const match = clients.find((c) => c.whatsapp === whatsappId);
  if (!match) return whatsappId;
  return `${match.firstName ?? ""} ${match.lastName ?? ""}`.trim() || whatsappId;
};
