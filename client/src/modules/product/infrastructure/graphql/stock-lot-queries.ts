import { gql } from "@apollo/client";

export const GET_STOCK_LOTS = gql`
  query getStockLots($contextId: ID, $supplierName: String, $status: String) {
    stockLots(contextId: $contextId, supplierName: $supplierName, status: $status) {
      id: _id
      supplier
      purchaseDate
      items {
        productId
        productName
        quantity
        unitCost
        confirmedSellingPrice
        isNewProduct
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
