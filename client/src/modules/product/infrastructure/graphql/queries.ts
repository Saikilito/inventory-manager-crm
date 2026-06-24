import { gql } from '@apollo/client';

export const PRODUCTS_QUERY = gql`
  query getProducts($limit: Int, $offset: Int) {
    getAllProducts(limit: $limit, offset: $offset) {
      _id
      name
      price
      stock
    }
    totalProducts
  }
`;

export const SINGLE_PRODUCT_QUERY = gql`
  query getProduct($id: ID!) {
    getProduct(_id: $id) {
      _id
      name
      price
      stock
    }
  }
`;
