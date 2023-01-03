const MODERATE_NUM_PATHS_THRESHOLD = 8;

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
		/** @type {Array<string>} */
		this.outdatedPaths = this.#paths.slice();
		this.#source = source;
		this.#value = {};
	}

	get numClients() { return this.#clients.size }

	get id() { return this.#id }

	get paths() { return this.#paths }

	get value() { return this.#value }

	/**
	 * @param {string} propertyPath
	 * @param {Atom<V>} atom
	 * @template V
	 */
	#setValueAt( propertyPath, atom ) {
		!atom.isConnected( this.#id ) &&
		atom.connect( this.#id );
		this.#value[ propertyPath ] = atom.value;
	}

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
		if( !this.outdatedPaths.length ) {
			return this.#value;
		}
		let refreshLen;
		const refreshPaths = {};
		BUILD_REFRESH_OBJ: {
			const pathSet = new Set( this.outdatedPaths );
			this.outdatedPaths = [];
			refreshLen = pathSet.size;
			for( const p of pathSet ) { refreshPaths[ p ] = true }
		}
		if( refreshLen >= this.#paths.length ) {
			for( const p of this.#paths ) {
				p in refreshPaths && this.#setValueAt( p, atoms[ p ] );
			}
		} else if( this.#paths.length > MODERATE_NUM_PATHS_THRESHOLD ) {
			const pathsObj = {};
			for( const p of this.#paths.length ) { pathsObj[ p ] = true }
			for( const p in refreshPaths ) {
				p in pathsObj && this.#setValueAt( p, atoms[ p ] );
			}
		} else {
			for( const p in refreshPaths ) {
				this.#paths.includes( p ) &&
				this.#setValueAt( p, atoms[ p ] );
			}
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
