import mongoose from 'mongoose';
import { IStockLotRepository } from '../../application/repositories/stock-lot.repository.js';
import { IStockLot, makeStockLot, makeStockLotItem } from '../../../../../../shared-domain/src/stock-lot/stock-lot.entity.js';
import StockLotModel, { IStockLotDocument } from '../stock-lot.model.js';
import { makeMongooseBaseRepository } from '../../../shared/infrastructure/repositories/mongoose-base.repository.js';

const mapToDomain = (doc: IStockLotDocument): IStockLot => {
  const items = doc.items.map((item) => makeStockLotItem({
    productId: item.productId?.toString(),
    productName: item.productName,
    quantity: Number(item.quantity),
    unitCost: Number(item.unitCost),
    confirmedSellingPrice: Number(item.confirmedSellingPrice),
    isNewProduct: item.isNewProduct,
  }));

  return makeStockLot({
    id: doc._id.toString(),
    supplier: doc.supplier,
    purchaseDate: doc.purchaseDate,
    items,
    paymentMethod: doc.paymentMethod,
    accountId: doc.accountId?.toString(),
    transactionId: doc.transactionId?.toString(),
    accountsPayableId: doc.accountsPayableId?.toString(),
    status: doc.status,
    notes: doc.notes,
    contextId: doc.contextId?.toString(),
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  });
};

export const makeStockLotMongooseRepository = (): IStockLotRepository => {
  const base = makeMongooseBaseRepository<IStockLot, IStockLotDocument>({
    model: StockLotModel,
    mapToDomain,
    mapToDocumentData: (stockLot) => {
      const data: Record<string, unknown> = {};
      
      if (stockLot.supplier !== undefined) data.supplier = stockLot.supplier;
      if (stockLot.purchaseDate !== undefined) data.purchaseDate = stockLot.purchaseDate;
      
      if (stockLot.items !== undefined) {
        data.items = stockLot.items.map((item) => ({
          productId: item.productId ? new mongoose.Types.ObjectId(item.productId.toString()) : undefined,
          productName: item.productName,
          quantity: item.quantity,
          unitCost: item.unitCost,
          confirmedSellingPrice: item.confirmedSellingPrice,
          isNewProduct: item.isNewProduct,
          projectedProfit: item.projectedProfit,
        }));
      }
      
      if (stockLot.totalCost !== undefined) data.totalCost = stockLot.totalCost;
      if (stockLot.projectedProfit !== undefined) data.projectedProfit = stockLot.projectedProfit;
      if (stockLot.paymentMethod !== undefined) data.paymentMethod = stockLot.paymentMethod;
      
      if (stockLot.accountId !== undefined) {
        data.accountId = stockLot.accountId ? new mongoose.Types.ObjectId(stockLot.accountId.toString()) : null;
      }

      if (stockLot.transactionId !== undefined) {
        data.transactionId = stockLot.transactionId ? new mongoose.Types.ObjectId(stockLot.transactionId.toString()) : null;
      }
      
      if (stockLot.accountsPayableId !== undefined) {
        data.accountsPayableId = stockLot.accountsPayableId ? new mongoose.Types.ObjectId(stockLot.accountsPayableId.toString()) : null;
      }
      
      if (stockLot.status !== undefined) data.status = stockLot.status;
      if (stockLot.notes !== undefined) data.notes = stockLot.notes;
      
      if (stockLot.contextId !== undefined) {
        data.contextId = stockLot.contextId ? new mongoose.Types.ObjectId(stockLot.contextId.toString()) : null;
      }

      return data as Partial<IStockLotDocument>;
    },
  });

  return {
    ...base,

    async findBySupplierName(supplier: string, contextId?: string): Promise<IStockLot[]> {
      const filter: Record<string, unknown> = {
        supplier: { $regex: supplier, $options: 'i' },
      };
      
      if (contextId) {
        filter.contextId = new mongoose.Types.ObjectId(contextId);
      }
      
      const docs = await StockLotModel.find(filter).exec();
      return docs.map(mapToDomain);
    },

    async findByStatus(status: string, contextId?: string): Promise<IStockLot[]> {
      const filter: Record<string, unknown> = { status };
      
      if (contextId) {
        filter.contextId = new mongoose.Types.ObjectId(contextId);
      }
      
      const docs = await StockLotModel.find(filter).exec();
      return docs.map(mapToDomain);
    },
  };
};
