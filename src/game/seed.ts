/**
 * Semilla diaria (base del desafío diario, doc 06): el mismo día UTC produce
 * la misma semilla en cualquier dispositivo y zona horaria.
 */
export function dailySeed(date = new Date()): number {
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth() + 1;
  const d = date.getUTCDate();
  return y * 10_000 + m * 100 + d;
}
