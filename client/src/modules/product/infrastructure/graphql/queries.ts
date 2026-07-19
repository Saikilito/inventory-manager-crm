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

export const GET_ALL_CONTEXTS = gql`
  query getAllContexts {
    getAllContexts {
      _id
      name
    }
  }
`;

export const GET_CONTEXT_METRICS = gql`
  query getContextMetrics($contextId: ID!) {
    getContextMetrics(contextId: $contextId) {
      _id
    }
  }
`;

export const GET_CONTEXT_REPORT = gql`
  query getContextReport($contextId: ID, $periodType: String!) {
    getContextReport(contextId: $contextId, periodType: $periodType)
  }
`;
