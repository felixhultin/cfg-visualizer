var TraceTree = Backbone.View.extend({

    events: {
        'click [type="checkbox"]': 'clicked',
    },

    activeCheckbox : $('input#active[type="checkbox"]'),
    inactiveCheckbox : $('input#inactive[type="checkbox"]'),


    clicked: function (e) {
        this.render(this.chart);
    }, 

    initialize: function(options) {

        this.syntaxTree = options.syntaxTree;

        this.margin = {top: 20, right: 50, bottom: 10, left: 50};
        this.height = this.$el.height() - this.margin.top - this.margin.bottom;
        this.width =  this.$el.width() - this.margin.right - this.margin.left;

        this.svg = d3.select(this.el).append('svg')
            .attr('width', this.width)
            .attr('height', this.height);

        this.force = d3.layout.force()
            .size([this.width, this.height]);
    },

    render: function(chart) {

        d3.select(this.el).select("div#options").style("display", "block");

        d3.select(this.el).on("click", click_canvas);

        this.svg.selectAll("*").remove();
        this.chart = chart;

        var margin = this.margin,
            width = this.width,
            height = this.height;

        var syntaxTree = this.syntaxTree,
            forest = this.syntaxTree.forest;

        var output = createLinks(chart);

        var links = output.links;
        var maxLevel = output.maxLevel !== 0 ? output.maxLevel : 1;
        var minLevel = 4;

        var labelHeight = 19, // TODO: Bind to font-size.
            labelsHeight = minLevel * labelHeight;

        var linkHeight = (height - margin.top - margin.bottom - labelsHeight) / maxLevel;

        var nodeDistance = width / (chart.words.length + 1),
            nodesHeight = height - labelsHeight;

        var nodes = [];
        for (var i = 0; i < chart.words.length + 1; i++) {
            var node = {x: this.margin.right + nodeDistance * i, y: nodesHeight};
            nodes.push(node);
        }

        var that = this;
        var link = this.svg.selectAll(".link")
            .data(links)
            .enter()
            .append("g")
            .attr("class", "link")
            .attr("visibility", function(d) {
                if (!that.activeCheckbox.is(":checked")&& d.isActive) {
                    return "hidden";
                }
                if (!that.inactiveCheckbox.is(":checked") && !d.isActive) {
                    return "hidden";
                }
                return "visible";
            });

        link.append("text")
            .attr("font-size", 12)
            .attr("font-style", "sans-serif")
            .attr("transform", function(d, i) {
                var source = nodes[d.source];
                var target = nodes[d.target];
                if (d.source === d.target) {
                    return "translate(" +
                        source.x + "," +
                        (source.y + labelHeight + (labelHeight * d.height))
                        + ")";
                }
                var elbowHeight = d.height * linkHeight;
                return "translate(" +
                    ((source.x + target.x)/2) + "," +
                    (source.y - elbowHeight) + ")";
            })
            .attr("text-anchor", "middle")
            .text(function(d) {
                return d.height === 3 && d.source === d.target ? "..." : d.name;
            })
            .on("click", click_link);

        link.filter(function(d) {
                return d.source !== d.target})
            .append("path")
            .attr("class", "link")
            .attr("d", elbow)
            .attr("stroke-dasharray",
                  function(d) {return d.isActive ? "5,2": "0,0"}) 
            .attr("fill", "none");

        var node = this.svg.selectAll("node")
            .data(nodes)
            .enter()
            .append("g")
            .attr("class", "link");

        node.append("circle")
            .attr("class", "state")
            .attr("cx", function(d) {
                return d.x
            })
            .attr("cy", function(d) {
                return d.y
            })
            .attr("r", labelHeight);

        node.append("text")
            .attr("text-anchor", "middle")
            .attr("fill", "black")
            .style("font", "12px")
            .attr("x", function(d) { return d.x; })
            .attr("y", function(d) { return d.y + (labelHeight / 4); })
            .text(function(d, i) {return i+1;});


        function createLinks(chart) {

            var wordLinks = chart.words.map(function(w, i) {
                return {source: i, target: i+1, name: w, height: 0, isWord: true};
            });

            var nodeHeights = Array.apply(null, Array(chart.words.length + 1))
                .map(function(e) {return {height: 0, depth: 0}});

            var mergedStates = [].concat.apply([], chart.states);
            mergedStates.shift(); // Removes dummy state.

            var stateLinks = mergedStates.map(function(s) {
                if (s.start ===  s.end) {
                    var height = ++nodeHeights[s.end].depth;
                } else {
                    var height = ++nodeHeights[s.end].height;
                    if ( (s.end - s.start) > 1 ) {
                        for (var i = s.start+1; i < s.end; i++) {
                            if (nodeHeights[i].height >= height) {
                                nodeHeights[i].height += 1;
                                height = nodeHeights[i].height;
                            }
                        }
                        nodeHeights[s.end].height = height;
                    }
                }

                var link = { source: s.start,
                             target: s.end,
                             name: s.lhs + s.idx,
                             state: s,
                             isActive: s.isIncomplete,
                             height: height,
                           };
                return link;
            });

            return { links: wordLinks.concat(stateLinks),
                     maxLevel: Math.max.apply(Math, nodeHeights.map(function(o){return o.height})) 
                   };
        };

        function highlight(link) {
            d3.selectAll(".highlight").classed('highlight', false);
            if (link) {
                d3.select(link).classed('highlight', true);
            }
        }

        function click_link(d) {
            highlight(d3.event.target.parentNode);
            var earleyParser = new EarleyParser(chart);
            var dForest = earleyParser.parse(d.state);
            syntaxTree.render(dForest);
            d3.event.stopPropagation();
        }

        function click_canvas(d) {
            highlight();
            syntaxTree.render(forest);
        }

        function elbow(d, i) {
            var shift = 20;
            var source = nodes[d.source];
            var target = nodes[d.target];
            var elbowHeight = d.height * linkHeight;
            var labelWidth = (this.previousSibling.getComputedTextLength() / 2) + 2;
            return "M" + source.x + "," + source.y
                + "L" + (source.x + shift) + "," + (source.y - elbowHeight)
                + "H" + ( ( (source.x + target.x)/2) - labelWidth)
                + "M" + ( ( (source.x + target.x)/2) + labelWidth) + "," + (source.y - elbowHeight)
                + "H" + (target.x - shift)
                + "L" + target.x + "," + target.y;
        }

        return this;
    }

});
