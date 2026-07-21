export interface GQLContextAttribute {
  name: string;
  label: string;
  type: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'MULTIPLE';
  required: boolean;
}

export interface GQLContext {
  _id: string;
  name: string;
  attributes: GQLContextAttribute[];
}

export interface GQLGetAllContextsResponse {
  getAllContexts: GQLContext[];
}

export interface GQLGetContextResponse {
  getContext: GQLContext | null;
}

export interface GQLContextInput {
  _id?: string;
  name: string;
  attributes: Array<{
    name: string;
    label?: string;
    type: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'MULTIPLE';
    required: boolean;
  }>;
}
