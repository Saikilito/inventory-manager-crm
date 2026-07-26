import React, { useEffect, useState } from 'react';
import { Wallet } from 'lucide-react';
import { IAccount } from '@shared-domain/financial/account.entity.js';
import { SortableAccountCard } from './SortableAccountCard';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';

interface AccountsOverviewProps {
  accounts: IAccount[];
  selectedAccountId: string | null;
  activeRate: number;
  isDayClosed: boolean;
  onSelectAccount: (id: string) => void;
  onOpenTxDrawer: (acc: IAccount, e?: React.MouseEvent) => void;
  onOpenAdjustModal: (acc: IAccount, e?: React.MouseEvent) => void;
}

const LOCAL_STORAGE_KEY = 'financial_accounts_order';

export const AccountsOverview: React.FC<AccountsOverviewProps> = ({
  accounts,
  selectedAccountId,
  activeRate,
  isDayClosed,
  onSelectAccount,
  onOpenTxDrawer,
  onOpenAdjustModal,
}) => {
  const [orderedAccounts, setOrderedAccounts] = useState<IAccount[]>([]);

  useEffect(() => {
    // Load saved order from localStorage
    const savedOrderJson = localStorage.getItem(LOCAL_STORAGE_KEY);
    let savedOrder: string[] = [];
    if (savedOrderJson) {
      try {
        savedOrder = JSON.parse(savedOrderJson);
      } catch (e) {
        console.error('Failed to parse accounts order from localStorage', e);
      }
    }

    if (savedOrder.length > 0 && accounts.length > 0) {
      // Sort accounts based on saved order array
      const sorted = [...accounts].sort((a, b) => {
        const idA = a.id?.toString() || '';
        const idB = b.id?.toString() || '';
        const indexA = savedOrder.indexOf(idA);
        const indexB = savedOrder.indexOf(idB);

        if (indexA === -1 && indexB === -1) return 0;
        if (indexA === -1) return 1; // Put unknown accounts at the end
        if (indexB === -1) return -1;
        return indexA - indexB;
      });
      setOrderedAccounts(sorted);
    } else {
      setOrderedAccounts(accounts);
    }
  }, [accounts]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Requires 5px movement before dragging starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setOrderedAccounts((items) => {
        const oldIndex = items.findIndex((i) => i.id?.toString() === active.id);
        const newIndex = items.findIndex((i) => i.id?.toString() === over.id);

        const newOrder = arrayMove(items, oldIndex, newIndex);
        
        // Save the new order of IDs to localStorage
        const orderIds = newOrder.map((a) => a.id?.toString() || '');
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(orderIds));

        return newOrder;
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
          <Wallet className="w-5 h-5 text-emerald-600" />
          Monodivisa Accounts
        </h3>
      </div>

      {accounts.length === 0 ? (
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-8 rounded-2xl text-center text-sm text-stone-500">
          No financial accounts registered yet.
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <SortableContext
              items={orderedAccounts.map(a => a.id?.toString() || '')}
              strategy={rectSortingStrategy}
            >
              {orderedAccounts.map((acc) => (
                <SortableAccountCard
                  key={acc.id?.toString()}
                  account={acc}
                  isSelected={selectedAccountId === acc.id?.toString()}
                  activeRate={activeRate}
                  isDayClosed={isDayClosed}
                  onSelectAccount={onSelectAccount}
                  onOpenTxDrawer={onOpenTxDrawer}
                  onOpenAdjustModal={onOpenAdjustModal}
                />
              ))}
            </SortableContext>
          </div>
        </DndContext>
      )}
    </div>
  );
};
