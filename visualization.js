'use strict';

//the SVG element to add visual content to
var svg = d3.select('#visContainer')
	.append('svg')
	.attr('height', 480)
	.attr('width', 1100)
	.style('border', '1px solid gray');

var MARGIN_SIZE = {
	//left: 70,
	left: 70,
	bottom: 70,
	top: 50,
	right: 120
}

//Use the SVG_SIZE and MARGIN_SIZE values to calculate the `width` and `height` 
//of the displayable area of the plot (where the circles will go)
var displayWidth = parseFloat(svg.attr('width')) - MARGIN_SIZE.left - MARGIN_SIZE.right;
var displayHeight = parseFloat(svg.attr('height')) - MARGIN_SIZE.bottom - MARGIN_SIZE.top;

var plot = svg.append('g')
	.attr('transform', 'translate(' + MARGIN_SIZE.left + ', ' + MARGIN_SIZE.top + ')')
	.attr('width', displayWidth)
	.attr('height', displayHeight)
	.attr("class", "areaClass");

var data;

var color = d3.scaleOrdinal().range(["#3366cc", "#dc3912", "#ff9900", "#109618", "#990099", "#0099c6",
	"#dd4477", "#66aa00", "#b82e2e", "#316395", "#994499"]);

var circleOpacity = '0.65';
var circleOpacityOnLineHover = "0.25"
var circleRadius = 3;
var circleRadiusHover = 9;
var duration = 250;

var lineOpacity = "0.5";
var lineOpacityHover = "0.95";
var otherLinesOpacityHover = "0.05";
var lineStroke = "2px";
var lineStrokeHover = "5px";

// add title and names
function addPreliminaries() {
	// Title
	d3.select('h1').text('Global Population over the years - 1960-2020');
	d3.select('head').select('title').text('Global Population over the years')
}

//format data
function formatData(data, ycolumn) {
	var minX = d3.min(data, function (d) { return d.year });
	var maxX = d3.max(data, function (d) { return d.year });
	var areaData = []
	data.forEach(function (row, index) {
		var i = parseInt(index / (maxX - minX + 1))

		if (index % (maxX - minX + 1) == 0) {
			//list_of_countries.push(row["region"])
			var singleLineData = { "region": "", "values": [] }
			singleLineData["region"] = row["region"];
			singleLineData["values"].push({ "year": +row["year"], "totalPopulation": +row[ycolumn], "region": row["region"] });
			areaData.push(singleLineData)
		} else {
			areaData[i]["values"].push({ "year": +row["year"], "totalPopulation": +row[ycolumn], "region": row["region"] });
		}
	});
	return areaData
}

// update function to enter and exit elements for interactions
function update(data, xScale, yScale, ycolumn = "totalPopulation", filter = false) {


	//create data structure to use for interactions
	var areaData = formatData(data, ycolumn)

	//console.log(areaData)

	//join areas with the loaded data
	var lines = plot.selectAll('path').data(areaData);

	var lineFunction = d3.line()
		.curve(d3.curveBasis)
		.x(function (d, i) { return xScale(d.year); })
		.y(function (d) {
			return yScale(d.totalPopulation);
		});

	// merge entering elements
	var present = lines.enter().append("path").attr('class', 'line')
		.style('opacity', lineOpacity)
		.attr("stroke-width", lineStroke)
		.merge(lines);

	// add transition and attributes
	present.transition().duration(250)
		.attr("d", function (d) { return lineFunction(d.values) })
		.style("fill", "none")
		.attr("stroke", function (d, i) {
			return color(d.region);
		});

	present.append('title').text(function (d) {
		return ('Region: ' + d.region)
	});


	if (filter == false) {
		present.style('opacity', lineOpacity)
			.on("mouseover", function (d) {
				d3.selectAll('.line')
					.style('opacity', otherLinesOpacityHover);
				d3.selectAll('.circle')
					.style('opacity', circleOpacityOnLineHover);
				d3.select(this)
					.style('opacity', lineOpacity)
					.style("stroke-width", lineStrokeHover)
					.style("cursor", "pointer");
			})
			.on("mouseout", function (d) {
				d3.selectAll(".line")
					.style('opacity', lineOpacity);
				d3.selectAll('.circle')
					.style('opacity', circleOpacity);
				d3.select(this)
					.style("stroke-width", lineStroke)
					.style("cursor", "none");
			});
	}




	//	if (filter == false) {
	present.on("click", function (d) {
		// update data for clicked element
		var filteredData = data.filter(function (row) {
			return (row.region == d.region);
		});
		console.log(filteredData)
		var scale = createScale(filteredData, false, ycolumn);
		var xScale = scale[0];
		var yScale = scale[1];

		d3.select('#region').property('value', filteredData[0]["region"])

		drawAxis(xScale, yScale);
		update(filteredData, xScale, yScale, ycolumn, true);

		// d3.selectAll('.circle')
		// 	.style('opacity', 0);
		d3.select(this)
			.style('opacity', lineOpacity)
			.style("stroke-width", lineStrokeHover)
			.style("cursor", "pointer");

		d3.select('.line').select('title').text('Region: ' + filteredData[0]["region"]);

		// circle start
		createCircles(formatData(filteredData, ycolumn), xScale, yScale, ycolumn)
		// circle end
	});
	//	}


	if (filter == true) {
		present.style('opacity', lineOpacityHover)
			.on("mouseover", function (d) {
				//if (filter == true) {
				// d3.selectAll('.path')
				// 	.style('opacity', otherLinesOpacityHover);
				// d3.selectAll('.circle')
				// 	.style('opacity', circleOpacityOnLineHover);
				d3.select(this)
					.style('opacity', lineOpacityHover)
					.style("stroke-width", lineStroke)
					.style("cursor", "pointer");
				//}
			})
			.on("mouseout", function (d) {
				//if (filter == true) {
				d3.selectAll(".path")
					.style('opacity', lineOpacity);
				// d3.selectAll('.circle')
				// 	.style('opacity', 0);
				d3.select(this)
					.style("stroke-width", lineStroke)
					.style("cursor", "none");
				//}
			});
	}


	lines.exit().remove();
	plot.selectAll("circle").exit().remove()
	//addLegend(color);

}

// create scale for x and y values
function createScale(data, islog, ycolumn = "totalPopulation") {
	// Maximum and minimum values of X and Y axes
	var minX = d3.min(data, function (d) { return d.year });
	var maxX = d3.max(data, function (d) { return d.year })

	// extract minimum value of y
	var minY = d3.min(data, function (d) { return d[ycolumn] });
	// get maximum value of y
	var maxY = d3.max(data, function (d) { return d[ycolumn] });

	// scale for x values
	var xScale = d3.scaleLinear()
		.domain([minX, maxX])
		.range([0, displayWidth]);

	// scale for y values
	var yScale;
	if (islog == true) {
		yScale = d3.scaleLog()
			.domain([minY, maxY])
			.range([displayHeight, 0]);
	} else {
		yScale = d3.scaleLinear()
			.domain([minY * 0.9, maxY])
			.range([displayHeight, 0]);
	}

	return [xScale, yScale]
}

// create axis based on x and y scaling
function drawAxis(xScale, yScale) {

	// create x axis
	var xAxis = d3.axisBottom(xScale).ticks(10, '.0f');

	var x = svg.selectAll(".x")
		.data(["dummy"]);

	var newX = x.enter().append("g")
		.attr("class", "x axis")
		.attr("transform", "translate(" + [MARGIN_SIZE.left, displayHeight + MARGIN_SIZE.top] + ")");

	x.merge(newX).call(xAxis);
	x.exit().remove();

	// Use a modified SI formatter that uses "B" for Billion.
	var siFormat = d3.format("s");
	var customTickFormat = function (d) {
		return siFormat(d).replace("G", "B");
	};

	// create y axis
	var yAxis = d3.axisLeft(yScale).ticks(3, '.0f').tickFormat(d3.format('.1s'));

	var y = svg.selectAll(".y")
		.data(["dummy"]);

	var newY = y.enter().append("g")
		.attr("class", "y axis")
		.attr("transform", "translate(" + [MARGIN_SIZE.left, MARGIN_SIZE.top] + ")");

	y.merge(newY).call(yAxis);
	y.exit().remove();

	// x axis and y axis labels
	svg.append('text')
		.text('Year')
		.attr('transform', 'translate(' + (MARGIN_SIZE.left + displayWidth / 2.3) + ',' + (displayHeight + MARGIN_SIZE.top + 40) + ')');
	svg.append('text')
		.text('Population')
		.attr('transform', 'translate(' + (MARGIN_SIZE.left - 40) + ',' + (MARGIN_SIZE.top + 2 * displayHeight / 3.3 + 40) + ') rotate(-90)');

}

// fetch, filter and sort data
async function createplot() {
	addPreliminaries();

	// DATA PREPARATION
	data = await d3.csv('data/region_pop.csv', function (row) {
		return {
			region: row['Region'],
			year: +row['Year'],
			totalPopulation: +row['TotalPopulation'],
			malePopulation: +row['MalePopulation'],
			femalePopulation: +row['FemalePopulation'],
			malePercentage: +row['MalePercentage'],
			femalePercentage: +row['FemalePercentage'],
		}
	});


	// filter out columns having empty values
	data = data.filter(function (row) {
		var toRemove = data.columns.some(function (col) {
			return row[col] == ''
		});
		return (toRemove != true);
	});


	//sort data on the basis of population
	data.sort(function (a, b) {
		return d3.ascending(+a.region, +b.region);
	});

	// filtering data for Total population of all countries
	// var totalData = data.filter(function (row) {
	// 	return (row.seriesCode == 'SP.POP.TOTL');
	// });
	// console.log(totalData.length);

	var scale = createScale(data, true);
	var xScale = scale[0];
	var yScale = scale[1];
	drawAxis(xScale, yScale);

	update(data, xScale, yScale);
	addLegend(color);
}

// Submit button functionality
d3.select('#submit').on('click', function () {
	var region = d3.select('#region').property('value');
	var gender = d3.selectAll("input[name='gender']:checked").property('value');
	var ycolumn, islog = false;
	if (gender === 'male') {
		ycolumn = 'malePopulation'
	} else if (gender === 'female') {
		ycolumn = 'femalePopulation'
	} else {
		ycolumn = 'totalPopulation';
	}

	var filteredData = data.filter(function (row) {
		return (row.region.toLowerCase() === region.toLowerCase());
	});

	var scale = createScale(filteredData, islog, ycolumn);
	var xScale = scale[0];
	var yScale = scale[1];
	drawAxis(xScale, yScale);
	update(filteredData, xScale, yScale, ycolumn);
	//addLegend(color);

});

// Radio button functionality
d3.selectAll("input[name='gender']").on("change", function () {
	var gender = this.value;
	var region = d3.select('#region').property('value');
	var ycolumn, islog;
	if (gender === 'male') {
		ycolumn = 'malePopulation'
		//islog = false;
	} else if (gender === 'female') {
		ycolumn = 'femalePopulation'
		//islog = false;
	} else {
		ycolumn = 'totalPopulation';
	}

	if (region == "") {
		islog = true;
	} else {
		islog = false;
	}
	// filtering data for Total population of all males
	if (region != "") {
		data = data.filter(function (row) {
			return (row.region.toLowerCase() == region.toLowerCase());
		});
	}

	var scale = createScale(data, islog, ycolumn);
	var xScale = scale[0];
	var yScale = scale[1];
	drawAxis(xScale, yScale);
	update(data, xScale, yScale, ycolumn = ycolumn);
});

// create legend
function addLegend(color) {
	var legendRectSize = 18;
	var legendSpacing = 4;
	var lineOpacity = 0.5

	var legendHolder = svg.append('g')
		// translate the holder to the right side of the graph
		.attr('transform', "translate(" + (MARGIN_SIZE.left + displayWidth + 10) + ",0)");

	var legend = legendHolder.selectAll('.legend')
		.data(color.domain());

	var present = legend.enter()
		.append('g')
		.attr('class', 'legend')
		.style('font-size', '8px')
		.attr('transform', function (d, i) {
			return "translate(0," + i * 20 + ")";
		}).merge(legend);

	present.append('rect')
		.attr('width', legendRectSize)
		.attr('height', legendRectSize)
		.style('fill', color)
		.style('stroke', color)
		.style('opacity', lineOpacity);

	present.append('text')
		.attr('x', legendRectSize + legendSpacing)
		.attr('y', legendRectSize - legendSpacing)
		.text(function (d) { return d; });

	legend.exit().remove();

	present.on("click", function (type) {
		// dim all of the icons in legend
		d3.selectAll(".circle").style("opacity", 0);
		d3.selectAll(".legend")
			.style("opacity", 0.1);
		// make the one selected be un-dimmed
		d3.select(this)
			.style("opacity", 0.5);
		// select all dots and apply 0 opacity (hide)
		// filtering data for Total population of all males

		var regdata = data.filter(function (row) {
			return (row.region.toLowerCase() == type.toLowerCase());
		});

		var gender = d3.selectAll("input[name='gender']:checked").property('value');
		var ycolumn, islog;
		if (gender === 'male') {
			ycolumn = 'malePopulation'
			//islog = false;
		} else if (gender === 'female') {
			ycolumn = 'femalePopulation'
			//islog = false;
		} else {
			ycolumn = 'totalPopulation';
		}

		islog = false;
		var scale = createScale(regdata, islog, ycolumn);
		var xScale = scale[0];
		var yScale = scale[1];
		drawAxis(xScale, yScale);
		update(regdata, xScale, yScale, ycolumn = ycolumn);

		createCircles(formatData(regdata, ycolumn), xScale, yScale, ycolumn)

		plot.selectAll("circle").exit().remove()

	});
}

function createCircles(data, xScale, yScale, ycolumn) {
	plot.selectAll("circle-group")
		.data(data).enter()
		.append("g")
		.style("fill", (d, i) => color(i))
		.selectAll("circle")
		.data(d => d.values).enter()
		.append("g")
		.attr("class", "circle")
		.on("mouseover", function (d) {
			//if (filter == true) {
			d3.select(this)
				.style("cursor", "pointer")
				.append("text")
				.attr("class", "text")
				.text(function (d) { return d[ycolumn] })
				.attr("x", d => xScale(d.year) + 5)
				.attr("y", d => yScale(d[ycolumn]) - 10);
			//}
		})
		.on("mouseout", function (d) {
			//if (filter == true) {
			d3.select(this)
				.style("cursor", "none")
				.transition()
				.duration(duration)
				.selectAll(".text").remove()
			//}
		})
		.append("circle")
		.attr("cx", d => xScale(d.year))
		.attr("cy", d => yScale(d[ycolumn]))
		.attr("r", circleRadius)
		.style('opacity', circleOpacity)
		.on("mouseover", function (d) {
			//if (filter == true) {
			d3.select(this)
				.transition()
				.duration(duration)
				.attr("r", circleRadiusHover)
				.style('opacity', circleOpacityHover)
			//.text(function (d) { return d[ycolumn] });
			//}
		})
		.on("mouseout", function (d) {
			//if (filter == true) {
			d3.select(this)
				.transition()
				.duration(duration)
				.attr("r", circleRadius)
				.style('opacity', circleOpacity);
			//}
		});

}


createplot();
