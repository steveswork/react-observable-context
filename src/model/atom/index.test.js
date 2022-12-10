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
	describe( 'connect(...)', () => {
		test( 'returns number of connections after connecting a new cache entry descriptor', () => {
			let numConnections = atom.connect( 22 );
			expect( atom.connect( 24 ) ).toBe( ++numConnections );
		} );
		test( 'ignores attempts to reconnect a connected cache entry descriptor', () => {
			let numConnections = atom.connect( 20 );
			expect( atom.connect( 28 ) ).toBe( ++numConnections );
			expect( atom.connect( 20 ) ).toBe( numConnections ); // no increase in number of connections
		} );
	} );
	describe( 'disconnect(...)', () => {
		test( 'returns number of remaining connections after removing a connection', () => {
			let numConnections = atom.connect( 22 );
			expect( atom.disconnect( 22 ) ).toBe( --numConnections );
		} );
		test( 'ignores attempts to disconnect a non-connected cache entry descriptor', () => {
			let numConnections = atom.connect( 20 );
			expect( atom.connect( 55 ) ).toBe( ++numConnections );
			expect( atom.disconnect( 20 ) ).toBe( --numConnections );
			expect( atom.disconnect( 20 ) ).toBe( numConnections ); // no decrease in number of connections
		} );
	} );
	describe( 'isConnected(...)', () => {
		test( 'returns `true` for a connected cache entry descriptor', () => {
			atom.connect( 22 );
			expect( atom.isConnected( 22 ) ).toBe( true );
		} );
		test( 'returns `false` a non-connected cache entry descriptor', () => {
			atom.connect( 20 );
			atom.disconnect( 20 );
			expect( atom.isConnected( 20 ) ).toBe( false );
		} );
	} );
});
