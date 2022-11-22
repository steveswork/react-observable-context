import React from 'react';

import { cleanup as cleanupPerfTest, perf, wait } from 'react-performance-testing';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import '@testing-library/jest-dom';

import { UsageError } from '../src';

import AppNormal, { TallyDisplay } from './apps/normal';
import AppWithPureChildren from './apps/with-pure-children';

beforeAll(() => {
	jest.spyOn( console, 'log' ).mockImplementation(() => {});
	jest.spyOn( console, 'error' ).mockImplementation(() => {});
});
afterAll(() => jest.resetAllMocks());
afterEach( cleanup );

const tranformRenderCount = (() => {
	const compNames = [ 'Editor', 'PriceSticker', 'ProductDescription', 'TallyDisplay' ];
	return ( renderCount, baseRenderCount = {} ) => compNames.reduce(( obj, k ) => {
		obj[ k ] = renderCount.current[ k ].value - ( baseRenderCount[ k ] || 0 );
		return obj;
	}, {});
})();

describe( 'ReactObservableContext', () => {
	test( 'throws usage error on attempts to use context store outside of the Provider component tree', () => {
		// note: TallyDisplay component utilizes the ReactObservableContext store
		expect(() => render( <TallyDisplay /> )).toThrow( UsageError );
	} );
	describe( 'store updates from within the Provider tree', () => {
		describe( 'updates only subscribed components', () => {
			describe( 'using non pure-component store subscribers', () => {
				test( 'scenario 1', async () => {
					const { renderCount } = perf( React );
					render( <AppNormal /> );
					let baseRenderCount;
					await wait(() => {
						baseRenderCount = tranformRenderCount( renderCount );
					});
					fireEvent.change( screen.getByLabelText( 'New Price:' ), { target: { value: '123' } } );
					fireEvent.click( screen.getByRole( 'button', { name: 'update price' } ) );
					await wait(() => {
						const netCount = tranformRenderCount( renderCount, baseRenderCount );
						expect( netCount.PriceSticker ).toBe( 1 );
						expect( netCount.ProductDescription ).toBe( 0 ); // unaffected: no use for price data
						expect( netCount.Editor ).toBe( 0 ); // unaffected: no use for price data
						expect( netCount.TallyDisplay ).toBe( 1 );
					});
					cleanupPerfTest();
				} );
				test( 'scenario 2', async () => {
					const { renderCount } = perf( React );
					render( <AppNormal /> );
					let baseRenderCount;
					await wait(() => {
						baseRenderCount = tranformRenderCount( renderCount );
					});
					fireEvent.change( screen.getByLabelText( 'New Color:' ), { target: { value: 'Navy' } } );
					fireEvent.click( screen.getByRole( 'button', { name: 'update color' } ) );
					await wait(() => {
						const netCount = tranformRenderCount( renderCount, baseRenderCount );
						expect( netCount.PriceSticker ).toBe( 0 ); // unaffected: no use for color data
						expect( netCount.ProductDescription ).toBe( 1 );
						expect( netCount.Editor ).toBe( 0 ); // unaffected: no use for color data
						expect( netCount.TallyDisplay ).toBe( 1 );
					});
					cleanupPerfTest();
				} );
				test( 'scenario 3', async () => {
					const { renderCount } = perf( React );
					render( <AppNormal /> );
					let baseRenderCount;
					await wait(() => {
						baseRenderCount = tranformRenderCount( renderCount );
					});
					fireEvent.change( screen.getByLabelText( 'New Type:' ), { target: { value: 'Bag' } } );
					fireEvent.click( screen.getByRole( 'button', { name: 'update type' } ) );
					await wait(() => {
						const netCount = tranformRenderCount( renderCount, baseRenderCount );
						expect( netCount.PriceSticker ).toBe( 0 ); // unaffected: no use for productType data
						expect( netCount.ProductDescription ).toBe( 1 );
						expect( netCount.Editor ).toBe( 0 ); // unaffected: no use for productType data
						expect( netCount.TallyDisplay ).toBe( 1 );
					});
					cleanupPerfTest();
				} );
				test( 'does not render resubmitted changes', async () => {
					const { renderCount } = perf( React );
					render( <AppNormal /> );
					fireEvent.change( screen.getByLabelText( 'New Type:' ), { target: { value: 'Bag' } } );
					fireEvent.click( screen.getByRole( 'button', { name: 'update type' } ) );
					let baseRenderCount;
					await wait(() => {
						baseRenderCount = tranformRenderCount( renderCount );
					});
					fireEvent.change( screen.getByLabelText( 'New Type:' ), { target: { value: 'Bag' } } );
					fireEvent.click( screen.getByRole( 'button', { name: 'update type' } ) );
					await wait(() => {
						const netCount = tranformRenderCount( renderCount, baseRenderCount );
						expect( netCount.PriceSticker ).toBe( 0 );
						expect( netCount.ProductDescription ).toBe( 0 ); // unaffected: no new ProductType data
						expect( netCount.Editor ).toBe( 0 );
						expect( netCount.TallyDisplay ).toBe( 0 ); // unaffected: no new ProductType data
					});
					cleanupPerfTest();
				} );
			} );
			describe( 'using pure-component store subscribers', () => {
				test( 'scenario 1', async () => {
					const { renderCount } = perf( React );
					render( <AppWithPureChildren /> );
					let baseRenderCount;
					await wait(() => {
						baseRenderCount = tranformRenderCount( renderCount );
					});
					fireEvent.change( screen.getByLabelText( 'New Price:' ), { target: { value: '123' } } );
					fireEvent.click( screen.getByRole( 'button', { name: 'update price' } ) );
					await wait(() => {
						const netCount = tranformRenderCount( renderCount, baseRenderCount );
						expect( netCount.PriceSticker ).toBe( 1 );
						expect( netCount.ProductDescription ).toBe( 0 ); // unaffected: no use for price data
						expect( netCount.Editor ).toBe( 0 ); // unaffected: no use for price data
						expect( netCount.TallyDisplay ).toBe( 1 );
					});
					cleanupPerfTest();
				} );
				test( 'scenario 2', async () => {
					const { renderCount } = perf( React );
					render( <AppWithPureChildren /> );
					let baseRenderCount;
					await wait(() => {
						baseRenderCount = tranformRenderCount( renderCount );
					});
					fireEvent.change( screen.getByLabelText( 'New Color:' ), { target: { value: 'Navy' } } );
					fireEvent.click( screen.getByRole( 'button', { name: 'update color' } ) );
					await wait(() => {
						const netCount = tranformRenderCount( renderCount, baseRenderCount );
						expect( netCount.PriceSticker ).toBe( 0 ); // unaffected: no use for color data
						expect( netCount.ProductDescription ).toBe( 1 );
						expect( netCount.Editor ).toBe( 0 ); // unaffected: no use for color data
						expect( netCount.TallyDisplay ).toBe( 1 );
					});
					cleanupPerfTest();
				} );
				test( 'scenario 3', async () => {
					const { renderCount } = perf( React );
					render( <AppWithPureChildren /> );
					let baseRenderCount;
					await wait(() => {
						baseRenderCount = tranformRenderCount( renderCount );
					});
					fireEvent.change( screen.getByLabelText( 'New Type:' ), { target: { value: 'Bag' } } );
					fireEvent.click( screen.getByRole( 'button', { name: 'update type' } ) );
					await wait(() => {
						const netCount = tranformRenderCount( renderCount, baseRenderCount );
						expect( netCount.PriceSticker ).toBe( 0 ); // unaffected: no use for productType data
						expect( netCount.ProductDescription ).toBe( 1 );
						expect( netCount.Editor ).toBe( 0 ); // unaffected: no use for productType data
						expect( netCount.TallyDisplay ).toBe( 1 );
					});
					cleanupPerfTest();
				} );
				test( 'does not render subscribed components for resubmitted changes', async () => {
					const { renderCount } = perf( React );
					render( <AppNormal /> );
					fireEvent.change( screen.getByLabelText( 'New Type:' ), { target: { value: 'Bag' } } );
					fireEvent.click( screen.getByRole( 'button', { name: 'update type' } ) );
					let baseRenderCount;
					await wait(() => {
						baseRenderCount = tranformRenderCount( renderCount );
					});
					fireEvent.change( screen.getByLabelText( 'New Type:' ), { target: { value: 'Bag' } } );
					fireEvent.click( screen.getByRole( 'button', { name: 'update type' } ) );
					await wait(() => {
						const netCount = tranformRenderCount( renderCount, baseRenderCount );
						expect( netCount.PriceSticker ).toBe( 0 );
						expect( netCount.ProductDescription ).toBe( 0 ); // unaffected: no new ProductType data
						expect( netCount.Editor ).toBe( 0 );
						expect( netCount.TallyDisplay ).toBe( 0 ); // unaffected: no new ProductType data
					});
					cleanupPerfTest();
				} );
			} );
		} );
	} );
	describe( 'store updates from outside the Provider tree', () => {
		describe( 'with pure-component children', () => {
			test( 'only re-renders children affected by the Provider parent prop change', async () => {
				const { renderCount } = perf( React );
				render( <AppWithPureChildren /> );
				let baseRenderCount;
				await wait(() => {
					baseRenderCount = tranformRenderCount( renderCount );
				});
				fireEvent.keyUp( screen.getByLabelText( 'Type:', { key: 'A', code: 'KeyA' } ) );
				await wait(() => {
					const netCount = tranformRenderCount( renderCount, baseRenderCount );
					expect( netCount.PriceSticker ).toBe( 0 ); // unaffected: no use for productType data
					expect( netCount.ProductDescription ).toBe( 1 );
					expect( netCount.Editor ).toBe( 0 ); // unaffected: no use for productType data
					expect( netCount.TallyDisplay ).toBe( 1 );
				});
				cleanupPerfTest();
			} );
			test( 'only re-renders parts of the Provider tree directly affected by the Provider parent state update', async () => {
				const { renderCount } = perf( React );
				render( <AppWithPureChildren /> );
				let baseRenderCount;
				await wait(() => {
					baseRenderCount = tranformRenderCount( renderCount );
				});
				fireEvent.keyUp( screen.getByLabelText( '$', { key: '5', code: 'Key5' } ) );
				await wait(() => {
					const netCount = tranformRenderCount( renderCount, baseRenderCount );
					expect( netCount.PriceSticker ).toBe( 1 );
					expect( netCount.ProductDescription ).toBe( 0 ); // unaffected: no use for price data
					expect( netCount.Editor ).toBe( 0 ); // unaffected: no use for price data
					expect( netCount.TallyDisplay ).toBe( 1 );
				});
				cleanupPerfTest();
			} );
		} );
		describe( 'with non pure-component children ', () => {
			test( 're-renders all Provider tree on Provider parent prop change', async () => {
				const { renderCount } = perf( React );
				render( <AppNormal /> );
				let baseRenderCount;
				await wait(() => {
					baseRenderCount = tranformRenderCount( renderCount );
				});
				fireEvent.keyUp( screen.getByLabelText( 'Type:', { key: 'A', code: 'KeyA' } ) );
				await wait(() => {
					const netCount = tranformRenderCount( renderCount, baseRenderCount );
					expect( netCount.PriceSticker ).toBe( 2 ); // unaffected: no use for productType data
					expect( netCount.ProductDescription ).toBe( 3 );
					expect( netCount.Editor ).toBe( 2 ); // unaffected: no use for productType data
					expect( netCount.TallyDisplay ).toBe( 3 );
				});
				cleanupPerfTest();
			} );
			test( 're-renders all Provider tree on Provider parent state update', async () => {
				const { renderCount } = perf( React );
				render( <AppNormal /> );
				let baseRenderCount;
				await wait(() => {
					baseRenderCount = tranformRenderCount( renderCount );
				});
				fireEvent.keyUp( screen.getByLabelText( '$', { key: '5', code: 'Key5' } ) );
				await wait(() => {
					const netCount = tranformRenderCount( renderCount, baseRenderCount );
					expect( netCount.PriceSticker ).toBe( 2 );
					expect( netCount.ProductDescription ).toBe( 1 ); // unaffected: no use for price data
					expect( netCount.Editor ).toBe( 1 ); // unaffected: no use for price data
					expect( netCount.TallyDisplay ).toBe( 2 );
				});
				cleanupPerfTest();
			} );
		} );
	} );
} );
