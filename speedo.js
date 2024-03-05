// Jeff Moore, 1/19/2016
// Speedometer.

//"use strict";

// Configuration variables
var config_mirrorHud = 0;  // show mirror-image
var config_fps = 3;
var config_posRefreshRate = 100; // ms
var config_geocodeRefreshRate = 15000; // ms
var config_textSizeA = 0.20; // percent of screen space
var config_textSizeB = 0.13;
var config_textSizeC = 0.08;
var config_textSizeD = 0.06;
var config_textFontA = "Josefin Sans";
var config_textFontB = "Josefin Sans";
var config_textFontC = "Josefin Sans";
var config_speedocircx = 0.50; //percents of screen space
var config_speedocircy = 0.40;
var config_speedocircr = 0.6;
var config_speedocircaa = 0.35; // beginangle
var config_speedocircab = 0.15;// endangle
var config_speedocircthickness = 0.1;  // percent of circle radius
var config_speedoinnercirc = 0.8; // info circle inside the speedo
var config_speedoneedlelength = 0.40; // length of the needle, in percent-of-radius. \|/
var config_speedoneedlewidtha = 0.00025; // width of the inner needle, in percent-of-radius. \|/
var config_speedoneedlewidthb = 0.00005; // width of the outer needle, in percent-of-radius. \|/
var config_speedoneedleroffset = -0.300; // offset from center, in percent-of-radius. pos-outward, neg-inward.
var config_speedomax = 80; // mph

var config_datex = 0.95;
var config_datey = 0.17;
var config_timex = 0.95;
var config_timey = 0.10;

var config_subInfoAx = 0.50; // can be street name, city name, etc
var config_subInfoAy = 0.85;
var config_subInfoAFont = "Josefin Sans";
var config_subInfoASize = 0.08;
var config_subInfoLineHeight = 0.09;
var config_hudCompass = {
  "radius": 0.8,  // percent of speedo circle radius
  "arcSize": 0.04, // size of marker arc in percent-of-circle
  "arcThickness": 4,
  "centerSize": 0.003,  // size of marker center in percent-of-speedo-radius
  "centerThickness": 15,
  "letterSize": 0.10  // size of marker "N"
};
var config_colorScheme = [
  "#000000", // background color
  "#FF5500", // main color 1 - shapes, lights
  "#661100", // main color 2 - speed arc
  "#CC1100", // sub color 1
  "#992211", // sub color 2
  "#993300", // edge color
  "#FF9900", // accent color - indicator lights
];

/*var config_colorScheme = [
  "#FFFFFF", // background color
  "#000000", // main color 1 - shapes, lights
  "#555555", // main color 2 - needle(s)
  "#777777", // sub color 1
  "#992211", // sub color 2
];*/

var config_posOptions = {
  enableHighAccuracy: true,
  timeout: 5000,
  maximumAge: 0,
  desiredAccuracy: 1, 
  frequency: config_posRefreshRate
};

// Other global variables
var viewWidth, viewHeight, w, h;
var textSizeA, textSizeB, textSizeC;
var scx, scy, scr, scaa, scab;
var subInfoASize;
var logStr = "";
var prevTouchTime = -1;

// Prepare the elements and variables
// HTML
var speedoDiv = document.getElementById("speedoCanvasContainer");
speedoDiv.innerHTML += "<canvas id=\"canvas1\" width=\"" + screen.width + "px\" height=\"" + screen.height + "px\">ns =(</canvas>";
//speedoDiv.innerHTML += "<canvas id=\"canvas2\" width=\"" + screen.width + "px\" height=\"" + screen.height + "px\">ns =(</canvas>";
var c1 = document.getElementById("canvas1"); // for HUD info display
//var c2 = document.getElementById("canvas2"); // for HUD controls display
var ctx1 = c1.getContext("2d");
//var ctx2 = c2.getContext("2d");
var viewWidth = window.innerWidth;
var viewHeight = window.innerHeight;
// Date and Time
var dateStr = "";
var timeStr = "";
// GPS
var gpsInfo = document.getElementById("demo");
//var geocoderObj = new google.maps.Geocoder;
var geocoderStatus = -1;
var geoWatchPos, geocoderResultsObj, randomSetOfGeocoderResultsObj, randomSetOfGeocoderStatusObj;
var posObj;
var priorLat = -1;
var priorLon = -1;
var priorHeading = -1;
var priorAltitude = -1;
var tripMilesA = 0; // learn to save data then make more relevant trips
//var geoStreetName, geoNeighborhoodName, geoCityName, geoCountyName, geoStateAbbrev, geoZipCode;
// geoStreetName = geoNeighborhoodName = geoCityName = geoCountyName = geoStateAbbrev = geoZipCode = "";
var speedStr, posDirection, sub1Str, sub2Str;
speedStr = posDirection = sub1Str = sub2Str = "---";

var gpsLatitude, gpsLongitude, gpsSpeed=0, gpsTrack=0, gpsAltitude, gpsHDOP, gpsVDOP;
var geocodeRoad  = null;
var geocodeTown  = null;
var geocodeCounty = null;
var geocodeState = null;
var geocodeZip = null;


try {

    // Utility functions
    // Distance btw 2 points
    function getDistance(lat1,lon1,lat2,lon2,unit="mi") {
      var R = 6371; // Radius of the earth in km
      var dLat = degToRad(lat2-lat1);  // degToRad below
      var dLon = degToRad(lon2-lon1); 
      var a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(degToRad(lat1)) * Math.cos(degToRad(lat2)) * 
        Math.sin(dLon/2) * Math.sin(dLon/2)
        ; 
      var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
      var dKm = R * c; // Distance in km
      var dMi = dKm * 0.62137119;
      var dM = dKm * 1000;

      if (unit == "mi") {return dMi}
      else if (unit == "km") {return dKm}
      else if (unit == "m") {return dM}
      else {return "error - specify valid unit type"}
    }
    
    // Current pitch in direction of travel
    // 1: current. 2: prior.
    // &&& way too simple. Need to keep a history of lat/lon/elev for smoothness of functions like this
    function getPitch(lat1, lon1, elev1, lat2, lon2, elev2, unit="deg") {
      var run = getDistance(lat1, lon1, lat2, lon2, "m");
      var rise = elev1 - elev2;
      
      // tan(angle) = opp/adj
      // angle = tan^-1(opp/adj)
      if (unit == "deg") { return radToDeg(Math.arctan(rise/run)) }
      else if (unit == "rad") { return Math.arctan(rise/run) }
    }

    function degToRad(deg) { return deg * (Math.PI/180) };
    function radToDeg(rad) { return rad * (180/Math.PI) };
    

    // Initialize and size the canvas
    function initDisplay() {
      //alert(window.orientation);
      viewWidth = window.innerWidth;
      viewHeight = window.innerHeight;
      c1.width = viewWidth;
      c1.height = viewHeight;
      ctx1.width = viewWidth;
      ctx1.height = viewHeight;

      // calc values
      w = c1.width;
      h = c1.height;
      textSizeA = Math.round( config_textSizeA*Math.min(w,h) );
      textSizeB = Math.round( config_textSizeB*Math.min(w,h) );
      textSizeC = Math.round( config_textSizeC*Math.min(w,h) );
      textSizeD = Math.round( config_textSizeD*Math.min(w,h) );
      subInfoASize = Math.round( config_subInfoASize*Math.min(w,h) );
      scx = Math.floor(w*config_speedocircx);
      scy = Math.floor(h*config_speedocircy);
      scr = Math.floor(Math.min(w,h)*config_speedocircr*0.5);
      scaa = Math.PI*2*config_speedocircaa;
      scab = Math.PI*2*config_speedocircab + Math.PI*2;

      // flip context horizontally
      if (config_mirrorHud) { 
        ctx1.scale(-1, 1);
        ctx1.translate(-w, 0);
      };

      // Log the values
      /*logStr = "window.innerWidth = " + window.innerWidth + "<br>window.innerHeight = " + window.innerHeight
             + "<br>window.outerWidth = " + window.outerWidth + "<br>window.outerHeight = " + window.outerHeight
             + "<br>screen.width = " + screen.width + "<br>screen.height = " + screen.height + "<br><br>";
      errorLog.innerHTML = logStr;
      */
    }
    

    // Request fullscreen
    function toggleFullscreen(event) {
      //var touchTime = new Date();
      //var touchMs = touchTime.getTime();
      //var touchInterval = touchTime - prevTouchTime;
      //if (touchInterval < 500) {
        // if fullscreen not active, activate it
        if (!document.fullscreenElement &&    // alternative standard method
            !document.mozFullScreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement ) { 
          //c1.style.visibility = "visible";
          if (c1.requestFullscreen) {
            c1.requestFullscreen();
          } else if (c1.msRequestFullscreen) {
            c1.msRequestFullscreen();
          } else if (c1.mozRequestFullScreen) {
            c1.mozRequestFullScreen();
          } else if (c1.webkitRequestFullscreen) {
            c1.webkitRequestFullscreen();
          }
        } else {
          //c1.style.visibility = "hidden";
          if (document.exitFullscreen) {
            document.exitFullscreen();
          } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
          } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
          } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
          }
        }
      //}
      //prevTouchTime = touchTime;
      //logStr = logStr + "Touch at " + touchTime  + "<br />";
      //errorLog.innerHTML = logStr;
    }
    //c1.addEventListener("touchstart", toggleFullscreen);
    //c1.addEventListener("mousedown", toggleFullscreen);


    function updateTime() {
      var dateObj = new Date();
      var year = dateObj.getFullYear();
      var month = dateObj.getMonth();
      var date = dateObj.getDate();
      var day = dateObj.getDay();
      var hour = dateObj.getHours();
      var min = dateObj.getMinutes();
      var ampm = "am";
      dateStr = "";
      timeStr = "";

      // Day of week
      switch (day) {
        case 0: dateStr += "Sun "; break;
        case 1: dateStr += "Mon "; break;
        case 2: dateStr += "Tue "; break;
        case 3: dateStr += "Wed "; break;
        case 4: dateStr += "Thu "; break;
        case 5: dateStr += "Fri "; break;
        case 6: dateStr += "Sat "; break;
      }

      // Month
      /*switch (month) {
        case  0: dateStr += "Jan "; break;
        case  1: dateStr += "Feb "; break;
        case  2: dateStr += "Mar "; break;
        case  3: dateStr += "Apr "; break;
        case  4: dateStr += "May "; break;
        case  5: dateStr += "Jun "; break;
        case  6: dateStr += "Jul "; break;
        case  7: dateStr += "Aug "; break;
        case  8: dateStr += "Sep "; break;
        case  9: dateStr += "Oct "; break;
        case 10: dateStr += "Nov "; break;
        case 11: dateStr += "Dec "; break;
        default: dateStr += "? ";   break;
      }*/
      dateStr += (month+1).toString() + "/";

      // Day of month
      //dateStr += date.toString() + ", " + year.toString();
      dateStr += date.toString() + "/" + year.toString();

      // Time
      if (hour == 0) {hour = 12}
      else if (hour > 12) {hour -= 12; ampm = "pm"}
      timeStr = hour.toString() + ":";
      if (min < 10) { timeStr += "0" + min.toString() }
      else { timeStr += min.toString() }
      //timeStr += ampm;
    }

    // Initialization function.
    // - set position watch function
    // - set animation function
    function initGeo() {
    };

    //function updatePosition (position) {
    //  console.log( "OLD UPDATE POSITION CALLED!" );
    //  return;
    //}

  // =============================================================================================================================
  function updatePosition2 () {
      //console.log( "NEW UPDATE POSITION CALLED!" );
    
      try {   
        // calc values
        // trip meter
        if( priorLat !== -1 ) {
          var distIncrement = getDistance( priorLat, priorLon, gpsLatitude, gpsLongitude );
          tripMilesA += distIncrement;
        }
        priorLat = gpsLatitude;
        priorLon = gpsLongitude;
        priorAltitude = gpsAltitude;
    
        //console.log( "New update position - Lat: " + gpsLatitude + " Lon:" + gpsLongitude + " Speed:" + gpsSpeed );
    
      // Make formatted strings
      // Speed
      if ((gpsSpeed < 0) || (gpsSpeed.toString() == "NaN")) {
          speedStr = "---"
      } else {
          speedStr = Math.round( gpsSpeed ).toString()
      };
      
      if (gpsSpeed <= 3) {
        gpsTrack = priorHeading;
      } else {
        priorHeading = gpsTrack;
      };

          // Direction
          if ( gpsTrack === undefined ) { posDirection = "---" }
          else if (gpsTrack < 0) {posDirection = ""}
          else if (gpsTrack > 348.75 || gpsTrack <=  11.25) {posDirection = "N"  }
          else if (gpsTrack >  11.25 && gpsTrack <=  33.75) {posDirection = "NNE"}
          else if (gpsTrack >  33.75 && gpsTrack <=  56.25) {posDirection = "NE" }
          else if (gpsTrack >  56.25 && gpsTrack <=  78.75) {posDirection = "ENE"}
          else if (gpsTrack >  78.75 && gpsTrack <= 101.25) {posDirection = "E"  }
          else if (gpsTrack > 101.25 && gpsTrack <= 123.75) {posDirection = "ESE"}
          else if (gpsTrack > 123.75 && gpsTrack <= 146.25) {posDirection = "SE" }
          else if (gpsTrack > 146.25 && gpsTrack <= 168.75) {posDirection = "SSE"}
          else if (gpsTrack > 168.75 && gpsTrack <= 191.25) {posDirection = "S"  }
          else if (gpsTrack > 191.25 && gpsTrack <= 213.75) {posDirection = "SSW"}
          else if (gpsTrack > 213.75 && gpsTrack <= 236.25) {posDirection = "SW" }
          else if (gpsTrack > 236.25 && gpsTrack <= 258.75) {posDirection = "WSW"}
          else if (gpsTrack > 258.75 && gpsTrack <= 281.25) {posDirection = "W"  }
          else if (gpsTrack > 281.25 && gpsTrack <= 303.75) {posDirection = "WNW"}
          else if (gpsTrack > 303.75 && gpsTrack <= 326.25) {posDirection = "NW" }
          else if (gpsTrack > 326.25 && gpsTrack <= 348.75) {posDirection = "NNW"}
          ;
          
          //console.log( "updatePos2 gecodeRoad:" + geocodeRoad + ", geocodeTown:" + geocodeTown );
          if ((geocodeRoad == null) || (geocodeRoad == "undefined")) {
            //console.log( "ONE!!!!!!!!!!" );
            sub1Str = "---";
          } else {
            //console.log( "TWO!!!!!!!!!!" );
            sub1Str = geocodeRoad;
          }

          if ((geocodeTown == null) || (geocodeTown == "undefined")) {
            //console.log( "THREE!!!!!!!!!!" );
            sub2Str = geocodeCounty + ", " + geocodeState;
          } else {
            //console.log( "FOUR!!!!!!!!!!" );
            sub2Str = geocodeTown + ", " + geocodeState;
          }

      //console.log( "sub1str [" + sub1Str + "]" );
      //console.log( "sub2str [" + sub2Str + "]" );
    } catch(ex) {
      logStr = logStr + "Position Error " + ex.code  + ": " + ex.message + "<br />";
      console.log( logStr );
      //errorLog.innerHTML = logStr;
    }
  }

    function updateGeocode() {
    }

    function handlePosError(ex) {
        logStr = logStr + "Position Error " + ex.code  + ": " + ex.message + "<br />";
        console.log( logStr );
        //errorLog.innerHTML = logStr;
    };
    
    function draw() {
      console.log( "OLD DRAW CALLED!" );
      return;
    };

// ==============================================================================================================================
function draw2() {
  //console.log( "NEW DRAW CALLED!" );
  try {

    // *** Moved getting the obj values to updateGeocode() ***

    // calc values
    // trip meter
    if( priorLat !== -1 ) {
      var distIncrement = getDistance( priorLat, priorLon, gpsLatitude, gpsLongitude );
      tripMilesA += distIncrement;
    }

    //console.log( "New draw - Lat: " + gpsLatitude + " Lon:" + gpsLongitude + " Speed:" + gpsSpeed );

    //gpsInfo.innerHTML = "<br>Speed: " + gpsSpeed + "<br>Heading: " + gpsTrack + "<br>Accuracy: " + gpsHDOP + "<br>Trip: " + tripMilesA;

    //ctx1.clearRect(0,0,w,h);
    ctx1.fillStyle = config_colorScheme[0];
    ctx1.fillRect(0,0,w,h);

    // Date and time
    ctx1.beginPath(); // Date
    ctx1.fillStyle = config_colorScheme[3];
    ctx1.font = textSizeD.toString() + "px " + config_subInfoAFont;
    var dateWidth = ctx1.measureText(dateStr).width;
    var dateHeight = ctx1.measureText(dateStr).height;
    //ctx1.fillText(dateStr, (w*config_datex)-(dateWidth*1.0), (h*config_datey));
    ctx1.closePath();
    ctx1.beginPath(); // Time
    ctx1.fillStyle = config_colorScheme[1];
    ctx1.font = textSizeC.toString() + "px " + config_subInfoAFont;
    var timeWidth = ctx1.measureText(timeStr).width;
    var timeHeight = ctx1.measureText(timeStr).height;
    ctx1.fillText(timeStr, (w*config_timex)-(timeWidth*1.0), (h*config_timey));
    ctx1.closePath();

    // Speedo outer-circle (current speed)
    if (gpsSpeed >= 0) {var needleAngle = scaa + ((scab-scaa)*(gpsSpeed/config_speedomax))} else {var needleAngle = scaa};
    ctx1.strokeStyle = config_colorScheme[2];
    ctx1.lineWidth = scr*config_speedocircthickness;
    ctx1.beginPath();
    ctx1.arc(scx, scy, scr, scaa, needleAngle);
    ctx1.stroke();
    ctx1.closePath();

    // Speedo outer-circle range
    ctx1.strokeStyle = config_colorScheme[5];
    ctx1.lineWidth = 1;
    ctx1.beginPath();
    ctx1.arc(scx, scy, scr-(scr*config_speedocircthickness*0.5), scaa, scab);
    ctx1.stroke();
    ctx1.closePath();        

    // speedo needle
    ctx1.fillStyle = config_colorScheme[0];
    ctx1.strokeStyle = config_colorScheme[1];
    ctx1.lineWidth = 0.5;
    ctx1.beginPath();
    // draaw the polygon clockwise from top-right (when pointing up)
    ctx1.moveTo(
      scx + ( -Math.sin( needleAngle+(scr*config_speedoneedlewidthb)-(Math.PI/2) ) * (scr+(scr*config_speedoneedlelength)+(scr*config_speedoneedleroffset) ) ),
      scy + ( Math.cos( needleAngle+(scr*config_speedoneedlewidthb)-(Math.PI/2) ) * (scr+(scr*config_speedoneedlelength)+(scr*config_speedoneedleroffset) ) )
    );
    ctx1.lineTo(
      scx + ( -Math.sin( needleAngle+(scr*config_speedoneedlewidtha)-(Math.PI/2) ) * (scr-(scr*config_speedoneedlelength)+(scr*config_speedoneedleroffset) ) ),
      scy + ( Math.cos( needleAngle+(scr*config_speedoneedlewidtha)-(Math.PI/2) ) * (scr-(scr*config_speedoneedlelength)+(scr*config_speedoneedleroffset) ) )
    );
    ctx1.lineTo(
      scx + ( -Math.sin( needleAngle-(scr*config_speedoneedlewidtha)-(Math.PI/2) ) * (scr-(scr*config_speedoneedlelength)+(scr*config_speedoneedleroffset) ) ),
      scy + ( Math.cos( needleAngle-(scr*config_speedoneedlewidtha)-(Math.PI/2) ) * (scr-(scr*config_speedoneedlelength)+(scr*config_speedoneedleroffset) ) )
    );
    ctx1.lineTo(
      scx + ( -Math.sin( needleAngle-(scr*config_speedoneedlewidthb)-(Math.PI/2) ) * (scr+(scr*config_speedoneedlelength)+(scr*config_speedoneedleroffset) ) ),
      scy + ( Math.cos( needleAngle-(scr*config_speedoneedlewidthb)-(Math.PI/2) ) * (scr+(scr*config_speedoneedlelength)+(scr*config_speedoneedleroffset) ) )
    );
    ctx1.lineTo(
      scx + ( -Math.sin( needleAngle+(scr*config_speedoneedlewidthb)-(Math.PI/2) ) * (scr+(scr*config_speedoneedlelength)+(scr*config_speedoneedleroffset) ) ),
      scy + ( Math.cos( needleAngle+(scr*config_speedoneedlewidthb)-(Math.PI/2) ) * (scr+(scr*config_speedoneedlelength)+(scr*config_speedoneedleroffset) ) )
    );

    // make gradient. (x0, y0, x1, y1)
    var grd = ctx1.createLinearGradient(
      scx + ( -Math.sin( needleAngle-(Math.PI/2) ) * (scr-(scr*config_speedoneedlelength)+(scr*config_speedoneedleroffset) ) ),
      scy + ( Math.cos( needleAngle-(Math.PI/2) ) * (scr-(scr*config_speedoneedlelength)+(scr*config_speedoneedleroffset) ) ),
      scx + ( -Math.sin( needleAngle-(Math.PI/2) ) * (scr+(scr*config_speedoneedlelength)+(scr*config_speedoneedleroffset) ) ),
      scy + ( Math.cos( needleAngle-(Math.PI/2) ) * (scr+(scr*config_speedoneedlelength)+(scr*config_speedoneedleroffset) ) ),
    );
    grd.addColorStop(0.00, config_colorScheme[0]);
    //grd.addColorStop(0.80, config_colorScheme[1]);
    grd.addColorStop(1.00, config_colorScheme[6]);
    //grd.addColorStop(1.00, config_colorScheme[1]);
    //grd.addColorStop(1.00, config_colorScheme[6]);
    ctx1.fillStyle = grd;
    ctx1.fill();
    //ctx1.stroke();
    ctx1.closePath();
    
    // compass ring
    //compassAngle = (gpsTrack*(Math.PI/180));
    // marker arc
    //  ctx1.strokeStyle = config_colorScheme[3];
    //  ctx1.lineWidth = config_hudCompass.arcThickness;
    //  ctx1.beginPath();
    //  aa = -compassAngle-(Math.PI/2)-(Math.PI*2*config_hudCompass.arcSize);
    //  bb = -compassAngle-(Math.PI/2)+(Math.PI*2*config_hudCompass.arcSize);

     // ctx1.arc( scx, scy, scr*config_hudCompass.radius, -compassAngle-(Math.PI/2)-(Math.PI*2*config_hudCompass.arcSize), -compassAngle-(Math.PI/2)+(Math.PI*2*config_hudCompass.arcSize) );

//	console.log( "----------------------------------------------------------" );
//	console.log( "TRACK: " + gpsTrack );
//	console.log( "ANGLE: " + compassAngle );
//	console.log( "AA: " + aa );
//	console.log( "BB: " + bb );
//
 //     ctx1.stroke();
  //    ctx1.closePath();
    // marker center
   //   ctx1.strokeStyle = config_colorScheme[1];
    //  ctx1.lineWidth = config_hudCompass.centerThickness;
     // ctx1.beginPath();
   //   ctx1.arc( scx, scy, scr*config_hudCompass.radius, -compassAngle-(Math.PI/2)-(Math.PI*2*config_hudCompass.centerSize), -compassAngle-(Math.PI/2)+(Math.PI*2*config_hudCompass.centerSize) );
   //   ctx1.stroke();
   //   ctx1.closePath();
    
    // Top Info - digital speed
    ctx1.fillStyle = config_colorScheme[1];
    ctx1.font = textSizeA.toString() + "px " + config_textFontA;
    var spdWidth = ctx1.measureText(speedStr).width;
    ctx1.beginPath();
    ctx1.fillText(speedStr, scx-(spdWidth*0.90), scy);
    ctx1.font = textSizeC.toString() + "px " + config_textFontC;
    ctx1.fillText(" mph", scx+(scr*0.10), scy);
    ctx1.closePath();

    // Bottom info - simple compass
    ctx1.fillStyle = config_colorScheme[1];
    ctx1.font = textSizeB.toString() + "px " + config_textFontB;
    infoBwidth = ctx1.measureText(posDirection).width;
    infoBheight = ctx1.measureText(posDirection).height;
    ctx1.beginPath();
    ctx1.fillText(posDirection, scx-(infoBwidth*0.5), scy+textSizeB+(h*0.025));
    ctx1.closePath();

    // Sub Info: divider
    var divX = w*0.25;
    var divW = w*0.50;
    var grd = ctx1.createLinearGradient(divX, 0, divX+divW, 0);
    grd.addColorStop(0, config_colorScheme[0]);
    grd.addColorStop(0.5, config_colorScheme[3]);
    grd.addColorStop(1, config_colorScheme[0]);
    ctx1.fillStyle = grd;
    ctx1.fillRect(divX, (h*config_subInfoAy)-(h*config_subInfoLineHeight), divW, h*0.005);

    // Sub Info: street name; neighborhood, city
    ctx1.beginPath();
    ctx1.fillStyle = config_colorScheme[1];
    ctx1.font = subInfoASize.toString() + "px " + config_subInfoAFont;
    var l1Width = ctx1.measureText(sub1Str).width;
    var l1Height = ctx1.measureText(sub1Str).height;
    ctx1.fillText(sub1Str, (w*config_subInfoAx)-(l1Width*0.5), (h*config_subInfoAy));
    ctx1.closePath();

    ctx1.beginPath();
    ctx1.fillStyle = config_colorScheme[3];
    var l2Width = ctx1.measureText(sub2Str).width;
    var l2Height = ctx1.measureText(sub2Str).height;
    ctx1.fillText(
      sub2Str, 
      (w*config_subInfoAx)-(l2Width*0.5), 
      (h*config_subInfoAy)+(h*config_subInfoLineHeight)
    );
    //logStr = logStr + subInfoASize + ", " + textSizeA + "<br />";
    //errorLog.innerHTML = logStr;
    ctx1.closePath();

  } catch(ex) {
    logStr = logStr + " " + ex;
    console.log( logStr );
    //errorLog.innerHTML = logStr;
  }
};


    // Iterator function.  Run the repeating functions at their respective run rates.
    var t;  // current time
    var t0 = Date.now(); // initial time ("t naught")
    var tStamp_updateGeocode;
    var nRuns_updateGeocode;
    var tStamp_draw;
    var nRuns_draw;
    
    function tickScheduler() {
      t = Date.now();
      // schedule updateGeocode()
      requestAnimationFrame(tickScheduler);
    }


    window.addEventListener('beforeunload', function (e) {
        console.log("Unload called!");
        client.disconnect();
    });


    var client = null;
    function connect() {
      //var broker = "ws://192.168.161.215:9001/mqtt";
      var broker = "ws://10.42.0.1:9001/mqtt";
      var clientId = "clientId-" + Math.random().toString(16).substr(2, 8);
      client = new Paho.MQTT.Client(broker, clientId);
      client.onConnectionLost = onConnectionLost;
      client.onMessageArrived = onMessage;
      client.connect({ onSuccess: onConnect });
    }

    function onConnect() {
      console.log("***Connected!");
      //var topic = document.getElementById("topic").value;
      client.subscribe("GPS/#");
    }

    function onConnectionLost(responseObject) {
      console.log("Connection lost: " + responseObject.errorMessage);
    }

    function onMessage(message) {
      //console.log("Received MQTT message: " + message.payloadString);
      var gpsData = JSON.parse( message.payloadString );

      var topic = gpsData.topic;
      if (topic.includes( "TRACK" )) {
        gpsTrack = gpsData.track;
      } else if (topic.includes( "SPEED" )) {
        gpsSpeed = gpsData.speed;
      } else if (topic.includes( "GEOCODE" )) {
        geocodeRoad  = gpsData.road;
        geocodeTown  = gpsData.town;
        geocodeCounty = gpsData.county;
        geocodeState = gpsData.state;
        geocodeZip = gpsData.zip;
        //console.log( "Geocode message arrived. Road:" + geocodeRoad + ", Town:" + geocodeTown + ", County:" + geocodeCounty );
      } else {

        // {"topic":"GPS","version":"2.0", "dateTime":"2024-02-29T09:34:00-0700", "mode":"Initializing", 
        //  "latitude":0.000000, "longitude":0.000000, "altitude":0.00, "speed":0.0, "track":0.0, "climb":0.0, 
        //  "GDOP":"EXCELLENT", "HDOP":"EXCELLENT", "VDOP":"EXCELLENT", "distance":0.00}
        gpsLatitude = gpsData.latitude;
        gpsLongitude = gpsData.longitude;
        gpsAltitude = gpsData.altitude;
        // skip speed and track for now
      }
      updatePosition2( );
      //draw2( );
    }
    

    // Main function
    var interval_updateGeocode;
    var interval_draw;
    var interval_updateTime;
    function main() {
      // Initialize
      initDisplay();
      initGeo();

      console.log("Initialize called!");
      connect();

      interval_updateTime = setInterval(
        function() {updateTime()},
        1000
      );

      interval_updateGeocode = setInterval(
        function() {updatePosition2()},
        config_geocodeRefreshRate
      );

      interval_draw = setInterval( 
        function() {draw2()},
        1000/config_fps
      );

      window.addEventListener("orientationchange", initDisplay);
      window.onresize = initDisplay;
      //fTimeout = setTimeout(draw, config_fps);
    };
    main();
    

} catch(ex) {
  logStr = logStr + ex + "<br />";
  console.log( logStr );
  // errorLog.innerHTML = logStr;
}
