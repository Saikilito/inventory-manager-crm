interface Purchase {
  id: string;
  date: string;
  item: string;
  amount: string;
  status: "Pending" | "Completed" | "Cancelled";
}

export interface Contact {
  id: string;
  name: string;
  company: string;
  avatar: string;
  lastMessage: string;
  time: string;
  unreadCount: number;
  tier: "Gold" | "Basic";
  age: number;
  phone: string;
  email: string;
  avgOrderValue: string;
  totalAggregated: string;
  notes: string;
  online: boolean;
  purchases: Purchase[];
}

export interface Message {
  id: string;
  text: string;
  sender: "client" | "agent";
  time: string;
  audio?: {
    name: string;
    duration: string;
  };
  image?: string;
  sticker?: string;
  isPrivate?: boolean;
}

export interface Agent {
  id: string;
  name: string;
  role: "SALES" | "SUPPORT" | "CRM_OPERATOR";
  status: string;
  systemPrompt: string;
  enabledTools: string[];
}

export interface ExtractedClient {
  firstName?: string;
  lastName?: string;
  nationalId?: string;
  address?: string;
}

export interface ExtractedCartItem {
  productId?: string;
  productName?: string;
  quantity: number;
  price?: number;
}

export interface ExtractedData {
  client?: ExtractedClient;
  cart?: ExtractedCartItem[];
}
