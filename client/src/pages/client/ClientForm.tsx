import React, { useState } from 'react';
import { IClient } from '@shared-domain/client/client.entity';
import { clientFormSchema } from '../../modules/client/client.schema';

interface ClientFormProps {
  client?: IClient;
  onSubmit: (data: {
    firstName: string;
    lastName: string;
    address: string;
    whatsapp: string;
    nationalId: string;
  }) => void;
  submitButtonText?: string;
}

export const ClientForm: React.FC<ClientFormProps> = ({
  client,
  onSubmit,
  submitButtonText = 'Save Changes',
}) => {
  const [firstName, setFirstName] = useState(client ? String(client.firstName) : '');
  const [lastName, setLastName] = useState(client ? String(client.lastName) : '');
  const [address, setAddress] = useState(client ? String(client.address) : '');
  const [whatsapp, setWhatsapp] = useState(client ? String(client.whatsapp) : '');
  const [nationalId, setNationalId] = useState(client ? String(client.nationalId) : '');

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const validationResult = clientFormSchema.safeParse({
      firstName,
      lastName,
      address,
      whatsapp,
      nationalId,
    });

    if (!validationResult.success) {
      const fieldErrors: Record<string, string> = {};
      validationResult.error.issues.forEach((issue) => {
        if (issue.path[0]) {
          fieldErrors[issue.path[0] as string] = issue.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    onSubmit({
      firstName,
      lastName,
      address,
      whatsapp,
      nationalId,
    });
  };

  return (
    <form 
      className="w-full max-w-2xl mx-auto bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800/80 rounded-xl shadow-md p-6" 
      onSubmit={handleSubmit}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-stone-700 dark:text-stone-300">
            First Name
          </label>
          <input
            name="firstName"
            type="text"
            className={`h-11 px-4 rounded-lg bg-stone-50 dark:bg-stone-950 border text-stone-950 dark:text-stone-50 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-stone-950 dark:focus:ring-stone-100 ${
              errors.firstName 
                ? 'border-red-500 dark:border-red-500/80 focus:ring-red-500' 
                : 'border-stone-300 dark:border-stone-800 hover:border-stone-400 dark:hover:border-stone-700'
            }`}
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
          {errors.firstName && (
            <span className="text-xs text-red-500 dark:text-red-400 font-medium">
              {errors.firstName}
            </span>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-stone-700 dark:text-stone-300">
            Last Name
          </label>
          <input
            name="lastName"
            type="text"
            className={`h-11 px-4 rounded-lg bg-stone-50 dark:bg-stone-950 border text-stone-950 dark:text-stone-50 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-stone-950 dark:focus:ring-stone-100 ${
              errors.lastName 
                ? 'border-red-500 dark:border-red-500/80 focus:ring-red-500' 
                : 'border-stone-300 dark:border-stone-800 hover:border-stone-400 dark:hover:border-stone-700'
            }`}
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
          {errors.lastName && (
            <span className="text-xs text-red-500 dark:text-red-400 font-medium">
              {errors.lastName}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1.5 mb-5">
        <label className="text-sm font-semibold text-stone-700 dark:text-stone-300">
          Address
        </label>
        <input
          name="address"
          type="text"
          className={`h-11 px-4 rounded-lg bg-stone-50 dark:bg-stone-950 border text-stone-950 dark:text-stone-50 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-stone-950 dark:focus:ring-stone-100 ${
            errors.address 
              ? 'border-red-500 dark:border-red-500/80 focus:ring-red-500' 
              : 'border-stone-300 dark:border-stone-800 hover:border-stone-400 dark:hover:border-stone-700'
          }`}
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />
        {errors.address && (
          <span className="text-xs text-red-500 dark:text-red-400 font-medium">
            {errors.address}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-stone-700 dark:text-stone-300">
            National ID
          </label>
          <input
            name="nationalId"
            type="text"
            placeholder="V-12345678"
            className={`h-11 px-4 rounded-lg bg-stone-50 dark:bg-stone-950 border text-stone-950 dark:text-stone-50 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-stone-950 dark:focus:ring-stone-100 ${
              errors.nationalId 
                ? 'border-red-500 dark:border-red-500/80 focus:ring-red-500' 
                : 'border-stone-300 dark:border-stone-800 hover:border-stone-400 dark:hover:border-stone-700'
            }`}
            value={nationalId}
            onChange={(e) => setNationalId(e.target.value)}
          />
          {errors.nationalId && (
            <span className="text-xs text-red-500 dark:text-red-400 font-medium">
              {errors.nationalId}
            </span>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-stone-700 dark:text-stone-300">
            WhatsApp
          </label>
          <input
            name="whatsapp"
            type="text"
            placeholder="+123456789"
            className={`h-11 px-4 rounded-lg bg-stone-50 dark:bg-stone-950 border text-stone-950 dark:text-stone-50 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-stone-950 dark:focus:ring-stone-100 ${
              errors.whatsapp 
                ? 'border-red-500 dark:border-red-500/80 focus:ring-red-500' 
                : 'border-stone-300 dark:border-stone-800 hover:border-stone-400 dark:hover:border-stone-700'
            }`}
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
          />
          {errors.whatsapp && (
            <span className="text-xs text-red-500 dark:text-red-400 font-medium">
              {errors.whatsapp}
            </span>
          )}
        </div>
      </div>

      <div className="flex justify-end pt-5 border-t border-stone-100 dark:border-stone-800/80">
        <button 
          type="submit" 
          className="inline-flex items-center justify-center h-11 px-6 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-stone-950"
        >
          {submitButtonText}
        </button>
      </div>
    </form>
  );
};

export default ClientForm;
