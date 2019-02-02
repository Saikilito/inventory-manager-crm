import gql from 'graphql-tag';

export const CREAR_USUARIO = gql`
   mutation setUser($user:String!,$password:String!){
  setUser(user:$user, password:$password)
}
`;

export const AUTENTICAR_USUARIO = gql`
  mutation autenticateUser($user:String!,$password:String!){
    authenticateUser(user:$user, password:$password){
      token
    }
  }
`;