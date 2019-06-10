import gql from 'graphql-tag';

export const PEDIDOS_CLIENTE_QUERY = gql`
query getOrderClient($client:ID!){
    getOrderClient(client:$client){
      _id
      cliente
      fecha
      estado
      pedido{
        _id
        cantidad
      }
      total
      sellerID
    }
}`