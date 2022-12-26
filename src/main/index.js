import React, {
	Children,
	cloneElement,
	createContext as _createContext,
	memo,
	useCallback,
	useContext as _useContext,
	useEffect,
	useMemo,
	useRef,
	useState
} from 'react';

import isEmpty from 'lodash.isempty';
import isEqual from 'lodash.isequal';
import isPlainObject from 'lodash.isplainobject';
import omit from 'lodash.omit';

import { v4 as uuid } from 'uuid';

import useRenderKeyProvider from './hooks/use-render-key-provider';

import useStore from './hooks/use-store';

export class UsageError extends Error {}

/**
 * @readonly
 * @type {Prehooks<T>}
 * @template {State} T
 */
const defaultPrehooks = Object.freeze({});

/** @type {NonReactUsageReport} */
const reportNonReactUsage = () => {
	throw new UsageError( 'Detected usage outside of this context\'s Provider component tree. Please apply the exported Provider component' );
};

/** @type {FC<{child: ReactNode}>} */
const ChildMemo = (() => {
	const useNodeMemo = node => {
		const nodeRef = useRef( node );
		if( !isEqual(
			omit( nodeRef.current, '_owner' ),
			omit( node, '_owner' )
		) ) { nodeRef.current = node }
		return nodeRef.current;
	};
	const ChildMemo = memo(({ child }) => child );
	ChildMemo.displayName = 'ObservableContext.Provider.Internal.Guardian.ChildMemo';
	const Guardian = ({ child }) => ( <ChildMemo child={ useNodeMemo( child ) } /> );
	Guardian.displayName = 'ObservableContext.Provider.Internal.Guardian';
	return Guardian;
})();

/** @type {(children: ReactNode) => ReactNode} */
const memoizeImmediateChildTree = children => Children.map( children, child => {
	if( typeof child.type === 'object' && 'compare' in child.type ) { return child } // memo element
	if( child.props?.children ) {
		child = cloneElement(
			child,
			omit( child.props, 'children' ),
			memoizeImmediateChildTree( child.props.children )
		);
	}
	return ( <ChildMemo child={ child } /> );
} );

/** @param {Provider<IStore>} Provider */
const makeObservable = Provider => {
	/**
	 * @type {ObservableProvider<T>}
	 * @template {State} T
	 */
	const Observable = ({
		children = null,
		prehooks = defaultPrehooks,
		storage = null,
		value
	}) => (
		<Provider value={ useStore( prehooks, value, storage ) }>
			{ memoizeImmediateChildTree( children ) }
		</Provider>
	);
	Observable.displayName = 'ObservableContext.Provider';
	return Observable;
};

/**
 * @param {ObservableContext<T>} context Refers to the PublicObservableContext<T> type of the ObservableContext<T>
 * @param {{[selectorKey: string]: string|keyof T}} [selectorMap] Key:value pairs where `key` => arbitrary key given to Store.data property holding the state slices and `value` => property paths to state slices used by this component: see examples below. May use `{..., state: '@@STATE'}` to indicate a desire to obtain the entire state object and assign to a `state` property of Store.data. A change in any of the referenced properties results in this component render. When using `['@@STATE']`, any change in the state object results in this component render.
 * @returns {(WrappedComponent: C) => MemoExoticComponent<P>}
 * @template {State} T
 * @template {PartialStore<T> & {[x:string]:*}} [P=PartialStore<T>]
 * @template {ComponentType<P>|ExoticComponent<P>} C
 * @see {ObservableContext<T>}
 * @see {useContext} for selectorMap sample
 */
export const connect = ( context, selectorMap ) => WrappedComponent => {
	if( !isPlainObject( WrappedComponent ) || !( 'compare' in WrappedComponent ) ) {
		WrappedComponent = memo( WrappedComponent );
	}
	const ConnectedComponent = memo( ownProps => {
		const store = useContext( context, selectorMap );
		return( <WrappedComponent { ...store } { ...ownProps } /> );
	} );
	ConnectedComponent.displayName = 'ObservableContext.Connected';
	return ConnectedComponent;
};

/**
 * @returns {ObservableContext<T>} Refers to the IObservableContext<T> type of the ObservableContext<T>
 * @template {State} T
 * @see {ObservableContext<T>}
 */
export const createContext = () => {
	const Context = _createContext({
		getState: reportNonReactUsage,
		resetState: reportNonReactUsage,
		setState: reportNonReactUsage,
		subscribe: reportNonReactUsage
	});
	const provider = Context.Provider;
	Context.Provider = makeObservable( provider );
	return Context;
};

/**
 * Actively monitors the store and triggers component re-render if any of the watched keys in the state objects changes
 *
 * @param {ObservableContext<T>} context Refers to the PublicObservableContext<T> type of the ObservableContext<T>
 * @param {{[selectorKey: string]: string|keyof T}} [selectorMap = {}] Key:value pairs where `key` => arbitrary key given to Store.data property holding the state slices and `value` => property paths to state slices used by this component: see examples below. May use `{..., state: '@@STATE'}` to indicate a desire to obtain the entire state object and assign to a `state` property of Store.data. A change in any of the referenced properties results in this component render. When using `['@@STATE']`, any change in the state object results in this component render.
 * @returns {Store<T>}
 * @template {State} T
 * @see {ObservableContext<T>}
 * @example
 * a valid propertyPath follows the `lodash` object property path convention.
 * for a state = { a: 1, b: 2, c: 3, d: { e: 5, f: [6, { x: 7, y: 8, z: 9 } ] } }
 * Any of the following is an applicable selector map.
 * {count: 'a', myData: 'd'} => {count: 1, myData: { e: 5, f: [6, { x: 7, y: 8, z: 9 } ] }}
 * {count: 'a'} => {count: 1} // same applies to {count: 'b'} = {count: 2}; {count: 'c'} = {count: 3}
 * {myData: 'd'} => {mydata: { e: 5, f: [6, { x: 7, y: 8, z: 9 } ] }}
 * {xyz: 'd.e'} => {xyz: 5}
 * {def: 'd.e.f'} => {def: [6, { x: 7, y: 8, z: 9 } ]}
 * {f1: 'd.e.f[0]'} or {f1: 'd.e.f.0'} => {f1: 6}
 * {secondFElement: 'd.e.f[1]'} or {secondFElement: 'd.e.f.1'} => {secondFElement: { x: 7, y: 8, z: 9 }}
 * {myX: 'd.e.f[1].x'} or {myX: 'd.e.f.1.x'} => {myX: 7} // same applies to {myY: 'd.e.f[1].y'} = {myY: 8}; {myZ: 'd.e.f[1].z'} = {myZ: 9}
 * {myData: '@@STATE'} => {myData: state}
 */
export const useContext = ( context, selectorMap = {} ) => {

	/** @type {StoreInternal<T>} */
	const {
		getState: _getState,
		resetState: _resetState,
		subscribe,
		unlinkCache,
		...store
	} = _useContext( context );

	const [ clientId ] = useState( uuid );

	const _renderKeys = useRenderKeyProvider( selectorMap );

	/** @type {{[propertyPath: string]: string}} Reversed selectorMap i.e. {selectorKey: propertyPath} => {propertyPath: selectorKey} */
	const path2SelectorMap = useMemo(() => {
		const map = {};
		if( isEmpty( _renderKeys ) ) { return map };
		for( const selectorKey in selectorMap ) {
			map[ selectorMap[ selectorKey ] ] = selectorKey;
		}
		return map;
	}, [ _renderKeys ]);

	/** @type {[Data, Function]} */
	const [ data, setData ] = useState(() => {
		const data = {};
		if( isEmpty( _renderKeys ) ) { return data }
		const state = _getState( clientId, ..._renderKeys );
		for( const path of _renderKeys ) {
			data[ path2SelectorMap[ path ] ] = state[ path ];
		}
		return data;
	});

	const updateData = () => {
		let hasChanges = false;
		const state = _getState( clientId, ..._renderKeys );
		for( const path of _renderKeys ) {
			if( data[ path2SelectorMap[ path ] ] !== state[ path ] ) {
				data[ path2SelectorMap[ path ] ] = state[ path ];
				hasChanges = true;
			}
		}
		hasChanges && setData({ ...data });
	};

	/**
	 * @type {Store<T>["resetState"]}
	 * @template {State} T
	 */
	const resetState = useCallback(( propertyPath = _renderKeys ) => _resetState( propertyPath ), [ _renderKeys ]);

	useEffect(() => { // sync data states with new renderKeys
		if( isEmpty( _renderKeys ) ) {
			!isEqual( {}, data ) && setData( {} );
			return;
		}
		for( const selectorKey in data ) {
			if( !( selectorMap[ selectorKey ] in path2SelectorMap ) ) {
				delete data[ selectorKey ];
			}
		}
		const unsubscribe = subscribe( updateData );
		updateData();
		return () => {
			unsubscribe();
			unlinkCache( clientId );
		};
	}, [ _renderKeys ]);

	return useMemo(() => ({ data, resetState, ...store }), [ data ]);
};

/**
 * @typedef {IObservableContext<T>|PublicObservableContext<T>} ObservableContext
 * @template {State} T
 */

/**
 * @typedef {WithObservableProvider<Context<Store<T>>, T>} PublicObservableContext
 * @template {State} T
 */

/**
 * @typedef {WithObservableProvider<Context<IStore>, T>} IObservableContext
 * @template {State} T
 */

/**
 * @typedef {T & {Provider: ObservableProvider<S>}} WithObservableProvider
 * @template T
 * @template {State} S
 */

/**
 * @typedef {FC<{
 * 		children?: ReactNode,
 * 		prehooks?: Prehooks<T>
 * 		storage?: IStorage<T>
 * 		value: PartialState<T>
 * }>} ObservableProvider
 * @template {State} T
 */

/** @typedef {import("../types").State} State */

/**
 * @typedef {import("../types").PartialState<T>} PartialState
 * @template {State} T
 */

/**
 * @typedef {import("../types").Prehooks<T>} Prehooks
 * @template {State} T
 */

/**
 * @typedef {import("../types").StoreInternal<T>} StoreInternal
 * @template {State} T
 */

/**
 * @typedef {{[K in keyof Store<T>]?: Store<T>[K]}} PartialStore
 * @template {State} T
 */

/**
 * @typedef {import("../types").Store<T>} Store
 * @template {State} T
 */

/** @typedef {import("../types").IStore} IStore */

/**
 * @typedef {import("../types").IStorage<T>} IStorage
 * @template {State} T
 */

/** @typedef {import("../types").NonReactUsageReport} NonReactUsageReport */

/** @typedef {import("../types").Data} Data */

/** @typedef {import("react").ReactNode} ReactNode */

/**
 * @typedef {import('react').MemoExoticComponent<ComponentType<P>} MemoExoticComponent
 * @template {{[x:string]:*}} [P={}]
 */

/**
 * @typedef {import("react").ExoticComponent<ComponentType<P>>} ExoticComponent
 * @template {{[x:string]:*}} [P={}]
 */

/**
 * @typedef {import("react").ComponentType<P>} ComponentType
 * @template [P=any]
 */

/**
 * @typedef {import("react").FC<P>} FC
 * @template [P={}]
 */

/**
 * @typedef {import("react").Provider<T>} Provider
 * @template T
 */

/**
 * @typedef {import("react").Context<T>} Context
 * @template T
 */
