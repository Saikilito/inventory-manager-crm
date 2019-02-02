import React, { Component, Fragment } from 'react';

import {Query} from 'react-apollo';
import {UN_PRODUCTO_QUERY} from '../../services/queries/products';

import FormEditProduct from '../../containers/FormEditProduct';

class EditarProducto extends Component {
    render() {
        const {id} = this.props.match.params;
        return (
            <Fragment>
                <h1 className="text-center my-3">Editar Producto</h1>
                <div className="row justify-content-center">
                    <Query query={UN_PRODUCTO_QUERY} variables={{id}}>
                    {
                        ({loading, error, data, refetch})=>{
                            if(loading) return 'Loading...'
                            if(error) return `Error ${error}`
                            console.log(data.getProduct._id)

                            return(
                               <FormEditProduct
                                    product={data.getProduct}
                                    
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

export default EditarProducto;
