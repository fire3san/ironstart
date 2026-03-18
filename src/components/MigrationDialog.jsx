import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Database, ArrowRight, CheckCircle2, AlertTriangle, X, 
  HardDrive, Cloud, Shield, TrendingUp, Activity, Utensils,
  Target, Award, Droplets, Heart
} from 'lucide-react';

const DATA_TYPE_ICONS = {
  history: Activity,
  metrics: TrendingUp,
  food: Utensils,
  goals: Target,
  prs: Award,
  water: Droplets,
  wellness: Heart
};

const DATA_TYPE_LABELS = {
  history: 'Workout History',
  metrics: 'Body Metrics',
  food: 'Food Log',
  goals: 'Goals',
  prs: 'Personal Records',
  water: 'Water Tracker',
  wellness: 'Wellness Data'
};

/**
 * Migration Dialog - Shown when user has local data and logs in
 */
export const MigrationDialog = ({ 
  localData, 
  remoteData, 
  onMigrate, 
  onSkip, 
  onCancel,
  isMigrating,
  migrationProgress 
}) => {
  const [showDetails, setShowDetails] = useState(false);

  const dataTypes = Object.keys(localData || {});
  const totalItems = dataTypes.reduce((sum, key) => {
    const data = localData[key];
    return sum + (Array.isArray(data) ? data.length : 1);
  }, 0);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-slate-900 w-full max-w-lg rounded-2xl border border-slate-700 shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-blue-600 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-white/20 p-2 rounded-lg">
              <Cloud className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white">Found Local Data</h2>
          </div>
          <p className="text-emerald-100 text-sm">
            We detected your progress stored on this device
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Summary Card */}
          <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-emerald-500/20 p-2 rounded-lg">
                  <HardDrive className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <div className="font-bold text-white">{totalItems} items found</div>
                  <div className="text-xs text-slate-400">{dataTypes.length} data types</div>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-500" />
              <div className="flex items-center gap-3">
                <div className="bg-blue-500/20 p-2 rounded-lg">
                  <Cloud className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <div className="font-bold text-white">Cloud Sync</div>
                  <div className="text-xs text-slate-400">Secure backup</div>
                </div>
              </div>
            </div>
          </div>

          {/* Data Types List */}
          <div className="mb-4">
            <button 
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center justify-between w-full text-left text-sm text-slate-400 hover:text-white transition-colors"
            >
              <span>Data to migrate:</span>
              <span className="flex items-center gap-1">
                {showDetails ? 'Hide details' : 'Show details'}
                <svg className={`w-4 h-4 transition-transform ${showDetails ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </span>
            </button>
            
            <AnimatePresence>
              {showDetails && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {dataTypes.map(type => {
                      const Icon = DATA_TYPE_ICONS[type] || Database;
                      const data = localData[type];
                      const count = Array.isArray(data) ? data.length : 1;
                      
                      return (
                        <div 
                          key={type}
                          className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/50 flex items-center gap-2"
                        >
                          <Icon className="w-4 h-4 text-emerald-400" />
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium text-white truncate">
                              {DATA_TYPE_LABELS[type] || type}
                            </div>
                            <div className="text-[10px] text-slate-500">
                              {count} {count === 1 ? 'entry' : 'entries'}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Merge Notice */}
          {remoteData && Object.keys(remoteData).length > 0 && (
            <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3 mb-4">
              <div className="flex items-start gap-2">
                <Shield className="w-4 h-4 text-blue-400 mt-0.5" />
                <div className="text-xs text-blue-200">
                  <span className="font-bold">Smart Merge:</span> Your local data will be combined with existing cloud data. No progress will be lost.
                </div>
              </div>
            </div>
          )}

          {/* Progress Bar */}
          {isMigrating && migrationProgress && (
            <div className="mb-4">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-slate-400">Migrating data...</span>
                <span className="text-emerald-400 font-bold">{migrationProgress}%</span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${migrationProgress}%` }}
                  className="h-full bg-gradient-to-r from-emerald-500 to-blue-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-6 pt-0 flex gap-3">
          <button 
            onClick={onCancel}
            disabled={isMigrating}
            className="flex-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={onSkip}
            disabled={isMigrating}
            className="flex-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-400 font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <X className="w-4 h-4" />
            Skip (Use Cloud)
          </button>
          <button 
            onClick={onMigrate}
            disabled={isMigrating}
            className="flex-[2] bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {isMigrating ? (
              <>
                <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Migrating...
              </>
            ) : (
              <>
                <ArrowRight className="w-5 h-5" />
                Migrate & Continue
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

/**
 * Migration Success Dialog
 */
export const MigrationSuccessDialog = ({ result, onComplete, onClearLocal }) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-slate-900 w-full max-w-md rounded-2xl border border-slate-700 shadow-2xl p-6 text-center"
      >
        {/* Success Icon */}
        <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-10 h-10 text-white" />
        </div>

        <h2 className="text-2xl font-bold text-white mb-2">Migration Complete!</h2>
        <p className="text-slate-400 mb-6">Your data is now safely in the cloud</p>

        {/* Stats */}
        <div className="bg-slate-800 rounded-xl p-4 mb-6">
          <div className="text-sm text-slate-400 mb-3">Migrated Data</div>
          <div className="grid grid-cols-2 gap-3">
            {result?.stats && Object.entries(result.stats).map(([key, count]) => {
              const Icon = DATA_TYPE_ICONS[key] || Database;
              return (
                <div key={key} className="bg-slate-900 p-2 rounded-lg">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <Icon className="w-4 h-4 text-emerald-400" />
                    <span className="text-lg font-bold text-white">{count}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 capitalize">{key}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Clear Local Data Option */}
        <div className="bg-amber-900/20 border border-amber-500/30 rounded-lg p-3 mb-6">
          <div className="flex items-start gap-2 text-left">
            <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5" />
            <div className="text-xs text-amber-200">
              <span className="font-bold">Optional:</span> Clear local data to free up space? Your data is safe in the cloud.
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button 
            onClick={onClearLocal}
            className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl transition-colors"
          >
            Clear Local Data
          </button>
          <button 
            onClick={onComplete}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl transition-colors"
          >
            Continue to App
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default { MigrationDialog, MigrationSuccessDialog };