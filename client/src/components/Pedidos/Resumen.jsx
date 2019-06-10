import React, { Fragment } from 'react';
import Producto from '../../components/Pedidos/Producto';

const Resumen = (props) => {
    const productos = props.productos
    if(productos.length === 0) return null
    return (
        <Fragment>
            <h1 className="text-center my-5">Resumen & Cantidades</h1>

            <table className="table">
                <thead className="bg-success text-light">
                    <tr className="font-weight-bold">
                        <th>Producto</th>
                        <th>Precio</th>
                        <th>Inventario</th>
                        <th>Cantidad</th>
                        <th>Eliminar</th>
                    </tr>
                </thead>

                <tbody>
                  {
                    productos.map((e,i)=>
                        <Producto key={e._id}
                            _id={e._id}
                            producto={e}
                            index={i}
                            handleCount={props.handleCount}
                            deleteProduct={props.deleteProduct}
                        />
                    )
                  }
                </tbody>
            </table>
        </Fragment>
    );
}

export default Resumen;
