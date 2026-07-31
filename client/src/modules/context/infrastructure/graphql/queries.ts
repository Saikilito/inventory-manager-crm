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
