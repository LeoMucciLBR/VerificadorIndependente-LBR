/**
 * Serializa objetos com BigInt para JSON.
 * Necessário pois JSON.stringify não suporta BigInt nativamente.
 */
export function serialize<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj, (_key, value) =>
    typeof value === 'bigint' ? value.toString() : value
  ));
}
