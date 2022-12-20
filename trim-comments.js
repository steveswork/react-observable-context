/* eslint no-var: 0 */
var path = require( 'path' );
var fs = require( 'fs' );

var CHARSET = 'utf8';

/** @type {{fname: string, result: true|Error}} */
var trimResults = [];

function promisify( fn ) {
	return function ( ...args ) {
		return new Promise( function ( resolve, reject ) {
			fn( ...args, function ( err, data ) {
				err ? reject( err ) : resolve( data );
			} );
		} );
	};
};

var readFile = promisify( fs.readFile.bind( fs ) );
var unlink = promisify( fs.unlink.bind( fs ) );
var writeFile = promisify( fs.writeFile.bind( fs ) );

/** @param {string} code */
function trimComments( code ) {
	return code
		.replace( /\/\*#__PURE__\*\//gm, '' )
		.replace( /\s*\/\/.*$/gm, '' )
		.replace( /\s*\/\*(?:\*\s+(?:[^*]|\*(?!\/))*@typedef)?\s+(?:[^*]|\*(?!\/))*(?:\*\/|$)/gm, '' )
		.replace( /(?:^\s*\n)*/gm, '' )
		.replace( /(\/\*(?:[^*]|\*(?!\/))*\*\/)\n(exports\.[^=]+=[^;]+;)/gm, '$2\n$1' );
}

var EXT_PATTERN = /\.(j|t)s$/;
var JSDOC_BASEFILE_PATTERN = /[\/\\]types\.js$/;

( function traverse( directory ) {
	fs.readdirSync( directory, CHARSET ).forEach( function ( entry ) {
		var fPath = path.join( directory, entry );
		if( fs.statSync( fPath ).isDirectory() ) {
			return traverse( fPath );
		}
		EXT_PATTERN.test( fPath ) && trimResults.push((
			JSDOC_BASEFILE_PATTERN.test( fPath )
				? unlink( fPath ).then( function () { return { fname: fPath, result: true } } )
				: readFile( fPath, CHARSET ).then( function ( f ) {
					return writeFile( fPath, trimComments( f ), CHARSET )
						.then( function () { return { fname: fPath, result: true } } )
						.catch( function ( e ) { return { fname: fPath, result: e } } )
				} )
		).catch( function ( e ) { return { fname: fPath, result: e } } ));
	} );
} )( path.join( process.cwd(), 'dist' ) );

Promise.all( trimResults ).then( function ( results ) {
	var errorResults = results.filter( function ( r ) { return r.result !== true } );
	if( errorResults.length ) {
		console.log( '\nFollowing errors were encountered while trimming comments from dist source files: ' );
		for( const e of errorResults ) {
			console.log( e.fname + ': ' );
			console.dir( e.result );
			console.log( '.'.repeat( 16 ) );
		}
	}
	console.log( '\nPost build completed @ ', new Date().toString() );
} );
