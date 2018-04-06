/* Map of GeoJSON data from MegaCities.geojson */

//function to instantiate the Leaflet map
function createMap(){
    //create the map
    var map = L.map('map', {
        center: [38, -95],
        zoom: 4
    });

    //add OSM base tilelayer
    L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
    }).addTo(map);

    //call getData function
    getData(map);
};

console.log("create map");

function createSequenceControls(map, attributes){

  //Create new sequence controls
    var SequenceControl = L.Control.extend({
        options: {
            position: 'bottomleft'
        },

        onAdd: function (map) {
            // create the control container div with a particular class name
            var container = L.DomUtil.create('div', 'sequence-control-container');

            //create range input element (slider)
            //$(container).append('hello sdfsdfsdf');
            $(container).append('<input class="range-slider" type="range" min="0" max="22" value="0">');
            //add skip buttons
            $(container).append('<button class="skip" id="reverse" title="Reverse">Back</button>');
            $(container).append('<button class="skip" id="forward" title="Back">Forward</button><div class="left">1790</div><div class="right">2010</div>');


            $(container).on('mousedown dblclick pointerdown', function(e){
                L.DomEvent.stopPropagation(e);
            });

            return container;
        }
    });

    map.addControl(new SequenceControl());
    //create range input element (slider)

        //Below Example 3.6 in createSequenceControls()
          //Step 5: click listener for buttons
          $('.skip').click(function(){
        //get the old index value
        var index = $('.range-slider').val();
        //Step 6: increment or decrement depending on button clicked
        if ($(this).attr('id') == 'forward'){
            index++;
            //Step 7: if past the last attribute, wrap around to first attribute
            index = index > 22 ? 0 : index;
            var indexNum = Number(index)+23;
            var ranker = attributes[indexNum];
            //console.log("ranker: "+ranker)
            updatePropSymbols(map,index,attributes[index],ranker);
        } else if ($(this).attr('id') == 'reverse'){
            index--;
            //Step 7: if past the first attribute, wrap around to last attribute
            index = index < 0 ? 22 : index;
            var indexNum = Number(index)+23;
            var ranker = attributes[indexNum];
            //console.log("ranker: "+ranker)
            updatePropSymbols(map,index,attributes[index],ranker);
        };
        //Step 8: update slider
        $('.range-slider').val(index);
    });

          //Step 5: input listener for slider
          $('.range-slider').on('input', function(){
            var index = $(this).val();
            var indexNum = Number(index)+23;
            var ranker = attributes[indexNum];
            updatePropSymbols(map,index,attributes[index],ranker);
              //sequence
          });
};

//Above Example 3.8...Step 3: build an attributes array from the data
function processData(data){
    //empty array to hold attributes
    var attributes = [];

    //properties of the first feature in the dataset
    var properties = data.features[0].properties;

    //push each attribute name into attributes array
    for (var eachattr in properties){
        //only take attributes with population values
        if (eachattr.indexOf("pop") > -1){
            attributes.push(eachattr);
        };
        if (eachattr.indexOf("rank") > -1){
            attributes.push(eachattr);
        };
    };

    //check result
    console.log(attributes);

    return attributes;
};

//calculate the radius of each proportional symbol
function calcPropRadius(attValue) {
    //scale factor to adjust symbol size evenly
    var scaleFactor = 3950;
    //area based on attribute value and scale factor
    var area = attValue/scaleFactor;
    var radius = 2+Math.sqrt(area/Math.PI);
    if (attValue == 0){
      radius=0
    };
    //radius calculated based on area
    //console.log(attValue);
    return radius;
};


//Step 3: Add circle markers for point features to the map
function createPropSymbols(data, map, attributes){
    //Step 4: Determine which attribute to visualize with proportional symbols
    //create marker options
    $("#panel").html("<p><strong>City Details</strong></p>");
    var options = {
        fillColor: "#ff7800",
        color: "#000",
        weight: 1,
        fillOpacity: 0.8,
        opacity: 0.5
    };

    //create a Leaflet GeoJSON layer and add it to the
    //Example 1.2 line 13...create a Leaflet GeoJSON layer and add it to the map

    L.geoJson(data, {

        pointToLayer: function (feature, latlng) {
            //Step 5: For each feature, determine its value for the selected attribute
            // start with the first size and first rank
            var attribute = attributes[0];
            var rankAttr = attributes[23];
            // attvalue = the actual value of that column
            var attValue = Number(feature.properties[attribute]);
            //Step 6: Give each feature's circle marker a radius based on its attribute value
            options.radius = calcPropRadius(attValue);

            //create circle markers
            var layer = L.circleMarker(latlng, options);
            /*if (options.radius=0){
              options.fillOpacity = 0;
              options.opacity = 0;
              options.weight = 0;
              console.log("ok");
            }*/
            //  console.log("rank "+feature.properties[rankAttr])
            // if the rank is above 0 then
            //  if (feature.properties[rankAttr] > 0){

            //original popupContent changed to panelContent...Example 2.2 line 1
               var panelContent = "<p><strong>City Details</strong></p> " + feature.properties.City;

               //add formatted attribute to panel content string
               var year = attribute.split("_")[0];
               var year1 = year.substr(3,7);
               var currentyear = attribute;
               //console.log("create prop symbols "+attribute);
               panelContent += "</p>" + "<p><b>Population in " + year1 + ":</b> " + feature.properties[attribute].toLocaleString()
                              + "<p><b>Rank in " + year1 + ":</b> "
                              + feature.properties[rankAttr].toLocaleString();

               //popup content is now just the city name
               var popupContent = "<p><b>City:</b> " + feature.properties.City + "</p>" + "<p><b>Population in " + year1 + ":</b> "
               + feature.properties[attribute].toLocaleString()
               + "<p><b>Rank in " + year1 + ":</b> "
               + feature.properties[rankAttr].toLocaleString();

               //bind the popup to the circle marker
               layer.bindPopup(popupContent, {
                   offset: new L.Point(0,-options.radius),
                   closeButton: false
               });


               //event listeners to open popup on hover and fill panel on click
               layer.on({
                   mouseover: function(){
                       this.openPopup();
                   },
                   mouseout: function(){
                       this.closePopup();
                   },
                   click: function(){
                       $("#panel").html(panelContent);
                   }
               });
               var currentYear = attribute;
          return layer;//}
        },
    }).addTo(map);
};



//Step 10: Resize proportional symbols according to new attribute values
function updatePropSymbols(map, index, attribute, ranker){
    $("#panel").html("<p><strong>City Details</strong></p>");
    map.eachLayer(function(layer){
      console.log("removing")
          layer.clearLayers(layer);
        });
    map.eachLayer(function(layer){
        if (layer.feature && layer.feature.properties[attribute]){
            //update the layer style and popup
            //Example 3.16 line 4
                 //access feature properties
                 var props = layer.feature.properties;
                 //update each feature's radius based on new attribute values
                 var radius = calcPropRadius(props[attribute]);
                 console.log("rank is "+props[ranker])
                 //}
                 layer.setRadius(radius);

                 //add city to popup content string
                 var popupContent = "<p><b>City:</b> " + props.City + "</p>";
                 var panelContent = "<p><strong>City Details</strong></p>" +
                 props.City  + "</p>";
                 //add formatted attribute to panel content string
                 var year = attribute.split("_")[0];
                 var year1 = year.substr(3,7);
                 //console.log("update prop symbols "+year);
                 panelContent += "</p>" + "<p><b>Population in " + year1 + ":</b> " + props[attribute].toLocaleString()
                                + "<p><b>Rank in " + year1 + ":</b> "
                                + props[ranker].toLocaleString();

                 popupContent += "<p><b>Population in " + year1 + ":</b> " + props[attribute].toLocaleString() +
                 "<p><b>Rank in " + year1 + ":</b> " + props[ranker].toLocaleString();
                 //replace the layer popup
                 layer.bindPopup(popupContent, {
                     offset: new L.Point(0,-radius)
                 });
                 //event listeners to open popup on hover and fill panel on click
                 layer.on({
                     mouseover: function(){
                         this.openPopup();
                     },
                     mouseout: function(){
                         this.closePopup();
                     },
                     click: function(){
                         $("#panel").html(panelContent);
                     }
                 });
             };
                   map.addLayer(layer);
                   updateLegend(map,index, attribute)
        });
};

//Step 2: Import GeoJSON data
function getData(map){
    //load the data
    $.ajax("data/uscities.geojson", {
        dataType: "json",
        success: function(response){
          //create an attributes array
          var attributes = processData(response);

          createPropSymbols(response, map, attributes);
          createSequenceControls(map, attributes);
          createLegend(map, attributes);
        }
    });
};

// make the legend

function createLegend(map, attributes){
    var LegendControl = L.Control.extend({
        options: {
            position: 'bottomright'
        },
        onAdd: function (map) {
            // create the control container with a particular class name
            var container = L.DomUtil.create('div', 'legend-control-container');

             $(container).append('<div id="temporal-legend">')

            console.log("create legend"+attributes);

            //Step 1: start attribute legend svg string
            var svg = '<svg id="attribute-legend" width="160px" height="60px">';


            //object to base loop on...replaces Example 3.10 line 1
            var circles = {
              max: 40,
              mean: 50,
              min: 60
            };

            //loop to add each circle and text to svg string
            for (var circle in circles){
              //circle string
              if (circle === "min") { break; }
              svg += '<circle class="legend-circle" id="' + circle + '" fill="#F47821" fill-opacity="0.8" stroke="#000000" cx="30"/>';

              //text string
              svg += '<text id="' + circle + '-text" x="65" y="' + circles[circle] + '"></text>';
            };

/*
            //array of circle names to base loop on
            var circles = ["max", "mean", "min"];

            //Step 2: loop to add each circle and text to svg string
            for (var i=0; i<circles.length; i++){
                //circle string
                svg += '<circle class="legend-circle" id="' + circles[i] +
                '" fill="#F47821" fill-opacity="0.8" stroke="#000000" cx="80"/>';
                //text string
                svg += '<text id="' + circles[i] + '-text" x="65" y="60"></text>';
            };
*/

            //close svg string
            svg += "</svg>";
            //add attribute legend svg to container
            $(container).append(svg);

            $(container).on('mousedown dblclick pointerdown', function(e){
               L.DomEvent.stopPropagation(e);
            });
            return container;
        }
    });

    map.addControl(new LegendControl());
    var index = 0;

    updateLegend(map, index, attributes[0]);
};

//Calculate the max, mean, and min values for a given attribute
function getCircleValues(map, attribute){
    //start with min at highest possible and max at lowest possible number
    var min = Infinity,
        max = -Infinity;
  //console.log("getcircle "+attribute);
    map.eachLayer(function(layer){
        //get the attribute value
        if (layer.feature){
            var attributeValue = Number(layer.feature.properties[attribute]);
        //console.log("getcircle "+layer.feature.properties[attribute])
            //test for min
            if (attributeValue < min){
                min = attributeValue;
            };

            //test for max
            if (attributeValue > max){
                max = attributeValue;
            };
        };
    });

    //set mean
    var mean = (max + min) / 2;

    //return values as an object
    return {
        max: max,
        mean: mean,
        min: min
    };
};

function updateLegend(map, index, attribute){
    //create content for legend
    var year = attribute.split("_")[0];
    var year_nice = year.substr(3,7);
    var content = "<h1>Population in " + year_nice +"</h1>";
    var circleLocation = "Population in " + year_nice;

    //replace legend content
    $('#temporal-legend').html(content);
    //get the max, mean, and min values as an object
    var circleValues = getCircleValues(map, attribute);
    //console.log("circle values update legend "+circleValues)
    for (var key in circleValues){
        //get the radius
        var radius = calcPropRadius(circleValues[key]);
        if (key === "mix") { break; }
        //Step 3: assign the cy and r attributes
        $('#'+key).attr({
            cy: 54 - radius,
            r: radius
        });
        //Step 4: add legend text
          $('#'+key+'-text').text(key+" "+Math.round(circleValues[key]).toLocaleString());
};

    // Move the labels for mean and max
    var meanLoc = (115-index)*.5
    $('#mean-text').attr({
      y : meanLoc
    });
    var maxLoc = 40-index
    $('#max-text').attr({
      y : maxLoc
    });
};

$(document).ready(createMap);
