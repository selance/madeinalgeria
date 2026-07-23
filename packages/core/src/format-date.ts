/**
 * Zero-padded D/M/Y for Arabic UI, in Western digits. `Intl`'s `ar-DZ`
 * numeric date formatting inserts U+200F (RLM) marks around each number
 * group (e.g. "14‏/02‏/2026"), which renders as a garbled/broken-looking
 * date — so we build the string manually instead of going through Intl.
 */
export function formatDateAr(value: Date | number | string): string {
  const d = value instanceof Date ? value : new Date(value);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${day}/${month}/${d.getFullYear()}`;
}
