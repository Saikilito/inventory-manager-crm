import React, {Fragment} from 'react';

import { Query } from 'react-apollo';
import { PEDIDOS_CLIENTE_QUERY } from '../../services/queries/pedidos';

import Spinkit from '../../components/Spinkit';
import Pedido from '../../components/Pedidos/Pedido';

import './PedidosCliente.css';

const PedidosCliente = (props) => {
    const client = props.match.params.id
    
    return (
        <Fragment>
            <h1 className="text-center mb-5">Pedidos del Cliente</h1>

            <div className="row">
                <Query query={PEDIDOS_CLIENTE_QUERY} variables={{client}} pollInterval={1000}>
                    {({ loading, error, data, startPolling, stopPolling }) => {
					    if (loading) return <Spinkit />;
					    if (error) return `Error ${error.message}`;

                        console.log(data.getOrderClient)
                        return(
                            data.getOrderClient.map(order=>(
                                <Pedido
                                    key={order._id}
                                    order={order}
                                    client={client}
                                />
                            ))
                        )
                    }}
                </Query>
            </div>
        </Fragment>
    );
}

export default PedidosCliente;
