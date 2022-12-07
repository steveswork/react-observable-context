/* eslint no-var: 0 */
var path = require( 'path' );
var fs = require( 'fs' );

var CHARSET = 'utf8';
var DIST = path.join( process.cwd(), 'dist', 'index.js' );

/** @param {string} code */
function trimComments( code ) {
	return code
		.replace( /\s*\/\/.*$/gm, '' )
		.replace( /\s*\/\*\*?(?:[^*]|\*(?!\/))*(?:\*\/|$)/gm, '' )
		.replace( /(?:^\s*\n)*/gm, '' );
}

fs.writeFileSync( DIST, trimComments( fs.readFileSync( DIST, CHARSET ) ), CHARSET );
