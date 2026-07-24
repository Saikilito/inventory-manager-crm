import Select from 'react-select';
import { UserPlus } from 'lucide-react';
import { IClient } from '@shared-domain/client/client.entity';
import { getFullName } from '@utils/formatters';

interface ClientSelectorProps {
  clients: IClient[];
  selectedClient: IClient | null;
  onSelect: (client: IClient | null) => void;
  onOpenNewClientModal: () => void;
}

export const ClientSelector = ({
  clients,
  selectedClient,
  onSelect,
  onOpenNewClientModal,
}: ClientSelectorProps) => {
  const clientOptions = clients.map((c) => ({
    value: String(c.id),
    label: `${getFullName(c)} ${c.nationalId ? `(${c.nationalId})` : ''}`,
  }));

  const handleClientSelect = (selectedOption: { value: string; label: string } | null) => {
    if (!selectedOption) {
      onSelect(null);
      return;
    }
    const found = clients.find((c) => String(c.id) === selectedOption.value);
    onSelect(found || null);
  };

  const selectedValue = selectedClient
    ? clientOptions.find((o) => o.value === String(selectedClient.id))
    : null;

  return (
    <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-5 shadow-sm space-y-4">
      <h2 className="text-sm font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
        Select Client
      </h2>

      <Select
        options={clientOptions}
        onChange={handleClientSelect}
        value={selectedValue}
        placeholder="Search clients..."
        unstyled
        classNames={{
          control: ({ isFocused }) =>
            `border !rounded-lg !bg-white dark:!bg-stone-950 !min-h-11 px-3 py-1 transition-all ${
              isFocused
                ? '!border-emerald-500 !ring-2 !ring-emerald-500/20'
                : '!border-stone-200 dark:!border-stone-800'
            }`,
          placeholder: () => 'text-stone-400 dark:text-stone-500 text-sm',
          singleValue: () => 'text-stone-900 dark:text-stone-100',
          menu: () =>
            'bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg shadow-lg mt-1 overflow-hidden z-50',
          menuList: () => 'p-1 space-y-0.5 max-h-60 overflow-y-auto',
          option: ({ isFocused, isSelected }) =>
            `rounded-md px-3 py-2 text-sm transition-colors cursor-pointer ${
              isSelected
                ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-semibold'
                : isFocused
                  ? 'bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-100'
                  : 'text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-900'
            }`,
        }}
      />

      <button
        onClick={onOpenNewClientModal}
        className="w-full h-10 rounded-lg text-sm font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors flex items-center justify-center gap-2"
      >
        <UserPlus className="w-4 h-4" />
        Create New Client
      </button>
    </div>
  );
};
