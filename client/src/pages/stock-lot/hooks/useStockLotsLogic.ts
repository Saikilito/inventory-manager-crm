import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { GET_STOCK_LOTS } from "../../../modules/product/infrastructure/graphql/stock-lot-queries";
import { CREATE_STOCK_LOT } from "../../../modules/product/infrastructure/graphql/stock-lot-mutations";
import { CLIENTS_QUERY } from "../../../modules/client/infrastructure/graphql/queries";
import { PRODUCTS_QUERY } from "../../../modules/product/infrastructure/graphql/queries";
import { getErrorMessage } from "@utils/error";
import type { StockLot, CreateStockLotInput, CreateStockLotPayload } from "../../../modules/product/infrastructure/graphql/stock-lot-types";

interface ClientShape {
  id: string;
  firstName: string;
  lastName: string;
}

interface ProductShape {
  id: string;
  name: string;
  costPrice: number;
  stock: number;
}

interface CreateStockLotVariables {
  input: CreateStockLotInput;
}

export const useStockLotsLogic = () => {
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [supplierFilter, setSupplierFilter] = useState<string>('');

  const {
    data: stockLotsData,
    loading: loadingStockLots,
    refetch: refetchStockLots,
  } = useQuery(GET_STOCK_LOTS, {
    fetchPolicy: "no-cache",
  });

  const stockLots: StockLot[] = stockLotsData?.stockLots || [];

  const { data: productsData } = useQuery(PRODUCTS_QUERY, {
    variables: { limit: 1000 },
  });

  const products: ProductShape[] = productsData?.getAllProducts || [];

  const { data: clientsData } = useQuery(CLIENTS_QUERY, {
    variables: { limit: 1000 },
  });

  const clients: ClientShape[] = clientsData?.clients || [];

  const [createStockLotMutation, { loading: creatingStockLot }] = useMutation<
    { createStockLot: CreateStockLotPayload },
    CreateStockLotVariables
  >(CREATE_STOCK_LOT, {
    onCompleted: (data) => {
      if (data.createStockLot.success) {
        setSuccessMessage(data.createStockLot.message || "Stock lot created successfully");
        refetchStockLots();
        setTimeout(() => setSuccessMessage(null), 5000);
      }
    },
    onError: (error) => {
      setSuccessMessage(getErrorMessage(error));
      setTimeout(() => setSuccessMessage(null), 5000);
    },
  });

  const filteredStockLots = useMemo(() => {
    return stockLots.filter((lot) => {
      const matchesStatus = statusFilter === 'ALL' || lot.status === statusFilter;
      const matchesSupplier = !supplierFilter || 
        lot.supplier.toLowerCase().includes(supplierFilter.toLowerCase());
      return matchesStatus && matchesSupplier;
    });
  }, [stockLots, statusFilter, supplierFilter]);

  const handleCreateStockLot = async (input: CreateStockLotInput) => {
    const result = await createStockLotMutation({ variables: { input } });
    return result.data?.createStockLot;
  };

  const getProductNameById = (productId: string): string => {
    const product = products.find((p) => p.id === productId);
    return product?.name || 'Unknown Product';
  };

  const totalPurchaseValue = useMemo(() => {
    return filteredStockLots.reduce((sum, lot) => {
      const lotTotal = lot.items.reduce((itemSum, item) => {
        return itemSum + (item.unitCost * item.quantity);
      }, 0);
      return sum + lotTotal;
    }, 0);
  }, [filteredStockLots]);

  const totalProjectedProfit = useMemo(() => {
    return filteredStockLots.reduce((sum, lot) => {
      const lotProfit = lot.items.reduce((itemSum, item) => {
        return itemSum + item.projectedProfit;
      }, 0);
      return sum + lotProfit;
    }, 0);
  }, [filteredStockLots]);

  return {
    stockLots,
    filteredStockLots,
    loadingStockLots,
    creatingStockLot,
    successMessage,
    statusFilter,
    setStatusFilter,
    supplierFilter,
    setSupplierFilter,
    handleCreateStockLot,
    getProductNameById,
    refetchStockLots,
    totalPurchaseValue,
    totalProjectedProfit,
    products,
    clients,
  };
};
