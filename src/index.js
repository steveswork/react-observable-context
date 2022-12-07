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
import get from 'lodash.get';
import has from 'lodash.has';
import isEmpty from 'lodash.isempty';
import isEqual from 'lodash.isequal';
import isPlainObject from 'lodash.isplainobject';
import omit from 'lodash.omit';
import pick from 'lodash.pick';

import { v4 as uuid } from 'uuid';

export const DEFAULT_STATE_PATH = null;

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
 * Converts argument to readonly.
 *
 * Note: Mutates original argument.
 *
 * @param {T} v
 * @returns {Readonly<T>}
 * @template T
 */
const makeReadonly = v => {
	let frozen = true;
	if( isPlainObject( v ) ) {
		for( const k in v ) { makeReadonly( v[ k ] ) }
		frozen = Object.isFrozen( v );
	} else if( Array.isArray( v ) ) {
		v.forEach(([ , i ]) => makeReadonly( v[ i ] ))
		frozen = Object.isFrozen( v );
	}
	!frozen && Object.freeze( v );
	return v;
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

/** @template {State} T */
class Accessor {
	static #NUM_INSTANCES = 0;
	/** @type {Set<string>} */
	#clients;
	/** @type {number} */
	#id;
	/** @type {Array<string>} */
	#paths;

	/** @param {Array<string>} accessedPropertyPaths */
	constructor( accessedPropertyPaths ) {
		this.#clients = new Set();
		this.#id = ++Accessor.#NUM_INSTANCES;
		this.#paths accessedPropertyPaths;
		/** @type {boolean} */
		this.refreshDue = false;
		/** @type {Readonly<PartialState<T>>} */
		this.value = makeReadonly({});
	}

	get numClients() { return this.#clients.size }
	get id() { return this.#id }
	get paths() { return this.#paths }
	/** @param {string} clientId */
	addClient( clientId ) { this.#clients.add( clientId ) }
	/** @type {(clientId: string) => boolean} */
	hasClient( clientId ) { return this.#clients.has( clientId ) }
	/**
	 * @param {{[propertyPath: string]: Atom<T>}} atoms
	 * @returns {Readonly<PartialState<T>>}
	 */
	refreshValue( atoms ) {
		if( !this.refreshDue ) { return this.value }
		this.refreshDue = false;
		const paths = this.#paths[ 0 ] === DEFAULT_STATE_PATH
			? Object.keys( atoms )
			: this.#paths;
		for( const p of paths ) {
			if( !( p in atoms ) ) { atoms[ p ] = new Atom() }
			const atom = atoms[ p ];
			!atom.isConnected( this.#id ) &&
			atom.connect( this.#id )
			!isEqual( get( this.value, p ), atom.value ) &&
			set( this.value, p, atom.value );
		}
		this.value = makeReadonly({ ...this.value });
		return this.value;
	};
	/** @type {(clientId: string) => boolean} */
	removeClient( clientId ) { this.#clients.delete( clientId ) }
}

/**
 * An atom represents an entry for each individual property path of the state still in use by client components
 *
 * @template {State} T
 */
class Atom {
	/** @type {Set<number>} */
	#connections;
	/** @type {Readonly<PartialState<T>>} */
	#value

	constructor() {
		this.#connections = new Set();
		this.#value = makeReadonly({});
	}

	/** @returns {Readonly<PartialState<T>>} */
	get value () { return this.#value }
	/** @param { PartialState<T>} newValue */
	set value( newValue ) { this.#value = makeReadonly( clonedeep( newValue ) ) }
	/**
	 * @param {number} accessorId
	 * @returns {number} Number of connections remaining
	 */
	connect( accessorId ) {
		this.#connections.add( accessorId );
		return this.#connections.size;
	}
	/**
	 * @param {number} accessorId
	 * @returns {number} Number of connections remaining
	 */
	disconnect( accessorId ) {
		this.#connections.delete( accessorId );
		return this.#connections.size;
	}
	/** @param {number} accessorId */
	isConnected( accessorId ) { return this.#connections.has( accessorId ) }
}

/** @template {State} T */
class AccessorCache {
	/** @type {{[propertyPaths: string]: Accessor<T>}} */
	#accessors;
	/** @type {{[propertyPath: string]: Atom<T>}} */
	#atoms;

	constructor() {
		this.#accessors = {};
		this.#atoms = {};
	}

	/**
	 * Add new accessor to the cache
	 *
	 * @param {string} cacheKey
	 * @param {Array<string>} propertyPaths
	 * @return {Accessor<T>}
	 */
	#createAccessor( cacheKey, propertyPaths ) {
		this.#accessors[ cacheKey ] = new Accessor( propertyPaths );
		const atoms = this.#atoms;
		for( const path of propertyPaths ) {
			if( path in atoms || path === DEFAULT_STATE_PATH ) { continue }
			atoms[ path ] = new Atom();
		}
		return this.#accessors[ cacheKey ];
	}
	/** @type {(clientId: string, ...propertyPaths: string[]) => Readonly<PartialState<T>>} */
	get( clientId, ...propertyPaths ) {
		const cacheKey = JSON.stringify( isEmpty( propertyPaths ) ? [ DEFAULT_STATE_PATH ] : propertyPaths );
		const accessor = cacheKey in this.#accessors
			? this.#accessors[ cacheKey ]
			: this.#createAccessor( cacheKey, propertyPaths );
		!accessor.hasClient( clientId ) && accessor.addClient( clientId );
		return accessor.refreshValue( this.#atoms );
	}
	/** @param {string} clientId */
	unlinkClient( clientId ) {
		const accessors = this.#accessors;
		const atoms = this.#atoms;
		for( const k in accessors ) {
			const accessor = accessors[ k ];
			if( !accessor.removeClient( clientId ) || accessor.numClients ) { continue }
			for( const p of accessor.paths ) {
				if( p in atoms && atoms[ p ].disconnect( accessor.id ) < 1 ) {
					delete atoms[ p ];
				}
			}
			delete accessors[ k ];
		}
	}
	/**
	 * @param {T} source
	 * @param {PartialState<T>} newChanges
	 */
	watchSource( source, newChanges ) {
		const accessors = this.#accessors;
		const atoms = this.#atoms;
		for( const path in atoms ) {
			if( !has( newChanges, path ) ) { continue }
			atoms[ path ].value = get( source, path );
			for( const k in accessors ) {
				if( !accessors[ k ].refreshDue || accessors[ k ].paths.includes( path ) ) {
					accessors[ k ].refreshDue = true;
				}
			}
		}
	}
}

/**
 * @param {T} initStateValue
 * @template {State} T
 */
const useStateManager = initStateValue => {
	/** @type {[T, Function]} */
	const [ state ] = useState(() => clonedeep( initStateValue ));
	/** @type {[AccessorCache<T>, Function]} */
	const [ cache ] = useState(() => new AccessorCache());
	/** @type {StoreInternal<T>["getState"]} */
	const select = useCallback(( clientId, ...propertyPaths ) => cache.get( clientId, ...propertyPaths ), []);
	/** @type {Listener<T>} */
	const stateWatch = useCallback( newValue => cache.watchSource( state, newValue ), [] );
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
			: clondeep( initialState.current );
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
			const newList = Array.from( listeners ).unshift( stateWatch );
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

/** @typedef {{[x:string]: *}} State */

/**
 * @typedef {{[K in keyof T]?: T[K]}} PartialState
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
