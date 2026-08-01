import { describe, it, expect } from "vitest";
import type { ActionPanelProduct, ExtractedCartItem } from "../action-panel.types";
import { matchExtractedProduct } from "../product-matcher";

const buildProduct = (overrides: Partial<ActionPanelProduct> = {}): ActionPanelProduct => ({
  _id: "prod-1",
  name: "Brake Pads",
  price: 25,
  purchasePrice: 15,
  sellingPrice: 25,
  profit: 10,
  profitMargin: 0.4,
  stock: 20,
  stockValue: 300,
  potentialProfit: 200,
  ...overrides,
});

describe("matchExtractedProduct", () => {
  it("matches by productId when present", () => {
    const products = [buildProduct({ _id: "prod-1" }), buildProduct({ _id: "prod-2", name: "Oil Filter" })];
    const extracted: ExtractedCartItem = { productId: "prod-2", productName: "irrelevant", quantity: 1 };

    const matched = matchExtractedProduct(products, extracted);
    expect(matched?._id).toBe("prod-2");
  });

  it("falls back to a case-insensitive productName match when productId is absent", () => {
    const products = [buildProduct({ name: "Brake Pads" })];
    const extracted: ExtractedCartItem = { productName: "brake pads", quantity: 2 };

    const matched = matchExtractedProduct(products, extracted);
    expect(matched?.name).toBe("Brake Pads");
  });

  it("returns null when nothing matches", () => {
    const products = [buildProduct({ name: "Brake Pads" })];
    const extracted: ExtractedCartItem = { productName: "Spark Plug", quantity: 1 };

    expect(matchExtractedProduct(products, extracted)).toBeNull();
  });

  it("exposes sellingPrice (not price) on the matched product", () => {
    const products = [buildProduct({ price: 999, sellingPrice: 25 })];
    const extracted: ExtractedCartItem = { productName: "Brake Pads", quantity: 1 };

    const matched = matchExtractedProduct(products, extracted);
    expect(matched?.sellingPrice).toBe(25);
  });
});
