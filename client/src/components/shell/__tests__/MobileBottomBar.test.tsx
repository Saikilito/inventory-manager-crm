import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing";
import { BrowserRouter } from "react-router-dom";
import { MobileBottomBar } from "../MobileBottomBar";
import { GET_SYSTEM_CONFIG } from "@modules/settings/infrastructure/graphql/queries";
import { SystemConfigProvider } from "@contexts/SystemConfigContext";

describe("MobileBottomBar - Rentals Feature Flag", () => {
  const mockSystemConfigEnabled = {
    id: "system-config-1",
    rentalsEnabled: true,
  };

  const mockSystemConfigDisabled = {
    id: "system-config-1",
    rentalsEnabled: false,
  };

  const successfulMockEnabled = {
    request: {
      query: GET_SYSTEM_CONFIG,
    },
    result: {
      data: {
        getSystemConfig: mockSystemConfigEnabled,
      },
    },
  };

  const successfulMockDisabled = {
    request: {
      query: GET_SYSTEM_CONFIG,
    },
    result: {
      data: {
        getSystemConfig: mockSystemConfigDisabled,
      },
    },
  };

  const renderWithProviders = (mocks: any[]) => {
    return render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <SystemConfigProvider>
          <BrowserRouter>
            <MobileBottomBar />
          </BrowserRouter>
        </SystemConfigProvider>
      </MockedProvider>
    );
  };

  it("should show Rentals nav item when rentalsEnabled is true", async () => {
    renderWithProviders([successfulMockEnabled]);

    await waitFor(() => {
      expect(screen.getByText("Rentals")).toBeInTheDocument();
    });

    const rentalsLink = screen.getByRole("link", { name: /rentals/i });
    expect(rentalsLink).toHaveAttribute("href", "/rentals");
  });

  it("should hide Rentals nav item when rentalsEnabled is false", async () => {
    renderWithProviders([successfulMockDisabled]);

    await waitFor(() => {
      expect(screen.queryByText("Rentals")).not.toBeInTheDocument();
    });
  });

  it("should show all other nav items regardless of rentals feature flag", async () => {
    renderWithProviders([successfulMockDisabled]);

    await waitFor(() => {
      expect(screen.getByText("Dashboard")).toBeInTheDocument();
      expect(screen.getByText("Clients")).toBeInTheDocument();
      expect(screen.getByText("Products")).toBeInTheDocument();
      expect(screen.getByText("Orders")).toBeInTheDocument();
      expect(screen.getByText("Expenses")).toBeInTheDocument();
      expect(screen.getByText("Finance")).toBeInTheDocument();
      expect(screen.getByText("Deliveries")).toBeInTheDocument();
      expect(screen.getByText("Chat")).toBeInTheDocument();
      expect(screen.queryByText("Rentals")).not.toBeInTheDocument();
    });
  });

  it("should not show Rentals link when loading", async () => {
    const slowMock = {
      request: {
        query: GET_SYSTEM_CONFIG,
      },
      delay: 100,
      result: {
        data: {
          getSystemConfig: mockSystemConfigEnabled,
        },
      },
    };

    renderWithProviders([slowMock]);

    expect(screen.queryByText("Rentals")).not.toBeInTheDocument();
  });
});
