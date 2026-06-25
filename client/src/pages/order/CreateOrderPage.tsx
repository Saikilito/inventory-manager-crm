import React, { useEffect, useState } from "react";
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
import { NonNegativeNumberVO } from "@shared-domain/shared/value-objects/non-negative-number.vo";

import Spinkit from "../../components/Spinkit";
import Alert from "../../components/Alert";
import { ArrowLeft, ShoppingBag } from "lucide-react";

import ClientSummary from "./components/ClientSummary";
import SelectedProductsTable from "./components/SelectedProductsTable";
import OrderActionsBar from "./components/OrderActionsBar";

const animatedComponents = makeAnimated();

interface CreateOrderPageProps {
  session: {
    _id: string;
    role: string;
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
    Array<IProduct & { quantity: number }>
  >([]);

  // Derive total during render (Vercel Best Practice 5.1!)
  const total = selectedProducts.reduce(
    (sum, p) => sum + Number(p.price) * p.quantity,
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
            clientResult.getError().message || "Error loading client",
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
          NonNegativeNumberVO.create(0),
        );

        if (productsResult.isFailure) {
          setError(
            productsResult.getError().message ||
              "Error loading products",
          );
        } else {
          setProducts(productsResult.getValue().products);
        }
      } catch (err: any) {
        setError(err.message || "Error initializing page");
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
        quantity: existing ? existing.quantity : 1,
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
        return { ...p, quantity: checkedCount };
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
      quantity: p.quantity,
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
          title="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-stone-500" />
            New Order
          </h1>
          <p className="text-sm text-stone-500 dark:text-stone-400">
            Create a new order by selecting items and setting their quantities.
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
          <ClientSummary client={client} />
        </div>

        {/* Right Column: Order Products Selection (col-span-8) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-5 shadow-sm space-y-5">
            <h2 className="text-sm font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider border-b border-stone-100 dark:border-stone-800 pb-2">
              Select Items
            </h2>

            <Select
              onChange={handleSelectChange}
              options={products as any}
              isMulti
              components={animatedComponents}
              placeholder="Select products..."
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
                  Summary & Quantities
                </h3>

                <SelectedProductsTable
                  selectedProducts={selectedProducts}
                  onCountChange={handleCountChange}
                  onRemoveProduct={handleRemoveProduct}
                />

                <OrderActionsBar
                  total={total}
                  onCancel={() => navigate(`/orders/${clientId}`)}
                  onCreateOrder={handleGenerateOrder}
                  isDisabled={selectedProducts.length === 0}
                  isLoading={state.kind === "orders:loading"}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateOrderPage;
