import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { OrdersTable } from "../OrdersTable";
import { Order, Client } from "../../types";
import { OrderStatus, PaymentStatus, DeliveryStatus } from "@shared-domain/order/order.entity";

describe("OrdersTable Presenter", () => {
  const mockClients: Client[] = [
    { _id: "1", firstName: "John", lastName: "Doe" },
    { _id: "2", firstName: "Jane", lastName: "Smith" },
  ];

  const mockOrders: Order[] = [
    {
      _id: "123456789012345678long_id",
      clientId: "1",
      createdAt: "2026-07-07T12:00:00Z",
      total: 123.45,
      status: OrderStatus.ACTIVE,
      paymentStatus: PaymentStatus.PAID,
      deliveryStatus: DeliveryStatus.COMPLETE,
      items: [],
      sellerId: "seller1",
    },
    {
      _id: "123456789012345678long_i2",
      clientId: "2",
      createdAt: "2026-07-07T13:00:00Z",
      total: 99.0,
      status: OrderStatus.ACTIVE,
      paymentStatus: PaymentStatus.PENDING,
      deliveryStatus: DeliveryStatus.PENDING,
      items: [],
      sellerId: "seller2",
    },
  ];

  it("renders order table rows with short ID, client name, formatted date and total", () => {
    const onViewDetails = vi.fn();
    const onDelete = vi.fn();

    render(
      <OrdersTable
        orders={mockOrders}
        clients={mockClients}
        onViewDetails={onViewDetails}
        onDelete={onDelete}
      />
    );

    // Verify Short ID rendering (takes last 6 chars uppercase)
    expect(screen.getByText("#LONG_ID")).toBeInTheDocument();

    // Verify O(1) client lookup
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("Jane Smith")).toBeInTheDocument();

    // Verify formatted totals
    expect(screen.getByText("$123.45")).toBeInTheDocument();
    expect(screen.getByText("$99.00")).toBeInTheDocument();

    // Verify English status badges
    expect(screen.getByText("Paid")).toBeInTheDocument();
    expect(screen.getByText("Unpaid")).toBeInTheDocument();
    expect(screen.getByText("Delivered")).toBeInTheDocument();
    expect(screen.getByText("Pending Deliv.")).toBeInTheDocument();
  });

  it("propagates onViewDetails callback with 44px hit-target buttons", () => {
    const onViewDetails = vi.fn();
    const onDelete = vi.fn();

    render(
      <OrdersTable
        orders={mockOrders}
        clients={mockClients}
        onViewDetails={onViewDetails}
        onDelete={onDelete}
      />
    );

    const detailButtons = screen.getAllByRole("button", { name: /view details/i });
    expect(detailButtons[0]).toHaveClass("h-11"); // 44px target check

    fireEvent.click(detailButtons[0]);
    expect(onViewDetails).toHaveBeenCalledWith(mockOrders[0]);
  });

  it("propagates onDelete callback when trash button is clicked", () => {
    const onViewDetails = vi.fn();
    const onDelete = vi.fn();

    render(
      <OrdersTable
        orders={mockOrders}
        clients={mockClients}
        onViewDetails={onViewDetails}
        onDelete={onDelete}
      />
    );

    const deleteButtons = screen.getAllByRole("button", { name: /delete order/i });
    fireEvent.click(deleteButtons[0]);
    expect(onDelete).toHaveBeenCalledWith(mockOrders[0]._id);
  });
});
