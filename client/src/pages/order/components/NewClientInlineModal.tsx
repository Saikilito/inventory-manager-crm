import React, { useState } from 'react';
import { X, UserPlus } from 'lucide-react';
import { z } from 'zod';
import { Result } from '@shared-domain/shared/result';

const clientFormSchema = z.object({
  firstName: z.string().min(2, 'Must be at least 2 characters').regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s'-]+$/, 'Must contain only letters'),
  lastName: z.string().min(2, 'Must be at least 2 characters').regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s'-]+$/, 'Must contain only letters'),
  address: z.string().min(5, 'Address must be at least 5 characters long'),
  whatsapp: z.string().regex(/^\+?[0-9\s-]{10,15}$/, 'Valid phone required (e.g. +1234567890)'),
  nationalId: z.string().min(5, 'ID must be at least 5 chars').regex(/^[a-zA-Z0-9-]+$/, 'Invalid characters (use V-12345678)'),
});

interface NewClientInlineModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  sellerId: string;
  onCreateClient: (data: { firstName: string; lastName: string; address: string; whatsapp: string; nationalId: string; sellerId: string }) => Promise<Result<boolean, Error>>;
}

export const NewClientInlineModal: React.FC<NewClientInlineModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  sellerId,
  onCreateClient,
}) => {
  const [step, setStep] = useState<'form' | 'confirm'>('form');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [address, setAddress] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
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

    setStep('confirm');
  };

  const handleConfirm = async () => {
    setIsSubmitting(true);
    setErrors({});

    try {
      const result = await onCreateClient({
        firstName,
        lastName,
        address,
        whatsapp,
        nationalId,
        sellerId,
      });

      setIsSubmitting(false);

      if (result.isFailure) {
        setErrors({ submit: result.getError().message || 'Error creating client' });
        setStep('form');
        return;
      }

      onSuccess();
      onClose();
      
      // Reset state for next use
      setTimeout(() => {
        setStep('form');
        setFirstName('');
        setLastName('');
        setAddress('');
        setWhatsapp('');
        setNationalId('');
      }, 300);
    } catch (err: unknown) {
      setIsSubmitting(false);
      setErrors({ submit: err instanceof Error ? err.message : 'Error creating client' });
      setStep('form');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-5 border-b border-stone-100 dark:border-stone-800">
          <div>
            <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-emerald-600" />
              {step === 'form' ? 'New Client' : 'Confirm Details'}
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
              {step === 'form' ? 'Create a new client for this order.' : 'Please verify the client information before creating.'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition-colors p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer h-11 w-11 flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {step === 'form' ? (
          <form onSubmit={handleSubmit} className="px-6 py-6 space-y-4">
            {errors.submit && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <p className="text-sm text-red-600 dark:text-red-400">{errors.submit}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-stone-700 dark:text-stone-300">
                  First Name
                </label>
                <input
                  type="text"
                  className="h-10 px-3 rounded-lg bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
                {errors.firstName && (
                  <span className="text-xs text-red-500">{errors.firstName}</span>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-stone-700 dark:text-stone-300">
                  Last Name
                </label>
                <input
                  type="text"
                  className="h-10 px-3 rounded-lg bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
                {errors.lastName && (
                  <span className="text-xs text-red-500">{errors.lastName}</span>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-stone-700 dark:text-stone-300">
                Address
              </label>
              <input
                type="text"
                className="h-10 px-3 rounded-lg bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
              {errors.address && (
                <span className="text-xs text-red-500">{errors.address}</span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-stone-700 dark:text-stone-300">
                  National ID
                </label>
                <input
                  type="text"
                  placeholder="V-12345678"
                  className="h-10 px-3 rounded-lg bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  value={nationalId}
                  onChange={(e) => setNationalId(e.target.value)}
                />
                {errors.nationalId && (
                  <span className="text-xs text-red-500">{errors.nationalId}</span>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-stone-700 dark:text-stone-300">
                  WhatsApp
                </label>
                <input
                  type="text"
                  placeholder="+123456789"
                  className="h-10 px-3 rounded-lg bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                />
                {errors.whatsapp && (
                  <span className="text-xs text-red-500">{errors.whatsapp}</span>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-stone-100 dark:border-stone-800">
              <button
                type="button"
                onClick={onClose}
                className="h-10 px-4 rounded-lg text-sm font-semibold text-stone-600 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="h-10 px-4 rounded-lg text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors flex items-center gap-2 cursor-pointer"
              >
                Next
              </button>
            </div>
          </form>
        ) : (
          <div className="px-6 py-6 space-y-5">
            <div className="bg-stone-50 dark:bg-stone-900/50 p-5 rounded-xl border border-stone-200 dark:border-stone-800 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[11px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider">Client Name</span>
                  <p className="text-sm font-medium text-stone-900 dark:text-stone-100 mt-0.5">{firstName} {lastName}</p>
                </div>
                <div>
                  <span className="text-[11px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider">National ID</span>
                  <p className="text-sm font-medium text-stone-900 dark:text-stone-100 mt-0.5">{nationalId}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[11px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider">WhatsApp</span>
                  <p className="text-sm font-medium text-stone-900 dark:text-stone-100 mt-0.5">{whatsapp}</p>
                </div>
                <div>
                  <span className="text-[11px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider">Address</span>
                  <p className="text-sm font-medium text-stone-900 dark:text-stone-100 mt-0.5">{address}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-stone-100 dark:border-stone-800">
              <button
                type="button"
                onClick={() => setStep('form')}
                disabled={isSubmitting}
                className="h-10 px-4 rounded-lg text-sm font-semibold text-stone-600 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors disabled:opacity-50 cursor-pointer"
              >
                Back to Edit
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={isSubmitting}
                className="h-10 px-4 rounded-lg text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? 'Creating...' : 'Confirm & Create'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NewClientInlineModal;
