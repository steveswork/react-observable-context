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

import clonedeep from 'lodash.clonedeep';
import has from 'lodash.has';
import isEmpty from 'lodash.isempty';
import isEqual from 'lodash.isequal';
import isPlainObject from 'lodash.isplainobject';
import omit from 'lodash.omit';

import { v4 as uuid } from 'uuid';

import AccessorCache from '../model/accessor-cache';

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

const _setState = (() => {
	const initDiff = ( propKey, changed, replaced ) => {
		changed[ propKey ] = {};
		replaced[ propKey ] = {};
	};
	const setAtomic = ( state, newState, changed, replaced, stateKey ) => {
		if( isEqual( state[ stateKey ], newState[ stateKey ] ) ) { return }
		const isArrayNewState = Array.isArray( newState[ stateKey ] );
		if( Array.isArray( state[ stateKey ] ) && isArrayNewState ) {
			return setArray( state, newState, changed, replaced, stateKey );
		}
		const isPlainObjectNewState = isPlainObject( newState[ stateKey ] );
		if( isPlainObject( state[ stateKey ] ) && isPlainObjectNewState ) {
			return setPlainObject( state, newState, changed, replaced, stateKey )
		}
		if( stateKey in state ) {
			replaced[ stateKey ] = state[ stateKey ];
		}
		state[ stateKey ] = isArrayNewState || isPlainObjectNewState
			? clonedeep( newState[ stateKey ] )
			: newState[ stateKey ];
		changed[ stateKey ] = newState[ stateKey ];
	};
	const setArray = ( state, newState, changed, replaced, rootKey ) => {
		initDiff( rootKey, changed, replaced );
		for( let i = 0, len = newState[ rootKey ].length; i < len; i++ ) {
			setAtomic( state[ rootKey ], newState[ rootKey ], changed[ rootKey ], replaced[ rootKey ], i );
		}
	};
	const setPlainObject = ( state, newState, changed, replaced, rootKey ) => {
		initDiff( rootKey, changed, replaced );
		set( state[ rootKey ], newState[ rootKey ], changed[ rootKey ], replaced[ rootKey ] );
	};
	const set = ( state, newState, changed = {}, replaced = {} ) => {
		for( const k in newState ) {
			setAtomic( state, newState, changed, replaced, k );
		}
	};
	/**
	 * @param {T} state
	 * @param {PartialState<T>} newState
	 * @param {Listener<T>} onStateChange
	 * @template {State} T
	 */
	return ( state, newState, onStateChange ) => {
		/** @type {PartialState<T>} */
		const newChanges = {};
		/** @type {PartialState<T>} */
		const replacedValue = {};
		set( state, newState, newChanges, replacedValue );
		!isEmpty( newChanges ) && onStateChange( newChanges, replacedValue );
	};
})();

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
	return { select, state, stateWatch, unlink };
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
	const onChange = ( newValue, oldValue ) => listeners.forEach( listener => listener( newValue, oldValue ) );

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

	/** @type {[StoreInternal<T>, Function]} */
	const [ store ] = useState(() => ({
		getState: select, resetState, setState, subscribe, unlinkCache: unlink
	}));

	return store;
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
 * @param {Array<string|keyof T>} [watchedKeys = []] A list of state object property paths to watch. A change in any of the referenced properties results in this component render.
 * @returns {Store<T>}
 * @template {State} T
 */
export const useContext = ( context, watchedKeys = [] ) => {

	/** @type {StoreInternal<T>} */
	const { getState: _getState, unlinkCache, ...store } = _useContext( context );

	const [ , tripRender ] = useState( false );

	const [ clientId ] = useState( uuid );

	const watched = useMemo(() => (
		Array.isArray( watchedKeys )
			? Array.from( new Set( watchedKeys ) )
			: []
	), [ watchedKeys ]);

	useEffect(() => {
		if( !watched.length ) { return }
		return store.subscribe( newChanges => {
			watched.some( w => has( newChanges, w ) ) &&
			tripRender( s => !s );
		} );
	}, [ watched ]);

	useEffect(() => () => unlinkCache( clientId ), []);

	/** @type {Store<T>["getState"]} */
	const getState = useCallback(( ...propertyPaths ) => _getState( clientId, ...propertyPaths ), []);

	return { getState, ...store };
};

/**
 * @typedef {IObservableContext & Context<Store<T>>} ObservableContext
 * @template {State} T
 */

/** @typedef {Context<IStore>} IObservableContext */

/**
 * @typedef {(newValue: PartialState<T>, oldValue: PartialState<T>) => void} Listener
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
 * @typedef {Store<T> & {
 * 		getState: (clientId: string, ...propertyPaths?: string[]) => Readonly<PartialState<T>>,
 * 		unlinkCache: (clientId: string) => void
 * }} StoreInternal
 * @template {State} T
 */

/**
 * @typedef {IStore & {
 *   getState: (...propertyPaths?: string[]) => Readonly<PartialState<T>>,
 *   resetState: VoidFunction,
 *   setState: (changes: PartialState<T>) => void,
 *   subscribe: (listener: Listener<T>) => Unsubscribe
 * }} Store
 * @template {State} T
 */

/** @typedef {{[K in IStoreKeys]: typeof reportNonReactUsage}} IStore */

/** @typedef {"getState"|"resetState"|"setState"|"subscribe"} IStoreKeys */

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
