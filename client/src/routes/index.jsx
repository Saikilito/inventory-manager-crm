import React, { Fragment } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Header from "../containers/Header";

import Clientes from "../pages/Clients/Clientes";
import NuevoCliente from "../pages/Clients/NuevoCliente";
import EditarCliente from "../pages/Clients/EditarCliente";

import Productos from "../pages/Products/Productos";
import NuevoProducto from "../pages/Products/NuevoProducto";
import EditarProducto from "../pages/Products/EditProduct";

import PedidosCliente from "../pages/Orders/PedidosCliente";
import NuevoPedido from "../pages/Orders/NuevoPedido";

import Register from "../pages/Auth/register";
import Login from "../pages/Auth/login";
import Session from "../services/Session";

import Panel from "../pages/Panel/Panel";

const AppRoutes = ({ session, refetch }) => {
  const getUser = session;
 
  const msg = getUser ? (
    `Bienvenido: ${getUser.name}`
  ) : (
    <Navigate to="/login" replace />
  );
  return (
    <Router>
      <Fragment>
        <Header session={session} />
        <div className="container">
          <p className="text-right">{msg}</p>
          <Routes>
            <Route path="/" element={<Navigate to="/clientes" replace />} />
            {/** Clients */}
            <Route path="/clientes" element={<Clientes session={getUser} />} />
            <Route
              path="/cliente/nuevo"
              element={<NuevoCliente session={getUser} />}
            />
            <Route path="/cliente/editar/:id" element={<EditarCliente />} />

            {/** Products */}
            <Route path="/productos" element={<Productos />} />
            <Route path="/producto/nuevo" element={<NuevoProducto />} />
            <Route path="/producto/editar/:id" element={<EditarProducto />} />

            {/** Orders */}
            <Route path="/pedidos/:id" element={<PedidosCliente />} />
            <Route
              path="/pedido/nuevo/:id"
              element={<NuevoPedido session={getUser} />}
            />

            {/** Panel and Login */}
            <Route
              path="/panel"
              element={getUser ? <Panel /> : <Navigate to="/login" replace />}
            />
            <Route path="/registro" element={<Register session={getUser} />} />
            <Route path="/login" element={<Login refetch={refetch} />} />
          </Routes>
        </div>
      </Fragment>
    </Router>
  );
};

export default Session(AppRoutes);
