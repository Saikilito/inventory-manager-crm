import React from 'react';
import { useQuery } from '@apollo/client';
import { USUARIO_ACTUAL } from './queries/users';

const Session = Component => props => {
  const { loading, error, data, refetch } = useQuery(USUARIO_ACTUAL);
  if (loading) return null;
  return <Component {...props} session={data} refetch={refetch} />;
};

export default Session;
