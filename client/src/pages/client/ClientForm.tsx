import React, { useState } from 'react';
import { z } from 'zod';
import { IClient } from '@shared-domain/client/client.entity';

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
    <form className="col-md-8 m-3" onSubmit={handleSubmit}>
      <div className="form-row">
        <div className="form-group col-md-6">
          <label>Nombre</label>
          <input
            name="nombre"
            type="text"
            className={`form-control ${errors.firstName ? 'is-invalid' : ''}`}
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
          {errors.firstName && <div className="invalid-feedback">{errors.firstName}</div>}
        </div>
        <div className="form-group col-md-6">
          <label>Apellido</label>
          <input
            name="apellido"
            type="text"
            className={`form-control ${errors.lastName ? 'is-invalid' : ''}`}
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
          {errors.lastName && <div className="invalid-feedback">{errors.lastName}</div>}
        </div>
      </div>

      <div className="form-row">
        <div className="form-group col-md-12">
          <label>Empresa</label>
          <input
            name="empresa"
            type="text"
            className={`form-control ${errors.company ? 'is-invalid' : ''}`}
            value={company}
            onChange={(e) => setCompany(e.target.value)}
          />
          {errors.company && <div className="invalid-feedback">{errors.company}</div>}
        </div>

        {emails.map((emailVal, index) => (
          <div key={index} className="form-group col-md-12">
            <label>Email {index + 1} : </label>
            <div className="input-group">
              <input
                type="email"
                placeholder="Email"
                className={`form-control ${errors[`email:${index}`] ? 'is-invalid' : ''}`}
                value={emailVal}
                onChange={(e) => handleEmailChange(index, e.target.value)}
              />
              <div className="input-group-append">
                <button
                  className="btn btn-danger"
                  type="button"
                  onClick={() => handleRemoveEmail(index)}
                  disabled={emails.length === 1}
                >
                  &times; Eliminar
                </button>
              </div>
            </div>
            {errors[`email:${index}`] && (
              <small className="text-danger mt-1 d-block">{errors[`email:${index}`]}</small>
            )}
          </div>
        ))}

        {errors.emails && (
          <div className="form-group col-md-12 text-center">
            <div className="text-danger small">{errors.emails}</div>
          </div>
        )}

        <div className="form-group d-flex justify-content-center col-md-12">
          <button onClick={handleAddEmail} type="button" className="btn btn-warning">
            + Agregar Email
          </button>
        </div>
      </div>

      <div className="form-row">
        <div className="form-group col-md-6">
          <label>Edad</label>
          <input
            name="edad"
            type="number"
            className={`form-control ${errors.age ? 'is-invalid' : ''}`}
            value={age}
            onChange={(e) => setAge(e.target.value)}
          />
          {errors.age && <div className="invalid-feedback">{errors.age}</div>}
        </div>
        <div className="form-group col-md-6">
          <label>Tipo Cliente</label>
          <select
            name="tipo"
            className={`form-control ${errors.type ? 'is-invalid' : ''}`}
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="">Elegir...</option>
            <option value="PREMIUM">PREMIUM</option>
            <option value="BASIC">BÁSICO</option>
          </select>
          {errors.type && <div className="invalid-feedback">{errors.type}</div>}
        </div>
      </div>

      <button type="submit" className="btn btn-success float-right">
        {submitButtonText}
      </button>
    </form>
  );
};
export default ClientForm;
