import { gql } from '@apollo/client';

export const GET_ALL_CONTEXTS = gql`
  query getAllContexts {
    getAllContexts {
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

export const GET_CONTEXT = gql`
  query getContext($_id: ID!) {
    getContext(_id: $_id) {
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
