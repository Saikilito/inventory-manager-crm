import React, { useState } from 'react';
import { z } from 'zod';
import { IClient } from '@shared-domain/client/client.entity';
import { X, Plus, ChevronDown } from 'lucide-react';

// Define strict validation schema using Zod
const clientFormSchema = z.object({
  firstName: z.string().min(1, 'El nombre es obligatorio'),
  lastName: z.string().min(1, 'El apellido es obligatorio'),
  company: z.string().min(1, 'La empresa es obligatoria'),
  age: z.number().min(1, 'La edad debe ser mayor a 0'),
  type: z.enum(['BASIC', 'PREMIUM']),
});

interface ClientFormProps {
  client?: IClient;
  onSubmit: (data: {
    firstName: string;
    lastName: string;
    company: string;
    emails: string[];
    age: number;
    type: string;
  }) => void;
  submitButtonText?: string;
}

export const ClientForm: React.FC<ClientFormProps> = ({
  client,
  onSubmit,
  submitButtonText = 'Guardar Cambios',
}) => {
  // Local state for basic fields
  const [firstName, setFirstName] = useState(client ? String(client.firstName) : '');
  const [lastName, setLastName] = useState(client ? String(client.lastName) : '');
  const [company, setCompany] = useState(client ? String(client.company) : '');
  const [age, setAge] = useState(client && client.age ? Number(client.age) : '');
  const [type, setType] = useState(client ? String(client.type) : '');

  // Local state for dynamic list of emails
  const initialEmails = client && client.emails 
    ? client.emails.map((e) => String(e)) 
    : [''];
  const [emails, setEmails] = useState<string[]>(initialEmails);

  // Validation error state
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleAddEmail = () => {
    setEmails([...emails, '']);
  };

  const handleRemoveEmail = (index: number) => {
    setEmails(emails.filter((_, idx) => idx !== index));
  };

  const handleEmailChange = (index: number, value: string) => {
    const updated = [...emails];
    updated[index] = value;
    setEmails(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate using Zod
    const validationResult = clientFormSchema.safeParse({
      firstName,
      lastName,
      company,
      age: Number(age),
      type,
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

    // Validate email strings
    const emailErrors: Record<string, string> = {};
    const validEmails = emails.filter((email, index) => {
      const isEmailValid = z.string().email().safeParse(email).success;
      if (!isEmailValid && email !== '') {
        emailErrors[`email:${index}`] = 'Email no válido';
      }
      return email !== '';
    });

    if (Object.keys(emailErrors).length > 0) {
      setErrors(emailErrors);
      return;
    }

    if (validEmails.length === 0) {
      setErrors({ emails: 'Debe agregar al menos un email' });
      return;
    }

    // Call submit
    onSubmit({
      firstName,
      lastName,
      company,
      emails: validEmails,
      age: Number(age),
      type,
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
            Nombre
          </label>
          <input
            name="nombre"
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
            Apellido
          </label>
          <input
            name="apellido"
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

      <div className="flex flex-col gap-1.5 mb-6">
        <label className="text-sm font-semibold text-stone-700 dark:text-stone-300">
          Empresa
        </label>
        <input
          name="empresa"
          type="text"
          className={`h-11 px-4 rounded-lg bg-stone-50 dark:bg-stone-950 border text-stone-950 dark:text-stone-50 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-stone-950 dark:focus:ring-stone-100 ${
            errors.company 
              ? 'border-red-500 dark:border-red-500/80 focus:ring-red-500' 
              : 'border-stone-300 dark:border-stone-800 hover:border-stone-400 dark:hover:border-stone-700'
          }`}
          value={company}
          onChange={(e) => setCompany(e.target.value)}
        />
        {errors.company && (
          <span className="text-xs text-red-500 dark:text-red-400 font-medium">
            {errors.company}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-3.5 mb-6 border-t border-stone-100 dark:border-stone-800/80 pt-5">
        <span className="text-sm font-bold text-stone-800 dark:text-stone-200">
          Direcciones de Correo Electrónico
        </span>

        <div className="flex flex-col gap-3">
          {emails.map((emailVal, index) => (
            <div key={index} className="flex flex-col gap-1.5">
              <div className="flex gap-2 items-center">
                <input
                  type="email"
                  placeholder="ejemplo@empresa.com"
                  className={`flex-1 h-11 px-4 rounded-lg bg-stone-50 dark:bg-stone-950 border text-stone-950 dark:text-stone-50 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-stone-950 dark:focus:ring-stone-100 ${
                    errors[`email:${index}`] 
                      ? 'border-red-500 dark:border-red-500/80 focus:ring-red-500' 
                      : 'border-stone-300 dark:border-stone-800 hover:border-stone-400 dark:hover:border-stone-700'
                  }`}
                  value={emailVal}
                  onChange={(e) => handleEmailChange(index, e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => handleRemoveEmail(index)}
                  disabled={emails.length === 1}
                  className="h-11 px-4 border border-red-200 hover:bg-red-50 dark:border-red-900/30 dark:hover:bg-red-950/20 text-red-600 dark:text-red-400 rounded-lg flex items-center justify-center gap-1.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                >
                  <X className="w-4 h-4 shrink-0" />
                  <span className="hidden sm:inline">Eliminar</span>
                </button>
              </div>
              {errors[`email:${index}`] && (
                <span className="text-xs text-red-500 dark:text-red-400 font-medium">
                  {errors[`email:${index}`]}
                </span>
              )}
            </div>
          ))}
        </div>

        {errors.emails && (
          <span className="text-xs text-red-500 dark:text-red-400 font-medium text-center">
            {errors.emails}
          </span>
        )}

        <button 
          onClick={handleAddEmail} 
          type="button" 
          className="w-full h-11 border border-dashed border-stone-300 hover:border-stone-400 dark:border-stone-800 dark:hover:border-stone-700 rounded-lg text-sm text-stone-600 dark:text-stone-400 font-semibold flex items-center justify-center gap-1.5 transition-all focus:outline-none focus:ring-2 focus:ring-stone-500"
        >
          <Plus className="w-4 h-4 shrink-0" />
          Agregar Email
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 border-t border-stone-100 dark:border-stone-800/80 pt-5">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-stone-700 dark:text-stone-300">
            Edad
          </label>
          <input
            name="edad"
            type="number"
            className={`h-11 px-4 rounded-lg bg-stone-50 dark:bg-stone-950 border text-stone-950 dark:text-stone-50 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-stone-950 dark:focus:ring-stone-100 ${
              errors.age 
                ? 'border-red-500 dark:border-red-500/80 focus:ring-red-500' 
                : 'border-stone-300 dark:border-stone-800 hover:border-stone-400 dark:hover:border-stone-700'
            }`}
            value={age}
            onChange={(e) => setAge(e.target.value === '' ? '' : Number(e.target.value))}
          />
          {errors.age && (
            <span className="text-xs text-red-500 dark:text-red-400 font-medium">
              {errors.age}
            </span>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-stone-700 dark:text-stone-300">
            Tipo Cliente
          </label>
          <div className="relative">
            <select
              name="tipo"
              className={`w-full h-11 pl-4 pr-10 rounded-lg bg-stone-50 dark:bg-stone-950 border text-stone-950 dark:text-stone-50 text-sm appearance-none transition-all focus:outline-none focus:ring-2 focus:ring-stone-950 dark:focus:ring-stone-100 ${
                errors.type 
                  ? 'border-red-500 dark:border-red-500/80 focus:ring-red-500' 
                  : 'border-stone-300 dark:border-stone-800 hover:border-stone-400 dark:hover:border-stone-700'
              }`}
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option value="">Elegir...</option>
              <option value="PREMIUM">PREMIUM</option>
              <option value="BASIC">BÁSICO</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-stone-500 dark:text-stone-400">
              <ChevronDown className="w-4 h-4 shrink-0" />
            </div>
          </div>
          {errors.type && (
            <span className="text-xs text-red-500 dark:text-red-400 font-medium">
              {errors.type}
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