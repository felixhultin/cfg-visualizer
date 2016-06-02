var lolText = 'S -> NP VP\n' +
    'S -> Aux NP VP\n' +
    'S -> VP\n' + 
    'NP -> Pronoun\n'+ 
    'NP -> Proper-Noun\n'+ 
    'NP -> Det Nominal\n'+
    'Nominal -> Noun\n'+
    'Nominal -> Nominal Noun\n'+
    'Nominal -> Nominal PP\n'+
    'VP -> Verb\n'+
    'VP -> Verb NP\n'+
    'VP -> Verb NP PP\n'+
    'VP -> Verb PP\n'+
    'VP -> VP PP\n'+
    'PP -> Preposition NP\n'+
    '\n' +
    'Det -> that | this | the | a\n' +
    'Noun -> book | flight | meal | money\n'+
    'Verb -> book | include | prefer\n' +
    'Pronoun -> I | she | me\n' +
    'Proper-Noun -> Houston | NWA\n' +
    'Aux -> does\n' +
    'Preposition -> from | to | on | near | through';

var lolText = 'S -> NP VP\n' + 
    'NP -> Det N\n' +
    'NP -> Det A N\n' + 
    'VP -> V\n' + 
    'VP -> V NP\n'+ 

    'Det -> the\n' + 
    'N -> old | man | ships\n'+
    'V -> man | ships\n'+
    'A -> old\n';

var lolText = 'S -> NP VP\n'+
    'PP -> P NP\n' +
    'NP -> Det N\n' +
    'NP -> Det N PP\n' +
    'NP -> Pronoun\n' +
    'VP -> V NP\n' +
    'VP -> VP PP\n' +
    '\n' +
    'Pronoun -> I\n' +
    'Det -> an | my\n' +
    'N -> elephant | pajamas\n' +
    'V -> shot\n' +
    'P -> in\n';

d3.select("div#parent div#editor textarea").text(lolText);


var grammar = new Grammar();
var editor = new Editor({ el: "div#editor textarea", collection: grammar});
var graph = new Graph({el: "div#parent div#graphs"});
var sentenceParser = new SentenceParser({
    el: "div#editor div#sentenceParser",
    collection: grammar,
    graph: graph});

