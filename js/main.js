//begin script when window loads
window.onload = function(){

// python -m SimpleHTTPServer the code for my dev server
// C:\gis575\d3-coordinated-viz\d3-coordinated-viz>python -m SimpleHTTPServer
// http://localhost:8000/index.html

//set up choropleth map
//function setMap(){

    //map frame dimensions
    var width = 960,
        height = 460;

    //create new svg container for the map
    var map = d3.select("body")
        .append("svg")
        .attr("class", "map")
        .attr("width", width)
        .attr("height", height);

    //create Albers equal area conic projection centered on France
    var projection = d3.geoAlbers()
        .center([0, 46.2])
        //38, -97
        .rotate([-2, 0, 0])
        .parallels([43, 62])
        .scale(2500)
        .translate([width / 2, height / 2]);
    //use queue to parallelize asynchronous data loading

    var path = d3.geoPath()
        .projection(projection);

    console.log("waiting")
    d3.queue()
        .defer(d3.csv, "data/state_province.csv") //load attributes from csv
        .defer(d3.json, "data/state_province.topojson") //load choropleth spatial data
        .defer(d3.json, "data/censustracts.topojson.json") //load choropleth spatial data
        .await(callback);
//};

function callback(error, csvData, states, census){
  console.log("callback")
  // translate to topojosn
  var newState = topojson.feature(states, states.objects.state_province).features;
  var newCensus = topojson.feature(census, census.objects.censustracts).features;
    console.log("error",error);
    console.log("csv",csvData);
    console.log("states",states);
    console.log("census",census);
    //console.log("states",states);

    var tracts = map.selectAll(".tracts")
    .data(newCensus)
    .enter()
    .append("path")
    .attr("class", function(d){
        return "regions " + d.properties.TRACT;
    })
    .attr("d", path);
};
console.log("done")
};
