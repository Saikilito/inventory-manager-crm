import { gql } from '@apollo/client';

export const CREAR_PEDIDO = gql`
mutation crearPedido($input:iOrder!){
    setOrder(input:$input)
}`;

export const ACTUALIZAR_PEDIDO = gql`
mutation actualizarPedido($input:iOrder!){
  updateOrder(input:$input)
}`;