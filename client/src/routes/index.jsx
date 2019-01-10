import React, { Fragment } from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';

import Header from '../containers/Header';
import Clientes from '../pages/Clientes';
import NuevoCliente from '../pages/NuevoCliente';
import EditarCliente from '../pages/EditarCliente';

const Routes = () => {
	return (
		<Router>
			<Fragment>
				<Header />
				    <div className="container">
				    	<Switch>
				    		<Route exact path="/" component={Clientes}/>
				    		<Route exact path="/cliente/editar/:id" component={EditarCliente}/>
				    		<Route exact path="/cliente/nuevo" component={NuevoCliente}/>
				    	</Switch>
				    </div>
			</Fragment>
		</Router>
	);
};

export default Routes;
