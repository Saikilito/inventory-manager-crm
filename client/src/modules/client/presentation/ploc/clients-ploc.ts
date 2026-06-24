import { makePloc, Ploc } from '@modules/shared/presentation/ploc/ploc';
import { clientsInitialState, ClientsState, ClientsStateKind } from './clients-state';
import { GetClientsUseCase } from '@modules/client/application/use-cases/get-clients';
import { DeleteClientUseCase } from '@modules/client/application/use-cases/delete-client';
import { PositiveNumberVO } from '@shared-domain/shared/value-objects/positive-number.vo';
import { IdVO } from '@shared-domain/shared/value-objects/id.vo';

export interface ClientsPloc extends Ploc<ClientsState> {
  load(page?: number, limit?: number, sellerId?: string): Promise<void>;
  deleteClient(id: string): Promise<void>;
}

export function makeClientsPloc(
  getClients: GetClientsUseCase,
  deleteClientUseCase: DeleteClientUseCase
): ClientsPloc {
  const ploc = makePloc<ClientsState>(clientsInitialState);

  const load = async (page: number = 1, limit: number = 8, sellerId: string = '') => {
    const currentState = ploc.state();

    if (currentState.kind === ClientsStateKind.LOADED) {
      ploc.changeState({
        kind: ClientsStateKind.RELOADING,
        clients: currentState.clients,
        currentPage: page,
        limit,
        sellerId,
        totalClients: currentState.totalClients,
      });
    } else {
      ploc.changeState({
        kind: ClientsStateKind.LOADING,
        currentPage: page,
        limit,
        sellerId,
        totalClients: currentState.totalClients,
      });
    }

    const offsetVal = (page - 1) * limit;
    const limitVO = PositiveNumberVO.create(limit);
    const offsetVO = PositiveNumberVO.create(offsetVal);
    const sellerIdVO = sellerId ? IdVO.create(sellerId) : undefined;

    const result = await getClients.execute(limitVO, offsetVO, sellerIdVO);

    if (result.isFailure) {
      const err = result.getError();
      ploc.changeState({
        kind: ClientsStateKind.ERROR,
        errorMessage: err.message || 'Error loading clients',
        currentPage: page,
        limit,
        sellerId,
        totalClients: 0,
      });
    } else {
      const data = result.getValue();
      ploc.changeState({
        kind: ClientsStateKind.LOADED,
        clients: data.clients,
        totalClients: data.totalClients,
        currentPage: page,
        limit,
        sellerId,
      });
    }
  };

  const deleteClient = async (id: string) => {
    const currentState = ploc.state();
    const idVO = IdVO.create(id);

    const result = await deleteClientUseCase.execute(idVO);

    if (result.isFailure) {
      const err = result.getError();
      ploc.changeState({
        ...currentState,
        kind: ClientsStateKind.ERROR,
        errorMessage: err.message || 'Error deleting client',
      });
    } else {
      load(currentState.currentPage, currentState.limit, currentState.sellerId);
    }
  };

  return {
    ...ploc,
    load,
    deleteClient,
  };
}
