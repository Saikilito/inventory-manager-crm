import { gql } from '@apollo/client';

export const TOP_CLIENTS = gql`
query topClients{
    topClients{
        total
        client{
            nombre
        }
    }
  }`;

  export const TOP_SELLERS = gql`
  query topSellers{
    topSellers{
        total
        seller{
            name
        }
    }
  }`;