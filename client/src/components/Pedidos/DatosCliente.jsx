import React, { Fragment } from 'react';
import { Query } from 'react-apollo'
import { UN_CLIENTE_QUERY} from '../../services/queries/clients';

const DatosCliente = ({ _id }) => {
    return (
        <Fragment>
            <h2 className="text-center mb-3">Resumen del cliente</h2>
            <Query query={UN_CLIENTE_QUERY} variables={_id} pollInterval={1000}>
                {
                    ({ loading, error, data, startPolling, stopPolling }) => {
                        if (loading) return 'Loading...';
                        if (error) return `Error ${error.message}`;
            
                        const {nombre, apellido, empresa, emails, edad, tipo} = data.getClient
                        return(
                            <Fragment>
                                <ul className="list-unstyled my5">
                                    <li className="border font-weight-bold p-2">Nombre: 
                                        <span className="font-weight-normal"> {nombre}</span>
                                    </li>
                                    <li className="border font-weight-bold p-2">Apellido: 
                                        <span className="font-weight-normal"> {apellido}</span>
                                    </li>
                                    <li className="border font-weight-bold p-2">Edad: 
                                        <span className="font-weight-normal"> {edad}</span>
                                    </li>
                                    <li className="border font-weight-bold p-2">Emails: 
                                        <span className="font-weight-normal">{emails.map((email,i)=><pre key={i}>{`${email.email}`}</pre>)}</span>
                                    </li>
                                    <li className="border font-weight-bold p-2">Empresa: 
                                        <span className="font-weight-normal"> {empresa}</span>
                                    </li>
                                    <li className="border font-weight-bold p-2">Tipo: 
                                        <span className="font-weight-normal"> {tipo}</span>
                                    </li>
                                </ul>
                            </Fragment>
                        );
                }}
            </Query>
        </Fragment>
    );
}

export default DatosCliente;
