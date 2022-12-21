import clonedeep from 'lodash.clonedeep';

import { makeReadonly } from '../../utils';

/** An atom represents an entry for each individual property path of the state still in use by client components */
/** @template T */
class Atom {
	/** @type {Set<number>} */
	#connections;
	/** @type {Readonly<T>} */
	#value;

	constructor( value = null ) {
		this.#connections = new Set();
		this.setValue( value );
	}

	get value() { return this.#value }

	/**
	 * @param {number} accessorId
	 * @returns {number} Number of connections remaining
	 */
	connect( accessorId ) {
		this.#connections.add( accessorId );
		return this.#connections.size;
	}

	/**
	 * @param {number} accessorId
	 * @returns {number} Number of connections remaining
	 */
	disconnect( accessorId ) {
		this.#connections.delete( accessorId );
		return this.#connections.size;
	}

	/** @param {number} accessorId */
	isConnected( accessorId ) { return this.#connections.has( accessorId ) }

	/** @param {T|Readonly<T>} newValue */
	setValue( newValue ) { this.#value = makeReadonly( clonedeep( newValue ) ) }
}

export default Atom;
