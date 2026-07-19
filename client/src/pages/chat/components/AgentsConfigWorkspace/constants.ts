export interface SettingsFormData {
  pagoMovilBank: string;
  pagoMovilPhone: string;
  pagoMovilId: string;
  binancePayUser: string;
  whatsappOriginLatitude: number;
  whatsappOriginLongitude: number;
  whatsappAlertGroupJid: string;
}

export const AVAILABLE_TOOLS = [
  { key: "searchStock", label: "Search Stock (Catalog)" },
  { key: "calculateDeliveryFee", label: "Calculate Delivery Fee" },
  { key: "createClient", label: "Create Client in CRM" },
  { key: "createOrder", label: "Create Draft CRM Order" },
  { key: "queryMongoDB", label: "Query Database (Direct)" },
];
