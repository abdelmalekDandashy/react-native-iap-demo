/**
 * Internal utility functions for managing global state in the iaptic React Native SDK.
 * These functions provide a controlled way to store and retrieve values in a dedicated
 * global namespace to avoid polluting the global scope.
 */

/**
 * Sets a value in the iaptic global namespace
 * @param key - The key under which to store the value
 * @param value - The value to store
 */
export function globalsSet(key: string, value: any) {
  globalObject()[key] = value;
}

/**
 * Retrieves a value from the iaptic global namespace
 * @param key - The key of the value to retrieve
 * @returns The stored value, or undefined if not found
 */
export function globalsGet(key: string) {
  return globalObject()[key];
}

/**
 * Gets or creates the internal global object used for storing iaptic-specific values
 * @returns The internal global object
 * @internal
 */
function globalObject() {
  const obj = (global as any)['_iaptic_rn_internals'];
  if (!obj) {
    return (global as any)['_iaptic_rn_internals'] = {};
  }
  return obj;
}
