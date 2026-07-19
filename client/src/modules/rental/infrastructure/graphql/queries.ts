import { gql } from "@apollo/client";

export const GET_ALL_RENTALS = gql`
  query getAllRentals {
    getAllRentals {
      _id
      productId
      orderId
      startDateTime
      endDateTime
      quantity
      status
    }
  }
`;