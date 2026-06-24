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

import Spinkit from "../../components/Spinkit";
import Alert from "../../components/Alert";
import { ArrowLeft, User, Briefcase, Trash2, ShoppingBag } from "lucide-react";

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
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinkit />
      </div>
    );
  }

  const alertMessage = error || (state.kind === "orders:error" ? state.errorMessage : null);

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-stone-200 dark:border-stone-800 pb-5">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
          title="Volver"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-stone-500" />
            Nuevo Pedido
          </h1>
          <p className="text-sm text-stone-500 dark:text-stone-400">
            Crea un nuevo pedido seleccionando artículos y configurando sus cantidades.
          </p>
        </div>
      </div>

      {alertMessage && (
        <div className="max-w-3xl mx-auto">
          <Alert type="error" message={alertMessage} />
        </div>
      )}

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Client Summary (col-span-4) */}
        <div className="lg:col-span-4">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-5 shadow-sm flex flex-col items-center">
            <h2 className="text-sm font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-5 self-start w-full border-b border-stone-100 dark:border-stone-800 pb-2">
              Resumen del cliente
            </h2>
            {client ? (
              <>
                <div className="w-16 h-16 rounded-full bg-stone-100 dark:bg-stone-800/80 flex items-center justify-center mb-4 text-stone-600 dark:text-stone-300">
                  {client.type === "corporate" || client.company ? (
                    <Briefcase className="w-8 h-8" />
                  ) : (
                    <User className="w-8 h-8" />
                  )}
                </div>

                <div className="w-full divide-y divide-stone-100 dark:divide-stone-800/60 text-sm">
                  <div className="py-3 flex justify-between gap-4">
                    <span className="font-medium text-stone-500 dark:text-stone-400">Cliente</span>
                    <span className="font-semibold text-stone-900 dark:text-stone-100 text-right">
                      {client.firstName} {client.lastName}
                    </span>
                  </div>
                  <div className="py-3 flex justify-between gap-4">
                    <span className="font-medium text-stone-500 dark:text-stone-400">Edad</span>
                    <span className="font-semibold text-stone-900 dark:text-stone-100 text-right">
                      {client.age} años
                    </span>
                  </div>
                  {client.company && (
                    <div className="py-3 flex justify-between gap-4">
                      <span className="font-medium text-stone-500 dark:text-stone-400">Empresa</span>
                      <span className="font-semibold text-stone-900 dark:text-stone-100 text-right">
                        {client.company}
                      </span>
                    </div>
                  )}
                  <div className="py-3 flex justify-between gap-4">
                    <span className="font-medium text-stone-500 dark:text-stone-400">Tipo</span>
                    <span className="font-semibold text-stone-900 dark:text-stone-100 capitalize text-right">
                      {client.type === "PREMIUM" ? "Premium" : "Básico"}
                    </span>
                  </div>
                  {client.emails && client.emails.length > 0 && (
                    <div className="py-3 space-y-1">
                      <span className="font-medium text-stone-500 dark:text-stone-400 block">Correos</span>
                      <div className="space-y-1 text-right">
                        {client.emails.map((e, idx) => (
                          <span key={idx} className="block text-xs text-stone-600 dark:text-stone-400 font-medium break-all">
                            {String(e)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="w-full">
                <Alert type="warning" message="Cliente no encontrado" />
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Order Products Selection (col-span-8) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-5 shadow-sm space-y-5">
            <h2 className="text-sm font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider border-b border-stone-100 dark:border-stone-800 pb-2">
              Seleccionar Artículos
            </h2>

            <Select
              onChange={handleSelectChange}
              options={products as any}
              isMulti
              components={animatedComponents}
              placeholder="Seleccionar productos..."
              getOptionValue={(option: any) => String(option.id)}
              getOptionLabel={(option: any) =>
                `${option.name} ($${Number(option.price).toLocaleString()})`
              }
              value={selectedProducts as any}
              unstyled
              classNames={{
                control: ({ isFocused }) =>
                  `border !rounded-lg !bg-white dark:!bg-stone-950 !min-h-11 px-3 py-1 transition-all ${
                    isFocused
                      ? "border-stone-900 dark:border-stone-100 ring-2 ring-stone-950/5 dark:ring-stone-100/5"
                      : "border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700"
                  }`,
                placeholder: () => "text-stone-400 dark:text-stone-500 text-sm",
                noOptionsMessage: () => "text-stone-400 dark:text-stone-500 text-sm py-2",
                multiValue: () => "bg-stone-100 dark:bg-stone-800 rounded-md m-0.5 border border-stone-200/50 dark:border-stone-700/50",
                multiValueLabel: () => "text-stone-800 dark:text-stone-200 text-xs font-semibold px-2 py-1",
                multiValueRemove: () => "text-stone-400 hover:text-red-600 hover:bg-stone-200/50 dark:hover:bg-stone-700/50 rounded-r-md transition-colors px-1 cursor-pointer",
                menu: () => "bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg shadow-lg mt-1 overflow-hidden z-50",
                menuList: () => "p-1 space-y-0.5 max-h-60 overflow-y-auto",
                option: ({ isFocused, isSelected }) =>
                  `rounded-md px-3 py-2 text-sm transition-colors cursor-pointer ${
                    isSelected
                      ? "bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-950 font-semibold"
                      : isFocused
                      ? "bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                      : "text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-900"
                  }`,
              }}
              styles={{
                input: (base) => ({
                  ...base,
                  "input:focus": {
                    boxShadow: "none",
                  },
                }),
              }}
            />

            {selectedProducts.length > 0 && (
              <div className="space-y-4 pt-4">
                <h3 className="text-sm font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                  Resumen & Cantidades
                </h3>

                <div className="border border-stone-200 dark:border-stone-800 rounded-xl overflow-hidden bg-white dark:bg-stone-950">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm">
                      <thead>
                        <tr className="bg-stone-50 dark:bg-stone-900/50 border-b border-stone-200 dark:border-stone-800 text-stone-500 dark:text-stone-400 font-bold">
                          <th className="px-4 py-3">Producto</th>
                          <th className="px-4 py-3">Precio</th>
                          <th className="px-4 py-3">Inventario</th>
                          <th className="px-4 py-3 text-center w-28">Cantidad</th>
                          <th className="px-4 py-3 text-right">Eliminar</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                        {selectedProducts.map((p, index) => {
                          const id = String(p.id);
                          const stock = Number(p.stock);

                          return (
                            <tr
                              key={id}
                              className="text-stone-900 dark:text-stone-100 hover:bg-stone-50/50 dark:hover:bg-stone-900/20 transition-colors"
                            >
                              <td className="px-4 py-3.5 font-medium">{p.name}</td>
                              <td className="px-4 py-3.5">${Number(p.price).toLocaleString()}</td>
                              <td className="px-4 py-3.5">
                                <span
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                    stock < 10
                                      ? "bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400"
                                      : "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400"
                                  }`}
                                >
                                  {stock} disp.
                                </span>
                              </td>
                              <td className="px-4 py-3.5 text-center">
                                <input
                                  type="number"
                                  min="1"
                                  max={stock}
                                  className="w-20 h-11 px-3 border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 rounded-lg text-center font-medium focus:outline-none focus:ring-2 focus:ring-stone-950 dark:focus:ring-stone-100"
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
                              <td className="px-4 py-3.5 text-right">
                                <button
                                  type="button"
                                  className="inline-flex items-center justify-center p-2 rounded-lg border border-red-200 dark:border-red-900/50 bg-white dark:bg-stone-950 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors cursor-pointer"
                                  onClick={() => handleRemoveProduct(id)}
                                  title="Eliminar artículo"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Total and Actions Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-850 rounded-xl">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                      Total del Pedido
                    </span>
                    <span className="text-2xl font-black text-stone-900 dark:text-stone-100">
                      ${total.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      className="px-5 py-2.5 text-sm font-semibold rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-900 transition-colors flex items-center gap-2 cursor-pointer"
                      onClick={() => navigate(`/orders/${clientId}`)}
                    >
                      Cancelar
                    </button>
                    <button
                      disabled={
                        selectedProducts.length === 0 ||
                        state.kind === "orders:loading"
                      }
                      onClick={handleGenerateOrder}
                      type="button"
                      className="px-6 py-2.5 text-sm font-semibold rounded-lg bg-stone-900 dark:bg-stone-50 text-white dark:text-stone-950 hover:bg-stone-800 dark:hover:bg-stone-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
                    >
                      {state.kind === "orders:loading" ? (
                        <>
                          <svg
                            className="animate-spin h-4 w-4 text-current"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          Generando...
                        </>
                      ) : (
                        "Generar Pedido"
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateOrderPage;
