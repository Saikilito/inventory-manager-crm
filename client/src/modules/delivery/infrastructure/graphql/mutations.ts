import { gql } from "@apollo/client";

export const UPDATE_DELIVERY_STATUS = gql`
  mutation updateDeliveryStatus($id: ID!, $status: DeliveryStatus!) {
    updateDeliveryStatus(id: $id, status: $status) {
      id
      status
    }
  }
`;