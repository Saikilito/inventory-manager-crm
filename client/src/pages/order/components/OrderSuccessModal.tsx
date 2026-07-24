import { X, CheckCircle } from 'lucide-react';

interface OrderSuccessModalProps {
  onClose: () => void;
}

export const OrderSuccessModal = ({ onClose }: OrderSuccessModalProps) => {
  return (
    <div className="absolute inset-0 z-10 bg-white/95 dark:bg-stone-900/95 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in-95 duration-200">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition-colors p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer h-10 w-10 flex items-center justify-center"
        aria-label="Close success modal"
      >
        <X className="w-5 h-5" />
      </button>
      <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/40 rounded-full flex items-center justify-center mb-5 shadow-inner">
        <CheckCircle className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
      </div>
      <h3 className="text-2xl font-black text-emerald-700 dark:text-emerald-400 mb-3">Success!</h3>
      <p className="text-sm font-medium text-stone-600 dark:text-stone-300 max-w-sm mb-8 leading-relaxed">
        Your order has been automatically marked as completed. <br />
        <br />
        Happy selling! 🚀
      </p>
      <button
        onClick={onClose}
        className="px-8 py-3 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-colors shadow-md hover:shadow-lg cursor-pointer"
      >
        Accept
      </button>
    </div>
  );
};
