import { gql } from "@apollo/client";

export const GET_ALL_DELIVERIES = gql`
  query getAllDeliveries {
    getAllDeliveries {
      id
      orderId
      scheduledDate
      deliveryTime
      address
      status
      notes
      deliveryCost
      paymentAccounts
    }
  }
`;