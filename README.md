# React-Observable-Context

Observable react context - prevents an automatic total component tree re-rendering at context change.

<h4><u>Install</u></h4>

npm i -S @webkrafters/react-hoc-memo

npm install --save @webkrafters/react-hoc-memo

## API

The React-Observable-Context package exports only **2** modules namely: the **createContext** method and the **Provider** component.

`createContext` is a zero-parameter funtion returning a store-bearing context. Pass the context to the React::useContext() parameter to obtain the context's `store`.

The `Provider` can immediately be used as-is anywhere the React-Observable-Context is required. Supply the context to its `context` prop and the initial state to its `value` prop as is customary to React::Provider.

The context's `store` exposes **4** methods for interacting with the context's internal state namely:

* **getState**: (selector?: (state: State) => any) => any

* **resetState**: VoidFunction // resets the state to the Provider latest `value` prop.

* **setState**: (changes: PartialState\<State\>) => void

* **subscribe**: (listener: (newValue: PartialState\<State\>, oldValue: PartialState\<State\>) => void) => ***UnsubscribeFunction***

## Usage

<i><u>context.js</u></i>

    import { createContext } from '@webkrafters/react-observable-context';
	const ObservableContext = createContext();
    export default ObservableContext;

<i><u>tally-display.js</u></i>

    import React, { useContext, useEffect, useState } from 'react';

	import ObservableContext from './context';
    
    const TallyDisplay = () => {
    
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
    
    export default TallyDisplay;

<i><u>editor.js</u></i>

    import React, { useCallback, useContext, useEffect, useRef } from 'react';

	import ObservableContext from './context';
    
    const Editor = () => {
    
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
    
    export default Editor;

<i><u>product-description.js</u></i>

    import React, { useContext, useEffect, useState } from 'react';

	import ObservableContext from './context';
    
    const ProductDescription = () => {
    
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
    
    export default ProductDescription;

<i><u>price-sticker.js</u></i>

    import React, { useContext, useEffect, useState } from 'react';

	import ObservableContext from './context';
    
    const PriceSticker = () => {
    
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
    
    export default PriceSticker;

<i><u>product.js</u></i>

    import React, { useCallback, useEffect, useState } from 'react';
    import { Provider } from '@webkrafters/react-observable-context';

	import ObservableContext from './context';
    
    import Editor from './editor';
    import PriceSticker from './price-sticker';
    import ProductDescription from './product-description';
    import TallyDisplay from './tally-display';
    
    const Product = ({ type }) => {
	    
	    const [ state, setState ] = useState(() => ({
		    color: 'Burgundy',
		    price: 22.5,
		    type
	    }));
	    
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
    
    export default Product;

<i><u>app.js</u></i>

    import React, { useCallback, useState } from 'react';
    
    import Product from './product';
    
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

<i><u>index.js</i></b>

    import React from 'react';
    import ReactDOM from 'react-dom';
    import App from './app';
    ReactDOM.render(<App />, document.getElementById('root'));

## License

MIT
