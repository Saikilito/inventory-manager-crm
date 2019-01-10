import gql from 'graphql-tag';

export const CLIENTES_QUERY = gql`
query buscarClientes{
	getAllClients{
    _id
    nombre
    apellido
    empresa
  }
}`;