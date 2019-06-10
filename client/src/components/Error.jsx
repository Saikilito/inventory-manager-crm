import React from 'react';

const Error = ({error}) => {
    return (
        <p className="alert alert-danger text-center p-3 mb-3">
            {error}
        </p>
    );
}

export default Error;
