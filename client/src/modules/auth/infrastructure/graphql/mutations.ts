import { gql } from "@apollo/client";

export const CREATE_USER = gql`
  mutation setUser(
    $user: String!
    $email: String!
    $name: String!
    $password: String!
    $role: String!
  ) {
    setUser(user: $user, email: $email, name: $name, password: $password, role: $role)
  }
`;

export const AUTH_USER = gql`
  mutation userAuthentication($email: String!, $password: String!) {
    userAuthentication(email: $email, password: $password) {
      token
    }
  }
`;

export const UPDATE_USER = gql`
  mutation updateUser(
    $id: ID!
    $name: String
    $user: String
    $email: String
    $role: String
    $disabled: Boolean
  ) {
    updateUser(
      id: $id
      name: $name
      user: $user
      email: $email
      role: $role
      disabled: $disabled
    )
  }
`;
