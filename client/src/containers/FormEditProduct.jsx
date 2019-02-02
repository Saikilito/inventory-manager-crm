import React, { Component } from 'react';
import { withRouter} from 'react-router-dom';

import { Mutation } from 'react-apollo';
import { UPDATE_PRODUCT } from '../services/mutations/products';


class FormEditProduct extends Component {
	state = {
		...this.props.product
	};
	clearState = {
		nombre: '',
		precio: '',
		stock: ''
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
		const { nombre, precio, stock } = this.state;

		const input = {
			_id:this.props.product._id,
			nombre,
			precio: Number(precio),
			stock: Number(stock)
		};
		console.log('Input', {input})
		return (
			<Mutation mutation={UPDATE_PRODUCT} onCompleted={()=>{
				this.setState({
					...this.clearState
				}, ()=>this.props.refetch().then(()=>this.props.history.push('/productos')))
				
			}} >
				{(updateProduct) => (
					<form
						className="col-md-8"
						onSubmit={(e) => {
                            e.preventDefault();
                            
                            updateProduct({variables: { input }})
						}}
					>
						<div className="form-group">
							<label>Nombre:</label>
							<input
								onChange={this.handleChange}
								type="text"
								name="nombre"
								className="form-control"
								placeholder="Nombre del Producto"
								defaultValue={nombre}
							/>
						</div>
						<div className="form-group">
							<label>Precio:</label>
							<div className="input-group">
								<div className="input-group-prepend">
									<div className="input-group-text">$</div>
								</div>
								<input
									onChange={this.handleChange}
									type="number"
									name="precio"
									className="form-control"
									placeholder="Precio del Producto"
									defaultValue={precio}
								/>
							</div>
						</div>
						<div className="form-group">
							<label>Stock:</label>
							<input
								onChange={this.handleChange}
								type="number"
								name="stock"
								className="form-control"
								placeholder="stock del Producto"
								defaultValue={stock}
							/>
						</div>

						<button disabled={this.validateForm()} type="submit" className="btn btn-success float-right">
							Guardar Cambios
						</button>
					</form>
				)}
			</Mutation>
		);
	}
}

export default withRouter(FormEditProduct);
