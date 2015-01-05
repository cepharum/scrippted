/**
 * (c) 2015 cepharum GmbH, Berlin, http://cepharum.de
 *
 * The MIT License (MIT)
 *
 * Copyright (c) 2014 cepharum GmbH
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 * @author: cepharum
 */


var PRINTER = require( "./printer" );
var CONFIG  = require( "../config" );



var printersPool = {};

function registerPrinter( name, options ) {
	"use strict";

	var printer = new PRINTER.Printer( name );

	if ( options.description ) {
		printer.description = String( options.description ).trim();
	}

	var uris = options.uri || CONFIG.printers["*"].uri || {};
	Object.keys( uris ).forEach( function( uri ) {
		var info = uris[uri];

		printer.setUri( uri, info[0] || info.authentication, info[1] || info.security );
	} );

	printersPool[name] = printer;

	return printer;
}




// --- register all configured printers ---

Object.keys( CONFIG.printers ).forEach( function( printerName ) {
	"use strict";

	if ( printerName === "*" ) {
		return;
	}

	registerPrinter( printerName, CONFIG.printers[printerName] || {} );
} );




// --- public API ---

/**
 * Selects printer by name and adds it to internal pool of printers if missing
 * and demanded.
 *
 * @param {string} name name of printer to select
 * @param {boolean} createIfMissing true for creating printer if missing
 * @returns {Printer}
 */

module.exports.selectPrinterByName = function( name, createIfMissing ) {
	"use strict";

	if ( name in printersPool ) {
		if ( printersPool[name].isValid() ) {
			return printersPool[name];
		}

		throw new Error( "invalid printer: " + name );
	}

	if ( !createIfMissing ) {
		throw new Error( "no such printer: " + name );
	}

	return registerPrinter( name, {} );
};

/**
 * Selects previously added printer by URI.
 *
 * @param {string} uri URI to be defined for some printer
 * @returns {Printer} found printer
 */

module.exports.selectPrinterByUri = function( uri ) {
	"use strict";

	var foundPrinter = null;

	this.eachPrinter( function( name, printer ) {
		if ( printer.uris.indexOf( uri ) >= 0 ) {
			if ( foundPrinter ) {
				throw new Error( "ambigious URI configuration for printers " + foundPrinter.name + " and " + name );
			}

			foundPrinter = printer;
		}
	} );

	if ( !foundPrinter ) {
		throw new Error( "no such printer at URI " + uri );
	}

	return foundPrinter;
};

/**
 * Invokes provided callback on every printer registered in pool.
 *
 * @param {function(string,Printer)} callback
 */

module.exports.eachPrinter = function( callback ) {
	"use strict";

	if ( typeof callback !== "function" ) {
		throw new Error( "invalid callback" );
	}

	Object.keys( printersPool ).forEach( function( printerName ) {
		callback( printerName, printersPool[printerName] );
	} );
};
