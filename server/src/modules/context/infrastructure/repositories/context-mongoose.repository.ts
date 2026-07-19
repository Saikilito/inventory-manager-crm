import { IContextRepository } from '../../application/repositories/context.repository.js';
import { IContext, makeContext, IContextAttributeDef, ContextAttributeType } from '../../../../../../shared-domain/src/context/context.entity.js';
import ContextModel, { IContextDocument } from '../context.model.js';
import { makeMongooseBaseRepository } from '../../../shared/infrastructure/repositories/mongoose-base.repository.js';

const mapToDomain = (doc: IContextDocument): IContext => {
  return makeContext({
    id: doc._id.toString(),
    name: doc.name,
    attributes: doc.attributes ? doc.attributes.map(attr => ({
      name: attr.name,
      label: attr.label,
      type: attr.type as ContextAttributeType,
      required: attr.required,
    })) : [],
  });
};

export const makeContextMongooseRepository = (): IContextRepository => {
  return makeMongooseBaseRepository<IContext, IContextDocument>({
    model: ContextModel,
    mapToDomain,
    mapToDocumentData: (context) => {
      const data: Partial<IContextDocument> = {};
      if (context.name !== undefined) {
        data.name = context.name.toString();
      }
      if (context.attributes !== undefined) {
        data.attributes = context.attributes.map((attr: IContextAttributeDef) => ({
          name: attr.name.toString(),
          label: attr.label.toString(),
          type: attr.type,
          required: attr.required,
        }));
      }
      return data;
    },
  });
};
