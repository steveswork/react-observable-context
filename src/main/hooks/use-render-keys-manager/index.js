import { useMemo, useRef } from 'react';

import isEmpty from 'lodash.isempty';
import isEqual from 'lodash.isequal';

export const FULL_STATE_SELECTOR = '@@STATE';
export const NULL_STATE_SELECTOR = '';

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

export default useRenderKeysManager;
