import React, { Fragment, Component } from 'react';
import { Link } from 'react-router-dom';

import { Query, Mutation } from 'react-apollo';
import { CLIENTES_QUERY } from '../services/queries';
import { DELETE_CLIENT } from '../services/mutations/';

import Paginador from '../containers/Paginador'

class Clients extends Component {
    state={
        paginador:{
            offset:0,
            actual:1
        }
    }

    limit = 8;

    paginaAnterior = ()=>{
        this.setState({
            paginador:{
                actual: this.state.paginador.actual - 1,
                offset: this.state.paginador.offset - this.limit
            }
        })
    }
    paginaSiguiente= ()=>{
        this.setState({
            paginador:{
                actual: this.state.paginador.actual + 1,
                offset: this.state.paginador.offset + this.limit
            }
        })
    }
	render() {
		return (
			<Query query={CLIENTES_QUERY} pollInterval={1000} variables={{limite:this.limit, offset:this.state.paginador.offset}}>
				{({ loading, error, data, startPolling, stopPolling }) => {
					if (loading) return 'Loading...';
					if (error) return `Error ${error.message}`;
					console.log(data);

					return (
						<Fragment>
							<h2 className="text-center">Listado de clientes</h2>
							<ul className="list-group">
								{data.getAllClients.map((client) => (
									<li key={client._id} className="list-group-item">
										<div className="row justify-content-between align-items-center">
											<div className="col-md-8 d-flex justify-content-between align-items-center">
												{client.nombre} {client.apellido} - {client.empresa}
											</div>
											<div className="col-md-4 d-flex justify-content-end">
												<Mutation mutation={DELETE_CLIENT}>
													{(deleteClient) => (
														<button
															className="btn btn-danger d-block d-md-inline-block"
															type="button"
															onClick={() => {
																if (
																	window.confirm(
																		`Seguro que desea eliminar al cliente ${client.apellido}`
																	)
																)
																	deleteClient({ variables: { _id: client._id } });
															}}
														>
															&times; Eliminar
														</button>
													)}
												</Mutation>
												<Link
													to={`/cliente/editar/${client._id}`}
													className="btn btn-success d-block d-md-inline-block ml-2"
												>
													Editar clientes
												</Link>
											</div>
										</div>
									</li>
								))}
							</ul>
                            <Paginador actual={this.state.paginador.actual} 
                                total={data.totalClients}
                                limit={this.limit}
                                paginaAnterior={this.paginaAnterior}
                                paginaSiguiente={this.paginaSiguiente}
                            />
						</Fragment>
					);
				}}
			</Query>
		);
	}
}

export default Clients;
