import React from 'react';

import { Query, Mutation } from 'react-apollo';
import { UN_PRODUCTO_QUERY } from '../../services/queries/products';
import { ACTUALIZAR_PEDIDO } from '../../services/mutations/pedidos';

import Spinkit from '../../components/Spinkit';
import ResumenProducto from '../../components/Pedidos/ResumenProductos';

const Pedido = (props) => {
    const { order, order:{estado} } = props;
    
    let borderClass

    if(estado === 'PENDIENTE') borderClass = 'border-ligth'
    else if(estado === 'CANCELADO') borderClass = 'border-danger'
    else borderClass = 'border-success'
console.log("que lo que", order)
	return (
		<div className="col-md-4">
			<div className={`card mb-3 ${borderClass}`}>
				<div className="card-body">
					<p className="card-text font-weight-bold ">
						Estado:
						<Mutation mutation={ACTUALIZAR_PEDIDO}>
							{(updateOrder) => 
								<select
									className="form-control my-3"
									value={order.estado}
									onChange={(e) => {
										const input = {
											...order,
											estado: e.target.value
										};

										console.log('input', input);
										updateOrder({ variables: {input} });
									}}
								>
									<option value="PENDIENTE">PENDIENTE</option>
									<option value="COMPLETADO">COMPLETADO</option>
									<option value="CANCELADO">CANCELADO</option>
								</select>
						}
						</Mutation>
					</p>
					<p className="card-text font-weight-bold">
						Pedido ID:
						<span className="font-weight-normal">
							{` `}
							{order._id}
						</span>
					</p>
					<p className="card-text font-weight-bold">
						Fecha Pedido:
						<span className="font-weight-normal">
							{` `}
							{new Date(Number(order.fecha)).toLocaleDateString()}
						</span>
					</p>
					
					<h3 className="card-text text-center mb-3 resaltar-texto">Artículos del pedido</h3>
					{order.pedido.map((pedido, i) => {
						// console.log("Pedido",pedido)
						return (
							<Query key={i} query={UN_PRODUCTO_QUERY} variables={{ id: pedido._id }}>
								{({ loading, error, data }) => {
									if (loading) return <Spinkit />;
									if (error) return `Eror ${error.message}`;

									return (
										<ResumenProducto
											order={data.getProduct}
											cantidad={pedido.cantidad}
											key={pedido._id}
										/>
									);
								}}
							</Query>
						);
					})}
					<p className="card-text font-weight-bold justify-content-end resaltar-texto bg-amarillo">
						Total:
						<span className="font-weight-normal">
							{' '}
							${` `}
							{order.total}
						</span>
					</p>
				</div>
			</div>
		</div>
	);
};

export default Pedido;
