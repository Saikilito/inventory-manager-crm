import gql from 'graphql-tag';

export const PRODUCTOS_QUERY = gql`
query buscarProductos($limite:Int, $offset:Int){
	getAllProducts(limite:$limite, offset:$offset){
    _id
    nombre
    precio
    stock
  }
  totalProducts
}`;


export const UN_PRODUCTO_QUERY = gql`
query getProduct($id:ID!){
	getProduct(_id:$id){
    _id
    nombre
    precio
    stock
  }
}`;