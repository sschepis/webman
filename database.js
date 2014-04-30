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
		notes: Sequelize.TEXT
	});

	// weblink semantic data joins
	database.UserWebLinkTaxonomy = database.sequelize.define('UserWebLinkTaxonomy', {
	  score: Sequelize.FLOAT,
	  confident: Sequelize.BOOLEAN
	});
	database.UserWebLinkCategory = database.sequelize.define('UserWebLinkCategory', {
	  score: Sequelize.FLOAT
	});	
	database.UserWebLinkKeyword = database.sequelize.define('UserWebLinkKeyword', {
	  relevance: Sequelize.FLOAT
	});
	database.UserWebLinkConcept = database.sequelize.define('UserWebLinkConcept', {
	  score: Sequelize.FLOAT
	});
	database.UserWebLinkEntity = database.sequelize.define('UserWebLinkEntity', {
	  relevance: Sequelize.FLOAT,
	  count: Sequelize.INTEGER,
	  text: Sequelize.STRING
	});


	// weblink
	database.WebLink = database.sequelize.define('WebLink', {
	  title: Sequelize.STRING,
	  url: Sequelize.STRING,
	  imageUrl: Sequelize.STRING,
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
	database.Entity = database.sequelize.define('Entity', {
	  name: Sequelize.STRING,
	  type: Sequelize.STRING
	});
	database.EntityMeta = database.sequelize.define('EntityMeta', {
	  name: Sequelize.STRING,
	  value: Sequelize.STRING
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
	database.WebLinkEntity = database.sequelize.define('WebLinkEntity', {
	  relevance: Sequelize.FLOAT,
	  count: Sequelize.INTEGER,
	  text: Sequelize.STRING
	});

	database.Website.hasMany(database.WebLink);	
	database.WebLink.hasOne(database.Website);
	database.WebLink.belongsTo(database.Website);

	database.WebLink.hasOne(database.WebLinkCategory);
	database.WebLink.hasMany(database.WebLinkKeyword);
	database.WebLink.hasMany(database.WebLinkTaxonomy);
	database.WebLink.hasMany(database.WebLinkConcept);
	database.WebLink.hasMany(database.WebLinkEntity);

	database.Category.hasMany(database.WebLinkCategory);
	database.Keyword.hasMany(database.WebLinkKeyword);
	database.Taxonomy.hasMany(database.WebLinkTaxonomy);
	database.Concept.hasMany(database.WebLinkConcept);
	database.Concept.hasMany(database.ConceptMeta);	
	database.ConceptMeta.belongsTo(database.Concept);
	database.Entity.hasMany(database.WebLinkEntity);
	database.Entity.hasMany(database.EntityMeta);	
	database.EntityMeta.belongsTo(database.Entity);

	database.WebLinkCategory.belongsTo(database.WebLink);
	database.WebLinkKeyword.belongsTo(database.WebLink);
	database.WebLinkTaxonomy.belongsTo(database.WebLink);
	database.WebLinkConcept.belongsTo(database.WebLink);
	database.WebLinkEntity.belongsTo(database.WebLink);

	database.User.hasMany(database.UserWebLink);
	database.WebLink.hasMany(database.UserWebLink);
	database.UserWebLink.belongsTo(database.User);

	database.sequelize
	  .sync({force:true})
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
    	url : fields.url,
    	imageUrl : fields.imageUrl,
    	content : fields.content
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

database.getCategory = function(title, callback) {
	var category = database.Category
	.findOrCreate({
  		title : title
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
		callback(null, {weblinkCategory : ret, created : created});
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

database.getTaxonomy = function(label, callback) {
	var taxonomy = database.Taxonomy
	.findOrCreate({
  		label : label
  	})    	
	.error(function(err) {
		callback(err, null);
	})
	.success(function(ret, created) {
	    callback(null, { 
		 	taxonomy : ret, 
		 	created : created
		});
	});
};

database.linkWebLinkToTaxonomy = function(weblink, taxonomy, score, confident, callback) {
	var weblinkTaxonomy = database.WebLinkTaxonomy
	.findOrCreate({
		WebLinkId : weblink.id,
		TaxonomyId : taxonomy.id,
  		score : score,
  		confident : confident
  	})    	
	.error(function(err) {
		callback(err, null);
	})
	.success(function(ret, created) {
		callback(null, { 
			weblinkTaxonomy : ret, 
			created : created
		});
	});
};

database.setWebLinkTaxonomy = function(weblink, taxonomy, score, confident, callback) {
	database.getTaxonomy(taxonomy, function(err, ret) {
		database.linkWebLinkToTaxonomy(weblink, ret.taxonomy, score, confident,
		function(err, ret) {
			callback(err, ret);
		});
	});
}

database.getConcept = function(text, callback) {
	var concept = database.Concept
	.findOrCreate({
  		text : text
  	})    	
	.error(function(err) {
		callback(err, null);
	})
	.success(function(ret, created) {
	    callback(null, { 
		 	concept : ret, 
		 	created : created
		});
	});
};

database.setConceptMeta = function(concept, name, value, callback) {
	var conceptMeta = database.ConceptMeta
	.findOrCreate({
		ConceptId : concept.id, 
  		name : name,
  		value : value
  	})    	
	.success(function(ret, created) {
	    callback(null, { 
		 	conceptMeta : ret, 
		 	created : created
		});
	});
};

database.getConceptMeta = function(concept, name, callback) {
	var conceptMeta = database.ConceptMeta
	.find({
		ConceptId : concept.id, 
  		name : name
  	})    	
	.success(function(ret) {
	    callback(null, ret);
	});
};

database.linkWebLinkToConcept = function(weblink, concept, relevance, callback) {
	var weblinkConcept = database.WebLinkConcept
	.findOrCreate({
		WebLinkId : weblink.id,
		ConceptId : concept.id,
  		relevance : relevance
  	})    	
	.error(function(err) {
		callback(err, null);
	})
	.success(function(ret, created) {
		callback(null, { 
			weblinkConcept : ret, 
			created : created
		});
	});
};

database.setWebLinkConcept = function(weblink, concept, relevance, callback) {
	database.getConcept(concept, function(err, ret) {
		database.linkWebLinkToConcept(weblink, ret.concept, relevance, 
		function(err, ret) {
			callback(err, ret);
		});
	});
}

database.getEntity = function(name, type, callback) {
	var entity = database.Entity
	.findOrCreate({
  		name : name,
  		type : type, 
  	})    	
	.error(function(err) {
		callback(err, null);
	})
	.success(function(ret, created) {
	    callback(null, { 
		 	entity : ret, 
		 	created : created
		});
	});
};

database.setEntityMeta = function(entity, name, value, callback) {
	var entityMeta = database.EntityMeta
	.findOrCreate({
		EntityId : entity.id, 
  		name : name,
  		value : value
  	})    	
	.success(function(ret, created) {
	    callback(null, { 
		 	entityMeta : ret, 
		 	created : created
		});
	});
};

database.getEntityMeta = function(entity, name, callback) {
	var entityMeta = database.EntityMeta
	.find({
		EntityId : entity.id, 
  		name : name
  	})    	
	.success(function(ret) {
	    callback(null, ret);
	});
};

database.linkWebLinkToEntity = function(weblink, entity, text, relevance, count, callback) {
	var weblinkEntity = database.WebLinkEntity
	.findOrCreate({
		WebLinkId : weblink.id,
		EntityId : entity.id,
		text : text,
  		relevance : relevance,
  		count : count
  	})    	
	.error(function(err) {
		callback(err, null);
	})
	.success(function(ret, created) {
		callback(null, { 
			weblinkEntity : ret, 
			created : created
		});
	});
};

database.setWebLinkEntity = function(weblink, entity, text, relevance, count, callback) {
	database.getEntity(entity, function(err, ret) {
		database.linkWebLinkToEntity(weblink, ret.entity, text, relevance, count,
		function(err, ret) {
			callback(err, ret);
		});
	});
}

database.getUserWebLink = function(user, weblink, callback) {
	database.UserWebLink
	.findOrCreate({
		UserId : user.id, 
  		WebLinkId : weblink.id
  	})    	
  	.error(function(err) {
		callback(err, null);
	})
	.success(function(ret, created) {
	    callback(null, { 
	    	userWebLink : ret, 
	    	created : created 
	    });
	});
};

database.getUser = function(user, callback) {
	database.User
	.findOrCreate({
		username : user,
		password : 'password'
  	})    	
	.success(function(ret, created) {
	    callback(null, { 
	    	user : ret, 
	    	created : created 
	    });
	});
};