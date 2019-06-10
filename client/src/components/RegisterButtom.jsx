import React from 'react';
import {Link} from 'react-router-dom';

const RegisterButton = () => {
    return (
        <div>
            <Link to='/registro' className="nav-link btn btn-warning ml-lg-2 mt-2 mt-lg-0">Crear Usuarios</Link>
        </div>
    );
}

export default RegisterButton;
