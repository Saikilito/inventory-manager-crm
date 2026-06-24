import React, { useEffect, useState, Fragment } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useApolloClient } from "@apollo/client";
import Select from "react-select";
import makeAnimated from "react-select/animated";

import { usePlocState } from "@hooks/use-ploc-state";
import { useOrdersPloc } from "@contexts/order-context";

import { makeApolloClientRepository } from "@modules/client/infrastructure/repositories/apollo-client.repository";
import { makeGetClientUseCase } from "@modules/client/application/use-cases/get-client";
import { makeApolloProductRepository } from "@modules/product/infrastructure/repositories/apollo-product.repository";
import { makeGetProductsUseCase } from "@modules/product/application/use-cases/get-products";

import { IClient } from "@shared-domain/client/client.entity";
import { IProduct } from "@shared-domain/product/product.entity";
import { IdVO } from "@shared-domain/shared/value-objects/id.vo";
import { PositiveNumberVO } from "@shared-domain/shared/value-objects/positive-number.vo";

// @ts-ignore
import Spinkit from "../../components/Spinkit";
// @ts-ignore
import Alert from "../../components/Alert";

const animatedComponents = makeAnimated();

interface CreateOrderPageProps {
  session: {
    _id: string;
    rol: string;
    name: string;
  };
}

export const CreateOrderPage: React.FC<CreateOrderPageProps> = ({
  session,
}) => {
  const { id: clientId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const ploc = useOrdersPloc();
  const state = usePlocState(ploc);
  const apolloClient = useApolloClient();

  const [loading, setLoading] = useState(true);
  const [client, setClient] = useState<IClient | null>(null);
  const [products, setProducts] = useState<IProduct[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Selected products local state
  const [selectedProducts, setSelectedProducts] = useState<
    Array<IProduct & { cantidad: number }>
  >([]);

  // Derive total during render (Vercel Best Practice 5.1!)
  const total = selectedProducts.reduce(
    (sum, p) => sum + Number(p.price) * p.cantidad,
    0,
  );

  useEffect(() => {
    const loadData = async () => {
      if (!clientId) return;

      try {
        const idVO = IdVO.create(clientId);

        // Load Client details
        const clientRepo = makeApolloClientRepository(apolloClient as any);
        const getClient = makeGetClientUseCase(clientRepo);
        const clientResult = await getClient.execute(idVO);

        if (clientResult.isFailure) {
          setError(
            clientResult.getError().message || "Error al cargar el cliente",
          );
          setLoading(false);
          return;
        }
        setClient(clientResult.getValue());

        // Load Products list
        const productRepo = makeApolloProductRepository(apolloClient as any);
        const getProducts = makeGetProductsUseCase(productRepo);
        const productsResult = await getProducts.execute(
          PositiveNumberVO.create(100),
          PositiveNumberVO.create(0),
        );

        if (productsResult.isFailure) {
          setError(
            productsResult.getError().message ||
              "Error al cargar los productos",
          );
        } else {
          setProducts(productsResult.getValue().products);
        }
      } catch (err: any) {
        setError(err.message || "Error al inicializar la pantalla");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [clientId, apolloClient]);

  const handleSelectChange = (selected: any) => {
    if (!selected) {
      setSelectedProducts([]);
      return;
    }

    const updated = (selected as any[]).map((p: any) => {
      const existing = selectedProducts.find(
        (ep) => String(ep.id) === String(p.id),
      );
      return {
        ...p,
        cantidad: existing ? existing.cantidad : 1,
      };
    });

    setSelectedProducts(updated);
  };

  const handleCountChange = (
    index: number,
    countVal: number,
    stock: number,
  ) => {
    let checkedCount = countVal;
    if (checkedCount > stock) {
      checkedCount = stock;
    }
    if (checkedCount < 1) {
      checkedCount = 1;
    }

    const updated = selectedProducts.map((p, idx) => {
      if (idx === index) {
        return { ...p, cantidad: checkedCount };
      }
      return p;
    });

    setSelectedProducts(updated);
  };

  const handleRemoveProduct = (productId: string) => {
    setSelectedProducts(
      selectedProducts.filter((p) => String(p.id) !== productId),
    );
  };

  const handleGenerateOrder = async () => {
    if (!clientId) return;

    const items = selectedProducts.map((p) => ({
      productId: String(p.id),
      quantity: p.cantidad,
    }));

    await ploc.createOrder(clientId, items, total, session._id);

    // If order created successfully without errors in state
    if (state.kind !== "orders:error") {
      navigate(`/orders/${clientId}`);
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center my-5">
        <Spinkit />
      </div>
    );
  }

  const alertComponent =
    error ||
    (state.kind === "orders:error" ? state.errorMessage : undefined) ? (
      <Alert message={error || state.errorMessage} />
    ) : (
      ""
    );

  return (
    <Fragment>
      <h1 className="text-center mb-5">Nuevo Pedido</h1>
      {alertComponent}

      <div className="row">
        {/* Left Column: Client Details */}
        <div className="col-md-3">
          <h2 className="text-center mb-3" style={{ fontSize: "1.25rem" }}>
            Resumen del cliente
          </h2>
          {client ? (
            <ul className="list-unstyled my-5">
              <li className="border font-weight-bold p-2">
                Nombre:{" "}
                <span className="font-weight-normal"> {client.firstName}</span>
              </li>
              <li className="border font-weight-bold p-2">
                Apellido:{" "}
                <span className="font-weight-normal"> {client.lastName}</span>
              </li>
              <li className="border font-weight-bold p-2">
                Edad: <span className="font-weight-normal"> {client.age}</span>
              </li>
              <li className="border font-weight-bold p-2">
                Emails:
                <div className="font-weight-normal mt-1">
                  {client.emails.map((e, idx) => (
                    <div key={idx} className="small text-muted">
                      {String(e)}
                    </div>
                  ))}
                </div>
              </li>
              <li className="border font-weight-bold p-2">
                Empresa:{" "}
                <span className="font-weight-normal"> {client.company}</span>
              </li>
              <li className="border font-weight-bold p-2">
                Tipo: <span className="font-weight-normal"> {client.type}</span>
              </li>
            </ul>
          ) : (
            <div className="alert alert-warning text-center">
              Cliente no encontrado
            </div>
          )}
        </div>

        {/* Right Column: Order Products Selection */}
        <div className="col-md-9">
          <h2 className="text-center mb-5" style={{ fontSize: "1.25rem" }}>
            Seleccionar Artículos
          </h2>

          <Select
            onChange={handleSelectChange}
            options={products as any}
            isMulti
            components={animatedComponents}
            placeholder="Seleccionar productos"
            getOptionValue={(option: any) => String(option.id)}
            getOptionLabel={(option: any) =>
              `${option.name} ($${option.price})`
            }
            value={selectedProducts as any}
            className="mb-4"
          />

          {selectedProducts.length > 0 && (
            <Fragment>
              <h3 className="text-center my-5" style={{ fontSize: "1.15rem" }}>
                Resumen & Cantidades
              </h3>

              <table className="table">
                <thead className="bg-success text-light">
                  <tr className="font-weight-bold">
                    <th>Producto</th>
                    <th>Precio</th>
                    <th>Inventario</th>
                    <th>Cantidad</th>
                    <th>Eliminar</th>
                  </tr>
                </thead>

                <tbody>
                  {selectedProducts.map((p, index) => {
                    const id = String(p.id);
                    const stock = Number(p.stock);

                    return (
                      <tr key={id}>
                        <td>{p.name}</td>
                        <td>${p.price}</td>
                        <td>{p.stock}</td>
                        <td>
                          <input
                            type="number"
                            min="1"
                            max={stock}
                            className="form-control col-md-6"
                            value={p.cantidad}
                            onChange={(e) =>
                              handleCountChange(
                                index,
                                Number(e.target.value),
                                stock,
                              )
                            }
                          />
                        </td>
                        <td>
                          <button
                            className="btn btn-danger"
                            type="button"
                            onClick={() => handleRemoveProduct(id)}
                          >
                            &times; Eliminar
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <p
                className="font-weight-bold float-right mt-3"
                style={{ fontSize: "1.2rem" }}
              >
                Total:{" "}
                <span
                  className="font-weight-normal badge badge-warning p-2"
                  style={{ fontSize: "1.2rem" }}
                >
                  $ {total}
                </span>
              </p>

              <div className="clearfix"></div>

              <button
                disabled={
                  selectedProducts.length === 0 ||
                  state.kind === "orders:loading"
                }
                onClick={handleGenerateOrder}
                type="button"
                className="btn btn-success float-right mt-3"
              >
                {state.kind === "orders:loading"
                  ? "Generando..."
                  : "Generar Pedido"}
              </button>
            </Fragment>
          )}
        </div>
      </div>
    </Fragment>
  );
};
export default CreateOrderPage;
