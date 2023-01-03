<p align="center">
	<img alt="Eagle Eye" height="320px" src="eagle-eye.png" width="640px" />
</p>
<p align="center">
	<a href="#">
		<img alt="GitHub pull request check contexts" src="https://img.shields.io/github/status/contexts/pulls/webKrafters/react-observable-context/0">
	</a>
	<a href="#">
		<img alt="GitHub Workflow Status (with branch)" src="https://img.shields.io/github/actions/workflow/status/webKrafters/react-observable-context/test.yml?branch=main">
	</a>
	<a href="https://coveralls.io/github/webKrafters/react-observable-context">
		<img alt="coverage" src="https://img.shields.io/coveralls/github/webKrafters/react-observable-context">
	</a>
	<img alt="Maintenance" src="https://img.shields.io/maintenance/yes/2032">
	<img alt="NPM" src="https://img.shields.io/npm/l/@webkrafters/react-observable-context">
	<img alt="npm bundle size (scoped)" src="https://img.shields.io/bundlephobia/minzip/@webkrafters/react-observable-context">
	<img alt="GitHub package.json version" src="https://img.shields.io/github/package-json/v/webKrafters/react-observable-context">
</p>
<br /><br />
<p>This version is currently under test. Please continue to use our latest stable release at: 3.0.0.</p>
<p>npm install --save @webkrafters/react-observable-context@3.0.0</p>
<p>Thank you!</p>
<br />

<br />

# React-Observable-Context [Eagle Eye]

A context bearing an observable consumer [store](#store).\
Only re-renders subscribing components on context state change.\
Subscribing component decides which context state properties' change to trigger its update.

**Name:** React-Observable-Context

**Usage:** Please see [Usage](#usage) section

**Install:**\
npm i -S @webkrafters/react-observable-context\
npm install --save @webkrafters/react-observable-context

May also see [**What's Changed?**](#changes) section below.

# Intro

A context bearing an observable consumer [store](#store). State changes within the store's internal state are only broadcasted to components subscribed to the store. In this way, the `React-Observable-Context` prevents repeated automatic re-renderings of entire component trees resulting from ***context*** state changes.

# Who Is a Client?
A client is any component consuming the observable context. A client consumes the context either by using the <code>React-Observable-Context <a href="#use-context">useContext</a></code> hook or by embedding itself within the connector returned by the <code>React-Observable-Context <a href="#connect">connect</a></code> function.

# API

The React-Observable-Context module contains **4** exports namely: the **createContext** function, the **connect** function, the **useContext** hook and the **UsageError** class.

* **createContext** is a zero-parameter function returning a `React-Observable-Context` object. This object is the store-bearing context. To access the context's [store](#store), pass the context as a `context` parameter to either the [connect](#connect) function or the [useContext](#usecontext) hook.

* <b id="connect">connect</b>
<p style="padding-left: 40px; margin-top: -10px">
	<span style="margin: 5px 10px 0 0">-</span>is a function taking a <code>React-Observable-Context</code> object and an optional <a href="#selector-map">selector map</a> parameters; and returning a reusable connector function.<br />
	<span style="margin: 5px 10px 0 0">-</span>The connector function takes a client as a parameter and returns an HOC.<br />
	<span style="margin: 5px 10px 0 0">-</span>Any client using similar context object and selector map may be passed to this connector.<br />
	<span style="margin: 5px 10px 0 0">-</span>The HOC injects the context <a href="#store">store</a> to the client and handles all of the context usage requirements.<br />
	<span style="margin: 5px 10px 0 0">-</span>The injected <a href="#store">store</a> monitors changes in the underlying state slices referenced by the selector map.<br />
	<span style="margin: 5px 10px 0 0">-</span>A change in any of the referenced state slices automatically triggers a render of the client.<br />
	<span style="margin: 5px 10px 0 0">-</span>Any prop name conflicts between injected <a href="#store">store properties</a> and client props are resolved in favor of the client prop.
</p>

* <b id="usecontext">useContext</b>
<p style="padding-left: 40px; margin-top: -10px">
	<span style="margin: 5px 10px 0 0">-</span>is a hook taking a <code>React-Observable-Context</code> object and an optional <a href="#selector-map">selector map</a> parameters; and returning the context <a href="#store">store</a>.<br />
	<span style="margin: 5px 10px 0 0">-</span>The injected <a href="#store">store</a> monitors changes in the underlying state slices referenced by the selector map.<br />
	<span style="margin: 5px 10px 0 0">-</span>The <a href="#connect">connect</a> function is axiomatically the more conducive method for consuming this conetxt.<br />
	<span style="margin: 5px 10px 0 0">-</span>In certain user-specific cases, direct access to this hook may be preferrable.<br />
	<span style="margin: 5px 10px 0 0">-</span>In such cases, it is advisable to wrap the client in a React.memo.
</p>

* **UsageError** class is the Error type reported for attempts to access this context's store outside of its Provider component tree.

<br />

## Prehooks

 Prehooks provide a central place for sanitizing, modifying, transforming, validating etc. all related incoming state updates.

 The context store **2** update operations each adhere to its own user specified prehook when present. Otherwise, the update operation proceeds normally to completion. Thus, there are **2** prehooks named **resetState** and **setState** - after the store update methods they support.
 
 Each prehook returns a **boolean** value (`true` to continue AND `false` to abort the update operation). The prehook may modify (i.e. sanitize, transform, transpose) the argument to accurately reflect the intended update value. This is done by mutating part of the argument which holds the next `nextUpdate` values.

* **resetState**: `(resetData: PartialState\<State\>, state: {current: State, original: State}) => boolean` // ***`resetData`*** holds the `nextUpdate` values.

* **setState**: `(newChanges: PartialState\<State\>) => boolean` // ***`newChanges`*** holds the `nextUpdate` values.

***<u>Use case:</u>*** prehooks provide a central place for sanitizing, modifying, transforming, validating etc. all related incoming state updates.

<br />

<h2 id="property-path">Property path</h2>
A property path is a dot-notation string leading to a property within an object.<br />
Property paths abide by the <b><i><u>Lodash</u></i></b> property path specification.<br />

<strong id="property-path-example">Ex. Given the following object:</strong>

```
{
	a: {
		c: {
			e: 5,
			f: [ 0, 2, 4 ]
		}
	}
}
```
The property path `a.c.e` accesses the `e=5` property.<br />
Either of the property paths `a.c.f.1` and `a.c.f[1]`  accesses the `[1]=2` property.<br />
A special property path [@@STATE](#full-state-selectorkey) may be used to access the full given object.<br />

<strong id="fullstate-selectorkey"><u>@@STATE</u></strong> is a special property path to access the full state object as a single slice. ***Caution:***  When this property path exists in a selector map, any change in the state object results in an update of its `store.data` and a subsequent render of its client(s).

<br />

## Provider

The Provider component is a property of the `React-Observable-Context` context object. As a `React.context` based provider, it accepts the customary `children` and `value` props. It also accepts 2 optional props: <code><a href="#prehooks">prehooks</a></code> and <code><a href="#storage">storage</a></code>.

<br />

<h2 id="selector-map">Selector Map</h2>
A selector map is an object holding key:value pairs.<br />
<i style="margin-right: 10px">-</i><code>key</code> refers to an arbitrary name to be assigned to a given property in the <code>store.data</code>.<br />
<i style="margin-right: 10px">-</i><code>value</code> refers to the <a href="#property-path">property path</a> leading to a state slice whose value will be assigned to and observed by this <code>store.data</code> property.<br />
<i style="margin-right: 10px">-</i>A special '<a href="#full-state-selectorkey">@@STATE</a>' value may be used to access and observe the full state object.<br />

<strong id="selector-map-example">Example</strong>

```
// Given the following state object:
const state = {
	a: 1,
	b: 2,
	c: 3,
	d: {
		e: 5,
		f: [ 6, {
				x: 7,
				y: 8,
				z: 9
		} ]
	}
};
// a client observing the following selector map
const selectorMap = {
	all: '@@STATE',
	myData: 'd',
	secondFElement: 'd.f[1]'
};
// will receive the following store data
store.data = {
	all: state,
	myData: state.d
	secondFElement: state.d.f[1]
}
```

<br />

## Storage



<br />

## Store

The `React.Observable.Context` context `store` is the client's facade to the context's underlying state. It exposes **3** properties namely:

* **data**: which is an object holding resolved state slices as provided in the selector map. [See selector map to store data example here](#selector-map-example)

* **resetState**: (propertyPaths: Array\<string\>) => void // resets slices of state referenced by the proper paths to their initial values.

* **setState**: (changes: PartialState\<State\>) => void // merges only new/changed state slices.

<h3 id="store-setstate"><code>store.setState</code> Usage</h3>
<b><i>Do this:</i></b> <code>setState({stateKey0: changes0[, ...]});</code><br />
<b><i>Not this:</i></b> <code>setState({stateKey0: {...state.stateKey0, ...changes0}[, ...]});</code><br /><br />

<h3 id="indexing">Indexing</h3>

Existing array state property can be overridden with a new array.<br />
Use the indexed object to update array content at indexes.<br />
<strong>Example:</strong>

```
// Given the following array bearing state object:
const state = { a: { b: [ { x: 7, y: 8, z: 9 } ] } };

store.setState({ a: { b: { 0: { y: 30 }, 1: 22 } } });
// updates the state to: { a: { b: [ { x: 7, y: 30, z: 9 }, 22 ] } };

//That statement is functionally equivalent to the following:
const [ f, ...rest ] = state.a.b;
store.setState({ a: { ...a, b: [ { ...f, y: 30 }, 22, ...rest ] } });
// Refrain from doing this, please!

// The following will override the existing array
store.setState({ a: { b: [ { y: 30 }, 22 ] } });
// updates the state to: { a: { b: [ { y: 30 }, 22 ] } };

```

<br />

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


<br />
<h1 id="changes">What's Changed</h1>
<table>
	<tbody>
		<tr><td><b>1.</b></td><td>Added the <code><a href="#connect">connect</a></code> function to facilitate the encapsulated context-usage method.</td></tr>
		<tr><td><b>2.</b></td><td>Added stronger support for deeply nested state structure.</td></tr>
		<tr><td><b>3.</b></td><td>Replaced the <code><a href="#usecontext">useContext</a></code> watchedKeys array parameter with a <code><a href="#selector-map">selectorMap</a></code> object.</td></tr>
		<tr><td><b>4.</b></td><td>Removed the necessity for direct store subscription.</td></tr>
		<tr><td><b>5.</b></td><td><code>store.resetState</code> can now take a <a href="#property-path">property path</a> array targeting which state slices to reset.</td></tr>
		<tr><td><b>6.</b></td><td>Context provider accepts an optional <a href="#storage">IStorage</a> prop for memorizing initial state.</td></tr>
		<tr><td><b>7.</b></td><td>Removed the need for <code>store.getState</code>. <code>store.data</code> now holds the state slices used by the component. Changes in any of the slices held by the <code>store.data</code> is automatically updated as they occur. The client is immediately notified of the update.</td></tr>
	</tbody>
</table>


# License

MIT
