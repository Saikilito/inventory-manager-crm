import { gql } from '@apollo/client';

export const CREATE_CONTEXT = gql`
  mutation createContext($input: CreateContextInput!) {
    createContext(input: $input) {
      _id
      name
      attributes {
        name
        label
        type
        required
      }
    }
  }
`;

export const UPDATE_CONTEXT = gql`
  mutation updateContext($input: UpdateContextInput!) {
    updateContext(input: $input) {
      _id
      name
      attributes {
        name
        label
        type
        required
      }
    }
  }
`;

export const DELETE_CONTEXT = gql`
  mutation deleteContext($_id: ID!) {
    deleteContext(_id: $_id)
  }
`;
