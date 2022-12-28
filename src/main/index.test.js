import React from 'react';

import clonedeep from 'lodash.clonedeep';

import { cleanup as cleanupPerfTest, perf, wait } from 'react-performance-testing';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { renderHook } from '@testing-library/react-hooks';

import '@testing-library/jest-dom';

import { connect, UsageError, useContext } from '.';

import createSourceData from '../test-artifacts/data/create-state-obj';

import AppNormal, { ObservableContext, Product, TallyDisplay } from './test-apps/normal';
import AppWithConnectedChildren from './test-apps/with-connected-children';
import AppWithPureChildren from './test-apps/with-pure-children';

beforeAll(() => {
	jest.spyOn( console, 'log' ).mockImplementation(() => {});
	jest.spyOn( console, 'error' ).mockImplementation(() => {});
});
afterAll(() => jest.resetAllMocks());
afterEach( cleanup );

const tranformRenderCount = ( renderCount, baseRenderCount = {} ) => {
	const netCount = {};
	for( const k of new Set([
		...Object.keys( renderCount.current ),
		...Object.keys( baseRenderCount )
	]) ) {
		netCount[ k ] = ( renderCount.current[ k ]?.value || 0 ) - ( baseRenderCount[ k ] || 0 );
	}
	return netCount;
};

describe( 'ReactObservableContext', () => {
	test( 'throws usage error on attempts to use context store outside of the Provider component tree', () => {
		// note: TallyDisplay component utilizes the ReactObservableContext store
		expect(() => render( <TallyDisplay /> )).toThrow( UsageError );
	} );
	describe( 'store updates from within the Provider tree', () => {
		describe( 'updates only subscribed components', () => {
			describe( 'using connected store subscribers', () => {
				test( 'scenario 1', async () => {
					const { renderCount } = perf( React );
					render( <AppWithConnectedChildren /> );
					let baseRenderCount;
					await wait(() => { baseRenderCount = tranformRenderCount( renderCount ) });
					fireEvent.change( screen.getByLabelText( 'New Price:' ), { target: { value: '123' } } );
					fireEvent.click( screen.getByRole( 'button', { name: 'update price' } ) );
					await wait(() => {
						const netCount = tranformRenderCount( renderCount, baseRenderCount );
						expect( netCount.CustomerPhoneDisplay ).toBe( 0 ); // unaffected: no use for price data
						expect( netCount.Editor ).toBe( 0 ); // unaffected: no use for price data
						expect( netCount.PriceSticker ).toBe( 1 );
						expect( netCount.ProductDescription ).toBe( 0 ); // unaffected: no use for price data
						expect( netCount.Reset ).toBe( 0 ); // unaffected: no use for price data
						expect( netCount.TallyDisplay ).toBe( 1 );
					});
					cleanupPerfTest();
				} );
				test( 'scenario 2', async () => {
					const { renderCount } = perf( React );
					render( <AppWithConnectedChildren /> );
					let baseRenderCount;
					await wait(() => { baseRenderCount = tranformRenderCount( renderCount ) });
					fireEvent.change( screen.getByLabelText( 'New Color:' ), { target: { value: 'Navy' } } );
					fireEvent.click( screen.getByRole( 'button', { name: 'update color' } ) );
					await wait(() => {
						const netCount = tranformRenderCount( renderCount, baseRenderCount );
						expect( netCount.CustomerPhoneDisplay ).toBe( 0 ); // unaffected: no use for product color data
						expect( netCount.Editor ).toBe( 0 ); // unaffected: no use for product color data
						expect( netCount.PriceSticker ).toBe( 0 ); // unaffected: no use for product color data
						expect( netCount.ProductDescription ).toBe( 1 );
						expect( netCount.Reset ).toBe( 0 ); // unaffected: no use for product color data
						expect( netCount.TallyDisplay ).toBe( 1 );
					});
					cleanupPerfTest();
				} );
				test( 'scenario 3', async () => {
					const { renderCount } = perf( React );
					render( <AppWithConnectedChildren /> );
					let baseRenderCount;
					await wait(() => { baseRenderCount = tranformRenderCount( renderCount ) });
					fireEvent.change( screen.getByLabelText( 'New Type:' ), { target: { value: 'Bag' } } );
					fireEvent.click( screen.getByRole( 'button', { name: 'update type' } ) );
					await wait(() => {
						const netCount = tranformRenderCount( renderCount, baseRenderCount );
						expect( netCount.CustomerPhoneDisplay ).toBe( 0 ); // unaffected: no use for product type data
						expect( netCount.Editor ).toBe( 0 ); // unaffected: no use for product type data
						expect( netCount.PriceSticker ).toBe( 0 ); // unaffected: no use for product type data
						expect( netCount.ProductDescription ).toBe( 1 );
						expect( netCount.Reset ).toBe( 0 ); // unaffected: no use for product type data
						expect( netCount.TallyDisplay ).toBe( 1 );
					});
					cleanupPerfTest();
				} );
				test( 'does not render subscribed components for resubmitted changes', async () => {
					const { renderCount } = perf( React );
					render( <AppWithConnectedChildren /> );
					fireEvent.change( screen.getByLabelText( 'New Type:' ), { target: { value: 'Bag' } } );
					fireEvent.click( screen.getByRole( 'button', { name: 'update type' } ) );
					let baseRenderCount;
					await wait(() => { baseRenderCount = tranformRenderCount( renderCount ) });
					fireEvent.change( screen.getByLabelText( 'New Type:' ), { target: { value: 'Bag' } } );
					fireEvent.click( screen.getByRole( 'button', { name: 'update type' } ) );
					await wait(() => {
						const netCount = tranformRenderCount( renderCount, baseRenderCount );
						expect( netCount.CustomerPhoneDisplay ).toBe( 0 ); // unaffected: no new product type data
						expect( netCount.Editor ).toBe( 0 ); // unaffected: no new product type data
						expect( netCount.PriceSticker ).toBe( 0 ); // unaffected: no new product type data
						expect( netCount.ProductDescription ).toBe( 0 ); // unaffected: no new product type data
						expect( netCount.Reset ).toBe( 0 ); // unaffected: no new product type data
						expect( netCount.TallyDisplay ).toBe( 0 ); // unaffected: no new product type data
					});
					cleanupPerfTest();
				} );
			} );
			describe( 'using pure-component store subscribers', () => {
				test( 'scenario 1', async () => {
					const { renderCount } = perf( React );
					render( <AppWithPureChildren /> );
					let baseRenderCount;
					await wait(() => { baseRenderCount = tranformRenderCount( renderCount ) });
					fireEvent.change( screen.getByLabelText( 'New Price:' ), { target: { value: '123' } } );
					fireEvent.click( screen.getByRole( 'button', { name: 'update price' } ) );
					await wait(() => {
						const netCount = tranformRenderCount( renderCount, baseRenderCount );
						expect( netCount.CustomerPhoneDisplay ).toBe( 0 ); // unaffected: no use for price data
						expect( netCount.Editor ).toBe( 0 ); // unaffected: no use for price data
						expect( netCount.PriceSticker ).toBe( 1 );
						expect( netCount.ProductDescription ).toBe( 0 ); // unaffected: no use for price data
						expect( netCount.Reset ).toBe( 0 ); // unaffected: no use for price data
						expect( netCount.TallyDisplay ).toBe( 1 );
					});
					cleanupPerfTest();
				} );
				test( 'scenario 2', async () => {
					const { renderCount } = perf( React );
					render( <AppWithPureChildren /> );
					let baseRenderCount;
					await wait(() => { baseRenderCount = tranformRenderCount( renderCount ) });
					fireEvent.change( screen.getByLabelText( 'New Color:' ), { target: { value: 'Navy' } } );
					fireEvent.click( screen.getByRole( 'button', { name: 'update color' } ) );
					await wait(() => {
						const netCount = tranformRenderCount( renderCount, baseRenderCount );
						expect( netCount.CustomerPhoneDisplay ).toBe( 0 ); // unaffected: no use for product color data
						expect( netCount.Editor ).toBe( 0 ); // unaffected: no use for product color data
						expect( netCount.PriceSticker ).toBe( 0 ); // unaffected: no use for product color data
						expect( netCount.ProductDescription ).toBe( 1 );
						expect( netCount.Reset ).toBe( 0 ); // unaffected: no use for product color data
						expect( netCount.TallyDisplay ).toBe( 1 );
					});
					cleanupPerfTest();
				} );
				test( 'scenario 3', async () => {
					const { renderCount } = perf( React );
					render( <AppWithPureChildren /> );
					let baseRenderCount;
					await wait(() => { baseRenderCount = tranformRenderCount( renderCount ) });
					fireEvent.change( screen.getByLabelText( 'New Type:' ), { target: { value: 'Bag' } } );
					fireEvent.click( screen.getByRole( 'button', { name: 'update type' } ) );
					await wait(() => {
						const netCount = tranformRenderCount( renderCount, baseRenderCount );
						expect( netCount.CustomerPhoneDisplay ).toBe( 0 ); // unaffected: no use for product type data
						expect( netCount.Editor ).toBe( 0 ); // unaffected: no use for product type data
						expect( netCount.PriceSticker ).toBe( 0 ); // unaffected: no use for product type data
						expect( netCount.ProductDescription ).toBe( 1 );
						expect( netCount.Reset ).toBe( 0 ); // unaffected: no use for product type data
						expect( netCount.TallyDisplay ).toBe( 1 );
					});
					cleanupPerfTest();
				} );
				test( 'does not render subscribed components for resubmitted changes', async () => {
					const { renderCount } = perf( React );
					render( <AppWithPureChildren /> );
					fireEvent.change( screen.getByLabelText( 'New Type:' ), { target: { value: 'Bag' } } );
					fireEvent.click( screen.getByRole( 'button', { name: 'update type' } ) );
					let baseRenderCount;
					await wait(() => { baseRenderCount = tranformRenderCount( renderCount ) });
					fireEvent.change( screen.getByLabelText( 'New Type:' ), { target: { value: 'Bag' } } );
					fireEvent.click( screen.getByRole( 'button', { name: 'update type' } ) );
					await wait(() => {
						const netCount = tranformRenderCount( renderCount, baseRenderCount );
						expect( netCount.CustomerPhoneDisplay ).toBe( 0 );
						expect( netCount.Editor ).toBe( 0 );
						expect( netCount.PriceSticker ).toBe( 0 );
						expect( netCount.ProductDescription ).toBe( 0 ); // unaffected: no new product type data
						expect( netCount.Reset ).toBe( 0 );
						expect( netCount.TallyDisplay ).toBe( 0 ); // unaffected: no new product type data
					});
					cleanupPerfTest();
				} );
			} );
			describe( 'using non pure-component store subscribers', () => {
				test( 'scenario 1', async () => {
					const { renderCount } = perf( React );
					render( <AppNormal /> );
					let baseRenderCount;
					await wait(() => { baseRenderCount = tranformRenderCount( renderCount ) });
					fireEvent.change( screen.getByLabelText( 'New Price:' ), { target: { value: '123' } } );
					fireEvent.click( screen.getByRole( 'button', { name: 'update price' } ) );
					await wait(() => {
						const netCount = tranformRenderCount( renderCount, baseRenderCount );
						expect( netCount.CustomerPhoneDisplay ).toBe( 1 ); // UPDATED BY REACT PROPAGATION (b/c no memoization)
						expect( netCount.Editor ).toBe( 0 ); // unaffected: no use for product price data
						expect( netCount.PriceSticker ).toBe( 1 );
						expect( netCount.ProductDescription ).toBe( 0 ); // unaffected: no use for product price data
						expect( netCount.Reset ).toBe( 1 ); // UPDATED BY REACT PROPAGATION (b/c no memoization)
						expect( netCount.TallyDisplay ).toBe( 1 );
					});
					cleanupPerfTest();
				} );
				test( 'scenario 2', async () => {
					const { renderCount } = perf( React );
					render( <AppNormal /> );
					let baseRenderCount;
					await wait(() => { baseRenderCount = tranformRenderCount( renderCount ) });
					fireEvent.change( screen.getByLabelText( 'New Color:' ), { target: { value: 'Navy' } } );
					fireEvent.click( screen.getByRole( 'button', { name: 'update color' } ) );
					await wait(() => {
						const netCount = tranformRenderCount( renderCount, baseRenderCount );
						expect( netCount.CustomerPhoneDisplay ).toBe( 1 ); // UPDATED BY REACT PROPAGATION (b/c no memoization)
						expect( netCount.Editor ).toBe( 0 ); // unaffected: no use for product price data
						expect( netCount.PriceSticker ).toBe( 0 ); // unaffected: no use for product price data
						expect( netCount.ProductDescription ).toBe( 1 );
						expect( netCount.Reset ).toBe( 1 ); // UPDATED BY REACT PROPAGATION (b/c no memoization)
						expect( netCount.TallyDisplay ).toBe( 1 );
					});
					cleanupPerfTest();
				} );
				test( 'scenario 3', async () => {
					const { renderCount } = perf( React );
					render( <AppNormal /> );
					let baseRenderCount;
					await wait(() => { baseRenderCount = tranformRenderCount( renderCount ) });
					fireEvent.change( screen.getByLabelText( 'New Type:' ), { target: { value: 'Bag' } } );
					fireEvent.click( screen.getByRole( 'button', { name: 'update type' } ) );
					await wait(() => {
						const netCount = tranformRenderCount( renderCount, baseRenderCount );
						expect( netCount.CustomerPhoneDisplay ).toBe( 1 ); // UPDATED BY REACT PROPAGATION (b/c no memoization)
						expect( netCount.Editor ).toBe( 0 ); // unaffected: no use for product type data
						expect( netCount.PriceSticker ).toBe( 0 ); // unaffected: no use for product type data
						expect( netCount.ProductDescription ).toBe( 1 );
						expect( netCount.Reset ).toBe( 1 ); // UPDATED BY REACT PROPAGATION (b/c no memoization)
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
					await wait(() => { baseRenderCount = tranformRenderCount( renderCount ) });
					fireEvent.change( screen.getByLabelText( 'New Type:' ), { target: { value: 'Bag' } } );
					fireEvent.click( screen.getByRole( 'button', { name: 'update type' } ) );
					await wait(() => {
						const netCount = tranformRenderCount( renderCount, baseRenderCount );
						expect( netCount.CustomerPhoneDisplay ).toBe( 0 );
						expect( netCount.Editor ).toBe( 0 );
						expect( netCount.PriceSticker ).toBe( 0 );
						expect( netCount.ProductDescription ).toBe( 0 ); // unaffected: no new product type data
						expect( netCount.Reset ).toBe( 0 );
						expect( netCount.TallyDisplay ).toBe( 0 ); // unaffected: no new product type data
					});
					cleanupPerfTest();
				} );
			} );
		} );
	} );
	describe( 'store updates from outside the Provider tree', () => {
		describe( 'with connected component children', () => {
			test( 'only re-renders Provider children affected by the Provider parent prop change', async () => {
				const { renderCount } = perf( React );
				render( <AppWithConnectedChildren /> );
				let baseRenderCount;
				await wait(() => { baseRenderCount = tranformRenderCount( renderCount ); });
				fireEvent.keyUp( screen.getByLabelText( 'Type:' ), { target: { value: 'A' } } );
				await wait(() => {
					const netCount = tranformRenderCount( renderCount, baseRenderCount );
					expect( netCount.CustomerPhoneDisplay ).toBe( 0 ); // unaffected: no use for product type data
					expect( netCount.Editor ).toBe( 0 ); // unaffected: no use for product type data
					expect( netCount.PriceSticker ).toBe( 0 ); // unaffected: no use for product type data
					expect( netCount.ProductDescription ).toBe( 1 );
					expect( netCount.Reset ).toBe( 0 ); // unaffected: no use for product type data
					expect( netCount.TallyDisplay ).toBe( 1 );
				});
				cleanupPerfTest();
			} );
			test( 'only re-renders parts of the Provider tree directly affected by the Provider parent state update', async () => {
				const { renderCount } = perf( React );
				render( <AppWithConnectedChildren /> );
				let baseRenderCount;
				await wait(() => { baseRenderCount = tranformRenderCount( renderCount ); });
				fireEvent.keyUp( screen.getByLabelText( '$', { key: '5', code: 'Key5' } ) );
				await wait(() => {
					const netCount = tranformRenderCount( renderCount, baseRenderCount );
					expect( netCount.CustomerPhoneDisplay ).toBe( 0 ); // unaffected: no use for product price data
					expect( netCount.Editor ).toBe( 0 ); // unaffected: no use for product price data
					expect( netCount.PriceSticker ).toBe( 1 );
					expect( netCount.ProductDescription ).toBe( 0 ); // unaffected: no use for product price data
					expect( netCount.Reset ).toBe( 0 ); // unaffected: no use for product price data
					expect( netCount.TallyDisplay ).toBe( 1 );
				});
				cleanupPerfTest();
			} );
		} );
		describe( 'with pure-component children', () => {
			test( 'only re-renders Provider children affected by the Provider parent prop change', async () => {
				const { renderCount } = perf( React );
				render( <AppWithPureChildren /> );
				let baseRenderCount;
				await wait(() => { baseRenderCount = tranformRenderCount( renderCount ); });
				fireEvent.keyUp( screen.getByLabelText( 'Type:' ), { target: { value: 'A' } } );
				await wait(() => {
					const netCount = tranformRenderCount( renderCount, baseRenderCount );
					expect( netCount.CustomerPhoneDisplay ).toBe( 0 ); // unaffected: no use for product type data
					expect( netCount.Editor ).toBe( 0 ); // unaffected: no use for product type data
					expect( netCount.PriceSticker ).toBe( 0 ); // unaffected: no use for product type data
					expect( netCount.ProductDescription ).toBe( 1 );
					expect( netCount.Reset ).toBe( 0 ); // unaffected: no use for product type data
					expect( netCount.TallyDisplay ).toBe( 1 );
				});
				cleanupPerfTest();
			} );
			test( 'only re-renders parts of the Provider tree directly affected by the Provider parent state update', async () => {
				const { renderCount } = perf( React );
				render( <AppWithPureChildren /> );
				let baseRenderCount;
				await wait(() => { baseRenderCount = tranformRenderCount( renderCount ); });
				fireEvent.keyUp( screen.getByLabelText( '$', { key: '5', code: 'Key5' } ) );
				await wait(() => {
					const netCount = tranformRenderCount( renderCount, baseRenderCount );
					expect( netCount.CustomerPhoneDisplay ).toBe( 0 ); // unaffected: no use for product price data
					expect( netCount.Editor ).toBe( 0 ); // unaffected: no use for product price data
					expect( netCount.PriceSticker ).toBe( 1 );
					expect( netCount.ProductDescription ).toBe( 0 ); // unaffected: no use for product price data
					expect( netCount.Reset ).toBe( 0 ); // unaffected: no use for product price data
					expect( netCount.TallyDisplay ).toBe( 1 );
				});
				cleanupPerfTest();
			} );
		} );
		describe( 'with non pure-component children ', () => {
			test( 'only re-renders Provider children affected by the Provider parent prop change', async () => {
				const { renderCount } = perf( React );
				render( <AppNormal /> );
				let baseRenderCount;
				await wait(() => { baseRenderCount = tranformRenderCount( renderCount ); });
				fireEvent.keyUp( screen.getByLabelText( 'Type:' ), { target: { value: 'A' } } );
				await wait(() => {
					const netCount = tranformRenderCount( renderCount, baseRenderCount );
					expect( netCount.CustomerPhoneDisplay ).toBe( 1 ); // UPDATED BY REACT PROPAGATION (b/c no memoization)
					expect( netCount.Editor ).toBe( 0 ); // unaffected: no use for product type data
					expect( netCount.PriceSticker ).toBe( 0 ); // unaffected: no use for product type data
					expect( netCount.ProductDescription ).toBe( 1 );
					expect( netCount.Reset ).toBe( 1 ); // UPDATED BY REACT PROPAGATION (b/c no memoization)
					expect( netCount.TallyDisplay ).toBe( 1 );
				});
				cleanupPerfTest();
			} );
			test( 'oonly re-renders parts of the Provider tree directly affected by the Provider parent state update', async () => {
				const { renderCount } = perf( React );
				render( <AppNormal /> );
				let baseRenderCount;
				await wait(() => { baseRenderCount = tranformRenderCount( renderCount ); });
				fireEvent.keyUp( screen.getByLabelText( '$', { key: '5', code: 'Key5' } ) );
				await wait(() => {
					const netCount = tranformRenderCount( renderCount, baseRenderCount );
					expect( netCount.CustomerPhoneDisplay ).toBe( 1 ); // UPDATED BY REACT PROPAGATION (b/c no memoization)
					expect( netCount.Editor ).toBe( 0 ); // unaffected: no use for product price data
					expect( netCount.PriceSticker ).toBe( 1 );
					expect( netCount.ProductDescription ).toBe( 0 ); // unaffected: no use for product price data
					expect( netCount.Reset ).toBe( 1 ); // UPDATED BY REACT PROPAGATION (b/c no memoization)
					expect( netCount.TallyDisplay ).toBe( 1 );
				});
				cleanupPerfTest();
			} );
		} );
	} );
	describe( 'prehooks', () => {
		describe( 'resetState prehook', () => {
			describe( 'when `resetState` prehook does not exist on the context', () => {
				test( 'completes `store.resetState` method call', async () => {
					const { renderCount } = perf( React );
					const prehooks = {};
					render( <Product prehooks={ prehooks } type="Computer" /> );
					fireEvent.change( screen.getByLabelText( 'New Type:' ), { target: { value: 'Bag' } } );
					fireEvent.click( screen.getByRole( 'button', { name: 'update type' } ) );
					let baseRenderCount;
					await wait(() => { baseRenderCount = tranformRenderCount( renderCount ) });
					fireEvent.click( screen.getByRole( 'button', { name: 'reset context' } ) );
					await wait(() => {
						const netCount = tranformRenderCount( renderCount, baseRenderCount );
						expect( netCount.CustomerPhoneDisplay ).toBe( 1 ); // UPDATED BY REACT PROPAGATION (b/c no memoization)
						expect( netCount.Editor ).toBe( 0 ); // unaffected: no use for product type data
						expect( netCount.PriceSticker ).toBe( 0 ); // unaffected: no use for product type data
						expect( netCount.ProductDescription ).toBe( 1 ); // DULY UPDATED WITH NEW STATE RESET
						expect( netCount.Reset ).toBe( 1 ); // UPDATED BY REACT PROPAGATION (b/c no memoization)
						expect( netCount.TallyDisplay ).toBe( 1 ); // DULY UPDATED WITH NEW STATE RESET
					});
					cleanupPerfTest();
				} );
			} );
			describe( 'when `resetState` prehook exists on the context', () => {
				test( 'is called by the `store.resetState` method', async () => {
					const prehooks = Object.freeze({ resetState: jest.fn().mockReturnValue( false ) });
					render( <Product prehooks={ prehooks } type="Computer" /> );
					fireEvent.change( screen.getByLabelText( 'New Type:' ), { target: { value: 'Bag' } } );
					fireEvent.click( screen.getByRole( 'button', { name: 'update type' } ) );
					fireEvent.change( screen.getByLabelText( 'New Color:' ), { target: { value: 'Teal' } } );
					fireEvent.click( screen.getByRole( 'button', { name: 'update color' } ) );
					prehooks.resetState.mockClear();
					fireEvent.click( screen.getByRole( 'button', { name: 'reset context' } ) );
					expect( prehooks.resetState ).toHaveBeenCalledTimes( 1 );
					expect( prehooks.resetState ).toHaveBeenCalledWith({
						// data slices from original state to reset current state slices
						color: 'Burgundy',
						customer: {
							name: { first: null, last: null },
							phone: null
						},
						price: 22.5,
						type: 'Computer'
					}, {
						// current: context state value after the `update type` & `update color` button clicks
						current: {
							color: 'Teal',
							customer: {
								name: { first: null, last: null },
								phone: null
							},
							price: 22.5,
							type: 'Bag'
						},
						// original: obtained from the './normal' Product >> Provider value prop
						original: {
							color: 'Burgundy',
							customer: {
								name: { first: null, last: null },
								phone: null
							},
							price: 22.5,
							type: 'Computer'
						}
					});
				} );
				test( 'completes `store.setState` method call if `setState` prehook returns TRUTHY', async () => {
					const { renderCount } = perf( React );
					const prehooks = Object.freeze({ resetState: jest.fn().mockReturnValue( true ) });
					render( <Product prehooks={ prehooks } type="Computer" /> );
					fireEvent.change( screen.getByLabelText( 'New Type:' ), { target: { value: 'Bag' } } );
					fireEvent.click( screen.getByRole( 'button', { name: 'update type' } ) );
					let baseRenderCount;
					await wait(() => { baseRenderCount = tranformRenderCount( renderCount ) });
					fireEvent.click( screen.getByRole( 'button', { name: 'reset context' } ) );
					await wait(() => {
						const netCount = tranformRenderCount( renderCount, baseRenderCount );
						expect( netCount.CustomerPhoneDisplay ).toBe( 1 ); // UPDATED BY REACT PROPAGATION (b/c no memoization)
						expect( netCount.Editor ).toBe( 0 ); // unaffected: no use for product type data
						expect( netCount.PriceSticker ).toBe( 0 ); // unaffected: no use for product type data
						expect( netCount.ProductDescription ).toBe( 1 ); // DULY UPDATED WITH NEW STATE RESET
						expect( netCount.Reset ).toBe( 1 ); // UPDATED BY REACT PROPAGATION (b/c no memoization)
						expect( netCount.TallyDisplay ).toBe( 1 ); // DULY UPDATED WITH NEW STATE RESET
					});
					cleanupPerfTest();
				} );
				test( 'aborts `store.setState` method call if `setState` prehook returns FALSY', async () => {
					const { renderCount } = perf( React );
					const prehooks = Object.freeze({ resetState: jest.fn().mockReturnValue( false ) });
					render( <Product prehooks={ prehooks } type="Computer" /> );
					fireEvent.change( screen.getByLabelText( 'New Type:' ), { target: { value: 'Bag' } } );
					fireEvent.click( screen.getByRole( 'button', { name: 'update type' } ) );
					let baseRenderCount;
					await wait(() => { baseRenderCount = tranformRenderCount( renderCount ) });
					fireEvent.click( screen.getByRole( 'button', { name: 'reset context' } ) );
					await wait(() => {
						const netCount = tranformRenderCount( renderCount, baseRenderCount );
						expect( netCount.CustomerPhoneDisplay ).toBe( 0 ); // unaffected: no use for product type data
						expect( netCount.Editor ).toBe( 0 ); // unaffected: no use for product type data
						expect( netCount.PriceSticker ).toBe( 0 ); // unaffected: no use for product type data
						expect( netCount.ProductDescription ).toBe( 0 ); // NORMAL UPDATE DUE CANCELED: RESET STATE ABORTED
						expect( netCount.Reset ).toBe( 0 ); // unaffected: no use for product type data
						expect( netCount.TallyDisplay ).toBe( 0 ); // NORMAL UPDATE DUE CANCELED: RESET STATE ABORTED
					});
					cleanupPerfTest();
				} );
			} );
		} );
		describe( 'setState prehook', () => {
			describe( 'when `setState` prehook does not exist on the context', () => {
				test( 'completes `store.setState` method call', async () => {
					const { renderCount } = perf( React );
					const prehooks = Object.freeze( expect.any( Object ) );
					render( <Product prehooks={ prehooks } type="Computer" /> );
					let baseRenderCount;
					await wait(() => { baseRenderCount = tranformRenderCount( renderCount ) });
					fireEvent.change( screen.getByLabelText( 'New Type:' ), { target: { value: 'Bag' } } );
					fireEvent.click( screen.getByRole( 'button', { name: 'update type' } ) );
					await wait(() => {
						const netCount = tranformRenderCount( renderCount, baseRenderCount );
						expect( netCount.CustomerPhoneDisplay ).toBe( 1 ); // UPDATED BY REACT PROPAGATION (b/c no memoization)
						expect( netCount.Editor ).toBe( 0 ); // unaffected: no use for product type data
						expect( netCount.PriceSticker ).toBe( 0 ); // unaffected: no use for product type data
						expect( netCount.ProductDescription ).toBe( 1 ); // DULY UPDATED WITH NEW STATE CHANGE
						expect( netCount.Reset ).toBe( 1 ); // UPDATED BY REACT PROPAGATION (b/c no memoization)
						expect( netCount.TallyDisplay ).toBe( 1 ); // DULY UPDATED WITH NEW STATE CHANGE
					});
					cleanupPerfTest();
				} );
			} );
			describe( 'when `setState` prehook exists on the context', () => {
				test( 'is called by the `store.setState` method', async () => {
					const prehooks = Object.freeze({ setState: jest.fn().mockReturnValue( false ) });
					render( <Product prehooks={ prehooks } type="Computer" /> );
					prehooks.setState.mockClear();
					fireEvent.change( screen.getByLabelText( 'New Type:' ), { target: { value: 'Bag' } } );
					fireEvent.click( screen.getByRole( 'button', { name: 'update type' } ) );
					expect( prehooks.setState ).toHaveBeenCalledTimes( 1 );
					expect( prehooks.setState ).toHaveBeenCalledWith({ type: 'Bag' });
				} );
				test( 'completes `store.setState` method call if `setState` prehook returns TRUTHY', async () => {
					const { renderCount } = perf( React );
					const prehooks = Object.freeze({ setState: jest.fn().mockReturnValue( true ) });
					render( <Product prehooks={ prehooks } type="Computer" /> );
					let baseRenderCount;
					await wait(() => { baseRenderCount = tranformRenderCount( renderCount ) });
					fireEvent.change( screen.getByLabelText( 'New Type:' ), { target: { value: 'Bag' } } );
					fireEvent.click( screen.getByRole( 'button', { name: 'update type' } ) );
					await wait(() => {
						const netCount = tranformRenderCount( renderCount, baseRenderCount );
						expect( netCount.CustomerPhoneDisplay ).toBe( 1 ); // UPDATED BY REACT PROPAGATION (b/c no memoization)
						expect( netCount.Editor ).toBe( 0 ); // unaffected: no use for product type data
						expect( netCount.PriceSticker ).toBe( 0 ); // unaffected: no use for product type data
						expect( netCount.ProductDescription ).toBe( 1 ); // DULY UPDATED WITH NEW STATE CHANGE
						expect( netCount.Reset ).toBe( 1 ); // UPDATED BY REACT PROPAGATION (b/c no memoization)
						expect( netCount.TallyDisplay ).toBe( 1 ); // DULY UPDATED WITH NEW STATE CHANGE
					});
					cleanupPerfTest();
				} );
				test( 'aborts `store.setState` method call if `setState` prehook returns FALSY', async () => {
					const { renderCount } = perf( React );
					const prehooks = Object.freeze({ setState: jest.fn().mockReturnValue( false ) });
					render( <Product prehooks={ prehooks } type="Computer" /> );
					let baseRenderCount;
					await wait(() => { baseRenderCount = tranformRenderCount( renderCount ) });
					fireEvent.change( screen.getByLabelText( 'New Type:' ), { target: { value: 'Bag' } } );
					fireEvent.click( screen.getByRole( 'button', { name: 'update type' } ) );
					await wait(() => {
						const netCount = tranformRenderCount( renderCount, baseRenderCount );
						expect( netCount.CustomerPhoneDisplay ).toBe( 0 ); // unaffected: no use for product type data
						expect( netCount.Editor ).toBe( 0 ); // unaffected: no use for product type data
						expect( netCount.PriceSticker ).toBe( 0 ); // unaffected: no use for product type data
						expect( netCount.ProductDescription ).toBe( 0 ); // NORMAL UPDATE DUE CANCELED: SET STATE ABORTED
						expect( netCount.Reset ).toBe( 0 ); // unaffected: no use for product type data
						expect( netCount.TallyDisplay ).toBe( 0 ); // NORMAL UPDATE DUE CANCELED: SET STATE ABORTED
					});
					cleanupPerfTest();
				} );
			} );
		} );
	} );
	describe( 'API', () => {
		describe( 'connect(...)', () => {
			let connector, selectorMap;
			let ConnectedComponent1, ConnectedComponent2;
			let compOneProps, compTwoProps
			beforeAll(() => {
				selectorMap = { box: 'items.1.name' };
				connector = connect( ObservableContext, selectorMap );
				ConnectedComponent1 = connector( props => { compOneProps = props; return null } );
				ConnectedComponent2 = connector( props => { compTwoProps = props; return null } );
			});
			test( 'returns a function', () => expect( connector ).toBeInstanceOf( Function ) );
			describe( 'returned function\'s return value', () => {
				let state;
				beforeAll(() => {
					state = {
						items: [
							{ name: 'box_0' },
							{ name: 'box_1' },
							{ name: 'box_2' },
							{ name: 'box_3' }
						]
					};
					render(
						<ObservableContext.Provider value={ state }>
							<ConnectedComponent1 />
							<ConnectedComponent2 />
						</ObservableContext.Provider>
					);
				});
				test( 'is always a memoized component', () => {
					expect( 'compare' in ConnectedComponent1 ).toBe( true );
					expect( 'compare' in ConnectedComponent2 ).toBe( true );
				} );
				test( 'is always interested in the same context state data', () => {
					expect( compOneProps.data ).toStrictEqual( compTwoProps.data );
				} );
				test( 'contains the store\'s public API', () => {
					const data = {};
					for( const k in selectorMap ) { data[ k ] = expect.anything() }
					expect( compOneProps ).toEqual({
						data,
						resetState: expect.any( Function ),
						setState: expect.any( Function )
					});
				} );
				test( 'accepts own props (i.e. additional props at runtime)', () => {
					let capturedProps;
					const selectorMap = {
						fullBox2: 'items[1]',
						nameFirstBox: 'items.0.name'
					};
					const ConnectedComponent = connect( ObservableContext, selectorMap )(
						props => { capturedProps = props; return null }
					);
					const ownProps = {
						anotherOwnProp: expect.anything(),
						ownProp: expect.anything()
					};
					render(
						<ObservableContext.Provider value={ state }>
							<ConnectedComponent { ...ownProps } />
						</ObservableContext.Provider>
					);
					const data = {};
					for( const k in selectorMap ) { data[ k ] = expect.anything() }
					expect( capturedProps ).toEqual({
						...ownProps,
						data,
						resetState: expect.any( Function ),
						setState: expect.any( Function )
					});
				} );
				describe( 'prop name onflict resolution: ownProps vs store API props', () => {
					test( 'defaults to ownProps', () => {
						let capturedProps;
						const selectorMap = {
							fullBox2: 'items[1]',
							nameFirstBox: 'items.0.name'
						};
						const ConnectedComponent = connect( ObservableContext, selectorMap )(
							props => { capturedProps = props; return null }
						);
						const ownProps = {
							data: {
								anotherOwnProp: expect.anything(),
								ownProp: expect.anything()
							}
						};
						render(
							<ObservableContext.Provider value={ state }>
								<ConnectedComponent { ...ownProps } />
							</ObservableContext.Provider>
						);
						const data = {};
						for( const k in selectorMap ) { data[ k ] = expect.anything() }
						expect( capturedProps ).toEqual({
							...ownProps, // using `data` from ownProps
							resetState: expect.any( Function ),
							setState: expect.any( Function )
						});
					} );
				} );
			} );
		} );
		describe( 'createContext(...)', () => {
			test( 'returns observable context provider', () => {
				expect( ObservableContext._currentValue ).toEqual({
					getState: expect.any( Function ),
					resetState: expect.any( Function ),
					setState: expect.any( Function ),
					subscribe: expect.any( Function )
				});
				expect( ObservableContext._defaultValue ).toBeNull();
				expect( ObservableContext.Consumer ).toBeInstanceOf( Object );
				expect( ObservableContext.Provider ).toBeInstanceOf( Function );
			} );
		} );
		describe( 'useContext(...)', () => {
			let Client, renderUseContextHook, Wrapper;
			beforeAll(() => {
				/**
				 * @type {(initialProps: RenderUseContextProps) => RenderHookResult<
				 *	RenderUseContextProps, ContextConsumerMock, Renderer<RenderUseContextProps>
				 * >}
				 */
				renderUseContextHook = initialProps => renderHook(
					p => useContext( p.context, p.selectorMap ),
					{ initialProps }
				);
				/* eslint-disable react/display-name */
				Client = ({ selectorMap, onChange }) => {
					const store = useContext( ObservableContext, selectorMap );
					React.useMemo(() => onChange( store ), [ store ]);
					return null;
				};
				Client.displayName = 'Client';
				Wrapper = ({ children }) => (
					<ObservableContext.Provider value={ createSourceData() }>
						{ children }
					</ObservableContext.Provider>
				);
				Wrapper.displayName = 'Wrapper';
				/* eslint-disable react/display-name */
			});
			test( 'returns a observable context store', () => {
				/** @type {Store<SourceData>} */
				let store;
				const onChange = s => { store = s };
				render(
					<Wrapper>
						<Client onChange={ onChange } selectorMap={[ 'tags' ]} />
					</Wrapper>
				);
				expect( store ).toEqual({
					data: expect.any( Object ),
					resetState: expect.any( Function ),
					setState: expect.any( Function )
				});
			} );
			describe( 'selectorMap update', () => {
				describe( 'normal flow', () => {
					let mockConsumer, mockSetData, mockUnsubscribe;
					let reactUseEffectSpy, reactUseContextSpy, reactUseStateSpy;
					let selectorMapOnRender, selectorMapOnRerender;
					beforeAll(() => {
						selectorMapOnRender = {
							year3: 'history.places[2].year',
							isActive: 'isActive',
							tag6: 'tags[5]'
						};
						selectorMapOnRerender = clonedeep( selectorMapOnRender );
						selectorMapOnRerender.country3 = 'history.places[2].country';
						mockSetData = jest.fn();
						mockUnsubscribe = jest.fn();
						reactUseEffectSpy = jest.spyOn( React, 'useEffect' );
						reactUseStateSpy = jest.spyOn( React, 'useState' ).mockReturnValue([
							Object.values( selectorMapOnRender ).reduce(
								( o, k ) => { o[ k ] = expect.anything(); return o }, {}
							),
							mockSetData
						]);
						mockConsumer = {
							getState: () => Object.values( selectorMapOnRerender ).reduce(
								( o, k ) => { o[ k ] = expect.anything(); return o }, {}
							),
							resetState: () => {},
							subscribe: jest.fn().mockReturnValue( mockUnsubscribe ),
							unlinkCache: jest.fn()
						};
						reactUseContextSpy = jest.spyOn( React, 'useContext' ).mockReturnValue( mockConsumer );
						const { rerender } = renderUseContextHook({
							context: ObservableContext,
							selectorMap: selectorMapOnRender
						});
						mockConsumer.subscribe.mockClear();
						mockConsumer.unlinkCache.mockClear();
						reactUseEffectSpy.mockClear();
						rerender({
							context: ObservableContext,
							selectorMap: selectorMapOnRerender
						});
					});
					afterAll(() => {
						reactUseContextSpy.mockRestore();
						reactUseEffectSpy.mockRestore();
						reactUseStateSpy.mockRestore();
					} );
					test( 'adjusts the store on selctorMap change', () => {
						expect( reactUseEffectSpy.mock.calls[ 0 ][ 1 ] ).toEqual([
							Object.values( selectorMapOnRerender )
						]);
					} );
					test( 'cleans up all previous associations to the consumer', () => {
						expect( mockUnsubscribe ).toHaveBeenCalled();
						expect( mockConsumer.unlinkCache ).toHaveBeenCalled();
					} );
					describe( 'when the new selectorMap is not empty', () => {
						test( 'refreshes state data', () => {
							expect( mockSetData ).toHaveBeenCalled();
						} );
						test( 'sets up new subscription with the consumer', () => {
							expect( mockConsumer.subscribe ).toHaveBeenCalled();
						} );
					} );
				} );
				describe( 'when the new selectorMap is empty', () => {
					describe( 'and existing data is not empty', () => {
						let mockConsumer, mockSetData, mockUnsubscribe;
						let reactUseEffectSpy, reactUseContextSpy, reactUseStateSpy;
						let selectorMapOnRender, selectorMapOnRerender;
						beforeAll(() => {
							selectorMapOnRender = {
								year3: 'history.places[2].year',
								isActive: 'isActive',
								tag6: 'tags[5]'
							};
							selectorMapOnRerender = {};
							mockSetData = jest.fn();
							mockUnsubscribe = jest.fn();
							reactUseEffectSpy = jest.spyOn( React, 'useEffect' );
							reactUseStateSpy = jest.spyOn( React, 'useState' ).mockReturnValue([
								Object.values( selectorMapOnRender ).reduce(
									( o, k ) => { o[ k ] = expect.anything(); return o }, {}
								),
								mockSetData
							]);
							mockConsumer = {
								getState: () => Object.values( selectorMapOnRerender ).reduce(
									( o, k ) => { o[ k ] = expect.anything(); return o }, {}
								),
								resetState: () => {},
								subscribe: jest.fn().mockReturnValue( mockUnsubscribe ),
								unlinkCache: jest.fn()
							};
							reactUseContextSpy = jest.spyOn( React, 'useContext' ).mockReturnValue( mockConsumer );
							const { rerender } = renderUseContextHook({
								context: ObservableContext,
								selectorMap: selectorMapOnRender
							});
							mockConsumer.subscribe.mockClear();
							mockConsumer.unlinkCache.mockClear();
							reactUseEffectSpy.mockClear();
							mockUnsubscribe.mockClear();
							rerender({
								context: ObservableContext,
								selectorMap: selectorMapOnRerender
							});
						});
						afterAll(() => {
							reactUseContextSpy.mockRestore();
							reactUseEffectSpy.mockRestore();
							reactUseStateSpy.mockRestore();
						} );
						test( 'adjusts the store on selctorMap change', () => {
							expect(	reactUseEffectSpy.mock.calls[ 0 ][ 1 ] ).toEqual([[]]);
						} );
						test( 'cleans up all previous associations to the consumer', () => {
							expect( mockUnsubscribe ).toHaveBeenCalled();
							expect( mockConsumer.unlinkCache ).toHaveBeenCalled();
						} );
						test( 'refreshes state data with empty object', () => {
							expect( mockSetData ).toHaveBeenCalledWith({});
						} );
						test( 'does not set up new subscription with the consumer', () => {
							expect( mockConsumer.subscribe ).not.toHaveBeenCalled();
						} );
					} );
					describe( 'and existing data is empty', () => {
						let mockConsumer, mockSetData, mockUnsubscribe;
						let reactUseEffectSpy, reactUseContextSpy, reactUseStateSpy;
						let selectorMapOnRender;
						beforeAll(() => {
							selectorMapOnRender = {
								year3: 'history.places[2].year',
								isActive: 'isActive',
								tag6: 'tags[5]'
							};
							mockSetData = jest.fn();
							mockUnsubscribe = jest.fn();
							reactUseEffectSpy = jest.spyOn( React, 'useEffect' );
							reactUseStateSpy = jest.spyOn( React, 'useState' ).mockReturnValue([ {}, mockSetData ]);
							mockConsumer = {
								getState: () => ({}),
								resetState: () => {},
								subscribe: jest.fn().mockReturnValue( mockUnsubscribe ),
								unlinkCache: jest.fn()
							};
							reactUseContextSpy = jest.spyOn( React, 'useContext' ).mockReturnValue( mockConsumer );
							const { rerender } = renderUseContextHook({
								context: ObservableContext,
								selectorMap: selectorMapOnRender
							});
							mockConsumer.subscribe.mockClear();
							mockConsumer.unlinkCache.mockClear();
							reactUseEffectSpy.mockClear();
							mockUnsubscribe.mockClear();
							rerender({ context: ObservableContext });
						});
						afterAll(() => {
							reactUseContextSpy.mockRestore();
							reactUseEffectSpy.mockRestore();
							reactUseStateSpy.mockRestore();
						} );
						test( 'adjusts the store on selctorMap change', () => {
							expect( reactUseEffectSpy.mock.calls[ 0 ][ 1 ] ).toEqual([[]]);
						} );
						test( 'performs no state data update', () => {
							expect( mockSetData ).not.toHaveBeenCalled();
						} );
						test( 'does not set up new subscription with the consumer', () => {
							expect( mockConsumer.subscribe ).not.toHaveBeenCalled();
						} );
						describe( 'and previous property path is empty', () => {
							test( 'skips cleanup: no previous associations to the consumer', () => {
								const mockSetData = jest.fn();
								const mockUnsubscribe = jest.fn();
								const reactUseEffectSpy = jest.spyOn( React, 'useEffect' );
								const reactUseStateSpy = jest.spyOn( React, 'useState' ).mockReturnValue([ {}, mockSetData ]);
								const mockConsumer = {
									getState: () => ({}),
									resetState: () => {},
									subscribe: jest.fn().mockReturnValue( mockUnsubscribe ),
									unlinkCache: jest.fn()
								};
								const reactUseContextSpy = jest.spyOn( React, 'useContext' ).mockReturnValue( mockConsumer );
								const { rerender } = renderUseContextHook({ context: ObservableContext });
								mockConsumer.subscribe.mockClear();
								mockConsumer.unlinkCache.mockClear();
								reactUseEffectSpy.mockClear();
								mockUnsubscribe.mockClear();
								rerender({ context: ObservableContext, selectorMap: {} });
								expect( mockConsumer.unlinkCache ).not.toHaveBeenCalled();
								expect( mockUnsubscribe ).not.toHaveBeenCalled();
								reactUseContextSpy.mockRestore();
								reactUseEffectSpy.mockRestore();
								reactUseStateSpy.mockRestore();
							} );
						} );
					} );
				} );
			} );
			describe( 'store.data', () => {
				let Client;
				beforeAll(() => {
					Client = ({ selectorMap, onChange }) => {
						const store = useContext( ObservableContext, selectorMap );
						React.useMemo(() => onChange( store ), [ store ]);
						return null;
					};
					Client.displayName = 'Client';
				});
				test( 'carries the latest state data as referenced by the selectorMap', async () => {
					/** @type {Store<SourceData>} */
					let store;
					const onChange = s => { store = s };
					render(
						<Wrapper>
							<Client onChange={ onChange } selectorMap={{
								city3: 'history.places[2].city',
								country3: 'history.places[2].country',
								year3: 'history.places[2].year',
								isActive: 'isActive',
								tag6: 'tags[5]',
								tag7: 'tags[6]'
							}} />
						</Wrapper>
					);
					const defaultState = createSourceData();
					const expectedValue = {
						city3: defaultState.history.places[ 2 ].city,
						country3: defaultState.history.places[ 2 ].country,
						year3: defaultState.history.places[ 2 ].year,
						isActive: defaultState.isActive,
						tag6: defaultState.tags[ 5 ],
						tag7: defaultState.tags[ 6 ]
					};
					expect( store.data ).toEqual( expectedValue );
					store.setState({
						isActive: true,
						history: {
							places: {
								2: {
									city: 'Marakesh',
									country: 'Morocco'
								}
							}
						}
					});
					await new Promise( resolve => setTimeout( resolve, 10 ) );
					expect( store.data ).toEqual({
						...expectedValue,
						city3: 'Marakesh',
						country3: 'Morocco',
						isActive: true
					});
				} );
				test( 'holds the complete current state object whenever `@@STATE` entry appears in the selectorMap', async () => {
					/** @type {Store<SourceData>} */
					let store;
					const onChange = s => { store = s };
					render(
						<Wrapper>
							<Client onChange={ onChange } selectorMap={{
								city3: 'history.places[2].city',
								country3: 'history.places[2].country',
								year3: 'history.places[2].year',
								isActive: 'isActive',
								tag6: 'tags[5]',
								tag7: 'tags[6]',
								state: '@@STATE'
							}} />
						</Wrapper>
					);
					const defaultState = createSourceData();
					const expectedValue = {
						city3: defaultState.history.places[ 2 ].city,
						country3: defaultState.history.places[ 2 ].country,
						year3: defaultState.history.places[ 2 ].year,
						isActive: defaultState.isActive,
						tag6: defaultState.tags[ 5 ],
						tag7: defaultState.tags[ 6 ],
						state: defaultState
					};
					expect( store.data ).toEqual( expectedValue );
					store.setState({
						isActive: true,
						history: {
							places: {
								2: {
									city: 'Marakesh',
									country: 'Morocco'
								}
							}
						}
					});
					await new Promise( resolve => setTimeout( resolve, 10 ) );
					const updatedDataEquiv = createSourceData();
					updatedDataEquiv.history.places[ 2 ].city = 'Marakesh';
					updatedDataEquiv.history.places[ 2 ].country = 'Morocco';
					updatedDataEquiv.isActive = true;
					expect( store.data ).toEqual({
						...expectedValue,
						city3: 'Marakesh',
						country3: 'Morocco',
						isActive: true,
						state: updatedDataEquiv
					});
				} );
				test( 'holds an empty object when no renderKeys provided ', async () => {
					/** @type {Store<SourceData>} */
					let store;
					const onChange = s => { store = s };
					render( <Wrapper><Client onChange={ onChange } /></Wrapper> );
					expect( store.data ).toEqual({});
					store.setState({ // can still update state
						isActive: true,
						history: {
							places: {
								2: {
									city: 'Marakesh',
									country: 'Morocco'
								}
							}
						}
					});
					await new Promise( resolve => setTimeout( resolve, 10 ) );
					expect( store.data ).toEqual({});
				} );
			} );
			describe( 'store.resetState', () => {
				describe( 'when selectorMap is present in the consumer', () => {
					let reactUseEffectSpy, reactUseContextSpy, reactUseStateSpy;
					let mockConsumer, resetState, selectorMap;
					beforeAll(() => {
						selectorMap = { a: 'aggregation', b: 'blatant', c: 'charitable' };
						mockConsumer = {
							getState: () => ({}),
							resetState: jest.fn(),
							subscribe: () => () => {},
							unlinkCache: () => {}
						};
						reactUseEffectSpy = jest.spyOn( React, 'useEffect' );
						reactUseStateSpy = jest.spyOn( React, 'useState' ).mockReturnValue([
							Object.values( selectorMap ).reduce(
								( o, k ) => { o[ k ] = expect.anything(); return o }, {}
							),
							() => {}
						]);
						reactUseContextSpy = jest.spyOn( React, 'useContext' ).mockReturnValue( mockConsumer );
						const { result } = renderUseContextHook({ context: expect.anything(), selectorMap });
						resetState = result.current.resetState;
					});
					afterAll(() => {
						reactUseContextSpy.mockRestore();
						reactUseEffectSpy.mockRestore();
						reactUseStateSpy.mockRestore();
					} );
					describe( 'and called with own state property paths to reset', () => {
						test( 'calculates setstate changes using state slice matching the supplied property paths', () => {
							const args = [ 'blatant', 'xylophone', 'yodellers', 'zenith' ];
							resetState( args );
							expect( mockConsumer.resetState ).toHaveBeenCalledWith( args );
						} );
					} );
					describe( 'and called with NO state property paths to reset', () => {
						test( 'calculates setstate changes using state slice matching property paths derived from the selectorMap', () => {
							resetState();
							expect( mockConsumer.resetState ).toHaveBeenCalledWith( Object.values( selectorMap ) )
						} );
					} );
				} );
				describe( 'when selectorMap is NOT present in the consumer', () => {
					let reactUseEffectSpy, reactUseContextSpy, reactUseStateSpy;
					let mockConsumer, resetState;
					beforeAll(() => {
						mockConsumer = {
							getState: () => ({}),
							resetState: jest.fn(),
							subscribe: () => () => {},
							unlinkCache: () => {}
						};
						reactUseEffectSpy = jest.spyOn( React, 'useEffect' );
						reactUseStateSpy = jest.spyOn( React, 'useState' ).mockReturnValue([ {}, () => {} ]);
						reactUseContextSpy = jest.spyOn( React, 'useContext' ).mockReturnValue( mockConsumer );
						const { result } = renderUseContextHook({ context: expect.anything() });
						resetState = result.current.resetState;
					});
					afterAll(() => {
						reactUseContextSpy.mockRestore();
						reactUseEffectSpy.mockRestore();
						reactUseStateSpy.mockRestore();
					} );
					describe( 'and called with own state property paths to reset', () => {
						test( 'calculates setstate changes using state slice matching the supplied property paths', () => {
							const args = [ 'blatant', 'xylophone', 'yodellers', 'zenith' ];
							resetState( args );
							expect( mockConsumer.resetState ).toHaveBeenCalledWith( args );
						} );
					} );
					describe( 'and called with NO state property paths to reset', () => {
						test( 'calculates setstate changes using no property paths -- the consumer applies no store reset [see usestore(...)]', () => {
							resetState();
							expect( mockConsumer.resetState ).toHaveBeenCalledWith([]);
						} );
					} );
				} );
			} );
		} );
	} );
} );

/**
 * @typedef {{
 *	getState: (...args: any[]) => any|jest.Mock<any, any>,
 *	resetState: (...args: any[]) => any|jest.Mock<any, any>,
 *	subscribe: (...args: any[]) => any|jest.Mock<any, any>,
 *	unlinkCache: (...args: any[]) => any|jest.Mock<any, any>
 * }} ContextConsumerMock
 */
/**
 * @typedef {{
 *	context: ObservableContext<State>,
 * 	selectorMap: {[propertyPath: string]:*}
 * }} RenderUseContextProps
 */
/**
 * @typedef {import(".").ObservableContext<T>} ObservableContext
 * @template {State} T
 */
/** @typedef {import("../test-artifacts/data/create-state-obj").SourceData} SourceData */
/**
 * @typedef {import("../types").Store<T>} Store
 * @template {import("../types").State} T
 */
/**
 * @typedef {import('@testing-library/react-hooks').Renderer<TProps>} Renderer
 * @template TProps
 */
/**
 * 	@typedef {import('@testing-library/react-hooks').RenderHookResult<TProps, TValue, TRenderer>} RenderHookResult
 *	@template TProps
 *	@template TValue
 *	@template {Renderer<TProps>} TRenderer
 */
