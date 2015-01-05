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


var IPP = require( "ipp" );




/**
 * Gets state of printer.
 *
 * @param {Printer} printer
 */

function getPrinterState( printer ) {
	"use strict";

	// TODO add magic for getting state of current printer
	return {
		state: "idle",
		reason: "none",
		severity: "report"
	};
}

/**
 * Gets state of printer.
 *
 * @param {Printer} printer
 * @param {boolean} wantName true for getting state's name rather than its numeric value
 */

function getPrinterStateName( printer, wantName ) {
	"use strict";

	var i, _state = getPrinterState( printer ), set = IPP.ENUM_PRINTER_STATE;

	for ( i in set ) {
		if ( set.hasOwnProperty( i ) && set[i] === _state.state ) {
			return wantName ? _state.state : i;
		}
	}

	throw new Error( "invalid state of printer: " + _state.state );
}

function getPrinterStateReason( printer ) {
	"use strict";

	var _state = getPrinterState( printer );

	return _state.reason + "-" + _state.severity;
}

function getDocumentFormats( printer ) {
	"use strict";

	return [
		"application/postscript"
	];
}

function isPrinterEnabled( printer ) {
	"use strict";

	return true;
}

function getQueuedJobs( printer ) {
	"use strict";

	return [];
}

function getQueuedJobsCount( printer ) {
	"use strict";

	return 0;
}


/**
 *
 * @param name
 * @constructor
 */

function Printer( name ) {
	"use strict";


	var started = new Date().getTime();

	this.description = null;

	this.uriList = {};


	name = String( name || ( "printer" + Math.random() ) );

	Object.defineProperties( this, {
		name: { value: name },
		state: { get: getPrinterStateName.bind( this, false ) },
		stateName: { get: getPrinterStateName.bind( this, true ) },
		stateReason: { get: getPrinterStateReason.bind( this ) },
		documentFormats: { get: getDocumentFormats.bind( this ) },
		enabled: { get: isPrinterEnabled.bind( this ) },
		queuedJobs: { get: getQueuedJobs.bind( this ) },
		queuedJobsCount: { get: getQueuedJobsCount.bind( this ) },
		uris: { get: (function() { return Object.keys( this.uriList );}).bind( this ) },
		uptime: { get: function() { return new Date().getTime() - started; } }
	} );
}

Printer.prototype.setUri = function( uri, authentication, security ) {
	"use strict";

	uri = uri ? String( uri ).trim().replace( /:printer/g, this.name ) : null;
	if ( !uri || !uri.length ) {
		throw new Error( "invalid URI for printer " + this.name );
	}

	authentication = String( authentication ).trim();
	switch ( authentication ) {
		case "none" :
		case "requesting-user-name" :
		case "basic" :
		case "digest" :
		case "certificate" :
			break;
		default :
			throw new Error( "invalid URI authentication on printer " + this.name );
	}

	security = String( security ).trim();
	switch ( security ) {
		case "none" :
		case "ssl3" :
		case "tls" :
			break;
		default :
			throw new Error( "invalid URI security on printer " + this.name );
	}

	this.uriList[uri] = {
		authentication: authentication,
		security: security
	};
};

/**
 * Retrieves configuration of provided URI used for addressing current printer.
 *
 * @param {string} uri
 * @returns {{security:string, authentication:string}}
 */

Printer.prototype.getUriConfiguration = function( uri ) {
	"use strict";

	if ( uri in this.uriList ) {
		return this.uriList[uri];
	}

	throw new Error( "URI is not associated with printer " + this.name );
};

/**
 * Detects if printer model instance is valid (properly describes some printer).
 *
 * @returns {boolean}
 */

Printer.prototype.isValid = function() {
	"use strict";

	return Object.keys( this.uriList ).length > 0;
};

Printer.prototype.supportsOperation = function( operationName ) {
	"use strict";

	operationName = "_perform" + operationName;

	return ( operationName in this && typeof this[operationName] === "function" ) ? operationName : false;
};

Printer.prototype.listSupportedOperations = function() {
	"use strict";

	var operations = [], method, match, pattern = /^_?perform(\w+)$/;

	for ( method in Printer.prototype ) {
		if ( Printer.prototype.hasOwnProperty( method ) && typeof Printer.prototype[method] === "function" ) {
			match = method.match( pattern );
			if ( match ) {
				operations.push( match[1] );
			}
		}
	}

	return operations;
};

Printer.prototype.perform = function( operationName, ippRequest, ippResponse, ippBodyStream, senderCallback ) {
	"use strict";

	var methodName = this.supportsOperation( operationName );
	if ( !methodName ) {
		throw new Error( "unsupported operation: " + operationName );
	}

	var method = this[methodName];

	method.apply( this, [].slice.call( arguments, 1 ) );

	// return true, if invoked method was expecting callback in 4th argument,
	// thus is considered starting asynchronous operation ultimately invoking
	// that callback for sending response
	return ( method.length > 3 );
};

Printer.prototype._performGetPrinterAttributes = function( ippRequest, ippResponse, ippBodyStream ) {
	"use strict";

	var uriList = this.uriList,
	    uris = Object.keys( uriList ),
	    GEN = IPP.generators,
	    operations = this.listSupportedOperations();


	ippResponse.attributes.printer = {
		// required
		"printer-uri-supported": uris.map( function( uri ) { return GEN.generateUri( uri ); } ),
		"uri-security-supported": uris.map( function( uri ) { return GEN.generateKeyword( uriList[uri].security ); } ),   // TODO add support for encrpyted printing
		"uri-authentication-supported": uris.map( function( uri ) { return GEN.generateKeyword( uriList[uri].authentication ); } ),  // TODO add support for additional authentication methods
		"printer-name": GEN.generateTextWithoutLanguage( this.name ),
		"printer-state": GEN.generateEnum( this.state ),
		"printer-state-reasons": [ GEN.generateKeyword( this.stateReason ) ],
		"ipp-versions-supported": [ GEN.generateKeyword( "1.1" ) ],
		"operations-supported": operations.map( function( method ) { return GEN.generateEnum( IPP.OPERATION[method] ); } ),
		"charset-configured": GEN.generateCharset( "utf-8" ),
		"charset-supported": [ GEN.generateCharset( "utf-8" ) ],
		"natural-language-configured": GEN.generateNaturalLanguage( "en-us" ),
		"generated-natural-language-supported": [ GEN.generateNaturalLanguage( "en-us" ) ],
		"document-format-default": GEN.generateMimeMediaType( this.documentFormats[0] || "application/postscript" ),
		"document-format-supported": this.documentFormats.map( function( m ) { return GEN.generateMimeMediaType( m ); } ),
		"printer-is-accepting-jobs": GEN.generateBoolean( this.enabled ),
		"queued-job-count": GEN.generateInteger( this.queuedJobsCount ),
		"pdl-override-supported": GEN.generateNoValue(),
		"printer-up-time": GEN.generateInteger( this.uptime ),
		"compression-supported": [ GEN.generateUnknown() ],

		// optional
		//"printer-location": new IPP.AttributeTypeNative( "inpas", IPP.ATTRIBUTE_TYPE.nameWithoutLanguage ),
		//"printer-info": new IPP.AttributeTypeNative( "inpas", IPP.ATTRIBUTE_TYPE.nameWithoutLanguage ),
		//"printer-more-info": new IPP.AttributeTypeNative( "inpas", IPP.ATTRIBUTE_TYPE.nameWithoutLanguage ),
		//"printer-more-info-manufacturer": new IPP.AttributeTypeNative( "inpas", IPP.ATTRIBUTE_TYPE.nameWithoutLanguage ),
		"printer-driver-installer": GEN.generateUri( "http://localhost/driver" ),
		"printer-make-and-model": GEN.generateTextWithoutLanguage( "Microsoft PS Class Driver" )
		//"multiple-document-jobs-supported": new IPP.AttributeTypeNative( "inpas", IPP.ATTRIBUTE_TYPE.nameWithoutLanguage ),
		//"printer-message-from-operator": GEN.generateTextWithoutLanguage( "Print your docs here!" ),
		//"color-supported": new IPP.AttributeTypeNative( "inpas", IPP.ATTRIBUTE_TYPE.nameWithoutLanguage ),
		//"reference-uri-schemes-supported": new IPP.AttributeTypeNative( "inpas", IPP.ATTRIBUTE_TYPE.nameWithoutLanguage ),
		//"printer-current-time": new IPP.AttributeTypeNative( "inpas", IPP.ATTRIBUTE_TYPE.nameWithoutLanguage ),
		//"multiple-operation-time-out": new IPP.AttributeTypeNative( "inpas", IPP.ATTRIBUTE_TYPE.nameWithoutLanguage ),
		//"job-k-octets-supported": new IPP.AttributeTypeNative( "inpas", IPP.ATTRIBUTE_TYPE.nameWithoutLanguage ),
		//"job-impressions-supported": new IPP.AttributeTypeNative( "inpas", IPP.ATTRIBUTE_TYPE.nameWithoutLanguage ),
		//"job-media-sheets-supported": new IPP.AttributeTypeNative( "inpas", IPP.ATTRIBUTE_TYPE.nameWithoutLanguage ),
		//"pages-per-minute": new IPP.AttributeTypeNative( "inpas", IPP.ATTRIBUTE_TYPE.nameWithoutLanguage ),
		//"pages-per-minute-color": new IPP.AttributeTypeNative( "inpas", IPP.ATTRIBUTE_TYPE.nameWithoutLanguage ),
	};

	if ( this.description && String( this.description ).trim().length > 0 ) {
		ippResponse.attributes.printer["printer-info"] = GEN.generateTextWithoutLanguage( String( this.description ).trim() );
	}

	//ippResponse.attributes.operation["status-message"] = GEN.generateTextWithoutLanguage( "" );
	//ippResponse.attributes.operation["detailed-status-message"] =GEN.generateTextWithoutLanguage( "" );

/*
	ippResponse.attributes.job = {
		"job-priority-default": GEN.generateInteger( 50 ),
		"job-priority-supported": GEN.generateInteger( 1 ),
		"job-hold-until-default": GEN.generateKeyword( "no-hold" ),
		"job-hold-until-supported": [ GEN.generateKeyword( "no-hold" ) ],
		"job-sheets-default": GEN.generateKeyword( "none" ),
		"job-sheets-supported": [ GEN.generateKeyword( "none" ) ],
		"multiple-document-handling-default": GEN.generateKeyword( "single-document" ),
		"multiple-document-handling-supported": [ GEN.generateKeyword( "single-document" ) ],
		"copies-default": GEN.generateInteger( 1 ),
		"copies-supported": [ GEN.generateInteger( 500 ) ],
		"finishings-default": GEN.generateEnum( 3 ),
		"finishings-supported": [ GEN.generateEnum( 3 ) ],
		"page-range-supported": [ GEN.generateRangeOfInteger( 1, 1000 ) ],
		"sides-default": GEN.generateKeyword( "one-sided" ),
		"sides-supported": [ GEN.generateKeyword( "one-sided" ) ],
		"number-up-default": GEN.generateInteger( 1 ),
		"number-up-supported": [ GEN.generateInteger( 1 ) ],
		"orientation-requested-default": GEN.generateEnum( 3 ),
		"orientation-requested-supported": [ GEN.generateEnum( 3 ) ],
		"media-default": GEN.generateNameWithoutLanguage( "A4 manual feed" ),
		"media-supported": [ GEN.generateNameWithoutLanguage( "A4 manual feed" ) ],
		//"media-ready": [ GEN.generateInteger( 500 ) ],
		"printer-resolution-default": GEN.generateResolution( 600, 600, GEN.PER_INCH ),
		"printer-resolution-supported": [ GEN.generateResolution( 600, 600, GEN.PER_INCH ) ],
		"print-quality-default": GEN.generateEnum( 4 ),
		"print-quality-supported": [ GEN.generateEnum( 4 ) ]
	};
*/
};





// --- public API ---

module.exports.Printer = Printer;
