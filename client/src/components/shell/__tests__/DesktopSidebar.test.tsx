import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing";
import { BrowserRouter } from "react-router-dom";
import { DesktopSidebar } from "../DesktopSidebar";
import { GET_SYSTEM_CONFIG } from "@modules/settings/infrastructure/graphql/queries";
import { SystemConfigProvider } from "@contexts/SystemConfigContext";

vi.mock("@contexts/ShellContext", () => ({
  useShell: () => ({
    isSidebarCollapsed: false,
    toggleSidebar: vi.fn(),
    theme: "dark",
    toggleTheme: vi.fn(),
  }),
}));

vi.mock("@contexts/auth-context", () => ({
  useAuthPloc: () => ({
    logout: vi.fn(),
    checkSession: vi.fn(),
  }),
}));

vi.mock("@hooks/use-ploc-state", () => ({
  usePlocState: () => ({
    kind: "auth:authenticated",
    user: {
      id: "user-1",
      role: "ADMIN",
      firstName: "Admin",
      lastName: "User",
    },
  }),
}));

describe("DesktopSidebar - Rentals Feature Flag", () => {
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
            <DesktopSidebar />
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
      expect(screen.getByText("Chat")).toBeInTheDocument();
      expect(screen.getByText("Orders")).toBeInTheDocument();
      expect(screen.getByText("Products")).toBeInTheDocument();
      expect(screen.getByText("Clients")).toBeInTheDocument();
      expect(screen.queryByText("Rentals")).not.toBeInTheDocument();
    });
  });

  it("should position Rentals nav item between Clients and Users (when admin)", async () => {
    renderWithProviders([successfulMockEnabled]);

    await waitFor(() => {
      const rentalsLink = screen.getByRole("link", { name: /rentals/i });
      expect(rentalsLink).toBeInTheDocument();
    });

    const navItems = screen.getAllByRole("link");
    const rentalsIndex = navItems.findIndex((link) =>
      link.getAttribute("href") === "/rentals"
    );

    expect(rentalsIndex).toBeGreaterThan(-1);
    expect(navItems[rentalsIndex - 1]).toHaveAttribute("href", "/clients");
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
