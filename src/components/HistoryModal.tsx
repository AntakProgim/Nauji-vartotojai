import React, { useState } from 'react';
import { History, Download, Mail, Trash2, ArrowUpRight, X, AlertTriangle, Users } from 'lucide-react';
import { HistoryBatch, UserRecord } from '../types';
import { generateCsv } from '../lib/utils';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: HistoryBatch[];
  onLoadBatch: (users: UserRecord[], password?: string) => void;
  onDeleteBatch: (id: string) => void;
  onClearHistory: () => void;
  onOpenEmailForBatch: (batch: HistoryBatch) => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  onClose,
  history,
  onLoadBatch,
  onDeleteBatch,
  onClearHistory,
  onOpenEmailForBatch,
}) => {
  const [confirmClear, setConfirmClear] = useState(false);
  const [selectedBatchForPreview, setSelectedBatchForPreview] = useState<HistoryBatch | null>(null);

  if (!isOpen) return null;

  const handleDownloadBatchCsv = (batch: HistoryBatch) => {
    const csvStr = generateCsv(batch.users, batch.password, batch.requirePasswordChange);
    const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const safeName = (batch.name || 'users')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .substring(0, 20);
    link.setAttribute('download', `google_admin_${safeName}_${batch.id.slice(0, 6)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-100 text-indigo-700 rounded-lg flex items-center justify-center">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Kūrimo istorija</h2>
              <p className="text-xs text-gray-500">
                Išsaugota {history.length} ankstesnių vartotojų generavimo sesijų
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {history.length === 0 ? (
            <div className="py-16 text-center text-gray-400 flex flex-col items-center justify-center">
              <History className="w-12 h-12 mb-3 opacity-20" />
              <p className="text-sm font-medium text-gray-600">Istorija tuščia</p>
              <p className="text-xs text-gray-400 max-w-sm mt-1">
                Kiekvieną kartą sugeneravus CSV failą arba išsaugojus sesiją, ji bus automatiškai išsaugota čia.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((batch) => (
                <div
                  key={batch.id}
                  className="bg-white border border-gray-200 hover:border-indigo-300 rounded-xl p-4 transition-all shadow-2xs space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900 text-sm">{batch.name}</span>
                        <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs font-medium rounded-full border border-indigo-100">
                          {batch.usersCount} vartot.
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                        <span>{batch.createdAt}</span>
                        <span>•</span>
                        <span>Slaptažodis: <strong className="text-gray-600 font-mono">{batch.password}</strong></span>
                        <span>•</span>
                        <span>Priverstinis keitimas: {batch.requirePasswordChange ? 'Taip' : 'Ne'}</span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
                      <button
                        onClick={() => onLoadBatch(batch.users, batch.password)}
                        className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors"
                        title="Įkelti šiuos vartotojus į dabartinę lentelę"
                      >
                        <ArrowUpRight className="w-3.5 h-3.5" />
                        Įkelti į redaktorių
                      </button>
                      <button
                        onClick={() => handleDownloadBatchCsv(batch)}
                        className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors"
                        title="Atsisiųsti šios partijos CSV failą"
                      >
                        <Download className="w-3.5 h-3.5" />
                        CSV
                      </button>
                      <button
                        onClick={() => onOpenEmailForBatch(batch)}
                        className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors"
                        title="Atidaryti informavimo laišką vadovams"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        Laiškas
                      </button>
                      <button
                        onClick={() => onDeleteBatch(batch.id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Ištrinti šį įrašą iš istorijos"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Expandable / sample preview of users */}
                  <div className="bg-gray-50/70 p-2.5 rounded-lg text-xs text-gray-600 flex flex-wrap gap-2 items-center">
                    <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Vartotojai:</span>
                    {batch.users.slice(0, 5).map((u, i) => (
                      <span key={i} className="bg-white px-2 py-0.5 rounded border border-gray-200 text-gray-700 text-xs">
                        {u.firstName} {u.lastName} <span className="text-gray-400">({u.email})</span>
                      </span>
                    ))}
                    {batch.users.length > 5 && (
                      <span className="text-xs text-gray-400 italic">
                        ir dar {batch.users.length - 5}...
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between shrink-0">
          <div>
            {history.length > 0 && (
              <>
                {!confirmClear ? (
                  <button
                    onClick={() => setConfirmClear(true)}
                    className="text-xs text-red-600 hover:text-red-700 font-medium flex items-center gap-1 hover:underline"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Išvalyti visą istoriją
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-red-600 font-medium flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" /> Tikrai ištrinti visą istoriją?
                    </span>
                    <button
                      onClick={() => {
                        onClearHistory();
                        setConfirmClear(false);
                      }}
                      className="px-2 py-1 bg-red-600 text-white rounded text-xs font-semibold hover:bg-red-700"
                    >
                      Taip, išvalyti
                    </button>
                    <button
                      onClick={() => setConfirmClear(false)}
                      className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs hover:bg-gray-300"
                    >
                      Atšaukti
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg text-xs font-semibold transition-colors"
          >
            Uždaryti
          </button>
        </div>

      </div>
    </div>
  );
};
