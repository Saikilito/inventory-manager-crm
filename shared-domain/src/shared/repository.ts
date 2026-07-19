import { Result } from './result.js';
import { DatabaseError } from './errors.js';
import { Id } from './value-objects/id.vo.js';
import { PositiveNumber } from './value-objects/positive-number.vo.js';
import { NonEmptyString } from './value-objects/non-empty-string.vo.js';

export namespace IShared {
  export type IOmitBase = 'id' | 'createdAt' | 'updatedAt' | 'deletedAt' | 'createdBy' | 'updatedBy' | 'deletedBy';
  
  export type Literal = string | number | boolean | null | undefined | Date;
  
  export namespace VO {
    export type Id = import('./value-objects/id.vo.js').Id;
    export type PositiveNumber = import('./value-objects/positive-number.vo.js').PositiveNumber;
    export type NonEmptyString = import('./value-objects/non-empty-string.vo.js').NonEmptyString;
  }
  
  export interface PaginatedResult<T> {
    items: T[];
    total: number;
    page: number;
    limit: number;
    pages: number;
  }
}

export type CreateEntityInput<E> = Omit<E, IShared.IOmitBase> & Partial<Pick<E, Extract<keyof E, IShared.IOmitBase>>>;
export type UpdateEntityInput<E> = Omit<Partial<E>, IShared.IOmitBase> & Partial<Pick<E, Extract<keyof E, IShared.IOmitBase>>>;

export type SortDirection = 'ASC' | 'DESC';

export type SortInput = {
  field: string;
  direction?: SortDirection;
};

export type RawGetAllJoinDeclarationsInput = unknown;
export type RawRelationWhereGroup = Record<string, unknown>;

export interface GetAllInput {
  page?: IShared.VO.PositiveNumber;
  limit?: IShared.VO.PositiveNumber;
  relations?: IShared.VO.NonEmptyString[];
  joins?: RawGetAllJoinDeclarationsInput;
  where?: {
    fields?: WhereField[];
    relations?: RawRelationWhereGroup[];
  };
  sort?: SortInput;
}

export type WhereOperator =
  | ''
  | '='
  | '!='
  | 'NOT IN'
  | 'ILIKE'
  | 'IS NULL'
  | 'IS NOT NULL'
  | '<'
  | '>'
  | '<='
  | '>=';

export interface WhereField {
  field: IShared.VO.NonEmptyString | IShared.VO.NonEmptyString[];
  value: IShared.Literal | IShared.Literal[];
  operator?: WhereOperator;
  clearAlias?: boolean;
}

export interface BaseRepository<T> {
  create(
    input: CreateEntityInput<T>,
    createdBy: IShared.VO.Id,
  ): Promise<Result<T, DatabaseError>>;
  create(
    input: CreateEntityInput<T>[],
    createdBy: IShared.VO.Id,
  ): Promise<Result<T[], DatabaseError>>;
  create(
    input: CreateEntityInput<T> | CreateEntityInput<T>[],
    createdBy: IShared.VO.Id,
  ): Promise<Result<T | T[], DatabaseError>>;
  getOne<R = T>(where: WhereField[]): Promise<Result<R | null, DatabaseError>>;
  getById<R = T>(
    id: IShared.VO.Id,
    relations?: IShared.VO.NonEmptyString[],
  ): Promise<Result<R | null, DatabaseError>>;
  getAll<R = T>(
    input?: GetAllInput,
  ): Promise<Result<IShared.PaginatedResult<R>, DatabaseError>>;
  updateById(
    id: IShared.VO.Id,
    input: UpdateEntityInput<T>,
    updatedBy: IShared.VO.Id,
  ): Promise<Result<void, DatabaseError>>;
  updateByIdIf(
    id: IShared.VO.Id,
    where: Partial<Record<keyof T, unknown>>,
    input: UpdateEntityInput<T>,
    updatedBy: IShared.VO.Id,
  ): Promise<Result<boolean, DatabaseError>>;
  deleteByIds(
    ids: IShared.VO.Id[],
    deletedBy: IShared.VO.Id,
  ): Promise<Result<void, DatabaseError>>;
}
