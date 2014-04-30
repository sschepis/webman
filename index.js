var restify = require('restify');
var async = require('async');

var database = require('./database.js');
var routes = require('./routes.js');
var alchemy = require("./alchemy.js");

if (typeof String.prototype.endsWith !== 'function') {
    String.prototype.endsWith = function(suffix) {
        return this.indexOf(suffix, this.length - suffix.length) !== -1;
    };
}

var server = restify.createServer({
    name : 'webman',
    version : '0.0.1',
    formatters: {
        'application/json': function(req, res, body){
            if(req.params.callback){
                var callbackFunctionName = req.params.callback.replace(/[^A-Za-z0-9_\.]/g, '');
                return callbackFunctionName + "(" + JSON.stringify(body) + ");";
            } else {
                return JSON.stringify(body);
            }
        },
        'text/html': function(req, res, body){
            return body;
        }
    }
});

server.use(restify.acceptParser(server.acceptable));
server.use(restify.queryParser());
server.use(restify.bodyParser());
server.use(restify.authorizationParser());
server.use(restify.CORS());
server.use(restify.dateParser());
server.use(restify.jsonp());
server.use(restify.urlEncodedBodyParser());
server.use(restify.requestLogger());
server.use(restify.gzipResponse());
server.use(restify.jsonBodyParser());
server.use(restify.multipartBodyParser());
server.use(restify.sanitizePath());
 
async.waterfall([
    function(callback) {
    	database.connect(callback);
    },
    function(data, callback) {
    	database.initModel(function(err, ret) {
    		callback(null, data);
    	});
    },
    function(data, callback){
    	routes.initRoutes(server, callback);
    }
], 
    function (err, result) {
		if(!err) {
		server.listen(4567, function () {
			console.log('%s listening at %s', server.name, server.url);
		});
	}  
});
