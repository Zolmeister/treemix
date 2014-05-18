/**
 * Configure advanced options for the Express server inside of Sails.
 *
 * For more information on configuration, check out:
 * http://sailsjs.org/#documentation
 */
var passport = require('passport'),
	SoundCloudStrategy = require('passport-soundcloud').Strategy;
passport.serializeUser(function(user, done) {
	done(null, user.soundcloudId);
});

passport.deserializeUser(function(id, done) {
	User.findOne({
		soundcloudId: id
	}).then(function(user) {
		done(null, user);
	});
});

module.exports.express = {

	// Completely override Express middleware loading.  
	// If you only want to override the bodyParser, cookieParser
	// or methodOverride middleware, see the appropriate keys below.
	// If you only want to override one or more of the default middleware,
	// but keep the order the same, use the `middleware` key.
	// See the `http` hook in the Sails core for the default loading order.
	//
	// loadMiddleware: function( app, defaultMiddleware, sails ) { ... }
	customMiddleware: function(app) {

		passport.use(new SoundCloudStrategy({
				clientID: '20a5b7cf9c33e86431f5148a15ee5a3d',
				clientSecret: '027f2e504f2800de448132e1322498f1',
				callbackURL: "http://172.31.34.208:3000/auth/soundcloud/callback"
			},
			function(accessToken, refreshToken, profile, done) {
				User.findOne({
					soundcloudId: profile.id
				}, function(err, user) {
					if (user) {
						done(null, user);
					} else {
						if (err) return done(err);
						User.create({
							soundcloudId: profile.id,
							accessToken: accessToken,
							refreshToken: refreshToken
						}).then(function(user) {
							return done(null, user);
						}, function(err) {
							console.log(err);
							done(err);
						});
					}
				});
			}
		));

		app.use(passport.initialize());
		app.use(passport.session());
	}



	// Override one or more of the default middleware (besides bodyParser, cookieParser)
	// 
	// middleware: {
	//    session: false, // turn off session completely for HTTP requests
	//    404: function ( req, res, next ) { ... your custom 404 middleware ... }
	// }



	// The middleware function used for parsing the HTTP request body.
	// (this most commonly comes up in the context of file uploads)
	//
	// Defaults to a slightly modified version of `express.bodyParser`, i.e.:
	// If the Connect `bodyParser` doesn't understand the HTTP body request 
	// data, Sails runs it again with an artificial header, forcing it to try
	// and parse the request body as JSON.  (this allows JSON to be used as your
	// request data without the need to specify a 'Content-type: application/json'
	// header)
	// 
	// If you want to change any of that, you can override the bodyParser with
	// your own custom middleware:
	// bodyParser: function customBodyParser (options) { ... return function(req, res, next) {...}; }
	// 
	// Or you can always revert back to the vanilla parser built-in to Connect/Express:
	// bodyParser: require('express').bodyParser,
	// 
	// Or to disable the body parser completely:
	// bodyParser: false,
	// (useful for streaming file uploads-- to disk or S3 or wherever you like)
	//
	// WARNING
	// ======================================================================
	// Multipart bodyParser (i.e. express.multipart() ) will be removed
	// in Connect 3 / Express 4.
	// [Why?](https://github.com/senchalabs/connect/wiki/Connect-3.0)
	//
	// The multipart component of this parser will be replaced
	// in a subsequent version of Sails (after v0.10, probably v0.11) with:
	// [file-parser](https://github.com/balderdashy/file-parser)
	// (or something comparable)
	// 
	// If you understand the risks of using the multipart bodyParser,
	// and would like to disable the warning log messages, uncomment:
	// silenceMultipartWarning: true,
	// ======================================================================



	// Cookie parser middleware to use
	//			(or false to disable)
	//
	// Defaults to `express.cookieParser`
	//
	// Example override:
	// cookieParser: (function customMethodOverride (req, res, next) {})(),



	// HTTP method override middleware
	//			(or false to disable)
	//
	// This option allows artificial query params to be passed to trick 
	// Sails into thinking a different HTTP verb was used.
	// Useful when supporting an API for user-agents which don't allow 
	// PUT or DELETE requests
	//
	// Defaults to `express.methodOverride`
	//
	// Example override:
	// methodOverride: (function customMethodOverride (req, res, next) {})()
};



/**
 * HTTP Flat-File Cache
 *
 * These settings are for Express' static middleware- the part that serves
 * flat-files like images, css, client-side templates, favicons, etc.
 *
 * In Sails, this affects the files in your app's `assets` directory.
 * By default, Sails uses your project's Gruntfile to compile/copy those
 * assets to `.tmp/public`, where they're accessible to Express.
 *
 * The HTTP static cache is only active in a 'production' environment,
 * since that's the only time Express will cache flat-files.
 *
 * For more information on configuration, check out:
 * http://sailsjs.org/#documentation
 */
module.exports.cache = {

	// The number of seconds to cache files being served from disk
	// (only works in production mode)
	maxAge: 31557600000
};