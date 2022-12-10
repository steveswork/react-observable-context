import clonedeep from 'lodash.clonedeep';
import get from 'lodash.get';
import isEqual from 'lodash.isequal';
import isPlainObject from 'lodash.isplainobject';
import pick from 'lodash.pick';
import set from 'lodash.set';

import { DEFAULT_STATE_PATH } from '../../constants';
import { makeReadonly } from '../../utils';

/** @type {(ancestorPath?: string) => {contains: (path: string) => boolean}} */
const getPathTesterIn = (() => {
	const PATH_DELIMITERS = { '.': null, '[': null };
	return ( ancestorPath = '' ) => {
		const ancestorPathLength = ancestorPath?.length || 0;
		return {
			contains: path =>
				ancestorPathLength &&
				path.startsWith( ancestorPath ) && (
					ancestorPathLength === path.length ||
					path[ ancestorPathLength ] in PATH_DELIMITERS
				)
		};
	};
})();

/**
 * Merges `changes` into a `slice` of the state object.
 *
 * Advisory: Will undo the readonly xteristics of affected hierarchies within the `slice`.
 */
const mergeChanges = (() => {
	const matchCompositeType = ( slice, changes ) => {
		if( Array.isArray( slice ) && Array.isArray( changes ) ) { return Array }
		if( isPlainObject( slice ) && isPlainObject( changes ) ) { return Object }
	};
	const doMergeAt = ( key, slice, changes ) => {
		if( Object.isFrozen( changes[ key ] ) ) { slice[ key ] = changes[ key ]; return }
		if( Object.isFrozen( slice[ key ] ) ) { slice[ key ] = { ...slice[ key ] } }
		switch( matchCompositeType( slice[ key ], changes[ key ] ) ) {
			case Object: mergeChanges( slice[ key ], changes[ key ] ); break;
			case Array:
				slice[ key ].length = changes[ key ].length;
				mergeChanges( slice[ key ], changes[ key ] );
				break;
			default: slice[ key ] = changes[ key ];
		}
	};
	/**
	 * @param {PartialState<State>|Readonly<PartialState<State>} slice
	 * @param {PartialState<State>} changes
	 */
	const mergeChanges = ( slice, changes ) => {
		if( isPlainObject( changes ) ) { // `changes`, at the start of the recursion, is a plainobject
			for( const k in changes ) { doMergeAt( k, slice, changes ) }
		} else if( Array.isArray( changes ) ) {
			changes.forEach(( _, c ) => doMergeAt( c, slice, changes ));
		} else {
			slice = changes;
		}
	};
	return mergeChanges;
})();

/** @template {State} T */
class Accessor {
	static #NUM_INSTANCES = 0;
	/** @type {Set<string>} */
	#clients;
	/** @type {number} */
	#id;
	/** @type {Array<string>} */
	#paths;
	/** @type {Readonly<PartialState<T>>} */
	#value;

	/** @type {(paths: Array<string>) => Array<string>} */
	static #arrangePaths( paths ) {
		if( !Array.isArray( paths ) || !paths.length ) { paths = [ DEFAULT_STATE_PATH ] }
		if( paths.includes( DEFAULT_STATE_PATH ) ) { return [ DEFAULT_STATE_PATH ] }
		/** @type {Array<string>} */
		const arranged = [];
		let group = getPathTesterIn();
		for( const path of clonedeep( paths ).sort() ) {
			if( group.contains( path ) ) { continue }
			group = getPathTesterIn( path );
			arranged.push( path );
		}
		return arranged;
	}

	/** @param {Array<string>} accessedPropertyPaths */
	constructor( accessedPropertyPaths ) {
		this.#clients = new Set();
		this.#id = ++Accessor.#NUM_INSTANCES;
		this.#paths = Accessor.#arrangePaths( accessedPropertyPaths );
		/** @type {boolean} */
		this.refreshDue = true;
		this.#value = makeReadonly({});
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
	removeClient( clientId ) { this.#clients.delete( clientId ) }

	/**
	 * @param {T} source An object serving as the state object for resolving `DEFAULT_STATE_PATH` slice changes
	 * @param {{[propertyPath: string]: Atom}} atoms Curated slices of state currently requested
	 * @returns {Readonly<PartialState<State>>}
	 */
	refreshValue( source, atoms ) {
		if( !this.refreshDue ) { return this.#value }
		this.refreshDue = false;
		const value = { ...this.#value };
		if( this.#paths[ 0 ] === DEFAULT_STATE_PATH ) {
			for( const k in source ) {
				if( !isEqual( value[ k ], source[ k ] ) ) {
					value[ k ] = clonedeep( source[ k ] );
				}
			}
		} else {
			/** @type {PartialState<State>} */
			let update = {};
			for( const p of this.#paths ) {
				const atom = atoms[ p ];
				!atom.isConnected( this.#id ) &&
				atom.connect( this.#id );
				if( isEqual( get( value, p ), atom.value ) ) { continue }
				if( Object.keys( update ).some( k => getPathTesterIn( k ).contains( p ) ) ) {
					set( update, p, atom.value );
					continue;
				}
				const slice = clonedeep( pick( source, p ) ); // need to maintain exact state property nomenclature
				set( slice, p, atom.value );
				update = { ...update, ...slice };
			}
			mergeChanges( value, update );
		}
		this.#value = makeReadonly( value );
		return this.#value;
	}
}

export default Accessor;

/** @typedef {import("../../types").State} State */
/**
 * @typedef {import("../../types").PartialState<T>} PartialState
 * @template {State} T
 */
/** @typedef {import("../atom").default} Atom */
