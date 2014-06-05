"use strict";

var communicator = require( '../lib/communicator' );
var surveyModel = require( '../models/survey-model' )();
var debug = require( 'debug' )( 'submission-controller' );
var inspect = require( 'util' ).inspect;
var Busboy = require( 'busboy' );

module.exports = {
    submit: function( req, res, next ) {
        var xmlData,
            busboy = new Busboy( {
                headers: req.headers
            } );

        busboy.on( 'field', function( fieldname, val, fieldnameTruncated, valTruncated ) {
            if ( fieldname === 'xml_submission_data' ) {
                xmlData = val;
            }
        } );
        busboy.on( 'finish', function() {
            return surveyModel.get( req.enketoId )
                .then( function( survey ) {
                    var submissionUrl = survey.openRosaServer + '/submission';
                    return communicator.submit( submissionUrl, xmlData )
                        .then( function( code ) {
                            res.send( code );
                        } )
                        .catch( next );
                } )
                .catch( next );
        } );
        req.pipe( busboy );
    },
    maxSize: function( req, res, next ) {
        return surveyModel.get( req.enketoId )
            .then( communicator.getMaxSize )
            .then( function( maxSize ) {
                res.json( {
                    maxSize: maxSize
                } );
            } )
            .catch( next );
    }
};
