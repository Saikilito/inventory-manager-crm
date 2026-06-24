import { gql } from '@apollo/client';

export const CLIENT_ORDERS_QUERY = gql`
  query getOrderClient($clientId: ID!) {
    getOrderClient(clientId: $clientId) {
      _id
      items {
        productId
        quantity
      }
      total
      createdAt
      clientId
      status
      sellerId
    }
  }
`;
