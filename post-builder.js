/* eslint no-var: 0 */
var path = require( 'path' );
var fs = require( 'fs' );

var BASE_DIR = process.cwd();
var CHARSET = 'utf8';
var PACKAGE_FILE = path.join( BASE_DIR, 'package.json' );

/** @type {ReleaseInfoList} */
var trimResults = [];

var readFile = promisify( fs.readFile.bind( fs ) );
var unlink = promisify( fs.unlink.bind( fs ) );
var writeFile = promisify( fs.writeFile.bind( fs ) );

var packageJsonRead = readFile( PACKAGE_FILE, CHARSET )
	.then( function ( str ) { return JSON.parse( str ) } )
	.catch( function ( e ) {
		console.log( 'FATAL: Error obtaining package.json data' )
		throw e;
	} );

var EXT_PATTERN = /\.(j|t)s$/;
var PATH_SEP_PATTERN = /[\/\\]{1,2}/g;
var JSDOC_BASEFILE_PATTERN = /[\/\\]types\.js$/;

traverse( path.join( BASE_DIR, 'dist' ) );

Promise.all([ Promise.all( trimResults ), packageJsonRead ])
	.then( function ( results ) {
		return updateReleaseManifest( results[ 1 ], results[ 0 ] )
			.then(() => {
				var errorResults = results[ 0 ].filter( function ( r ) { return r.result !== true } );
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
	} )
	.catch( e => {
		console.dir( e );
		console.log( '.'.repeat( 16 ) );
		console.log( '\nPost build failure occurring @ ', new Date().toString() );
	} );

function promisify( fn ) {
	return function ( ...args ) {
		return new Promise( function ( resolve, reject ) {
			fn( ...args, function ( err, data ) {
				err ? reject( err ) : resolve( data );
			} );
		} );
	};
};

/** @param {string}  directory */
function traverse( directory ) {
	fs.readdirSync( directory, CHARSET ).forEach( function ( entry ) {
		var fPath = path.join( directory, entry );
		if( fs.statSync( fPath ).isDirectory() ) {
			return traverse( fPath );
		}
		EXT_PATTERN.test( fPath ) && trimResults.push(
			JSDOC_BASEFILE_PATTERN.test( fPath )
				? unlink( fPath )
					.then( function () { return { fname: fPath, result: true, t: 'unlink' } } )
					.catch( function ( e ) { return { fname: fPath, result: e, t: 'unlink' } } )
				: readFile( fPath, CHARSET ).then( function ( f ) {
					if( fPath.endsWith( '.ts' ) ) { f = f.replace( /T_[0-9]+/gm, 'T' ) }
					return writeFile( fPath, trimComments( f ), CHARSET )
						.then( function () { return { fname: fPath, result: true, t: 'write' } } )
						.catch( function ( e ) { return { fname: fPath, result: e, t: 'write' } } )
				} ).catch( function ( e ) { return { fname: fPath, result: e, t: 'read' } } )
		)
	} );
}

/** @param {string} code */
function trimComments( code ) {
	return code
		.replace( /\/\*#__PURE__\*\//gm, '' )
		.replace( /\s*\/\/.*$/gm, '' )
		.replace( /\s*\/\*(?:\*\s+(?:[^*]|\*(?!\/))*@typedef)?\s+(?:[^*]|\*(?!\/))*(?:\*\/|$)/gm, '' )
		.replace( /(?:^\s*\n)*/gm, '' )
		.replace( /(\/\*(?:[^*]|\*(?!\/))*\*\/)\n(exports\.[^=]+=[^;]+;)/gm, '$2\n$1' );
}

/**
 * @param {{[x: string]: any}} packageJsonObj
 * @param {ReleaseInfoList} releaseInfoList
 * @returns {Promise<void>}
 */
function updateReleaseManifest( packageJsonObj, releaseInfoList ) {
	if( !releaseInfoList.length ) { return Promise.resolve() }
	try {
		var files = [ 'package.json', 'index.js' ];
		const distStart = releaseInfoList[ 0 ].fname.indexOf( 'dist' );
		for( var i = releaseInfoList.length; i--; ) {
			releaseInfoList[ i ].t !== 'unlink' &&
			files.push(
				releaseInfoList[ i ].fname
					.slice( distStart )
					.replace( PATH_SEP_PATTERN, '/' )
			);
		}
		packageJsonObj.files = files;
		return writeFile( PACKAGE_FILE, JSON.stringify( packageJsonObj, null, 2 ), CHARSET )
			.catch( e => {
				console.log( 'FATAL: Error while writing package.json files property' )
				throw e;
			} );
	} catch( e ) { return Promise.reject( e ) }
}

/**
 * @typedef {Array<{
 * 		fname: string,
 * 		result: true|Error,
 * 		t: 'read'|'unlink'|'write'
 * }>} ReleaseInfoList
 */
