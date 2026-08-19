import "server-only";

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function wrap(value: string, width = 72) {
  const words = value.trim().split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    if (!line || `${line} ${word}`.length <= width) line = line ? `${line} ${word}` : word;
    else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export function renderDemoSubmissionPage(input: {
  studentName: string;
  rollNumber?: string | null;
  assignmentTitle: string;
  subject: string;
  note?: string | null;
  pageNumber: number;
}) {
  const answerLines = wrap(
    input.note ||
      "I completed the required method, checked the important steps and added a short conclusion based on my result.",
  );
  const detailLines = [
    "Working summary:",
    ...answerLines,
    "",
    input.pageNumber === 1
      ? "I have shown the formula or case evidence before the final response."
      : "This page continues the longer working and includes my final verification.",
    "The final answer has been checked against the question requirement.",
  ];
  const text = detailLines
    .map(
      (line, index) =>
        `<text x="108" y="${360 + index * 42}" font-family="Georgia, serif" font-size="24" font-style="italic" fill="#24344b">${escapeXml(line)}</text>`,
    )
    .join("");
  const ruled = Array.from(
    { length: 19 },
    (_, index) =>
      `<line x1="90" y1="${330 + index * 42}" x2="810" y2="${330 + index * 42}" stroke="#c9d9e8" stroke-width="1"/>`,
  ).join("");
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1200" viewBox="0 0 900 1200" role="img" aria-label="Submitted answer page ${input.pageNumber}">
  <rect width="900" height="1200" fill="#fffef9"/>
  <rect x="42" y="42" width="816" height="1116" rx="8" fill="none" stroke="#9fb4c8" stroke-width="2"/>
  <rect x="42" y="42" width="816" height="92" rx="8" fill="#10263f"/>
  <text x="84" y="98" font-family="Arial, sans-serif" font-size="29" font-weight="700" letter-spacing="2" fill="#ffffff">CLASSCONNECT ANSWER SHEET</text>
  <text x="720" y="98" font-family="Arial, sans-serif" font-size="20" font-weight="700" fill="#9fe4dd">PAGE ${input.pageNumber}</text>
  <text x="84" y="182" font-family="Arial, sans-serif" font-size="20" font-weight="700" fill="#10263f">${escapeXml(input.studentName)}</text>
  <text x="84" y="216" font-family="Arial, sans-serif" font-size="16" fill="#566579">Roll ${escapeXml(input.rollNumber || "-")} | ${escapeXml(input.subject)}</text>
  <text x="84" y="266" font-family="Arial, sans-serif" font-size="19" font-weight="700" fill="#11766e">${escapeXml(input.assignmentTitle)}</text>
  <line x1="84" y1="292" x2="816" y2="292" stroke="#11766e" stroke-width="3"/>
  <line x1="82" y1="316" x2="82" y2="1100" stroke="#e78b86" stroke-width="2"/>
  ${ruled}
  ${text}
  <text x="84" y="1124" font-family="Arial, sans-serif" font-size="13" fill="#718095">Protected demo submission - visible only to the learner and authorised teacher.</text>
</svg>`;
}
