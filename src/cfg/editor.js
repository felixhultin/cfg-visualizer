var Editor = Backbone.View.extend({

    events: {
        "keyup" : "textChange"
    },

    words : new Set(),

    initialize : function() {
        var result = tokenize(this.$el.val());
        this.collection.add(result.rules);
    },

    textChange : function(e) {
        var that = this;
        var c = this.collection;
        delay(function(){
            var result = tokenize(that.$el.val());
            if (result.errors.length > 0) {
                // Implement later...
                c.reset();
                that.$el.css('background-color', '#FFCCBA');
                console.log("Errors found in CFG");
            } else {
                that.$el.css('background-color', 'white');
                c.reset();
                c.add(result.rules);
                that.words = result.words;
            }
        }, 1000 );
    },

    hasWord : function(word) {
        return words.has(word);
    }

});


function randomValueOf(array) {
    return array[Math.floor(Math.random() * array.length)];
}


var delay = (function(){
  var timer = 0;
  return function(callback, ms){
    clearTimeout (timer);
    timer = setTimeout(callback, ms);
  };
})();


function tokenize(text) {
    var lines = text.split('\n');
    var result = { errors: [], rules: [] };

    var nonTerminals = new Set();
    var terminals = new Set();
    for (var i = 0; i < lines.length; i++) {
        var line = lines[i];
        if (!(/\S/.test(line))) {
            continue;
        }
        var rule = createRule(line, i);

        if (typeof rule === 'string') {
            var error = {message: rule, row: i};
            result.errors.push(error);
            continue;
        }

        nonTerminals.add(rule.lhs);
        terminals.delete(rule.lhs);

        for (var i2 = 0; i2 < rule.rhs.length; i2++) {
            var symbol = rule.rhs[i2];
            if (!nonTerminals.has(symbol)) {
                terminals.add(symbol);
            }
        }

        result.rules.push(rule);
    }

    for (var i = 0; i < result.rules.length; i++) {
        var rule = result.rules[i];
        rule.isPos = true;
        for (var i2 = 0; i2 < rule.rhs.length; i2++) {
            var symbol = rule.rhs[i2];
            if (nonTerminals.has(symbol)) {
                rule.isPos = false;
            }
        }
    }

    result.words = terminals;
    return result;
}


function createRule(line, row) {
    var parts = line.split('->');
    if (parts.length < 2) {
        return "Arrow missed (->)";
    }

    var lhs = parts[0].trim();
    if (lhs.split(/\s+/).length > 1) {
        return "Multiple symbols on left-hand side is not allowed.";
    }

    var rhs = parts[1].trim().split(/[\s\|]+/);

    return {'lhs':lhs, 'rhs':rhs, 'id': row};   
}
