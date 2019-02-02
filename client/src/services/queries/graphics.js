import gql from 'graphql-tag';

export const TOP_CLIENTS = gql`
query topClients{
    topClients{
        total
        client{
            nombre
        }
    }
  }
`;