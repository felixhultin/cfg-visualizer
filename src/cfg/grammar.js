var Rule = Backbone.Model.extend({
});


var Grammar = Backbone.Collection.extend({
    model: Rule,

    startCat : function() {
        return this.models[0].get('lhs');
    },

    isTerminal: function() {

    },

    isPartOfSpeech: function(cat) {
        var catRules = this.where({lhs:cat});
        if (catRules.length == 0) {
            return false;
        }
        for (var i = 0; i < catRules.length; i++) {
            var catRule = catRules[i];
            if (catRule.get('isPos') != true) {
                return false;
            }
        }
        return true;
    }

});


