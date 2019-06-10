import React, { Fragment, Component } from 'react';
import { Link } from 'react-router-dom';

import { Query, Mutation } from 'react-apollo';
import { CLIENTES_QUERY } from '../../services/queries/clients';
import { DELETE_CLIENT } from '../../services/mutations/clients';

import Alerta from '../../components/Alerta';
import Spinkit from '../../components/Spinkit';
import Paginador from '../../containers/Paginador';

class Clients extends Component {
    state={
        paginador:{
            offset:0,
            actual:1
		},
		alerta: {
            mostrar:false,
            mensaje:''
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
		//Alertas
		const {alerta:{mostrar,mensaje}} = this.state;
		const alerta = (mostrar) ? <Alerta message={mensaje}/> : '';

		//Obtener ID de Clientes
		const {_id, rol} = this.props.session;
		
		let idSistem
		(rol === 'adm') ? idSistem = '' : idSistem = _id

		return (
			<Query query={CLIENTES_QUERY}  variables={{limite:this.limit, offset:this.state.paginador.offset,sellerID:idSistem}} pollInterval={1000}>
				{({ loading, error, data, startPolling, stopPolling }) => {
					if (loading) return <Spinkit/>;
					if (error) return `Error ${error.message}`;

					return (
						<Fragment>
							<h2 className="text-center">Listado de clientes</h2>
							{alerta}
							<ul className="list-group">
								{data.getAllClients.map((client) => (
									<li key={client._id} className="list-group-item">
										<div className="row justify-content-between align-items-center">
											<div className="col-md-6 d-flex justify-content-between align-items-center">
												{client.nombre} {client.apellido} - {client.empresa}
											</div>
											<div className="col-md-6 d-flex justify-content-end">
												<Link to={`/pedido/nuevo/${client._id}`} className="btn btn-warning d-block d-md-inline-block mr-1">
													&#43;  Nuevo Pedido
												</Link>
												<Link to={`/pedidos/${client._id}`} className="btn btn-primary d-block d-md-inline-block mr-1">
													Ver Pedidos
												</Link>
												<Mutation mutation={DELETE_CLIENT}
													onCompleted={(data)=>{
														if(data) this.setState({
															alerta: {
																mostrar: true,
																mensaje: 'Se a eliminado correctamente'
															}
														},()=>{
															setTimeout(()=>{
																this.setState({
																	alerta: {
																		mostrar: false,
																		mensaje: ''
																	}
																})
															}, 4000);
														})
													}}
												>
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
													className="btn btn-success d-block d-md-inline-block ml-1"
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
