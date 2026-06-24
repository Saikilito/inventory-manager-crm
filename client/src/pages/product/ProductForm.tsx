import React, { useState } from 'react';
import { z } from 'zod';
import { IProduct } from '@shared-domain/product/product.entity';

// Define strict validation schema using Zod
const productFormSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio'),
  price: z.number().min(1, 'El precio debe ser mayor a 0'),
  stock: z.number().min(0, 'La existencia no puede ser negativa'),
});

interface ProductFormProps {
  product?: IProduct;
  onSubmit: (data: {
    name: string;
    price: number;
    stock: number;
  }) => void;
  submitButtonText?: string;
  isLoading?: boolean;
}

export const ProductForm: React.FC<ProductFormProps> = ({
  product,
  onSubmit,
  submitButtonText = 'Guardar Cambios',
  isLoading = false,
}) => {
  const [name, setName] = useState(product ? String(product.name) : '');
  const [price, setPrice] = useState(product ? Number(product.price) : '');
  const [stock, setStock] = useState(product ? Number(product.stock) : '');

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const validationResult = productFormSchema.safeParse({
      name,
      price: Number(price),
      stock: Number(stock),
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
      name,
      price: Number(price),
      stock: Number(stock),
    });
  };

  const isButtonDisabled = !name || price === '' || stock === '';

  return (
    <div className="w-full max-w-2xl mx-auto bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800/80 rounded-xl shadow-md p-6">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-stone-700 dark:text-stone-300">
            Nombre del Producto:
          </label>
          <input
            type="text"
            className={`w-full h-11 px-3 border border-stone-200 dark:border-stone-800 rounded-lg bg-white dark:bg-stone-950 text-stone-950 dark:text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-950 dark:focus:ring-stone-100 transition-all ${
              errors.name ? 'border-red-500 focus:ring-red-500 dark:border-red-500 dark:focus:ring-red-500' : ''
            }`}
            placeholder="Nombre del Producto"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          {errors.name && (
            <div className="text-xs font-medium text-red-600 dark:text-red-400 mt-1">
              {errors.name}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-stone-700 dark:text-stone-300">
            Precio:
          </label>
          <div className="relative rounded-lg shadow-sm">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <span className="text-stone-500 dark:text-stone-400 sm:text-sm">$</span>
            </div>
            <input
              type="number"
              className={`w-full h-11 pl-8 pr-3 border border-stone-200 dark:border-stone-800 rounded-lg bg-white dark:bg-stone-950 text-stone-950 dark:text-white placeholder-stone-450 focus:outline-none focus:ring-2 focus:ring-stone-950 dark:focus:ring-stone-100 transition-all ${
                errors.price ? 'border-red-500 focus:ring-red-500 dark:border-red-500 dark:focus:ring-red-500' : ''
              }`}
              placeholder="0.00"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>
          {errors.price && (
            <div className="text-xs font-medium text-red-600 dark:text-red-400 mt-1">
              {errors.price}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-stone-700 dark:text-stone-300">
            Existencia / Stock:
          </label>
          <input
            type="number"
            className={`w-full h-11 px-3 border border-stone-200 dark:border-stone-800 rounded-lg bg-white dark:bg-stone-950 text-stone-950 dark:text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-950 dark:focus:ring-stone-100 transition-all ${
              errors.stock ? 'border-red-500 focus:ring-red-500 dark:border-red-500 dark:focus:ring-red-500' : ''
            }`}
            placeholder="Existencia del Producto"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
          />
          {errors.stock && (
            <div className="text-xs font-medium text-red-600 dark:text-red-400 mt-1">
              {errors.stock}
            </div>
          )}
        </div>

        <div className="flex justify-end pt-2 border-t border-stone-100 dark:border-stone-800/60 mt-6">
          <button
            disabled={isButtonDisabled || isLoading}
            type="submit"
            className="w-full sm:w-auto inline-flex items-center justify-center h-11 px-6 rounded-xl text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 hover:scale-[1.02] transition-all duration-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-stone-950 disabled:opacity-50 disabled:pointer-events-none"
          >
            {isLoading ? (
              <span className="inline-flex items-center gap-2">
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.001 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Procesando...
              </span>
            ) : (
              submitButtonText
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProductForm;
