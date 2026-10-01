// Word boundaries include Vietnamese characters; absence is not a positive match.
export function foldText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();
}

export function symptomPolarity(text: string, terms: string[]): boolean | null {
  const value = foldText(text);
  let absent = false;
  for (const term of terms) {
    const escaped = foldText(term).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(`(^|[^a-z0-9])(${escaped})(?=$|[^a-z0-9])`, 'g');
    for (const match of value.matchAll(pattern)) {
      const prefix =
        value
          .slice(0, match.index! + match[1].length)
          .split(/[.,;!?\n]/)
          .pop() || '';
      // Do not treat history, somebody else's symptoms or a question as current findings.
      if (/\b(tien su|truoc day|da het|me toi|bo toi|nguoi nha)\b/.test(prefix)) continue;
      if (/\b(khong|chua|khong co|phu nhan|het)\b(?:\s+[a-z]+){0,3}\s*$/.test(prefix))
        absent = true;
      else return true;
    }
  }
  return absent ? false : null;
}

/** Conservative current-person clauses; do not turn hypothetical examples into findings. */
export function currentNarrativeSentences(text: string): string[] {
  return (text.match(/[^.!?;\n]+[.!?;\n]?/g) || []).filter(
    (sentence) =>
      !sentence.trim().endsWith('?') &&
      !/\b(tien su|truoc day|da het|me toi|bo toi|nguoi nha|neu|gia su|vi du|cau mau)\b/.test(
        foldText(sentence)
      ) &&
      !/\b(co phai|co nghia la|la gi)\b/.test(foldText(sentence))
  );
}

export function hasSuddenSevereHeadache(text: string): boolean {
  return currentNarrativeSentences(text).some(
    (sentence) =>
      symptomPolarity(sentence, [
        'đau đầu đột ngột',
        'đột ngột đau đầu',
        'đau đầu khởi phát đột ngột',
      ]) === true && symptomPolarity(sentence, ['dữ dội', 'búa bổ', 'chưa từng có']) === true
  );
}
