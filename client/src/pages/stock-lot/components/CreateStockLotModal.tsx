import React, { useState, useMemo } from "react";
import type { CreateStockLotInput } from "../../../modules/product/infrastructure/graphql/stock-lot-types";
import type {
  CreateStockLotModalProps,
  PaymentSplit,
  StockLotItemInput,
  StockLotInitialItem,
} from "./stockLotModalTypes";
import { LotGeneralDetails } from "./LotGeneralDetails";
import { LotFormItems } from "./LotFormItems";
import { LotPaymentSection } from "./LotPaymentSection";
import { LotModalHeader } from "./LotModalHeader";
import { LotModalFooter } from "./LotModalFooter";

export const CreateStockLotModal: React.FC<CreateStockLotModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  loading,
  products,
  accounts,
  contexts,
  initialData,
  selectedDate,
}) => {
  const [supplier, setSupplier] = useState("");
  const [contextId, setContextId] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(() => {
    if (selectedDate) return selectedDate;
    const today = new Date();
    const offset = today.getTimezoneOffset() * 60000;
    return new Date(today.getTime() - offset).toISOString().split("T")[0];
  });
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "CREDIT">("CASH");
  const [payments, setPayments] = useState<PaymentSplit[]>([{ accountId: "", amount: "" }]);
  const [items, setItems] = useState<StockLotItemInput[]>([
    {
      productName: "",
      quantity: "",
      unitCost: "",
      confirmedSellingPrice: "",
      isNewProduct: false,
      selectedProductId: "",
    },
  ]);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setSupplier(initialData.supplier || "");
        setContextId(initialData.contextId || "");
        
        let dateStr = "";
        if (initialData.purchaseDate) {
          const d = new Date(initialData.purchaseDate + 'T00:00:00');
          dateStr = !isNaN(d.getTime()) ? initialData.purchaseDate : initialData.purchaseDate;
        } else {
          dateStr = selectedDate || new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split("T")[0];
        }
        setPurchaseDate(dateStr || new Date().toISOString().split("T")[0]);
        setPaymentMethod(initialData.paymentMethod || "CASH");
        
        if (initialData.items && initialData.items.length > 0) {
          setItems(
            initialData.items.map((item: StockLotInitialItem) => ({
              productName: item.productName || "",
              quantity: item.quantity?.toString() || "",
              unitCost: item.unitCost?.toString() || "",
              confirmedSellingPrice: item.confirmedSellingPrice?.toString() || "",
              isNewProduct: item.isNewProduct || false,
              selectedProductId: item.productId || "",
            }))
          );
        } else {
          setItems([{ productName: "", quantity: "", unitCost: "", confirmedSellingPrice: "", isNewProduct: false, selectedProductId: "" }]);
        }
      } else {
        setSupplier("");
        setContextId("");
        const localDateStr = selectedDate || new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split("T")[0];
        setPurchaseDate(localDateStr);
        setPaymentMethod("CASH");
        setPayments([{ accountId: "", amount: "" }]);
        setItems([{ productName: "", quantity: "", unitCost: "", confirmedSellingPrice: "", isNewProduct: false, selectedProductId: "" }]);
      }
    }
  }, [isOpen, initialData, selectedDate]);

  const totalCost = useMemo(() => {
    return items.reduce((sum, item) => {
      const q = parseFloat(item.quantity) || 0;
      const c = parseFloat(item.unitCost) || 0;
      return sum + (q * c);
    }, 0);
  }, [items]);

  const totalPayments = useMemo(() => {
    return payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
  }, [payments]);

  const handleAddItem = () => {
    setItems([
      ...items,
      { productName: "", quantity: "", unitCost: "", confirmedSellingPrice: "", isNewProduct: false, selectedProductId: "" },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const handleItemChange = (index: number, field: keyof StockLotItemInput, value: string | boolean) => {
    const newItems = [...items];
    (newItems[index] as unknown as Record<keyof StockLotItemInput, string | boolean>)[field] = value;
    
    if (field === "selectedProductId" && value) {
      const product = products.find((p) => p.id === value);
      if (product) {
        newItems[index].productName = product.name;
        newItems[index].unitCost = product.costPrice.toString();
        newItems[index].isNewProduct = false;
      }
    }
    
    if (field === "productName") {
      const existingProduct = products.find(
        (p) => p.name.toLowerCase().trim() === (value as string).toLowerCase().trim()
      );
      if (existingProduct) {
        newItems[index].isNewProduct = false;
        newItems[index].selectedProductId = existingProduct.id;
      } else if ((value as string).trim()) {
        newItems[index].isNewProduct = true;
        newItems[index].selectedProductId = "";
      }
    }
    
    setItems(newItems);
  };

  const handleAddPayment = () => {
    const remaining = Math.max(0, totalCost - totalPayments);
    setPayments([...payments, { accountId: "", amount: remaining > 0 ? remaining.toFixed(2) : "" }]);
  };

  const handleRemovePayment = (index: number) => {
    if (payments.length > 1) {
      setPayments(payments.filter((_, i) => i !== index));
    }
  };

  const handlePaymentChange = (index: number, field: keyof PaymentSplit, value: string) => {
    const newPayments = [...payments];
    newPayments[index][field] = value;
    setPayments(newPayments);
  };

  const handleClose = () => {
    setSupplier("");
    setContextId("");
    setPurchaseDate(new Date().toISOString().split("T")[0]);
    setPaymentMethod("CASH");
    setPayments([{ accountId: "", amount: "" }]);
    setItems([{ productName: "", quantity: "", unitCost: "", confirmedSellingPrice: "", isNewProduct: false, selectedProductId: "" }]);
    setError(null);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!supplier.trim()) return setError("Supplier name is required");
    if (!purchaseDate) return setError("Purchase date is required");

    const validItems = items.filter(
      (item) =>
        item.productName.trim() &&
        parseFloat(item.quantity) > 0 &&
        parseFloat(item.unitCost) > 0 &&
        parseFloat(item.confirmedSellingPrice) > 0
    );

    if (validItems.length === 0) return setError("At least one valid item is required");

    let parsedPayments: { accountId: string; amount: number }[] = [];
    if (paymentMethod === "CASH") {
      parsedPayments = payments
        .filter(p => p.accountId)
        .map(p => ({ accountId: p.accountId, amount: parseFloat(p.amount) || 0 }));

      if (parsedPayments.length === 0) return setError("At least one valid payment account is required for CASH payment");

      const paymentSum = parsedPayments.reduce((sum, p) => sum + p.amount, 0);
      
      if (Math.abs(paymentSum - totalCost) > 0.01) {
        if (parsedPayments.length === 1) {
          parsedPayments[0].amount = totalCost;
        } else {
          return setError(`Total payments ($${paymentSum.toFixed(2)}) must equal total cost ($${totalCost.toFixed(2)})`);
        }
      }
    }

    const input: CreateStockLotInput & { id?: string } = {
      supplier: supplier.trim(),
      purchaseDate,
      paymentMethod,
      items: validItems.map((item) => ({
        productId: item.selectedProductId || undefined,
        productName: item.productName.trim(),
        quantity: parseFloat(item.quantity),
        unitCost: parseFloat(item.unitCost),
        confirmedSellingPrice: parseFloat(item.confirmedSellingPrice),
      })),
      accountId: paymentMethod === "CASH" && parsedPayments.length === 1 ? parsedPayments[0].accountId : undefined,
      contextId: contextId ? contextId : undefined,
      status: "RECEIVED",
    };

    if (initialData?.id) input.id = initialData.id;

    const result = await onSubmit(input, parsedPayments.length > 1 ? parsedPayments : undefined);
    if (result && result.stockLot) {
      handleClose();
    } else if (result && result.message) {
      setError(result.message);
    }
  };

  const handleDraftSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!supplier.trim()) return setError("Supplier name is required");
    if (!purchaseDate) return setError("Purchase date is required");

    const validItems = items.filter(
      (item) =>
        item.productName.trim() &&
        parseFloat(item.quantity) > 0 &&
        parseFloat(item.unitCost) > 0 &&
        parseFloat(item.confirmedSellingPrice) > 0
    );

    if (validItems.length === 0) return setError("At least one valid item is required to save a draft");

    const input: CreateStockLotInput & { id?: string } = {
      supplier: supplier.trim(),
      purchaseDate,
      paymentMethod,
      items: validItems.map((item) => ({
        productId: item.selectedProductId || undefined,
        productName: item.productName.trim(),
        quantity: parseFloat(item.quantity),
        unitCost: parseFloat(item.unitCost),
        confirmedSellingPrice: parseFloat(item.confirmedSellingPrice),
      })),
      accountId: paymentMethod === "CASH" && payments[0]?.accountId ? payments[0].accountId : undefined,
      contextId: contextId ? contextId : undefined,
      status: "DRAFT",
    };

    if (initialData?.id) input.id = initialData.id;

    const result = await onSubmit(input, undefined);
    if (result && result.stockLot) {
      handleClose();
    } else if (result && result.message) {
      setError(result.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 sm:p-6">
      <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col border border-stone-200 dark:border-stone-800">
        <LotModalHeader initialData={initialData} onClose={handleClose} />

        <form id="stock-lot-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto space-y-8">
            <LotGeneralDetails
              supplier={supplier}
              setSupplier={setSupplier}
              contextId={contextId}
              setContextId={setContextId}
              purchaseDate={purchaseDate}
              setPurchaseDate={setPurchaseDate}
              contexts={contexts}
            />

            <hr className="border-stone-100 dark:border-stone-800/60" />

            <LotFormItems
              items={items}
              products={products}
              totalCost={totalCost}
              handleAddItem={handleAddItem}
              handleRemoveItem={handleRemoveItem}
              handleItemChange={handleItemChange}
            />

            <hr className="border-stone-100 dark:border-stone-800/60" />

            <LotPaymentSection
              paymentMethod={paymentMethod}
              setPaymentMethod={setPaymentMethod}
              payments={payments}
              accounts={accounts}
              totalCost={totalCost}
              totalPayments={totalPayments}
              handleAddPayment={handleAddPayment}
              handleRemovePayment={handleRemovePayment}
              handlePaymentChange={handlePaymentChange}
            />
          </div>
        </form>

        <LotModalFooter
          error={error}
          loading={loading}
          purchaseDate={purchaseDate}
          handleClose={handleClose}
          handleDraftSubmit={handleDraftSubmit}
        />
      </div>
    </div>
  );
};
