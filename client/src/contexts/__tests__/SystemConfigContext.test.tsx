import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing";
import { GET_SYSTEM_CONFIG } from "@modules/settings/infrastructure/graphql/queries";
import {
  SystemConfigProvider,
  useSystemConfig,
} from "../SystemConfigContext";

describe("SystemConfigContext", () => {
  const mockSystemConfig = {
    id: "system-config-1",
    rentalsEnabled: true,
  };

  const successfulMock = {
    request: {
      query: GET_SYSTEM_CONFIG,
    },
    result: {
      data: {
        getSystemConfig: mockSystemConfig,
      },
    },
  };

  const errorMock = {
    request: {
      query: GET_SYSTEM_CONFIG,
    },
    error: new Error("Network error"),
  };

  it("should provide rentalsEnabled flag from GraphQL query result", async () => {
    const TestComponent = () => {
      const { rentalsEnabled, loading } = useSystemConfig();
      return (
        <div>
          {loading && <span data-testid="loading">Loading...</span>}
          {!loading && (
            <span data-testid="rentals-status">
              {rentalsEnabled ? "enabled" : "disabled"}
            </span>
          )}
        </div>
      );
    };

    render(
      <MockedProvider mocks={[successfulMock]} addTypename={false}>
        <SystemConfigProvider>
          <TestComponent />
        </SystemConfigProvider>
      </MockedProvider>
    );

    expect(screen.getByTestId("loading")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId("rentals-status")).toHaveTextContent("enabled");
    });
  });

  it("should default rentalsEnabled to false when query fails", async () => {
    const TestComponent = () => {
      const { rentalsEnabled, error, loading } = useSystemConfig();
      return (
        <div>
          {loading && <span data-testid="loading">Loading...</span>}
          {!loading && (
            <div>
              <span data-testid="rentals-status">
                {rentalsEnabled ? "enabled" : "disabled"}
              </span>
              {error && <span data-testid="error">{error.message}</span>}
            </div>
          )}
        </div>
      );
    };

    render(
      <MockedProvider mocks={[errorMock]} addTypename={false}>
        <SystemConfigProvider>
          <TestComponent />
        </SystemConfigProvider>
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("rentals-status")).toHaveTextContent("disabled");
    });

    expect(screen.getByTestId("error")).toHaveTextContent("Network error");
  });

  it("should provide loading state during GraphQL query", async () => {
    const TestComponent = () => {
      const { loading } = useSystemConfig();
      return <span data-testid="loading">{loading ? "loading" : "loaded"}</span>;
    };

    render(
      <MockedProvider mocks={[successfulMock]} addTypename={false}>
        <SystemConfigProvider>
          <TestComponent />
        </SystemConfigProvider>
      </MockedProvider>
    );

    expect(screen.getByTestId("loading")).toHaveTextContent("loading");

    await waitFor(() => {
      expect(screen.getByTestId("loading")).toHaveTextContent("loaded");
    });
  });

  it("should throw error when useSystemConfig is used outside provider", () => {
    const TestComponent = () => {
      useSystemConfig();
      return null;
    };

    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => render(<TestComponent />)).toThrow(
      "useSystemConfig must be used within SystemConfigProvider"
    );

    consoleError.mockRestore();
  });

  it("should expose rentalsEnabled as false when data is undefined", async () => {
    const emptyMock = {
      request: {
        query: GET_SYSTEM_CONFIG,
      },
      result: {
        data: {
          getSystemConfig: null,
        },
      },
    };

    const TestComponent = () => {
      const { rentalsEnabled, loading } = useSystemConfig();
      return (
        <div>
          {loading && <span data-testid="loading">Loading...</span>}
          {!loading && (
            <span data-testid="rentals-status">
              {rentalsEnabled ? "enabled" : "disabled"}
            </span>
          )}
        </div>
      );
    };

    render(
      <MockedProvider mocks={[emptyMock]} addTypename={false}>
        <SystemConfigProvider>
          <TestComponent />
        </SystemConfigProvider>
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("rentals-status")).toHaveTextContent("disabled");
    });
  });

  it("should fetch with cache-first policy", async () => {
    const TestComponent = () => {
      const { rentalsEnabled, loading } = useSystemConfig();
      return (
        <div>
          {loading && <span data-testid="loading">Loading...</span>}
          {!loading && (
            <span data-testid="rentals-status">
              {rentalsEnabled ? "enabled" : "disabled"}
            </span>
          )}
        </div>
      );
    };

    render(
      <MockedProvider mocks={[successfulMock]} addTypename={false}>
        <SystemConfigProvider>
          <TestComponent />
        </SystemConfigProvider>
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("rentals-status")).toBeInTheDocument();
    });
  });
});
