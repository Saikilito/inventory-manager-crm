import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing";
import { GET_SYSTEM_CONFIG } from "@modules/settings/infrastructure/graphql/queries";

vi.mock("react-dom/client", () => ({
  createRoot: vi.fn(() => ({
    render: vi.fn(),
  })),
}));

vi.mock("../../index.css", () => ({}));

describe("App Entry - SystemConfigProvider Integration", () => {
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

  it("should wrap App with SystemConfigProvider for feature flag access", async () => {
    const TestChild = () => {
      return <div data-testid="child">Child Component</div>;
    };

    const { SystemConfigProvider, useSystemConfig } = await import(
      "@contexts/SystemConfigContext"
    );

    const TestComponent = () => {
      const { rentalsEnabled } = useSystemConfig();
      return (
        <div>
          <span data-testid="feature-status">
            {rentalsEnabled ? "enabled" : "disabled"}
          </span>
          <TestChild />
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
      expect(screen.getByTestId("feature-status")).toHaveTextContent("enabled");
    });

    expect(screen.getByTestId("child")).toBeInTheDocument();
  });

  it("should provide SystemConfigProvider context to entire app tree", async () => {
    const { SystemConfigProvider, useSystemConfig } = await import(
      "@contexts/SystemConfigContext"
    );

    const DeepChild = () => {
      const { rentalsEnabled } = useSystemConfig();
      return (
        <span data-testid="deep-child">
          {rentalsEnabled ? "rentals-visible" : "rentals-hidden"}
        </span>
      );
    };

    const MiddleComponent = () => <DeepChild />;

    const TopComponent = () => <MiddleComponent />;

    render(
      <MockedProvider mocks={[successfulMock]} addTypename={false}>
        <SystemConfigProvider>
          <TopComponent />
        </SystemConfigProvider>
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("deep-child")).toHaveTextContent(
        "rentals-visible"
      );
    });
  });
});
