import isPlainObject from 'lodash.isplainobject';

/**
 * Converts argument to readonly.
 *
 * Note: Mutates original argument.
 *
 * @param {T} v
 * @returns {Readonly<T>}
 * @template T
 */
export const makeReadonly = v => {
	let frozen = true;
	if( isPlainObject( v ) ) {
		for( const k in v ) { makeReadonly( v[ k ] ) }
		frozen = Object.isFrozen( v );
	} else if( Array.isArray( v ) ) {
		const vLen = v.length;
		for( let i = 0; i < vLen; i++ ) { makeReadonly( v[ i ] ) }
		frozen = Object.isFrozen( v );
	}
	!frozen && Object.freeze( v );
	return v;
};
