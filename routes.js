
var alchemy = require('./alchemy.js');
var database = require('./database.js');
var async = require('async');
var zlib = require('zlib');
var inspect = require('eyes').inspector({maxLength:20000});
var pdf_extract = require('pdf-extract');
var http = require('http');
var request = require('request');
var crypto = require('crypto');
var fs = require('fs');


exports.slurp = function (req, res, next) {
	if(req.params.u === '') {
		res.send({message:'no url specified'});
		return next();		
	}
	var theUrl = req.params.u;
	if(theUrl.endsWith('.pdf')) theUrl = 'http://stellanet.dyndns.org/pdf?u=' + theUrl;
	alchemy.transmuteURL(req.params.u, function(err, gold) {
		var result = { url : gold.url };
		if(req.params.u.endsWith('.pdf'))
			result.url = req.params.u;

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
		    	async.each(data.gold.combined.keywords, function(keyword, eachcb) {
	    			database.setWebLinkKeyword(data.weblink.weblink, keyword.text, keyword.relevance, 
	    			function() { eachcb(); });
		    	}, function() {});		    		

		    	callback(null, data);
		    },

		    // build and link categories
		    function(data, callback){

	    		var category = data.gold.combined.category;
	    		database.setWebLinkCategory(
	    			data.weblink.weblink, 
	    			category.category, 
	    			category.score, 
	    			function() {});

		        callback(null, data);
		    }, 

		    // build and link taxonomy
		    function(data, callback){
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
		    	});	
		    	callback(null, data);
		    }, 

		    // build and link concepts
		    function(data, callback){
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
		    }, 

		    // build and link entities
		    function(data, callback){
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
		    }],

			// done
			function (err, ret) {
				res.send(ret);
				return next();	
			}
		);
	});
};

exports.pdfToText = function (req, res, next) {
	var pdfUrl = req.params.u;
	if(pdfUrl!=='') {
		var md5sum = crypto.createHash('md5');
		md5sum.update(pdfUrl);
		var local = '/tmp/' + md5sum.digest('hex') + '.pdf';

		var file = fs.createWriteStream(local);
		var rem = request(pdfUrl);
		rem.on('data', function(chunk) {
		    file.write(chunk);
		});
		rem.on('end', function() {
			var processor = pdf_extract(local, {type:'text'}, function(err) {
			  if (err) return callback(err);
			});
			processor.on('complete', function(data) {
			    inspect(data.text_pages, 'extracted text pages');
			    var pagesText = data.text_pages.join('\n');
			    res.send("<html><head></head><body><pre>" + pagesText + "</pre></body></html>");
			    return next();	
			});
			processor.on('error', function(err) {
			    inspect(err, 'error while extracting pages');
			    res.send(err);
			    return next();
			});
		});		
	} 
	else {
	    res.send("<html><head></head><body></body></html>");
	    return next();		
	}
}

function getSystemUser(callback) {
	database.getUser('sschepis', callback);
}

exports.initRoutes = function(server, callback) {
	server.get('/', exports.slurp);
	server.get('/pdf', exports.pdfToText);
	callback(null, {});	
};

