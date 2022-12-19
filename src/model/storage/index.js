import clonedeep from 'lodash.clonedeep';

/**
 * @class
 * @template {State} T
 */
class MemoryStorage {
	/** @type {T} */
	#data;

	constructor() { this.#data = null }

	/** @type {IStorage<T>[ "getItem" ]} */
	getItem( key ) { return clonedeep( this.#data ) }

	/** @type {IStorage<T>[ "removeItem" ]} */
	removeItem( key ) { this.#data = null }

	/** @type {IStorage<T>[ "setItem" ]} */
	setItem( key, data ) { this.#data = clonedeep( data ) }
}

/**
 * @extends {IStorage<T>}
 * @template {State} T
 */
class SessionStorage {
	/** @type {IStorage<T>} */
	#storage;

	constructor() { this.#storage = globalThis.sessionStorage }

	/** @type {IStorage<T>[ "getItem" ]} */
	getItem( key ) { return JSON.parse( this.#storage.getItem( key ) ) }

	/** @type {IStorage<T>[ "removeItem" ]} */
	removeItem( key ) { return this.#storage.removeItem( key ) }

	/** @type {IStorage<T>[ "setItem" ]} */
	setItem( key, data ) { return this.#storage.setItem( key, JSON.stringify( data ) ) }
}

/**
 * @extends {IStorage<T>}
 * @template {State} T
 */
class Storage {
	/** @type {IStorage<T>} */
	#storage;

	static supportsSession = typeof globalThis.sessionStorage?.setItem === 'undefined';

	constructor() {
		this.#storage = Storage.supportsSession
			? new SessionStorage()
			: new MemoryStorage()
	}

	get isKeyRequired() { return this.#storage instanceof SessionStorage }

	/** @type {IStorage<T>[ "getItem" ]} */
	getItem( key ) { return this.#storage.getItem( key ) }

	/** @type {IStorage<T>[ "removeItem" ]} */
	removeItem( key ) { this.#storage.removeItem( key ) }

	/** @type {IStorage<T>[ "setItem" ]} */
	setItem( key, data ) { this.#storage.setItem( key, data ) }
}
export default Storage;

/**
 * @typedef {import("../../types").IStorage<T>} IStorage
 * @template {State} T
 */
/** @typedef {import("../../types").State} State */
