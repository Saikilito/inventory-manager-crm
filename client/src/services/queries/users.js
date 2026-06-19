import { gql } from "@apollo/client";

export const CURRENT_USER = gql`
  query getUser {
    getUser {
      _id
      user
      name
      rol
    }
  }
`;
