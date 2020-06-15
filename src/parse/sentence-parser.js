var SentenceParser = Backbone.View.extend({
    
    initialize: function(options) {
	this.inputParser = this.$el.find("input#parser");
	this.graph = options.graph;
	this.$el.focus();

    },

    events: {
	"keyup input#parser" : "textChange",
	"click button#randomize" : "generateSentence"
    },

    generateSentence : function () {
	var generatedSentence = generateSentence(this.collection);
	while (generatedSentence.length > 8) {
	    generatedSentence = generateSentence(this.collection);
	}
	var sentence = generatedSentence.join(" ");
	this.inputParser.val(sentence);
	this.textChange();
    },
    
    textChange : function(e) {
	var sentence = this.inputParser.val();
	var chart = earleyRecognize(sentence, this.collection);
	var earleyParser = new EarleyParser(chart);
	var forest = earleyParser.parse();
	
	if (forest.length === 0) {
	    this.inputParser.css('background-color', '#FFCCBA');
	}
	else {
	    this.inputParser.css('background-color', 'white');
	}
	this.graph.render(chart, forest);
    }
    
});

function generateSentence(grammar, node) {
    if (typeof node === "undefined") {
	var node = randomValueOf(grammar.where({lhs: grammar.startCat()}));
    }
    var rhs = node.get('rhs');
    if (node.get('isPos') === true) {
	return randomValueOf(rhs);
    }
    var children = rhs.map(function(s) {
	return randomValueOf(grammar.where({lhs:s}));});
    return [].concat.apply([], children.map(function (n) {return generateSentence(grammar, n);}));
}

function randomValueOf(array) {
    return array[Math.floor(Math.random() * array.length)];
}
