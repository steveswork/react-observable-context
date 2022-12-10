import * as utils from '.';

describe( 'utils module', () => {
	describe( 'makeReadonly(...)', () => {
		const TEST_DATA = { a: { b: { c: [ 1, 2, 3, { testFlag: true } ] } } };
		beforeAll(() => utils.makeReadonly( TEST_DATA ));
		test( 'converts composite data to readonly', () => {
			expect(() => { TEST_DATA.z = expect.anything() }).toThrow(
				'Cannot add property z, object is not extensible'
			);
			expect(() => { TEST_DATA.a = expect.anything() }).toThrow(
				"Cannot assign to read only property 'a' of object '#<Object>'"
			);
			expect(() => { TEST_DATA.a.b = expect.anything() }).toThrow(
				"Cannot assign to read only property 'b' of object '#<Object>'"
			);
			expect(() => { TEST_DATA.a.b.c[ 1 ] = expect.anything() }).toThrow(
				"Cannot assign to read only property '1' of object '[object Array]'"
			);
			expect(() => { TEST_DATA.a.b.c[ 3 ] = expect.anything() }).toThrow(
				"Cannot assign to read only property '3' of object '[object Array]'"
			);
			expect(() => { TEST_DATA.a.b.c.push( expect.anything() ) }).toThrow(
				'Cannot add property 4, object is not extensible'
			);
		});
	})
} );
