function earleyRecognize(sentence, grammar, chart) {
        
    var words = sentence.split(" ");

    var chart = new Chart(words, grammar.startCat());
    var dummyState = new State(undefined, [chart.startCat], 0, 0, 0);
    chart.add(dummyState, 0);

    var agenda = new Set();

    for (var i = 0; i < chart.states.length; i++) {
	var stateIdx = 0;
	while (stateIdx < chart.states[i].length) {
	    var state = chart.states[i][stateIdx];
	    stateIdx++; 
	    if (state.isIncomplete && !grammar.isPartOfSpeech(state.nextCat)) {
		predictor(state);
	    }
	    else if (state.isIncomplete && grammar.isPartOfSpeech(state.nextCat)) {
		scanner(state);
	    }
	    else {
		completer(state);
	    }
	}
    }
    

    function predictor(state){
	var matchedTerminals = grammar.where({ lhs:state.nextCat });
	for (var i = 0; i < matchedTerminals.length; i++) {
	    var rule = matchedTerminals[i];
	    var newState = new State(rule.get('lhs'),
				  rule.get('rhs'), 0,
				  state.end, state.end,
				  "Predictor");
	    chart.add(newState, state.end);
	}
    }

    function scanner(state){
	var rightHandSides = grammar
	    .where({lhs:state.nextCat})
	    .map(function (r) {return r.get('rhs')});
	var lexicon = [].concat.apply([], rightHandSides);
	var word = words[state.end];
	if ($.inArray(word, lexicon) != -1) {
	    var newState = new State(state.nextCat,
				     [word], 1,
				     state.end, state.end+1,
				     "Scanner");
	    chart.add(newState, state.end+1);
	}
    }

    function completer(state){
	for (var i = 0; i < chart.states[state.start].length ; i++) {
	    var entry = chart.states[state.start][i];
	    if (state.lhs == entry.nextCat && typeof entry.lhs != "undefined") {
		var newState = new State(entry.lhs, entry.rhs,
					 entry.dot + 1, entry.start,
					 state.end,
					 "Completer");
		chart.add(newState, state.end);
	    }
	}
    }

    return chart;
}

function EarleyParser(chart) {
    this.chart = chart;
    this.agenda = chart.agenda;
    this.words = chart.words;
    this.length = 0;
    this.todo = [];
    this.forest = [];
}


EarleyParser.prototype.parse = function(state) {
    if (state) {
        if (state.isIncomplete) {
            var incompleteNodes = state.rhs.slice(state.dot)
                .map(function(name) {return {name:name, isIncomplete:true}});
            state = new State(state.lhs, state.rhs.slice(0, state.dot),
                              state.dot, state.start, state.end, state.func)
        }
        var roots = [state];
    } else {
        var lhs = this.chart.startCat, start = 0, end = this.chart.states.length - 1;
        var roots = this.chart.states[end].filter(function(s){
            return s.lhs === lhs && s.start === start && s.end === end && s.dot === s.rhs.length;
        });
    }
    
    var parses = [];
    for (var i = 0; i < roots.length; i++) {
        var rs = roots[i];
        var forest = this.parseForest(rs);
        for (var j = 0; j < forest.length; j++) {
            var tree = forest[j];
            if (incompleteNodes) {
                tree.children.push.apply(tree.children, incompleteNodes);
            }
            parses.push(tree);
        }
    }
    return parses;
}


EarleyParser.prototype.parseForest = function(rootState) {
    var forest = [];
    forest.push(this.walk(rootState));

    while (this.todo.length > 0) {

	// Fix this discrepancy
	var rootCopy = jQuery.extend(true, {}, forest[0]);

	var todo = this.todo.pop();
	var nodeIdx = todo.idx;
	var symbols = todo.symbols;

	// find element to change.
	var stack = [];
	stack.push(rootCopy);
	while (stack.length > 0) {
	    var node = stack.pop();
	    if (node.idx === nodeIdx) {
		break;
	    }
	    if (typeof node.children !== 'undefined') {
		for (var i = 0; i < node.children.length; i++) {
		    var child = node.children[i];
		    stack.push(child);
		}
	    }
	}

	node.children = this.finishWalk(symbols);
	forest.push(rootCopy);
    }
    return forest;
};


EarleyParser.prototype.walk = function(state) {

    var agenda = this.agenda;
    
    if (state.rhs.length === 1 &&
	$.inArray(state.rhs[0], this.words) !== -1) {
	return {name:state.lhs, children: [ {name: state.rhs[0]} ] };
    }
    
    var node = { name:state.lhs, children:[], idx: length++};
    
    var rhsStates = state.rhs.map(function (symbol) {return agenda[symbol]});
    var parseCandidates = cartesianProductOf.apply(this, rhsStates);
    var validCombinations = filterValidCombinations(state, parseCandidates);

    for (var i = 0; i < validCombinations.length; i++) {
	var validCombination = validCombinations[i];
	if (i === 0) {
	    for (var i2 = 0; i2 < validCombination.length; i2++) {
		var symbol = validCombination[i2];
		node.children.push(this.walk(symbol));
	    }
	} else {
	    this.todo.push({idx:node.idx, symbols:validCombination});
	}
    }
    return node;


};

EarleyParser.prototype.finishWalk = function(validCombination) {
    var parser = this;
    return validCombination.map(function (symbol) {return parser.walk(symbol)});
};


function filterValidCombinations (state, combinations) {
    return combinations.filter(function(c) {return isValidCombination(c, state)});
}

function isValidCombination(combination, state) {
    var currentPos = state.start;
    for (var i2 = 0; i2 < combination.length; i2++) {
	var subState = combination[i2];
	if (subState.start === currentPos) {
	    if (subState.idx === state.idx) {
		return false;
	    }
	    currentPos = subState.end;
	} else {
	    return false;
	}
    }
    return state.end == currentPos;

}


function cartesianProductOf() {
    return _.reduce(arguments, function(a, b) {
        return _.flatten(_.map(a, function(x) {
	    return _.map(b, function(y) {
                return x.concat([y]);
	    });
        }), true);
    }, [ [] ]);
}
