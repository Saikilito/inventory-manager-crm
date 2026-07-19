import { gql } from "@apollo/client";

export const RETURN_RENTAL = gql`
  mutation returnRentalEquipment($rentalId: ID!) {
    returnRentalEquipment(rentalId: $rentalId) {
      _id
      status
    }
  }
`;