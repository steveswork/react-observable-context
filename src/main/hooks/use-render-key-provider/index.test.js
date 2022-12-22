import clonedeep from 'lodash.clonedeep';

import { renderHook } from '@testing-library/react-hooks';

import '../../../test-artifacts/suppress-render-compat';

import useRenderKeyProvider from '.';

describe( 'useRenderKeyProvider', () => {
	let selectorMap;
	beforeAll(() => { selectorMap = { _a: 'a', _b: 'b', _c: 'c' } });
	test( 'calculates new selectors for new selectorMap', () => {
		const initialProps = clonedeep( selectorMap );
		const { result, rerender } = renderHook( useRenderKeyProvider, { initialProps } );
		const selectors = result.current;
		const updateProps = { ...selectorMap, _y: 'y', _z: 'z' };
		rerender( updateProps );
		expect( result.current ).toEqual( Object.values( updateProps ) );
		expect( result.current ).not.toEqual( selectors );
		expect( result.current ).not.toBe( selectors );
	} );
	test( 'ensures no abrupt updates to selectors for new list with same selectorMap', () => {
		const { result, rerender } = renderHook( useRenderKeyProvider, { initialProps: selectorMap } );
		const selectors = result.current;
		rerender( clonedeep( selectorMap ) );
		expect( result.current ).toBe( selectors );
	} );
	describe( 'empty selectoMap', () => {
		test( 'returns empty renderKeys list', () => {
			const { result } = renderHook( useRenderKeyProvider, { initialProps: {} } );
			expect( result.current ).toEqual([]);
		} );
	} );
} );
