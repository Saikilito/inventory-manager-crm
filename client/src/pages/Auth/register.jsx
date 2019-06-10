import React, { Component, Fragment } from 'react';
import { withRouter, Redirect } from 'react-router-dom';

import { Mutation } from 'react-apollo';
import { CREAR_USUARIO } from '../../services/mutations/users';

import Error from '../../components/Error';
const initialState = {
	user: '',
	name: '',
	password: '',
	repeatPassword: '',
	rol: 'Vendedor'
};

class Register extends Component {
	state = {
		...initialState
	};
	updateState = (e) => {
		const { name, value } = e.target;
		this.setState({
			[name]: value
		});
	};
	validateForm = () => {
		const { user, password, repeatPassword } = this.state;
		const noValidate = !user || !password || password !== repeatPassword;

		return noValidate;
	};
	createRegister = (e, setUser) => {
		e.preventDefault();

		setUser().then((data) => this.setState({ ...initialState }));

		this.props.history.push('/login');
	};
	render() {
		const { rol } = this.props.session
		const protec = rol !== 'adm' ? <Redirect to='/clientes'/> : null
		return (
			<Fragment>
				{protec}
				<h1 className="text-center mb-5">Nuevo usuario</h1>
				<div className="row  justify-content-center">
					<Mutation mutation={CREAR_USUARIO} variables={{...this.state}}>
						{(setUser, { loading, error, data }) => (
							<form className="col-md-8" onSubmit={(e) => this.createRegister(e, setUser)}>
								{error && <Error error={error.message} />}
								<div className="form-group">
									<label>Usuario</label>
									<input
										type="text"
										name="user"
										className="form-control"
										placeholder="Nombre Usuario"
										onChange={this.updateState}
										value={this.state.user}
									/>
									<small className="form-text text-muted">
										(Sin espacios ni caracteres especiales)
									</small>
								</div>
								<div className="form-group">
									<label>Nombre</label>
									<input
										type="text"
										name="name"
										className="form-control"
										placeholder="Nombre Usuario"
										onChange={this.updateState}
										value={this.state.name}
									/>
								<small className="form-text text-muted">(Nombre Completo)</small>
								</div>
								<div className="form-row">
									<div className="form-group col-md-6">
										<label>Password</label>
										<input
											type="password"
											name="password"
											className="form-control"
											placeholder="Password"
											onChange={this.updateState}
											value={this.state.password}
										/>
									</div>
									<div className="form-group col-md-6">
										<label>Repetir Password</label>
										<input
											type="password"
											name="repeatPassword"
											className="form-control"
											placeholder="Repetir Password"
											onChange={this.updateState}
											value={this.state.repeatPassword}
										/>
									</div>
								</div>
								<div className="form-group">
									<label>Rol</label>
									<select name="rol" className="form-control"
                                        onChange={this.updateState}
                                    >
										<option value="seller">Vendedor</option>
										<option value="adm">Administrador</option>
									</select>
								</div>

								<button
									disabled={this.validateForm()}
									type="submit"
									className="btn btn-success float-right"
								>
									Crear Usuario
								</button>
							</form>
						)}
					</Mutation>
				</div>
			</Fragment>
		);
	}
}

export default withRouter(Register);
