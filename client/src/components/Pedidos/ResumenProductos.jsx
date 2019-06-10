import React, {Fragment} from 'react';

const ResumenProducto = ({cantidad,order}) => {
    return (
        <Fragment>
            <div className="border mb-4 p-4">
                <p className="card-text font-weight-bold">Nombre del Producto:
                    <span className="font-weight-normal"> {order.nombre}</span>
                </p>
                <p className="card-text font-weight-bold">Cantidad:
                    <span className="font-weight-normal"> {cantidad}</span>
                </p>
                <p className="card-text font-weight-bold">Precio:
                    <span className="font-weight-normal"> $ {order.precio}</span>
                </p>
            </div>
        </Fragment>
    );
}

export default ResumenProducto;
