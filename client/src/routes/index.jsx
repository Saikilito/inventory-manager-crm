import React, { Fragment } from 'react';
import { BrowserRouter as Router, Route, Switch, Redirect } from 'react-router-dom';

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

import Panel from '../pages/Panel/Panel'


const Routes = ({session, refetch}) => {
	const msg = session.getUser ? `Bienvenido: ${session.getUser.name}`: <Redirect to='/login'/>
	return (
		<Router>
			<Fragment>
				<Header session={session}/>
				    <div className="container">
					<p className="text-right">{msg}</p>
				    	<Switch>
				    		<Route exact path="/clientes" render={()=><Clientes session={session.getUser}/>}/>
				    		<Route exact path="/cliente/editar/:id" component={EditarCliente}/>
				    		<Route exact path="/cliente/nuevo" render={()=><NuevoCliente session={session.getUser}/>}/>
				    		<Route exact path="/productos" component={Productos}/>
				    		<Route exact path="/producto/nuevo" render={()=><NuevoProducto/>}/>
				    		<Route exact path="/producto/editar/:id" component={EditarProducto}/>
				    		<Route exact path="/pedidos/:id" component={PedidosCliente}/>
				    		<Route exact path="/pedido/nuevo/:id" render={()=><NuevoPedido session={session.getUser}/> }/>
				    		<Route exact path="/panel" component={Panel}/>
				    		<Route exact path="/registro" render={()=> <Register session={session.getUser} />}/>
				    		<Route exact path="/login" render={()=><Login refetch={refetch}/>}/>
				    	</Switch>
				    </div>
			</Fragment>
		</Router>
	);
};

export default Session(Routes);
