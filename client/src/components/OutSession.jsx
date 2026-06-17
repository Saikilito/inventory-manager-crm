import React from 'react';
import { withRouter } from './RouterCompat.jsx';
import { useApolloClient } from '@apollo/client';

const outSessionUser = (client,history) => {
    localStorage.removeItem('Token');
    client.resetStore();
    history.push('/login');
}

const OutSession = ({history}) => {
    const client = useApolloClient();
    return (
        <button className="nav-link btn btn-light ml-lg-2 mt-2 mt-lg-0"
            onClick={()=>outSessionUser(client,history)}
        >
            <span style={{color:'#000'}}>Salir</span> 
        </button>
    );
}

export default withRouter(OutSession);
