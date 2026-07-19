import { Id, IdVO } from '../shared/value-objects/id.vo.js';
import { NonEmptyString, NonEmptyStringVO } from '../shared/value-objects/non-empty-string.vo.js';

export const ContextAttributeType = {
  STRING: 'STRING',
  NUMBER: 'NUMBER',
  BOOLEAN: 'BOOLEAN',
  MULTIPLE: 'MULTIPLE'
} as const;

export type ContextAttributeType = typeof ContextAttributeType[keyof typeof ContextAttributeType];

export interface IContextAttributeDef {
  name: NonEmptyString;
  label: NonEmptyString;
  type: ContextAttributeType;
  required: boolean;
}

export interface IContext {
  id?: Id;
  name: NonEmptyString;
  attributes: IContextAttributeDef[];
}

export const makeContext = (props: {
  id?: string;
  name: string;
  attributes: Array<{
    name: string;
    label?: string;
    type: ContextAttributeType;
    required: boolean;
  }>;
}): IContext => {
  return {
    id: props.id ? IdVO.create(props.id) : undefined,
    name: NonEmptyStringVO.create(props.name),
    attributes: (props.attributes || []).map(attr => ({
      name: NonEmptyStringVO.create(attr.name),
      label: NonEmptyStringVO.create(attr.label || attr.name),
      type: attr.type,
      required: !!attr.required
    }))
  };
};
