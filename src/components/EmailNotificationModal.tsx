import React, { useState } from 'react';
import { Mail, Copy, Check, ExternalLink, X, Send, KeyRound } from 'lucide-react';
import { UserRecord } from '../types';
import { generateNotificationEmail } from '../lib/utils';

interface EmailNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: UserRecord[];
  password: string;
  batchName?: string;
}

export const EmailNotificationModal: React.FC<EmailNotificationModalProps> = ({
  isOpen,
  onClose,
  users,
  password,
  batchName,
}) => {
  const [recipient, setRecipient] = useState('');
  const [extraNotes, setExtraNotes] = useState('');
  const [copiedType, setCopiedType] = useState<string | null>(null);

  if (!isOpen) return null;

  const { subject, bodyText, bodyHtml } = generateNotificationEmail(users, password, extraNotes);

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(bodyText);
      setCopiedType('text');
      setTimeout(() => setCopiedType(null), 2500);
    } catch {
      // Fallback
      const el = document.createElement('textarea');
      el.value = bodyText;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopiedType('text');
      setTimeout(() => setCopiedType(null), 2500);
    }
  };

  const handleCopyHtml = async () => {
    try {
      const blobHtml = new Blob([bodyHtml], { type: 'text/html' });
      const blobText = new Blob([bodyText], { type: 'text/plain' });
      const item = new ClipboardItem({
        'text/html': blobHtml,
        'text/plain': blobText,
      });
      await navigator.clipboard.write([item]);
      setCopiedType('html');
      setTimeout(() => setCopiedType(null), 2500);
    } catch {
      handleCopyText();
    }
  };

  const handleCopyCredentialsOnly = async () => {
    const creds = users
      .map((u, i) => `${i + 1}. ${u.firstName} ${u.lastName}: ${u.email} (Slaptažodis: ${password})`)
      .join('\n');
    await navigator.clipboard.writeText(creds);
    setCopiedType('creds');
    setTimeout(() => setCopiedType(null), 2500);
  };

  const openGmailWeb = () => {
    const to = encodeURIComponent(recipient);
    const su = encodeURIComponent(subject);
    const body = encodeURIComponent(bodyText);
    window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${to}&su=${su}&body=${body}`, '_blank');
  };

  const openMailto = () => {
    const to = encodeURIComponent(recipient);
    const su = encodeURIComponent(subject);
    const body = encodeURIComponent(bodyText);
    window.location.href = `mailto:${to}?subject=${su}&body=${body}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-100 text-indigo-700 rounded-lg flex items-center justify-center">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Informavimo laiškas klasės vadovams / administracijai</h2>
              <p className="text-xs text-gray-500">
                {users.length} vartotojų sąrašas {batchName ? `(${batchName})` : ''} su oficialiomis instrukcijomis
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
        <div className="p-6 overflow-y-auto space-y-4 flex-1 text-sm">
          
          {/* Quick Config */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-indigo-50/60 p-3.5 rounded-xl border border-indigo-100">
            <div>
              <label className="block text-xs font-semibold text-indigo-900 mb-1">
                Gavėjo el. paštas (pvz. klasės vadovas):
              </label>
              <input
                type="email"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="vadovas@antakalnio.lt"
                className="w-full px-3 py-1.5 bg-white border border-indigo-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-indigo-900 mb-1">
                Papildomas komentaras (nebūtina):
              </label>
              <input
                type="text"
                value={extraNotes}
                onChange={(e) => setExtraNotes(e.target.value)}
                placeholder="Pvz.: 5M klasės mokinių prisijungimai"
                className="w-full px-3 py-1.5 bg-white border border-indigo-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>

          {/* Email Preview Container */}
          <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-xs">
            <div className="bg-gray-100 px-4 py-2 border-b border-gray-200 text-xs text-gray-600 flex justify-between items-center">
              <span className="font-medium text-gray-700 truncate pr-2">
                <strong>Tema:</strong> {subject}
              </span>
              <span className="text-[11px] text-gray-500 shrink-0">Peržiūra</span>
            </div>

            <div className="p-4 font-sans text-xs leading-relaxed space-y-3 max-h-72 overflow-y-auto bg-gray-50/40">
              <p className="font-semibold text-gray-800">Sveiki,</p>
              
              <div className="p-3 bg-white rounded-lg border border-gray-200 text-gray-700 space-y-1">
                <p className="font-medium text-indigo-950">Informuojame, kad yra sukurti el. paštai.</p>
                <p>Slaptažodžius būtina pasikeisti ir kur nors vaikams bei jų tėvams užsirašyti.</p>
                <p>Atnaujinta klasės el. pašto grupė.</p>
              </div>

              {extraNotes && (
                <p className="text-gray-600 italic">
                  <strong>Papildoma informacija:</strong> {extraNotes}
                </p>
              )}

              {/* Users table preview */}
              <div>
                <p className="font-semibold text-gray-700 mb-1">Naujai sukurtų vartotojų sąrašas ({users.length}):</p>
                <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                  <table className="w-full text-[11px] text-left">
                    <thead className="bg-gray-100 text-gray-600 font-semibold border-b border-gray-200">
                      <tr>
                        <th className="px-3 py-1.5">Vardas Pavardė</th>
                        <th className="px-3 py-1.5">El. paštas</th>
                        <th className="px-3 py-1.5">Slaptažodis</th>
                        <th className="px-3 py-1.5">Padalinys</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {users.map((u, i) => (
                        <tr key={u.id || i} className="hover:bg-gray-50">
                          <td className="px-3 py-1 font-medium text-gray-900">{u.firstName} {u.lastName}</td>
                          <td className="px-3 py-1 text-indigo-600">{u.email}</td>
                          <td className="px-3 py-1 font-mono text-gray-600">{password}</td>
                          <td className="px-3 py-1 text-gray-500">{u.orgUnit}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Links section */}
              <div className="pt-2 border-t border-gray-200 text-gray-600 space-y-1">
                <p className="font-semibold text-gray-700">Svarbios nuorodos ir instrukcijos:</p>
                <ul className="list-disc list-inside space-y-0.5 text-indigo-600">
                  <li>
                    <a href="https://sites.google.com/antakalnio.lt/nuotolinis/pagalba#h.wqc5u5hdrupj" target="_blank" rel="noreferrer" className="hover:underline">
                      Nuotolinio ugdymo svetainė
                    </a>
                  </li>
                  <li>
                    <a href="https://sites.google.com/antakalnio.lt/nuotolinis/ugdymo-it-%C4%AFrankiai/google-pa%C5%A1tas?authuser=0" target="_blank" rel="noreferrer" className="hover:underline">
                      El. pašto prisijungimo instrukcija
                    </a>
                  </li>
                  <li>
                    <a href="https://antakalnio.lt/lt/naujienos/svarbu/2023/09/kaip-prisijungti-prie-elektroninio-dienyno-2023-09-09-09-47" target="_blank" rel="noreferrer" className="hover:underline">
                      Kaip mokiniui jungtis prie el. dienyno mokyklos el. paštu
                    </a>
                  </li>
                </ul>
              </div>

              <p className="text-gray-500 text-[11px]">
                Pagarbiai,<br />Antakalnio progimnazijos IT administratorius
              </p>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyCredentialsOnly}
              className="px-3 py-2 bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
              title="Kopijuoti tik vardus, el. paštus ir slaptažodžius"
            >
              {copiedType === 'creds' ? <Check className="w-3.5 h-3.5 text-green-600" /> : <KeyRound className="w-3.5 h-3.5 text-gray-500" />}
              {copiedType === 'creds' ? 'Nukopijuota!' : 'Tik prisijungimai'}
            </button>
            <button
              onClick={handleCopyHtml}
              className="px-3 py-2 bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
              title="Kopijuoti suformatuotą tekstą su lentele (tinka įklijuoti tiesiai į Gmail ar Outlook)"
            >
              {copiedType === 'html' ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5 text-indigo-600" />}
              {copiedType === 'html' ? 'Nukopijuota (su lentele)!' : 'Kopijuoti su lentele'}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={openMailto}
              className="px-3 py-2 bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Send className="w-3.5 h-3.5 text-gray-500" />
              Siųsti per pašto programą
            </button>
            <button
              onClick={openGmailWeb}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Atidaryti Gmail naršyklėje
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
