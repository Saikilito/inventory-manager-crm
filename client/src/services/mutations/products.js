import gql from 'graphql-tag';

export const CREAR_PRODUCTO = gql`
    mutation setProduct($input: iProduct!){
        setProduct(input: $input)
    }`;

export const UPDATE_PRODUCT = gql`
    mutation updateProduct($input: iProduct!){
        updateProduct(input: $input)
  }`;


export const DELETE_PRODUCT = gql`
    mutation deleteProduct($_id:ID!){
      deleteProduct(_id:$_id)
    }`;