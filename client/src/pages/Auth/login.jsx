import React, { Component, Fragment } from 'react';
import { withRouter } from 'react-router-dom'

import Error from '../../components/Error';

import { Mutation } from 'react-apollo'
import {AUTENTICAR_USUARIO} from '../../services/mutations/users';

const initialState = {
    user: '',
    password: ''
}

class Login extends Component {
    state = {
        ...initialState
    }
    updateState = e =>{
        const {name, value} = e.target;

        this.setState({
            [name]:value
        });
    }
    clearState = () =>{
        this.setState({...initialState})
    }
    initialSesion = async (e, autenticateUser) =>{
        e.preventDefault();

        await autenticateUser().then(({data})=>{
            localStorage.setItem('Token', data.authenticateUser.token)
        });

        await this.props.refetch();
        
        this.clearState();

        setTimeout(()=>{this.props.history.push('/panel')},1000)
    }
    validateForm = ()=>{
        const {user, password} = this.state;

        const noValidate = !user || !password;
        return noValidate;
    }
    render() {
        const {user, password} = this.state;
        return (
            <Fragment>
                <h1 className="text-center mb-5">Iniciar Sesion</h1>
                <div className="row justify-content-center">
                    <Mutation mutation={AUTENTICAR_USUARIO} variables={{user,password}}>
                    {
                        (userAutenticate, {loading, error, data})=>{
                            return(
                                <form 
                                onSubmit={ e => this.initialSesion(e, userAutenticate) } 
                                className="col-md-8"
                            >

                            {error && <Error error={error.message} />}
                            

                            <div className="form-group">
                                <label>Usuario</label>
                                <input 
                                    onChange={this.updateState} 
                                    value={user}
                                    type="text" 
                                    name="user" 
                                    className="form-control" 
                                    placeholder="Nombre Usuario" 
                                />
                            </div>
                            <div className="form-group">
                                <label>Password</label>
                                <input 
                                    onChange={this.updateState} 
                                    value={password}
                                    type="password" 
                                    name="password" 
                                    className="form-control" 
                                    placeholder="Password"
                                />
                            </div>

                            <button 
                                disabled={ 
                                    loading || this.validateForm()
                                }
                                type="submit" 
                                className="btn btn-success float-right">
                                    Iniciar Sesión
                            </button>
                            
                        </form>
                            );
                        }
                    }
                    </Mutation>
                </div>
            </Fragment>
        );
    }
}

export default withRouter(Login);
