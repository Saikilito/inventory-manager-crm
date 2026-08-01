import type { GQLProduct } from "@modules/product/infrastructure/graphql/types";

export type ActionPanelProduct = GQLProduct;

export interface ActionPanelClient {
  _id: string;
  id?: string;
  firstName: string;
  lastName: string;
  whatsapp: string;
}

export interface DraftOrderItem {
  product: ActionPanelProduct;
  quantity: number;
}

export interface ExtractedCartItem {
  productId?: string;
  productName: string;
  quantity: number;
  price?: number;
}

export interface ExtractedClientData {
  firstName?: string;
  lastName?: string;
  nationalId?: string;
  address?: string;
}

export interface ChatSessionExtractedData {
  client?: ExtractedClientData;
  cart?: ExtractedCartItem[];
}

export interface ActionPanelChatSession {
  id?: string;
  _id?: string;
  whatsappId: string;
  extractedData?: ChatSessionExtractedData;
}
