import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { OrderDetailModal } from "../OrderDetailModal";
import { Order, Client, Product } from "../../types";
import { OrderStatus } from "@shared-domain/order/order.entity";
import { MockedProvider } from "@apollo/client/testing";
import { GET_ACCOUNTS, GET_FINANCIAL_DAY_BY_DATE } from "../../../../modules/financial/infrastructure/graphql/queries";

const todayStr = new Date().toISOString().split("T")[0];

const mocks = [
  {
    request: {
      query: GET_ACCOUNTS,
    },
    result: {
      data: {
        getAccounts: [
          { id: "acc1", name: "USD Bank", currency: "USD", balance: 1000 },
          { id: "acc2", name: "VES Cash", currency: "VES", balance: 5000 },
        ],
      },
    },
  },
  {
    request: {
      query: GET_FINANCIAL_DAY_BY_DATE,
      variables: { date: todayStr },
    },
    result: {
      data: {
        getFinancialDayByDate: {
          exchangeRate: 40.0,
        },
      },
    },
  },
];

describe("OrderDetailModal Presenter", () => {
  const mockClients: Client[] = [
    { _id: "client1", firstName: "John", lastName: "Doe", address: "", whatsapp: "", nationalId: "", type: "REGULAR", sellerId: "seller1" },
  ];

  const mockProducts: Product[] = [
    { _id: "prod1", name: "Laptop Pro", price: 625, purchasePrice: 400, sellingPrice: 625, profit: 225, profitMargin: 36, stock: 10, stockValue: 6250, potentialProfit: 2250 },
  ];

  const mockOrder: Order = {
    _id: "123456789012345678long_id",
    clientId: "client1",
    createdAt: "2026-07-07T12:00:00Z",
    total: 1250.0,
    status: OrderStatus.ACTIVE,
    paymentStatus: "PENDING",
    deliveryStatus: "PENDING",
    items: [
      {
        productId: "prod1",
        quantity: 2,
        sellingPriceAtSale: 625.0,
        purchasePriceAtSale: 400.0,
      },
    ],
    sellerId: "seller1",
  };

  it("does not render when isOpen is false", () => {
    const { container } = render(
      <MockedProvider mocks={mocks}>
        <OrderDetailModal
          order={mockOrder}
          clients={mockClients}
          products={mockProducts}
          isOpen={false}
          isUpdating={false}
          updateError={null}
          onClose={vi.fn()}
          onStatusChange={vi.fn()}
        />
      </MockedProvider>
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders order items, details, and high-contrast status selector", () => {
    const onClose = vi.fn();
    const onStatusChange = vi.fn();

    render(
      <MockedProvider mocks={mocks}>
        <OrderDetailModal
          order={mockOrder}
          clients={mockClients}
          products={mockProducts}
          isOpen={true}
          isUpdating={false}
          updateError={null}
          onClose={onClose}
          onStatusChange={onStatusChange}
        />
      </MockedProvider>
    );

    // Verify Title and Client Name
    expect(screen.getByText("Order Detail #LONG_ID")).toBeInTheDocument();
    expect(screen.getByText("John Doe")).toBeInTheDocument();

    // Verify items grid
    expect(screen.getByText("Laptop Pro")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("$625.00")).toBeInTheDocument();
    expect(screen.getAllByText("$1,250.00")[0]).toBeInTheDocument();

    // Verify status select element
    const statusSelect = screen.getByRole("combobox", { name: /change order status/i });
    expect(statusSelect).toBeInTheDocument();
    expect(statusSelect).toHaveValue(OrderStatus.ACTIVE);
    expect(statusSelect).toHaveClass("h-11"); // 44px high-contrast touch target

    // Verify English options exist
    expect(screen.getByRole("option", { name: "Active" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Cancelled" })).toBeInTheDocument();
  });

  it("triggers onStatusChange callback when a new option is chosen", () => {
    const onStatusChange = vi.fn();

    render(
      <MockedProvider mocks={mocks}>
        <OrderDetailModal
          order={mockOrder}
          clients={mockClients}
          products={mockProducts}
          isOpen={true}
          isUpdating={false}
          updateError={null}
          onClose={vi.fn()}
          onStatusChange={onStatusChange}
        />
      </MockedProvider>
    );

    const statusSelect = screen.getByRole("combobox", { name: /change order status/i });
    fireEvent.change(statusSelect, { target: { value: OrderStatus.COMPLETED } });
    expect(onStatusChange).toHaveBeenCalledWith({
      newStatus: OrderStatus.COMPLETED,
      newPaymentStatus: undefined,
      newDeliveryStatus: undefined,
      payments: undefined,
    });
  });

  it("opens CancelOrderModal when CANCELLED status is selected", async () => {
    const onStatusChange = vi.fn();

    render(
      <MockedProvider mocks={mocks}>
        <OrderDetailModal
          order={mockOrder}
          clients={mockClients}
          products={mockProducts}
          isOpen={true}
          isUpdating={false}
          updateError={null}
          onClose={vi.fn()}
          onStatusChange={onStatusChange}
        />
      </MockedProvider>
    );

    const statusSelect = screen.getByRole("combobox", { name: /change order status/i });
    fireEvent.change(statusSelect, { target: { value: OrderStatus.CANCELLED } });
    
    // CancelOrderModal should appear with textarea
    expect(screen.getByPlaceholderText(/motivo de la cancelación/)).toBeInTheDocument();
    expect(screen.getByText("Cancelar Orden")).toBeInTheDocument();
    
    // onStatusChange should NOT be called yet (waiting for observation)
    expect(onStatusChange).not.toHaveBeenCalled();
  });
});
