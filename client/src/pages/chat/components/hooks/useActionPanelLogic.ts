import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@apollo/client";

import { PRODUCTS_QUERY } from "../../../../modules/product/infrastructure/graphql/queries";
import { CLIENTS_QUERY } from "../../../../modules/client/infrastructure/graphql/queries";
import { CREATE_CLIENT } from "../../../../modules/client/infrastructure/graphql/mutations";
import { CREATE_ORDER } from "../../../../modules/order/infrastructure/graphql/mutations";
import {
  calculateDeliveryFee,
  DEFAULT_ORIGIN_LAT,
  DEFAULT_ORIGIN_LNG,
} from "@shared-domain/delivery/delivery-calculator";
import { GET_CHAT_SESSIONS } from "../../../../modules/chat/infrastructure/graphql/queries";
import { OrderItem, CARACAS_ZONES } from "../ActionPanelDrawerTabs/DraftOrderTab";

export const useActionPanelLogic = (whatsappId: string) => {
  const [panelMode, setPanelMode] = useState<"ai" | "manual">("ai");
  const [activeTab, setActiveTab] = useState<"client" | "catalog" | "order">("client");

  // Client Query & Mutation
  const { data: clientsData, refetch: refetchClients } = useQuery(CLIENTS_QUERY);
  const [createClient] = useMutation(CREATE_CLIENT);

  // Product Query
  const { data: productsData, loading: productsLoading } = useQuery(PRODUCTS_QUERY, {
    variables: { limit: 100 },
  });

  // Order Mutation
  const [createOrder] = useMutation(CREATE_ORDER);

  // Session Query
  const { data: sessionsData } = useQuery(GET_CHAT_SESSIONS);
  const currentSession = sessionsData?.getChatSessions?.find(
    (s: { whatsappId: string; [key: string]: unknown }) => s.whatsappId === whatsappId
  );

  // Success message states
  const [successMsg, setSuccessMessage] = useState<string | null>(null);
  const [errorMsg, setErrorMessage] = useState<string | null>(null);

  // AI Extraction state
  const [editedClient, setEditedClient] = useState({
    firstName: "",
    lastName: "",
    nationalId: "",
    address: "",
  });
  const [editingField, setEditingField] = useState<"firstName" | "lastName" | "nationalId" | "address" | null>(null);
  const [cartItems, setCartItems] = useState<Array<{
    productId: string;
    productName: string;
    quantity: number;
    price: number;
  }>>([]);

  const [syncing, setSyncing] = useState(false);

  // Draft order state (for manual)
  const [selectedClientId, setSelectedClientId] = useState("");
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [deliveryType, setDeliveryType] = useState<"pickup" | "delivery">("pickup");
  const [selectedZoneIndex, setSelectedZoneIndex] = useState(0);
  const [customLat, setCustomLat] = useState(DEFAULT_ORIGIN_LAT);
  const [customLng, setCustomLng] = useState(DEFAULT_ORIGIN_LNG);
  const [deliveryCost, setDeliveryCost] = useState(0);
  const [deliveryAddress, setDeliveryAddress] = useState("");

  // Helper to match extracted cart items with database products
  const matchProduct = (extractedItem: { productId?: string; productName: string; quantity?: number; [key: string]: unknown }) => {
    if (!productsData?.getAllProducts) return null;
    if (extractedItem.productId) {
      const found = productsData.getAllProducts.find(
        (p: { _id: string; id?: string; name: string; price: number; stock: number; [key: string]: unknown }) => p._id === extractedItem.productId || p.id === extractedItem.productId
      );
      if (found) return found;
    }
    if (extractedItem.productName) {
      const found = productsData.getAllProducts.find(
        (p: { _id: string; id?: string; name: string; price: number; stock: number; [key: string]: unknown }) => p.name.toLowerCase() === extractedItem.productName.toLowerCase()
      );
      if (found) return found;
    }
    return null;
  };

  // Sync AI Extraction State with Active Chat Session
  useEffect(() => {
    if (currentSession?.extractedData) {
      const ext = currentSession.extractedData;
      setEditedClient({
        firstName: ext.client?.firstName || "",
        lastName: ext.client?.lastName || "",
        nationalId: ext.client?.nationalId || "",
        address: ext.client?.address || "",
      });

      if (ext.cart && productsData?.getAllProducts) {
        const items = ext.cart.map((item: { productId?: string; productName: string; quantity: number; price?: number; [key: string]: unknown }) => {
          const matched = matchProduct(item);
          return {
            productId: matched?._id || item.productId || "",
            productName: matched?.name || item.productName || "Unknown Product",
            quantity: item.quantity,
            price: matched?.sellingPrice || item.price || 0,
          };
        });
        setCartItems(items);
      }
    }
  }, [currentSession, productsData]);

  // Autoselect matching client from CRM if phone matches whatsappId
  useEffect(() => {
    if (clientsData?.getAllClients && whatsappId) {
      const matched = clientsData.getAllClients.find(
        (c: { whatsapp: string; _id: string; name: string; email?: string; [key: string]: unknown }) => c.whatsapp === whatsappId
      );
      if (matched) {
        setSelectedClientId(matched._id || matched.id);
      }
    }
  }, [clientsData, whatsappId]);

  // Update delivery cost whenever coordinates change
  useEffect(() => {
    if (deliveryType === "delivery") {
      const zone = CARACAS_ZONES[selectedZoneIndex];
      const lat = zone.name === "Custom Coordinates" ? customLat : zone.lat;
      const lng = zone.name === "Custom Coordinates" ? customLng : zone.lng;
      const fee = calculateDeliveryFee(lat, lng);
      setDeliveryCost(fee);
    } else {
      setDeliveryCost(0);
    }
  }, [deliveryType, selectedZoneIndex, customLat, customLng]);

  const handleAddProductToOrder = (product: OrderItem["product"]) => {
    const existing = orderItems.find((item) => item.product._id === product._id);
    if (existing) {
      setOrderItems((prev) =>
        prev.map((item) =>
          item.product._id === product._id
            ? { ...item, quantity: Math.min(item.quantity + 1, product.stock) }
            : item
        )
      );
    } else {
      setOrderItems((prev) => [...prev, { product, quantity: 1 }]);
    }
    setActiveTab("order"); // Navigate to Order tab
  };

  // Live AI Co-Pilot interactions
  const handleUpdateLiveQty = (productId: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.productId === productId) {
            const nextQty = item.quantity + delta;
            if (nextQty <= 0) return null;
            return { ...item, quantity: nextQty };
          }
          return item;
        })
        .filter((item) => item !== null) as Array<{
          productId: string;
          productName: string;
          quantity: number;
          price: number;
        }>
    );
  };

  const handleRemoveLiveItem = (productId: string) => {
    setCartItems((prev) => prev.filter((item) => item.productId !== productId));
  };

  // 1-Click Sync CTA
  const handleSyncAll = async () => {
    setSuccessMessage(null);
    setErrorMessage(null);
    setSyncing(true);

    try {
      let clientId = selectedClientId;

      // Check if client is registered in CRM
      const matched = clientsData?.getAllClients?.find(
        (c: { whatsapp: string; _id: string; name: string; email?: string; [key: string]: unknown }) => c.whatsapp === whatsappId
      );

      if (matched) {
        clientId = matched._id || matched.id;
      } else {
        // Register client concurrently
        if (!editedClient.firstName || !editedClient.lastName) {
          throw new Error("Juan and Perez (First / Last Names) are required to register client.");
        }

        await createClient({
          variables: {
            input: {
              firstName: editedClient.firstName,
              lastName: editedClient.lastName,
              address: editedClient.address || "WhatsApp AI Extraction",
              whatsapp: whatsappId,
              nationalId: editedClient.nationalId || "0",
              sellerId: "550e8400-e29b-41d4-a716-446655440003",
            },
          },
        });

        // Refetch and get client ID
        const { data: updatedClients } = await refetchClients();
        const newClient = updatedClients?.getAllClients?.find(
          (c: { whatsapp: string; _id: string; name: string; email?: string; [key: string]: unknown }) => c.whatsapp === whatsappId
        );
        if (!newClient) {
          throw new Error("Client registered but could not retrieve CRM ID.");
        }
        clientId = newClient._id || newClient.id;
        setSelectedClientId(clientId);
      }

      if (cartItems.length === 0) {
        throw new Error("Extracted cart cannot be empty.");
      }

      const itemsInput = cartItems.map((item) => {
        const dbProd = productsData?.getAllProducts?.find(
          (p: { _id: string; id?: string; name: string; price: number; stock: number; purchasePrice?: number; [key: string]: unknown }) => p._id === item.productId || p.id === item.productId
        );
        return {
          productId: item.productId,
          quantity: item.quantity,
          sellingPriceAtSale: item.price,
          purchasePriceAtSale: dbProd?.purchasePrice || item.price * 0.7,
        };
      });

      const extractedSubtotal = cartItems.reduce(
        (sum, item) => sum + item.quantity * item.price,
        0
      );

      // Auto delivery fee if address present
      let finalDeliveryFee = 0;
      if (deliveryType === "delivery") {
        finalDeliveryFee = deliveryCost || 5.0; // fallback $5
      }

      const totalOrder = extractedSubtotal + finalDeliveryFee;

      await createOrder({
        variables: {
          input: {
            clientId,
            items: itemsInput,
            total: totalOrder,
            sellerId: "550e8400-e29b-41d4-a716-446655440003",
            deliveryCost: finalDeliveryFee,
            deliveryAddress: deliveryType === "delivery" ? (editedClient.address || "WhatsApp Extraction") : "PICKUP",
            status: "PENDING",
            paymentStatus: "UNPAID",
            deliveryStatus: deliveryType === "delivery" ? "PENDING" : "DELIVERED",
          },
        },
      });

      setSuccessMessage("⚡️ Sync completed! Client & Order successfully created in 1-Click.");
      setCartItems([]);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message || "Failed to complete 1-Click CRM Sync.");
      } else {
        setErrorMessage("Failed to complete 1-Click CRM Sync.");
      }
    } finally {
      setSyncing(false);
    }
  };

  const aiSubtotal = cartItems.reduce(
    (sum, item) => sum + item.quantity * item.price,
    0
  );

  const aiFinalTotal = aiSubtotal + (deliveryType === "delivery" ? deliveryCost : 0);

  const showSuccess = (msg: string) => {
    setErrorMessage(null);
    setSuccessMessage(msg);
  };

  const showError = (msg: string) => {
    setSuccessMessage(null);
    setErrorMessage(msg);
  };

  return {
    panelMode,
    setPanelMode,
    activeTab,
    setActiveTab,
    clientsData,
    refetchClients,
    productsData,
    productsLoading,
    successMsg,
    errorMsg,
    editedClient,
    setEditedClient,
    editingField,
    setEditingField,
    cartItems,
    syncing,
    selectedClientId,
    setSelectedClientId,
    orderItems,
    setOrderItems,
    deliveryType,
    setDeliveryType,
    selectedZoneIndex,
    setSelectedZoneIndex,
    customLat,
    setCustomLat,
    customLng,
    setCustomLng,
    deliveryCost,
    deliveryAddress,
    setDeliveryAddress,
    handleAddProductToOrder,
    handleUpdateLiveQty,
    handleRemoveLiveItem,
    handleSyncAll,
    aiSubtotal,
    aiFinalTotal,
    showSuccess,
    showError,
  };
};
