import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing";
import { MemoryRouter } from "react-router-dom";
import { GET_SYSTEM_CONFIG } from "@modules/settings/infrastructure/graphql/queries";
import { SystemConfigProvider, useSystemConfig } from "@contexts/SystemConfigContext";

vi.mock("@contexts/ShellContext", () => ({
  ShellProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
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

describe("Rentals Route Conditional", () => {
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
    const { rentalsEnabled } = useSystemConfig();
    
    return (
      <div>
        {rentalsEnabled && <div data-testid="rentals-route">Rentals Route</div>}
        <div data-testid="other-routes">Other Routes</div>
      </div>
    );
  };

  const renderWithProviders = (mocks: any[]) => {
    return render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <SystemConfigProvider>
          <MemoryRouter>
            <TestComponent />
          </MemoryRouter>
        </SystemConfigProvider>
      </MockedProvider>
    );
  };

  it("should render Rentals route when rentalsEnabled is true", async () => {
    renderWithProviders([successfulMockEnabled]);

    await waitFor(() => {
      expect(screen.getByTestId("rentals-route")).toBeInTheDocument();
    });

    expect(screen.getByText("Rentals Route")).toBeInTheDocument();
  });

  it("should not render Rentals route when rentalsEnabled is false", async () => {
    renderWithProviders([successfulMockDisabled]);

    await waitFor(() => {
      expect(screen.queryByTestId("rentals-route")).not.toBeInTheDocument();
    });

    expect(screen.getByTestId("other-routes")).toBeInTheDocument();
  });

  it("should allow access to all other routes when rentalsEnabled is false", async () => {
    renderWithProviders([successfulMockDisabled]);

    await waitFor(() => {
      expect(screen.getByTestId("other-routes")).toBeInTheDocument();
    });
  });
});
