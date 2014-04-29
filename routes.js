
var alchemy = require('./alchemy.js');
var database = require('./database.js');
var async = require('async');
var Base58 = require('base58');

exports.slurp = function (req, res, next) {
	alchemy.transmuteURL(req.params.url, function(err, gold) {
		var result = { url : gold.url };

		async.waterfall([
		    function(callback) {
				var weblink = database.WebLink
				.build({
			  		title : gold.title.title,
			    	url : gold.url
			  	})    	
				.save()
				.error(function(err) {
					callback(err, null);
				})
				.success(function() {
					result.weblink = weblink;
					result.gold = gold;
					callback(null, result);
				});
		    },
		    
		    function(data, callback){
		    	var buf = new Buffer(JSON.stringify(data.gold), 'hex');
				var potion = database.Potion
				.build({
			  		text : buf.toString()
			  	})
			  	.save()
				.error(function(err) {
					callback(err, null);
				})
				.success(function() {
					result.weblink.setTarget(potion).complete(function(err){
						callback(null, { weblink : data.weblink, potion : potion});				
					});
				});
		    },
		    
		    function(data, callback){
		        callback(null, data);
		    }], 
			
			function (err, data) {
				res.send(data);
				return next();	
			});
	});
};

exports.initRoutes = function(server, callback) {
	server.get('/slurp', exports.slurp);
	callback(null, {});	
};

