import { gql } from "@apollo/client";

export const UPDATE_SYSTEM_CONFIG = gql`
  mutation UpdateSystemConfig($rentalsEnabled: Boolean!) {
    updateSystemConfig(rentalsEnabled: $rentalsEnabled) {
      id
      rentalsEnabled
    }
  }
`;