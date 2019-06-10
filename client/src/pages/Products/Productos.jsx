import React, { Component, Fragment } from 'react';
import { Link } from 'react-router-dom';

import { Query, Mutation } from 'react-apollo';
import { PRODUCTOS_QUERY } from '../../services/queries/products';
import { DELETE_PRODUCT } from '../../services/mutations/products';

import Alerta from '../../components/Alerta';
import Paginador from '../../containers/Paginador';

class Productos extends Component {
	state = {
		paginador: {
			offset: 0,
			actual: 1
		},
		alerta: {
			mostrar: false,
			mensaje: ''
		}
	};

	limit = 3;

	paginaAnterior = () => {
		this.setState({
			paginador: {
				actual: this.state.paginador.actual - 1,
				offset: this.state.paginador.offset - this.limit
			}
		});
	};
	paginaSiguiente = () => {
		this.setState({
			paginador: {
				actual: this.state.paginador.actual + 1,
				offset: this.state.paginador.offset + this.limit
			}
		});
	};
	render() {
		const { alerta: { mostrar, mensaje } } = this.state;
		const alerta = mostrar ? <Alerta message={mensaje} /> : '';
		return (
			<Fragment>
				<h1 className="text-center mb-3">Productos</h1>
				{alerta}
				<Query
					query={PRODUCTOS_QUERY}
					variables={{ limite: this.limit, offset: this.state.paginador.offset }}
					pollInterval={1000}
				>
					{({ loading, error, data, startPolling, stopPolling }) => {
						if (loading) return 'Loading...';
						if (error) return `Error ${error.message}`;
						return (
							<Fragment>
								<table className="table">
									<thead>
										<tr className="table-primary">
											<th scope="col">Nombre</th>
											<th scope="col">Precio</th>
											<th scope="col">Existencia</th>
											<th scope="col">Eliminar</th>
											<th scope="col">Editar</th>
										</tr>
									</thead>

									<tbody>
										{data.getAllProducts.map((product) => {
											const { _id } = product;
											const { stock } = product;
											let classesita;

											if(stock < 30) classesita = 'table-danger text-light'
											else if (stock < 100) classesita = 'table-warning'
											else classesita = ''

											return (
												<tr key={_id} className={classesita}>
													<td>{product.nombre}</td>
													<td>{product.precio}</td>
													<td>{product.stock} </td>
													<td>
														<Mutation
															mutation={DELETE_PRODUCT}
															onCompleted={(data) => {
																if (data) this.setState({
																		alerta: {
																			mostrar: true,
																			mensaje: 'Se a eliminado correctamente'
																		}
																	},
																	() => {
																		setTimeout(() => {
																			this.setState({
																				alerta: {
																					mostrar: false,
																					mensaje: ''
																				}
																			});
																		}, 4000);
																});
															}}
														>
															{(deleteProduct) => (
																<button
																	className="btn btn-danger"
																	type="button"
																	onClick={() => {
																		if (
																			window.confirm(
																				`Seguro que desea eliminar el producto ${product.nombre}`
																			)
																		)
																			deleteProduct({ variables: { _id } });
																		console.log({ _id });
																	}}
																>
																	&times; Eliminar
																</button>
															)}
														</Mutation>
													</td>
													<td>
														<Link
															to={`/producto/editar/${_id}`}
															className="btn btn-success"
														>
															Editar Producto
														</Link>
													</td>
												</tr>
											);
										})}
									</tbody>
								</table>
								<Paginador
									actual={this.state.paginador.actual}
									total={data.totalProducts}
									limit={this.limit}
									paginaAnterior={this.paginaAnterior}
									paginaSiguiente={this.paginaSiguiente}
								/>
							</Fragment>
						);
					}}
				</Query>
			</Fragment>
		);
	}
}

export default Productos;
