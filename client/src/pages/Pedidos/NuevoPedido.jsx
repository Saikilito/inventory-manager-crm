import React, { Component, Fragment } from 'react';
import {withRouter} from 'react-router-dom';

import { Query } from 'react-apollo';
import { PRODUCTOS_QUERY } from '../../services/queries/products';

import DatosCliente from '../../components/Pedidos/DatosCliente';
import Pedidos from '../../containers/Pedidos';
import Spinkit from '../../components/Spinkit';

class NuevoPedido extends Component {
    render() {
        const _id = this.props.match.params;
        return (
            <Fragment>
                <h1 className="text-center mb-5">Nuevo Pedido</h1>

                <div className="row">
                    <div className="col-md-3">
                        <DatosCliente
                            _id={_id}
                        />
                    </div>
                    <div className="col-md-9">
                        <Query query={PRODUCTOS_QUERY}>
                        {
                            ({ loading, error, data, startPolling, stopPolling }) => {
                                if (loading) return <Spinkit/>
                                if (error) return `Error ${error.message}`;
                                
                            return(
                                < Pedidos
                                    session={this.props.session}
                                    products={data.getAllProducts}
                                    _id={_id}
                                />
                            )

                        }}
                        </Query>
                    </div>
                </div>
            </Fragment>
        );
    }
}

export default withRouter(NuevoPedido);

