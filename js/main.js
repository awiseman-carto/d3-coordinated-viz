//begin script when window loads
window.onload = setMap();

// python -m SimpleHTTPServer the code for my dev server
// C:\gis575\d3-coordinated-viz\d3-coordinated-viz>python -m SimpleHTTPServer
// http://localhost:8000/index.html

//set up choropleth map
function setMap(){
    //use queue to parallelize asynchronous data loading
    console.log("waiting")
    d3.queue()
        .defer(d3.csv, "data/state_province.csv") //load attributes from csv
        .defer(d3.json, "data/state_province.topojson") //load choropleth spatial data
        //.defer(d3.json, "data/states.topojson") //load background spatial data
        .await(callback);
};

function callback(error, csvData, states){
  console.log("callback")
  // translate to topojosn
  var newState = topojson.feature(states, states.objects.state_province).features;
    console.log("error",error);
    console.log("csv",csvData);
    //console.log("states",states);
    //console.log(tracts);
};
console.log("done")
