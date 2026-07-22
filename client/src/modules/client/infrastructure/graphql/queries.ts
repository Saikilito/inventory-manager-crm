import { gql } from '@apollo/client';

export const CLIENTS_QUERY = gql`
  query getClients($limit: Int, $offset: Int, $sellerId: ID) {
    getAllClients(limit: $limit, offset: $offset, sellerId: $sellerId) {
      _id
      id
      firstName
      lastName
      address
      whatsapp
      nationalId
      type
      sellerId
      orders
    }
    totalClients(sellerId: $sellerId)
  }
`;

export const SINGLE_CLIENT_QUERY = gql`
  query getClient($id: ID!) {
    getClient(_id: $id) {
      _id
      id
      firstName
      lastName
      address
      whatsapp
      nationalId
      type
      sellerId
      orders
    }
  }
`;
