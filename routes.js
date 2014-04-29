
var alchemy = require('./alchemy.js');
var database = require('./database.js');
var async = require('async');

exports.slurp = function (req, res, next) {
	alchemy.transmuteURL(req.params.url, function(err, gold) {
		var result = { url : gold.url };

		async.waterfall([
			
			// build base weblink object
		    function(callback) {
		    	database.getWebLink({
			  		title : gold.title.title,
			    	url : gold.url
			  	}, function(err, ret) {
			  		if(err) callback(err, null);
			  		else callback(null, { 
			  			gold : gold, 
			  			weblink : ret 
			  		});
			  	});
		    },

		    // build and link all keyword objects
		    function(data, callback) {
		    	// only process alchemy data if a new weblink
		    	if(data.weblink.created === true) {
			    	async.each(data.gold.combined.keywords, function(wlkw, eachcb) {
			    		database.getKeyword(wlkw.text, function(err, kwd) {
			    			database.linkWebLinkToKeyword(data.weblink.weblink, kwd.keyword, wlkw.relevance, 
			    			function() {
			    				eachcb();
			    			});
			    		});
			    	}, 
			    	function(err) {
			    		if(err) callback(err, null);
			    		else callback(null, data);
			    	});		    		
		    	} 
		    	else callback(null, data);
		    },

		    // build and link categories
		    function(data, callback){
		    	if(data.weblink.created === true) {
		    	}
		        else callback(null, data);
		    }, 

		    // build and link taxonomy
		    function(data, callback){
		    	if(data.weblink.created === true) {
		    	}
		        else callback(null, data);
		    }, 
		    
		    // build and link concepts
		    function(data, callback){
		    	if(data.weblink.created === true) {
		    	}
		        else callback(null, data);
		    }, 

		    // build and link concepts
		    function(data, callback){
		    	if(data.weblink.created === true) {
		    	}
		        else callback(null, data);
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

