/**
 * UserController.js
 *
 * @description ::
 * @docs        :: http://sailsjs.org/#!documentation/controllers
 */
var passport = require('passport'),
	request = require('request'),
	_ = require('underscore'),
	neo4j = require('node-neo4j'),
	db = new neo4j('http://localhost:7474'),
	Q = require('q');

function createRootNode(user) {
	var deferred = Q.defer();
	db.insertNode({
		soundcloudId: user.soundcloudId
	}, function(err, node) {
		if (err) throw err;

		// Output node properties.
		console.log(node.data);
		deferred.resolve(node);
		// Output node id.
		console.log(node._id); /* for 2.0.0-RC6, use: console.log(node._id) */
	});
	return deferred.promise;
};
//addNodeAndRelationship({
// id: user.nodeId
// }, artist, 'Follows')
function getUserArtists(user) {
	// generate new token each time
	var deferred = Q.defer();
	request('https://api.soundcloud.com/me/followings.json?oauth_token=' + user.accessToken, function(error, response, body) {
		if (!error) {
			deferred.resolve(JSON.parse(response.body));
		}
	});
	return deferred.promise;
};

function getUserLikes(user) {
	var deferred = Q.defer();
	request('https://api.soundcloud.com/me/favorites.json?oauth_token=' + user.accessToken, function(error, response, body) {

		if (!error) {
			Q.all(_.map(JSON.parse(response.body), function(like) {

				return addNodeAndRelationship({
					_id: user.nodeId
				}, like, 'Likes');

			})).then(function() {
				deferred.resolve(user);
			})
		}
	});
	return deferred.promise;
};

function getArtistLikes(artist, user) {
	console.log(artist.id);
	var deferred = Q.defer();

	request('https://api.soundcloud.com/users/' + artist.id + '/favorites.json?oauth_token=' + user.accessToken, function(error, response, body) {
		console.log(JSON.parse(response.body).length);
		if (!error) {

			deferred.resolve(JSON.parse(response.body));
			// deferred.resolve(body);
		}
	});

	return deferred.promise;
};

function addArtistLikes(user, artists) {
	return Q.all(_.map(artists, function(artist) {
		var node;
		return addNodeAndRelationship({
				_id: user.nodeId
			}, artist, 'Follows')
			.then(function(n) {
				console.log(n);
				node = n;

				return getArtistLikes(artist, user)
			}).then(function(likes) {
				console.log(likes);
				return Q.all(_.map(likes, function(like) {
					return addNodeAndRelationship(node, like, 'Likes');
				}));
			});
	}));
}

function addNodeAndRelationship(root, nodeData, relationship) {
	var deferred = Q.defer();
	var node = {};
	if (nodeData.type) node.type = nodeData.type;
	if (nodeData.stream_url) node.stream_url = nodeData.stream_url;
	if (nodeData.waveform_url) node.waveform_url = nodeData.waveform_url;
	if (nodeData.playback_count) node.playback_count = nodeData.playback_count;
	if (nodeData.artwork_url) node.artwork_url = nodeData.artwork_url;
	if (nodeData.favoritings_count) node.favoritings_count = nodeData.favoritings_count;
	if (nodeData.username) node.name = nodeData.username;
	if (nodeData.title) node.name = nodeData.title;
	if (nodeData.id) node.soundcloudId = nodeData.id;
	if (nodeData.id) node.id = nodeData.id;


	db.insertNode(node, function(err, node) {
		console.log(err);
		if (err) return deferred.reject(err);
		db.insertRelationship(root._id, node._id, relationship, {

		}, function(err, relationship) {
			if (err) return deferred.reject(err);
			// here we need to add all the artists songs

			// Output relationship properties.

			// Output relationship id.
			console.log(relationship._id); /* for 2.0.0-RC6, use: console.log(relationship._id) */
			deferred.resolve(node);
			// Output relationship start_node_id.

			// Output relationship end_node_id.
		});
	});

	return deferred.promise;
}

function traverseGraph(startNode) {
	var deferred = Q.defer();
	db.cypherQuery("START user = node(" + startNode + ") MATCH user - [:Follows] -(m)- [:Likes] - (songs)WHERE NOT (user)-->(songs) and (songs.favoritings_count > 0) return songs.name, songs.waveform_url, songs.soundcloudId, songs.artwork_url, (count(songs) * (songs.favoritings_count*songs.favoritings_count)) AS common_cnt ORDER BY common_cnt desc limit 30;", function(err, result) {
		if (err) throw err;
		deferred.resolve(_.map(result.data, function(d) {
			return _.object(['name', 'waveform_url', 'soundcloudId', 'artwork_url'], d);

		}));
		console.log(result.data); // delivers an array of query results
		console.log(result.columns); // delivers an array of names of objects getting returned

	});
	return deferred.promise;
}


module.exports = {
	traverseGraph: function(req, res) {
		console.log(req.session);
		User.findOne({
			soundcloudId: req.session.passport.user
		}).then(function(user) {
			console.log(user);
			return traverseGraph(user.nodeId);
		}).then(function(data) {
			res.json(data);
		});
	},
	generateGraph: function(req, res) {
		console.log(req.session);
		User.findOne({
			soundcloudId: req.session.passport.user
		}).then(function(user) {
			console.log(user);
			createRootNode(user).then(function(node) {
				user.nodeId = node._id;

				return user.save();
			})
				.then(getUserLikes)
				.then(getUserArtists)
				.then(function(artists) {
					return addArtistLikes(user, artists);
				})
				.then(function() {
					console.log('yay');
					res.json({
						done: true
					})
				}, function(err) {
					console.log(err);
				})

		})
	},
	soundcloud: function(req, res) {
		passport.authenticate('soundcloud', {
				failureRedirect: '/login'
			},
			function(err, user) {
				req.logIn(user, function(err) {
					if (err) {
						res.view('500');
						return;
					}

					res.redirect('/');
					return;
				});
			})(req, res);
	},
	endAuth: function(req, res) {
		passport.authenticate('soundcloud',
			function(err, user, info) {
				console.log(err, user, info);
				if (err) {
					res.end(401);
				} else {
					req.logIn(user, function(err) {
						if (err) res.send(401, 'couldnt log in');
						return res.redirect('/');
					});

				}

			})(req, res);
	},

	session: function(req, res) {
		if (req.session && req.session.passport && req.session.passport.user) {
			User.findOne({
				soundcloudId: req.session.passport.user
			}).then(function(user) {

				res.json(user);
			}, function(err) {
				req.session = {};
				if (err) res.json({
					error: 'DB error'
				}, 500);
			});

		} else {
			res.status = 'error';
			res.send(404, {
				error: 'Invalid session, please log in.'
			}, 404);
		}
	},
	logout: function(req, res) {
		req.session.destroy();
		req.session.user = null;
		res.json({
			status: 'Successfully Logged Out'
		}, 200);
	}

};