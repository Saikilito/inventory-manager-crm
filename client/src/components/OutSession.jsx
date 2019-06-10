import React from 'react';
import {withRouter} from 'react-router-dom';
import {ApolloConsumer} from 'react-apollo'

const outSessionUser = (client,history) => {
    localStorage.removeItem('Token');
    client.resetStore();
    history.push('/login');
}

const OutSession = ({history}) => {
    return (
        <ApolloConsumer>
        {
            client => {
                return(
                    <button className="nav-link btn btn-light ml-lg-2 mt-2 mt-lg-0"
                        onClick={()=>outSessionUser(client,history)}
                    >
                        <span style={{color:'#000'}}>Salir</span> 
                    </button>
                )
            }
        }
        </ApolloConsumer>
    );
}

export default withRouter(OutSession);
