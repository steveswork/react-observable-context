import get from 'lodash.get';
import has from 'lodash.has';
import isEmpty from 'lodash.isempty';

import { DEFAULT_STATE_PATH } from '../../constants';

import Atom from '../atom';
import Accessor from '../accessor';

/** @template {State} T */
class AccessorCache {
	/** @type {{[propertyPaths: string]: Accessor<T>}} */
	#accessors;
	/** @type {{[propertyPath: string]: Atom}} */
	#atoms;

	constructor() {
		this.#accessors = {};
		this.#atoms = {};
	}

	/**
	 * Add new cache entry
	 *
	 * @param {string} cacheKey
	 * @param {Array<string>} propertyPaths
	 * @return {Accessor<T>}
	 */
	#createAccessor( cacheKey, propertyPaths ) {
		const atoms = this.#atoms;
		const accessor = new Accessor( propertyPaths );
		this.#accessors[ cacheKey ] = accessor;
		for( const path of accessor.paths ) {
			if( path in atoms || path === DEFAULT_STATE_PATH ) { continue }
			atoms[ path ] = new Atom();
		}
		return this.#accessors[ cacheKey ];
	}

	/**
	 * Gets state slice from the cache matching the `propertyPaths`.\
	 * If not found, creates a new entry for the client from source, and returns it.
	 *
	 * @param {T} source An object serving from which slices of state are curated and cached
	 * @param {string} clientId
	 * @param {...string} propertyPaths
	 * @return {Readonly<PartialState<T>>}
	 */
	get( source, clientId, ...propertyPaths ) {
		const cacheKey = JSON.stringify( isEmpty( propertyPaths ) ? [ DEFAULT_STATE_PATH ] : propertyPaths );
		const accessor = cacheKey in this.#accessors
			? this.#accessors[ cacheKey ]
			: this.#createAccessor( cacheKey, propertyPaths );
		!accessor.hasClient( clientId ) && accessor.addClient( clientId );
		return accessor.refreshValue( source, this.#atoms );
	}

	/**
	 * Unlinks a consumer from the cache: performing synchronized state cleanup
	 *
	 * @param {string} clientId
	 */
	unlinkClient( clientId ) {
		const accessors = this.#accessors;
		const atoms = this.#atoms;
		for( const k in accessors ) {
			const accessor = accessors[ k ];
			if( !accessor.removeClient( clientId ) || accessor.numClients ) { continue }
			for( const p of accessor.paths ) {
				if( p in atoms && atoms[ p ].disconnect( accessor.id ) < 1 ) {
					delete atoms[ p ];
				}
			}
			delete accessors[ k ];
		}
	}

	/**
	 * Observes the ObservableContext store for state changes to update internal states.
	 *
	 * @param {T} source An object serving from which slices of state are curated and cached
	 * @param {PartialState<T>} newChanges
	 */
	watchSource( source, newChanges ) {
		const accessors = this.#accessors;
		const atoms = this.#atoms;
		for( const path in atoms ) {
			if( !has( newChanges, path ) ) { continue }
			atoms[ path ].value = get( source, path );
			for( const k in accessors ) {
				const accessorPaths = accessors[ k ].paths;
				if( !accessors[ k ].refreshDue || accessorPaths[ 0 ] === DEFAULT_STATE_PATH || accessorPaths.includes( path ) ) {
					accessors[ k ].refreshDue = true;
				}
			}
		}
	}
}

export default AccessorCache;

/** @typedef {import("../../types").State} State */
/**
 * @typedef {import("../../types").PartialState<T>} PartialState
 * @template {State} T
 */
