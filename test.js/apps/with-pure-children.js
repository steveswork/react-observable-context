import React, {
	memo,
	useCallback,
	useEffect,
	useState
} from 'react';

import { ObservableContext, Editor, ProductDescription, PriceSticker, TallyDisplay } from './normal';

const EditorMemo = memo( Editor );
const ProductDescriptionMemo = memo( ProductDescription );
const PriceStickerMemo = memo( PriceSticker );
const TallyDisplayMemo = memo( TallyDisplay );

/** @type {React.FC<{type:string}>} */
const Product = ({ type }) => {
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
			<ObservableContext.Provider value={ state }>
				<div style={{
					borderBottom: '1px solid #333',
					marginBottom: 10,
					paddingBottom: 5
				}}>
					<EditorMemo />
					<TallyDisplayMemo />
				</div>
				<ProductDescriptionMemo />
				<PriceStickerMemo />
			</ObservableContext.Provider>
		</div>
	);
};
Product.displayName = 'Product';

const ProductMemo = memo( Product );

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
			<ProductMemo type={ productType } />
		</div>
	);
};
App.displayName = 'App';

export default App;
