import { useEffect, useRef } from 'react';

/**
 * @param {import("../../../types").Prehooks<T>} prehooks
 * @template {State} T
 */
const usePrehooksRef = prehooks => {
	const prehooksRef = useRef( prehooks );
	useEffect(() => { prehooksRef.current = prehooks }, [ prehooks ]);
	return prehooksRef;
};

export default usePrehooksRef;
