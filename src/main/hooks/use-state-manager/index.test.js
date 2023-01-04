import { renderHook } from '@testing-library/react-hooks';

import '../../../test-artifacts/suppress-render-compat';

import useStateManager from '.';

describe( 'useStateManager', () => {
	describe( 'fundamentals', () => {
		let initialProps;
		let updateProps;
		let stateManagerOnLoad, stateManagerOnRerender;
		let stateOnLoad, stateOnRerender;
		beforeAll(() => {
			initialProps = { a: 1 };
			updateProps = { w: 3 };
			const { result, rerender } = renderHook( useStateManager, { initialProps } );
			stateManagerOnLoad = result.current;
			stateOnLoad = result.current.state;
			rerender( updateProps );
			stateManagerOnRerender = result.current;
			stateOnRerender = result.current.state;
		});
		test( 'creates a state manager', () => {
			expect( stateManagerOnLoad ).toEqual( expect.objectContaining({
				select: expect.any( Function ),
				state: expect.any( Object ),
				stateWatch: expect.any( Function ),
				unlink: expect.any( Function )
			}) );
		} );
		test( 'initializes state with a copy of the value', () => {
			expect( stateOnLoad ).not.toBe( initialProps );
			expect( stateOnLoad ).toEqual( initialProps );
		} );
		test( 'disallows initial state value overrides', () => {
			expect( stateManagerOnRerender ).toBe( stateManagerOnLoad );
			expect( stateManagerOnRerender ).toStrictEqual( stateManagerOnLoad );
			expect( stateOnRerender ).not.toBe( updateProps );
			expect( stateOnRerender ).not.toEqual( updateProps );
			expect( stateOnRerender ).toEqual( initialProps );
		} );
	} );
	describe( 'state manager', () => {
		let Cache, initialProps, stateManager;
		const mockCache = {};
		beforeAll(() => {
			Cache = require( '../../../model/accessor-cache' ).default;
			[ 'get', 'unlinkClient', 'watchSource' ].forEach( m => {
				mockCache[ m ] = jest.spyOn( Cache.prototype, m );
			} );
			initialProps = { a: 1 };
			const { result } = renderHook( useStateManager, { initialProps } );
			stateManager = result.current;
		} );
		afterAll(() => { for( const m in mockCache ) { mockCache[ m ].mockRestore() } });
		test( 'selects state slice from the state cache', () => {
			mockCache.get.mockClear();
			const PROPERTY_PATH = expect.any( String );
			stateManager.select( PROPERTY_PATH );
			expect( mockCache.get ).toHaveBeenCalledTimes( 1 );
			expect( mockCache.get ).toHaveBeenCalledWith( PROPERTY_PATH );
		} );
		test( 'observes the store for state changes via the state cache', () => {
			mockCache.watchSource.mockClear();
			stateManager.stateWatch();
			expect( mockCache.watchSource ).toHaveBeenCalledTimes( 1 );
		} );
		test( 'unlinks a client component from state cache observation', () => {
			mockCache.unlinkClient.mockClear();
			const CLIENT_ID = expect.any( String );
			stateManager.unlink( CLIENT_ID );
			expect( mockCache.unlinkClient ).toHaveBeenCalledTimes( 1 );
			expect( mockCache.unlinkClient ).toHaveBeenCalledWith( CLIENT_ID );
		} );
	} );
} );
