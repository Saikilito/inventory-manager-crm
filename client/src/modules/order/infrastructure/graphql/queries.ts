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

export const GET_ALL_ORDERS = gql`
  query getAllOrders($limit: Int) {
    getAllOrders(limit: $limit) {
      _id
      clientId
      createdAt
      status
      paymentStatus
      deliveryStatus
      items {
        productId
        quantity
        sellingPriceAtSale
        purchasePriceAtSale
      }
    }
  }
`;
