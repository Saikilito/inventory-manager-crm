import { gql } from "@apollo/client";

export const CREAR_USUARIO = gql`
  mutation setUser(
    $user: String!
    $name: String!
    $password: String!
    $rol: String!
  ) {
    setUser(user: $user, name: $name, password: $password, rol: $rol)
  }
`;

export const AUTH_USER = gql`
  mutation userAuthentication($user: String!, $password: String!) {
    userAuthentication(user: $user, password: $password) {
      token
    }
  }
`;
