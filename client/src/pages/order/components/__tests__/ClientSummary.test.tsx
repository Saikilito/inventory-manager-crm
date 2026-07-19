import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ClientSummary } from "../ClientSummary";
import { IClient, makeClient, ClientRatingTier } from "@shared-domain/client/client.entity";

describe("ClientSummary Component", () => {
  const mockClient: IClient = makeClient({
    id: "60c72b2f9b1d8e234c8b4567", // valid 24-character hexadecimal ObjectId
    firstName: "Jane",
    lastName: "Doe",
    address: "123 Main St",
    whatsapp: "555-1234",
    nationalId: "V-12345678",
    type: ClientRatingTier.PREMIUM,
    orders: [],
    sellerId: "60c72b2f9b1d8e234c8b4568",
  });

  it("renders a dashed border empty state card prompt when client is null", () => {
    render(<ClientSummary client={null} />);

    expect(screen.getByText("No client selected")).toBeInTheDocument();
    expect(screen.getByText("Please choose a client to proceed.")).toBeInTheDocument();
  });

  it("renders client details when client is provided", () => {
    render(<ClientSummary client={mockClient} />);

    expect(screen.getByText("Client Summary")).toBeInTheDocument();
    expect(screen.getByText("Jane Doe")).toBeInTheDocument();
    expect(screen.getByText("V-12345678")).toBeInTheDocument();
    expect(screen.getByText("123 Main St")).toBeInTheDocument();
    expect(screen.getByText("Premium")).toBeInTheDocument();
    expect(screen.getByText("555-1234")).toBeInTheDocument();
  });
});