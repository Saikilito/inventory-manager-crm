import { Id, IdVO } from '../shared/value-objects/id.vo.js';
import { NonEmptyString, NonEmptyStringVO } from '../shared/value-objects/non-empty-string.vo.js';
import { ClientRatingTier, type RatingTier, ClientRatingTierVO } from '../shared/value-objects/client-rating-tier.vo.js';

export { ClientRatingTier, type RatingTier, ClientRatingTierVO };

export const calculateClientRatingTier = (completedOrdersCount: number): ClientRatingTier => {
  if (completedOrdersCount >= 11) return ClientRatingTier.PREMIUM;
  if (completedOrdersCount >= 3) return ClientRatingTier.CONCURRENT;
  return ClientRatingTier.BASIC;
};

export interface IClient {
  id?: Id;
  firstName: NonEmptyString;
  lastName: NonEmptyString;
  address: NonEmptyString;
  whatsapp: NonEmptyString;
  nationalId: NonEmptyString;
  type: RatingTier;
  orders: Id[];
  sellerId: Id;
}

export const makeClient = (props: {
  id?: string;
  firstName: string;
  lastName: string;
  address: string;
  whatsapp: string;
  nationalId: string;
  type: string;
  orders: string[];
  sellerId: string;
}): IClient => {
  return {
    id: props.id ? IdVO.create(props.id) : undefined,
    firstName: NonEmptyStringVO.create(props.firstName),
    lastName: NonEmptyStringVO.create(props.lastName),
    address: NonEmptyStringVO.create(props.address),
    whatsapp: NonEmptyStringVO.create(props.whatsapp),
    nationalId: NonEmptyStringVO.create(props.nationalId),
    type: ClientRatingTierVO.create(props.type),
    orders: (props.orders || []).map(IdVO.create),
    sellerId: IdVO.create(props.sellerId),
  };
};
