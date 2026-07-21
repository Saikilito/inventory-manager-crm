import React, { Fragment } from 'react';
import { match } from 'ts-pattern';
import { KnowledgeCategory, KNOWN_KNOWLEDGE_CATEGORIES } from '@shared-domain/knowledge';

interface CategoryFilterProps {
  value: string;
  onChange: (value: string) => void;
}

const formatLabel = (value: string): string => {
  return match(value)
    .with(KnowledgeCategory.SALES, () => 'Sales')
    .with(KnowledgeCategory.PRODUCTS, () => 'Products')
    .with(KnowledgeCategory.COMPANY, () => 'Company')
    .with(KnowledgeCategory.CUSTOMER_SERVICE, () => 'Customer Service')
    .otherwise(() => value);
};

export const CategoryFilter: React.FC<CategoryFilterProps> = ({ value, onChange }) => {
  return (
    <div className="relative">
      <label
        htmlFor="knowledge-category-filter"
        className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1.5"
      >
        Category
      </label>
      <select
        id="knowledge-category-filter"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="block w-full sm:w-56 h-11 px-3 pr-8 text-sm bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 border border-stone-200 dark:border-stone-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm transition-all duration-150 cursor-pointer"
      >
        <option value="">All categories</option>
        <Fragment>
          {KNOWN_KNOWLEDGE_CATEGORIES.map((category: string) => (
            <option key={category} value={category}>
              {formatLabel(category)}
            </option>
          ))}
        </Fragment>
      </select>
    </div>
  );
};

export default CategoryFilter;
