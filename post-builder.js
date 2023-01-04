/* eslint no-var: 0 */
var path = require( 'path' );
var fs = require( 'fs' );

var BASE_DIR = process.cwd();
var CHARSET = 'utf8';
var PACKAGE_FILE = path.join( BASE_DIR, 'package.json' );

var COMMENT_BLOCK_END_PATTERN = /\*\/$/;
var COMMENT_BLOCK_START_PATTERN = /^\s*\/\*(\*)/;
var EXPORT_LINE_PATTERN = /^exports\..+=\s*(.+)(?<!void\s*0);\s*$/;
var EXT_PATTERN = /\.(j|t)s$/;
var JSDOC_BASEFILE_PATTERN = /[\/\\]types\.js$/;
var PATH_SEP_PATTERN = /[\/\\]{1,2}/g;

var readFile = promisify( fs.readFile.bind( fs ) );
var unlink = promisify( fs.unlink.bind( fs ) );
var writeFile = promisify( fs.writeFile.bind( fs ) );

/** @type {{[x:string]:*}} */
var packageJson;

var PKG_TYPE_DEF, PKG_TYPE_DEF_FILEPATH, PKG_TYPE_DEF_RELEASE_TASK_INDEX;
var PKG_TYPE_SOURCE, PKG_TYPE_SOURCE_FILEPATH, PKG_TYPE_SOURCE_RELEASE_TASK_INDEX;

/** @type {Array<ReleaseInfo>} */
var releaseInfoList = [];

/** @type {Array<Promise<ReleaseInfo>>} */
var trimResults = [];

var asyncTask = readFile( PACKAGE_FILE, CHARSET )
	.then( function ( str ) {
		packageJson = JSON.parse( str );
		PKG_TYPE_DEF_FILEPATH = path.join( BASE_DIR, packageJson.types );
		PKG_TYPE_SOURCE_FILEPATH = PKG_TYPE_DEF_FILEPATH.replace( /\.d\.ts$/, '.js' );
	} )
	.catch( function ( e ) {
		console.log( 'FATAL: Error obtaining package.json data' )
		throw e;
	} );

asyncTask.then( function () { traverse( path.join( BASE_DIR, 'dist' ) ) } );

asyncTask = new Promise( function ( resolve, reject ) {
	asyncTask.then( function () {
		Promise.all( trimResults ).then(
			function ( list ) {
				releaseInfoList = list;
				resolve();
			}
		).catch( reject )
	} );
} );

asyncTask
	.then( function () {
		attachPublicTsDocs();
		return Promise.all( [
			[ PKG_TYPE_DEF, PKG_TYPE_DEF_FILEPATH, PKG_TYPE_DEF_RELEASE_TASK_INDEX ],
			[ PKG_TYPE_SOURCE, PKG_TYPE_SOURCE_FILEPATH, PKG_TYPE_SOURCE_RELEASE_TASK_INDEX ]
		].map( function ( item ) {
			item[ 0 ] = item[ 1 ] === PKG_TYPE_DEF_FILEPATH
				? item[ 0 ].replace( /^\n/, '' ).replace( /T_[0-9]+/gm, 'T' )
				: trimComments( item[ 0 ] );
			return writeFile( item[ 1 ], item[ 0 ], CHARSET )
				.then( function () {
					releaseInfoList[ item[ 2 ] ] = {
						fname: item[ 1 ], result: true, t: 'write'
					}
				} )
				.catch( function ( e ) {
					releaseInfoList[ item[ 2 ] ] = {
						fname: item[ 1 ], result: e, t: 'write'
					}
				} )
				.finally( function () { item[ 0 ] = null } )
		} ) );
	} );

asyncTask
	.then( updateReleaseManifest )
	.then( function () {
		var errorResults = releaseInfoList.filter( function ( r ) { return r.result !== true } );
		if( errorResults.length ) {
			console.log( '\nFollowing errors were encountered while trimming comments from dist source files: ' );
			for( const e of errorResults ) {
				console.log( e.fname + ': ' );
				console.dir( e.result );
				console.log( '.'.repeat( 16 ) );
			}
		}
		console.log( '\nPost build completed @ ', new Date().toString() );
	} )
	.catch( e => {
		console.dir( e );
		console.log( '.'.repeat( 16 ) );
		console.log( '\nPost build failure occurring @ ', new Date().toString() );
	} );

function attachPublicTsDocs() {
	for( var sourceLines = PKG_TYPE_SOURCE.split( /[\n\r]+/ ), l = sourceLines.length; l--; ) {
		var exportLineMatches = sourceLines[ l ].match( EXPORT_LINE_PATTERN );
		if( !exportLineMatches ) { continue }
		var exportName = exportLineMatches[ 1 ];
		var jsDeclarationLinePattern = new RegExp( `^((?:var\\s+${ exportName }\\s*=)|(?:function\\s+${ exportName }\\s*\\())` );
		L2: {
			for( ; l--; ) {
				if( !jsDeclarationLinePattern.test( sourceLines[ l ] ) ) { continue }
				if( !COMMENT_BLOCK_END_PATTERN.test( sourceLines[ l - 1 ] ) ) { break }
				l--;
				var commentBlockLines = [ sourceLines[ l ] ];
				var oneLinerBlockMatches = sourceLines[ l ].match( COMMENT_BLOCK_START_PATTERN );
				if( oneLinerBlockMatches ) {
					if( !oneLinerBlockMatches[ 1 ] ) { break L2 } // not a jsDoc block
				} else {
					for( ; l--; ) {
						commentBlockLines.push( sourceLines[ l ] );
						var startBlockMatches = sourceLines[ l ].match( COMMENT_BLOCK_START_PATTERN );
						if( !startBlockMatches ) { continue }
						if( !startBlockMatches[ 1 ] ) { break L2 } // not a jsDoc block
						break;
					}
				}
				var tsDeclarationLinePattern = new RegExp( `(export\\s+(?:(?:function\\s+${ exportName }[<(])|(?:(const|let)\\s+${ exportName }:)|(?:class\\s+${ exportName }(?:(\\s+.)|(\\s*\\{)))))`, 'm' );
				commentBlockLines = commentBlockLines.reverse().join( '\n' );
				PKG_TYPE_DEF = PKG_TYPE_DEF.replace( tsDeclarationLinePattern, `\n${ commentBlockLines }\n$1` );
				break;
			}
		}
	}
}

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
					let interrupt = false;
					if( fPath === PKG_TYPE_DEF_FILEPATH ) {
						PKG_TYPE_DEF = trimComments( f );
						PKG_TYPE_DEF_RELEASE_TASK_INDEX = trimResults.length;
						interrupt = true;
					} else if( fPath === PKG_TYPE_SOURCE_FILEPATH ) {
						/** next line addresses the babel jsdoc misplacement for this file */
						PKG_TYPE_SOURCE = f.replace( /(\/\*(?:[^*]|\*(?!\/))*\*\/)\n(exports\.[^=]+=[^;]+;)/gm, '$2\n$1' )
						PKG_TYPE_SOURCE_RELEASE_TASK_INDEX = trimResults.length;
						interrupt = true;
					}
					if( interrupt ) {
						return { fname: fPath, result: true, t: 'read' };
					}
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
		.replace( /\s*\/\*\*?\s+(?:[^*]|\*(?!\/))*(?:\*\/|$)/gm, '' )
		.replace( /(?:^\s*\n)*/gm, '' );
}

/** @returns {Promise<void>} */
function updateReleaseManifest() {
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
		packageJson.files = files;
		return writeFile( PACKAGE_FILE, JSON.stringify( packageJson, null, 2 ), CHARSET )
			.catch( e => {
				console.log( 'FATAL: Error while writing package.json files property' )
				throw e;
			} );
	} catch( e ) { return Promise.reject( e ) }
}

/**
 * @typedef {{
 * 		fname: string,
 * 		result: true|Error,
 * 		t: 'read'|'unlink'|'write'
 * }} ReleaseInfo
 */
