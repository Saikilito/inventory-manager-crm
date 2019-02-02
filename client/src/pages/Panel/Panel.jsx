import React, { Fragment } from 'react';

import TopCLientes from '../../components/PanelClientes'

const Panel = () => {
    return (
        <Fragment>
            <h1 className="text-center my-5">Top 10 clientes que más compran</h1>
            <TopCLientes/>
        </Fragment>
    );
}

export default Panel;
