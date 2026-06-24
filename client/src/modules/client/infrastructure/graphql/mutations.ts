import { gql } from '@apollo/client';

export const CREATE_CLIENT = gql`
  mutation setClient($input: ClientInput!) {
    setClient(input: $input)
  }
`;

export const UPDATE_CLIENT = gql`
  mutation updateClient($input: ClientInput!) {
    updateClient(input: $input)
  }
`;

export const DELETE_CLIENT = gql`
  mutation deleteClient($_id: ID!) {
    deleteClient(_id: $_id)
  }
`;
