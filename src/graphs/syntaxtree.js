// Borrowed from stackoverflow...

var line = d3.svg.line()
    .x( function(point) { return point.lx; })
    .y( function(point) { return point.ly; });

function lineData (d) {
    var points = [
        {lx: d.source.x, ly: d.source.y},
        {lx: d.target.x, ly: d.target.y}
    ];
    return line(points);
};

var i = 0;

// End of Stackoverflow ...

var SyntaxTree = Backbone.View.extend({

    activeTreeIdx: 0,

    events: {
        'click button#left': 'leftButtonClicked',
        'click button#right': 'rightButtonClicked'
    },

    rightButtonClicked : function() {
        if (this.activeTreeIdx < this.forest.length - 1) {
            this.activeTreeIdx++;
        } else {
            this.activeTreeIdx = 0;
        }
        this.render();
    },

    leftButtonClicked : function() {
        if (this.activeTreeIdx > 0) {
            this.activeTreeIdx--;
        } else {
            this.activeTreeIdx = this.forest.length - 1;
        }
        this.render();
    },

    initialize: function() {
        // TODO: Implement more flexible margins.
        this.margin = {top: 20, right: 10, bottom: 20, left: 10};
        var margin = this.margin,
            height = this.$el.height() - margin.top - margin.bottom,
            width =  this.$el.width() - margin.right - margin.left;

        this.width = width;
        this.height = height;

        this.i = 0;
        this.duration = 750;
        this.root;

        this.tree = d3.layout.tree()
            .size([height, width]);

        this.svg = d3.select(this.el).append("svg")
            .attr('id', 'syntaxtree')
            .attr("width", width + margin.right + margin.left)
            .attr("height", height + margin.top + margin.bottom)
            .attr("viewBox", "0 0 " +  width + " " + height)
            .attr("preserveAspectRatio", "xMinYMid meet");

        // Taken from:
        // http://stackoverflow.com/questions/9400615/
        // whats-the-best-way-to-make-a-d3-js-visualisation-layout-responsive

        var chart = $("svg#syntaxtree"),
            aspect = chart.width() / chart.height(),
            container = chart.parent();
    },

    render: function(forest) {

        if (typeof forest !== 'undefined') {
            this.activeTreeIdx = 0;
            this.forest = forest;
            d3.select(this.el).select("#changeTree").style("display", "block");
        }

        if (this.forest.length === 0 ) {
            this.svg.selectAll("*").remove();
            d3.select(this.el).select("#changeTree").style("display", "none");
            return this;

        }
        var n = this.activeTreeIdx + 1;
        this.$el.find("#changeTree span").text("(" + n + "/" + this.forest.length + ")");

        var parseTree = this.forest[this.activeTreeIdx];
        var margin = this.margin;

        this.root = parseTree;
        this.update(this.root);

        return this;
    },

    update: function (source) {

        var view = this;

        // Compute the new tree layout.
        var nodes = this.tree.nodes(source).reverse(),
            links = this.tree.links(nodes);

        var width = this.$el.width() - source.x;

        var proportions = getProportions(nodes);
        var edgeLength = (this.height - this.margin.bottom) / proportions.depth;
        this.tree.separation(function (a,b) {return a.name.length > b.name.length ? a.name.length+2 : b.name.length+2 });

        // Normalize for fixed-depth.
        nodes.forEach(function(d) { d.y = d.depth * edgeLength;
                                    d.x = d.x + ( width / 3);
                                    d.y = d.y + 5;
                                  });

        // Update the nodes…
        var node = this.svg.selectAll("g.node")
            .data(nodes, function(d) { return d.id || (d.id = ++i); });

        // Enter any new nodes at the parent's previous position.
        var nodeEnter = node.enter().append("g")
            .attr("class", "node")
            .attr("transform", function(d) {
                return "translate(" + source.y + "," + source.x + ")"; });
            //.on("click", function(d) {view.click(d); view.update(d)});

        nodeEnter.append("circle")
            .attr("r", 13);
            //.style("fill", "white");;

        nodeEnter.append("text")
                .attr("dy", ".35em")
                .attr("text-anchor", "middle")
                .text(function(d) {
                if (d.name.length > 7 && d.hasOwnProperty('children')) {
                    return d.name.slice(0,3) + "...";
                }
                return d.name; });


        // Transition nodes to their new position.
        var nodeUpdate = node//.transition()
            .attr("transform",
                  function(d) { return "translate(" + d.x + "," + d.y + ")"; });

        nodeUpdate.select("text")
            .style("fill-opacity", 1);

        // Transition exiting nodes to the parent's new position.
        var nodeExit = node.exit()
            //.transition()
            //.duration(this.duration)
            .attr("transform",
                  function(d)
                  {return "translate(" + source.x + "," + source.y + ")";})
            .remove();

        nodeExit.select("text")
            .style("fill-opacity", 1e-6);

        // Update the links…
        var link = this.svg.selectAll("path.link")
            .data(links, function(d) { return d.target.id; });

        // Starts drawing here...
        // Enter any new links at the parent's previous position.
        link.enter().insert("path", "g")
            .attr("class", "link")
            .attr("stroke-dasharray",
                  function(d) {return d.target.isIncomplete ? "5,2" : "0,0"})
            .attr("d", lineData);

        // Transition links to their new position.
        link//.transition()
        //.duration(duration)
            .attr("d", lineData);

        // Transition exiting nodes to the parent's new position.
        link.exit()//.transition()
        //.duration(duration)
            .attr("d", lineData)
            .remove();

        // Stash the old positions for transition.
        nodes.forEach(function(d) {
            d.x0 = d.x;
            d.y0 = d.y;
        });

        function getProportions(nodes) {
            var proportions = {depth:0, breadth:0};
            var levels = {};
            for (var i = 0; i < nodes.length; i++) {
                var node = nodes[i];
                if (node.depth > proportions.depth) {
                    proportions.depth = node.depth;
                }
                if (node.depth in levels) {
                    levels[node.depth] += node.name.length;
                }
                else {
                    levels[node.depth] = node.name.length;
                }
                if (levels[node.depth] > proportions.breadth) {
                    proportions.breadth = levels[node.depth];
                }
            }
            return proportions;
        }
    },

    // Toggle children on click.
    click: function(d) {
        if (d.children) {
            d._children = d.children;
            d.children = null;
        } else {
            d.children = d._children;
            d._children = null;
        }
    }
});
