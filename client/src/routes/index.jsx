import React, { Fragment } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import Header from '../containers/Header';

import Clientes from '../pages/Clients/Clientes';
import NuevoCliente from '../pages/Clients/NuevoCliente';
import EditarCliente from '../pages/Clients/EditarCliente';

import Productos from '../pages/Products/Productos';
import NuevoProducto from '../pages/Products/NuevoProducto';
import EditarProducto from '../pages/Products/EditProduct';

import PedidosCliente from '../pages/Pedidos/PedidosCliente';
import NuevoPedido from '../pages/Pedidos/NuevoPedido';

import Register from '../pages/Auth/register';
import Login from '../pages/Auth/login';
import Session from '../services/Session';

import Panel from '../pages/Panel/Panel';


const AppRoutes = ({session, refetch}) => {
	const msg = session.getUser ? `Bienvenido: ${session.getUser.name}`: <Navigate to='/login' replace />;
	return (
		<Router>
			<Fragment>
				<Header session={session}/>
				    <div className="container">
					<p className="text-right">{msg}</p>
				    	<Routes>
				    		<Route path="/clientes" element={<Clientes session={session.getUser} />} />
				    		<Route path="/cliente/editar/:id" element={<EditarCliente />} />
				    		<Route path="/cliente/nuevo" element={<NuevoCliente session={session.getUser} />} />
				    		<Route path="/productos" element={<Productos />} />
				    		<Route path="/producto/nuevo" element={<NuevoProducto />} />
				    		<Route path="/producto/editar/:id" element={<EditarProducto />} />
				    		<Route path="/pedidos/:id" element={<PedidosCliente />} />
				    		<Route path="/pedido/nuevo/:id" element={<NuevoPedido session={session.getUser} />} />
				    		<Route path="/panel" element={<Panel />} />
				    		<Route path="/registro" element={<Register session={session.getUser} />} />
				    		<Route path="/login" element={<Login refetch={refetch} />} />
				    	</Routes>
				    </div>
			</Fragment>
		</Router>
	);
};

export default Session(AppRoutes);
