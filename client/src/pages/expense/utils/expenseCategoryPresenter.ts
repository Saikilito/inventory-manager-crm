import { match } from 'ts-pattern';
import { ExpenseCategory } from '@shared-domain/expense/expense.entity';

export const getCategoryBadgeClass = (cat: string): string => {
  return match(cat)
    .with(
      ExpenseCategory.REPLENISHMENT,
      () =>
        'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200/50 dark:border-amber-800/40',
    )
    .with(
      ExpenseCategory.SALARY,
      () =>
        'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200/50 dark:border-blue-800/40',
    )
    .with(
      ExpenseCategory.RENT,
      () =>
        'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200/50 dark:border-purple-800/40',
    )
    .with(
      ExpenseCategory.UTILITIES,
      () =>
        'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 border-orange-200/50 dark:border-orange-800/40',
    )
    .with(
      ExpenseCategory.MARKETING,
      () =>
        'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300 border-pink-200/50 dark:border-pink-800/40',
    )
    .with(
      ExpenseCategory.TRANSPORTATION,
      () =>
        'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-300 border-slate-200/50 dark:border-slate-800/40',
    )
    .with(
      ExpenseCategory.TAX,
      () => 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-200/50 dark:border-red-800/40',
    )
    .otherwise(
      () =>
        'bg-stone-100 text-stone-800 dark:bg-stone-800/30 dark:text-stone-300 border-stone-200/50 dark:border-stone-800/40',
    );
};

export const getCategoryLabel = (cat: string): string => {
  if (!cat) return '';
  return cat.charAt(0) + cat.slice(1).toLowerCase();
};
