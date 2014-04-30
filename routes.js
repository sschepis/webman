
var alchemy = require('./alchemy.js');
var database = require('./database.js');
var async = require('async');
var zlib = require('zlib');

exports.slurp = function (req, res, next) {
	alchemy.transmuteURL(req.params.url, function(err, gold) {
		var result = { url : gold.url };

		async.waterfall([
			
			// build base weblink object
		    function(callback) {
				zlib.deflate(gold.text.text, function(err, buffer) {
			    	database.getWebLink({
				  		title : gold.title.title,
				    	url : gold.url,
				    	imageUrl : gold.image.url,
				    	content : buffer.toString('base64')
				  	}, function(err, ret) {
				  		if(err) callback(err, null);
				  		else callback(null, { 
				  			gold : gold, 
				  			weblink : ret 
				  		});
				  	});					
				});

		    },

		    // build and link all keyword objects
		    function(data, callback) {
		    	// only process alchemy data if a new weblink
		    	if(data.weblink.created === true) {
			    	async.each(data.gold.combined.keywords, function(keyword, eachcb) {
		    			database.setWebLinkKeyword(data.weblink.weblink, keyword.text, keyword.relevance, 
		    			function() { eachcb(); });
			    	}, function() {});		    		
		    	} 
		    	callback(null, data);
		    },

		    // build and link categories
		    function(data, callback){
		    	if(data.weblink.created === true) {
		    		var category = data.gold.combined.category;
		    		database.setWebLinkCategory(
		    			data.weblink.weblink, 
		    			category.category, 
		    			category.score, 
		    			function() {});
		    	}
		        callback(null, data);
		    }, 

		    // build and link taxonomy
		    function(data, callback){
		    	if(data.weblink.created === true) {
			    	async.each(data.gold.taxonomy.taxonomy, function(taxonomy, eachcb) {
			    		var confident = true;
			    		if(taxonomy.confident) 
			    			confident = taxonomy.confident === 'no' ? false : true;
		    			database.setWebLinkTaxonomy(
		    				data.weblink.weblink, 
		    				taxonomy.label, 
		    				taxonomy.score, 
		    				confident,  
		    				function() {});
		    			eachcb(); 
			    	}, 
			    	function(err) {
			    		if(err) callback(err, null);
			    		else callback(null, data);
			    	});	
		    	}
		        else callback(null, data);
		    }, 

		    // build and link concepts
		    function(data, callback){
		    	if(data.weblink.created === true) {
			    	async.each(data.gold.combined.concepts, function(cin, cb1) {
			    		database.getConcept(cin.text, function(err, ret) {
				    		var keys = Object.keys(cin);
	    					async.each(keys, function(key, cb2) {
	    						if(key!=='text')
		    						database.setConceptMeta(ret.concept, 
		    							key, cin[key], function(){});
	    						cb2();
	    					});
	    					database.linkWebLinkToConcept(
	    						data.weblink.weblink, 
	    						ret.concept, 
	    						cin.relevance, 
	    						function(){});
			    		});
    					cb1();
			    	});
			    	callback(null, data);
		    	}
		        else callback(null, data);
		    }, 

		    // build and link entities
		    function(data, callback){
		    	if(data.weblink.created === true) {
			    	async.each(data.gold.combined.entities, function(ein, cb1) {
			    		var name = ein.text;
			    		if('disambiguated' in ein && !'name' in ein.disambiguated)
			    			name = ein.disambiguated.name = ein.text;
			    		if('disambiguated' in ein && 'name' in ein.disambiguated)
			    			name = ein.disambiguated.name;
			    		database.getEntity(name, ein.type, function(err, ret) {
			    			if('disambiguated' in ein) {
					    		var keys = Object.keys(ein.disambiguated);
		    					async.each(keys, function(key, cb2) {
		    						if(key!=='name')
			    						database.setEntityMeta(ret.entity,
			    							key, ein.disambiguated[key], function(){});
		    						cb2();
		    					});			    				
			    			}
	    					database.linkWebLinkToEntity(
	    						data.weblink.weblink, 
	    						ret.entity, 
	    						ein.text, 
	    						ein.relevance, 
	    						ein.count, function(){});
			    		});
    					cb1();
			    	});
			    	callback(null, data);
		    	}
		        else callback(null, data);
		    }],

			// done
			function (err, ret) {
				res.send({
					id : ret.weblink.weblink.id,
					title : ret.weblink.weblink.title,
					url : ret.weblink.weblink.url,
					createdAt : ret.weblink.weblink.createdAt,
					updatedAt : ret.weblink.weblink.createdAt,
				});
				return next();	
			}
		);
	});
};

function getSystemUser(callback) {
	database.getUser('sschepis', callback);
}

exports.initRoutes = function(server, callback) {
	server.get('/slurp', exports.slurp);
	callback(null, {});	
};

