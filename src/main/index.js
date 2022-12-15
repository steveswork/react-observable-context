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

import clonedeep from 'lodash.clonedeep'
;import isEmpty from 'lodash.isempty';
import isEqual from 'lodash.isequal';
import omit from 'lodash.omit';

import { v4 as uuid } from 'uuid';

import AccessorCache from '../model/accessor-cache';

import _setState from './set-state';

const FULL_STATE_SELECTOR = '@@STATE';

const NULL_STATE_SELECTOR = '';

export class UsageError extends Error {}

/**
 * @readonly
 * @type {Prehooks<T>}
 * @template {State} T
 */
const defaultPrehooks = Object.freeze({});

const reportNonReactUsage = () => {
	throw new UsageError( 'Detected usage outside of this context\'s Provider component tree. Please apply the exported Provider component' );
};

/**
 * @param {Prehooks<T>} prehooks
 * @template {State} T
 */
const usePrehooksRef = prehooks => {
	const prehooksRef = useRef( prehooks );
	useEffect(() => { prehooksRef.current = prehooks }, [ prehooks ]);
	return prehooksRef;
};

/**
 * @param {string[]} renderKeys
 * @returns {string[]}
 */
const useRenderKeysManager = renderKeys => {

	const curKeys = useRef([]);

	const managedKeys = useMemo(() => {
		if( !isEqual( curKeys.current, renderKeys ) ) {
			curKeys.current = renderKeys;
		}
		return curKeys.current;
	}, [ renderKeys ]);

	return useMemo(() => {
		const selectors = Array.isArray( managedKeys )
			? Array.from( new Set( managedKeys ) )
			: []
		if( isEmpty( selectors ) ) {
			selectors[ 0 ] = NULL_STATE_SELECTOR; // empty string propertyPath causes the state-manager getState to return `undefined`
		} else if( managedKeys.includes( FULL_STATE_SELECTOR ) ) {
			selectors.length = 0; // no propertyPath argument causes state-manager getState to return complete state
		}
		return selectors;
	}, [ managedKeys ]);
};

/**
 * @param {T} initStateValue
 * @template {State} T
 */
const useStateManager = initStateValue => {
	/** @type {[T, Function]} */
	const [ state ] = useState(() => clonedeep( initStateValue ));
	/** @type {[AccessorCache<T>, Function]} */
	const [ cache ] = useState(() => new AccessorCache( state ));
	/** @type {StoreInternal<T>["getState"]} */
	const select = useCallback( cache.get.bind( cache ), []);
	/** @type {Listener<T>} */
	const stateWatch = useCallback( cache.watchSource.bind( cache ), [] );
	/** @type {StoreInternal<T>["unlinkCache"]} */
	const unlink = useCallback( clientId => cache.unlinkClient( clientId ), [] );
	return useState(() => ({ select, state, stateWatch, unlink }))[ 0 ];
};

/**
 * @param {Prehooks<T>} prehooks
 * @param {T} value
 * @template {State} T
 */
const useStore = ( prehooks, value ) => {

	const prehooksRef = usePrehooksRef( prehooks );
	/** @type {MutableRefObject<string>} */
	const sessionKey = useRef();
	/** @type {MutableRefObject<PartialState<T>>} */
	const initialState = useRef({});

	const { select, state, stateWatch, unlink } = useStateManager( value );

	/** @type {[Set<Listener<T>>, Function]} */
	const [ listeners ] = useState(() => new Set());

	/** @type {Listener<T>} */
	const onChange = state => listeners.forEach( listener => listener( state ) );

	/** @type {StoreInternal<T>["resetState"]} */
	const resetState = useCallback(() => {
		const original = typeof sessionKey.current !== 'undefined'
			? JSON.parse( globalThis.sessionStorage.getItem( sessionKey.current ) )
			: clonedeep( initialState.current );
		( !( 'resetState' in prehooksRef.current ) ||
			prehooksRef.current.resetState({
				current: clonedeep( state ), original
			})
		) && _setState( state, original, onChange )
	}, []);

	/** @type {StoreInternal<T>["setState"]} */
	const setState = useCallback( changes => {
		changes = clonedeep( changes );
		( !( 'setState' in prehooksRef.current ) ||
			prehooksRef.current.setState( changes )
		) && _setState( state, changes, onChange );
	}, [] );

	/** @type {StoreInternal<T>["subscribe"]} */
	const subscribe = useCallback( listener => {
		listeners.add( listener );
		return () => listeners.delete( listener );
	}, [] );

	useEffect(() => {
		if( typeof globalThis.sessionStorage?.setItem !== 'undefined' ) {
			const sKey = `${ uuid() }:${ Date.now() }:${ Math.random() }`;
			try {
				globalThis.sessionStorage.setItem( sKey, JSON.stringify( value ) );
				sessionKey.current = sKey;
				return () => globalThis.sessionStorage.removeItem( sKey );
			} catch( e ) { console.warn( e ) }
		}
		initialState.current = clonedeep( value );
	}, []);

	useEffect(() => setState( clonedeep( value ) ), [ value ]);

	useEffect(() => {
		if( !listeners.size ) {
			listeners.add( stateWatch );
		} else {
			const newList = Array.from( listeners );
			newList.unshift( stateWatch );
			listeners.clear();
			newList.forEach( l => { listeners.add( l ) } );
		}
		return () => listeners.delete( stateWatch );
	}, [ stateWatch ]);

	return useState(() => ({
		getState: select, resetState, setState, subscribe, unlinkCache: unlink
	}))[ 0 ];
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
	 * @type {FC<{
	 * 		children?: ReactNode,
	 * 		prehooks?: Prehooks<T>
	 * 		value: PartialState<T>
	 * }>}
	 * @template {State} T
	 */
	const Observable = ({
		children = null,
		prehooks = defaultPrehooks,
		value
	}) => (
		<Provider value={ useStore( prehooks, value ) }>
			{ memoizeImmediateChildTree( children ) }
		</Provider>
	);
	Observable.displayName = 'ObservableContext.Provider';
	return Observable;
};

/**
 * @returns {ObservableContext<T>}
 * @template {State} T
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
 * @param {ObservableContext<T>} context
 * @param {Array<string|keyof T>} [renderKeys = []] a list of paths to state object properties used by this component: see examples below. May use `['@@STATE']` to indicate a desire to obtain the entire state object. A change in any of the referenced properties results in this component render. When using `['@@STATE']`, any change in the state object results in this component render.
 * @returns {Store<T>}
 * @template {State} T
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
 * @typedef {IObservableContext|Context<Store<T>>} ObservableContext
 * @template {State} T
 */

/** @typedef {Context<IStore>} IObservableContext */

/**
 * @typedef {import("../types").Listener<T>} Listener
 * @template {State} T
 */

/** @typedef {import("../types").State} State */

/**
 * @typedef {import("../types").PartialState<T>} PartialState
 * @template {State} T
 */

/**
 * @typedef {{
 * 		resetState?: (state: { current: T, original: T}) => boolean,
 * 		setState?: (newChanges: PartialState<T>) => boolean
 * }} Prehooks
 * @template {State} T
 */

/**
 * @typedef {{[K in "resetState"|"setState"]: Store<T>[K]} & {
 * 		getState: (clientId: string, ...propertyPaths?: string[]) => Readonly<PartialState<T>>,
 *		subscribe: (listener: Listener<T>) => Unsubscribe
 * 		unlinkCache: (clientId: string) => void
 * }} StoreInternal
 * @template {State} T
 */

/**
 * @typedef {{
 *		data: PartialState<T>,
 *		resetState: VoidFunction,
 *		setState: (changes: PartialState<T>) => void,
 * }} Store
 * @template {State} T
 */

/** @typedef {{[K in "getState"|"resetState"|"setState"|"subscribe"]: typeof reportNonReactUsage}} IStore */

/** @typedef {VoidFunction} Unsubscribe */

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

/**
 * @typedef {import('react').MutableRefObject<T>} MutableRefObject
 * @template T
 */
