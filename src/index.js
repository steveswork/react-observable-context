import React, {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useRef,
	useState
} from 'react';

import isEmpty from 'lodash.isempty';

export class UsageError extends Error {}

/** @type {OptionalTask} */
const reportNonReactUsage = () => {
	throw new UsageError( 'Detected usage outside of this context\'s Provider component tree. Please apply the exported Provider component' );
};

/**
 * @type {(state: T) => PartialState<T>}
 * @template {State} T
 */
const defaultSelector = state => state;

/**
 * @type {ObservableContext<T>}
 * @template {State} T
 */
const StoreContext = createContext({
	getState: reportNonReactUsage,
	resetState: reportNonReactUsage,
	setState: reportNonReactUsage,
	subscribe: reportNonReactUsage
});

/**
 * @return {Store<T>}
 * @template {State} T
 */
export const useStore = () => useContext( StoreContext );

/**
 * @type {import("react").Provider<T>}
 * @template {State} T
 */
export const Provider = ({ children = null, value }) => {
	const valueRef = useRef( value );
	/** @type {[Set<Listener<T>>, Function]} */
	const [ listeners ] = useState(() => new Set());
	/** @type {Listener<T>} */
	const onChange = ( newValue, oldValue ) => listeners.forEach( listener => listener( newValue, oldValue ) );
	/** @type {Store<T>["getState"]} */
	const getState = useCallback(( selector = defaultSelector ) => selector( valueRef.current ), []);
	/** @type {Store<T>["resetState"]} */
	const resetState = useCallback(() => setState( value ), []);
	/** @type {Store<T>["setState"]} */
	const setState = useCallback( changes => {
		/** @type {PartialState<T>} */
		const newChanges = {};
		/** @type {PartialState<T>} */
		const replacedValue = {};
		for( const k in changes ) {
			if( valueRef.current[ k ] === changes[ k ] ) { continue }
			replacedValue[ k ] = valueRef.current[ k ];
			valueRef.current[ k ] = changes[ k ];
			newChanges[ k ] = changes[ k ];
		}
		!isEmpty( newChanges ) && onChange( newChanges, replacedValue );
	}, [] );
	/** @type {Store<T>["subscribe"]} */
	const subscribe = useCallback( listener => {
		listeners.add( listener );
		return () => listeners.delete( listener );
	}, [] );
	useEffect(() => setState( value ), [ value ]);
	/** @type {[Store<T>, Function]} */
	const [ store ] = useState(() => ({ getState, resetState, setState, subscribe }));
	return (
		<StoreContext.Provider value={ store }>
			{ children }
		</StoreContext.Provider>
	);
};
Provider.displayName = 'ObservableContext.Provider';

/**
 * @typedef {import("react").Context<Store<T>>} ObservableContext
 * @template {State} T
 */

/**
 * @typedef {F extends void ? () => never : F} OptionalTask
 * @template [F=void]
 */

/**
 * @typedef {(newValue: PartialState<T>, oldValue: PartialState<T>) => void} Listener
 * @template {State} T
 */

/** @typedef {{[x:string]: *}} State */

/**
 * @typedef {{[x:string]: *} & {[K in keyof T]?: T[K]}} PartialState
 * @template {State} T
 */

/**
 * @typedef {(state: T) => *} Selector
 * @template {State} T
 */

/**
 * @typedef {{
 *   getState: OptionalTask<(selector?: Selector<T>) => *>,
 *   resetState: OptionalTask<VoidFunction>,
 *   setState: OptionalTask<(changes: PartialState<T>) => void>,
 *   subscribe: OptionalTask<(listener: Listener<T>) => Unsubscribe>
 * }} Store
 * @template {State} T
 */

/** @typedef {VoidFunction} Unsubscribe */
