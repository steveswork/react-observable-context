# React-Observable-Context

A context bearing an observable consumer [store](#store).\
Only re-renders subscribing components on context state change.\
Subscribing component decides which context state properties' change to trigger its update.

**Name:** React-Observable-Context

**Usage:** Please see [Usage](#usage) section

**Install:**\
npm i -S @webkrafters/react-observable-context\
npm install --save @webkrafters/react-observable-context

# Intro

A context bearing an observable consumer [store](#store). State changes within the store's internal state are only broadcasted to components subscribed to the store. In this way, the `React-Observable-Context` prevents repeated automatic re-renderings of entire component trees resulting from ***context*** state changes.

**React::memo** *(and PureComponents)* remain the go-to solution for the repeated automatic re-renderings of entire component trees resulting from ***component*** state changes. 

***Recommendation:*** For optimum performance, consider wrapping in **React::memo** most components using this module's ***useContext*** hook either directly or through another React hook. This will protect such components and their descendants from unrelated cascading render operations.

***Exempt*** from the recommendation are certain components such as those wrapped in the `React-Redux::connect()` Higher Order Component (HOC). Such HOC provides similar cascade-render protections to wrapped components and their descendants. 

# API

The React-Observable-Context module contains **3** exports namely: the **createContext** function, the **useContext** hook and the **UsageError** class.

* **createContext** is a zero-parameter function returning a store-bearing context. Pass the context as a `context` parameter to the [useContext()](#usecontext) to obtain the context's [store](#store).

* <b id="usecontext">useContext</b> is analogous to React::useContext hook but returns the context store and takes a second parameter named ***watchedKeys***. The `watchedKeys` parameter is a list of state object property paths to watch. A change in any of the referenced properties automatically triggers a render of the component using this hook.

* **UsageError** class is the Error type reported for attempts to access this context's store outside of its Provider component tree.

## Provider

The Provider component is a property of the `context`. It can immediately be used as-is anywhere the React-Observable-Context is required. It accepts the customary `children` and `value` props, and an optional `prehooks` prop <i>(discussed in the [prehooks](#prehooks) subsection below)</i>.

## Store

The context's `store` exposes **4** methods for interacting with the context's internal state namely:

* **getState**: (selector?: (state: State) => any) => any

* **resetState**: VoidFunction // resets the state to the Provider initial `value` prop.

* **setState**: (changes: PartialState\<State\>) => void // merges only new/changed state slices.\
***Do this:*** `setState({stateKey0: changes0[, ...]});`\
***Not this:*** `setState({stateKey0: {...state.stateKey0, ...changes0}[, ...]});`

* **subscribe**: (listener: (newValue: PartialState\<State\>, oldValue: PartialState\<State\>) => void) => ***UnsubscribeFunction***

## Prehooks

 Prehooks provide a central place for sanitizing, modifying, transforming, validating etc. all related incoming state updates.

 The context store **2** update operations each adhere to its own user specified prehook when present. Otherwise, the update operation proceeds normally to completion. Thus, there are **2** prehooks named **resetState** and **setState** - after the store update methods they support.
 
 Each prehook returns a **boolean** value (`true` to continue AND `false` to abort the update operation). The prehook may modify (i.e. sanitize, transform, transpose) the argument to accurately reflect the intended update value. This is done by mutating part of the argument which holds the next `nextUpdate` values.

* **resetState**: (state: {current: State, original: State}) => boolean // ***`state.original`*** holds the `nextUpdate` values.

* **setState**: (newChanges: PartialState\<State\>) => boolean // ***`newChanges`*** holds the `nextUpdate` values.

***<u>Use case:</u>*** prehooks provide a central place for sanitizing, modifying, transforming, validating etc. all related incoming state updates.

# Usage

### <u>*context.js*</u>

    import { createContext, useContext } from '@webkrafters/react-observable-context';
	const ObservableContext = createContext();
	export const useObservableContext = watchedKeys => useContext( ObservableContext, watchedKeys );
	export default ObservableContext;

### <u>*index.js*</u>

    import React from 'react';
    import ReactDOM from 'react-dom';
    import App from './app';
    ReactDOM.render(<App />, document.getElementById('root'));

### <u>*app.js*</u>

    import React, { useCallback, useState } from 'react';
	import Product from './product';
	const productUpdateHooks = {
		resetState: ( ...args ) => {
			console.log( 'resetting state with >>>> ', JSON.stringify( args ) );
			return true;
		},
		setState: ( ...args ) => {
			console.log( 'merging following into state >>>> ', JSON.stringify( args ) );
			return true;
		}
	};
	const App = () => {
		const [ productType, setProductType ] = useState( 'Calculator' );
		const updateType = useCallback( e => setProductType( e.target.value ), [] );
		return (
			<div className="App">
				<h1>Demo</h1>
				<h2>A contrived product app.</h2>
				<div style={{ marginBottom: 10 }}>
					<label>Type: <input onKeyUp={ updateType } placeholder="override product type here..." /></label>
				</div>
				<Product
					type={ productType }
					updateHooks={ productUpdateHooks }
				/>
			</div>
		);
	};
	App.displayName = 'App';
	export default App;

### <u>*product.js*</u>

	import React, { useCallback, useEffect, useState } from 'react';
	import ObservableContext from './context';
	import Editor from './editor';
	import PriceSticker from './price-sticker';
	import ProductDescription from './product-description';
	import TallyDisplay from './tally-display';
	const Product = ({ type, updateHooks }) => {
		const [ state, setState ] = useState(() => ({
			color: 'Burgundy',
			price: 22.5,
			type
		}));
		useEffect(() => {
			setState({ type }); // use this to update only the changed state value
			// setState({ ...state, type }); // this will override the context internal state for these values 
		}, [ type ]);
		const overridePricing = useCallback( e => setState({ price: Number( e.target.value ) }), [] );
		return (
			<div>
				<div style={{ marginBottom: 10 }}>
					<label>$ <input onKeyUp={ overridePricing } placeholder="override price here..." /></label>
				</div>
				<ObservableContext.Provider
					prehooks={ updateHooks }
					value={ state }
				>
					<div style={{
						borderBottom: '1px solid #333',
						marginBottom: 10,
						paddingBottom: 5
					}}>
						<Editor />
						<TallyDisplay />
					</div>
					<ProductDescription />
					<PriceSticker />
				</ObservableContext.Provider>
			</div>
		);
	};
	Product.displayName = 'Product';
	export default Product;

### <u>*editor.js*</u>

    import React, { memo, useCallback, useEffect, useRef } from 'react';
	import { useObservableContext } from './context';
	const Editor = memo(() => {
		const { setState } = useObservableContext();
		const priceInputRef = useRef();
		const colorInputRef = useRef();
		const typeInputRef = useRef();
		const updatePrice = useCallback(() => {
			setState({ price: Number( priceInputRef.current.value ) });
		}, []);
		const updateColor = useCallback(() => {
			setState({ color: colorInputRef.current.value });
		}, []);
		const updateType = useCallback(() => {
			setState({ type: typeInputRef.current.value });
		}, []);
		useEffect(() => console.log( 'Editor component rendered.....' ));
		return (
			<fieldset style={{ margin: '10px 0' }}>
				<legend>Editor</legend>
				<div style={{ margin: '10px 0' }}>
					<label>New Price: <input ref={ priceInputRef } /></label>
					{ ' ' }
					<button onClick={ updatePrice }>update price</button>
				</div>
				<div style={{ margin: '10px 0' }}>
					<label>New Color: <input ref={ colorInputRef } /></label>
					{ ' ' }
					<button onClick={ updateColor }>update color</button>
				</div>
				<div style={{ margin: '10px 0' }}>
					<label>New Type: <input ref={ typeInputRef } /></label>
					{ ' ' }
					<button onClick={ updateType }>update type</button>
				</div>
			</fieldset>
		);
	});
	Editor.displayName = 'Editor';
	export default Editor;

### <u>*price-sticker.js*</u>

    import React, { memo, useEffect } from 'react';
	import { useObservableContext } from './context';
	const CONTEXT_KEYS = [ 'price' ];
	const PriceSticker = memo(() => {
		const { getState } = useObservableContext( CONTEXT_KEYS );
		useEffect(() => console.log( 'PriceSticker component rendered.....' ));
		return (
			<div style={{ fontSize: 36, fontWeight: 800 }}>
				${ getState( s => s.price ).toFixed( 2 ) }
			</div>
		);
	});
	PriceSticker.displayName = 'PriceSticker';
	export default PriceSticker;

### <u>*product-description.js*</u>

    import React, { memo, useEffect } from 'react';
	import { useObservableContext } from './context';
	const CONTEXT_KEYS = [ 'color', 'type' ];
	const ProductDescription = memo(() => {
		const store = useObservableContext( CONTEXT_KEYS );
		useEffect(() => console.log( 'ProductDescription component rendered.....' ));
		const color = store.getState( s => s.color );
		const type = store.getState( s => s.type );
		return (
			<div style={{ fontSize: 24 }}>
				<strong>Description:</strong> { color } { type }
			</div>
		);
	});
	ProductDescription.displayName = 'ProductDescription';
	export default ProductDescription;

### <u>*tally-display.js*</u>

    import React, { memo, useEffect } from 'react';
	import { useObservableContext } from './context';
	import Reset from './reset';
	const CONTEXT_KEYS = [ 'color', 'price', 'type' ];
	const TallyDisplay = memo(() => {
		const { getState } = useObservableContext( CONTEXT_KEYS );
		useEffect(() => console.log( 'TallyDisplay component rendered.....' ));
		return (
			<div>
				<table>
					<tbody>
						<tr><td><label>Type:</label></td><td>{ getState( s => s.type ) }</td></tr>
						<tr><td><label>Color:</label></td><td>{ getState( s => s.color ) }</td></tr>
						<tr><td><label>Price:</label></td><td>{ getState( s => s.price ).toFixed( 2 ) }</td></tr>
					</tbody>
				</table>
				<div style={{ textAlign: 'right' }}>
					<Reset />
				</div>
			</div>
		);
	});
	TallyDisplay.displayName = 'TallyDisplay';
	export default TallyDisplay;

### <u>*reset.js*</u>

    import React, { memo, useEffect } from 'react';
	import { useObservableContext } from './context';
	const Reset = memo(() => {
		const { resetState } = useObservableContext();
		useEffect(() => console.log( 'Reset component rendered.....' ));
		return ( <button onClick={ resetState }>reset context</button> );
	});
	Reset.displayName = 'Reset';
	export default Reset;


# License

MIT
