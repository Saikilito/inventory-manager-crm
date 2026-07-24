import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing";
import { GET_SYSTEM_CONFIG } from "@modules/settings/infrastructure/graphql/queries";
import { UPDATE_SYSTEM_CONFIG } from "@modules/settings/infrastructure/graphql/mutations";
import { FeatureFlagPanel } from "../FeatureFlagPanel";
import { SystemConfigProvider } from "@contexts/SystemConfigContext";

describe("FeatureFlagPanel Integration with SystemConfigContext", () => {
  const mockSystemConfigEnabled = {
    id: "system-config-1",
    rentalsEnabled: true,
  };

  const mockSystemConfigDisabled = {
    id: "system-config-1",
    rentalsEnabled: false,
  };

  const successfulQueryMockEnabled = {
    request: {
      query: GET_SYSTEM_CONFIG,
    },
    result: {
      data: {
        getSystemConfig: mockSystemConfigEnabled,
      },
    },
  };

  const successfulQueryMockDisabled = {
    request: {
      query: GET_SYSTEM_CONFIG,
    },
    result: {
      data: {
        getSystemConfig: mockSystemConfigDisabled,
      },
    },
  };

  const successfulMutationMock = {
    request: {
      query: UPDATE_SYSTEM_CONFIG,
      variables: {
        rentalsEnabled: false,
      },
    },
    result: {
      data: {
        updateSystemConfig: {
          id: "system-config-1",
          rentalsEnabled: false,
        },
      },
    },
  };

  const renderWithProviders = (mocks: any[]) => {
    return render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <SystemConfigProvider>
          <FeatureFlagPanel />
        </SystemConfigProvider>
      </MockedProvider>
    );
  };

  it("should display rentals feature flag status when enabled", async () => {
    renderWithProviders([successfulQueryMockEnabled]);

    await waitFor(() => {
      expect(screen.getByText("Rentals Module (Alquileres)")).toBeInTheDocument();
    });

    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("should display rentals feature flag status when disabled", async () => {
    renderWithProviders([successfulQueryMockDisabled]);

    await waitFor(() => {
      expect(screen.getByText("Rentals Module (Alquileres)")).toBeInTheDocument();
    });

    expect(screen.getByText("Disabled")).toBeInTheDocument();
  });

  it("should toggle rentals feature flag on button click", async () => {
    const mutationMock = {
      request: {
        query: UPDATE_SYSTEM_CONFIG,
        variables: {
          rentalsEnabled: false,
        },
      },
      result: {
        data: {
          updateSystemConfig: {
            id: "system-config-1",
            rentalsEnabled: false,
          },
        },
      },
    };

    renderWithProviders([successfulQueryMockEnabled, mutationMock]);

    await waitFor(() => {
      expect(screen.getByText("Active")).toBeInTheDocument();
    });

    const toggleButton = screen.getByRole("button", { name: /toggle rentals module/i });
    fireEvent.click(toggleButton);

    await waitFor(() => {
      expect(screen.getByText("Active")).toBeInTheDocument();
    });
  });

  it("should show loading state during mutation", async () => {
    const slowMutationMock = {
      request: {
        query: UPDATE_SYSTEM_CONFIG,
        variables: {
          rentalsEnabled: false,
        },
      },
      delay: 100,
      result: {
        data: {
          updateSystemConfig: {
            id: "system-config-1",
            rentalsEnabled: false,
          },
        },
      },
    };

    renderWithProviders([successfulQueryMockEnabled, slowMutationMock]);

    await waitFor(() => {
      expect(screen.getByText("Active")).toBeInTheDocument();
    });

    const toggleButton = screen.getByRole("button", { name: /toggle rentals module/i });
    fireEvent.click(toggleButton);

    expect(toggleButton).toBeDisabled();
  });

  it("should display error state when query fails", async () => {
    const errorMock = {
      request: {
        query: GET_SYSTEM_CONFIG,
      },
      error: new Error("Network error"),
    };

    renderWithProviders([errorMock]);

    await waitFor(() => {
      expect(screen.getByText("Failed to load feature flags")).toBeInTheDocument();
    });

    expect(screen.getByText("Network error")).toBeInTheDocument();
  });
});
