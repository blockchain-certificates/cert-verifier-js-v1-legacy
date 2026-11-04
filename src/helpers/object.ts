export function deepCopy<T = any> (obj: T): T {
  return structuredClone(obj);
}

export function isObject (candidate: any): boolean {
  return candidate === Object(candidate);
}
