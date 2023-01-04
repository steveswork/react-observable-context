import get from 'lodash.get';
import has from 'lodash.has';
import isEmpty from 'lodash.isempty';
import isEqual from 'lodash.isequal';

import { FULL_STATE_SELECTOR } from '../../constants';

import Atom from '../atom';
import Accessor from '../accessor';

/** @template {State} T */
class AccessorCache {
	/** @type {{[propertyPaths: string]: Accessor<T>}} */
	#accessors;
	/** @type {{[propertyPath: string]: Atom<*>}} */
	#atoms;
	/** @type {T} */
	#origin;

	/** @param {T} origin State object reference from which slices stored in this cache are to be curated */
	constructor( origin ) {
		this.#accessors = {};
		this.#atoms = {};
		this.#origin = origin;
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
		const accessor = new Accessor( this.#origin, propertyPaths );
		this.#accessors[ cacheKey ] = accessor;
		for( const path of accessor.paths ) {
			if( !( path in atoms ) ) {
				atoms[ path ] = new Atom( this.#getOriginAt( path ) );
			}
		}
		return this.#accessors[ cacheKey ];
	}

	/**
	 * @param {string} propertyPath
	 * @returns {*}
	 */
	#getOriginAt( propertyPath ) {
		return propertyPath !== FULL_STATE_SELECTOR
			? get( this.#origin, propertyPath )
			: this.#origin
	}

	/**
	 * Gets state slice from the cache matching the `propertyPaths`.\
	 * If not found, creates a new entry for the client from source, and returns it.
	 *
	 * @param {string} clientId
	 * @param {...string} propertyPaths
	 * @return {{[propertyPaths: string]: Readonly<*>}}
	 */
	get( clientId, ...propertyPaths ) {
		if( isEmpty( propertyPaths ) ) { propertyPaths = [ FULL_STATE_SELECTOR ] }
		const cacheKey = JSON.stringify( propertyPaths );
		const accessor = cacheKey in this.#accessors
			? this.#accessors[ cacheKey ]
			: this.#createAccessor( cacheKey, propertyPaths );
		!accessor.hasClient( clientId ) && accessor.addClient( clientId );
		return accessor.refreshValue( this.#atoms );
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
	 * Observes the origin state bearing ObservableContext store for state changes to update accessors.
	 *
	 * @type {Listener<T>}
	 */
	watchSource( originChanges ) {
		const accessors = this.#accessors;
		const atoms = this.#atoms;
		const updatedPaths = [];
		for( const path in atoms ) {
			if( path !== FULL_STATE_SELECTOR && !has( originChanges, path ) ) { continue }
			const newAtomVal = this.#getOriginAt( path )
			if( isEqual( newAtomVal, atoms[ path ].value ) ) { continue }
			atoms[ path ].setValue( newAtomVal );
			updatedPaths.push( path );
		}
		if( !updatedPaths.length ) { return }
		for( const k in accessors ) {
			accessors[ k ].outdatedPaths.push( ...updatedPaths );
		}
	}
}

export default AccessorCache;

/**
 * @typedef {import("../../types").Listener<T>} Listener
 * @template {State} T
 */

/** @typedef {import("../../types").State} State */
