<p align="center">
	<img alt="Eagle Eye" height="150px" src="eagle-eye.png" width="250px" />
</p>
<p align="center">
	<a href="https://typescriptlang.org">
		<img alt="TypeScript" src="https://badgen.net/badge/icon/typescript?icon=typescript&label">
	</a>
	<a href="https://github.com/webKrafters/react-observable-context/actions">
		<img alt="GitHub Workflow Status" src="https://img.shields.io/github/actions/workflow/status/webKrafters/react-observable-context/test.yml">
	</a>
	<a href="https://coveralls.io/github/webKrafters/react-observable-context">
		<img alt="coverage" src="https://img.shields.io/coveralls/github/webKrafters/react-observable-context">
	</a>
	<img alt="NPM" src="https://img.shields.io/npm/l/@webkrafters/react-observable-context">
	<img alt="Maintenance" src="https://img.shields.io/maintenance/yes/2032">
	<img alt="npm bundle size (scoped)" src="https://img.shields.io/bundlephobia/minzip/@webkrafters/react-observable-context">
	<img alt="GitHub package.json version" src="https://img.shields.io/github/package-json/v/webKrafters/react-observable-context">
</p>

# React-Observable-Context [Eagle Eye]

A context bearing an observable consumer [store](#store).\
Only re-renders subscribing components ([clients](#client)) on context state changes.\
Subscribing component decides which context state properties' changes to trigger its update.

**Name:** React-Observable-Context

**Moniker:** Eagle Eye

**Usage:** Please see [Usage](#usage) section

**Demo:** [Play with the app on codesandbox](https://codesandbox.io/s/github/webKrafters/react-observable-context-app)

**Install:**\
npm i -S @webkrafters/react-observable-context\
npm install --save @webkrafters/react-observable-context

May also see <b><a href="#changes">What's Changed?</a></b> section below.

# Intro

A context bearing an observable consumer [store](#store). State changes within the store's internal state are only broadcasted to components subscribed to the store (the [clients](#client)). In this way, the `React-Observable-Context` prevents repeated automatic re-renderings of entire component trees resulting from ***context*** state changes.

# Concepts

## Client
A client is any component consuming the observable context. A client consumes the context either by using the <code>React-Observable-Context <a href="#usecontext">useContext</a></code> hook or by embedding itself within the connector returned by the <code>React-Observable-Context <a href="#connect">connect</a></code> function.

## Prehooks
 Prehooks provide a central place for sanitizing, modifying, transforming, validating etc. all related incoming state updates. The context store obtains its prehooks via its context [Provider's](#provider) `prehooks` optional prop.

 The context store **2** update operations each adhere to its own user-defined prehook when present. Otherwise, the update operation proceeds normally to completion. Thus, there are **2** prehooks named **resetState** and **setState** - after the store update methods they support.
 
 Each prehook returns a **boolean** value (`true` to continue AND `false` to abort the update operation). The prehook may modify (i.e. sanitize, transform, transpose) the argument to accurately reflect the intended update value. This is done by mutating part of the argument which holds the next `nextUpdate` values.
 <ol>
	<li>
		<p style="margin: 0 0 5px 10px">
			<b>resetState:</b> 
			<code style="margin: 10px 5px">(resetData: PartialState&lt;State&gt;, state: {current: State, original: State}) => boolean;</code> // <b><i><code>resetData</code></i></b> holds the <code>nextUpdate</code> values.
		</p>
	</li>
	<li>
		<p style="margin: 0 0 5px 10px">
			<b>setState:</b> 
			<code style="margin: 10px 5px">(newChanges: PartialState&lt;State&gt;) => boolean;</code> // <b><i><code>newChanges</code></i></b> holds the <code>nextUpdate</code> values.
		</p>
	</li>
 </ol>

***<u>Use case:</u>*** prehooks provide a central place for sanitizing, modifying, transforming, validating etc. all related incoming state updates.

<h2 id="property-path">Property path</h2>
A property path is a dot-notation string leading to a specific property within an object.<br />
<code>React-Observable-Context</code> recognizes any property path abiding by the <b><i><u>Lodash</u></i></b> property path specifications.<br />

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
A special property path [@@STATE](#fullstate-selectorkey) may be used to access the full given object.<br />

<strong id="fullstate-selectorkey"><u>@@STATE</u></strong> is a special property path to access the full state object as a single slice. ***Caution:***  When this property path exists in a selector map, any change in the state object results in an update of its `store.data` and a subsequent render of its client(s).

## Provider
The Provider component is a property of the `React-Observable-Context` context object. As a `React.context` based provider, it accepts the customary `children` and `value` props. It also accepts **2** optional props: <a href="#prehooks"><code>prehooks</code></a> and <a href="#storage"><code>storage</code></a>.

<h2 id="selector-map">Selector Map</h2>
A selector map is an object holding key:value pairs.<br />
<span style="margin-right: 10px">-</span><code>key</code> refers to an arbitrary name to be assigned to a given property in the <code>store.data</code>.<br />
<span style="margin-right: 10px">-</span><code>value</code> refers to the <a href="#property-path">property path</a> leading to a state slice whose value will be assigned to and observed by this <code>store.data</code> property.<br />
<span style="margin-right: 10px">-</span>A special '<a href="#fullstate-selectorkey">@@STATE</a>' value may be used to access and observe the full state object.<br />

<strong id="selector-map-example">Example:</strong>

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

## Storage
The `React.Observable.Context` context allows for a user-defined Storage object to maintain the integrity of the initial context state at a location of the user's choosing. This, it accepts, via its Provider's `storage` optional prop. The context defaults to the `window.sessionstorage` in supporting environments. Otherwise, it defaults to its own internal memory-based storage.

A valid storage object is of the type: `IStorage<State>` implementing the following **4** methods:
<ol>
	<li><code style="margin-left: 10px">clone: (data: State) => State; // expects a state clone</code></li>
	<li><code style="margin-left: 10px">getItem: (key: string) => State;</code></li>
	<li><code style="margin-left: 10px">removeItem: (key: string) => void;</code></li>
	<li><code style="margin-left: 10px">setItem: (key: string, data: State) => void;</code></li>
</ol>

## Store
The `React.Observable.Context` context `store` is the client's facade to the context's underlying state. It exposes **3** properties namely:
<ol>
	<li>
		<p style="margin: 0 0 0 10px">
			<b>data:</b> 
			<span style="margin-left: 5px">
				which is an object holding resolved state slices as declared in the selector map. <a href="#selector-map-example">See selector map to store data example here</a>
			</span>
		</p>
	</li>
	<li>
		<p style="margin: 0 0 0 10px">
			<a href="#store-resetstate"><b>resetState:</b></a> 
			<code style="margin-left: 5px">(propertyPaths?: Array<string>) => void // resets slices of state referenced by the property paths to their initial values.</code>
		</p>
	</li>
	<li>
		<p style="margin: 0 0 0 10px">
			<a href="#store-setstate"><b>setState:</b></a> 
			<code style="margin-left: 5px">(changes: PartialState<State>) => void // merges only new/changed state slices.</code>
		</p>
	</li>
</ol>
<h3 id="store-resetstate"><code>store.resetState</code> Usage</h3>
<span style="margin: 5px 10px 0 0">-</span>Resets slices of state to their initial state values as desired.<br />
<span style="margin: 5px 10px 0 0">-</span>Accepts an array of property paths referencing the desired slices of state to reset.<br />
<span style="margin: 5px 10px 0 0">-</span>Performs a total state reset when <code>'@@STATE'</code> is present in the property paths array.<br />
<span style="margin: 5px 10px 0 0">-</span>Resets state slices referenced by the calling client's selector map when invoked with 0 arguments.<br />
<span style="margin: 5px 10px 0 16px">-</span>Performs a total state reset when <code>'@@STATE'</code> is present in the calling client's selector map.<br />
<span style="margin: 5px 10px 0 0">-</span>Performs no state reset when a client with no selector map invokes this method with 0 arguments.

<h3 id="store-setstate" style="margin-top:10px"><code>store.setState</code> Usage</h3>
<b><i>Do this:</i></b> <code>setState({stateKey0: changes0[, ...]});</code><br />
<b><i>Not this:</i></b> <code>setState({stateKey0: {...state.stateKey0, ...changes0}[, ...]});</code>
<h3 id="indexing"><b><i><u>Indexing</u></i></b></h3>
Existing array state property can be overridden with a new array.<br />
Use the indexed object to update array content at indexes.<br />
<strong>Example:</strong>

```
// Given the following array bearing state object:
const state = { a: { b: [ { x: 7, y: 8, z: 9 } ] }, j: 10 };

// The following will override the existing array.
store.setState({ a: { b: [ { y: 30 }, 22 ] } });
// updates the state to: { a: { b: [ { y: 30 }, 22 ] }, j: 10 };

// The followinng will update the existing array at indexes.
store.setState({ a: { b: { 0: { y: 30 }, 1: 22 } } });
// updates the state to: { a: { b: [ { x: 7, y: 30, z: 9 }, 22 ] }, j: 10 };

// The previous statement is functionally equivalent to the following:
const [ first, second, ...rest ] = state.a.b;
store.setState({ ...state, a: { ...a, b: [ { ...first, y: 30 }, 22, ...rest ] } });
// Refrain from doing this, please!
```

# API

The React-Observable-Context module contains **4** exports namely:
<ol>
	<li style="padding-bottom: 5px">
		<p style="margin: 0 0 5px 5px">
			<b id="connect">connect</b>
			<p style="margin: -5px 0 0 5px">
				<span style="margin: 5px 10px 0 0">-</span>is a function taking a <code>React-Observable-Context</code> context object and an optional <a href="#selector-map">selector map</a> parameters; and returning a reusable connector function.<br />
				<span style="margin: 5px 10px 0 0">-</span>The connector function takes a client as a parameter and returns an HOC.<br />
				<span style="margin: 5px 10px 0 0">-</span>Any client using similar context object and selector map may be passed to this connector.<br />
				<span style="margin: 5px 10px 0 0">-</span>The HOC injects the context <a href="#store">store</a> to the client and handles all of the context usage requirements.<br />
				<span style="margin: 5px 10px 0 0">-</span>The injected <a href="#store">store</a> monitors changes in the underlying state slices referenced by the selector map.<br />
				<span style="margin: 5px 10px 0 0">-</span>A change in any of the referenced state slices automatically triggers an update of the related <code>store.data</code> property and a subsequent render of the client.<br />
				<span style="margin: 5px 10px 0 0">-</span>Any prop name conflicts between injected <a href="#store">store properties</a> and the client's own props are resolved in favor of the client's own props.
			</p>
		</p>
	</li>
	<li style="padding-bottom: 5px">
		<p style="margin: 0 0 5px 5px">
			<b>createContext</b> is a zero-parameter function returning a <code>React-Observable-Context</code> object. This object is the store-bearing context. To access the context's <a href="#store">store</a>, pass the context as a <code>context</code> parameter to either the <a href="#connect">connect</a> function or the <a href="#usecontext">useContext</a> hook.
		</p>
	</li>
	<li style="padding-bottom: 5px">
		<p style="margin: 0 0 5px 5px">
			<b>UsageError</b> class is the Error type reported for attempts to access this context's store outside of its Provider component tree.
		</p>
	</li>
	<li>
		<p style="margin: 0 0 5px 5px">
			<b id="usecontext">useContext</b>
			<p style="margin: -5px 0 0 5px">
				<span style="margin: 5px 10px 0 0">-</span>is a hook taking a <code>React-Observable-Context</code> context object and an optional <a href="#selector-map">selector map</a> parameters; and returning the context <a href="#store">store</a>.<br />
				<span style="margin: 5px 10px 0 0">-</span>The injected <a href="#store">store</a> monitors changes in the underlying state slices referenced by the selector map.<br />
				<span style="margin: 5px 10px 0 0">-</span>A change in any of the referenced state slices automatically triggers an update of the related <code>store.data</code> property and a subsequent render of the client.<br />
				<span style="margin: 5px 10px 0 0">-</span>The <a href="#connect">connect</a> function is axiomatically the more conducive method for consuming this conetxt.<br />
				<span style="margin: 5px 10px 0 0">-</span>In certain user-specific cases, direct access to this hook may be preferrable.<br />
				<span style="margin: 5px 10px 0 0">-</span>In such cases, it is advisable to wrap the client in a <code>React.memo</code>.
			</p>
		</p>
	</li>
</ol>

# Usage

### <u>*context.js*</u>

    import { connect, createContext, useContext } from '@webkrafters/react-observable-context';
	const ObservableContext = createContext();
	export const connectObservableContext = selectorMap => connect( ObservablContext, selectorMap );
	export const useObservableContext = selectorMap => useContext( ObservableContext, selectorMap );
	export default ObservableContext;

### <u>*ui.js*</u> 
```
/********************************************/
/*  ui.js: using the `connect` HOC method.  */
/********************************************/

import React, { useCallback, useEffect } from 'react';
import ObservableContext, { connnectObservableContext } from './context';

const withConnector = connectObservableContext({ year: 'a.b.x.y.z[0]' });

const Client1 = withConnector(({ data }) => ( <div>Year: { data.year }</div> ));

const Client2 = withConnector(({ data, setState, resetState }) => {
	const onChange = useCallback( e => setState({
		a: { b: { x: { y: { z: { 0: e.target.value } } } } }
	}), [ setState ]);
	useEffect(() => {
		data.year > 2049 && resetState([ 'a.b.c' ]);
	}, [ data.year ]);
	return ( <div>Year: <input type="number" onChange={ onChange } /> );
});

const Ui = () => (
	<div>
		<Client1 />
		<Client2 />
	</div>
);

export default Ui;
```
```
/************************************************/
/*  ui.js: using the `useContext` hook method.  */
/************************************************/

import React, { memo, useCallback, useEffect } from 'react';
import ObservableContext, { useObservableContext } from './context';

const selectorMap = { year: 'a.b.x.y.z[0]' };

const Client1 = memo(() => { // memoize to prevent 'no-change' renders from the parent.
	const { data } = useObservableContext( selectorMap );
	return ( <div>Year: { data.year }</div> );
});

const Client2 = memo(() => { // memoize to prevent 'no-change' renders from the parent.
	const { data, setState, resetState } = useObservableContext( selectorMap );
	const onChange = useCallback( e => setState({
		a: { b: { x: { y: { z: { 0: e.target.value } } } } }
	}), [ setState ]);
	useEffect(() => {
		data.year > 2049 && resetState([ 'a.b.c' ]);
	}, [ data.year ]);
	return ( <div>Year: <input type="number" onChange={ onChange } /> );
});

const Ui = () => (
	<div>
		<Client1 />
		<Client2 />
	</div>
);

export default Ui;
```

### <u>*provider.js*</u>

    import React, { useCallback, useState } from 'react';
	import ObservableContext from './context';
	import Ui from './ui';

	const initialState = { a: { b: { c: 25, x: { y: { z: [ 2022 ] } } } } };
	
	const storage = {
		clone: data => ({ ...data }),
		getItem: key => initialState,
		removeItem ( key ) {},
		setItem ( key, data ) {} 
	};
	
	const updateHooks = {
		resetState: ( ...args ) => {
			console.log( 'resetting state with >>>> ', JSON.stringify( args ) );
			return true;
		},
		setState: ( ...args ) => {
			console.log( 'merging following into state >>>> ', JSON.stringify( args ) );
			return true;
		}
	};
	
	const Provider = () => (
		<ObservableContext.Provider
			prehooks={ updateHooks }
			storage={ storage }
			value={ initialState }
		>
			<Client />
		</ObservableContext.Provider>
	);
	Provider.displayName = 'Provider';
	
	export default Provider;

### <u>*index.js*</u>

    import React from 'react';
    import ReactDOM from 'react-dom';
    import Provider from './provider';
    ReactDOM.render(<Provider />, document.getElementById('root'));

<h1 id="changes">What's Changed?</h1>
<table>
	<tbody>
		<tr><td><b>1.</b></td><td>Added the <a href="#connect"><code>connect</code></a> function to facilitate the encapsulated context-usage method.</td></tr>
		<tr><td><b>2.</b></td><td>Added stronger support for deeply nested state structure. See <a href="#store-setstate"><code>store.setState</code></a></td></tr>
		<tr><td><b>3.</b></td><td>Replaced the <a href="#usecontext"><code>useContext</code></a> watchedKeys array parameter with a <a href="#selector-map"><code>selectorMap</code></a> object.</td></tr>
		<tr><td><b>4.</b></td><td>Removed the necessity for direct store subscription.</td></tr>
		<tr><td><b>5.</b></td><td><a href="#store-resetstate"><code>store.resetState</code></a> can now take a <a href="#property-path">property path</a> array targeting which state slices to reset.</td></tr>
		<tr><td><b>6.</b></td><td>Context provider accepts an optional <a href="#storage">storage</a> prop for memorizing initial state.</td></tr>
		<tr><td><b>7.</b></td><td>Removed the need for <code>store.getState</code>. <code>store.data</code> now holds the state slices used at the client. Changes in any of the slices held by the <code>store.data</code> are automatically updated as they occur. The client is immediately notified of the update.</td></tr>
	</tbody>
</table>


# License

MIT
