import { gql } from '@apollo/client';

export const CREATE_PRODUCT = gql`
    mutation setProduct($input: ProductInput!){
        setProduct(input: $input)
    }`;

export const UPDATE_PRODUCT = gql`
    mutation updateProduct($input: ProductInput!){
        updateProduct(input: $input)
    }`;

export const DELETE_PRODUCT = gql`
    mutation deleteProduct($_id:ID!){
      deleteProduct(_id:$_id)
    }`;
