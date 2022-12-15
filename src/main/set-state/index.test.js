import clonedeep from 'lodash.clonedeep';

import createSourceData from '../../test-artifacts/data/create-state-obj';

import setState from '.';

describe( 'setState(...)', () => {
	const state = createSourceData();
	describe( 'basics', () => {
		let newAge, onChangeMock, prevAge;
		beforeAll(() => {
			newAge = 56;
			onChangeMock = jest.fn();
			prevAge = state.age;
			setState( state, { age: newAge }, onChangeMock );
		});
		afterAll(() => { state.age = prevAge })
		test( 'updates state with new changes', () => expect( state.age ).toBe( newAge ) );
		test( 'notifies listeners of state changes', () => {
			expect( onChangeMock ).toHaveBeenCalledTimes( 1 );
			expect( onChangeMock ).toHaveBeenCalledWith(
				expect.objectContaining({ age: newAge }),
				expect.objectContaining({ age: prevAge })
			);
		} );
	} );
	describe( 'array state subtree', () => {
		describe( 'using indexed object to update array at specific indexes', () => {
			let newState, onChangeMock;
			let origFriendsSlice;
			beforeAll(() => {
				origFriendsSlice = clonedeep( state.friends );
				newState = {
					friends: {
						1: { name: { first: 'Virginia' } },
						2: {
							id: 5,
							name: { first: 'Kathy', last: 'Smith' }
						}
					}
				};
				onChangeMock = jest.fn();
				setState( state, newState, onChangeMock );
			});
			afterAll(() => { state.friends = origFriendsSlice });
			test( 'maintains structural integrity of the subtree', () => {
				expect( Array.isArray( state.friends ) ).toBe( true );
			} );
			test( 'updates state with new changes', () => {
				expect( state.friends[ 0 ] ).toEqual( origFriendsSlice[ 0 ] ); // remains untouched
				expect( state.friends[ 1 ].name.first ).toBe( newState.friends[ 1 ].name.first );
				expect( state.friends[ 2 ] ).toEqual( newState.friends[ 2 ] );
			} );
			test( 'notifies listeners of state changes', () => {
				expect( onChangeMock ).toHaveBeenCalledTimes( 1 );
				expect( onChangeMock ).toHaveBeenCalledWith(
					expect.objectContaining( newState ),
					expect.objectContaining({
						friends: {
							1: { name: { first: origFriendsSlice[ 1 ].name.first } },
							2: origFriendsSlice[ 2 ]
						}
					})
				);
			} );
		} );
		describe( 'using indexed object to create new array entry', () => {
			let newEntryIndex, newState, onChangeMock, origFriendsSlice;
			beforeAll(() => {
				origFriendsSlice = clonedeep( state.friends );
				newEntryIndex = origFriendsSlice.length + 2;
				newState = {
					friends: {
						[ newEntryIndex ]: {
							id: newEntryIndex,
							name: { first: 'Rudie', last: 'Carson' }
						}
					}
				};
				onChangeMock = jest.fn();
				setState( state, newState, onChangeMock );
			});
			afterAll(() => { state.friends = origFriendsSlice });
			test( 'maintains structural integrity of the subtree', () => {
				expect( Array.isArray( state.friends ) ).toBe( true );
			} );
			test( 'leaves existing items untouched', () => {
				origFriendsSlice.forEach(( f, i ) => {
					expect( state.friends[ i ] ).toEqual( f );
				});
			} );
			test( 'creates `undefined` entries for any unoccupied indexes leading the new entry', () => {
				for( let i = origFriendsSlice.length; i < newEntryIndex; i++ ) {
					expect( state.friends[ i ] ).toBe( undefined );
				}
			} );
			test( 'places new entry at the referenced index', () => {
				expect( state.friends[ newEntryIndex ] ).toEqual( newState.friends[ newEntryIndex ] );
			} );
			test( 'notifies listeners of state changes', () => {
				expect( onChangeMock ).toHaveBeenCalledTimes( 1 );
				expect( onChangeMock ).toHaveBeenCalledWith(
					expect.objectContaining({
						friends: {
							[ newEntryIndex - 2 ]: undefined,
							[ newEntryIndex - 1 ]: undefined,
							[ newEntryIndex ]: newState.friends[ newEntryIndex ]
						}
					}),
					{}
				);
			} );
		} );
		describe( 'incoming array < existing array', () => {
			let newState, onChangeMock;
			let origFriendsSlice;
			beforeAll(() => {
				origFriendsSlice = clonedeep( state.friends );
				newState = { friends: [ origFriendsSlice[ 2 ] ] };
				onChangeMock = jest.fn();
				setState( state, newState, onChangeMock );
			});
			afterAll(() => { state.friends = origFriendsSlice });
			test( 'truncates existing array to new array size', () => {
				expect( state.friends ).toHaveLength( newState.friends.length );
				expect( state.friends.length ).toBeLessThan( origFriendsSlice.length );
			} );
			test( 'updates state with new changes', () => {
				expect( state.friends ).toEqual( newState.friends );
			} );
			test( 'notifies listeners of state changes', () => {
				expect( onChangeMock ).toHaveBeenCalledTimes( 1 );
				expect( onChangeMock ).toHaveBeenCalledWith(
					expect.objectContaining({ friends: { 0: origFriendsSlice[ 2 ] } }),
					expect.objectContaining({
						friends: {
							0: origFriendsSlice[ 0 ],
							1: origFriendsSlice[ 1 ],
							2: origFriendsSlice[ 2 ]
						}
					} )
				);
			} );
		} );
		describe( 'incoming array > existing array', () => {
			describe( 'where incoming array is completely different from existing array', () => {
				let newState, onChangeMock;
				let origFriendsSlice;
				beforeAll(() => {
					origFriendsSlice = clonedeep( state.friends );
					newState = { friends: [] };
					for( let i = 7; --i; ) {
						newState.friends.push({
							id: expect.any( Number ), name: { first: expect.any( String ), last: expect.any( String ) }
						});
					}
					onChangeMock = jest.fn();
					setState( state, newState, onChangeMock );
				});
				afterAll(() => { state.friends = origFriendsSlice });
				test( 'increases existing array size to fit new array items', () => {
					expect( state.friends ).toHaveLength( newState.friends.length );
					expect( state.friends.length ).toBeGreaterThan( origFriendsSlice.length );
				} );
				test( 'updates state with new changes', () => {
					expect( state.friends ).toEqual( newState.friends );
				} );
				test( 'notifies listeners of total state slice replacement', () => {
					const replacedFriendsSlice = {};
					newState.friends.forEach(( f, i ) => { replacedFriendsSlice[ i ] = f });
					expect( onChangeMock ).toHaveBeenCalledTimes( 1 );
					expect( onChangeMock ).toHaveBeenCalledWith(
						expect.objectContaining({ friends: replacedFriendsSlice }),
						expect.objectContaining({
							friends: {
								0: origFriendsSlice[ 0 ],
								1: origFriendsSlice[ 1 ],
								2: origFriendsSlice[ 2 ]
							}
						} )
					);
				} );
			} );
			describe( 'where incoming array contains existing array entries at the matching indexes', () => {
				let newState, onChangeMock, lastNewStateEntry, origFriendsSlice, originalNewStateEntry0, originalNewStateEntry1;
				beforeAll(() => {
					origFriendsSlice = clonedeep( state.friends );
					originalNewStateEntry0 = { id: 15, name: { first: 'Sue', last: 'Jones' } };
					originalNewStateEntry1 = {
						id: expect.any( Number ), name: { first: expect.any( String ), last: expect.any( String ) }
					};
					lastNewStateEntry = origFriendsSlice[ 0 ];
					newState = { friends: clonedeep( origFriendsSlice ) };
					newState.friends[ 0 ] = originalNewStateEntry0;
					newState.friends.push( originalNewStateEntry1 );
					newState.friends.push( lastNewStateEntry );
					onChangeMock = jest.fn();
					setState( state, newState, onChangeMock );
				});
				afterAll(() => { state.friends = origFriendsSlice });
				test( 'increases existing array size to fit new array items', () => {
					expect( state.friends ).toHaveLength( newState.friends.length );
					expect( state.friends.length ).toBeGreaterThan( origFriendsSlice.length );
				} );
				test( 'updates state with new changes', () => {
					expect( state.friends ).toEqual( newState.friends );
				} );
				test( 'maintains 2nd and 3rd elements from previous array', () => {
					expect( state.friends[ 0 ] ).not.toEqual( origFriendsSlice[ 0 ] );
					expect( state.friends[ 1 ] ).toEqual( origFriendsSlice[ 1 ] );
					expect( state.friends[ 2 ] ).toEqual( origFriendsSlice[ 2 ] );
				} );
				test( 'notifies listeners of updated array entries', () => {
					expect( onChangeMock ).toHaveBeenCalledTimes( 1 );
					expect( onChangeMock ).toHaveBeenCalledWith(
						expect.objectContaining({
							friends: {
								0: originalNewStateEntry0,
								3: originalNewStateEntry1,
								4: lastNewStateEntry
							}
						}),
						expect.objectContaining({ friends: { 0: origFriendsSlice[ 0 ] } })
					);
				} );
			} );
		} );
	} );
} );
