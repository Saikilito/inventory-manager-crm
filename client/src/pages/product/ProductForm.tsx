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
}

export const ProductForm: React.FC<ProductFormProps> = ({
  product,
  onSubmit,
  submitButtonText = 'Guardar Cambios',
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
    <form className="col-md-8" onSubmit={handleSubmit}>
      <div className="form-group">
        <label>Nombre:</label>
        <input
          type="text"
          className={`form-control ${errors.name ? 'is-invalid' : ''}`}
          placeholder="Nombre del Producto"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        {errors.name && <div className="invalid-feedback">{errors.name}</div>}
      </div>

      <div className="form-group">
        <label>Precio:</label>
        <div className="input-group">
          <div className="input-group-prepend">
            <div className="input-group-text">$</div>
          </div>
          <input
            type="number"
            className={`form-control ${errors.price ? 'is-invalid' : ''}`}
            placeholder="Precio del Producto"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
          {errors.price && <div className="invalid-feedback d-block">{errors.price}</div>}
        </div>
      </div>

      <div className="form-group">
        <label>Stock:</label>
        <input
          type="number"
          className={`form-control ${errors.stock ? 'is-invalid' : ''}`}
          placeholder="Existencia del Producto"
          value={stock}
          onChange={(e) => setStock(e.target.value)}
        />
        {errors.stock && <div className="invalid-feedback">{errors.stock}</div>}
      </div>

      <button
        disabled={isButtonDisabled}
        type="submit"
        className="btn btn-success float-right"
      >
        {submitButtonText}
      </button>
    </form>
  );
};
export default ProductForm;
