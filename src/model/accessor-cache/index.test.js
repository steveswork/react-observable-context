import clonedeep from 'lodash.clonedeep';

import createSourceData from '../../test-artifacts/data/create-state-obj';
import { isReadonly } from '../../test-artifacts/utils';

import { FULL_STATE_SELECTOR } from '../../constants';

import AccessorCache from '.';

describe( 'AccessorCache class', () => {
	const source = createSourceData();
	const accessorPaths = [
		Object.freeze([
			'friends[1].id',
			'friends[1].name.last',
			'history.places[2].year',
			'name',
			'registered.time',
			'tags[4]'
		]),
		Object.freeze([
			'address',
			'friends[1]',
			'history',
			'registered.time',
			'tags[4]'
		])
	];
	const cache = new AccessorCache( source );
	describe( 'get(...)', () => {
		describe( 'returned value', () => {
			const retValExpected = {
				'friends[1].id': 1,
				'friends[1].name.last': 'Roberson',
				'history.places[2].year': '2017',
				name: {
					first: 'Amber',
					last: 'Sears'
				},
				'registered.time': {
					hours: 9,
					minutes: 55,
					seconds: 46
				},
				'tags[4]': 'ullamco'
			};
			const retVal = cache.get( expect.any( String ), ...accessorPaths[ 0 ] );
			test( 'is a compiled slice of state as referenced in the propertyPaths', () => {
				expect( retVal ).toEqual( retValExpected );
			} );
			test( 'contains only readonly properties', () => {
				expect( Object.values( retVal ).every( isReadonly ) ).toBe( true )
			} );
		} );
		describe( 'empty propertyPaths behavior', () => {
			const retVal = cache.get( 'TEST_EMPTY_PROPERTY_PATH' );
			test( 'returns the whole state as readonly', () => {
				expect( retVal ).toEqual({ [ FULL_STATE_SELECTOR ]: source });
				expect( Object.values( retVal ).every( isReadonly ) ).toBe( true );
			} );
		} );
	} );
	describe( 'unlinkClient(...)', () => {
		const CLIENT_ID = 'TEST_CLIENT';
		let atomDisconnectSpy, accessorRemoveClientSpy, cache;
		beforeAll(() => {
			const Atom = require( '../atom' ).default;
			const Accessor = require( '../accessor' ).default;
			atomDisconnectSpy = jest.spyOn(	Atom.prototype, 'disconnect' );
			accessorRemoveClientSpy = jest.spyOn(	Accessor.prototype, 'removeClient' );
			cache = new AccessorCache( createSourceData() );
			cache.get( CLIENT_ID, 'company' ); // this adds new clients to the structure
			cache.unlinkClient( CLIENT_ID );
		});
		afterAll(() => {
			cache = null;
			accessorRemoveClientSpy.mockRestore();
			atomDisconnectSpy.mockRestore();
		});
		test( 'disassociates client from its servicing accessor', () => {
			expect( accessorRemoveClientSpy ).toHaveBeenCalledWith( CLIENT_ID );
		} );
		test( 'disconnects any resulting clientless accessor from storage atom cell', () => {
			expect( atomDisconnectSpy ).toHaveBeenCalledWith( expect.any( Number ) );
		} );
	} );
	describe( 'watchSource(...)', () => {
		const CLIENT_ID = 'TEST_AUTO_UPDATED';
		let newChanges, latestFetchedSlice, origFetchedSlice, oldValues, registeredDay;
		beforeAll(() => {
			registeredDay = source.registered.day;
			newChanges = {
				friends: { 1: { name: { first: 'Amanda' } } },
				history: { places: { 2: { year: '2017 - 2022' } } },
				registered: {
					day: 30,
					time: {
						minutes: 0,
						seconds: 0
					}
				},
				tags: { 4: 'MY_TAG' }
			}
			oldValues = clonedeep({
				address: source.address,
				'friends[1]': source.friends[ 1 ],
				history: source.history,
				'registered.time': source.registered.time,
				'tags[4]': source.tags[ 4 ]
			});
			origFetchedSlice = clonedeep( cache.get( CLIENT_ID, ...accessorPaths[ 1 ] ) );
			// simulate state change
			source.friends[ 1 ].name.first = newChanges.friends[ 1 ].name.first;
			source.history.places[ 2 ].year = newChanges.history.places[ 2 ].year;
			source.registered.day = newChanges.registered.day;
			source.registered.time.minutes = newChanges.registered.time.minutes;
			source.registered.time.seconds = newChanges.registered.time.seconds;
			source.tags[ 4 ] = newChanges.tags[ 4 ];
			/* simulate state change notification publishing */
			cache.watchSource( newChanges );
			/* simulate client's request to refresh own state slice */
			latestFetchedSlice = cache.get( CLIENT_ID, ...accessorPaths[ 1 ] );
		});
		afterAll(() => {
			source.address = oldValues.address;
			source.friends[ 1 ] = oldValues[ 'friends[1]' ];
			source.history = oldValues.history;
			source.registered.day = registeredDay;
			source.registered.time = oldValues[ 'registered.time' ];
			source.tags[ 4 ] = oldValues[ 'tags[4]' ];
			newChanges = null;
			latestFetchedSlice = null;
			origFetchedSlice = null;
			oldValues = null;
		});
		test( 'confirms pre-update state slice returns current slice from original state', () => {
			expect( Object.keys( origFetchedSlice ) ).toEqual( accessorPaths[ 1 ] );
			expect( origFetchedSlice ).toStrictEqual({
				address: oldValues.address,
				'friends[1]': oldValues[ 'friends[1]' ],
				history: oldValues.history,
				'registered.time': oldValues[ 'registered.time' ],
				'tags[4]': oldValues[ 'tags[4]' ]
			});
		} );
		test( 'confirms post-update state slice returns current slice from the updated state', () => {
			const expected = clonedeep({
				address: oldValues.address,
				'friends[1]': oldValues[ 'friends[1]' ],
				history: oldValues.history,
				'registered.time': oldValues[ 'registered.time' ],
				'tags[4]': oldValues[ 'tags[4]' ]
			});
			expected[ 'friends[1]' ].name.first = newChanges.friends[ 1 ].name.first;
			expected.history.places[ 2 ].year = newChanges.history.places[ 2 ].year;
			expected[ 'registered.time' ].minutes = newChanges.registered.time.minutes;
			expected[ 'registered.time' ].seconds = newChanges.registered.time.seconds;
			expected[ 'tags[4]' ] = newChanges.tags[ 4 ];
			expect( latestFetchedSlice ).toStrictEqual( expected );
		} );
		test( 'is disinterested in state changes not occurring in any of its registered propertyPaths', () => {
			expect( 'registered.day' in origFetchedSlice ).toBe( false );
			expect( 'registered.day' in latestFetchedSlice ).toBe( false );
		} );
		describe( 'incorporating new data updates', () => {
			let existingVal, existingValClone, updatedVal;
			beforeAll(() => {
				const source = createSourceData();
				const cache = new AccessorCache( source );
				const paths = [ ...accessorPaths[ 0 ], 'history', 'history.places[0].year' ];
				existingVal = cache.get( CLIENT_ID, ...paths );
				existingValClone = clonedeep( existingVal );
				newChanges = { history: { places: { 2: { year: '2030' } } } };
				source.history.places[ 2 ].year = '2030';
				cache.watchSource( newChanges );
				updatedVal = cache.get( CLIENT_ID, ...paths );
			});
			test( 'never alters its value property object reference', () => {
				expect( existingVal ).toBe( updatedVal );
				expect( existingVal ).toStrictEqual( updatedVal );
				expect( existingValClone ).not.toEqual( updatedVal );
			});
			test( 'changes only properties of its return value affected by the new updates', () => {
				for( const k in existingVal ) {
					k === 'history' || k === 'history.places[2].year'
						? expect( existingValClone[ k ] ).not.toEqual( updatedVal[ k ] )
						: expect( existingValClone[ k ] ).toEqual( updatedVal[ k ] );
				}
			} );
		} );
	} );
} );
