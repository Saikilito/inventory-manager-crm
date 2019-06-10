import React, { Component, Fragment } from 'react';
import {withRouter} from 'react-router-dom';

import { Mutation } from 'react-apollo'
import {CREAR_CLIENTE} from '../../services/mutations/clients'


class NuevoCliente extends Component {
	state = {
        cliente:{
            nombre:'',
            apellido:'',
            empresa:'',
            edad:'',
            tipo:''
        },
        error: false,
        emails:[]
    };
    handleOnChange = (e) =>{
        const { name, value } = e.target
        this.setState({
            cliente:{
                ...this.state.cliente,
                [name]:value
            }
        })
    }
    nuevoCampo = ()=> {
        this.setState({
            emails: this.state.emails.concat([{email:""}])
        })
    }
    leerEmail = (e) => {
        const { name, value } = e.target
        
        const nuevoEmail = this.state.emails.map((email,i)=>{
            if(Number(name) !== i) return email
            return {
                ...email,
                email: value
            }
        });

        this.setState({emails:nuevoEmail});
    }
    eliminarCorreo = (e) =>{
        const {name} = e.target
        this.setState({
            emails: this.state.emails.filter((email,i)=> i !== Number(name))
        })
    }
	render() {
        const respuesta = this.state.error ? 
        (<p className="alert alert-danger p-3 text-center">Todos los campos son obligatorios</p> ):('')
        const {_id} = this.props.session

		return (
			<Fragment>
				<h2 className="text-center">Nuevo Cliente</h2>
                    {respuesta}
                <div className="row justify-content-center">
                    <Mutation mutation={CREAR_CLIENTE} onCompleted={()=>this.props.history.push('/clientes')} >
                    {
                        setClient => (                    
                        
				        <form className="col-md-8 m-3" onSubmit={
                            (e)=>{
                                e.preventDefault()
                                
                                const input = {
                                    ...this.state.cliente,
                                    emails:[...this.state.emails],
                                    edad: Number(this.state.cliente.edad),
                                    sellerID: _id
                                }

                                console.log(input)
                                for (const i in input) {
                                    if (input.hasOwnProperty(i)) {
                                        const element = input[i]; 
                                        if(element === '') {
                                            this.setState({error:true})
                                            console.log(i, element)
                                            return null;
                                        }
                                    }
                                }

                                if(this.state.error) this.setState({error:false})

                                setClient({ variables: {input} })
                                
                            }
                        }>
				        	<div className="form-row">
				        		<div className="form-group col-md-6">
				        			<label>Nombre</label>
				        			<input onChange={this.handleOnChange} name="nombre" type="text" className="form-control" placeholder="Nombre" />
				        		</div>
				        		<div className="form-group col-md-6">
				        			<label>Apellido</label>
				        			<input onChange={this.handleOnChange} name="apellido" type="text" className="form-control" placeholder="Apellido" />
				        		</div>
				        	</div>
				        	<div className="form-row">
				        		<div className="form-group col-md-12">
				        			<label>Empresa</label>
				        			<input onChange={this.handleOnChange} name="empresa" type="text" className="form-control" placeholder="Empresa" />
				        		</div>
                                {this.state.emails.map((input, i)=> (
                                    <div key={i} className="form-group col-md-12">
                                        <label>Correo {++i}:</label>
                                        <div className="input-group">
                                            <input type="email" name={--i}
                                                placeholder="Email" className="form-control"
                                                onChange={(e)=>this.leerEmail(e)}
                                            />
                                            <div className="input-group-append">
                                                <button className="btn btn-danger" type="button"
                                                    onClick={this.eliminarCorreo} name={i}
                                                >&times; Eliminar
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ) )}
                                <div className="form-group col-md-12 d-flex justify-content-center">
                                    <button className="btn btn-warning" type="button"
                                        onClick={this.nuevoCampo}
                                    >+ Agregar Email
                                    </button>
                                </div>
				        	</div>
				        	<div className="form-row">
				        		<div className="form-group col-md-6">
				        			<label>Edad</label>
				        			<input onChange={this.handleOnChange} name="edad" type="text" className="form-control" placeholder="Edad" />
				        		</div>
				        		<div className="form-group col-md-6">
				        			<label>Tipo Cliente</label>
				        			<select onChange={this.handleOnChange} name="tipo" className="form-control">
				        				<option value="">Elegir...</option>
				        				<option value="PREMIUM">PREMIUM</option>
				        				<option value="BASICO">BÁSICO</option>
				        			</select>
				        		</div>
				        	</div>
				        	<button type="submit" className="btn btn-success float-right">
				        		Agregar Cliente
				        	</button>
				        </form>
                        )}
                    </Mutation>
                </div>
			</Fragment>
		);
	}
}

export default withRouter(NuevoCliente);
