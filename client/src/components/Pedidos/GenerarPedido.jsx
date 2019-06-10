import React from 'react';
import { withRouter } from 'react-router-dom'

import { Mutation } from 'react-apollo';
import { CREAR_PEDIDO } from '../../services/mutations/pedidos';

const validarPedido = (props) => {
    let noValido = !props.productos || props.total === 0

    return noValido;
}

const GenerarPedido = (props) => {
    return (
        <Mutation mutation={CREAR_PEDIDO} onCompleted={()=>props.history.push('/clientes')}>
        {
            crearPedido =>(
                <button className="btn btn-warning mt-5" type="button"
                    disabled={validarPedido(props)}
                    onClick={(e)=>{
                        
                        const productosInput = props.productos.map(({nombre,precio,stock,...objeto})=> objeto);
                        
                        const input = {
                            pedido: productosInput,
                            total: props.total,
                            cliente: props.cliente.id,
                            sellerID: props.sellerID
                        }
                        
                        crearPedido({variables:{input}})
                    }}
                >
                    Generar Pedido
                </button>
            )

            
        }
        </Mutation>
    );
}

export default withRouter(GenerarPedido);
