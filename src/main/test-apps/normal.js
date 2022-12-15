import React, {
	useCallback,
	useEffect,
	useRef,
	useState
} from 'react';

import { createContext, useContext } from '..';

export const ObservableContext = createContext();
export const useObservableContext = watchedKeys => useContext( ObservableContext, watchedKeys );

/** @type {React.FC<void>} */
const Reset = () => {
	const { resetState } = useObservableContext();

	useEffect(() => console.log( 'Reset component rendered.....' ));

	return ( <button onClick={ resetState }>reset context</button> );
};
Reset.displayName = 'Reset';

const TALLY_DISPLAY_CONTEXT_KEYS = [ 'color', 'price', 'type' ];

/** @type {React.FC<void>} */
export const TallyDisplay = () => {

	const { data } = useObservableContext( TALLY_DISPLAY_CONTEXT_KEYS );

	useEffect(() => console.log( 'TallyDisplay component rendered.....' ));

	const { color, type, price } = data;

	return (
		<div>
			<table>
				<tbody>
					<tr><td><label>Type:</label></td><td>{ type }</td></tr>
					<tr><td><label>Color:</label></td><td>{ color }</td></tr>
					<tr><td><label>Price:</label></td><td>{ price.toFixed( 2 ) }</td></tr>
				</tbody>
			</table>
			<div style={{ textAlign: 'right' }}>
				<Reset />
			</div>
		</div>
	);
};
TallyDisplay.displayName = 'TallyDisplay';

/** @type {React.FC<void>} */
export const Editor = () => {

	const { setState } = useObservableContext();

	const priceInputRef = useRef();
	const colorInputRef = useRef();
	const typeInputRef = useRef();

	const updatePrice = useCallback(() => {
		setState({ price: Number( priceInputRef.current.value ) });
	}, []);
	const updateColor = useCallback(() => {
		setState({ color: colorInputRef.current.value });
	}, []);
	const updateType = useCallback(() => {
		setState({ type: typeInputRef.current.value });
	}, []);

	useEffect(() => console.log( 'Editor component rendered.....' ));

	return (
		<fieldset style={{ margin: '10px 0' }}>
			<legend>Editor</legend>
			<div style={{ margin: '10px 0' }}>
				<label>New Price: <input ref={ priceInputRef } /></label>
				{ ' ' }
				<button onClick={ updatePrice }>update price</button>
			</div>
			<div style={{ margin: '10px 0' }}>
				<label>New Color: <input ref={ colorInputRef } /></label>
				{ ' ' }
				<button onClick={ updateColor }>update color</button>
			</div>
			<div style={{ margin: '10px 0' }}>
				<label>New Type: <input ref={ typeInputRef } /></label>
				{ ' ' }
				<button onClick={ updateType }>update type</button>
			</div>
		</fieldset>
	);
};
Editor.displayName = 'Editor';

const PRODUCT_DESC_CONTEXT_KEYS = [ 'color', 'type' ];

/** @type {React.FC<void>} */
export const ProductDescription = () => {

	const store = useObservableContext( PRODUCT_DESC_CONTEXT_KEYS );

	useEffect(() => console.log( 'ProductDescription component rendered.....' ));

	const { color, type } = store.data;

	return (
		<div style={{ fontSize: 24 }}>
			<strong>Description:</strong> { color } { type }
		</div>
	);
};
ProductDescription.displayName = 'ProductDescription';

const PRICE_STICKER_CONTEXT_KEYS = [ 'price' ];

/** @type {React.FC<void>} */
export const PriceSticker = () => {

	const { data } = useObservableContext( PRICE_STICKER_CONTEXT_KEYS );

	useEffect(() => console.log( 'PriceSticker component rendered.....' ));

	const { price } = data;

	return (
		<div style={{ fontSize: 36, fontWeight: 800 }}>
			${ price.toFixed( 2 ) }
		</div>
	);
};
PriceSticker.displayName = 'PriceSticker';

/**
 * @type {React.FC<{
 * 		prehooks?: import("..").Prehooks<{[x:string]:*}>,
 * 		type:string
 * }>}
 */
export const Product = ({ prehooks = undefined, type }) => {

	const [ state, setState ] = useState(() => ({ type, price: 22.5, color: 'Burgundy' }));

	useEffect(() => {
		setState({ type }); // use this to update only the changed state
		// setState({ ...state, type }); // this will override the context internal state for these values
	}, [ type ]);

	const overridePricing = useCallback( e => setState({ price: Number( e.target.value ) }), [] );

	return (
		<div>
			<div style={{ marginBottom: 10 }}>
				<label>$ <input onKeyUp={ overridePricing } placeholder="override price here..."/></label>
			</div>
			<ObservableContext.Provider prehooks={ prehooks } value={ state }>
				<div style={{
					borderBottom: '1px solid #333',
					marginBottom: 10,
					paddingBottom: 5
				}}>
					<Editor />
					<TallyDisplay />
				</div>
				<ProductDescription />
				<PriceSticker />
			</ObservableContext.Provider>
		</div>
	);
};
Product.displayName = 'Product';

/** @type {React.FC<void>} */
const App = () => {

	const [ productType, setProductType ] = useState( 'Calculator' );

	const updateType = useCallback( e => setProductType( e.target.value ), [] );

	return (
		<div className="App">
			<h1>Demo</h1>
			<h2>A contrived product app.</h2>
			<div style={{ marginBottom: 10 }}>
				<label>Type: <input onKeyUp={ updateType } placeholder="override product type here..." /></label>
			</div>
			<Product type={ productType } />
		</div>
	);
};
App.displayName = 'App';

export default App;
