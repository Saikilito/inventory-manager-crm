import React, { Component, Fragment } from 'react';
import Select from 'react-select';
import Animated from 'react-select/lib/animated';

import Resumen from '../components/Pedidos/Resumen';
import Error from '../components/Error';
import GenerarPedido from '../components/Pedidos/GenerarPedido';


class Pedidos extends Component {
    state = {
        productos: [],
        total:0
    }
    handleChange = (productos) => {
        this.setState({productos},()=>{
            this.updateTotal()
        })
    }
    handleCount = (e, i) => {
        
        const cantidad = e.target.value
        const productos = this.state.productos;        
        
        productos[i].cantidad = Number(cantidad)
    
        //Agregar al state
        this.setState({productos}, ()=>{
            this.updateTotal();
        })
    }
    updateTotal = () =>{
        const productos = this.state.productos;
        console.log(productos.length)
        if(productos.length === 0){
            this.setState({
                total:0
            })
            return null ;
        }

        let nuevoTotal = 0;

        //Opracion de cantidad * precio
        productos.map((producto)=> nuevoTotal += (producto.cantidad * producto.precio))
        if(!nuevoTotal) nuevoTotal = 0;
        this.setState({total: nuevoTotal})

    }
    deleteProduct = (_id) => {
        const {productos} = this.state
        const productosRestantes = productos.filter(e => e._id !== _id)
        this.setState({
            productos: productosRestantes
        }, ()=>{
            this.updateTotal()
        })
    }
    render() {
        const sellerID = this.props.session._id
        const mensaje = ( this.state.total < 0 ) ? <Error error="Las cantidades no pueden ser negativas"></Error>:'';
        return (
            <Fragment>
                <h2 className="text-center mb-5">Seleccionar Artículos</h2>
                {mensaje}
                <Select 
                    onChange={this.handleChange}
                    options={this.props.products}
                    isMulti
                    components={Animated()}
                    placeholder={"Seleccionar productos"}
                    getOptionValue={options => options._id}
                    getOptionLabel={options => options.nombre}
                    value={this.state.productos}
                />
                <Resumen productos={this.state.productos}
                    handleCount={this.handleCount}
                    deleteProduct={this.deleteProduct}
                />

                <p className="font-weight bold float-right mt-3">
                    Total:
                    <span className="font-weight-normal">$ {this.state.total}</span>
                </p>

                <GenerarPedido
                    productos={this.state.productos}
                    total={this.state.total}
                    cliente={this.props._id}
                    sellerID={sellerID}
                />
            </Fragment>
        );
    }
}

export default Pedidos;
