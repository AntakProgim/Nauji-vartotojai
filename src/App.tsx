import { useState, useEffect } from 'react';
import { 
  Download, 
  Users, 
  Settings, 
  FileSpreadsheet, 
  Plus, 
  Trash2, 
  FileOutput, 
  Mail, 
  History, 
  RotateCcw,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { UserRecord, HistoryBatch } from './types';
import { 
  ORG_UNITS, 
  generateCsv, 
  generateEmail, 
  generateEmptyTemplate,
  getHistory,
  saveBatchToHistory,
  deleteBatchFromHistory,
  clearAllHistory
} from './lib/utils';
import { EmailNotificationModal } from './components/EmailNotificationModal';
import { HistoryModal } from './components/HistoryModal';

export default function App() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [pasteText, setPasteText] = useState('');
  
  const [password, setPassword] = useState('progimnazija');
  const [requirePasswordChange, setRequirePasswordChange] = useState(true);
  const [defaultOrgUnit, setDefaultOrgUnit] = useState('/Mokiniai');
  const [defaultTitle, setDefaultTitle] = useState('');
  const [defaultDepartment, setDefaultDepartment] = useState('');

  // Modals state
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [emailModalUsers, setEmailModalUsers] = useState<UserRecord[]>([]);
  const [emailModalPassword, setEmailModalPassword] = useState('');
  const [emailModalBatchName, setEmailModalBatchName] = useState('');

  // Toast / notification state
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' } | null>(null);

  // History state
  const [historyList, setHistoryList] = useState<HistoryBatch[]>([]);

  useEffect(() => {
    setHistoryList(getHistory());
  }, []);

  const showToast = (text: string, type: 'success' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handlePasteData = () => {
    if (!pasteText.trim()) return;
    
    const lines = pasteText.trim().split('\n');
    const newUsers: UserRecord[] = lines.map(line => {
      const cols = line.split('\t').map(c => c.trim());
      let firstName = '';
      let lastName = '';
      let orgUnit = defaultOrgUnit;
      
      if (cols.length === 2) {
        firstName = cols[0];
        lastName = cols[1];
      } else if (cols.length >= 3) {
        firstName = cols[1];
        lastName = cols[2];
        const cls = cols[0].toLowerCase();
        const matchedOU = ORG_UNITS.find(ou => ou.toLowerCase().endsWith(`/${cls}`));
        if (matchedOU) {
          orgUnit = matchedOU;
        }
      } else if (cols.length === 1) {
        const parts = cols[0].split(' ');
        firstName = parts[0];
        lastName = parts.slice(1).join(' ');
      }
      
      return {
        id: crypto.randomUUID(),
        firstName,
        lastName,
        email: generateEmail(firstName, lastName),
        orgUnit: orgUnit,
        title: defaultTitle,
        department: defaultDepartment
      };
    }).filter(u => u.firstName || u.lastName);
    
    setUsers(prev => [...prev, ...newUsers]);
    setPasteText('');
    showToast(`Pridėta ${newUsers.length} vartotojų į sąrašą!`);
  };

  const updateUser = (id: string, field: keyof UserRecord, value: string) => {
    setUsers(prev => prev.map(u => {
      if (u.id === id) {
        const updated = { ...u, [field]: value };
        if (field === 'firstName' || field === 'lastName') {
          updated.email = generateEmail(updated.firstName, updated.lastName);
        }
        return updated;
      }
      return u;
    }));
  };

  const removeUser = (id: string) => {
    setUsers(prev => prev.filter(u => u.id !== id));
  };

  const clearAllUsers = () => {
    if (users.length === 0) return;
    if (window.confirm(`Ar tikrai norite išvalyti visus ${users.length} vartotojus iš lentelės?`)) {
      setUsers([]);
      showToast('Vartotojų sąrašas išvalytas', 'info');
    }
  };

  const downloadCsv = () => {
    if (users.length === 0) return;
    const csvStr = generateCsv(users, password, requirePasswordChange);
    const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    // Auto-derive sensible batch name
    const sampleOU = users[0]?.orgUnit || 'Mokiniai';
    const cleanOU = sampleOU.split('/').filter(Boolean).pop() || 'Vartotojai';
    const filename = `google_admin_${cleanOU}_${new Date().toISOString().slice(0, 10)}.csv`;
    
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Save batch to history
    const savedBatch = saveBatchToHistory({
      name: `${cleanOU} (${users.length} vartot.)`,
      usersCount: users.length,
      password: password,
      requirePasswordChange: requirePasswordChange,
      users: [...users]
    });

    setHistoryList(getHistory());
    showToast(`CSV failas paruoštas ir išsaugotas į istoriją! (${users.length} vart.)`);
  };

  const downloadTemplate = () => {
    const csvStr = generateEmptyTemplate();
    const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'users_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Tuščias CSV šablonas paruoštas');
  };

  const handleOpenEmailNotification = (customUsers?: UserRecord[], customPassword?: string, batchName?: string) => {
    const targetUsers = customUsers || users;
    if (targetUsers.length === 0) return;
    setEmailModalUsers(targetUsers);
    setEmailModalPassword(customPassword || password);
    setEmailModalBatchName(batchName || defaultOrgUnit);
    setIsEmailModalOpen(true);
  };

  const handleLoadBatchFromHistory = (batchUsers: UserRecord[], batchPassword?: string) => {
    setUsers(batchUsers);
    if (batchPassword) setPassword(batchPassword);
    setIsHistoryModalOpen(false);
    showToast(`Įkelta ${batchUsers.length} vartotojų iš istorijos!`);
  };

  const handleDeleteHistoryBatch = (id: string) => {
    const updated = deleteBatchFromHistory(id);
    setHistoryList(updated);
    showToast('Istorijos įrašas pašalintas', 'info');
  };

  const handleClearAllHistory = () => {
    clearAllHistory();
    setHistoryList([]);
    showToast('Visa istorija išvalyta', 'info');
  };

  return (
    <div className="h-screen w-full flex flex-col font-sans text-gray-800 bg-gray-50 overflow-hidden">
      
      {/* Toast popup */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-gray-900 text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2.5 text-xs font-medium animate-in fade-in slide-in-from-top-2 duration-200">
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header */}
      <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-xs">
            A
          </div>
          <div>
            <h1 className="text-base font-bold leading-tight text-gray-900">Antakalnio Progimnazija</h1>
            <p className="text-[11px] text-gray-500 uppercase tracking-wider font-medium">Google Workspace Vartotojų Generatorius</p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* History Button */}
          <button
            onClick={() => setIsHistoryModalOpen(true)}
            className="text-gray-600 hover:text-indigo-600 px-3 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 border border-gray-200 hover:border-indigo-200 bg-white hover:bg-indigo-50 shadow-2xs"
            title="Peržiūrėti anksčiau sugeneruotų vartotojų istoriją"
          >
            <History className="w-4 h-4 text-indigo-600" />
            <span className="hidden sm:inline">Kūrimo istorija</span>
            {historyList.length > 0 && (
              <span className="ml-0.5 px-1.5 py-0.2 bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded-full">
                {historyList.length}
              </span>
            )}
          </button>

          {/* Email Notification Button */}
          <button
            onClick={() => handleOpenEmailNotification()}
            disabled={users.length === 0}
            className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 border border-gray-200 hover:border-indigo-200 bg-white hover:bg-indigo-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
            title="Paruošti informacinį el. laišką klasės vadovams"
          >
            <Mail className="w-4 h-4 text-indigo-600" />
            <span className="hidden md:inline">Pranešimas vadovams</span>
          </button>

          {/* Template Download Button */}
          <button
            onClick={downloadTemplate}
            className="text-gray-600 hover:text-indigo-600 px-3 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 border border-gray-200 hover:border-indigo-200 bg-white hover:bg-indigo-50 shadow-2xs"
            title="Atsisiųsti tuščią CSV šabloną"
          >
            <FileOutput className="w-4 h-4 text-gray-500" />
            <span className="hidden lg:inline">Tuščias šablonas</span>
          </button>

          {/* Main Generate CSV Button */}
          <button
            onClick={downloadCsv}
            disabled={users.length === 0}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 shadow-xs ml-1"
          >
            <Download className="w-4 h-4" />
            <span>Generuoti CSV</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex overflow-hidden">
        
        {/* Left Sidebar: Controls & Paste */}
        <aside className="w-80 bg-white border-r border-gray-200 flex flex-col p-4 shrink-0 overflow-y-auto">
          
          {/* Step 1: Input list */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider">
                1. Vartotojų sąrašas (Įklijuoti)
              </label>
              {pasteText && (
                <button
                  onClick={() => setPasteText('')}
                  className="text-[10px] text-gray-400 hover:text-red-500 font-medium"
                >
                  Išvalyti tekstą
                </button>
              )}
            </div>
            <textarea
              value={pasteText}
              onChange={e => setPasteText(e.target.value)}
              placeholder="1o&#9;Varvara&#9;Dudarieva&#10;1o&#9;Juozas&#9;Eimontas&#10;arba: Jonas Petrauskas"
              className="w-full h-32 p-2.5 text-xs font-mono border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none bg-gray-50/50 focus:bg-white"
            />
            <p className="mt-1 text-[10px] text-gray-400 italic mb-2">
              Kopijuokite iš Excel (Klasė, Vardas, Pavardė) arba teksto
            </p>
            <button
              onClick={handlePasteData}
              disabled={!pasteText.trim()}
              className="w-full bg-indigo-50 text-indigo-700 hover:bg-indigo-100 disabled:opacity-40 disabled:cursor-not-allowed py-2 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 border border-indigo-100"
            >
              <Plus className="w-3.5 h-3.5" />
              Pridėti vartotojus į sąrašą
            </button>
          </div>

          {/* Step 2: Select OU */}
          <div className="mb-5">
            <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">
              2. Numatytas padalinys (OU)
            </label>
            <select
              value={defaultOrgUnit}
              onChange={e => setDefaultOrgUnit(e.target.value)}
              className="w-full p-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white font-medium text-gray-700"
            >
              {ORG_UNITS.map(ou => (
                <option key={ou} value={ou}>{ou}</option>
              ))}
            </select>
          </div>

          {/* Step 3: Password template */}
          <div className="mb-5">
            <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">
              3. Laikino slaptažodžio šablonas
            </label>
            <input
              type="text"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="progimnazija, mokykla2026..."
              className="w-full p-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
            />
            <div className="mt-2 flex items-center gap-2">
              <input
                type="checkbox"
                id="force-reset"
                checked={requirePasswordChange}
                onChange={e => setRequirePasswordChange(e.target.checked)}
                className="w-3.5 h-3.5 accent-indigo-600 rounded cursor-pointer"
              />
              <label htmlFor="force-reset" className="text-xs text-gray-600 cursor-pointer select-none">
                Privalomas keitimas (Next Sign-In)
              </label>
            </div>
          </div>

          {/* Step 4: Optional fields */}
          <div className="mb-5">
            <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">
              4. Papildoma informacija (nebūtina)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                 <input
                  type="text"
                  value={defaultTitle}
                  onChange={e => setDefaultTitle(e.target.value)}
                  placeholder="Pareigos (Title)"
                  className="w-full p-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <input
                  type="text"
                  value={defaultDepartment}
                  onChange={e => setDefaultDepartment(e.target.value)}
                  placeholder="Padalinys (Dep.)"
                  className="w-full p-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Info note */}
          <div className="mt-auto p-3 bg-indigo-50/80 rounded-xl border border-indigo-100 shrink-0">
            <p className="text-xs leading-relaxed text-indigo-900">
              <strong className="block mb-0.5 text-indigo-950 font-semibold">Taisyklės:</strong> 
              Lietuviškos raidės verčiamos į lotyniškas (<em>ą→a, š→s</em>). Jei yra keli vardai – el. paštui naudojamas <strong>pirmas</strong>, o jei kelios / dvigubos pavardės – naudojama <strong>antroji pavardė</strong>.
            </p>
          </div>
        </aside>
        
        {/* Right Section: Table & Actions */}
        <section className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
          
          {/* Table Header toolbar */}
          <div className="p-3.5 px-6 border-b border-gray-200 bg-white flex flex-wrap justify-between items-center gap-3 shrink-0">
            <div className="flex items-center gap-3">
              <h2 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                Peržiūra ir redagavimas
              </h2>
              <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-semibold rounded-full">
                {users.length} {users.length === 1 ? 'vartotojas' : 'vartotojai'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Inform Class Teachers Email Button */}
              {users.length > 0 && (
                <button
                  onClick={() => handleOpenEmailNotification()}
                  className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors border border-indigo-200"
                  title="Paruošti el. laiško šabloną vadovams su sukurtų vartotojų duomenimis ir instrukcijomis"
                >
                  <Mail className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Siųsti vadovams</span>
                </button>
              )}

              {/* Clear All Users Button */}
              {users.length > 0 && (
                <button
                  onClick={clearAllUsers}
                  className="px-2.5 py-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors border border-transparent hover:border-red-100"
                  title="Išvalyti visus vartotojus iš sąrašo vienu paspaudimu"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Išvalyti visus ({users.length})</span>
                </button>
              )}
            </div>
          </div>
          
          {/* Table area */}
          <div className="flex-1 overflow-auto p-4">
            {users.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 p-8 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-3 text-gray-300">
                  <Users className="w-8 h-8" />
                </div>
                <p className="text-sm font-semibold text-gray-600">Vartotojų sąrašas tuščias</p>
                <p className="text-xs text-gray-400 max-w-sm mt-1">
                  Kairėje pusėje įklijuokite mokinių ar mokytojų sąrašą iš Excel arba įkelkite anksčiau išsaugotą sesiją iš „Kūrimo istorijos“.
                </p>
              </div>
            ) : (
              <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-100/80 text-[11px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200">
                      <th className="px-4 py-2.5 w-10 text-center">#</th>
                      <th className="px-4 py-2.5">Vardas Pavardė</th>
                      <th className="px-4 py-2.5">Gmail Adresas (@antakalnio.lt)</th>
                      <th className="px-4 py-2.5">Padalinys (OU Path)</th>
                      <th className="px-4 py-2.5">Pareigos (Title)</th>
                      <th className="px-4 py-2.5 w-12 text-right"></th>
                    </tr>
                  </thead>
                  <tbody className="text-xs text-gray-700 divide-y divide-gray-100">
                    {users.map((user, index) => (
                      <tr key={user.id} className={`hover:bg-indigo-50/30 transition-colors ${index % 2 !== 0 ? 'bg-gray-50/40' : ''}`}>
                        <td className="px-4 py-2 text-center text-gray-400 font-mono text-[11px]">
                          {index + 1}
                        </td>
                        <td className="px-4 py-2 font-medium">
                          <div className="flex gap-1.5">
                            <input
                              type="text"
                              value={user.firstName}
                              onChange={(e) => updateUser(user.id, 'firstName', e.target.value)}
                              className="w-28 sm:w-32 bg-transparent border-b border-transparent focus:border-indigo-400 focus:bg-white outline-none px-1 py-0.5 rounded transition-all font-semibold text-gray-900"
                              placeholder="Vardas"
                            />
                            <input
                              type="text"
                              value={user.lastName}
                              onChange={(e) => updateUser(user.id, 'lastName', e.target.value)}
                              className="w-32 sm:w-36 bg-transparent border-b border-transparent focus:border-indigo-400 focus:bg-white outline-none px-1 py-0.5 rounded transition-all font-semibold text-gray-900"
                              placeholder="Pavardė"
                            />
                          </div>
                        </td>
                        <td className="px-4 py-2 text-indigo-600">
                          <input
                            type="text"
                            value={user.email}
                            onChange={(e) => updateUser(user.id, 'email', e.target.value)}
                            className="w-full min-w-[200px] bg-transparent border-b border-transparent focus:border-indigo-400 focus:bg-white outline-none px-1 py-0.5 rounded font-mono text-xs transition-all"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <select
                            value={user.orgUnit}
                            onChange={(e) => updateUser(user.id, 'orgUnit', e.target.value)}
                            className="w-full min-w-[150px] bg-transparent border border-transparent hover:border-gray-200 focus:border-indigo-400 focus:bg-white outline-none px-1.5 py-0.5 rounded text-xs transition-all"
                          >
                            {ORG_UNITS.map(ou => (
                              <option key={ou} value={ou}>{ou}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="text"
                            value={user.title}
                            placeholder="Mokinys / Mokytojas"
                            onChange={(e) => updateUser(user.id, 'title', e.target.value)}
                            className="w-full bg-transparent border-b border-transparent focus:border-indigo-400 focus:bg-white outline-none px-1 py-0.5 rounded transition-all text-gray-600"
                          />
                        </td>
                        <td className="px-4 py-2 text-right">
                          <button
                            onClick={() => removeUser(user.id)}
                            className="p-1 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                            title="Pašalinti šį vartotoją"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          
          {/* Bottom Bar Info */}
          <div className="p-3 px-6 bg-white border-t border-gray-200 flex flex-wrap justify-between items-center gap-3 shrink-0 text-xs text-gray-500">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></span>
                <span className="font-medium text-gray-700">Domenas: @antakalnio.lt</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full"></span>
                <span className="font-medium text-gray-700">Formatas: vardas.pavarde</span>
              </div>
              <div className="hidden sm:flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-amber-500 rounded-full"></span>
                <span className="font-medium text-gray-700">Slaptažodis: {password}</span>
              </div>
            </div>

            <div className="flex items-center gap-1 text-[11px] text-gray-400">
              <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500" />
              <span>Suderinama su Google Admin Console masiniu vartotojų atnaujinimu</span>
            </div>
          </div>

        </section>
      </main>

      {/* Email Notification Modal */}
      <EmailNotificationModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        users={emailModalUsers}
        password={emailModalPassword}
        batchName={emailModalBatchName}
      />

      {/* Creation History Modal */}
      <HistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        history={historyList}
        onLoadBatch={handleLoadBatchFromHistory}
        onDeleteBatch={handleDeleteHistoryBatch}
        onClearHistory={handleClearAllHistory}
        onOpenEmailForBatch={(batch) => {
          setIsHistoryModalOpen(false);
          handleOpenEmailNotification(batch.users, batch.password, batch.name);
        }}
      />

    </div>
  );
}


