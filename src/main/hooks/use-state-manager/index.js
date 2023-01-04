import { useCallback, useState } from 'react';

import clonedeep from 'lodash.clonedeep';

import AccessorCache from '../../../model/accessor-cache';

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

export default useStateManager;

/**
 * @typedef {import("../../../types").Listener<T>} Listener
 * @template {State} T
 */

/** @typedef {import("../../../types").State} State */

/**
 * @typedef {import("../../../types").StoreInternal<T>} StoreInternal
 * @template {State} T
 */
