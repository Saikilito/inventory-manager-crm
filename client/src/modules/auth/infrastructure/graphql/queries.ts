import { gql } from "@apollo/client";

export const CURRENT_USER = gql`
  query getUser {
    getUser {
      _id
      user
      email
      name
      role
      disabled
    }
  }
`;

export const GET_USERS = gql`
  query getUsers {
    getUsers {
      _id
      user
      email
      name
      role
      disabled
    }
  }
`;
