import createSourceData from '../../test-artifacts/data/create-state-obj';
import { isReadonly } from '../../test-artifacts/utils';

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
				friends: [ undefined, {
					id: 1,
					name: { last: 'Roberson' }
				} ],
				history: {
					places: [ undefined, undefined, { year: '2017' } ]
				},
				name: {
					first: 'Amber',
					last: 'Sears'
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
			const retVal = cache.get( expect.any( String ), ...accessorPaths[ 0 ] );
			test( 'is a compiled slice of state as referenced in the propertyPaths', () => {
				expect( retVal ).toEqual( retValExpected );
			} );
			test( 'is readonly', () => expect( isReadonly( retVal ) ).toBe( true ) );
		} );
		describe( 'empty propertyPaths behavior', () => {
			const retVal = cache.get( 'TEST_DEFAULT_STATE_PATH' );
			test( 'returns the whole state as readonly', () => {
				expect( retVal ).toEqual( source );
				expect( isReadonly( retVal ) ).toBe( true );
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
		let newChanges, latestFetchedSlice, origFetchedSlice, oldValues;
		beforeAll(() => {
			newChanges = {
				firstName: 'Amanda',
				yearLived3: '2017 - 2022',
				regDay: 30,
				regTime: {
					minutes: 0,
					seconds: 0
				},
				tag5: 'MY_TAG'
			};
			oldValues = {
				firstName: source.friends[ 1 ].name.first,
				yearLived3: source.history.places[ 2 ].year,
				regDay: source.registered.day,
				regTime: {
					minutes: source.registered.time.minutes,
					seconds: source.registered.time.seconds
				},
				tag5: source.tags[ 4 ]
			};
			origFetchedSlice = cache.get( CLIENT_ID, ...accessorPaths[ 1 ] );
			// simulate state change
			source.friends[ 1 ].name.first = newChanges.firstName;
			source.history.places[ 2 ].year = newChanges.yearLived3;
			source.registered.day = newChanges.regDay;
			source.registered.time.minutes = newChanges.regTime.minutes;
			source.registered.time.seconds = newChanges.regTime.seconds;
			source.tags[ 4 ] = newChanges.tag5;
			// simulate state change notification publishing
			cache.watchSource({
				friends: { 1: { name: { first: newChanges.firstName } } },
				history: { places: { 2: { year: newChanges.yearLived3 } } },
				registered: {
					day: newChanges.regDay,
					time: {
						minutes: newChanges.regTime.minutes,
						seconds: newChanges.regTime.seconds
					}
				},
				tags: { 4: newChanges.tag5 }
			});
			// simulate client's request to refresh own state slice
			latestFetchedSlice = cache.get( CLIENT_ID, ...accessorPaths[ 1 ] );
		});
		afterAll(() => {
			source.friends[ 1 ].name.first = oldValues.firstName;
			source.history.places[ 2 ].year = oldValues.yearLived3;
			source.registered.day = oldValues.regDay;
			source.registered.time.minutes = oldValues.regTime.minutes;
			source.registered.time.seconds = oldValues.regTime.seconds;
			source.tags[ 4 ] = oldValues.tag5;
			newChanges = null;
			latestFetchedSlice = null;
			origFetchedSlice = null;
			oldValues = null;
		});
		test( 'confirms pre-update state slice returns current slice from original state', () => {
			expect( origFetchedSlice.friends[ 1 ].name.first ).toBe( oldValues.firstName );
			expect( origFetchedSlice.history.places[ 2 ].year ).toBe( oldValues.yearLived3 );
			expect( origFetchedSlice.registered.time ).toEqual( expect.objectContaining( oldValues.regTime ) );
			expect( origFetchedSlice.tags[ 4 ] ).toBe( oldValues.tag5 );
		} );
		test( 'confirms post-update state slice returns current slice from the updated state', () => {
			expect( latestFetchedSlice.friends[ 1 ].name.first ).toBe( newChanges.firstName );
			expect( latestFetchedSlice.history.places[ 2 ].year ).toBe( newChanges.yearLived3 );
			expect( latestFetchedSlice.registered.time ).toEqual( expect.objectContaining( newChanges.regTime ) );
			expect( latestFetchedSlice.tags[ 4 ] ).toBe( newChanges.tag5 );
		} );
		test( 'is disinterested in state changes not occuring in any of its registered propertyPaths', () => {
			expect( 'day' in origFetchedSlice.registered ).toBe( false );
			expect( 'day' in latestFetchedSlice.registered ).toBe( false );
		} );
	} );
} );
