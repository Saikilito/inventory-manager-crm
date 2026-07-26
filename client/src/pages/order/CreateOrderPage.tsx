import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { usePlocState } from '@hooks/use-ploc-state';
import { useOrdersPloc } from '@contexts/order-context';
import { useCreateOrderDependencies } from './hooks/useCreateOrderDependencies';

import { IProduct } from '@shared-domain/product/product.entity';

import Spinkit from '../../components/Spinkit';
import Alert from '../../components/Alert';
import { ArrowLeft, ShoppingBag, Store } from 'lucide-react';

import { ClientSummary } from './components/ClientSummary';
import { SelectedProductsTable } from './components/SelectedProductsTable';
import { OrderActionsBar } from './components/OrderActionsBar';
import { NewClientInlineModal } from './components/NewClientInlineModal';
import { DeliveryFeeSelector } from './components/DeliveryFeeSelector';
import { ClientSelector } from './components/ClientSelector';
import { ProductSelector } from './components/ProductSelector';

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

  const {
    loading,
    error,
    client,
    setClient,
    clients,
    products,
    contexts,
    refreshClients,
    createClient,
  } = useCreateOrderDependencies(clientIdFromParams);

  const [selectedContextId, setSelectedContextId] = useState<string>('');
  const [isNewClientModalOpen, setIsNewClientModalOpen] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<Array<IProduct & { quantity: number }>>([]);
  const [deliveryFee, setDeliveryFee] = useState<number>(0);

  const subtotal = selectedProducts.reduce((sum, p) => sum + Number(p.sellingPrice) * p.quantity, 0);
  const total = subtotal + deliveryFee;

  const currentClientId = client?.id || clientIdFromParams;

  const outOfStockItems = selectedProducts
    .filter((p) => Number(p.stock) === 0)
    .map((p) => ({
      name: String(p.name),
      stock: Number(p.stock),
    }));

  const handleClientCreated = async () => {
    const newClients = await refreshClients();
    if (newClients && newClients.length > 0) {
      setClient(newClients[newClients.length - 1]);
    }
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
    if (!currentClientId) return;

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
          <ClientSelector
            clients={clients}
            selectedClient={client}
            onSelect={setClient}
            onOpenNewClientModal={() => setIsNewClientModalOpen(true)}
          />

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
                {contexts.map((ctx: { _id: string; name: string }) => (
                  <option key={ctx._id} value={ctx._id}>
                    {ctx.name}
                  </option>
                ))}
              </select>
            </div>

            <ProductSelector
              products={products}
              selectedProducts={selectedProducts}
              onSelectChange={setSelectedProducts}
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
        onCreateClient={createClient}
      />
    </div>
  );
};

export default CreateOrderPage;
