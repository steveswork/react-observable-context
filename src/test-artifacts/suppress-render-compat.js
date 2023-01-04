const consoleError = console.error.bind( console );
beforeAll(() => {
	console.error = ( ...args ) => !/Warning: ReactDOM\.render is no longer supported in React 18/.test( args[ 0 ] ) && consoleError( ...args );
});
afterAll(() => { console.error = consoleError });
