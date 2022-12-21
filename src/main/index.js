import React, {
	Children,
	cloneElement,
	createContext as _createContext,
	memo,
	useContext as _useContext,
	useEffect,
	useMemo,
	useRef,
	useState
} from 'react';

import isEmpty from 'lodash.isempty';
import isEqual from 'lodash.isequal';
import omit from 'lodash.omit';

import { v4 as uuid } from 'uuid';

import useRenderKeysManager from './hooks/use-render-keys-manager';

import useStore from './hooks/use-store'

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
	const { getState: _getState, subscribe, unlinkCache, ...store } = _useContext( context );

	const [ clientId ] = useState( uuid );

	const _renderKeys = useRenderKeysManager( selectorMap );

	/** @type {{[propertyPath: string]: string}} Reversed selectorMap i.e. {selectorKey: propertyPath} => {propertyPath: selectorKey} */
	const path2SelectorMap = useMemo(() => {
		const map = {};
		for( const selectorKey in selectorMap ) {
			map[ selectorMap[ selectorKey ] ] = selectorKey;
		}
		return map;
	}, [ _renderKeys ]);

	/**
	 * @param {Data} [currData={}]
	 * @returns {Data}
	 */
	const getState = ( currData = {} ) => {
		let hasChanges = false;
		const state = _getState( clientId, ..._renderKeys );
		if( state === currData ) { return }
		if( isEmpty( state ) && !isEmpty( currData ) ) {
			return setData({});
		}
		for( const selectorKey in currData ) {
			if( !( selectorMap[ selectorKey ] in state ) ) {
				delete currData[ selectorKey ];
				hasChanges = true;
			}
		}
		for( const path in state ) {
			if( currData[ path2SelectorMap[ path ] ] !== state[ path ] ) {
				currData[ path2SelectorMap[ path ] ] = state[ path ];
				hasChanges = true;
			}
		}
		hasChanges && setData({ ...currData });
	};

	const [ data, setData ] = useState( getState );

	useMemo(() => setData( getState( data ) ), [ _renderKeys ]); // re-initialize data states

	useEffect(() => subscribe(() => setData( getState( data ) )), [ _renderKeys ]);

	useEffect(() => () => unlinkCache( clientId ), []);

	return useMemo(() => ({ data, ...store }), [ data ]);
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
 * @typedef {import("../types").Store<T>} Store
 * @template {State} T
 */

/** @typedef {import("../types").IStore} IStore */

/**
 * @typedef {import("../types").IStorage<T>} IStorage
 * @template {State} T
 */

/** @typedef {import("../types").NonReactUsageReport} NonReactUsageReport */

/** @typedef {{[selectorKey: string]: Readonly<*>}} Data */

/** @typedef {import("react").ReactNode} ReactNode */

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
