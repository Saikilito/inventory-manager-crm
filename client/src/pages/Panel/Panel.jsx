import React, { Fragment } from "react";

import TopClients from "../../containers/PanelClientes";
import TopSellers from "../../containers/PanelSellers";

const Panel = () => {
  return (
    <Fragment>
      <h1 className="text-center my-5">Top 10 clientes que más compran</h1>
      <TopClients />

      <h1 className="text-center my-5">Top 10 mejores Vendedores</h1>
      <TopSellers />
    </Fragment>
  );
};

export default Panel;
