var Sequelize = require('sequelize');
var async = require('async');

var database = module.exports;

database.connect = function(callback) {
    database.sequelize = new Sequelize('webman', 'root', 'root', {
      dialect: "mariadb",
      port:    3306,
    });

	database.sequelize
	  .authenticate()
	  .complete(function(err) {
	    if (!!err) {
	      console.log('Unable to connect to the database:', err);
	      callback(err, null);
	    } else {
	      console.log('Connection has been established successfully.');
	      callback(null, exports);
	    }
	  });
};

database.initModel = function(callback) {
	database.User = database.sequelize.define('User', {
	  username: Sequelize.STRING,
	  password: Sequelize.STRING
	});

	database.WebLink = database.sequelize.define('WebLink', {
	  title: Sequelize.STRING,
	  url: Sequelize.STRING
	});

	database.WebLinkKeyword = database.sequelize.define('WebLinkKeyword', {
	  relevance: Sequelize.FLOAT
	});

	database.Keyword = database.sequelize.define('Keyword', {
	  value: Sequelize.STRING
	});

	database.Concept = database.sequelize.define('Concept', {
	  text: Sequelize.STRING,
	  relevance: Sequelize.FLOAT,
	  website: Sequelize.STRING
	});

	database.ConceptWebsite = database.sequelize.define('ConceptWebsite', {
	  name: Sequelize.STRING,
	  url: Sequelize.STRING
	});

	database.Website = database.sequelize.define('Website', {
	  title: Sequelize.STRING,
	  url: Sequelize.STRING
	});

	database.Category = database.sequelize.define('Category', {
	  text: Sequelize.STRING
	});

	database.WebLinkCategory = database.sequelize.define('WebLinkCategory', {
	  score: Sequelize.FLOAT
	});	

	database.Content = database.sequelize.define('Content', {
	  text: Sequelize.TEXT
	});

	database.Image = database.sequelize.define('Image', {
	  text: Sequelize.STRING
	});

	database.Taxonomy = database.sequelize.define('Taxonomy', {
	  label: Sequelize.STRING,
	  score: Sequelize.FLOAT,
	  confident: Sequelize.BOOLEAN
	});

	database.Potion = database.sequelize.define('Potion', {
	  text: Sequelize.TEXT
	});

	database.User.hasMany(database.WebLink);
	database.WebLink.belongsTo(database.User);
	database.Website.hasMany(database.WebLink);

	database.WebLink.hasOne(database.Potion);
	database.Potion.belongsTo(database.WebLink);

	database.WebLink.hasMany(database.WebLinkKeyword);
	database.WebLinkKeyword.belongsTo(database.WebLink);
	database.WebLinkKeyword.hasOne(database.Keyword);

	database.WebLink.hasOne(database.WebLinkCategory);
	database.WebLinkCategory.belongsTo(database.WebLink);
	database.WebLinkCategory.hasOne(database.Category);

	database.WebLink.hasOne(database.Content);
	database.Content.belongsTo(database.WebLink);

	database.WebLink.hasOne(database.Image);
	database.Image.belongsTo(database.WebLink);

	database.WebLink.hasMany(database.Taxonomy);
	database.Taxonomy.belongsTo(database.WebLink);

	database.WebLink.hasMany(database.Concept);
	database.Concept.belongsTo(database.WebLink);
	database.Concept.hasMany(database.ConceptWebsite);
	database.ConceptWebsite.belongsTo(database.Concept);
	
	database.sequelize
	  .sync({ force:true })
	  .complete(function(err) {
	     if (!!err) {
	       console.log('An error occurred while creating the table:', err);
	       callback(err, null);
	     } else {
	       database.buildCache(function() {
	       	 callback(null, database);	
	       });
	     }
	});    	
};

database.getKeyword = function(text, callback) {
	database.Keyword
	.findOrCreate({
  		text : text
  	})
	.success(function(kw, created) {
		callback(null, { keyword : kw, created : created});
	});
}

database.buildCache = function(callback) {
	database.cache.keywords = {};
	database.Keyword.findAll().success(function(keywords) {
		for(var i=0;i<keywords.length;i++) {
			var keyword = keywords[i];
			database.cache.keywords[keyword.text] = keyword;
		}
		callback();
	});
};