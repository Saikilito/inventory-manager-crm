import { gql } from "@apollo/client";

export const UPDATE_STOCK_LOT = gql`
  mutation updateStockLot($input: UpdateStockLotInput!) {
    updateStockLot(input: $input) {
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

export const COMPLETE_STOCK_LOT = gql`
  mutation completeStockLot($stockLotId: ID!, $accountId: ID) {
    completeStockLot(stockLotId: $stockLotId, accountId: $accountId) {
      stockLot {
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
      accountsPayableId
      createdProducts {
        id: _id
        name
        costPrice: purchasePrice
        stock
      }
      updatedProducts {
        id: _id
        name
        costPrice: purchasePrice
        stock
      }
    }
  }
`;
export const CREATE_STOCK_LOT = gql`
  mutation createStockLot($input: CreateStockLotInput!) {
    createStockLot(input: $input) {
      stockLot {
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
      accountsPayableId
      createdProducts {
        id: _id
        name
        costPrice: purchasePrice
        stock
      }
      updatedProducts {
        id: _id
        name
        costPrice: purchasePrice
        stock
      }
    }
  }
`;
