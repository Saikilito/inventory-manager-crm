import React, { Fragment } from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';

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

import Panel from '../pages/Panel/Panel'

const Routes = () => {
	return (
		<Router>
			<Fragment>
				<Header />
				    <div className="container">
				    	<Switch>
				    		<Route exact path="/clientes" component={Clientes}/>
				    		<Route exact path="/cliente/editar/:id" component={EditarCliente}/>
				    		<Route exact path="/cliente/nuevo" component={NuevoCliente}/>
				    		<Route exact path="/productos" component={Productos}/>
				    		<Route exact path="/producto/nuevo" component={NuevoProducto}/>
				    		<Route exact path="/producto/editar/:id" component={EditarProducto}/>
				    		<Route exact path="/pedidos/:id" component={PedidosCliente}/>
				    		<Route exact path="/pedido/nuevo/:id" component={NuevoPedido}/>
				    		<Route exact path="/panel" component={Panel}/>
				    		<Route exact path="/registro" component={Register}/>
				    		<Route exact path="/login" component={Login}/>
				    	</Switch>
				    </div>
			</Fragment>
		</Router>
	);
};

export default Routes;
