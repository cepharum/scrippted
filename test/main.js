/**
 * (c) 2014 cepharum GmbH, Berlin, http://cepharum.de
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * @author: Thomas Urban
 */

var PATH = require( "path" );

// ----------------------------------------------------------------------------

var suitesFolder = PATH.join( __dirname, "suites" );

require( "find" ).find( suitesFolder, function( collectedFiles ) {
	"use strict";

	collectedFiles.forEach( function( filename ) {
		require( PATH.join( suitesFolder, filename ) );
	} );

	require( "jasmine" ).env().execute();
}, null, null, function( error ) {
	"use strict";

	console.error( error );
} );
