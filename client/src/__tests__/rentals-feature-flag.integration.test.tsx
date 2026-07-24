import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing";
import { MemoryRouter } from "react-router-dom";
import { GET_SYSTEM_CONFIG } from "@modules/settings/infrastructure/graphql/queries";
import { SystemConfigProvider, useSystemConfig } from "@contexts/SystemConfigContext";

vi.mock("@contexts/ShellContext", () => ({
  ShellProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  useShell: () => ({
    isSidebarCollapsed: false,
    toggleSidebar: vi.fn(),
    theme: "dark",
    toggleTheme: vi.fn(),
  }),
}));

vi.mock("@contexts/auth-context", () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  useAuthPloc: () => ({
    checkSession: vi.fn(),
    logout: vi.fn(),
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

describe("Rentals Feature Flag - Integration Tests", () => {
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

  const TestComponent = () => {
    const { rentalsEnabled, loading } = useSystemConfig();
    
    return (
      <div>
        {loading && <span data-testid="loading">Loading...</span>}
        {!loading && (
          <div>
            <span data-testid="feature-flag-status">
              {rentalsEnabled ? "rentals-enabled" : "rentals-disabled"}
            </span>
            {rentalsEnabled && (
              <nav>
                <a href="/rentals" data-testid="rentals-nav">
                  Rentals
                </a>
              </nav>
            )}
          </div>
        )}
      </div>
    );
  };

  it("should enable rentals feature across the app when rentalsEnabled is true", async () => {
    render(
      <MockedProvider mocks={[successfulMockEnabled]} addTypename={false}>
        <SystemConfigProvider>
          <MemoryRouter>
            <TestComponent />
          </MemoryRouter>
        </SystemConfigProvider>
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("feature-flag-status")).toHaveTextContent(
        "rentals-enabled"
      );
    });

    expect(screen.getByTestId("rentals-nav")).toBeInTheDocument();
  });

  it("should disable rentals feature across the app when rentalsEnabled is false", async () => {
    render(
      <MockedProvider mocks={[successfulMockDisabled]} addTypename={false}>
        <SystemConfigProvider>
          <MemoryRouter>
            <TestComponent />
          </MemoryRouter>
        </SystemConfigProvider>
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("feature-flag-status")).toHaveTextContent(
        "rentals-disabled"
      );
    });

    expect(screen.queryByTestId("rentals-nav")).not.toBeInTheDocument();
  });

  it("should provide consistent feature flag state to all consumers", async () => {
    const ChildComponent1 = () => {
      const { rentalsEnabled } = useSystemConfig();
      return <span data-testid="child1">{rentalsEnabled ? "enabled" : "disabled"}</span>;
    };

    const ChildComponent2 = () => {
      const { rentalsEnabled } = useSystemConfig();
      return <span data-testid="child2">{rentalsEnabled ? "enabled" : "disabled"}</span>;
    };

    render(
      <MockedProvider mocks={[successfulMockEnabled]} addTypename={false}>
        <SystemConfigProvider>
          <ChildComponent1 />
          <ChildComponent2 />
        </SystemConfigProvider>
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("child1")).toHaveTextContent("enabled");
      expect(screen.getByTestId("child2")).toHaveTextContent("enabled");
    });
  });

  it("should handle loading state gracefully", async () => {
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

    render(
      <MockedProvider mocks={[slowMock]} addTypename={false}>
        <SystemConfigProvider>
          <TestComponent />
        </SystemConfigProvider>
      </MockedProvider>
    );

    expect(screen.getByTestId("loading")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByTestId("loading")).not.toBeInTheDocument();
    });

    expect(screen.getByTestId("feature-flag-status")).toBeInTheDocument();
  });
});
