import { IProductRepository } from '../../application/repositories/product.repository.js';
import { IProduct, makeProduct } from '../../../../../../shared-domain/src/product/product.entity.js';
import ProductModel, { IProductDocument } from '../product.model.js';
import { makeMongooseBaseRepository } from '../../../shared/infrastructure/repositories/mongoose-base.repository.js';

const mapToDomain = (doc: IProductDocument): IProduct => {
  return makeProduct({
    id: doc._id.toString(),
    name: doc.name,
    price: doc.price,
    stock: doc.stock,
  });
};

export const makeProductMongooseRepository = (): IProductRepository => {
  return makeMongooseBaseRepository<IProduct, IProductDocument>({
    model: ProductModel,
    mapToDomain,
    mapToDocumentData: (product) => {
      const data: Partial<IProductDocument> = {};
      if (product.name !== undefined) data.name = product.name;
      if (product.price !== undefined) data.price = product.price;
      if (product.stock !== undefined) data.stock = product.stock;
      return data;
    },
  });
};
