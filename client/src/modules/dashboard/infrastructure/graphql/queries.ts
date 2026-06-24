import { gql } from '@apollo/client';

export const TOP_CLIENTS = gql`
  query topClients {
    topClients {
      total
      client {
        _id
        firstName
        lastName
        company
      }
    }
  }
`;

export const TOP_SELLERS = gql`
  query topSellers {
    topSellers {
      total
      seller {
        _id
        name
      }
    }
  }
`;
