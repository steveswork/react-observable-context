export default null;

/**
 * @typedef {(state: PartialState<T>) => void} Listener
 * @template {State} T
 */

/**
 * @typedef {{[K in keyof T]?: T[K]}} PartialState
 * @template {State} T
 */

/** @typedef {{[x:string]: *}} State */
