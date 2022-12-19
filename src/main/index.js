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
 * @param {Array<string|keyof T>} [renderKeys = []] a list of paths to state object properties used by this component: see examples below. May use `['@@STATE']` to indicate a desire to obtain the entire state object. A change in any of the referenced properties results in this component render. When using `['@@STATE']`, any change in the state object results in this component render.
 * @returns {Store<T>}
 * @template {State} T
 * @see {ObservableContext<T>}
 * @example
 * a valid renderKey follows the `lodash` object property path convention.
 * for a state = { a: 1, b: 2, c: 3, d: { e: 5, f: [6, { x: 7, y: 8, z: 9 } ] } }
 * Any of the following is a valid renderKey
 * 'a' => 1 // same applies to 'b' = 2; 'c' = 3
 * 'd' => { e: 5, f: [6, { x: 7, y: 8, z: 9 } ] }
 * 'd.e' => 5
 * 'd.e.f => [6, { x: 7, y: 8, z: 9 } ]
 * 'd.e.f[0]' or 'd.e.f.0' => 6
 * 'd.e.f[1]' or 'd.e.f.1' => { x: 7, y: 8, z: 9 }
 * 'd.e.f[1].x' or 'd.e.f.1.x' => 7 // same applies to 'd.e.f[1].y' = 8; 'd.e.f[1].z' = 9
 * '@@STATE' => state
 */
export const useContext = ( context, renderKeys = [] ) => {

	/** @type {StoreInternal<T>} */
	const { getState: _getState, subscribe, unlinkCache, ...store } = _useContext( context );

	const [ clientId ] = useState( uuid );

	const _renderKeys = useRenderKeysManager( renderKeys );

	/** @returns {Readonly<PartialState<T>>} */
	const getState = () => _getState( clientId, ..._renderKeys );

	const [ data, setData ] = useState( getState );

	useMemo(() => setData( getState() ), [ _renderKeys ]); // re-initialize data states

	useEffect(() => subscribe(() => setData( getState() )), [ _renderKeys ]);

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
