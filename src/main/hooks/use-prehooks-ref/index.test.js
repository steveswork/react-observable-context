import { renderHook } from '@testing-library/react-hooks';

import '../../../test-artifacts/suppress-render-compat';

import usePrehooksRef from '.';

describe( 'usePrehooksRef', () => {
	test( 'retains prehooks prop in a `react-ref` object', () => {
		const PREHOOK = 'PREHOOK_STUB'
		const { result, rerender } = renderHook( usePrehooksRef, { initialProps: PREHOOK } );
		expect( result.current ).toEqual({ current: PREHOOK });
		const PREHOOK2 = 'PREHOOK2_STUB';
		rerender( PREHOOK2 );
		expect( result.current ).not.toEqual({ current: PREHOOK });
		expect( result.current ).toEqual({ current: PREHOOK2 });
	} );
} );
