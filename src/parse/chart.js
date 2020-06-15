function Chart(words, startCat) {

    this.startCat = startCat;
    this.words = words;
    this.length = 0;

    this.agenda = {};


    this._hashValues = new Set();
    this.states = Array(words.length + 1);
    for (var i = 0; i < this.states.length; i++) {
	this.states[i] = [];
    }

    this.add = function(s, i) {
	if (!this._hashValues.has(s._hash)) {
	    this._hashValues.add(s._hash);
	    this.states[i].push(s);
	    s.entryIdx = i;
	    s.stateIdx = this.states[i].length;
	    s.idx = this.length++;

	    if (s.dot === s.rhs.length) {
		if (s.lhs in this.agenda) {
		    this.agenda[s.lhs].push(s);
		} else {
		    this.agenda[s.lhs] = [s];
		}
	    }

	}
    };

    this.prettyPrint = function() {
	for (var i = 0; i < this.states.length; i++) {
	    for (var i2 = 0; i2 < this.states[i].length; i2++) {
		console.log(this.states[i][i2].prettyPrint());
	    }
	}
    };
}

function State(lhs, rhs, dot, start, end, func) {

    this.lhs = lhs;
    this.rhs = rhs;
    this.dot = dot;
    this.start = start;
    this.end = end;
    this.nextCat = this.rhs[dot];
    this.func = func;
    this._hash = lhs + "->" + rhs + dot + start + end;
    this.isIncomplete = !(rhs.length === dot);

    this.prettyPrint = function() {
	var rhs = this.rhs.slice();
	rhs.splice(this.dot, 0, '.');
	return "s" + this.idx + " " + this.lhs + " -> " +
	    rhs.join(" ") + " [" + this.start + ", " + this.end + "] " + this.func;
    };
}
