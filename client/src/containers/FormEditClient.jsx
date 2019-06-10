import React, { Component } from 'react';
import  { withRouter } from 'react-router-dom';
import { Mutation } from 'react-apollo';
import { UPDATE_CLIENT } from '../services/mutations/clients';

class FormEditClient extends Component {
	state = {
		client: this.props.client,
		emails: this.props.client.emails
	};
	nuevoCampo = () => {
		this.setState({
			emails: this.state.emails.concat([ { email: '' } ])
		});
	};
	leerCampo = (i) => (e) => {
		const nuevoMail = this.state.emails.map((email, index) => {
			if (i !== index) return email;
			return { ...email, email: e.target.value };
		});
		this.setState({ emails: nuevoMail });
	};
	quitarCampo = (i) => () => {
		this.setState({
			emails: this.state.emails.filter((s, index) => i !== index)
		});
	};
	handleChange = (e) => {
		const { name, value } = e.target;
		this.setState({
			client: {
				...this.state.client,
				[name]: value
			}
		});
	};
	render() {
		const { emails } = this.state;
        const { nombre, apellido, empresa, edad, tipo } = this.state.client;
		return (
            <Mutation mutation={UPDATE_CLIENT} 
                onCompleted={()=>this.props.refetch().then(()=>{
                    this.props.history.push('/clientes')
                })} 
            >
			{
                updateClient => (
                    <form className="col-md-8 m-3"
                        onSubmit={
                            (e)=>{
                                e.preventDefault()
                                const input = {
                                    ...this.state.client,
                                    emails:[...this.state.emails],
                                    edad: Number(this.state.client.edad)
                                }
                                
                                console.log({input})

                                updateClient({ variables: {input} })

                            }
                        }
                    >
                        <div className="form-row">
                            <div className="form-group col-md-6">
                                <label>Nombre</label>
                                <input
                                    name="nombre"
                                    type="text"
                                    className="form-control"
                                    defaultValue={nombre}
                                    onChange={this.handleChange}
                                />
                            </div>
                            <div className="form-group col-md-6">
                                <label>Apellido</label>
                                <input
                                    name="apellido"
                                    type="text"
                                    className="form-control"
                                    defaultValue={apellido}
                                    onChange={this.handleChange}
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group col-md-12">
                                <label>Empresa</label>
                                <input
                                    name="empresa"
                                    type="text"
                                    className="form-control"
                                    defaultValue={empresa}
                                    onChange={this.handleChange}
                                />
                            </div>

                            {emails.map((input, index) => (
                                <div key={index} className="form-group col-md-12">
                                    <label>Email {index + 1} : </label>
                                    <div className="input-group">
                                        <input
                                            type="email"
                                            placeholder={`Email`}
                                            className="form-control"
                                            onChange={this.leerCampo(index)}
                                            defaultValue={input.email}
                                        />
                                        <div className="input-group-append">
                                            <button
                                                className="btn btn-danger"
                                                type="button"
                                                onClick={this.quitarCampo(index)}
                                            >
                                                &times; Eliminar
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <div className="form-group d-flex justify-content-center col-md-12">
                                <button onClick={this.nuevoCampo} type="button" className="btn btn-warning">
                                    + Agregar Email
                                </button>
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group col-md-6">
                                <label>Edad</label>
                                <input
                                    name="edad"
                                    type="text"
                                    className="form-control"
                                    defaultValue={edad}
                                    onChange={this.handleChange}
                                />
                            </div>
                            <div className="form-group col-md-6">
                                <label>Tipo Cliente</label>
                                <select
                                    name="tipo"
                                    className="form-control"
                                    defaultValue={tipo}
                                    onChange={this.handleChange}
                                >
                                    <option value="">Elegir...</option>
                                    <option value="PREMIUM">PREMIUM</option>
                                    <option value="BASICO">BÁSICO</option>
                                </select>
                            </div>
                        </div>
                        <button type="submit" className="btn btn-success float-right">
                            Guardar Cambios
                        </button>
                    </form>
                )
            }
			</Mutation>
		);
	}
}

export default withRouter(FormEditClient);
