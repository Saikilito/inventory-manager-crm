import { UseCase } from '../../../../../../shared-domain/src/shared/use-case.js';
import { DomainError, SchemaIntegrityError, NotFoundError } from '../../../../../../shared-domain/src/shared/errors.js';
import { Result } from '../../../../../../shared-domain/src/shared/result.js';
import { IdVO } from '../../../../../../shared-domain/src/shared/value-objects/id.vo.js';
import { NonEmptyStringVO } from '../../../../../../shared-domain/src/shared/value-objects/non-empty-string.vo.js';
import { IContext, makeContext } from '../../../../../../shared-domain/src/context/context.entity.js';
import { IContextRepository } from '../repositories/context.repository.js';
import { IProductRepository } from '../../../product/application/repositories/product.repository.js';

export interface UpdateContextInput {
  _id: string;
  name?: string;
  attributes?: Array<{
    name: string;
    label?: string;
    type: 'STRING' | 'NUMBER' | 'BOOLEAN';
    required: boolean;
  }>;
}

export type UpdateContext = UseCase<UpdateContextInput, IContext, DomainError>;

export const makeUpdateContext = (
  contextRepository: IContextRepository,
  productRepository: IProductRepository
): UpdateContext => {
  return async (input: UpdateContextInput) => {
    const existingContextResult = await contextRepository.getById(IdVO.create(input._id));
    if (existingContextResult.isFailure) {
      return Result.fail(existingContextResult.getError());
    }
    const oldContext = existingContextResult.getValue();
    if (!oldContext) {
      return Result.fail(new NotFoundError(`Context ${input._id} not found`));
    }

    if (input.attributes) {
      const minLength = Math.min(oldContext.attributes.length, input.attributes.length);
      for (let i = 0; i < minLength; i++) {
        const oldAttr = oldContext.attributes[i];
        const newAttr = input.attributes[i];
        if (oldAttr.name.toString() !== newAttr.name) {
          return Result.fail(new SchemaIntegrityError(`Cannot change technical name of attribute at index ${i} from "${oldAttr.name.toString()}" to "${newAttr.name}"`));
        }
      }
    }

    const productCheck = await productRepository.getOne([
      { field: NonEmptyStringVO.create('contextId'), value: input._id, operator: '=' }
    ]);
    if (productCheck.isFailure) {
      return Result.fail(productCheck.getError());
    }
    const isGuarded = productCheck.getValue() !== null;

    if (isGuarded && input.attributes) {
      const newAttrNames = new Set(input.attributes.map(a => a.name));
      for (const old of oldContext.attributes) {
        if (!newAttrNames.has(old.name.toString())) {
          return Result.fail(new SchemaIntegrityError(`Cannot delete attribute "${old.name.toString()}" because the context is currently in use by active products`));
        }
      }
      const oldMap = new Map<string, typeof oldContext.attributes[number]>(
        oldContext.attributes.map(a => [a.name.toString(), a])
      );
      for (const curr of input.attributes) {
        const prev = oldMap.get(curr.name);
        if (prev) {
          if (prev.type !== curr.type) {
            return Result.fail(new SchemaIntegrityError(`Cannot change type of attribute "${curr.name}" from ${prev.type} to ${curr.type} because the context is currently in use by active products`));
          }
          if (!prev.required && curr.required) {
            return Result.fail(new SchemaIntegrityError(`Cannot change attribute "${curr.name}" from optional to required because the context is currently in use by active products`));
          }
        } else if (curr.required) {
          return Result.fail(new SchemaIntegrityError(`New attribute "${curr.name}" must be optional because the context is currently in use by active products`));
        }
      }
    }

    const updatedContextProps = {
      id: input._id,
      name: input.name !== undefined ? input.name : oldContext.name,
      attributes: input.attributes !== undefined ? input.attributes : oldContext.attributes
    };
    const updatedContext = makeContext(updatedContextProps);

    const updateResult = await contextRepository.updateById(
      IdVO.create(input._id),
      updatedContext,
      IdVO.generateNil()
    );
    if (updateResult.isFailure) {
      return Result.fail(updateResult.getError());
    }

    return Result.ok<IContext, DomainError>(updatedContext);
  };
};
