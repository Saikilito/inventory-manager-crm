import React, { Component, Fragment } from 'react';
import { withRouter } from 'react-router-dom';

import { Mutation } from 'react-apollo';
import { CREAR_USUARIO } from '../../services/mutations/users';

import Error from '../../components/Error'
const initialState = {
    user: '',
    password: '',
    repeatPassword:''
}

class Register extends Component {
    state = {
        ...initialState
    }
    updateState = (e) =>{
        const {name, value} = e.target
        this.setState({
            [name]:value
        })
    }
    validateForm = () => {
        const { user, password, repeatPassword} = this.state

        const noValidate = !user || !password || password !== repeatPassword
        console.log(noValidate);

        return noValidate
    }
    createRegister = (e, setUser) =>{
        e.preventDefault()

        setUser().then(data=> this.setState({...initialState}))

        this.props.history.push('/login');


    }
    render() {
        const {user, password} = this.state;
        return (
            <Fragment>
                <h1 className="text-center mb-5">Nuevo usuario</h1>
                <div className="row  justify-content-center">
                <Mutation mutation={CREAR_USUARIO} variables={{user, password}}>
                { 
                  (setUser, {loading, error, data}) =>(
                  <form className="col-md-8"
                        onSubmit={e => this.createRegister(e, setUser)}
                  >
                  { console.log("Bebeee",error)}
                  { error && <Error error={error.message}/>}
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
                  </div>
                  <div className="form-group">
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
                  <div className="form-group">
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

                  <button 
                        disabled={this.validateForm()}
                        type="submit" 
                        className="btn btn-success float-right">
                          Crear Usuario
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

export default withRouter(Register);
