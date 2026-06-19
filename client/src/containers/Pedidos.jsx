import React, { Component, Fragment } from "react";
import Select from "react-select";
import makeAnimated from "react-select/animated";

import Resumen from "../components/Pedidos/Resumen";
import Error from "../components/Error";
import GenerarPedido from "../components/Pedidos/GenerarPedido";

const animatedComponents = makeAnimated();

class Pedidos extends Component {
  state = {
    productos: [],
    total: 0,
  };
  handleChange = (selectedProducts) => {
    if (!selectedProducts) {
      this.setState({ productos: [], total: 0 });
      return;
    }

    const clonedProducts = selectedProducts.map((p) => {
      const existing = this.state.productos.find((ep) => ep._id === p._id);
      return {
        ...p,
        cantidad: existing ? existing.cantidad : 1,
      };
    });

    this.setState({ productos: clonedProducts }, () => {
      this.updateTotal();
    });
  };
  handleCount = (e, i) => {
    const cantidad = Number(e.target.value) || 0;
    const productos = this.state.productos.map((prod, idx) => {
      if (idx === i) {
        return { ...prod, cantidad };
      }
      return prod;
    });

    this.setState({ productos }, () => {
      this.updateTotal();
    });
  };
  updateTotal = () => {
    const productos = this.state.productos;

    if (productos.length === 0) {
      this.setState({
        total: 0,
      });
      return null;
    }

    let nuevoTotal = 0;

    //Opracion de cantidad * precio
    productos.map(
      (producto) => (nuevoTotal += producto.cantidad * producto.precio),
    );
    if (!nuevoTotal) nuevoTotal = 0;
    this.setState({ total: nuevoTotal });
  };
  deleteProduct = (_id) => {
    const { productos } = this.state;
    const productosRestantes = productos.filter((e) => e._id !== _id);
    this.setState(
      {
        productos: productosRestantes,
      },
      () => {
        this.updateTotal();
      },
    );
  };
  render() {
    const sellerID = this.props.session._id;
    const mensaje =
      this.state.total < 0 ? (
        <Error error="Las cantidades no pueden ser negativas"></Error>
      ) : (
        ""
      );
    return (
      <Fragment>
        <h2 className="text-center mb-5">Seleccionar Artículos</h2>
        {mensaje}
        <Select
          onChange={this.handleChange}
          options={this.props.products}
          isMulti
          components={animatedComponents}
          placeholder={"Seleccionar productos"}
          getOptionValue={(options) => options._id}
          getOptionLabel={(options) => options.nombre}
          value={this.state.productos}
        />
        <Resumen
          productos={this.state.productos}
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
