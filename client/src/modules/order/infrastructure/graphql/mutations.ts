import { gql } from '@apollo/client';

export const CREATE_ORDER = gql`
  mutation setOrder($input: OrderInput!) {
    setOrder(input: $input)
  }
`;

export const UPDATE_ORDER = gql`
  mutation updateOrder($input: OrderInput!) {
    updateOrder(input: $input)
  }
`;

export const UPDATE_ORDER_WITH_CANCELLATION = UPDATE_ORDER;
