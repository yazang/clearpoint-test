export function removeStringQuotes(str: string) {
  return str.replace(/['"]+/g, '');
}