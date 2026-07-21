import { gql } from '@apollo/client';

export const CREATE_PRODUCT = gql`
  mutation setProduct($input: ProductInput!) {
    setProduct(input: $input) {
      _id
      name
      purchasePrice
      sellingPrice
      profit
      profitMargin
      stock
      stockValue
      potentialProfit
      contextId
    }
  }
`;

export const UPDATE_PRODUCT = gql`
  mutation updateProduct($input: ProductInput!) {
    updateProduct(input: $input) {
      _id
      name
      purchasePrice
      sellingPrice
      profit
      profitMargin
      stock
      stockValue
      potentialProfit
      contextId
    }
  }
`;

export const DELETE_PRODUCT = gql`
  mutation deleteProduct($_id: ID!) {
    deleteProduct(_id: $_id)
  }
`;
