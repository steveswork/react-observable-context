import { useState } from 'react';

/**
 * @type {Provider<T>}
 * @template {State} T
 */
const getCurrKeys = selectorMap => {
	const currKeys = Object.values( selectorMap );
	return currKeys.length
		? Array.from( new Set( currKeys ) )
		: [];
};

/**
 * @type {Provider<T>}
 * @template {State} T
 */
const useRenderKeyProvider = selectorMap => {
	const [ renderKeys, setRenderKeys ] = useState(() => getCurrKeys( selectorMap ));
	const currKeys = getCurrKeys( selectorMap );
	( renderKeys.length !== currKeys.length ||
		renderKeys.some(( k, i ) => k !== currKeys[ i ])
	) && setRenderKeys( currKeys );
	return renderKeys;
};

export default useRenderKeyProvider;

/**
 * @callback Provider
 * @param {{[selectorKey: string]: string|keyof T}} selectorMap Key:value pairs where `key` => arbitrary key given to Store.data property holding the state slices and `value` => property paths to state slices used by this component. May use `{..., state: '@@STATE'}` to indicate a desire to obtain the entire state object and assign to a `state` property of Store.data. A change in any of the referenced properties results in this component render. When using `['@@STATE']`, any change in the state object results in this component render.
 * @returns {[string|keyof T]} Property paths
 * @template {State} T
 */

/** @typedef {import("../../../types").State} State */
