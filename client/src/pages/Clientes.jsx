import React, {Fragment} from 'react';
import {Link} from 'react-router-dom';

import { Query } from 'react-apollo';
import {CLIENTES_QUERY} from '../services/queries'

const Client = () => (
        <Query query={CLIENTES_QUERY} pollInterval={1500}>
        {
            ({ loading, error, data, startPolling, stopPolling }) =>{
                if(loading) return "Loading..."
                if(error) return `Error ${error.message}`
                console.log(data);
                
                return(
                    <Fragment>
                        <h2 className="text-center">Listado de clientes</h2>
                        <ul className="list-group">
                            {
                                data.getAllClients.map(client=>
                                    <li key={client._id} className="list-group-item">
                                        <div className="row justify-content-between align-items-center">
                                            <div className="col-md-8 d-flex justify-content-between align-items-center">
                                                {client.nombre} {client.apellido}
                                            </div>
                                            <div className="col-md-4 d-flex justify-content-end">
                                                <Link to={`/cliente/editar/${client._id}`} className="btn btn-success d-block d-md-inline-block">
                                                    Editar clientes
                                                </Link>
                                            </div>
                                        </div>
                                    </li>
                                )
                            }
                                
                        </ul>
                    </Fragment>
                )
            }
        }
        </Query>
)

export default Client;
