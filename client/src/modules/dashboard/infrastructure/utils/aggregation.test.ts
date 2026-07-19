import { describe, it, expect } from "vitest";
import { OrderStatus, PaymentStatus, DeliveryStatus } from "@shared-domain/order/order.entity";
import { calculateTransactionLines } from "./aggregation";

describe("calculateTransactionLines", () => {
    const productsMap = new Map([
      ["prod1", { name: "Product A", purchasePrice: 5, cost: 5 }],
      ["prod2", { name: "Product B", purchasePrice: 10, cost: 10 }],
    ]);

  const orders = [
    // Completed order
    {
      _id: "order-1",
      clientId: "client-123",
      createdAt: "2026-07-09T10:00:00Z",
      status: OrderStatus.ACTIVE,
      paymentStatus: PaymentStatus.PAID,
      deliveryStatus: DeliveryStatus.COMPLETE,
      items: [
        {
          productId: "p1",
          quantity: 2,
          sellingPriceAtSale: 20.0,
          purchasePriceAtSale: 10.0,
        },
        {
          productId: "p2",
          quantity: 1,
          sellingPriceAtSale: 30.0,
          purchasePriceAtSale: 0.0, // Trigger fallback
        },
      ],
    },
    // Non-completed order (Should be skipped)
    {
      _id: "order-2",
      clientId: "client-123",
      createdAt: "2026-07-09T11:00:00Z",
      status: OrderStatus.ACTIVE,
      paymentStatus: PaymentStatus.PENDING,
      deliveryStatus: DeliveryStatus.COMPLETE,
      items: [
        {
          productId: "p1",
          quantity: 5,
          sellingPriceAtSale: 20.0,
          purchasePriceAtSale: 10.0,
        },
      ],
    },
  ];

  it("should process completed orders and apply COGS fallback correctly", () => {
    const lines = calculateTransactionLines(orders, productsMap, null);

    expect(lines).toHaveLength(2);

    // First line (No fallback)
    expect(lines[0].orderId).toBe("order-1");
    expect(lines[0].clientId).toBe("client-123");
    expect(lines[0].productName).toBe("Product 1");
    expect(lines[0].quantity).toBe(2);
    expect(lines[0].unitPrice).toBe(20.0);
    expect(lines[0].revenue).toBe(40.0);
    expect(lines[0].itemCOGS).toBe(10.0);
    expect(lines[0].totalCOGS).toBe(20.0);
    expect(lines[0].netMargin).toBe(20.0);
    expect(lines[0].isFallback).toBe(false);

    // Second line (Fallback)
    expect(lines[1].orderId).toBe("order-1");
    expect(lines[1].clientId).toBe("client-123");
    expect(lines[1].productName).toBe("Product 2");
    expect(lines[1].quantity).toBe(1);
    expect(lines[1].unitPrice).toBe(30.0);
    expect(lines[1].revenue).toBe(30.0);
    expect(lines[1].itemCOGS).toBe(15.0); // Catalog price
    expect(lines[1].totalCOGS).toBe(15.0);
    expect(lines[1].netMargin).toBe(15.0);
    expect(lines[1].isFallback).toBe(true);
  });

  it("should filter items correctly based on active contextProductIds Set", () => {
    const contextProductIds = new Set(["p1"]);
    const lines = calculateTransactionLines(orders, productsMap, contextProductIds);

    expect(lines).toHaveLength(1);
    expect(lines[0].productName).toBe("Product 1");
  });
});
