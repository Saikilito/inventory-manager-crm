import mongoose from 'mongoose';
import { IProductRepository, ProductSearchTokens } from '../../application/repositories/product.repository.js';
import { IProduct, makeProduct } from '../../../../../../shared-domain/src/product/product.entity.js';
import ProductModel, { IProductDocument } from '../product.model.js';
import { makeMongooseBaseRepository } from '../../../shared/infrastructure/repositories/mongoose-base.repository.js';
import { escapeRegExp } from '../../../../../../shared-domain/src/shared/utils/string-utils.js';
import { IShared } from '../../../../../../shared-domain/src/shared/repository.js';
import { PositiveNumberVO } from '../../../../../../shared-domain/src/shared/value-objects/positive-number.vo.js';

const mapToDomain = (doc: IProductDocument): IProduct => {
  return makeProduct({
    id: doc._id.toString(),
    name: doc.name,
    price: doc.price,
    stock: doc.stock,
  });
};

export const makeProductMongooseRepository = (): IProductRepository => {
  const base = makeMongooseBaseRepository<IProduct, IProductDocument>({
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

  return {
    ...base,

    /**
     * searchByTokens
     *
     * Sanitises every free-form token before constructing the MongoDB $regex
     * query. Without escaping, a malicious caller (or a prompt that flows
     * user-controlled text into args.query) could inject patterns like
     * `.*` or `.{0,9999}` that match every document, or cause ReDoS-style
     * catastrophic backtracking. The escape is delegated to the shared
     * `escapeRegExp` utility so the safety boundary is enforced at the
     * repository layer, not in the dispatcher.
     */
    async searchByTokens(
      tokens: ProductSearchTokens,
    ): Promise<IShared.PaginatedResult<IProduct>> {
      const andConditions: Array<Record<string, unknown>> = [];

      if (tokens.contextId) {
        andConditions.push({
          contextId: new mongoose.Types.ObjectId(tokens.contextId),
        });
      }

      if (tokens.nameTokens.length > 0) {
        andConditions.push({
          $and: tokens.nameTokens.map((token) => ({
            name: { $regex: escapeRegExp(token), $options: "i" },
          })),
        });
      }

      if (tokens.motoBrand || tokens.motoModel) {
        const compatibilityOr: Array<Record<string, unknown>> = [
          { "customAttributes.motoBrand": { $regex: escapeRegExp("Universal"), $options: "i" } },
          { "customAttributes.motoBrand": { $exists: false } },
          { contextId: null },
        ];
        if (tokens.motoBrand) {
          compatibilityOr.push({
            "customAttributes.motoBrand": { $regex: escapeRegExp(tokens.motoBrand), $options: "i" },
          });
        }
        if (tokens.motoModel) {
          compatibilityOr.push({
            "customAttributes.motoBrand": { $regex: escapeRegExp(tokens.motoModel), $options: "i" },
          });
        }
        andConditions.push({ $or: compatibilityOr });
      }

      if (tokens.partBrand) {
        andConditions.push({
          "customAttributes.partBrand": { $regex: escapeRegExp(tokens.partBrand), $options: "i" },
        });
      }

      const filter = andConditions.length > 0 ? { $and: andConditions } : {};
      // tokens.limit is typed as PositiveNumber (an Opaque<number>) but at
      // runtime is just a number; .getValue() does not exist on the opaque
      // type. Number() here preserves the runtime value while satisfying the
      // strict generic that find().limit() expects.
      const limit = Number(tokens.limit);
      const docs = await ProductModel.find(filter).limit(limit).exec();

      const items = docs.map((doc) => mapToDomain(doc));
      const total = await ProductModel.countDocuments(filter).exec();
      return {
        items,
        total,
        page: 1,
        limit,
        pages: 1,
      };
    },
  };
};
