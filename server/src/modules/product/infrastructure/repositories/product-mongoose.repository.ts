import mongoose from 'mongoose';
import { IProductRepository, ProductSearchTokens } from '../../application/repositories/product.repository.js';
import { IProduct, makeProduct } from '../../../../../../shared-domain/src/product/product.entity.js';
import ProductModel, { IProductDocument } from '../product.model.js';
import { makeMongooseBaseRepository } from '../../../shared/infrastructure/repositories/mongoose-base.repository.js';
import { escapeRegExp } from '../../../../../../shared-domain/src/shared/utils/string-utils.js';
import { IShared } from '../../../../../../shared-domain/src/shared/repository.js';

const buildAccentInsensitiveRegexPattern = (str: string): string => {
  const escaped = escapeRegExp(str);
  return escaped
    .replace(/[aAáÁ]/g, '[aAáÁ]')
    .replace(/[eEéÉ]/g, '[eEéÉ]')
    .replace(/[iIíÍ]/g, '[iIíÍ]')
    .replace(/[oOóÓ]/g, '[oOóÓ]')
    .replace(/[uUúÚ]/g, '[uUúÚ]');
};

const mapToDomain = (doc: IProductDocument): IProduct => {
  return makeProduct({
    id: doc._id.toString(),
    name: doc.name,
    purchasePrice: doc.purchasePrice,
    sellingPrice: doc.sellingPrice,
    stock: doc.stock,
    contextId: doc.contextId?.toString(),
  });
};

export const makeProductMongooseRepository = (): IProductRepository => {
  const base = makeMongooseBaseRepository<IProduct, IProductDocument>({
    model: ProductModel,
    mapToDomain,
    mapToDocumentData: (product) => {
      const data: Record<string, unknown> = {};
      if (product.id) data._id = new mongoose.Types.ObjectId(product.id.toString());
      if (product.name !== undefined) data.name = product.name;
      if (product.purchasePrice !== undefined) data.purchasePrice = product.purchasePrice;
      if (product.sellingPrice !== undefined) data.sellingPrice = product.sellingPrice;
      if (product.stock !== undefined) data.stock = product.stock;
      if (product.contextId !== undefined) {
        data.contextId = product.contextId ? new mongoose.Types.ObjectId(product.contextId.toString()) : null;
      }

      return data as Partial<IProductDocument>;
    },
  });

  return {
    ...base,

    async searchByTokens(tokens: ProductSearchTokens): Promise<IShared.PaginatedResult<IProduct>> {
      const andConditions: Array<Record<string, unknown>> = [];

      if (tokens.contextId) {
        andConditions.push({
          contextId: tokens.contextId,
        });
      }

      if (tokens.nameTokens.length > 0) {
        andConditions.push({
          $and: tokens.nameTokens.map((token) => ({
            name: { $regex: buildAccentInsensitiveRegexPattern(token), $options: 'i' },
          })),
        });
      }

      if (tokens.motoBrand || tokens.motoModel) {
        const compatibilityOr: Array<Record<string, unknown>> = [
          { 'customAttributes.motoBrand': { $regex: escapeRegExp('Universal'), $options: 'i' } },
          { 'customAttributes.motoBrand': { $exists: false } },
          { contextId: null },
        ];
        if (tokens.motoBrand) {
          compatibilityOr.push({
            'customAttributes.motoBrand': { $regex: escapeRegExp(tokens.motoBrand), $options: 'i' },
          });
        }
        if (tokens.motoModel) {
          compatibilityOr.push({
            'customAttributes.motoModel': { $regex: escapeRegExp(tokens.motoModel), $options: 'i' },
          });
        }
        andConditions.push({ $or: compatibilityOr });
      }

      if (tokens.partBrand) {
        andConditions.push({
          'customAttributes.partBrand': { $regex: escapeRegExp(tokens.partBrand), $options: 'i' },
        });
      }

      const filter = andConditions.length > 0 ? { $and: andConditions } : {};
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
