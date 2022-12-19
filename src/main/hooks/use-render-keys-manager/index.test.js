import clonedeep from 'lodash.clonedeep';

import { renderHook } from '@testing-library/react-hooks';

import '../../../test-artifacts/suppress-render-compat';

import useRenderKeysManager, {
	FULL_STATE_SELECTOR,
	NULL_STATE_SELECTOR
} from '.';

describe( 'useRenderKeysManager', () => {
	let renderKeys;
	beforeAll(() => {
		renderKeys = [ 'a', 'b', 'c' ];
	});
	test( 'calculates new selectors for new renderKeys', () => {
		const renderKeys2 = clonedeep( renderKeys );
		const { result, rerender } = renderHook( useRenderKeysManager, { initialProps: renderKeys2 } );
		const selectors = result.current;
		const renderKeys3 = [ ...renderKeys2 ];
		renderKeys3[ 1 ] = 'y';
		renderKeys3[ 2 ] = 'z';
		rerender( renderKeys3 );
		expect( result.current ).toEqual( renderKeys3 );
		expect( result.current ).not.toEqual( selectors );
		expect( result.current ).not.toBe( selectors );
	} );
	test( 'ensures no abrupt updates to selectors for new list with same renderKeys', () => {
		const { result, rerender } = renderHook( useRenderKeysManager, { initialProps: renderKeys } );
		const selectors = result.current;
		rerender( clonedeep( renderKeys ) );
		expect( result.current ).toBe( selectors );
	} );
	test( `returns an empty selector for renderKeys containing a \`${ FULL_STATE_SELECTOR }\` entry: (returns the full state)`, () => {
		const renderKeys2 = clonedeep( renderKeys );
		renderKeys2.splice( 2, 0, FULL_STATE_SELECTOR );
		const { result } = renderHook( useRenderKeysManager, { initialProps: renderKeys2 } );
		expect( result.current ).toEqual([]);
	} );
	test( `returns an array with a single selector \`${ NULL_STATE_SELECTOR }\` for empty renderKeys: (returns \`undefined\` state)`, () => {
		const { result } = renderHook( useRenderKeysManager, { initialProps: [] } );
		expect( result.current ).toEqual([ NULL_STATE_SELECTOR ]);
	} );
} );
