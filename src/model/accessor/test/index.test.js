import get from 'lodash.get';

import Atom from '../../atom';

import Accessor from '..';

import createSourceData from '../../../test-artifacts/data/create-state-obj';
import { isReadonly } from '../../../test-artifacts/utils';

describe( 'Accessor class', () => {
	const source = createSourceData();
	const accessedPropertyPaths = Object.freeze([
		'address',
		'friends[1].id', // -
		'friends[1]',
		'friends[1].name.last', // -
		'history.places', // -
		'history.places[2].year', // -
		'history',
		'registered.time',
		'registered.time.hours', // -
		'tags[4]'
	]);
	const accessor = new Accessor( source, accessedPropertyPaths );
	const SET_ERROR = propName => `Cannot set property ${ propName } of #<Accessor> which has only a getter`;
	test( 'creates an accessor', () => expect( accessor ).toBeInstanceOf( Accessor ) );
	describe( 'numClients property', () => {
		test( 'is 0 by default', () => expect( accessor.numClients ).toBe( 0 ) );
		test( 'is privately mutable only', () => {
			expect(() => { accessor.numClients = expect.any( Number ) }).toThrow( SET_ERROR`numClients` );
		} );
	} );
	describe( 'id property', () => {
		test( 'holds an incremental unique integer value', () => {
			const testAccessor = new Accessor( source, accessedPropertyPaths );
			expect( testAccessor.id ).toBeGreaterThan( accessor.id );
		} );
		test( 'is privately mutable only', () => {
			expect(() => { accessor.id = expect.any( Number ) }).toThrow( SET_ERROR`id` );
		} );
	} );
	describe( 'paths property', () => {
		test( 'is privately mutable only', () => {
			expect(() => { accessor.paths = expect.any( Array ) }).toThrow( SET_ERROR`paths` );
		} );
		test( 'is a distinct value from the `accessedPropertyPaths`', () => {
			expect( accessor.paths ).not.toBe( accessedPropertyPaths );
		});
		test( 'only contains most inclusive propertyPaths options supplied', () => {
			const lessInclusivePaths = [ 1, 3, 4, 5, 8 ].map( i => accessedPropertyPaths[ i ]);
			expect( accessor.paths ).toHaveLength( accessedPropertyPaths.length - lessInclusivePaths.length );
			expect( lessInclusivePaths.every( p => !accessor.paths.includes( p ) ) ).toBe( true );
		} );
		test( '`null` is the most inclusive of propertyPaths options', () => {
			const accessor = new Accessor( source, [ ...accessedPropertyPaths, null ] );
			expect( accessor.paths ).toStrictEqual([ null ]);
		} );
	} );
	describe( 'value property', () => {
		test( 'is empty object by default', () => expect( accessor.value ).toEqual({}) );
		test( 'is readonly', () => {
			expect(() => { accessor.value.testFlag = true }).toThrow(
				'Cannot add property testFlag, object is not extensible'
			);
		} );
		test( 'is privately mutable only', () => {
			expect(() => { accessor.value = expect.anything() }).toThrow( SET_ERROR`value` );
		} );
	} );
	describe( 'addClient(...)', () => {
		test( 'adds new client id to `clients`', () => {
			const numClients = accessor.numClients;
			const id = expect.any( String );
			accessor.addClient( id );
			expect( accessor.numClients ).toBe( numClients + 1 );
			accessor.removeClient( id );
		} );
		test( 'ignores requests to add existing clients', () => {
			const id = expect.any( String );
			accessor.addClient( id );
			const numClients = accessor.numClients;
			accessor.addClient( id );
			accessor.addClient( id );
			expect( accessor.numClients ).toBe( numClients );
			accessor.removeClient( id );
		} );
	} );
	describe( 'hasClient(...)', () => {
		test( 'returns `false` if client not found in `clients`', () => {
			const id = expect.any( String );
			accessor.removeClient( id );
			expect( accessor.hasClient( id ) ).toBe( false );
		} );
		test( 'returns `true` if client found in `clients`', () => {
			const id = expect.any( String );
			accessor.addClient( id );
			expect( accessor.hasClient( id ) ).toBe( true );
			accessor.removeClient( id );
		} );
	} );
	describe( 'removeClient(...)', () => {
		test( 'removes client id from `clients`', () => {
			const id = expect.any( String );
			accessor.addClient( id );
			const numClients = accessor.numClients;
			accessor.removeClient( id );
			expect( accessor.numClients ).toBe( numClients - 1 );
		} );
		test( 'ignores requests to remove non-existing clients', () => {
			const id = expect.any( String );
			accessor.addClient( id );
			accessor.removeClient( id );
			const numClients = accessor.numClients;
			accessor.removeClient( id );
			accessor.removeClient( id );
			expect( accessor.numClients ).toBe( numClients );
		} );
	} );
	describe( 'refreshValue(...)', () => {
		let accessor, accessedPropertyPaths, createAccessorAtoms;
		let source, initVal, retVal, retValExpected;
		beforeAll(() => {
			source = createSourceData();
			accessedPropertyPaths = Object.freeze([
				'address',
				'friends[1].id',
				'friends[1].name.last',
				'history.places[2].year',
				'registered.time',
				'tags[4]'
			]);
			createAccessorAtoms = ( state = source, paths = accessedPropertyPaths ) => paths.reduce(( a, p ) => {
				a[ p ] = new Atom();
				a[ p ].setValue( get( state, p ) );
				return a;
			}, {});
			accessor = new Accessor( source, accessedPropertyPaths );
			initVal = accessor.value;
			retVal = accessor.refreshValue( createAccessorAtoms( source ) );
			retValExpected = {
				address: '760 Midwood Street, Harborton, Massachusetts, 7547',
				friends: [ undefined, {
					id: 1,
					name: { last: 'Roberson' }
				} ],
				history: {
					places: [ undefined, undefined, { year: '2017' } ]
				},
				registered: {
					time: {
						hours: 9,
						minutes: 55,
						seconds: 46
					}
				},
				tags: [ undefined, undefined, undefined, undefined, 'ullamco' ]
			};
		});
		test( "constructs atoms' current values into an accessor value", () => {
			expect( initVal ).toEqual({});
			expect( accessor.value ).toEqual( retValExpected );
		} );
		test( 'returns the latest constructed value', () => expect( retVal ).toEqual( retValExpected ) );
		test( 'ensures readonly value', () => expect( isReadonly( accessor.value ) ).toBe( true ) );
		test( 'changes only parts of its return value with new updates', () => {
			const source = createSourceData();
			const accessor = new Accessor( source, accessedPropertyPaths );
			const atoms = createAccessorAtoms( source );
			const existingVal = accessor.refreshValue( atoms );
			const updatePath = 'history.places[2].year';
			update: {
				atoms[ updatePath ].setValue( '2030' );
				accessor.refreshDue = true;
			}
			const updatedVal = accessor.refreshValue( atoms );
			expect( existingVal ).not.toBe( updatedVal );
			expect( existingVal ).not.toEqual( updatedVal );
			for( const k in existingVal ) {
				if( k === 'history' ) {
					expect( existingVal[ k ] ).not.toBe( updatedVal[ k ] );
					expect( existingVal[ k ] ).not.toEqual( updatedVal[ k ] );
					continue;
				}
				expect( existingVal[ k ] ).toBe( updatedVal[ k ] );
				expect( existingVal[ k ] ).toStrictEqual( updatedVal[ k ] );
			}
		} );
	} );
});

/** @typedef {{[x:string]: Atom}} Atoms */
