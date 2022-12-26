export default null;

/** @typedef {{[selectorKey: string]: Readonly<*>}} Data */

/**
 * @typedef {{
 * 		getItem: (key: string) => T,
 * 		removeItem: (key: string) => void,
 * 		setItem: (key: string, data: T) => void
 * }} IStorage
 * @template {State} T
 */

/** @typedef {{[K in "getState"|"resetState"|"setState"|"subscribe"]: NonReactUsageReport}} IStore */

/**
 * @typedef {(changes: PartialState<T>) => void} Listener
 * @template {State} T
 */

/** @typedef {() => never} NonReactUsageReport  */

/**
 * @typedef {{[K in keyof T]?: T[K]}} PartialState
 * @template {State} T
 */

/**
 * @typedef {{
 * 		resetState?: (
 * 			resetData: PartialState<T>,
 * 			state: {current: T, original: T}
 * 		) => boolean,
 * 		setState?: (newChanges: PartialState<T>) => boolean
 * }} Prehooks
 * @template {State} T
 */

/** @typedef {{[x:string]: *}} State */

/**
 * @typedef {{[K in "resetState"|"setState"]: Store<T>[K]} & {
 * 		getState: (clientId: string, ...propertyPaths?: string[]) => {[propertyPaths: string]: Readonly<*>},
 *		subscribe: (listener: Listener<T>) => Unsubscribe
 * 		unlinkCache: (clientId: string) => void
 * }} StoreInternal
 * @template {State} T
 */

/**
 * @typedef {{
 *		data: Data,
 *		resetState: (propertyPaths?: string[]) => void,
 *		setState: (changes: PartialState<T>) => void,
 * }} Store
 * @template {State} T
 */

/** @typedef {VoidFunction} Unsubscribe */
