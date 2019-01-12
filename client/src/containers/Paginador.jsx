import React, { Component } from 'react';

class Paginador extends Component {
    state = {
        paginador : {
            pages: Math.ceil(this.props.total / this.props.limit)
        }
    }
    render() {
        const { actual } = this.props;
        const { pages } = this.state.paginador
        const btnAnterior = (actual > 1) ? 
            
            <button onClick={this.props.paginaAnterior} className="btn btn-success mr-2">&laquo; Anterior</button>
            :  
            ''
        const btnSiguiente = ( actual !== pages) ?
            <button onClick={this.props.paginaSiguiente} className="btn btn-success">Siguiente &raquo;</button>
            :  
            ''

        return (
            <div className="mt-5 d-flex justify-content-center mb-5">
                { btnAnterior }
                { btnSiguiente}
            </div>
        );
    }
}

export default Paginador;
