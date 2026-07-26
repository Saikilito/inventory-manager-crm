import { gql } from "@apollo/client";

export const CREATE_STOCK_LOT = gql`
  mutation createStockLot($input: CreateStockLotInput!) {
    createStockLot(input: $input) {
      stockLot {
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
      transaction {
        id
        amount
        type
        description
        accountId
        createdAt
      }
      accountsPayable {
        id
        stockLotId
        supplier
        totalAmount
        remainingBalance
        status
      }
      productsUpdated {
        id
        name
        costPrice
        stock
      }
      success
      message
    }
  }
`;
