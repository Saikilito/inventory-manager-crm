import React, { useState, useEffect, useRef, Fragment } from 'react';
import { Link } from 'react-router-dom';

import OutSession from '../components/OutSession';
import RegisterButton from '../components/RegisterButtom';

const Header = ({ session }) => {
	const getUser = session;
	const Auth = getUser ? <Authenticate session={getUser}/> : <NoAuthenticate />;
	return (
		<nav className="navbar navbar-expand-lg navbar-dark bg-primary justify-content-between d-flex mb-5">
			<div className="container">{Auth}</div>
		</nav>
	);
};

const Authenticate = ({session}) => {
	const [clientesOpen, setClientesOpen] = useState(false);
	const [productosOpen, setProductosOpen] = useState(false);
	const [navOpen, setNavOpen] = useState(false);

	const clientesRef = useRef(null);
	const productosRef = useRef(null);

	useEffect(() => {
		const handleClickOutside = (event) => {
			if (clientesRef.current && !clientesRef.current.contains(event.target)) {
				setClientesOpen(false);
			}
			if (productosRef.current && !productosRef.current.contains(event.target)) {
				setProductosOpen(false);
			}
		};

		document.addEventListener('mousedown', handleClickOutside);
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, []);

	const closeDropdowns = () => {
		setClientesOpen(false);
		setProductosOpen(false);
		setNavOpen(false);
	};

	return (
		<Fragment>
			<Link to="/" className="navbar-brand text-light font-weight-bold" onClick={closeDropdowns}>
				CRM
			</Link>
			<button
				className="navbar-toggler"
				type="button"
				onClick={() => setNavOpen(!navOpen)}
				aria-controls="navegacion"
				aria-expanded={navOpen}
				aria-label="Toggle navigation"
			>
				<span className="navbar-toggler-icon" />
			</button>

			<div className={`collapse navbar-collapse ${navOpen ? 'show' : ''}`} id="navegacion">
				<ul className="navbar-nav ml-auto text-right">
					<li 
						ref={clientesRef} 
						className={`nav-item dropdown mr-lg-2 mb-2 mt-2 mt-lg-0 ${clientesOpen ? 'show' : ''}`}
					>
						<button 
							className="nav-link dropdown-toggle btn btn-block btn-success text-white" 
							type="button"
							onClick={() => {
								setClientesOpen(!clientesOpen);
								setProductosOpen(false); // close other dropdown
							}}
							aria-haspopup="true"
							aria-expanded={clientesOpen}
						>
							Clientes
						</button>
						<div className={`dropdown-menu ${clientesOpen ? 'show' : ''}`} aria-labelledby="navegacion">
							<Link to="/clientes" className="dropdown-item" onClick={closeDropdowns}>
								Clientes
							</Link>
							<Link to="/cliente/nuevo" className="dropdown-item" onClick={closeDropdowns}>
								Nuevo Cliente
							</Link>
						</div>
					</li>
					<li 
						ref={productosRef} 
						className={`nav-item dropdown ${productosOpen ? 'show' : ''}`}
					>
						<button 
							className="nav-link dropdown-toggle btn btn-block btn-success text-white" 
							type="button"
							onClick={() => {
								setProductosOpen(!productosOpen);
								setClientesOpen(false); // close other dropdown
							}}
							aria-haspopup="true"
							aria-expanded={productosOpen}
						>
							Productos
						</button>
						<div className={`dropdown-menu ${productosOpen ? 'show' : ''}`} aria-labelledby="navegacion">
							<Link to="/productos" className="dropdown-item" onClick={closeDropdowns}>
								Productos
							</Link>
							<Link to="/producto/nuevo" className="dropdown-item" onClick={closeDropdowns}>
								Nuevo Producto
							</Link>
						</div>
					</li>
					<li>
						{ session.rol === 'adm' ? <RegisterButton /> : null}
					</li>
					<li>
						<OutSession />
					</li>
				</ul>
			</div>
		</Fragment>
	);
};

const NoAuthenticate = () => (
	<h3 to="/" className="navbar-brand text-light font-weight-bold">
		CRM
	</h3>
);

export default Header;
