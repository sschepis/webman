
var alchemy = require('./alchemy.js');
var database = require('./database.js');
var async = require('async');

exports.slurp = function (req, res, next) {
	alchemy.transmuteURL(req.params.url, function(err, gold) {
		var result = { url : gold.url };

		async.waterfall([
			// build base weblink object
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

		    // build and link all keyword objects
		    function(data, callback) {
		    	async.each(data.gold.keywords, function(keyword, eachcb) {
		    		database.getKeyword(keyword.text, function(kw) {
		    			eachcb();
		    		});
		    	}, 
		    	function(err) {
		    		if(err) callback(err, null);
		    		else callback(null, data);
		    	});
		    },

		    // build and link taxonomy
		    function(data, callback){
		        callback(null, data);
		    }], 
			
			// done
			function (err, data) {
				res.send(data);
				return next();	
			}
		);
	});
};

exports.initRoutes = function(server, callback) {
	server.get('/slurp', exports.slurp);
	callback(null, {});	
};

