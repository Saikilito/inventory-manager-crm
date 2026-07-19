import { makePloc, Ploc } from '@modules/shared/presentation/ploc/ploc';
import { contextsInitialState, ContextsState, ContextsStateKind } from './contexts-state';
import { GetAllContextsUseCase } from '../../application/use-cases/get-all-contexts';
import { CreateContextUseCase } from '../../application/use-cases/create-context';
import { UpdateContextUseCase } from '../../application/use-cases/update-context';
import { DeleteContextUseCase } from '../../application/use-cases/delete-context';
import { IContext, makeContext } from '@shared-domain/context/context.entity';
import { IdVO } from '@shared-domain/shared/value-objects/id.vo';

export interface ContextsPloc extends Ploc<ContextsState> {
  load(): Promise<void>;
  openCreate(): void;
  openEdit(context: IContext): void;
  closePanel(): void;
  save(contextData: { name: string; attributes: Array<{ name: string; label?: string; type: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'MULTIPLE'; required: boolean }> }): Promise<void>;
  openDeleteConfirm(context: IContext): void;
  closeDeleteConfirm(): void;
  confirmDelete(id: string): Promise<void>;
}

export function makeContextsPloc(
  getAllContexts: GetAllContextsUseCase,
  createContext: CreateContextUseCase,
  updateContext: UpdateContextUseCase,
  deleteContext: DeleteContextUseCase
): ContextsPloc {
  const ploc = makePloc<ContextsState>(contextsInitialState);

  const load = async () => {
    ploc.changeState((current) => ({
      ...current,
      kind: ContextsStateKind.LOADING,
      errorMessage: undefined,
    }));

    const result = await getAllContexts.execute();

    if (result.isFailure) {
      ploc.changeState((current) => ({
        ...current,
        kind: ContextsStateKind.ERROR,
        errorMessage: result.getError().message || 'Error loading contexts',
      }));
    } else {
      ploc.changeState((current) => ({
        ...current,
        kind: ContextsStateKind.LOADED,
        contexts: result.getValue(),
      }));
    }
  };

  const openCreate = () => {
    ploc.changeState((current) => ({
      ...current,
      selectedContext: undefined,
      showSlideOver: true,
      errorMessage: undefined,
    }));
  };

  const openEdit = (context: IContext) => {
    ploc.changeState((current) => ({
      ...current,
      selectedContext: context,
      showSlideOver: true,
      errorMessage: undefined,
    }));
  };

  const closePanel = () => {
    ploc.changeState((current) => ({
      ...current,
      showSlideOver: false,
      selectedContext: undefined,
      errorMessage: undefined,
    }));
  };

  const save = async (contextData: { name: string; attributes: Array<{ name: string; label?: string; type: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'MULTIPLE'; required: boolean }> }) => {
    const current = ploc.state();
    const isEdit = !!current.selectedContext;
    const oldId = current.selectedContext?.id;

    const contextToSave = makeContext({
      id: oldId,
      name: contextData.name,
      attributes: contextData.attributes,
    });

    const result = isEdit
      ? await updateContext.execute(contextToSave)
      : await createContext.execute(contextToSave);

    if (result.isFailure) {
      ploc.changeState((current) => ({
        ...current,
        errorMessage: result.getError().message || 'Error saving context',
      }));
    } else {
      ploc.changeState((current) => ({
        ...current,
        showSlideOver: false,
        selectedContext: undefined,
        errorMessage: undefined,
      }));
      await load();
    }
  };

  const openDeleteConfirm = (context: IContext) => {
    ploc.changeState((current) => ({
      ...current,
      selectedContext: context,
      showDeleteConfirm: true,
      errorMessage: undefined,
    }));
  };

  const closeDeleteConfirm = () => {
    ploc.changeState((current) => ({
      ...current,
      showDeleteConfirm: false,
      selectedContext: undefined,
      errorMessage: undefined,
    }));
  };

  const confirmDelete = async (id: string) => {
    const idVO = IdVO.create(id);
    const result = await deleteContext.execute(idVO);

    if (result.isFailure) {
      ploc.changeState((current) => ({
        ...current,
        errorMessage: result.getError().message || 'Error deleting context',
      }));
    } else {
      ploc.changeState((current) => ({
        ...current,
        showDeleteConfirm: false,
        selectedContext: undefined,
        errorMessage: undefined,
      }));
      await load();
    }
  };

  return {
    ...ploc,
    load,
    openCreate,
    openEdit,
    closePanel,
    save,
    openDeleteConfirm,
    closeDeleteConfirm,
    confirmDelete,
  };
}
