import mongoose, { Schema, Document } from "mongoose";
import { IProduct } from "../../../../../shared-domain/src/product/product.entity.js";

export interface IProductDocument extends Omit<IProduct, "id">, Document {
  _id: mongoose.Types.ObjectId;
}

const productSchema = new Schema<IProductDocument>({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  stock: { type: Number, required: true },
});

export const ProductModel = mongoose.model<IProductDocument>(
  "Product",
  productSchema,
);
export default ProductModel;
