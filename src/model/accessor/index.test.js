import Atom from '.';

describe( 'Atom class', () => {
	/** @type {Atom} */
	let atom;
	beforeAll(() => { atom = new Atom() })
	test( 'to creates an atom', () => expect( atom ).toBeInstanceOf( Atom ) );
	describe( 'value property', () => {
		test( 'is empty object by default', () => expect( atom.value ).toEqual({}) );
		test( 'is readonly', () => expect(() => { atom.value.testFlag = true }).toThrow(
			'Cannot add property testFlag, object is not extensible'
		) );
		test( 'converts all assignments to readonly', () => {
			atom.value = { testFlag: true };
			expect(() => { atom.value.testFlag = false }).toThrow(
				"Cannot assign to read only property 'testFlag' of object '#<Object>'"
			);
			atom.value = { a: { b: { c: [ 1, 2, 3, { testFlag: true } ] } } };
			expect(() => { atom.value.a.b.c[ 1 ] = expect.anything() }).toThrow(
				"Cannot assign to read only property '1' of object '[object Array]'"
			);
			expect(() => { atom.value.a.b.c[ 3 ] = expect.anything() }).toThrow(
				"Cannot assign to read only property '3' of object '[object Array]'"
			);
			expect(() => { atom.value.a.b = expect.anything() }).toThrow(
				"Cannot assign to read only property 'b' of object '#<Object>'"
			);
		} );
	});
	describe( 'addClient(...)', () => {
		test( '', () => {
		} );
	} );
	describe( 'hasClient(...)', () => {
		test( '', () => {
		} );
	} );
	describe( 'removeClient(...)', () => {
		test( '', () => {
		} );
	} );
	describe( 'refreshValue(...)', () => {
		test( '', () => {
		} );
	} );
});
