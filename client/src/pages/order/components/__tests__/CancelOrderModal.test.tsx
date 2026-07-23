import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CancelOrderModal } from '../CancelOrderModal';

describe('CancelOrderModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onConfirm: vi.fn(),
    orderShortId: 'ABC123',
    isUpdating: false,
  };

  it('should not render when isOpen is false', () => {
    const { container } = render(<CancelOrderModal {...defaultProps} isOpen={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('should render with correct title and order ID', () => {
    render(<CancelOrderModal {...defaultProps} />);
    expect(screen.getByText('Cancelar Orden')).toBeInTheDocument();
    expect(screen.getByText('#ABC123')).toBeInTheDocument();
  });

  it('should show stock restoration warning', () => {
    render(<CancelOrderModal {...defaultProps} />);
    expect(screen.getByText(/Se restaurará el stock/)).toBeInTheDocument();
  });

  it('should have textarea for observation input', () => {
    render(<CancelOrderModal {...defaultProps} />);
    const textarea = screen.getByPlaceholderText(/motivo de la cancelación/);
    expect(textarea).toBeInTheDocument();
  });

  it('should show character counter', () => {
    render(<CancelOrderModal {...defaultProps} />);
    // Initial state: 0/10
    expect(screen.getByText('0/10')).toBeInTheDocument();
  });

  it('should disable confirm button when observation is too short', () => {
    render(<CancelOrderModal {...defaultProps} />);
    const confirmButton = screen.getByText('Confirmar Cancelación');
    expect(confirmButton).toBeDisabled();
  });

  it('should enable confirm button when observation has 10+ characters', async () => {
    render(<CancelOrderModal {...defaultProps} />);
    
    const textarea = screen.getByPlaceholderText(/motivo de la cancelación/);
    fireEvent.change(textarea, { target: { value: '1234567890' } });
    
    const confirmButton = screen.getByText('Confirmar Cancelación');
    await waitFor(() => {
      expect(confirmButton).not.toBeDisabled();
    });
  });

  it('should call onClose when "Mantener Orden" is clicked', () => {
    const onClose = vi.fn();
    render(<CancelOrderModal {...defaultProps} onClose={onClose} />);
    
    const cancelButton = screen.getByText('Mantener Orden');
    fireEvent.click(cancelButton);
    
    expect(onClose).toHaveBeenCalled();
  });

  it('should call onConfirm with trimmed observation when confirmed', async () => {
    const onConfirm = vi.fn();
    const onClose = vi.fn();
    render(<CancelOrderModal {...defaultProps} onConfirm={onConfirm} onClose={onClose} />);
    
    const textarea = screen.getByPlaceholderText(/motivo de la cancelación/);
    fireEvent.change(textarea, { target: { value: '   valid cancellation reason   ' } });
    
    const confirmButton = screen.getByText('Confirmar Cancelación');
    await waitFor(() => {
      expect(confirmButton).not.toBeDisabled();
    });
    
    fireEvent.click(confirmButton);
    
    expect(onConfirm).toHaveBeenCalledWith('valid cancellation reason');
    expect(onClose).toHaveBeenCalled();
  });

  it('should show validation error for short observation on submit', () => {
    render(<CancelOrderModal {...defaultProps} />);
    
    const textarea = screen.getByPlaceholderText(/motivo de la cancelación/);
    fireEvent.change(textarea, { target: { value: 'short' } });
    
    const confirmButton = screen.getByText('Confirmar Cancelación');
    fireEvent.click(confirmButton);
    
    // Should show error message
    expect(screen.getByText(/10 caracteres/)).toBeInTheDocument();
  });

  it('should disable all inputs when isUpdating is true', () => {
    render(<CancelOrderModal {...defaultProps} isUpdating={true} />);
    
    const textarea = screen.getByPlaceholderText(/motivo de la cancelación/);
    expect(textarea).toBeDisabled();
    
    const cancelButton = screen.getByText('Mantener Orden');
    expect(cancelButton).toBeDisabled();
  });

  it('should show loading state when updating', () => {
    render(<CancelOrderModal {...defaultProps} isUpdating={true} />);
    
    expect(screen.getByText('Cancelando...')).toBeInTheDocument();
  });

  it('should update character counter as user types', () => {
    render(<CancelOrderModal {...defaultProps} />);
    
    const textarea = screen.getByPlaceholderText(/motivo de la cancelación/);
    fireEvent.change(textarea, { target: { value: '12345' } });
    
    expect(screen.getByText('5/10')).toBeInTheDocument();
  });

  it('should show green counter when valid (10+ chars)', () => {
    render(<CancelOrderModal {...defaultProps} />);
    
    const textarea = screen.getByPlaceholderText(/motivo de la cancelación/);
    fireEvent.change(textarea, { target: { value: '1234567890' } });
    
    const counter = screen.getByText('10/10');
    expect(counter).toHaveClass('text-emerald-600');
  });
});
