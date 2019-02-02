import React, { Component, Fragment } from 'react';
import { withRouter } from 'react-router-dom'
import { Mutation } from 'react-apollo';
import { CREAR_PRODUCTO } from '../../services/mutations/products';

const clearState = {
	nombre: '',
	precio: '',
	stock: ''
}

class NuevoProducto extends Component {
	state = {
		...clearState
	};
	handleChange = (e) => {
		const { name, value } = e.target;
		this.setState({
			[name]: value
		});
	};
	validateForm = (e) => {
		const { nombre, precio, stock } = this.state;
		let noValid = !nombre || !precio || !stock;
		return noValid;
	};
	render() {
		return (
			<Fragment>
				<h1 className="text-center mb-5">Nuevo Producto</h1>
				<div className="row justify-content-center">
					<Mutation mutation={CREAR_PRODUCTO} onCompleted={()=>{
							this.setState({...this.clearState});
							this.props.history.push('/productos')
						}}
					>
						{(setProduct) => (
							<form className="col-md-8" onSubmit={(e) => {
								e.preventDefault()
								const { nombre, precio, stock } = this.state
								const input = {
									nombre,
									precio: Number(precio),
									stock: Number(stock)
								} 
									
								setProduct({variables: {input}})
								console.log({input})
							}}>
								<div className="form-group">
									<label>Nombre:</label>
									<input
										type="text"
										name="nombre"
										className="form-control"
										placeholder="Nombre del Producto"
										onChange={this.handleChange}
									/>
								</div>
								<div className="form-group">
									<label>Precio:</label>
									<div className="input-group">
										<div className="input-group-prepend">
											<div className="input-group-text">$</div>
										</div>
										<input
											type="number"
											name="precio"
											className="form-control"
											placeholder="Precio del Producto"
											onChange={this.handleChange}
										/>
									</div>
								</div>
								<div className="form-group">
									<label>Stock:</label>
									<input
										type="number"
										name="stock"
										className="form-control"
										placeholder="stock del Producto"
										onChange={this.handleChange}
									/>
								</div>
								<button
									type="submit"
									className="btn btn-success float-right"
									disabled={this.validateForm()}
								>
									Crear Producto
								</button>
							</form>
						)
					}
					</Mutation>
				</div>
			</Fragment>
		);
	}
}

export default withRouter(NuevoProducto);
