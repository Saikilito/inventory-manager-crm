import React, { createContext, useContext, ReactNode } from 'react';
import { useQuery } from '@apollo/client';
import { GET_SYSTEM_CONFIG } from '@modules/settings/infrastructure/graphql/queries';

interface SystemConfigContextValue {
  rentalsEnabled: boolean;
  loading: boolean;
  error: Error | null;
}

const SystemConfigContext = createContext<SystemConfigContextValue | undefined>(undefined);

export const SystemConfigProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { data, loading, error } = useQuery(GET_SYSTEM_CONFIG, {
    fetchPolicy: 'cache-first',
  });

  const value: SystemConfigContextValue = {
    rentalsEnabled: data?.getSystemConfig?.rentalsEnabled ?? false,
    loading,
    error: error ?? null,
  };

  return React.createElement(SystemConfigContext.Provider, { value }, children);
};

export const useSystemConfig = (): SystemConfigContextValue => {
  const context = useContext(SystemConfigContext);
  if (context === undefined) {
    throw new Error('useSystemConfig must be used within SystemConfigProvider');
  }
  return context;
};
