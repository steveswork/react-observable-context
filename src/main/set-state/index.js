import clonedeep from 'lodash.clonedeep';
import isEmpty from 'lodash.isempty';
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
 * @param {K} propKey
 * @param {HasObjectRoot<K>} replaced The values replaced by the changes are recorded here
 * @param {HasObjectRoot<K>} changed All new changes applied to the state during this call are recorded here
 * @template {KeyTypes} K
 */
function initDiff( propKey, changed, replaced ) {
	changed[ propKey ] = {};
	replaced[ propKey ] = {};
};

/**
 * Mutates map object - removes map entry at key if empty.
 *
 * @param {HasObjectRoot<K>} map
 * @param {K} key
 * @template {KeyTypes} K
 */
function sanitizeEntryAt( map, key ) {
	if( isEmpty( map[ key ] ) ) {
		delete map[ key ];
	}
}

/**
 * Mutates its arguments
 *
 * @param {HasArrayRoot<K>|HasObjectRoot<K>} state
 * @param {HasArrayRoot<K>|HasObjectRoot<K>} newState
 * @param {HasObjectRoot<K>} replaced The values replaced by the changes are recorded here
 * @param {HasObjectRoot<K>} changed All new changes applied to the state during this call are recorded here
 * @param {K} stateKey
 * @template {KeyTypes} K
 */
function setAtomic( state, newState, changed, replaced, stateKey ) {
	if( isEqual( state[ stateKey ], newState[ stateKey ] ) ) { return }
	const isPlainObjectNewState = isPlainObject( newState[ stateKey ] );
	const isArrayNewState = Array.isArray( newState[ stateKey ] );
	if( Array.isArray( state[ stateKey ] ) ) {
		if( isArrayNewState ) {
			return setArray( state, newState, changed, replaced, stateKey );
		}
		if( isPlainObjectNewState && isIndexBasedObj( newState[ stateKey ] ) ) {
			return setArrayIndex( state, newState, changed, replaced, stateKey );
		}
	}
	if( isPlainObjectNewState && isPlainObject( state[ stateKey ] ) ) {
		return setPlainObject( state, newState, changed, replaced, stateKey )
	}
	if( stateKey in state ) {
		replaced[ stateKey ] = state[ stateKey ];
	}
	state[ stateKey ] = isArrayNewState || isPlainObjectNewState
		? clonedeep( newState[ stateKey ] )
		: newState[ stateKey ];
	changed[ stateKey ] = newState[ stateKey ];
};

/**
 * Mutates its arguments
 *
 * @param {HasArrayRoot<K>} state
 * @param {HasArrayRoot<K>} newState
 * @param {HasObjectRoot<K>} replaced The values replaced by the changes are recorded here
 * @param {HasObjectRoot<K>} changed All new changes applied to the state during this call are recorded here
 * @param {K} rootKey
 * @template {KeyTypes} K
 */
function setArray( state, newState, changed, replaced, rootKey ) {
	initDiff( rootKey, changed, replaced );
	const sLength = state[ rootKey ].length;
	const nsLength = newState[ rootKey ].length;
	if( sLength > nsLength ) { // capture excess state values into `replaced` list prior to state truncation
		for( let i = nsLength; i < sLength; i++ ) {
			replaced[ rootKey ][ i ] = state[ rootKey ][ i ];
		}
	}
	state[ rootKey ].length = nsLength;
	for( let i = 0; i < nsLength; i++ ) {
		setAtomic( state[ rootKey ], newState[ rootKey ], changed[ rootKey ], replaced[ rootKey ], i );
	}
};

/**
 * Mutates its arguments
 *
 * @param {HasArrayRoot<K>} state
 * @param {HasObjectRoot<K>} newState
 * @param {HasObjectRoot<K>} replaced The values replaced by the changes are recorded here
 * @param {HasObjectRoot<K>} changed All new changes applied to the state during this call are recorded here
 * @param {K} rootKey
 * @template {KeyTypes} K
 */
function setArrayIndex( state, newState, changed, replaced, rootKey ) {
	initDiff( rootKey, changed, replaced );
	const incomingIndexes = Object.keys( newState[ rootKey ] ).map( i => +i );
	const maxIncomingIndex = Math.max( ...incomingIndexes );
	if( maxIncomingIndex >= state[ rootKey ].length ) { // capture all newly created state array indexes into `changed` list
		let i = state[ rootKey ].length;
		state[ rootKey ].length = maxIncomingIndex + 1;
		for( const len = state[ rootKey ].length; i < len; i++ ) {
			changed[ rootKey ][ i ] = state[ rootKey ][ i ];
		}
	}
	for( const i of incomingIndexes ) {
		setAtomic( state[ rootKey ], newState[ rootKey ], changed[ rootKey ], replaced[ rootKey ], i );
	}
	sanitizeEntryAt( changed, rootKey );
	sanitizeEntryAt( replaced, rootKey );
};

/**
 * Mutates its arguments
 *
 * @param {HasObjectRoot<K>} state
 * @param {HasObjectRoot<K>} newState
 * @param {HasObjectRoot<K>} changed All new changes applied to the state during this call are recorded here
 * @param {HasObjectRoot<K>} replaced The values replaced by the changes are recorded here
 * @param {K} rootKey
 * @template {KeyTypes} K
 */
function setPlainObject( state, newState, changed, replaced, rootKey ) {
	initDiff( rootKey, changed, replaced );
	set( state[ rootKey ], newState[ rootKey ], changed[ rootKey ], replaced[ rootKey ] );
};

/**
 * Mutates its arguments
 *
 * @param {HasObjectRoot} state
 * @param {HasObjectRoot} newState
 * @param {HasObjectRoot} [changed] All new changes applied to the state during this call are recorded here
 * @param {HasObjectRoot} [replaced] The values replaced by the changes are recorded here
 */
function set( state, newState, changed = {}, replaced = {} ) {
	for( const k in newState ) {
		setAtomic( state, newState, changed, replaced, k );
	}
};

/**
 * @param {T} state
 * @param {PartialState<T>} newState
 * @param {Listener<T>} onStateChange
 * @template {State} T
 */
function setState( state, newState, onStateChange ) {
	/** @type {PartialState<T>} */
	const newChanges = {};
	/** @type {PartialState<T>} */
	const replacedValue = {};
	set( state, newState, newChanges, replacedValue );
	!isEmpty( newChanges ) && onStateChange( newChanges, replacedValue );
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
