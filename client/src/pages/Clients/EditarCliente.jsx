import React, { Component, Fragment } from 'react';
import { Query } from 'react-apollo';
import { UN_CLIENTE_QUERY } from '../../services/queries/clients'
import { CLIENTES_QUERY } from '../../services/queries/clients'

import FormEditClient from '../../containers/FormEditClient';

class EditarCliente extends Component {
    render() {
        const {id} = this.props.match.params
        
        return (
            <Fragment>
                <h2 className="text-center">Editar Cliente</h2>
                <div className="row justify-content-center">
                    <Query query={UN_CLIENTE_QUERY} variables={{id}} refetchQueries={CLIENTES_QUERY}>
                    {
                        ({loading,error,data, refetch})=>{
                            if(loading) return "Loading..."
                            if(error) return `Error ${error}`
                            
                            return(
                                <FormEditClient
                                    client={data.getClient}
                                    refetch={refetch}
                                />
                            )
                        }
                    }
                    </Query>
                </div>
            </Fragment>
        );
    }
}

export default EditarCliente;
