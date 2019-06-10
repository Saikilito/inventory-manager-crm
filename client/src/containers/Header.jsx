import React, { Fragment } from 'react';
import { Link } from 'react-router-dom';

import OutSession from '../components/OutSession';
import RegisterButton from '../components/RegisterButtom';

const Header = ({ session }) => {
	const Auth = session.getUser ? <Authenticate session={session.getUser}/> : <NoAuthenticate />;
	return (
		<nav className="navbar navbar-expand-lg navbar-dark bg-primary justify-content-between d-flex mb-5">
			<div className="container">{Auth}</div>
		</nav>
	);
};

const Authenticate = ({session}) => (
	<Fragment>
		<Link to="/" className="navbar-brand text-light font-weight-bold">
			CRM
		</Link>
		<button
			className="navbar-toggler"
			type="button"
			data-toggle="collapse"
			data-target="#navegacion"
			aria-controls="navegacion"
			aria-expanded="false"
			aria-label="Toggle navigation"
		>
			<span className="navbar-toggler-icon" />
		</button>

		<div className="collapse navbar-collapse" id="navegacion">
			<ul className="navbar-nav ml-auto text-right">
				<li className="nav-item dropdown mr-lg-2 mb-2 mt-2 mt-lg-0">
					<button className="nav-link dropdown-toggle btn btn-block btn-success" data-toggle="dropdown">
						Clientes
					</button>
					<div className="dropdown-menu" aria-labelledby="navegacion">
						<Link to="/clientes" className="dropdown-item">
							Clientes
						</Link>
						<Link to="/cliente/nuevo" className="dropdown-item">
							Nuevo Cliente
						</Link>
					</div>
				</li>
				<li className="nav-item dropdown">
					<button className="nav-link dropdown-toggle btn btn-block btn-success" data-toggle="dropdown">
						Productos
					</button>
					<div className="dropdown-menu" aria-labelledby="navegacion">
						<Link to="/productos" className="dropdown-item">
							Productos
						</Link>
						<Link to="/producto/nuevo" className="dropdown-item">
							Nuevo Producto
						</Link>
					</div>
				</li>
				<li>
					{ session.rol === 'adm' ? <RegisterButton/> : null}
				</li>
                <li>
                    <OutSession />
                </li>
                
			</ul>
		</div>
	</Fragment>
);

const NoAuthenticate = () => (
	<h3 to="/" className="navbar-brand text-light font-weight-bold">
		CRM
	</h3>
);

export default Header;
