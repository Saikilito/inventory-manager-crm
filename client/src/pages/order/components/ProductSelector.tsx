import Select from 'react-select';
import makeAnimated from 'react-select/animated';
import { IProduct } from '@shared-domain/product/product.entity';

const animatedComponents = makeAnimated();

interface ProductSelectorProps {
  products: IProduct[];
  selectedProducts: Array<IProduct & { quantity: number }>;
  onSelectChange: (selectedProducts: Array<IProduct & { quantity: number }>) => void;
}

export const ProductSelector = ({
  products,
  selectedProducts,
  onSelectChange,
}: ProductSelectorProps) => {
  const handleSelectChange = (selected: unknown) => {
    if (!selected) {
      onSelectChange([]);
      return;
    }

    const selectedList = selected as IProduct[];
    const updated = selectedList.map((p) => {
      const existing = selectedProducts.find((ep) => String(ep.id) === String(p.id));
      return { ...p, quantity: existing ? existing.quantity : 1 };
    });

    onSelectChange(updated);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider border-t border-stone-100 dark:border-stone-800 pt-4">
        Select Items
      </h2>

      <Select
        onChange={handleSelectChange}
        options={products as unknown as Array<{ value: string; label: string }>}
        isMulti
        components={animatedComponents}
        placeholder="Select products..."
        getOptionValue={(option) => String((option as unknown as IProduct).id)}
        getOptionLabel={(option) => {
          const prod = option as unknown as IProduct;
          const stock = Number(prod.stock);
          const price = `$${Number(prod.sellingPrice).toLocaleString()}`;
          const stockLabel = stock === 0 ? '⚠️ No stock' : '';
          return `${prod.name} (${price})${stockLabel ? ` — ${stockLabel}` : ''}`;
        }}
        value={selectedProducts as unknown as Array<{ value: string; label: string }>}
        unstyled
        classNames={{
          control: ({ isFocused }) =>
            `border !rounded-lg !bg-white dark:!bg-stone-950 !min-h-11 px-3 py-1 transition-all ${
              isFocused
                ? 'border-stone-900 dark:border-stone-100 ring-2 ring-stone-950/5 dark:ring-stone-100/5'
                : 'border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700'
            }`,
          placeholder: () => 'text-stone-400 dark:text-stone-500 text-sm',
          noOptionsMessage: () => 'text-stone-400 dark:text-stone-500 text-sm py-2',
          multiValue: () =>
            'bg-stone-100 dark:bg-stone-800 rounded-md m-0.5 border border-stone-200/50 dark:border-stone-700/50',
          multiValueLabel: () => 'text-stone-800 dark:text-stone-200 text-xs font-semibold px-2 py-1',
          multiValueRemove: () =>
            'text-stone-400 hover:text-red-600 hover:bg-stone-200/50 dark:hover:bg-stone-700/50 rounded-r-md transition-colors px-1 cursor-pointer',
          menu: () =>
            'bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg shadow-lg mt-1 overflow-hidden z-50',
          menuList: () => 'p-1 space-y-0.5 max-h-60 overflow-y-auto',
          option: ({ isFocused, isSelected, data }) => {
            const prod = data as unknown as IProduct;
            const isOutOfStock = Number(prod.stock) === 0;
            return `rounded-md px-3 py-2 text-sm transition-colors cursor-pointer ${
              isOutOfStock
                ? 'bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400'
                : isSelected
                  ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-950 font-semibold'
                  : isFocused
                    ? 'bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-100'
                    : 'text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-900'
            }`;
          },
        }}
        styles={{
          input: (base) => ({ ...base, 'input:focus': { boxShadow: 'none' } }),
        }}
      />
    </div>
  );
};
