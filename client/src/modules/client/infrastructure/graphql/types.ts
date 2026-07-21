export interface GQLClient {
  _id: string;
  firstName: string;
  lastName: string;
  address: string;
  whatsapp: string;
  nationalId: string;
  type: string;
  sellerId: string;
}

export interface GQLGetAllClientsResponse {
  getAllClients: GQLClient[];
  totalClients: number;
}

export interface GQLGetClientResponse {
  getClient: GQLClient | null;
}

export interface GQLClientInput {
  _id?: string;
  firstName: string;
  lastName: string;
  address: string;
  whatsapp: string;
  nationalId: string;
  type?: string;
  sellerId: string;
}
