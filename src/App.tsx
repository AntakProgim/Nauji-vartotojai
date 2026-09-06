import { useState } from 'react';
import { Download, Users, Settings, FileSpreadsheet, Plus, Trash2 } from 'lucide-react';
import { UserRecord } from './types';
import { ORG_UNITS, generateCsv, generateEmail } from './lib/utils';

export default function App() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [pasteText, setPasteText] = useState('');
  
  const [password, setPassword] = useState('progimnazija');
  const [requirePasswordChange, setRequirePasswordChange] = useState(true);
  const [defaultOrgUnit, setDefaultOrgUnit] = useState('/Mokiniai');
  const [defaultTitle, setDefaultTitle] = useState('');
  const [defaultDepartment, setDefaultDepartment] = useState('');

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

  const downloadCsv = () => {
    if (users.length === 0) return;
    const csvStr = generateCsv(users, password, requirePasswordChange);
    const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'google_admin_users.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="h-screen w-full flex flex-col font-sans text-gray-800 bg-gray-50 overflow-hidden">
      <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded flex items-center justify-center text-white font-bold text-xl">A</div>
          <div>
            <h1 className="text-lg font-bold leading-tight">Antakalnio Progimnazija</h1>
            <p className="text-xs text-gray-500 uppercase tracking-wider">Gmail Paskyrų Generatorius</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end">
            <span className="text-xs font-semibold text-gray-400">STATUSAS</span>
            <span className="text-xs font-medium text-green-600 flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span> Pasiruošęs eksportui
            </span>
          </div>
          <button
            onClick={downloadCsv}
            disabled={users.length === 0}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Generuoti CSV
          </button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        <aside className="w-80 bg-white border-r border-gray-200 flex flex-col p-4 shrink-0 overflow-y-auto">
          
          <div className="mb-6">
            <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">1. VARTOTOJŲ SĄRAŠAS (ĮKLIJUOTI)</label>
            <textarea
              value={pasteText}
              onChange={e => setPasteText(e.target.value)}
              placeholder="Vardas Pavardė..."
              className="w-full h-32 p-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
            />
            <p className="mt-1 text-[10px] text-gray-400 italic mb-2">Iš Excel (Klasė, Vardas, Pavardė) arba tekstas</p>
            <button
              onClick={handlePasteData}
              disabled={!pasteText.trim()}
              className="w-full bg-indigo-50 text-indigo-700 hover:bg-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed py-2 rounded text-sm font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Pridėti vartotojus
            </button>
          </div>

          <div className="mb-6">
            <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">2. NUMATYTAS PADALINYS (OU)</label>
            <select
              value={defaultOrgUnit}
              onChange={e => setDefaultOrgUnit(e.target.value)}
              className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              {ORG_UNITS.map(ou => (
                <option key={ou} value={ou}>{ou}</option>
              ))}
            </select>
          </div>

          <div className="mb-6">
            <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">3. SLAPTAŽODŽIO ŠABLONAS</label>
            <input
              type="text"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none"
            />
            <div className="mt-2 flex items-center gap-2">
              <input
                type="checkbox"
                id="force-reset"
                checked={requirePasswordChange}
                onChange={e => setRequirePasswordChange(e.target.checked)}
                className="accent-indigo-600"
              />
              <label htmlFor="force-reset" className="text-xs text-gray-600 cursor-pointer">Privalomas keitimas (Next Sign-In)</label>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">4. PAPILDOMA INFORMACIJA</label>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <div>
                 <input
                  type="text"
                  value={defaultTitle}
                  onChange={e => setDefaultTitle(e.target.value)}
                  placeholder="Pareigos (Title)"
                  className="w-full p-2 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <input
                  type="text"
                  value={defaultDepartment}
                  onChange={e => setDefaultDepartment(e.target.value)}
                  placeholder="Padalinys (Dep.)"
                  className="w-full p-2 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>
          </div>

          <div className="mt-auto p-3 bg-indigo-50 rounded-lg shrink-0">
            <p className="text-xs leading-relaxed text-indigo-800">
              <strong className="block mb-1">Informacija:</strong> Vardai bus automatiškai konvertuojami į lotyniškus simbolius (š -&gt; s, ė -&gt; e).
            </p>
          </div>
        </aside>
        
        <section className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-white flex justify-between items-center shrink-0">
            <h2 className="text-sm font-bold text-gray-700 uppercase">Peržiūra (Preview)</h2>
            <span className="text-xs text-gray-500">Iš viso: {users.length} vartotojų</span>
          </div>
          
          <div className="flex-1 overflow-auto p-4">
            {users.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400">
                <Users className="w-12 h-12 mb-3 opacity-20" />
                <p className="text-sm">Vartotojų sąrašas tuščias.</p>
                <p className="text-xs mt-1">Įklijuokite duomenis kairėje pusėje ir paspauskite "Pridėti vartotojus".</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse bg-white shadow-sm rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-gray-100 text-[11px] font-bold text-gray-500 uppercase border-b border-gray-200">
                    <th className="px-4 py-3">Vardas Pavardė</th>
                    <th className="px-4 py-3">Gmail Adresas</th>
                    <th className="px-4 py-3">Padalinys</th>
                    <th className="px-4 py-3">Pareigos</th>
                    <th className="px-4 py-3 text-right">Veiksmai</th>
                  </tr>
                </thead>
                <tbody className="text-sm text-gray-700">
                  {users.map((user, index) => (
                    <tr key={user.id} className={`border-b border-gray-100 ${index % 2 !== 0 ? 'bg-gray-50/30' : ''}`}>
                      <td className="px-4 py-3 font-medium flex gap-2">
                        <input
                          type="text"
                          value={user.firstName}
                          onChange={(e) => updateUser(user.id, 'firstName', e.target.value)}
                          className="w-full bg-transparent border-b border-transparent focus:border-indigo-300 outline-none"
                        />
                        <input
                          type="text"
                          value={user.lastName}
                          onChange={(e) => updateUser(user.id, 'lastName', e.target.value)}
                          className="w-full bg-transparent border-b border-transparent focus:border-indigo-300 outline-none"
                        />
                      </td>
                      <td className="px-4 py-3 text-indigo-600">
                        <input
                          type="text"
                          value={user.email}
                          onChange={(e) => updateUser(user.id, 'email', e.target.value)}
                          className="w-full min-w-[200px] bg-transparent border-b border-transparent focus:border-indigo-300 outline-none"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={user.orgUnit}
                          onChange={(e) => updateUser(user.id, 'orgUnit', e.target.value)}
                          className="w-full min-w-[150px] bg-transparent border-b border-transparent focus:border-indigo-300 outline-none"
                        >
                          {ORG_UNITS.map(ou => (
                            <option key={ou} value={ou}>{ou}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={user.title}
                          placeholder="-"
                          onChange={(e) => updateUser(user.id, 'title', e.target.value)}
                          className="w-full bg-transparent border-b border-transparent focus:border-indigo-300 outline-none"
                        />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => removeUser(user.id)}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                          title="Pašalinti"
                        >
                          <Trash2 className="w-4 h-4 inline-block" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          
          <div className="p-4 bg-white border-t border-gray-200 flex justify-between items-center shrink-0">
            <div className="flex gap-8">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
                <span className="text-xs text-gray-600 font-medium">Domenas: antakalnio.lt</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-purple-500 rounded-full"></span>
                <span className="text-xs text-gray-600 font-medium">Metodas: vardas.pavarde</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> 
              CSV formatas pritaikytas Google Admin Console importui.
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

