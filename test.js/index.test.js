import React from 'react';

import { cleanup as cleanupPerfTest, perf, wait } from 'react-performance-testing';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
// import userEvent from '@testing-library/user-event';

import '@testing-library/jest-dom';

import { UsageError } from '../src';

import AppNormal, { Editor } from './apps/normal';
import AppWithPureChildren from './apps/with-pure-children';

afterEach( cleanup );

describe( 'ReactObservableContext', () => {
	test( 'throws usage error on attempts to use context store outside of the Provider component tree', () => {
		// note: Editor component utilizes the ReactObservableContext store
		expect( render( <Editor /> ) ).toThrow( UsageError );
	} );
	describe( 'with pure children components', () => {
		let TestApp = () => ( <AppWithPureChildren /> );
		TestApp.displayName = 'TestApp';
		afterAll(() => { TestApp = null });
		test( 'only re-renders children affected by the Provider parent state update', async () => {
			const { renderCount } = perf( React );
			render( <TestApp /> );
			fireEvent.keyUp( screen.getByLabelText( 'Type:', { key: 'A', code: 'KeyA' } ) );
			await wait(() => {
				expect( renderCount.current.App.value ).toBe( 2 );
				expect( renderCount.current.Product.value ).toBe( 2 );
				expect( renderCount.current.PriceSticker.value ).toBe( 1 );
				expect( renderCount.current.ProductDescription.value ).toBe( 2 );
				expect( renderCount.current.Editor.value ).toBe( 1 );
				expect( renderCount.current.TallyDisplay.value ).toBe( 2 );
			});
			cleanupPerfTest();
		} );
	} );
	describe( 'with non pure children components', () => {
		test( '', () => {
			render( <AppNormal /> );
		} );
	} );
} );
