import { renderHook } from '@testing-library/react-hooks';

import '../../../test-artifacts/suppress-render-compat';

import useStore, { deps } from '.';

beforeAll(() => { jest.spyOn( deps, 'uuid' ).mockReturnValue( expect.any( String ) ) });
afterAll( jest.restoreAllMocks );

describe( 'useStore', () => {
	let initialState;
	beforeAll(() => { initialState = { a: 1 } })
	describe( 'fundamentals', () => {
		test( 'creates a store', () => {
			const { result } = renderHook(
				({ prehooks: p, value: v }) => useStore( p, v ), {
					initialProps: {
						prehooks: {},
						value: initialState
					}
				}
			);
			expect( result.current ).toEqual( expect.objectContaining({
				getState: expect.any( Function ),
				resetState: expect.any( Function ),
				setState: expect.any( Function ),
				subscribe: expect.any( Function ),
				unlinkCache: expect.any( Function )
			}) );
		} );
		test( 'retains the initial state in storage', () => {
			const setItem = jest.fn()
			renderHook(
				({ prehooks: p, value: v, storage: s }) => useStore( p, v, s ), {
					initialProps: {
						prehooks: {},
						value: initialState,
						storage: { setItem, removeItem: () => {} }
					}
				}
			);
			expect( setItem ).toHaveBeenCalledTimes( 1 );
			expect( setItem ).toHaveBeenCalledWith( expect.any( String ), initialState );
		} );
		test( 'cleans up retained state from storage on store unmount if storage supported', () => {
			const removeItem = jest.fn();
			const { unmount } = renderHook(
				({ prehooks: p, value: v, storage: s }) => useStore( p, v, s ), {
					initialProps: {
						prehooks: {},
						value: initialState,
						storage: { setItem: () => {}, removeItem }
					}
				}
			);
			expect( removeItem ).not.toHaveBeenCalled();
			unmount();
			expect( removeItem ).toHaveBeenCalledTimes( 1 );
		} );
		test( 'merges copies of subsequent value prop updates to state', async () => {
			const setStateSpy = jest.spyOn( deps, 'setState' );
			const { rerender } = renderHook(
				({ prehooks: p, value: v }) => useStore( p, v ), {
					initialProps: {
						prehooks: {},
						value: initialState
					}
				}
			);
			expect( setStateSpy ).not.toHaveBeenCalled();
			const updateState = { v: 3 };
			rerender({ prehooks: {}, value: updateState });
			expect( setStateSpy ).toHaveBeenCalledTimes( 1 );
			expect( setStateSpy.mock.calls[ 0 ][ 1 ] ).toStrictEqual( updateState );
			expect( setStateSpy.mock.calls[ 0 ][ 1 ] ).not.toBe( updateState );
			setStateSpy.mockRestore();
		} );
	} );
	describe( 'store', () => {
		let storage;
		beforeAll(() => {
			storage = {
				getItem: jest.fn().mockReturnValue( initialState ),
				removeItem: jest.fn(),
				setItem: jest.fn()
			};
		});
		describe( 'normal flow', () => {
			let initialProps, prehooks, setAddSpy, setDeleteSpy, setStateSpy, store;
			beforeAll(() => {
				jest.clearAllMocks();
				setStateSpy = jest.spyOn( deps, 'setState' );
				setAddSpy = jest.spyOn( Set.prototype, 'add' );
				setDeleteSpy = jest.spyOn( Set.prototype, 'delete' );
				prehooks = {
					resetState: jest.fn().mockReturnValue( true ),
					setState: jest.fn().mockReturnValue( true )
				};
				initialProps = { prehooks, value: initialState, storage };
				const { result } = renderHook(
					({ prehooks: p, storage: s, value: v }) => useStore( p, v, s ),
					{ initialProps }
				);
				store = result.current;
			});
			afterAll(() => {
				setAddSpy.mockRestore();
				setDeleteSpy.mockRestore();
				setStateSpy.mockRestore();
			});
			describe( 'getState', () => {
				test( 'returns state slice at property path', () => {
					const PROPERTY_PATH = 'a';
					expect( store.getState( PROPERTY_PATH ) ).toEqual( initialState );
				} );
			} );
			describe( 'resetState', () => {
				beforeAll(() => {
					prehooks.resetState.mockClear();
					setStateSpy.mockClear();
					storage.getItem.mockClear();
					store.resetState();
				});
				test( 'obtains initial state from storage', () => {
					expect( storage.getItem ).toHaveBeenCalled();
				} );
				test( 'runs the avaiable prehook', () => {
					expect( prehooks.resetState ).toHaveBeenCalled();
				} );
				test( 'resets the state if prehook evaluates to true', () => {
					// prehook.resetState had been mocked to return true
					// please see 'prehooks effects' describe block for alternate scenario
					expect( setStateSpy ).toHaveBeenCalled();
				} );
			} );
			describe( 'setState', () => {
				beforeAll(() => {
					prehooks.setState.mockClear();
					setStateSpy.mockClear();
					store.setState();
				});
				test( 'runs the avaiable prehook', () => {
					expect( prehooks.setState ).toHaveBeenCalled();
				} );
				test( 'sets the state if prehook evaluates to true', () => {
					// prehook.setState had been mocked to return true
					// please see 'prehooks effects' describe block for alternate scenario
					expect( setStateSpy ).toHaveBeenCalled();
				} );
			} );
			describe( 'subscribe', () => {
				const LISTENER = 'LISTENER STUB';
				let result;
				beforeAll(() => {
					setAddSpy.mockClear();
					setDeleteSpy.mockClear();
					result = store.subscribe( LISTENER );
				});
				test( 'adds a new subscriber', () => {
					expect( setAddSpy ).toHaveBeenCalled();
					expect( setAddSpy ).toHaveBeenCalledWith( LISTENER );
				} );
				test( 'returns a function to unsub the new subscriber', () => {
					expect( result ).toBeInstanceOf( Function );
					expect( setDeleteSpy ).not.toHaveBeenCalled();
					result();
					expect( setDeleteSpy ).toHaveBeenCalledWith( LISTENER );
				} );
			} );
		} );
		describe( 'prehooks effects', () => {
			let setStateSpy, store;
			beforeAll(() => {
				jest.clearAllMocks();
				setStateSpy = jest.spyOn( deps, 'setState' );
				store = renderHook(
					({ prehooks: p, storage: s, value: v }) => useStore( p, v, s ),
					{
						initialProps: {
							prehooks: {
								resetState: jest.fn().mockReturnValue( false ),
								setState: jest.fn().mockReturnValue( false )
							},
							storage,
							value: initialState
						}
					}
				).result.current;
			});
			afterAll(() => { setStateSpy.mockRestore() });
			describe( 'resetState #2', () => {
				test( 'will not reset the state if prehook evaluates to false', () => {
					// prehooks.resetState had been mocked to return false
					store.resetState();
					expect( setStateSpy ).not.toHaveBeenCalled();
				} );
			} );
			describe( 'setState #2', () => {
				test( 'will not set the state if prehook evaluates to false', () => {
					// prehooks.setState had been mocked to return false
					store.setState();
					expect( setStateSpy ).not.toHaveBeenCalled();
				} );
			} );
		} );
	} );
} );
