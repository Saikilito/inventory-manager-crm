import gql from 'graphql-tag';

export const CREAR_USUARIO = gql`
   mutation setUser($user:String!, $name:String!, $password:String!, $rol:String!){
      setUser(user:$user, name:$name, password:$password, rol:$rol)
}
`;

export const AUTENTICAR_USUARIO = gql`
  mutation autenticateUser($user:String!,$password:String!){
    authenticateUser(user:$user, password:$password){
      token
    }
  }
`;