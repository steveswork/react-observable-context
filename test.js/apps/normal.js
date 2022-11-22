import React, {
	useCallback,
	useContext,
	useEffect,
	useRef,
	useState
} from 'react';

import { Provider, createContext } from '../../src';

export const ObservableContext = createContext();

/** @type {React.FC<void>} */
export const TallyDisplay = () => {

	const { getState, subscribe } = useContext( ObservableContext );

	const [ , setUpdateTs ] = useState();

	useEffect(() => subscribe( newValue => {
		[ 'color', 'price', 'type' ].some( k => k in newValue ) &&
		setUpdateTs( Date.now() );
	}), []);

	useEffect(() => console.log( 'TallyDisplay component rendered.....' ));

	return (
		<table>
			<tbody>
				<tr><td><label>Type:</label></td><td>{ getState( s => s.type ) }</td></tr>
				<tr><td><label>Color:</label></td><td>{ getState( s => s.color ) }</td></tr>
				<tr><td><label>Price:</label></td><td>{ getState( s => s.price ).toFixed( 2 ) }</td></tr>
			</tbody>
		</table>
	);
};
TallyDisplay.displayName = 'TallyDisplay';

/** @type {React.FC<void>} */
export const Editor = () => {

	const { setState } = useContext( ObservableContext );

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

/** @type {React.FC<void>} */
export const ProductDescription = () => {

	const store = useContext( ObservableContext );

	const [ , setUpdateTs ] = useState();

	useEffect(() => store.subscribe( newValue => {
		( 'color' in newValue || 'type' in newValue ) &&
		setUpdateTs( Date.now() );
	} ), []);
	useEffect(() => console.log( 'ProductDescription component rendered.....' ));

	const color = store.getState( s => s.color );
	const type = store.getState( s => s.type );

	return (
		<div style={{ fontSize: 24 }}>
			<strong>Description:</strong> { color } { type }
		</div>
	);
};
ProductDescription.displayName = 'ProductDescription';

/** @type {React.FC<void>} */
export const PriceSticker = () => {

	const store = useContext( ObservableContext );

	const [ price, setPrice ] = useState(() => store.getState( s => s.price ));

	useEffect(() => store.subscribe( newValue => {
		'price' in newValue && setPrice( newValue.price );
	} ), []);
	useEffect(() => console.log( 'PriceSticker component rendered.....' ));

	return (
		<div style={{ fontSize: 36, fontWeight: 800 }}>
			${ price.toFixed( 2 ) }
		</div>
	);
};
PriceSticker.displayName = 'PriceSticker';

/** @type {React.FC<{type:string}>} */
export const Product = ({ type }) => {

	const [ state, setState ] = useState(() => ({ type, price: 22.5, color: 'Burgundy' }));

	useEffect(() => {
		setState({ type }); // use this to update only the changed state
		// setState({ ...state, type }); // this will reset the context internal state
	}, [ type ]);

	const overridePricing = useCallback( e => setState({ price: Number( e.target.value ) }), [] );

	return (
		<div>
			<div style={{ marginBottom: 10 }}>
				<label>$ <input onKeyUp={ overridePricing } placeholder="override price here..."/></label>
			</div>
			<Provider context={ ObservableContext } value={ state }>
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
			</Provider>
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
