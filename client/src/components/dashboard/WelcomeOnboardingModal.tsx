import React from "react";
import { useMutation, useApolloClient } from "@apollo/client";
import {
  Sparkles,
  Database,
  ArrowRight,
  ShieldCheck,
  Zap,
  Globe,
  RefreshCw,
  X,
} from "lucide-react";
import { SEED_DATABASE } from "../../lib/graphql/mutations";

interface WelcomeOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSeedSuccess: () => void;
}

export const WelcomeOnboardingModal: React.FC<WelcomeOnboardingModalProps> = ({
  isOpen,
  onClose,
  onSeedSuccess,
}) => {
  const apolloClient = useApolloClient();
  const [seedDatabase, { loading }] = useMutation(SEED_DATABASE);

  if (!isOpen) return null;

  const handleQuickStart = async () => {
    try {
      const response = await seedDatabase();
      if (response.data?.seedDatabase) {
        await apolloClient.clearStore();
        onSeedSuccess();
      }
    } catch (err) {
      console.error("Failed to seed database during onboarding:", err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-md animate-[fadeIn_0.3s_ease-out]">
      <div className="relative bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl p-8 md:p-10 space-y-8">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-1.5 rounded-full text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 transition-all cursor-pointer"
          aria-label="Close onboarding"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Luxury Ornament & Header */}
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/10 animate-pulse">
            <Sparkles className="w-8 h-8" />
          </div>
          
          <div className="space-y-2">
            <span className="text-xs font-black uppercase tracking-widest text-amber-500 dark:text-amber-400">
              Welcome to the Next Generation
            </span>
            <h1 className="text-3xl md:text-4xl font-black text-stone-950 dark:text-stone-50 tracking-tight">
              Invertor-AI Experience
            </h1>
          </div>
          
          <p className="text-sm md:text-base text-stone-500 dark:text-stone-400 max-w-lg mx-auto leading-relaxed">
            Unleashing the intelligent synergy of real-time inventory control, deep client tracking, and premium analytics.
          </p>
        </div>

        {/* Value Proposition Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          <div className="bg-stone-50 dark:bg-stone-950/40 border border-stone-100 dark:border-stone-800/50 rounded-2xl p-5 space-y-3">
            <div className="p-2 w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100">Intelligent Seeder</h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
              Populate your system with smart sandbox testing documents in one click.
            </p>
          </div>

          <div className="bg-stone-50 dark:bg-stone-950/40 border border-stone-100 dark:border-stone-800/50 rounded-2xl p-5 space-y-3">
            <div className="p-2 w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100">Real-time Stats</h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
              Monitor active revenue, top performing sellers, and dynamic customer tier rankings.
            </p>
          </div>

          <div className="bg-stone-50 dark:bg-stone-950/40 border border-stone-100 dark:border-stone-800/50 rounded-2xl p-5 space-y-3">
            <div className="p-2 w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100">Sandbox Isolation</h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
              Wipe or refresh mock records easily while keeping real production data clean.
            </p>
          </div>
        </div>

        {/* Action Panel */}
        <div className="bg-gradient-to-r from-stone-900 to-stone-950 text-white rounded-2xl p-6 flex flex-col md:flex-row md:items-center md:justify-between border border-stone-800 gap-6">
          <div className="space-y-1">
            <h4 className="font-bold text-stone-100 text-base flex items-center gap-2">
              <Globe className="w-4 h-4 text-amber-400" />
              Empty Database Detected
            </h4>
            <p className="text-xs text-stone-400 leading-relaxed max-w-md">
              Start your journey with sample sandbox data (3 sellers, 5 clients, and 15 simulated orders) to unlock immediate analytical dashboards.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 flex-shrink-0">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-stone-300 hover:text-white hover:bg-stone-800 transition-colors text-xs font-semibold"
            >
              Skip, Start Clean
            </button>
            <button
              onClick={handleQuickStart}
              disabled={loading}
              className="px-5 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-stone-950 text-xs font-black tracking-wide flex items-center justify-center shadow-lg hover:shadow-amber-500/20 transition-all cursor-pointer"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <ArrowRight className="w-4 h-4 mr-2" />
              )}
              Launch Sandbox
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default WelcomeOnboardingModal;
