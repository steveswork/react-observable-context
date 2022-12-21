/** @template {State} T */
class Accessor {
	static #NUM_INSTANCES = 0;
	/** @type {Set<string>} */
	#clients;
	/** @type {number} */
	#id;
	/** @type {Array<string>} */
	#paths;
	/** @type {T} */
	#source;
	/** @type {{[propertyPath: string]: Readonly<*>}} */
	#value;

	/**
	 * @param {T} source State object reference from which the accessedPropertyPaths are to be selected.
	 * @param {Array<string>} accessedPropertyPaths
	 */
	constructor( source, accessedPropertyPaths ) {
		this.#clients = new Set();
		this.#id = ++Accessor.#NUM_INSTANCES;
		this.#paths = Array.from( new Set( accessedPropertyPaths ) );
		/** @type {boolean} */
		this.refreshDue = true;
		this.#source = source;
		this.#value = {};
	}

	get numClients() { return this.#clients.size }

	get id() { return this.#id }

	get paths() { return this.#paths }

	get value() { return this.#value }

	/** @param {string} clientId */
	addClient( clientId ) { this.#clients.add( clientId ) }

	/** @type {(clientId: string) => boolean} */
	hasClient( clientId ) { return this.#clients.has( clientId ) }

	/** @type {(clientId: string) => boolean} */
	removeClient( clientId ) { return this.#clients.delete( clientId ) }

	/**
	 * @param {{[propertyPath: string]: Atom<*>}} atoms Curated slices of state currently requested
	 * @returns {{[propertyPath: string]: Readonly<*>}}
	 */
	refreshValue( atoms ) {
		if( !this.refreshDue ) { return this.#value }
		this.refreshDue = false;
		for( const p of this.#paths ) {
			if( !( p in atoms ) ) { continue }
			const atom = atoms[ p ];
			!atom.isConnected( this.#id ) &&
			atom.connect( this.#id );
			this.#value[ p ] = atom.value;
		}
		return this.#value;
	}
}

export default Accessor;

/** @typedef {import("../../types").State} State */

/**
 * @typedef {import("../atom").default<T>} Atom
 * @template T
 */
