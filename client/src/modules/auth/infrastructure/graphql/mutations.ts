import { gql } from "@apollo/client";

export const CREATE_USER = gql`
  mutation setUser(
    $email: String!
    $name: String!
    $password: String!
    $role: String!
  ) {
    setUser(email: $email, name: $name, password: $password, role: $role)
  }
`;

export const AUTH_USER = gql`
  mutation userAuthentication($email: String!, $password: String!) {
    userAuthentication(email: $email, password: $password) {
      token
    }
  }
`;
