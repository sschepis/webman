var AlchemyAPI = require('alchemyapi');
var api = new AlchemyAPI();
var async = require('async');

exports.transmuteURL = function(url, cb) {
	async.parallelLimit({
		url: function(callback) {
			callback(null, url);
	    },
	    text: function(callback) {
			api.text('url', url, {}, function(response) {
				callback(null, response);
			});
	    },
	    title: function(callback){
			api.title('url', url, {}, function(response) {
				callback(null, response);
			});
	    },
	    feeds: function(callback){
			api.feeds('url', url, {}, function(response) {
				callback(null, response['feeds']);
			});
	    },
	    microformats: function(callback){
			api.microformats('url', url, {}, function(response) {
				callback(null, response['microformats']);
			});
	    },
	    taxonomy: function(callback){
			api.taxonomy('url', url, {}, function(response) {
				callback(null, response);
			});
	    },
	    combined: function(callback){
			api.combined('url', url, {}, function(response) {
				callback(null, response);
			});
	    },
	    image: function(callback){
			api.image('url', url, {}, function(response) {
				callback(null, response);
			});
	    }
	}, 3, cb);
};

