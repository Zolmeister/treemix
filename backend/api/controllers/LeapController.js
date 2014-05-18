/**
 * LeapController.js
 *
 * @description ::
 * @docs        :: http://sailsjs.org/#!documentation/controllers
 */

module.exports = {
	leap: function(req, res) {
		console.log(req.body);
		res.send(200);
	}
};