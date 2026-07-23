import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, XCircle } from 'lucide-react';
import { TRANSITION_DURATION_MS } from '../../../utils/constants';
import {
  validateCancellationObservation,
  getCharacterCount,
} from '@modules/order/application/validators/cancellation-observation.validator';

interface CancelOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (observation: string) => void;
  orderShortId: string;
  isUpdating: boolean;
}

export const CancelOrderModal: React.FC<CancelOrderModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  orderShortId,
  isUpdating,
}) => {
  const [mounted, setMounted] = useState(false);
  const [animateShow, setAnimateShow] = useState(false);
  const [observation, setObservation] = useState('');
  const [error, setError] = useState<string | undefined>(undefined);

  const MIN_CHARS = 10;

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      setObservation('');
      setError(undefined);
      const timer = setTimeout(() => setAnimateShow(true), 10);
      return () => clearTimeout(timer);
    } else {
      setAnimateShow(false);
      const timer = setTimeout(() => setMounted(false), TRANSITION_DURATION_MS);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleObservationChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setObservation(value);
    
    // Clear error when user starts typing
    if (error && value.trim().length > 0) {
      setError(undefined);
    }
  };

  const handleConfirm = () => {
    const validation = validateCancellationObservation(observation);
    
    if (!validation.isValid) {
      setError(validation.error);
      return;
    }

    if (validation.trimmedValue) {
      onConfirm(validation.trimmedValue);
      onClose();
    }
  };

  const characterCount = getCharacterCount(observation);
  const isValid = characterCount >= MIN_CHARS;
  const isDisabled = isUpdating || !isValid;

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-stone-900/50 backdrop-blur-sm transition-opacity duration-300 ease-out cursor-pointer ${
          animateShow ? 'opacity-100' : 'opacity-0'
        }`}
      ></div>

      {/* Modal Card */}
      <div
        className={`relative w-full max-w-md bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-xl overflow-hidden transform transition-all duration-300 ease-out ${
          animateShow ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4'
        }`}
      >
        {/* Top Header & Alert Banner */}
        <div className="px-6 py-5 flex items-center gap-3 border-b border-stone-100 dark:border-stone-800 bg-red-500/5 dark:bg-red-500/5">
          <div className="p-2 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400">
            <XCircle className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h3 className="font-extrabold text-stone-900 dark:text-stone-50 tracking-tight">
              Cancelar Orden
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">
              Se requiere documentar el motivo de cancelación
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">
          <p className="text-sm font-medium text-stone-600 dark:text-stone-300 leading-relaxed">
            ¿Estás seguro de cancelar la orden{' '}
            <span className="font-mono font-extrabold text-stone-950 dark:text-stone-50">#{orderShortId}</span>?
            Esta operación restaurará el stock de los productos.
          </p>

          {/* Warning about stock restoration */}
          <div className="flex items-start gap-2.5 p-3.5 bg-amber-500/5 border border-amber-500/10 rounded-xl text-amber-600 dark:text-amber-400">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <p className="text-xs font-semibold leading-normal">
              Advertencia: Se restaurará el stock de los productos al inventario.
            </p>
          </div>

          {/* Observation Textarea */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
              Motivo de cancelación
            </label>
            <textarea
              value={observation}
              onChange={handleObservationChange}
              placeholder="Escribe el motivo de la cancelación (mínimo 10 caracteres)..."
              rows={3}
              disabled={isUpdating}
              className={`w-full px-3 py-2.5 rounded-xl text-sm border bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-stone-900 transition-all resize-none ${
                error
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-stone-200 dark:border-stone-700 focus:ring-stone-500'
              } ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
            />
            
            {/* Character counter */}
            <div className="flex items-center justify-between text-xs">
              <span className={error ? 'text-red-500 font-medium' : 'text-stone-400'}>
                {error || 'Mínimo 10 caracteres'}
              </span>
              <span className={`font-mono ${isValid ? 'text-emerald-600' : 'text-stone-400'}`}>
                {characterCount}/{MIN_CHARS}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="px-6 py-4 bg-stone-50 dark:bg-stone-950/40 border-t border-stone-100 dark:border-stone-800 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isUpdating}
            className="h-10 px-4 rounded-lg text-xs font-bold text-stone-700 dark:text-stone-300 bg-white dark:bg-stone-900 hover:bg-stone-50 dark:hover:bg-stone-950 border border-stone-200 dark:border-stone-800 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Mantener Orden
          </button>
          <button
            onClick={handleConfirm}
            disabled={isDisabled}
            className={`h-10 px-4 rounded-lg text-xs font-bold text-white transition-all cursor-pointer ${
              isDisabled
                ? 'bg-stone-400 cursor-not-allowed'
                : 'bg-red-600 hover:bg-red-700 hover:shadow-red-500/10 active:bg-red-800'
            }`}
          >
            {isUpdating ? (
              <span className="flex items-center gap-2">
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Cancelando...
              </span>
            ) : (
              'Confirmar Cancelación'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
