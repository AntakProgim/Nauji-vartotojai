import { UserRecord, HistoryBatch } from "../types";

export const ORG_UNITS = [
  "/VAP",
  "/@",
  "/Išvykę",
  "/Mokiniai",
  "/Mokiniai/1 klasių mokiniai",
  "/Mokiniai/1 klasių mokiniai/1k",
  "/Mokiniai/1 klasių mokiniai/1l",
  "/Mokiniai/1 klasių mokiniai/1m",
  "/Mokiniai/1 klasių mokiniai/1n",
  "/Mokiniai/1 klasių mokiniai/1o",
  "/Mokiniai/2 klasių mokiniai",
  "/Mokiniai/3 klasių mokiniai",
  "/Mokiniai/4 klasių mokiniai",
  "/Mokiniai/5 klasių mokiniai",
  "/Mokiniai/6 klasių mokiniai",
  "/Mokiniai/7 klasių mokiniai",
  "/Mokiniai/8 klasių mokiniai",
  "/Išvykę 8 klasių mokiniai",
  "/Pedagogai",
  "/Pedagogai/1-4 klasių mokytojai",
  "/Pedagogai/5-8 klasių mokytojai",
  "/Pedagogai/Bibliotekos darbuotojai",
  "/Pedagogai/Neformalaus ugdymo mokytojai",
  "/Ugdymo pagalba",
  "/Ugdymo pagalba/Mokinio padėjėjai",
  "/Ugdymo pagalba/Ugdymo pagalbos specialistai",
  "/VDM",
  "/Technika",
  "/Technika/Chromebooks",
  "/Technika/68 - informatikos kabinetas",
  "/Technika/Biblioteka",
  "/Technika/Pedagogų",
  "/Technika/Ugdymo aplinka",
  "/IT",
  "/Raštinė ir Personalas",
  "/Vadovai"
];

export function transliterate(str: string): string {
  if (!str) return "";
  const map: Record<string, string> = {
    'ą': 'a', 'č': 'c', 'ę': 'e', 'ė': 'e', 'į': 'i', 'š': 's', 'ų': 'u', 'ū': 'u', 'ž': 'z',
    'Ą': 'a', 'Č': 'c', 'Ę': 'e', 'Ė': 'e', 'Į': 'i', 'Š': 's', 'Ų': 'u', 'Ū': 'u', 'Ž': 'z'
  };
  return str.split('').map(c => map[c] || c).join('').toLowerCase().replace(/[^a-z0-9.-]/g, '');
}

export function generateEmail(firstName: string, lastName: string): string {
  if (!firstName && !lastName) return "";
  
  // Jei yra keli vardai, el. paštui naudoti pirmąjį
  const firstParts = firstName.trim().split(/[\s]+/).filter(Boolean);
  const first = firstParts[0] || "";

  // Jei yra dvi pavardės (pvz. su brūkšneliu "Macevičiūtė-Bartkutė" ar tarpu), naudoti antrąją
  const lastParts = lastName.trim().split(/[- \t]+/).filter(Boolean);
  const last = lastParts.length > 1 ? lastParts[lastParts.length - 1] : (lastParts[0] || "");

  return `${transliterate(first)}.${transliterate(last)}@antakalnio.lt`;
}

function escapeCsvCell(cell: string): string {
  if (!cell) return "";
  if (cell.includes(",") || cell.includes('"') || cell.includes("\n")) {
    return `"${cell.replace(/"/g, '""')}"`;
  }
  return cell;
}

export const CSV_HEADERS = [
  "First Name [Required]", "Last Name [Required]", "Email Address [Required]", 
  "Password [Required]", "Password Hash Function [UPLOAD ONLY]", "Org Unit Path [Required]", 
  "New Primary Email [UPLOAD ONLY]", "Recovery Email", "Home Secondary Email", 
  "Work Secondary Email", "Recovery Phone [MUST BE IN THE E.164 FORMAT]", 
  "Work Phone", "Home Phone", "Mobile Phone", "Work Address", "Home Address", 
  "Employee ID", "Employee Type", "Employee Title", "Manager Email", "Department", 
  "Cost Center", "Building ID", "Floor Name", "Floor Section", 
  "Change Password at Next Sign-In", "New Status [UPLOAD ONLY]", 
  "New Licenses [UPLOAD ONLY]", "Advanced Protection Program enrollment"
];

export function generateEmptyTemplate(): string {
  return "\uFEFF" + CSV_HEADERS.join(",");
}

export function generateCsv(users: UserRecord[], password: string, requireChange: boolean): string {
  const rows = users.map(u => {
    const row = new Array(CSV_HEADERS.length).fill("");
    row[0] = u.firstName;
    row[1] = u.lastName;
    row[2] = u.email;
    row[3] = password;
    row[5] = u.orgUnit;
    row[18] = u.title;
    row[20] = u.department;
    row[25] = requireChange ? "True" : "False";
    return row.map(escapeCsvCell).join(",");
  });

  return "\uFEFF" + [CSV_HEADERS.join(","), ...rows].join("\n");
}

const STORAGE_KEY = "antakalnio_creation_history_v1";

export function getHistory(): HistoryBatch[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

export function saveBatchToHistory(batch: Omit<HistoryBatch, "id" | "createdAt">): HistoryBatch {
  const newBatch: HistoryBatch = {
    ...batch,
    id: crypto.randomUUID(),
    createdAt: new Date().toLocaleString("lt-LT", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }),
  };

  const existing = getHistory();
  const updated = [newBatch, ...existing.slice(0, 49)]; // keep up to 50 batches
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error("Failed to save history", err);
  }
  return newBatch;
}

export function deleteBatchFromHistory(id: string): HistoryBatch[] {
  const existing = getHistory();
  const updated = existing.filter((item) => item.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error("Failed to update history", err);
  }
  return updated;
}

export function clearAllHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error("Failed to clear history", err);
  }
}

export function generateNotificationEmail(
  users: UserRecord[],
  password: string,
  extraNotes?: string
): { subject: string; bodyText: string; bodyHtml: string } {
  const count = users.length;
  const sampleOU = users.length > 0 ? users[0].orgUnit : "";
  const ouClean = sampleOU.replace(/^\//, "").replace(/\//g, " > ");
  
  const subject = `Informacija apie sukurtus naujus el. paštus (${count} vartotojai${ouClean ? ` - ${ouClean}` : ""}) - Antakalnio progimnazija`;

  const usersListText = users
    .map((u, i) => `${i + 1}. ${u.firstName} ${u.lastName} | El. paštas: ${u.email} | Laikinas slaptažodis: ${password} | Padalinys: ${u.orgUnit}`)
    .join("\n");

  const bodyText = `Sveiki,

Informuojame, kad yra sukurti el. paštai.  
Slaptažodžius būtina pasikeisti ir kur nors vaikams bei jų tėvams užsirašyti.
Atnaujinta klasės el. pašto grupė.

${extraNotes ? `Papildoma informacija: ${extraNotes}\n\n` : ""}Naujai sukurtų vartotojų sąrašas (${count}):
${usersListText}

Svarbios nuorodos ir instrukcijos:
• Nuotolinio ugdymo svetainė - https://sites.google.com/antakalnio.lt/nuotolinis/pagalba#h.wqc5u5hdrupj
• El. pašto prisijungimo instrukcija - https://sites.google.com/antakalnio.lt/nuotolinis/ugdymo-it-%C4%AFrankiai/google-pa%C5%A1tas?authuser=0
• Kaip mokiniui jungtis prie el. dienyno mokyklos el. paštu - https://antakalnio.lt/lt/naujienos/svarbu/2023/09/kaip-prisijungti-prie-elektroninio-dienyno-2023-09-09-09-47

Pagarbiai,
Antakalnio progimnazijos IT administratorius`;

  const bodyHtml = `
<p>Sveiki,</p>
<p><strong>Informuojame, kad yra sukurti el. paštai.</strong><br/>
Slaptažodžius būtina pasikeisti ir kur nors vaikams bei jų tėvams užsirašyti.<br/>
Atnaujinta klasės el. pašto grupė.</p>

${extraNotes ? `<p><em>Papildoma informacija: ${extraNotes}</em></p>` : ""}

<p><strong>Naujai sukurtų vartotojų sąrašas (${count}):</strong></p>
<table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse; font-family: sans-serif; font-size: 13px; width: 100%; max-width: 700px;">
  <thead>
    <tr style="background-color: #f3f4f6; text-align: left;">
      <th>#</th>
      <th>Vardas Pavardė</th>
      <th>El. paštas</th>
      <th>Laikinas slaptažodis</th>
      <th>Padalinys</th>
    </tr>
  </thead>
  <tbody>
    ${users
      .map(
        (u, i) => `
    <tr style="background-color: ${i % 2 === 0 ? "#ffffff" : "#f9fafb"};">
      <td>${i + 1}</td>
      <td><strong>${u.firstName} ${u.lastName}</strong></td>
      <td style="color: #4f46e5;">${u.email}</td>
      <td style="font-family: monospace;">${password}</td>
      <td>${u.orgUnit}</td>
    </tr>`
      )
      .join("")}
  </tbody>
</table>

<p style="margin-top: 20px;"><strong>Svarbios nuorodos ir instrukcijos:</strong></p>
<ul>
  <li><a href="https://sites.google.com/antakalnio.lt/nuotolinis/pagalba#h.wqc5u5hdrupj">Nuotolinio ugdymo svetainė</a></li>
  <li><a href="https://sites.google.com/antakalnio.lt/nuotolinis/ugdymo-it-%C4%AFrankiai/google-pa%C5%A1tas?authuser=0">El. pašto prisijungimo instrukcija</a></li>
  <li><a href="https://antakalnio.lt/lt/naujienos/svarbu/2023/09/kaip-prisijungti-prie-elektroninio-dienyno-2023-09-09-09-47">Kaip mokiniui jungtis prie el. dienyno mokyklos el. paštu</a></li>
</ul>

<p>Pagarbiai,<br/>Antakalnio progimnazijos IT administratorius</p>
`;

  return { subject, bodyText, bodyHtml };
}
