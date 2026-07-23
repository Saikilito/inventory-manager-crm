import mongoose, { Schema, Document } from "mongoose";
import { IProduct } from "../../../../../shared-domain/src/product/product.entity.js";

export interface IProductDocument extends Omit<IProduct, "id" | "contextId">, Document {
  _id: mongoose.Types.ObjectId;
  contextId?: mongoose.Types.ObjectId;
  isTesting: boolean;
}

const productSchema = new Schema<IProductDocument>({
  name: { type: String, required: true },
  purchasePrice: { type: Number, default: 0, required: true },
  sellingPrice: { type: Number, default: 0, required: true },
  stock: { type: Number, required: true, default: 0 },
  unitOfMeasure: { type: String, default: 'UNIT' },
  contextId: { type: Schema.Types.ObjectId, ref: 'Context', default: null },
  customAttributes: { type: Schema.Types.Mixed, default: {} },
  presentation: {
    packagingType: { type: String },
    contentSize: { type: Number },
    contentUom: { type: String },
  },
  isTesting: { type: Boolean, default: false, index: true },
});

// Index for context-based queries
productSchema.index({ contextId: 1 });

export const ProductModel = (mongoose.models.Product as mongoose.Model<IProductDocument>) || mongoose.model<IProductDocument>(
  "Product",
  productSchema,
);
export default ProductModel;
