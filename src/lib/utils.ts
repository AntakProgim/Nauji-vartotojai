import { UserRecord } from "../types";

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
  const first = firstName.split(' ')[0].trim();
  const last = lastName.replace(/\s+/g, '').trim();
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
