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

	var margin = {top: 20, right: 50, bottom: 10, left: 50};
	this.margin = margin;
	this.height = this.$el.height() - margin.top - margin.bottom;
	this.width =  this.$el.width() - margin.right - margin.left;

	this.svg = d3.select(this.el).append('svg')
	    .attr('width', this.width)
	    .attr('height', this.height);

	this.force = d3.layout.force()
	    .size([this.width, this.height]);	
    },

    render: function(chart) {

	d3.select(this.el).select("div#options").style("display", "block");

	this.chart = chart;
	var chart = chart;
	
	this.svg.selectAll("*").remove();

	var syntaxTree = this.syntaxTree;
	var forest = this.syntaxTree.forest;
	
	var margin = this.margin;
	var width = this.width;
	var height = this.height;
	
	var isActiveChecked = this.activeCheckbox.is(":checked");
	var isInactiveChecked = this.inactiveCheckbox.is(":checked");
	
	var output = createLinks(chart, isActiveChecked, isInactiveChecked);
	
	var links = output.links;
	var maxLinkLevel = output.maxLevel;
	var minLinkLevel = 4;

	var labelHeight = 19; // TODO: Bind to font-size.
	var labelsHeight = minLinkLevel * labelHeight;
	
	var linkHeight = (height - margin.top - margin.bottom - labelsHeight) / maxLinkLevel;
	
	var nodeDistance = width / (chart.words.length + 1);
	var nodesHeight = height - labelsHeight;
	
	var nodes = [];
	for (var i = 0; i < chart.words.length + 1; i++) {
	    var node = {x: this.margin.right + nodeDistance * i, y: nodesHeight};
	    nodes.push(node);
	}
	
	var link = this.svg.selectAll(".link")
	    .data(links)
	    .enter()
	    .append("g")
	    .attr("class", "link");
	
	link.append("text")
	    .filter(function (d) {return d.height < 4 || d.source !== d.end; })
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
	    .on("mouseover", mouseover)
	    .on("mouseout", function(d) {
		syntaxTree.render(forest);
	    });
	
	var spanningLinks = link
	    .filter(function(d) {return d.source !== d.target});

	spanningLinks.append("path")
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


	function createLinks(chart, isActiveChecked, isInactiveChecked) {

	    var wordLinks = chart.words.map(function(w, i) {
		return {source: i, target: i+1, name: w, height: 0, isWord: true};
	    });
	    
	    var nodeHeights = Array.apply(null, Array(chart.words.length + 1))
		.map(Number.prototype.valueOf, 1);
	    var idNodeHeights = Array.apply(null, Array(chart.words.length + 1))
		.map(Number.prototype.valueOf, 1);

	    var newidNodeHeights = Array.apply(null, Array(chart.words.length + 1))
		.map(function(e) {return Array.apply(null, Array(chart.words.length + 1))
				  .map(Number.prototype.valueOf, 0);});
	    var maxLevel = 0;
	    
	    
	    var mergedStates = [].concat.apply([], chart.states);
	    mergedStates.shift(); // Removes dummy state.
	    if (!isActiveChecked || !isInactiveChecked) {
		mergedStates = filterStates(mergedStates, isActiveChecked, isInactiveChecked);
	    }
	    
	    var stateLinks = mergedStates.map(function(s) {
		//var height = s.start === s.end ? idNodeHeights[s.end]++ : nodeHeights[s.start]++;

		var currentHeight = newidNodeHeights[s.start][s.end];		
		for (var i = s.start; i < s.end + 1; i++) {
		    for (var i2 = i+1; i2 < s.end+1; i2++) {
			var possibleHeight = newidNodeHeights[i][i2];
			if (possibleHeight >= currentHeight) {
			    currentHeight = possibleHeight;
			}
		    }
		}
		
		currentHeight++;
		if (currentHeight > newidNodeHeights[s.start][s.end]) {
		    newidNodeHeights[s.start][s.end] = currentHeight; 
		}
		maxLevel = currentHeight > maxLevel ? currentHeight : maxLevel;


		
		var link = { source: s.start,
			     target: s.end,
			     name: s.lhs + s.idx,
			     state: s,
			     isActive: s.rhs.length !== s.dot,
			     height: currentHeight
			     //height: height
			   };
		return link;
	    });
	    
	    return {links: wordLinks.concat(stateLinks),
		    //maxLevel: Math.max.apply(Math, nodeHeights),
		    maxLevel: maxLevel,
		    minLevel: Math.max.apply(Math, idNodeHeights)};
	};		

	function filterStates(states, isActive, isInactive) {
	    if(!isActive) {
		states = states.filter(function(s) {return s.isIncomplete});
	    }
	    if(!isInactive) {
		states = states.filter(function(s) {return !s.isIncomplete});
	    }
	    return states;
	} 
	
	function mouseover(d) {
	    var parseTree = earleyWalk(d.state);
	    if (d.state.isIncomplete) {
		var incompleteNodes = d.state.rhs
		    .slice(d.state.dot)
		    .map(function(name) {
			return {name: name, isIncomplete:true};
		    });
		parseTree.children = parseTree.children.concat(incompleteNodes);
	    }
	    syntaxTree.render([parseTree]);
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
	
    },

});
