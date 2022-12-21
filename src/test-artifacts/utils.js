import isPlainObject from 'lodash.isplainobject';

export const isReadonly = v => {
	let isReadonly = true;
	const verify = value => {
		if( isPlainObject( value ) ) {
			if( !Object.isFrozen( value ) ) { isReadonly = false } else {
				for( const k in value ) { verify( value[ k ] ) }
			}
		} else if( Array.isArray( value ) ) {
			if( !Object.isFrozen( value ) ) { isReadonly = false } else {
				for( let i = 0, len = value.length; i < len; i++ ) {
					verify( value[ i ] );
				}
			}
		} else if( !Object.isFrozen( value ) ) {
			isReadonly = false;
		}
	}
	verify( v );
	return isReadonly;
};
