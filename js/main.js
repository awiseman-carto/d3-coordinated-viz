//begin script when window loads
window.onload = setMap();

//set up choropleth map
function setMap(){
    //use queue to parallelize asynchronous data loading
    d3.queue()
        .defer(d3.csv, "data/bicyclerisk.csv") //load attributes from csv
        .defer(d3.json, "data/states.topojson") //load background spatial data
        .defer(d3.json, "data/tracts.topojson") //load choropleth spatial data
        .await(callback);
};

function callback(error, csvData, states, tracts){
    console.log(error);
    console.log(csvData);
    console.log(states);
    console.log(tracts);
};
console.log("sup")
