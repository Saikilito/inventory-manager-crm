import { gql } from "@apollo/client";

export const GET_STOCK_LOTS = gql`
  query getStockLots($contextId: ID, $supplierName: String, $status: String) {
    stockLots(contextId: $contextId, supplierName: $supplierName, status: $status) {
      id
      supplier
      purchaseDate
      items {
        id
        productName
        quantity
        unitCost
        suggestedSellingPrice
        confirmedSellingPrice
        isNewProduct
        productId
        projectedProfit
      }
      paymentMethod
      transactionId
      accountsPayableId
      status
      contextId
      createdAt
      updatedAt
    }
  }
`;

export const GET_STOCK_LOT = gql`
  query getStockLot($id: ID!) {
    stockLot(id: $id) {
      id
      supplier
      purchaseDate
      items {
        id
        productName
        quantity
        unitCost
        suggestedSellingPrice
        confirmedSellingPrice
        isNewProduct
        productId
        projectedProfit
      }
      paymentMethod
      transactionId
      accountsPayableId
      status
      contextId
      createdAt
      updatedAt
    }
  }
`;
