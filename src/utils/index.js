import get from 'lodash.get';
import has from 'lodash.has';
import isPlainObject from 'lodash.isplainobject';
import set from 'lodash.set';

class None {};
export const none = new None();

/**
 * Curates the most inclusive propertyPaths from a list of property paths.
 * @example
 * arrangePropertyPaths(["a.b.c.d", "a.b", "a.b.z[4].w", "s.t"]) => ["a.b", "s.t"].
 * "a.b" is inclusive of "a.b.c.d": "a.b.c.d" is a subset of "a.b." but not vice versa.
 *
 * @param {Array<string>} propertyPaths
 * @returns {Array<string>}
 */
export function arrangePropertyPaths( propertyPaths ) {
	/** @type {{[propertyPath: string]: Array<string>}} */
	const superPathTokensMap = {};
	for( const path of propertyPaths ) {
		const pathTokens = path
			.replace( /\[([0-9]+)\]/g, '.$1' )
			.replace( /^\./, '' )
			.split( /\./ );
		L2: {
			const replacedSuperPaths = [];
			for( const superPath in superPathTokensMap ) {
				const superPathTokens = superPathTokensMap[ superPath ];
				// self/subset check
				if( superPathTokens.length <= pathTokens.length ) {
					if( superPathTokens.every(( p, i ) => p === pathTokens[ i ]) ) {
						break L2;
					}
				} else {
					// superset check
					pathTokens.every(( p, i ) => p === superPathTokens[ i ]) &&
					replacedSuperPaths.push( superPath );
				}
			}
			superPathTokensMap[ path ] = pathTokens;
			for( const path of replacedSuperPaths ) {
				delete superPathTokensMap[ path ];
			}
		}
	}
	return Object.keys( superPathTokensMap );
};

/**
 * Converts argument to readonly.
 *
 * Note: Mutates original argument.
 *
 * @param {T} v
 * @returns {Readonly<T>}
 * @template T
 */
export function makeReadonly( v ) {
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

/**
 * Pulls propertyPath values from state and compiles them into a partial state object
 *
 * @param {T} source
 * @param {Array<string>} propertyPaths
 * @returns {{[K in keyof T]?:*}}
 * @template {{[x: string]:*}} T
 */
export function mapPathsToObject( source, propertyPaths ) {
	const object = {};
	for( const path of arrangePropertyPaths( propertyPaths ) ) {
		const value = get( source, path );
		if( typeof value === 'undefined' && !has( source, path ) ) { continue }
		let parent = object;
		for( let tokens = path.split( '.' ), tLen = tokens.length, t = 0; t < tLen; t++ ) {
			if( !tokens[ t ].endsWith( ']' ) ) {
				if( t + 1 === tLen ) {
					parent[ tokens[ t ] ] = value;
				} else if( !( tokens[ t ] in parent ) ) {
					parent[ tokens[ t ] ] = {};
				}
				parent = parent[ tokens[ t ] ];
				continue;
			}
			const arrayMatch = tokens[ t ].match( /^([^\[]+)((?:\[[0-9]+\])+)$/ );
			const indexMatches = arrayMatch[ 2 ]
				.replace( /^\[/, '' )
				.replace( /\]$/, '' )
				.split( '][' );
			const exArray = arrayMatch[ 1 ] in parent ? parent[ arrayMatch[ 1 ] ] : none;
			parent[ arrayMatch[ 1 ] ] = new Array( +indexMatches[ 0 ] );
			parent = parent[ arrayMatch[ 1 ] ];
			const currArray = parent;
			for( let iLen = indexMatches.length, i = 0; i < iLen; i++ ) {
				const stateIndex = +indexMatches[ i ];
				parent[ stateIndex ] = i + 1 === iLen ? value : new Array( +indexMatches[ i + 1 ] );
				parent = parent[ stateIndex ];
			}
			if( exArray instanceof None ) { continue }
			( function mergeIndexedObj( source, parentPropertyPath = '' ) {
				if( isPlainObject( source ) ) {
					for( const k in source ) {
						mergeIndexedObj( source[ k ], `${ parentPropertyPath }${ k }.` );
					}
					return;
				}
				if( Array.isArray( source ) ) {
					for( let sLen = source.length, s = 0; s < sLen; s++ ) {
						mergeIndexedObj( source[ s ], `${ parentPropertyPath }${ s }.` );
					}
					return;
				}
				set( currArray, parentPropertyPath.replace( /\.+$/, '' ), source );
			} )( exArray );
		}
	}
	return object;
};
