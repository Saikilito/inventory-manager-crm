import gql from 'graphql-tag';

export const CREAR_PEDIDO = gql`
mutation crearPedido($input:iOrder!){
    setOrder(input:$input)
}`;

export const ACTUALIZAR_PEDIDO = gql`
mutation actualizarPedido($input:iOrder!){
  updateOrder(input:$input)
}`;