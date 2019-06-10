import gql from 'graphql-tag';

export const CREAR_CLIENTE = gql`
    mutation crearCliente($input: iClient!){
        setClient(input: $input)
    }`;

export const UPDATE_CLIENT = gql`
    mutation updateClient($input: iClient!){
        updateClient(input: $input)
  }`;


export const DELETE_CLIENT = gql`
mutation deleteClient($_id:ID!){
  deleteClient(_id:$_id)
}
`;

