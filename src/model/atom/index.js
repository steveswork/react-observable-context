import clonedeep from 'lodash.clonedeep';

import { makeReadonly } from '../../utils';

/** An atom represents an entry for each individual property path of the state still in use by client components */
class Atom {
	/** @type {Set<number>} */
	#connections;
	/** @type {Readonly<Value>} */
	#value;

	constructor() {
		this.#connections = new Set();
		this.#value = makeReadonly({});
	}

	/** @returns {Readonly<Value>} */
	get value() { return this.#value }

	/** @param {Value} newValue */
	set value( newValue ) { this.#value = makeReadonly( clonedeep( newValue ) ) }

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
}

export default Atom;

/** @typedef {{[x:string]: *}} Value */
