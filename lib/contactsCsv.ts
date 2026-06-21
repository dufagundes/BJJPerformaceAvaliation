export type CsvContactRow = {
  type: "STUDENT" | "PARENT";
  name: string;
  email: string;
  studentName?: string;
};

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];

    if (char === '"') {
      const next = line[i + 1];
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  result.push(current.trim());
  return result;
}

function normalizeType(raw: string): "STUDENT" | "PARENT" | null {
  const value = raw.trim().toLowerCase();
  if (value === "student") {
    return "STUDENT";
  }
  if (value === "parent") {
    return "PARENT";
  }
  return null;
}

export function parseContactsCsv(text: string) {
  const lines = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) {
    return { rows: [] as CsvContactRow[], errors: ["CSV is empty."] };
  }

  const headerCells = parseCsvLine(lines[0]).map((cell) => cell.trim().toLowerCase());
  const typeIndex = headerCells.indexOf("type");
  const nameIndex = headerCells.indexOf("name");
  const emailIndex = headerCells.indexOf("email");
  const studentNameIndex = headerCells.indexOf("student_name");

  if (typeIndex < 0 || nameIndex < 0 || emailIndex < 0) {
    return {
      rows: [] as CsvContactRow[],
      errors: ["CSV must include required columns: type, name, email."],
    };
  }

  const rows: CsvContactRow[] = [];
  const errors: string[] = [];

  for (let i = 1; i < lines.length; i += 1) {
    const cells = parseCsvLine(lines[i]);
    const lineNumber = i + 1;

    const normalizedType = normalizeType(cells[typeIndex] ?? "");
    const name = (cells[nameIndex] ?? "").trim();
    const email = (cells[emailIndex] ?? "").trim().toLowerCase();
    const studentName = studentNameIndex >= 0 ? (cells[studentNameIndex] ?? "").trim() : "";

    if (!normalizedType) {
      errors.push(`Line ${lineNumber}: type must be Student or Parent.`);
      continue;
    }

    if (!name) {
      errors.push(`Line ${lineNumber}: name is required.`);
      continue;
    }

    if (!email) {
      errors.push(`Line ${lineNumber}: email is required.`);
      continue;
    }

    if (normalizedType === "PARENT" && !studentName) {
      errors.push(`Line ${lineNumber}: student_name is required for Parent rows.`);
      continue;
    }

    rows.push({
      type: normalizedType,
      name,
      email,
      studentName: normalizedType === "PARENT" ? studentName : undefined,
    });
  }

  return { rows, errors };
}

export const contactsCsvTemplate = `type,name,email,student_name\nStudent,Jane Student,jane.student@example.com,\nParent,John Parent,john.parent@example.com,Tommy Parent`;
