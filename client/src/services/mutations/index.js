import gql from 'graphql-tag';

export const CREAR_CLIENTE = gql`
    mutation crearCliente($input: iClient){
        setClient(input: $input)
    }`;
