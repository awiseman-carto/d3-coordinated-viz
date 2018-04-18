(function(){

//variables for data join
 var attrArray = ["Total","White","Black","Asian","Hispanic"];
 var expressed = attrArray[0];

 //chart frame dimensions
var chartWidth = window.innerWidth * 0.55,
    chartHeight = 460,
    leftPadding = 43,
    rightPadding = 2,
    topBottomPadding = 1,
    chartInnerWidth = chartWidth - leftPadding - rightPadding,
    chartInnerHeight = chartHeight - topBottomPadding * 2,
    translate = "translate(" + leftPadding + "," + topBottomPadding + ")";

//create a scale to size bars proportionally to frame and for axis
var yScale = d3.scaleLinear()
    .range([455, 0])
    .domain([0, 7436]);


//begin script when window loads
window.onload = setMap();

// python -m SimpleHTTPServer the code for my dev server
// C:\gis575\d3-coordinated-viz\d3-coordinated-viz>python -m SimpleHTTPServer
// http://localhost:8000/index.html

//set up choropleth map
function setMap(){

  //map frame dimensions
  var width = window.innerWidth * 0.35,
      height = 460;

  //create new svg container for the map
  var map = d3.select("body")
      .append("svg")
      .attr("class", "map")
      .attr("width", width)
      .attr("height", height);

    //create Albers equal area conic projection centered on France
  var projection = d3.geoAlbers()
        .center([17.1, 38.88])
        //38, -95  or 0, 46.2
        .rotate([94, 0, 0])
        .parallels([-30.5, 34.5])
        .scale(120000)
      //  .translate([width / 2, height / 2]);

  var path = d3.geoPath()
      .projection(projection);

  //use queue to parallelize asynchronous data loading
      console.log("waiting")
      d3.queue()
        .defer(d3.csv, "data/tractdata2.csv") //load attributes from csv
        .defer(d3.json, "data/state_province.topojson") //load choropleth spatial data
        .defer(d3.json, "data/temp.topojson") //load choropleth spatial data
        .await(callback);

  function callback(error, csvData, states, tracts){
    console.log("callback")

      //place graticule on the map
      setGraticule(map, path);

    // translate to topojosn
    //var newState = topojson.feature(states, states.objects.state_province).features;
    var census = topojson.feature(tracts, tracts.objects.temp).features;

      // join the csv
      census = joinData(census, csvData);

      //create the color scale
      var colorScale = makeColorScale(csvData);

      // add enumeration units
      setEnumerationUnits(census, map, path, colorScale);

/*
       console.log(attrArray)
       console.log(csvData);
       console.log(census);
*/
       setChart(csvData, colorScale);
       createDropdown(csvData);
  }; //end of callback
}; //end of setmap

//function to create coordinated bar chart
function setChart(csvData, colorScale){
    //chart frame dimensions
    var chartWidth = window.innerWidth * 0.55,
        chartHeight = 460,
        leftPadding = 40,
        rightPadding = 2,
        topBottomPadding = 1,
        chartInnerWidth = chartWidth - leftPadding - rightPadding,
        chartInnerHeight = chartHeight - topBottomPadding * 2,
        translate = "translate(" + leftPadding + "," + topBottomPadding + ")";

    //create a second svg element to hold the bar chart
    //Example 2.1 line 17...create a second svg element to hold the bar chart
    var chart = d3.select("body")
        .append("svg")
        .attr("width", chartWidth)
        .attr("height", chartHeight)
        .attr("class", "chart");

    //create a rectangle for chart background fill
    var chartBackground = chart.append("rect")
        .attr("class", "chartBackground")
        .attr("width", chartInnerWidth)
        .attr("height", chartInnerHeight)
        .attr("transform", translate);

  //create a scale to size bars proportionally to frame
      var yScale = d3.scaleLinear()
          .range([458, 0])
          .domain([0, 7436]);

      //Example 2.4 line 8...set bars for each province

      var bars = chart.selectAll(".bar")
          .data(csvData)
          .enter()
          .append("rect")
          .sort(function(a, b){
              return b[expressed]-a[expressed]
          })
          .attr("class", function(d){
              return "bar " + d.TRACT;
          })
          .attr("width", chartInnerWidth / csvData.length - 1)
          .on("mouseover", highlight)
          .on("mouseout", dehighlight)
          .on("mousemove", moveLabel);
          var desc = bars.append("desc")
            .text('{"stroke": "none", "stroke-width": "0px"}');


      //below Example 2.8...create a text element for the chart title
      var chartTitle = chart.append("text")
          .attr("x", 90)
          .attr("y", 40)
          .attr("class", "chartTitle")
          .text("Population of Variable " + expressed[3] + " in each tract");

      //create vertical axis generator
      var yAxis = d3.axisLeft(yScale)
          .scale(yScale);

          //place axis
      var axis = chart.append("g")
          .attr("class", "axis")
          .attr("transform", translate)
          .call(yAxis);

      //create frame for chart border
      var chartFrame = chart.append("rect")
          .attr("class", "chartFrame")
          .attr("width", chartInnerWidth)
          .attr("height", chartInnerHeight)
          .attr("transform", translate);

      updateChart(bars, csvData.length, colorScale, expressed);
}; // end of setchart

//function to create a dropdown menu for attribute selection
function createDropdown(csvData){
    //add select element
    var dropdown = d3.select("body")
        .append("select")
        .attr("class", "dropdown")
        .on("change", function(){
            changeAttribute(this.value, csvData)
        });

    //add initial option
    var titleOption = dropdown.append("option")
        .attr("class", "titleOption")
        .attr("disabled", "true")
        .text("Select Ethnicity :");

    //add attribute name options
    var attrOptions = dropdown.selectAll("attrOptions")
        .data(attrArray)
        .enter()
        .append("option")
        .attr("value", function(d){ return d })
        .text(function(d){ return d });
};

//dropdown change listener handler
//Example 1.4 line 14...dropdown change listener handler
function changeAttribute(attribute, csvData){
    //change the expressed attribute
    expressed = attribute;

    //recreate the color scale
    var colorScale = makeColorScale(csvData);

    //recolor enumeration units
    var tracts = d3.selectAll(".tracts")
      .transition()
      .duration(1000)
      .style("fill", function(d){
        return choropleth(d.properties, colorScale)
      });

    //re-sort, resize, and recolor bars

    // find max to redraw y axis and bars when changing attributes
      var max = d3.max(csvData, function(d){
        return + parseFloat(d[expressed])
      });

      // update the y axis
      yScale = d3.scaleLinear()
          .range([chartHeight-5, 0])
      .domain([0, max]);

    //Example 1.7 line 22...re-sort, resize, and recolor bars
     var bars = d3.selectAll(".bar")
         //re-sort bars
         .sort(function(a, b){
             return b[expressed] - a[expressed];
         })
         .transition() //add animation
         .delay(function(d, i){
             return i * 2
         })
         .duration(400);

     updateChart(bars, csvData.length, colorScale, expressed);
}; // end of changeAttribute

//function to position, size, and color bars in chart
function updateChart(bars, n, colorScale, expressed){
    //position bars
    bars.attr("x", function(d, i){
            return i * (chartInnerWidth / n) + leftPadding;
        })
        //size/resize bars
        .attr("height", function(d, i){
            return 463 - yScale(parseFloat(d[expressed]));
        })
        .attr("y", function(d, i){
            return yScale(parseFloat(d[expressed])) + topBottomPadding;
        })
        //color/recolor bars
        .style("fill", function(d){
            return choropleth(d, colorScale);
        })

    //at the bottom of updateChart()...add text to chart title
    console.log("updatechart")
    var chartTitle = d3.select(".chartTitle")
        .text(expressed + " population per census tract");
    // console.log(expressed[3])

    // change the axis labels
    var yAxis = d3.axisLeft()
        .scale(yScale)

    d3.selectAll("g.axis")
      .call(yAxis);
};

//function to create color scale generator
function makeColorScale(data){
    var colorClasses = [
      /*
        "#D4B9DA",
        "#C994C7",
        "#DF65B0",
        "#DD1C77",
        "#980043"
      */
      /*
      "#fee5d9",
      "#fcae91",
      "#fb6a4a",
      "#de2d26",
      "#a50f15"
      */
      /*"#ffffb2",
      "#fecc5c",
      "#fd8d3c",
      "#f03b20",
      "#bd0026" */

      "#ffffd4",
      "#fed98e",
      "#fe9929",
      "#d95f0e",
      "#993404"
    ];

    //create color scale generator
    var colorScale = d3.scaleQuantile()
        .range(colorClasses);

    //build array of all values of the expressed attribute
    var domainArray = [];
    for (var i=0; i<data.length; i++){
        var val = parseFloat(data[i][expressed]);
        domainArray.push(val);
    };

    //assign array of expressed values as scale domain
    colorScale.domain(domainArray);
    //console.log(colorClasses)
    return colorScale;
};

//function to highlight enumeration units and bars
function highlight(props){
   //change stroke
   var selected = d3.selectAll("." + props.TRACT)
       .style("stroke", "#C70039")
       .style("stroke-width", "3")
       .style("stroke-linecap", "round");
  setLabel(props)
};

//};

function setGraticule(map, path){

    //create graticules
    var graticule = d3.geoGraticule()
      .step([5, 5]); //place graticule lines every 5 degrees of longitude and latitude
    //create graticule lines

    //create graticule background
    var gratBackground = map.append("path")
        .datum(graticule.outline()) //bind graticule background
        .attr("class", "gratBackground") //assign class for styling
        .attr("d", path) //project graticule

    var gratLines = map.selectAll(".gratLines") //select graticule elements that will be created
        .data(graticule.lines()) //bind graticule lines to each element to be created
        .enter() //create an element for each datum
        .append("path") //append each element to the svg as a path element
        .attr("class", "gratLines") //assign class for styling
        .attr("d", path); //project graticule lines
        console.log("done")
};

function joinData(census, csvData){
  //loop through csv to assign each set of csv attribute values to geojson region
    for (var i=0; i<csvData.length; i++){
        var csvRegion = csvData[i]; //the current region
        var csvKey = csvRegion.TRACT; //the CSV primary key

        //loop through geojson regions to find correct region
        for (var a=0; a<census.length; a++){

            var geojsonProps = census[a].properties; //the current region geojson properties
            var geojsonKey = geojsonProps.TRACT; //the geojson primary key

            //where primary keys match, transfer csv data to geojson properties object
            if (geojsonKey == csvKey){

                //assign all attributes and values
                attrArray.forEach(function(attr){
                    var val = parseFloat(csvRegion[attr]); //get csv attribute value
                    geojsonProps[attr] = val; //assign attribute and value to geojson properties
                });
            };
        };
    };
    return census;
};

function setEnumerationUnits(census, map, path, colorScale){

//in setEnumerationUnits()...add France regions to map
   var tracts = map.selectAll(".tracts")
       .data(census)
       .enter()
       .append("path")
       .attr("class", function(d){
           return "tracts " + d.properties.TRACT;
       })
       .attr("d", path)
       .style("fill", function(d){
           return choropleth(d.properties, colorScale);
       })
       .on("mouseover", function(d){
          this.parentNode.appendChild(this);
           highlight(d.properties);
       })
       .on("mouseout", function(d){
           dehighlight(d.properties);
       })
       .on("mousemove", moveLabel);
       var desc = tracts.append("desc")
           .text('{"stroke": "#CCC", "stroke-width": "0.5px"}');
};

//function to reset the element style on mouseout
function dehighlight(props){
   var selected = d3.selectAll("." + props.TRACT)
       .style("stroke", function(){
           return getStyle(this, "stroke")
       })
       .style("stroke-width", function(){
           return getStyle(this, "stroke-width")
       });

   function getStyle(element, styleName){
       var styleText = d3.select(element)
           .select("desc")
           .text();

       var styleObject = JSON.parse(styleText);

       return styleObject[styleName];
   };
   //below Example 2.4 line 21...remove info label
   d3.select(".infolabel")
      .remove();
};

//function to create dynamic label
function setLabel(props){
    //label content
    var labelAttribute = "<h1>" + props[expressed].toLocaleString() +
        "</h1><br><b>" + expressed + " Population</b>";

    //create info label div
    var infolabel = d3.select("body")
        .append("div")
        .attr("class", "infolabel")
        .attr("id", props.TRACT + "_label")
        .html(labelAttribute);
        var newTract = props.TRACT
        var cutTract = "Census Tract " + newTract.substring(5,10)

    var regionName = infolabel.append("div")
        .attr("class", "labelname")
        .html(cutTract)
        //console.log(regionName)
};

//function to move info label with mouse
function moveLabel(){
    //get width of label
    var labelWidth = d3.select(".infolabel")
        .node()
        .getBoundingClientRect()
        .width;

    //use coordinates of mousemove event to set label coordinates
    var x1 = d3.event.clientX + 10,
        y1 = d3.event.clientY - 75,
        x2 = d3.event.clientX - labelWidth - 10,
        y2 = d3.event.clientY + 25;

    //horizontal label coordinate, testing for overflow
    var x = d3.event.clientX > window.innerWidth - labelWidth - 20 ? x2 : x1;
    //vertical label coordinate, testing for overflow
    var y = d3.event.clientY < 75 ? y2 : y1;

    d3.select(".infolabel")
        .style("left", x + "px")
        .style("top", y + "px");
};


//function to test for data value and return color
function choropleth(props, colorScale){
    //make sure attribute value is a number
    var val = parseFloat(props[expressed]);
    //if attribute value exists, assign a color; otherwise assign gray
    if (typeof val == 'number' && !isNaN(val)){
        return colorScale(val);
    } else {
        return "#CCC";
    };
};

})();

// trying conic
/*
    var projection = d3.geoConicConformal()
    .parallels([38 + 18 / 60, 39 + 27 / 60])
    .scale(200)
//    .fitExtent([[20, 20], [940, 440]])
    .rotate([77, 0]);
*/
// trying state plane

/*    var projection = d3.geoTransverseMercator()
        .rotate([74 + 30 / 60, -38 - 50 / 60]);
*/
