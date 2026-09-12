// Parses the plain-text bulk import format:
//
// Q: What is the capital of Pakistan?
// A: Karachi
// B: Lahore
// C: Islamabad
// D: Peshawar
// ANSWER: C
// MARKS: 1
//
// Blocks are separated by a line starting with "Q:". Returns parsed
// questions plus any validation errors so the UI can show a preview
// before anything is saved.

export function parseBulkQuestions(raw) {
  const lines = raw.split(/\r?\n/);
  const blocks = [];
  let current = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (/^Q\s*:/i.test(trimmed)) {
      if (current) blocks.push(current);
      current = { question_text: trimmed.replace(/^Q\s*:/i, '').trim(), options: {}, answer: null, marks: null };
    } else if (current && /^[ABCD]\s*:/i.test(trimmed)) {
      const label = trimmed[0].toUpperCase();
      current.options[label] = trimmed.replace(/^[ABCD]\s*:/i, '').trim();
    } else if (current && /^ANSWER\s*:/i.test(trimmed)) {
      current.answer = trimmed.replace(/^ANSWER\s*:/i, '').trim().toUpperCase();
    } else if (current && /^MARKS\s*:/i.test(trimmed)) {
      current.marks = trimmed.replace(/^MARKS\s*:/i, '').trim();
    }
  }
  if (current) blocks.push(current);

  const results = blocks.map((b, idx) => {
    const errors = [];
    if (!b.question_text) errors.push('Missing question text.');
    ['A', 'B', 'C', 'D'].forEach((label) => {
      if (!b.options[label]) errors.push(`Missing option ${label}.`);
    });
    if (!b.answer || !['A', 'B', 'C', 'D'].includes(b.answer)) {
      errors.push('Missing or invalid ANSWER (must be A, B, C or D).');
    }
    const marksNum = b.marks ? Number(b.marks) : 1;
    if (Number.isNaN(marksNum) || marksNum <= 0) {
      errors.push('MARKS must be a positive number.');
    }

    return {
      index: idx + 1,
      question_text: b.question_text,
      options: b.options,
      answer: b.answer,
      marks: Number.isNaN(marksNum) ? 1 : marksNum,
      errors,
      valid: errors.length === 0,
    };
  });

  return results;
}

export function toImportPayload(parsedQuestions) {
  return parsedQuestions
    .filter((q) => q.valid)
    .map((q) => ({
      question_text: q.question_text,
      marks: q.marks,
      options: ['A', 'B', 'C', 'D'].map((label) => ({
        label,
        text: q.options[label],
        is_correct: label === q.answer,
      })),
    }));
}
