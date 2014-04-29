var Sequelize = require('sequelize');
var async = require('async');

var database = module.exports;

database.connect = function(callback) {
    database.sequelize = new Sequelize('webman', 'root', '', {
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
	
	// user
	database.User = database.sequelize.define('User', {
	  username: Sequelize.STRING,
	  password: Sequelize.STRING
	});

	// user weblink joins
	database.UserWebLink = database.sequelize.define('UserWebLink', {
		title: Sequelize.STRING,
		notes: Sequelize.STRING
	});

	// user weblink semantic data joins
	database.UserWebLinkKeyword = database.sequelize.define('UserWebLinkKeyword', {
		score: Sequelize.FLOAT
	});
	database.UserWebLinkCategory = database.sequelize.define('UserWebLinkCategory', {
		score: Sequelize.FLOAT
	});
	database.UserWebLinkConcept = database.sequelize.define('UserWebLinkConcept', {
	  score: Sequelize.FLOAT
	});
	database.UserWebLinkTaxonomy = database.sequelize.define('UserWebLinkTaxonomy', {
	  score: Sequelize.FLOAT
	});

	// weblink
	database.WebLink = database.sequelize.define('WebLink', {
	  title: Sequelize.STRING,
	  url: Sequelize.STRING,
	  imageurl: Sequelize.STRING,
	  content: Sequelize.STRING
	});
	database.Website = database.sequelize.define('Website', {
	  title: Sequelize.STRING,
	  url: Sequelize.STRING
	});

	// semantic data
	database.Category = database.sequelize.define('Category', {
	  title: Sequelize.STRING
	});
	database.Keyword = database.sequelize.define('Keyword', {
	  value: Sequelize.STRING
	});
	database.Concept = database.sequelize.define('Concept', {
	  text: Sequelize.STRING
	});
	database.ConceptMeta = database.sequelize.define('ConceptMeta', {
	  name: Sequelize.STRING,
	  value: Sequelize.STRING
	});
	database.Taxonomy = database.sequelize.define('Taxonomy', {
	  label: Sequelize.STRING
	});

	// weblink semantic data joins
	database.WebLinkTaxonomy = database.sequelize.define('WebLinkTaxonomy', {
	  score: Sequelize.FLOAT,
	  confident: Sequelize.BOOLEAN
	});
	database.WebLinkCategory = database.sequelize.define('WebLinkCategory', {
	  score: Sequelize.FLOAT
	});	
	database.WebLinkKeyword = database.sequelize.define('WebLinkKeyword', {
	  relevance: Sequelize.FLOAT
	});
	database.WebLinkConcept = database.sequelize.define('WebLinkConcept', {
	  score: Sequelize.FLOAT
	});

	database.User.hasMany(database.UserWebLink);
	database.WebLink.hasMany(database.UserWebLink);
	database.UserWebLink.belongsTo(database.User);

	database.Website.hasMany(database.WebLink);	
	database.WebLink.hasOne(database.Website);
	database.WebLink.belongsTo(database.Website);

	database.WebLink.hasOne(database.WebLinkCategory);
	database.WebLink.hasMany(database.WebLinkKeyword);
	database.WebLink.hasMany(database.WebLinkTaxonomy);
	database.WebLink.hasMany(database.WebLinkConcept);

	database.Category.hasMany(database.WebLinkCategory);
	database.Keyword.hasMany(database.WebLinkKeyword);
	database.Taxonomy.hasMany(database.WebLinkTaxonomy);
	database.Concept.hasMany(database.WebLinkConcept);

	database.Concept.hasMany(database.ConceptMeta);	
	database.ConceptMeta.belongsTo(database.Concept);

	database.WebLinkCategory.belongsTo(database.WebLink);
	database.WebLinkKeyword.belongsTo(database.WebLink);
	database.WebLinkTaxonomy.belongsTo(database.WebLink);
	database.WebLinkConcept.belongsTo(database.WebLink);
	
	database.sequelize
	  .sync({ force:true })
	  .complete(function(err) {
	     if (!!err) {
	       console.log('An error occurred while creating the table:', err);
	       callback(err, null);
	     } else {
	       callback(null, database);	
	     }
	});    	
};

database.getKeyword = function(value, callback) {
	var keyword = database.Keyword
	.findOrCreate({
  		value : value
  	})
	.success(function(ret, created) {
		callback(null, { 
			keyword : ret, 
			created : created
		});
	});
};

database.getWebLink = function(fields, callback) {
	var weblink = database.WebLink
	.findOrCreate({
  		title : fields.title,
    	url : fields.url
  	})    	
	.success(function(ret, created) {
	    callback(null, { 
		 	weblink : ret, 
		 	created : created
		});
	});
};

database.linkWebLinkToKeyword = function(weblink, keyword, relevance, callback) {
	var weblinkKeyword = database.WebLinkKeyword
	.findOrCreate({
		WebLinkId : weblink.id,
		KeywordId : keyword.id,
  		relevance : relevance
  	})    	
	.error(function(err) {
		callback(err, null);
	})
	.success(function(ret, created) {
		callback(null, { weblinkKeyword : ret, created : created});
	});
};

database.setWebLinkKeyword = function(weblink, keyword, relevance, callback) {
	database.getKeyword(keyword, function(err, ret) {
		database.linkWebLinkToKeyword(weblink, ret.keyword, relevance, 
		function(err, ret) {
			callback(err, ret);
		});
	});
}

database.getCategory = function(fields, callback) {
	var category = database.Category
	.findOrCreate({
  		title : fields.title
  	})    	
	.success(function(ret, created) {
	    callback(null, { 
		 	category : ret, 
		 	created : created
		});
	});
};

database.linkWebLinkToCategory = function(weblink, category, score, callback) {
	var weblinkKeyword = database.WebLinkCategory
	.findOrCreate({
		WebLinkId : weblink.id,
		CategoryId : category.id,
  		score : score
  	})    	
	.error(function(err) {
		callback(err, null);
	})
	.success(function(ret, created) {
		callback(null, { weblinkCategory : ret, created : created});
	});
};

database.setWebLinkCategory = function(weblink, category, score, callback) {
	database.getCategory(category, function(err, ret) {
		database.linkWebLinkToCategory(weblink, ret.category, score, 
		function(err, ret) {
			callback(err, ret);
		});
	});
}
