import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { MockedProvider } from "@apollo/client/testing";
import { DeliveriesPage, GET_ALL_DELIVERIES } from "../DeliveriesPage";
import { GET_ALL_ORDERS } from "../../../modules/order/infrastructure/graphql/queries";
import { CLIENTS_QUERY } from "../../../modules/client/infrastructure/graphql/queries";

const mocks = [
  {
    request: {
      query: GET_ALL_DELIVERIES,
    },
    result: {
      data: {
        getAllDeliveries: [
          {
            id: "delivery-1",
            orderId: "order-1",
            scheduledDate: "2026-07-10T14:00:00.000-04:00",
            deliveryTime: "10:00",
            address: "Calle 1, Caracas",
            status: "PENDING",
            notes: "Please call before arrival",
            deliveryCost: 15.0,
            paymentAccounts: ["Account 1"],
            __typename: "Delivery",
          },
          {
            id: "delivery-2",
            orderId: "order-2",
            scheduledDate: "2026-07-10T16:00:00.000-04:00",
            deliveryTime: "12:00",
            address: "Calle 2, Caracas",
            status: "DELIVERED",
            notes: "",
            deliveryCost: 20.0,
            paymentAccounts: ["Account 2"],
            __typename: "Delivery",
          },
          {
            id: "delivery-3",
            orderId: "order-3",
            scheduledDate: "2026-07-10T18:00:00.000-04:00",
            deliveryTime: "14:00",
            address: "Calle 3, Caracas",
            status: "CANCELLED",
            notes: "",
            deliveryCost: 12.0,
            paymentAccounts: [],
            __typename: "Delivery",
          },
          {
            id: "delivery-4",
            orderId: "order-4",
            scheduledDate: "2026-07-09T10:00:00.000-04:00",
            deliveryTime: "08:00",
            address: "Calle 4, Caracas",
            status: "PENDING",
            notes: "",
            deliveryCost: 10.0,
            paymentAccounts: [],
            __typename: "Delivery",
          },
        ],
      },
    },
  },
  {
    request: {
      query: GET_ALL_ORDERS,
      variables: { limit: 1000 },
    },
    result: {
      data: {
        getAllOrders: [
          {
            id: "order-1",
            clientId: "client-1",
            __typename: "Order",
          },
          {
            id: "order-2",
            clientId: "client-2",
            __typename: "Order",
          },
          {
            id: "order-3",
            clientId: "client-3",
            __typename: "Order",
          },
          {
            id: "order-4",
            clientId: "client-4",
            __typename: "Order",
          },
        ],
      },
    },
  },
  {
    request: {
      query: CLIENTS_QUERY,
      variables: { limit: 1000 },
    },
    result: {
      data: {
        getAllClients: [
          {
            id: "client-1",
            firstName: "John",
            lastName: "Doe",
            __typename: "Client",
          },
          {
            id: "client-2",
            firstName: "Jane",
            lastName: "Smith",
            __typename: "Client",
          },
          {
            id: "client-3",
            firstName: "Bob",
            lastName: "Johnson",
            __typename: "Client",
          },
          {
            id: "client-4",
            firstName: "Alice",
            lastName: "Williams",
            __typename: "Client",
          },
        ],
      },
    },
  },
];

describe("DeliveriesPage - Daily Delivery Counter", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    // Set system time to 2026-07-10 in UTC so that DateTimeVO can create a consistent today's date
    vi.setSystemTime(new Date("2026-07-10T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should render deliveries list successfully and allow day-based filtering with KPI counter", async () => {
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <DeliveriesPage />
      </MockedProvider>
    );

    // Should show loading state first
    expect(screen.getByRole("status")).toBeInTheDocument();

    // Wait for the deliveries list to render
    await waitFor(() => {
      expect(screen.queryByRole("status")).not.toBeInTheDocument();
    });

    // Check that ALL deliveries are rendered initially
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("Jane Smith")).toBeInTheDocument();
    expect(screen.getByText("Bob Johnson")).toBeInTheDocument();
    expect(screen.getByText("Alice Williams")).toBeInTheDocument();

    // Find and click the "Day" filter button
    const dayFilterButton = screen.getByRole("button", { name: "Day" });
    expect(dayFilterButton).toBeInTheDocument();
    fireEvent.click(dayFilterButton);

    // Verify Date Navigator and KPI Card are shown
    expect(screen.getByText("Selected Day:")).toBeInTheDocument();
    expect(screen.getByText("Total Delivery Revenue")).toBeInTheDocument();

    // Today is 2026-07-10, so formatDayLabel should show "10/07/2026"
    expect(screen.getByText("10/07/2026")).toBeInTheDocument();

    // Delivery-1 ($15.00 PENDING) and Delivery-2 ($20.00 DELIVERED) are on 2026-07-10.
    // Delivery-3 is CANCELLED so it is not summed.
    // Expected sum: $35.00
    expect(screen.getByText("$35.00")).toBeInTheDocument();

    // Verify list is filtered to only show deliveries of 2026-07-10
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("Jane Smith")).toBeInTheDocument();
    expect(screen.getByText("Bob Johnson")).toBeInTheDocument(); // even cancelled, but scheduled for today
    expect(screen.queryByText("Alice Williams")).not.toBeInTheDocument(); // Alice is on 2026-07-09

    // Click "Previous Day" (ArrowLeft button)
    const prevDayButton = screen.getByTitle("Previous Day");
    fireEvent.click(prevDayButton);

    // Date navigator should update to 09/07/2026
    expect(screen.getByText("09/07/2026")).toBeInTheDocument();

    // On 2026-07-09, only Delivery-4 ($10.00 PENDING) is scheduled.
    // Expected sum: $10.00 (shown in KPI Card and in the delivery cost list)
    expect(screen.getAllByText("$10.00").length).toBe(2);

    // Filtered list should only show Alice Williams (Delivery-4)
    expect(screen.queryByText("John Doe")).not.toBeInTheDocument();
    expect(screen.queryByText("Jane Smith")).not.toBeInTheDocument();
    expect(screen.queryByText("Bob Johnson")).not.toBeInTheDocument();
    expect(screen.getByText("Alice Williams")).toBeInTheDocument();

    // Click "Next Day" twice to get to 2026-07-11
    const nextDayButton = screen.getByTitle("Next Day");
    fireEvent.click(nextDayButton); // Go to 10/07/2026
    fireEvent.click(nextDayButton); // Go to 11/07/2026

    // Date navigator should show "11/07/2026"
    expect(screen.getByText("11/07/2026")).toBeInTheDocument();

    // On 2026-07-11, there are no scheduled deliveries.
    // Expected sum: $0.00
    expect(screen.getByText("$0.00")).toBeInTheDocument();

    // List should show empty state
    expect(
      screen.getByText("No deliveries match your active filter settings. Try resetting them.")
    ).toBeInTheDocument();
  });
});
