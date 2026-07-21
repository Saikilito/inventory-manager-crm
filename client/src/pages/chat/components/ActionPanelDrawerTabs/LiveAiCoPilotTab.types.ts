export interface LiveCartItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
}

export interface LiveEditedClient {
  firstName: string;
  lastName: string;
  nationalId: string;
  address: string;
}

export type LiveEditableField = keyof LiveEditedClient;
