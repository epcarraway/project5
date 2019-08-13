// This script generates an interactive bar chart using SVG and D3 for the resource types found in the Zenodo database. It requires the resource_types.json

// Set color palette
const categoryColor = d3.scaleOrdinal(d3.schemeSet2);

// Set margins, height, width for SVG
var margin = {
    top: 10,
    right: 20,
    bottom: 50,
    left: 170
};
var width = 1000 - margin.left - margin.right;
var height = 600 - margin.top - margin.bottom;

// Create SVG
var svg = d3.select("#total_div").append("svg")
    .classed("svg-content", true)
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// Set scaling and axis
var x = d3.scaleLinear()
    .range([0, width]);

var y = d3.scaleBand()
    .range([height, 0]);

var yAxis = d3.axisLeft(y);

// Set labels
var yLabel = svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -200)
    .attr("y", -150)
    .attr("font-size", "20px")
    .attr("text-anchor", "middle")
    .text("Publication Type");

var xlabel = svg.append("text")
    .attr("y", height + 50)
    .attr("x", width / 2)
    .attr("font-size", "20px")
    .attr("text-anchor", "middle")
    .text("Total Publications");

var timeLabel = svg.append("text")
    .attr("y", height - 10)
    .attr("x", width - 70)
    .attr("font-size", "40px")
    .attr("opacity", 0.4)
    .attr("text-anchor", "middle")
    .text(firstDate);

// Add and format legend
var legend = svg.append("g")
    .attr("title", "test")
    .attr("transform", "translate(" + (width - 10) + ", " + (height - 160) + ")");
	
var legtypes = ["Image", "Text", "Software", "Dataset", "Audiovisual", "InteractiveResource"];

var legendTitle = legend.append("text")
    .attr("class", "legendTitle")
    .attr("y", -10)
    .attr("text-anchor", "end")
    .attr("font-size", "20px")
    .text('General Category');
	
legtypes.forEach(function (legtypes, i) {
    var legendRow = legend.append("g")
        .attr("transform", "translate(0, " + i * 20 + ")");

    legendRow.append("rect")
    .attr("class", "legendColor")
    .attr("width", 10)
    .attr("height", 10)
    .attr("fill", categoryColor(legtypes));

    legendRow.append("text")
    .attr("x", -10)
    .attr("y", 10)
    .attr("text-anchor", "end")
    .style("text-transform", "capitalize")
    .text(legtypes);
});

// Define hover tooltip
var tip = d3.tip().attr("class", "d3-tip")
    .html(function (d) {
        var info = "Resource Type: <span style='color:grey'>" + d.resourceType + "</span><br />";
        info += "Resource Type General: <span style='color:grey; text-transform: capitalize'>"
         + d.resourceTypeGeneral + "</span><br />";
        info += "New Records: <span style='color:grey'>"
         + d3.format(",.0f")(d.records) + "</span><br />";
        info += "Total: <span style='color:grey'>"
         + d3.format(",.0f")(d.total) + "</span><br />";
        info += "Month: <span style='color:grey'>"
         + d.month + "</span><br />";
        return info;
    });

svg.call(tip);

// Set initial month to display and number of categories
filter_month = firstDate
n = 20

// Make play and reset buttons
$("#play-button")
.on("click", function () {
	var button = $(this);
	if (button.text() == "Play") {
		button.text("Pause")
		interval = setInterval(step, 100);
	} else {
		button.text("Play")
		clearInterval(interval); //Pause
	}
});

$("#reset-button")
.on("click", function () {
    filter_month = '2001-01';
    n = 20;
    d3.json("data/resource_types.json", function (data) {
        data.sort((a, b) => a.total - b.total).slice(27 - n, 27);
        update(data);
    });
});

// Make date slider
$("#date-slider").slider({
    max: allDates.length - 1,
    min: 0,
    step: 1,
    slide: function (event, ui) {
        filter_month = allDates[ui.value];
        d3.json("data/resource_types.json", function (data) {
            data.sort((a, b) => a.total - b.total).slice(27 - n, 27);
            update(data);
        });
    }
});

// Make n slider
$("#n-slider").slider({
    max: 27,
    min: 1,
    step: 1,
    slide: function (event, ui) {
        n = ui.value;
        d3.json("data/resource_types.json", function (data) {
            data.sort((a, b) => a.total - b.total).slice(27 - n, 27);
            update(data);
        });
    }
});

// Define step function to run the updates when the play button is clicked
function step() {
    //at the end of our dataset, loop back
    filter_month = (allDates.indexOf(filter_month) <= allDates.length) ? allDates[allDates.indexOf(filter_month) + 1] : allDates[0];
    d3.json("data/resource_types.json", function (data) {
        data.sort((a, b) => a.total - b.total).slice(27 - n, 27);
        update(data);
    });
} //step

// Set chart name based on dates in JSON
document.getElementById("title_div").innerHTML = 'Publication Types (' + firstDate + ' to ' + lastDate + ')';

d3.json("data/resource_types.json", function (data) {
	data.sort((a, b) => a.total - b.total).slice(27 - n, 27);
    update(data, filter_month);
});

// Set filter for JSON
function resource_filter(d) {
    return d.month == filter_month && d.resourceType != "All" && d.resourceType != "Other";
};


// Define function to update chart
function update(data) {
    // Update text and slider position based on month
	timeLabel.text(filter_month);
	$("#month")[0].innerHTML = filter_month;
    $("#n")[0].innerHTML = n;
    $("#date-slider").slider("value", allDates.indexOf(filter_month));
    $("#n-slider").slider("value", n);
	// Remove old bars and tick labels
	svg.selectAll(".bar").remove();
    svg.selectAll(".tick").remove();

	// Set domain and padding for chart based on data extents for month
    x.domain([0, d3.max(data.filter(resource_filter), function (d) {
                return d.total;
            })]);

    y.domain(data.filter(resource_filter).sort((a, b) => a.total - b.total).slice(27 - n, 27).map(function (d) {
            return d.resourceType;
        }))
    .paddingInner(0.1);

	// Set x and y axis
    svg.append("g")
		.attr("class", "x axis")
		.attr("transform", "translate(0," + height + ")")
		.call(d3.axisBottom(x));

    svg.append("g")
		.attr("class", "y axis")
		.call(yAxis);

	// Create bar chart
    svg.selectAll(".bar")
		.data(data.filter(resource_filter).sort((a, b) => a.total - b.total).slice(27 - n, 27))
		.order()
		.enter().append("rect")
		.attr("class", "bar")
		.on("mouseover", tip.show)
		.on("mouseout", tip.hide)
		.attr("x", 1)
		.attr("height", y.bandwidth())
		.style("fill", function (d) {
			return categoryColor(d.resourceTypeGeneral)
		})
		.attr("y", function (d) {
			return y(d.resourceType);
		})
		.attr("width", function (d) {
			return x(d.total);
		});
};