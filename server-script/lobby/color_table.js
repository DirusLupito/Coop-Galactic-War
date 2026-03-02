var console = require('console'); // temporary workaround
var _ = require('thirdparty/lodash');

function rgbToHsv( r,g,b )
{
    r = r / 255;
    g = g / 255;
    b = b / 255;
    var minRGB = Math.min( r,g, b );
    var maxRGB = Math.max( r,g,b );
    var v = maxRGB;
    var delta = maxRGB - minRGB;
    var s = v ? delta / v : 0;
    var h;
    if (maxRGB == minRGB) {
        h = 0;
    } else {
        switch( maxRGB ) {
            case r: h = ( g - b ) / delta + ( g < b ? 6 : 0 ); break;
            case g: h = ( b - r ) / delta + 2; break;
            case b: h = ( r - g ) / delta + 4; break;
        }
        h = h / 6 * 360;
    }
    return { h: h, s: s, v: v };
}

function shvColourSort(colours) {
    var result = _.sortBy(colours, function(colour) {
        var hsv = rgbToHsv(colour[0], colour[1], colour[2] );
        var sort = hsv.s.toString(16) + hsv.h.toString(16) + hsv.v.toString(16);
        return sort;
    })
    return result;
}

var uberBrown = [142, 107, 68];
var AnonChocolateSpice = [74, 43, 0];
var sadleBrownCSS3x11 = [139, 69, 19];
var Red = [255, 0, 0];
var DarkRed = [128, 0, 0];
var AnonBloodOrange = [161, 59, 59];
var uberOrange = [255, 120, 47];
var Yellowish = [255, 200, 0];
var Gold = [139, 128, 0];
var Yellow = [255, 255, 0];
var Cyan = [0, 255, 255];
var NikAquamarine = [127, 255, 212];

var uberDarkGray = [70, 70, 70];
var Gray = [128, 128, 128];
var mediumGray = [164, 164, 164];
var White = [215, 215, 215];     
var Purple = [160, 32, 240];
var Violet = [128, 0, 255];
var Indigo = [75, 0, 130];
var AnonPurpleCandy = [84, 44, 94];

var uberDarkBlue = [59, 54, 182];          
var Navy = [22, 52, 102];               
var Azure = [0, 128, 255];             
var FadedBlue = [54, 78, 102];          
var uberMediumBlue = [51, 151, 197];        
var cornflowerBlueCSS3x11 = [100, 149, 237];
var powderBlueCSS3x11 = [176,224,230];
var mediumPurpleCSS3x11 = [147, 122, 219];
var Teal = [0, 128, 128];
var AnonCamoGreen = [72, 89, 61];
var AnonGreenApple = [50, 184, 50];
var Lime = [0, 255, 0];
var DarkGreen = [0, 128, 0];
var MediumSeaGreen = [0, 255, 128];
var LightSeaGreen = [32, 178, 170];
var MediumSpringGreen = [0, 250, 154];
var LawnGreen = [124, 252, 0];
var YellowGreen = [154, 205, 50];
var Khaki = [240, 230, 140];
var LightYellow = [255, 255, 224];
var PeachPuff = [255, 218, 185];
var LightPink = [255, 182, 193];
var LightSalmon = [255, 160, 122];
var Salmon = [250, 128, 114];
var Tomato = [255, 99, 71];
var RedOrange = [255, 69, 0];
var MediumVioletRed = [199, 21, 133];
var Magenta = [255, 0, 255];
var Orchid = [218, 112, 214];
var hotPinkCSS3x11 = [255, 105, 180];
var uberLightGray = [200,200,200];


var CSS3x11colours = [ uberBrown, AnonChocolateSpice, sadleBrownCSS3x11, Red, DarkRed, AnonBloodOrange, uberOrange, Yellowish, Gold, Yellow, Cyan, NikAquamarine, uberDarkGray, Gray, mediumGray, White, Purple, Violet, Indigo, AnonPurpleCandy, Navy, uberDarkBlue, Azure, uberMediumBlue, cornflowerBlueCSS3x11, powderBlueCSS3x11, mediumPurpleCSS3x11, FadedBlue, Teal, AnonCamoGreen, AnonGreenApple, Lime, DarkGreen,  MediumSeaGreen, LightSeaGreen, MediumSpringGreen, LawnGreen, YellowGreen, Khaki, LightYellow, PeachPuff, LightPink, LightSalmon, Salmon, Tomato, RedOrange, MediumVioletRed, Magenta, Orchid, hotPinkCSS3x11 ];

var brightnessAdjustment = 14/16;

CSS3x11colours = _.map(CSS3x11colours,function(colour) {

    var r = colour[0];
    var g = colour[1];
    var b = colour[2];

    if ( r == 255 || g == 255 || b == 255 ) {
        r = Math.round(r * brightnessAdjustment);
        g = Math.round(g * brightnessAdjustment);
        b = Math.round(b * brightnessAdjustment);
    }

    return [r, g, b];
});


//var colours = shvColourSort(uberColours.concat(CSS3x11colours));

var colours = CSS3x11colours;

exports.data = _.map(colours, function(colour) {
    var result = { primary: colour, secondary: colours };
    return result;
});
