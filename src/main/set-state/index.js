import clonedeep from 'lodash.clonedeep';
import isEqual from 'lodash.isequal';
import isPlainObject from 'lodash.isplainobject';

/** @param {{[x:string]: any}} obj */
const isIndexBasedObj = obj => Object.keys( obj ).every( k => {
	const i = +k;
	return Number.isInteger( i ) && i > -1
} );

/**
 * Mutates its arguments
 *
 * @param {HasArrayRoot<K>|HasObjectRoot<K>} state
 * @param {HasArrayRoot<K>|HasObjectRoot<K>} newState
 * @param {K} stateKey
 * @param {Stats} stats
 * @template {KeyTypes} K
 */
function setAtomic( state, newState, stateKey, stats ) {
	if( isEqual( state[ stateKey ], newState[ stateKey ] ) ) { return }
	const isPlainObjectNewState = isPlainObject( newState[ stateKey ] );
	const isArrayNewState = Array.isArray( newState[ stateKey ] );
	if( Array.isArray( state[ stateKey ] ) ) {
		if( isArrayNewState ) {
			return setArray( state, newState, stateKey, stats );
		}
		if( isPlainObjectNewState && isIndexBasedObj( newState[ stateKey ] ) ) {
			return setArrayIndex( state, newState, stateKey, stats );
		}
	}
	if( isPlainObjectNewState && isPlainObject( state[ stateKey ] ) ) {
		return setPlainObject( state, newState, stateKey, stats )
	}
	stats.hasChanges = true;
	state[ stateKey ] = isArrayNewState || isPlainObjectNewState
		? clonedeep( newState[ stateKey ] )
		: newState[ stateKey ];
};

/**
 * Mutates its arguments
 *
 * @param {HasArrayRoot<K>} state
 * @param {HasArrayRoot<K>} newState
 * @param {K} rootKey
 * @param {Stats} stats
 * @template {KeyTypes} K
 */
function setArray( state, newState, rootKey, stats ) {
	const nsLength = newState[ rootKey ].length;
	if( state[ rootKey ].length !== nsLength ) {
		state[ rootKey ].length = nsLength;
		stats.hasChanges = true;
	}
	for( let i = 0; i < nsLength; i++ ) {
		setAtomic( state[ rootKey ], newState[ rootKey ], i, stats );
	}
};

/**
 * Mutates its arguments
 *
 * @param {HasArrayRoot<K>} state
 * @param {HasObjectRoot<K>} newState
 * @param {K} rootKey
 * @param {Stats} stats
 * @template {KeyTypes} K
 */
function setArrayIndex( state, newState, rootKey, stats ) {
	const incomingIndexes = Object.keys( newState[ rootKey ] ).map( i => +i );
	const maxIncomingIndex = Math.max( ...incomingIndexes );
	if( maxIncomingIndex >= state[ rootKey ].length ) { // capture all newly created state array indexes into `changed` list
		state[ rootKey ].length = maxIncomingIndex + 1;
		stats.hasChanges = true;
	}
	for( const i of incomingIndexes ) {
		setAtomic( state[ rootKey ], newState[ rootKey ], i, stats );
	}
};

/**
 * Mutates its arguments
 *
 * @param {HasObjectRoot<K>} state
 * @param {HasObjectRoot<K>} newState
 * @param {K} rootKey
 * @param {Stats} stats
 * @template {KeyTypes} K
 */
function setPlainObject( state, newState, rootKey, stats ) {
	set( state[ rootKey ], newState[ rootKey ], stats );
};

/**
 * Mutates its arguments
 *
 * @param {HasObjectRoot} state
 * @param {HasObjectRoot} newState
 * @param {Stats} stats
 */
function set( state, newState, stats ) {
	for( const k in newState ) {
		setAtomic( state, newState, k, stats );
	}
};

/**
 * @param {T} state
 * @param {PartialState<T>} newState
 * @param {Listener<T>} [onStateChange]
 * @template {State} T
 */
function setState( state, newState, onStateChange ) {
	const stats = { hasChanges: false };
	set( state, newState, stats );
	stats.hasChanges && onStateChange?.( state );
};

export default setState;

/**
 * @typedef {HasRoot<K, Array<*>>} HasArrayRoot
 * @template {KeyTypes} [K=string]
 */

/**
 * @typedef {HasRoot<K, {[x: string]: *}>} HasObjectRoot
 * @template {KeyTypes} [K=string]
 */

/**
 * @typedef  {K extends number
 * 		? {[rootKey: number]: T} | [T]
 * 		: K extends string
 * 		? {[rootKey: string]: T}
 * 		: {[rootKey: symbol]: T}
 * } HasRoot
 * @template {KeyTypes} [K=string]
 * @template T
 */

/** @typedef {number|string|symbol} KeyTypes */

/**
 * @typedef {import("../../types").Listener<T>} Listener
 * @template {State} T
 */

/**
 * @typedef {import("../../types").PartialState<T>} PartialState
 * @template {State} T
 */

/** @typedef {import("../../types").State} State */

/** @typedef {{hasChanges: boolean}} Stats */
