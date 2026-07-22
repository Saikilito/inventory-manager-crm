import { gql } from '@apollo/client';

export const CLIENT_ORDERS_QUERY = gql`
  query getOrderClient($clientId: ID!) {
    getOrderClient(clientId: $clientId) {
      _id
      id
      items {
        productId
        quantity
      }
      total
      deliveryCost
      createdAt
      clientId
      status
      sellerId
      contextId
    }
  }
`;

export const GET_ALL_ORDERS = gql`
  query getAllOrders($limit: Int, $date: String) {
    getAllOrders(limit: $limit, date: $date) {
      _id
      id
      clientId
      sellerId
      createdAt
      status
      paymentStatus
      deliveryStatus
      contextId
      total
      deliveryCost
      items {
        productId
        quantity
        sellingPriceAtSale
        purchasePriceAtSale
      }
    }
  }
`;
