import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApolloClient, useQuery, ApolloClient, NormalizedCacheObject } from '@apollo/client';
import Select from 'react-select';
import makeAnimated from 'react-select/animated';

import { usePlocState } from '@hooks/use-ploc-state';
import { useOrdersPloc } from '@contexts/order-context';

import { makeApolloClientRepository } from '@modules/client/infrastructure/repositories/apollo-client.repository';
import { makeGetClientUseCase } from '@modules/client/application/use-cases/get-client';
import { makeGetClientsUseCase } from '@modules/client/application/use-cases/get-clients';
import { makeApolloProductRepository } from '@modules/product/infrastructure/repositories/apollo-product.repository';
import { makeGetProductsUseCase } from '@modules/product/application/use-cases/get-products';
import { GET_ALL_CONTEXTS } from '@modules/product/infrastructure/graphql/queries';

import { IClient } from '@shared-domain/client/client.entity';
import { IProduct } from '@shared-domain/product/product.entity';
import { IdVO } from '@shared-domain/shared/value-objects/id.vo';
import { PositiveNumberVO } from '@shared-domain/shared/value-objects/positive-number.vo';
import { NonNegativeNumberVO } from '@shared-domain/shared/value-objects/non-negative-number.vo';

import Spinkit from '../../components/Spinkit';
import Alert from '../../components/Alert';
import { ArrowLeft, ShoppingBag, Store, UserPlus } from 'lucide-react';
import { getFullName } from '@utils/formatters';

import ClientSummary from './components/ClientSummary';
import SelectedProductsTable from './components/SelectedProductsTable';
import OrderActionsBar from './components/OrderActionsBar';
import { NewClientInlineModal } from './components/NewClientInlineModal';
import DeliveryFeeSelector from './components/DeliveryFeeSelector';

const animatedComponents = makeAnimated();

interface CreateOrderPageProps {
  session: {
    _id: string;
    role: string;
    name: string;
  };
}

export const CreateOrderPage: React.FC<CreateOrderPageProps> = ({ session }) => {
  const { clientId: clientIdFromParams } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const ploc = useOrdersPloc();
  const state = usePlocState(ploc);
  const apolloClient = useApolloClient();

  const [loading, setLoading] = useState(true);
  const [client, setClient] = useState<IClient | null>(null);
  const [clients, setClients] = useState<IClient[]>([]);
  const [products, setProducts] = useState<IProduct[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedContextId, setSelectedContextId] = useState<string>('');
  const [isNewClientModalOpen, setIsNewClientModalOpen] = useState(false);

  const [selectedProducts, setSelectedProducts] = useState<Array<IProduct & { quantity: number }>>([]);
  const [deliveryFee, setDeliveryFee] = useState<number>(0);

  const { data: contextsData } = useQuery(GET_ALL_CONTEXTS, { fetchPolicy: 'cache-first' });

  const subtotal = selectedProducts.reduce((sum, p) => sum + Number(p.sellingPrice) * p.quantity, 0);
  const total = subtotal + deliveryFee;

  const currentClientId = client?.id || clientIdFromParams;

  const outOfStockItems = selectedProducts
    .filter((p) => Number(p.stock) === 0)
    .map((p) => ({
      name: String(p.name),
      stock: Number(p.stock),
    }));

  useEffect(() => {
    const loadData = async () => {
      try {
        const clientRepo = makeApolloClientRepository(apolloClient as ApolloClient<NormalizedCacheObject>);

        const getClients = makeGetClientsUseCase(clientRepo);
        const clientsResult = await getClients.execute();
        if (!clientsResult.isFailure) {
          setClients(clientsResult.getValue().clients);
        }

        if (clientIdFromParams) {
          const idVO = IdVO.create(clientIdFromParams);
          const getClient = makeGetClientUseCase(clientRepo);
          const clientResult = await getClient.execute(idVO);

          if (!clientResult.isFailure) {
            setClient(clientResult.getValue());
          }
        }

        const productRepo = makeApolloProductRepository(apolloClient as ApolloClient<NormalizedCacheObject>);
        const getProducts = makeGetProductsUseCase(productRepo);
        const productsResult = await getProducts.execute(PositiveNumberVO.create(100), NonNegativeNumberVO.create(0));

        if (!productsResult.isFailure) {
          setProducts(productsResult.getValue().products);
        }
      } catch (err: unknown) {
        const error = err as Error;
        setError(error.message || 'Error initializing page');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [clientIdFromParams, apolloClient]);

  const handleClientSelect = (selectedOption: { value: string; label: string } | null) => {
    if (!selectedOption) {
      setClient(null);
      return;
    }
    const selectedClient = clients.find((c) => String(c.id) === selectedOption.value);
    setClient(selectedClient || null);
  };

  const handleClientCreated = async () => {
    const clientRepo = makeApolloClientRepository(apolloClient as ApolloClient<NormalizedCacheObject>);
    const getClients = makeGetClientsUseCase(clientRepo);
    const clientsResult = await getClients.execute();
    if (!clientsResult.isFailure) {
      const newClients = clientsResult.getValue().clients;
      setClients(newClients);
      if (newClients.length > 0) {
        setClient(newClients[newClients.length - 1]);
      }
    }
  };

  const handleSelectChange = (selected: unknown) => {
    if (!selected) {
      setSelectedProducts([]);
      return;
    }

    const selectedList = selected as IProduct[];
    const updated = selectedList.map((p) => {
      const existing = selectedProducts.find((ep) => String(ep.id) === String(p.id));
      return { ...p, quantity: existing ? existing.quantity : 1 };
    });

    setSelectedProducts(updated);
  };

  const handleCountChange = (index: number, countVal: number, stock: number) => {
    let checkedCount = countVal;
    if (checkedCount > stock) checkedCount = stock;
    if (checkedCount < 1) checkedCount = 1;

    const updated = selectedProducts.map((p, idx) => (idx === index ? { ...p, quantity: checkedCount } : p));
    setSelectedProducts(updated);
  };

  const handleRemoveProduct = (productId: string) => {
    setSelectedProducts(selectedProducts.filter((p) => String(p.id) !== productId));
  };

  const handleGenerateOrder = async () => {
    if (!currentClientId) {
      setError('Please select a client first');
      return;
    }

    const items = selectedProducts.map((p) => ({
      productId: String(p.id),
      quantity: p.quantity,
    }));

    try {
      await ploc.createOrder(
        String(currentClientId),
        items,
        total,
        session._id,
        selectedContextId || undefined,
        deliveryFee,
      );
      navigate('/orders');
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinkit />
      </div>
    );
  }

  const alertMessage = error || (state.kind === 'orders:error' ? state.errorMessage : null);

  const clientOptions = clients.map((c) => ({
    value: String(c.id),
    label: `${getFullName(c)} ${c.nationalId ? `(${c.nationalId})` : ''}`,
  }));

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
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
            Create a new order by selecting a client and items.
          </p>
        </div>
      </div>

      {alertMessage && (
        <div className="max-w-3xl mx-auto">
          <Alert type="error" message={alertMessage} />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-5 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
              Select Client
            </h2>

            <Select
              options={clientOptions}
              onChange={handleClientSelect}
              value={client ? clientOptions.find((o) => o.value === String(client.id)) : null}
              placeholder="Search clients..."
              unstyled
              classNames={{
                control: ({ isFocused }) =>
                  `border !rounded-lg !bg-white dark:!bg-stone-950 !min-h-11 px-3 py-1 transition-all ${
                    isFocused
                      ? '!border-emerald-500 !ring-2 !ring-emerald-500/20'
                      : '!border-stone-200 dark:!border-stone-800'
                  }`,
                placeholder: () => 'text-stone-400 dark:text-stone-500 text-sm',
                singleValue: () => 'text-stone-900 dark:text-stone-100',
                menu: () =>
                  'bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg shadow-lg mt-1 overflow-hidden z-50',
                menuList: () => 'p-1 space-y-0.5 max-h-60 overflow-y-auto',
                option: ({ isFocused, isSelected }) =>
                  `rounded-md px-3 py-2 text-sm transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-semibold'
                      : isFocused
                        ? 'bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-100'
                        : 'text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-900'
                  }`,
              }}
            />

            <button
              onClick={() => setIsNewClientModalOpen(true)}
              className="w-full h-10 rounded-lg text-sm font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors flex items-center justify-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              Create New Client
            </button>
          </div>

          {client && <ClientSummary client={client} />}
        </div>

        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-5 shadow-sm space-y-5">
            <h2 className="text-sm font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider border-b border-stone-100 dark:border-stone-800 pb-2">
              Order Details
            </h2>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-semibold text-stone-600 dark:text-stone-400">
                <Store className="w-3.5 h-3.5" />
                Context / Store (Optional)
              </label>
              <select
                value={selectedContextId}
                onChange={(e) => setSelectedContextId(e.target.value)}
                className="block w-full px-3 py-2 h-10 text-sm bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-100 border border-stone-200 dark:border-stone-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm transition-all duration-150"
              >
                <option value="">General (No Context)</option>
                {(contextsData?.getAllContexts || []).map((ctx: { _id: string; name: string }) => (
                  <option key={ctx._id} value={ctx._id}>
                    {ctx.name}
                  </option>
                ))}
              </select>
            </div>

            <h2 className="text-sm font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider border-t border-stone-100 dark:border-stone-800 pt-4">
              Select Items
            </h2>

            <Select
              onChange={handleSelectChange}
              options={products as unknown as Array<{ value: string; label: string }>}
              isMulti
              components={animatedComponents}
              placeholder="Select products..."
              getOptionValue={(option) => String((option as unknown as IProduct).id)}
              getOptionLabel={(option) => {
                const prod = option as unknown as IProduct;
                const stock = Number(prod.stock);
                const price = `$${Number(prod.sellingPrice).toLocaleString()}`;
                const stockLabel = stock === 0 ? '⚠️ Sin stock' : '';
                return `${prod.name} (${price})${stockLabel ? ` — ${stockLabel}` : ''}`;
              }}
              value={selectedProducts as unknown as Array<{ value: string; label: string }>}
              unstyled
              classNames={{
                control: ({ isFocused }) =>
                  `border !rounded-lg !bg-white dark:!bg-stone-950 !min-h-11 px-3 py-1 transition-all ${
                    isFocused
                      ? 'border-stone-900 dark:border-stone-100 ring-2 ring-stone-950/5 dark:ring-stone-100/5'
                      : 'border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700'
                  }`,
                placeholder: () => 'text-stone-400 dark:text-stone-500 text-sm',
                noOptionsMessage: () => 'text-stone-400 dark:text-stone-500 text-sm py-2',
                multiValue: () =>
                  'bg-stone-100 dark:bg-stone-800 rounded-md m-0.5 border border-stone-200/50 dark:border-stone-700/50',
                multiValueLabel: () => 'text-stone-800 dark:text-stone-200 text-xs font-semibold px-2 py-1',
                multiValueRemove: () =>
                  'text-stone-400 hover:text-red-600 hover:bg-stone-200/50 dark:hover:bg-stone-700/50 rounded-r-md transition-colors px-1 cursor-pointer',
                menu: () =>
                  'bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg shadow-lg mt-1 overflow-hidden z-50',
                menuList: () => 'p-1 space-y-0.5 max-h-60 overflow-y-auto',
                option: ({ isFocused, isSelected, data }) => {
                  const prod = data as unknown as IProduct;
                  const isOutOfStock = Number(prod.stock) === 0;
                  return `rounded-md px-3 py-2 text-sm transition-colors cursor-pointer ${
                    isOutOfStock
                      ? 'bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400'
                      : isSelected
                        ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-950 font-semibold'
                        : isFocused
                          ? 'bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-100'
                          : 'text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-900'
                  }`;
                },
              }}
              styles={{
                input: (base) => ({ ...base, 'input:focus': { boxShadow: 'none' } }),
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

                <DeliveryFeeSelector deliveryFee={deliveryFee} onChange={setDeliveryFee} subtotal={subtotal} />

                <OrderActionsBar
                  total={total}
                  onCancel={() => navigate('/orders')}
                  onCreateOrder={handleGenerateOrder}
                  isDisabled={selectedProducts.length === 0 || !currentClientId}
                  isLoading={state.kind === 'orders:loading'}
                  outOfStockItems={outOfStockItems}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <NewClientInlineModal
        isOpen={isNewClientModalOpen}
        onClose={() => setIsNewClientModalOpen(false)}
        onSuccess={handleClientCreated}
        sellerId={session._id}
        apolloClient={apolloClient}
      />
    </div>
  );
};

export default CreateOrderPage;
