export const AgentRole = {
  SALES: 'SALES',
  SUPPORT: 'SUPPORT',
  CRM_OPERATOR: 'CRM_OPERATOR',
} as const;
export type AgentRole = typeof AgentRole[keyof typeof AgentRole];

export const AgentStatus = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
} as const;
export type AgentStatus = typeof AgentStatus[keyof typeof AgentStatus];

export const ConnectionStatus = {
  CONNECTING: 'CONNECTING',
  CONNECTED: 'CONNECTED',
  DISCONNECTED: 'DISCONNECTED',
  QR: 'QR',
} as const;
export type ConnectionStatus = typeof ConnectionStatus[keyof typeof ConnectionStatus];
