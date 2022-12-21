import { useMemo, useRef } from 'react';

import { NULL_STATE_SELECTOR } from '../../../constants';

/**
 * @param {{[selectorKey: string]: string|keyof T}} selectorMap Key:value pairs where `key` => arbitrary key given to Store.data property holding the state slices and `value` => property paths to state slices used by this component. May use `{..., state: '@@STATE'}` to indicate a desire to obtain the entire state object and assign to a `state` property of Store.data. A change in any of the referenced properties results in this component render. When using `['@@STATE']`, any change in the state object results in this component render.
 * @returns {[string|keyof T]} Property paths
 * @template {State} T
 */
const useRenderKeysManager = selectorMap => {
	const renderKeys = useRef([]);
	sync: {
		const currKeys = Object.values( selectorMap );
		if( renderKeys.current.length !== currKeys.length &&
			renderKeys.current.some(( k, i ) => k !== currKeys[ i ])
		) {
			renderKeys.current = currKeys;
		}
	}
	// empty string property path causes the state-manager getState to return `undefined`
	return useMemo(() => (
		renderKeys.current.length
			? Array.from( new Set( renderKeys.current ) )
			: [ NULL_STATE_SELECTOR ]
	), [ renderKeys.current ]);
};

export default useRenderKeysManager;

/** @typedef {import("../../../types").State} State */
