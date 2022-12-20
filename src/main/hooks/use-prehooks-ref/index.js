import { useEffect, useRef } from 'react';

/**
 * @param {Prehooks<T>} prehooks
 * @template {State} T
 */
const usePrehooksRef = prehooks => {
	const prehooksRef = useRef( prehooks );
	useEffect(() => { prehooksRef.current = prehooks }, [ prehooks ]);
	return prehooksRef;
};

export default usePrehooksRef;

/**
 * @typedef {import("../../../types").Prehooks<T>} Prehooks
 * @template {State} T
 */
/** @typedef {import("../../../types").State} State */
