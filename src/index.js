import React, {
	createContext as _createContext,
	useCallback,
	useEffect,
	useRef,
	useState
} from 'react';

import clonedeep from 'lodash.clonedeep';
import isEmpty from 'lodash.isempty';

export class UsageError extends Error {}

/** @type {OptionalTask} */
const reportNonReactUsage = () => {
	throw new UsageError( 'Detected usage outside of this context\'s Provider component tree. Please apply the exported Provider component' );
};

/**
 * @param {T} state
 * @return {PartialState<T>}
 * @template {State} T
 */
const defaultSelector = state => state;

/**
 * @returns {ObservableContext<T>}
 * @template {State} T
 */
export const createContext = () => _createContext({
	getState: reportNonReactUsage,
	resetState: reportNonReactUsage,
	setState: reportNonReactUsage,
	subscribe: reportNonReactUsage
});

/**
 * @readonly
 * @type {Prehooks<T>}
 * @template {State} T
 */
const defaultPrehooks = Object.freeze({});

/**
 * @param {T} state
 * @param {PartialState<T>} newState
 * @param {Listener<T>} onStateChange
 * @template {State} T
 */
const _setState = ( state, newState, onStateChange ) => {
	/** @type {PartialState<T>} */
	const newChanges = {};
	/** @type {PartialState<T>} */
	const replacedValue = {};
	for( const k in newState ) {
		if( state[ k ] === newState[ k ] ) { continue }
		replacedValue[ k ] = state[ k ];
		state[ k ] = newState[ k ];
		newChanges[ k ] = newState[ k ];
	}
	!isEmpty( newChanges ) && onStateChange( newChanges, replacedValue );
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
 * Note: `context` prop is not updateable. Furtther updates to this prop are ignored.
 *
 * @type {React.FC<{
 * 		children?: React.ReactNode,
 * 		context: ObservableContext<T>,
 * 		prehooks?: Prehooks<T>
 * 		value: PartialState<T>
 * }>}
 * @template {State} T
 */
export const Provider = ({
	children = null,
	context,
	prehooks = defaultPrehooks,
	value
}) => {

	const prehooksRef = usePrehooksRef( prehooks );
	const initialState = useRef( value );

	/** @type {[Set<Listener<T>>, Function]} */
	const [ listeners ] = useState(() => new Set());
	/** @type {[T, Function]} */
	const [ state ] = useState(() => clonedeep( value ));
	/** @type {ObservableContext<T>} */
	const [ StoreContext ] = useState( context );

	/** @type {Listener<T>} */
	const onChange = ( newValue, oldValue ) => listeners.forEach( listener => listener( newValue, oldValue ) );

	/** @type {Store<T>["getState"]} */
	const getState = useCallback(( selector = defaultSelector ) => selector( state ), []);

	/** @type {Store<T>["resetState"]} */
	const resetState = useCallback(() => {
		const original = clonedeep( initialState.current );
		( !( 'resetState' in prehooksRef.current ) ||
			prehooksRef.current.resetState({
				current: clonedeep( state ), original
			})
		) && _setState( state, original, onChange )
	}, []);

	/** @type {Store<T>["setState"]} */
	const setState = useCallback( changes => {
		changes = clonedeep( changes );
		( !( 'setState' in prehooksRef.current ) ||
			prehooksRef.current.setState( changes )
		) && _setState( state, changes, onChange );
	}, [] );

	/** @type {Store<T>["subscribe"]} */
	const subscribe = useCallback( listener => {
		listeners.add( listener );
		return () => listeners.delete( listener );
	}, [] );

	useEffect(() => setState( clonedeep( value ) ), [ value ]);

	/** @type {[Store<T>, Function]} */
	const [ store ] = useState(() => ({
		getState, resetState, setState, subscribe
	}));

	return (
		<StoreContext.Provider value={ store }>
			{ children }
		</StoreContext.Provider>
	);
};
Provider.displayName = 'ObservableContext.Provider';

/**
 * @typedef {React.Context<Store<T>>} ObservableContext
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
 * 		resetState?: (state: { current: T, original: T}) => boolean,
 * 		setState?: (newChanges: PartialState<T>) => boolean
 * }} Prehooks
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
