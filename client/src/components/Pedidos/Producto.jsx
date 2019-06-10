import React, { Component, Fragment} from 'react';

class Producto extends Component {
    render() {
        const { producto:{nombre,precio,stock} } = this.props
        return (
            <Fragment>
                <tr>
                    <td>{nombre}</td>
                    <td>$ {precio}</td>
                    <td>  {stock}</td>
                    <td>  
                        <input type="number" min="1" className="form-control col-4"

                            onChange={e => {
                                if(e.target.value > stock || e.target.value < 0 ) e.target.value = 0;
                                this.props.handleCount(e,this.props.index)
                            }}
                        />
                    </td>
                    <td> 
                        <button className="btn btn-danger" type="button"
                            onClick={e=>this.props.deleteProduct(this.props._id)}
                        >
                            &times; Eliminar</button>
                    </td>
                </tr>
            </Fragment>
        );
    }
}

export default Producto;
