import gql from 'graphql-tag';

export const CLIENTES_QUERY = gql`
query buscarClientes($limite:Int, $offset:Int, $sellerID:ID){
	getAllClients(limite:$limite, offset:$offset, sellerID:$sellerID){
    _id
    nombre
    apellido
    empresa
  }
  totalClients(sellerID:$sellerID)
}`;


export const UN_CLIENTE_QUERY = gql`
query buscarUnCliente($id:ID!){
	getClient(_id:$id){
    _id
    nombre
    apellido
    edad
    empresa
    emails{
      email
    }
    tipo
  }
}`;