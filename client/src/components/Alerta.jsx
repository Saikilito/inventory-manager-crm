import React from 'react';

const Alerta = ({message}) => {
    return (
        <p className="alert alert-success py-3 text-center py-2 my-2">
            {message}
        </p>
    );
}

export default Alerta;
