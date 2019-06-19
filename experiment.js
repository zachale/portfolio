var canvas = document.querySelector("canvas");



// canvas.width = window.innerWidth;
// canvas.height = window.innerHeight;

var c = canvas.getContext('2d');
var flipNumber = 0;
var white = 0;
var black = 0;

var coinFlip = function(){


  var sq = function(x,y,w,h,c){
      c.Rect(x,y,w,h);
      c.fill(c);
  }
 


var flip = Math.random(0,1);
var Weight = Math.round(flip);

console.log(Weight);
//console.log("flip " + flip);
console.log("The flip number is " + flipNumber);

flipNumber += 1;

document.getElementById("flipNumber").innerHTML="you are on flip " + flipNumber;

c.clearRect(0, 0, canvas.width, canvas.height);

if (Weight >= 1){
  sq(canvas.width/2,canvas.height/2,50,50,FFFFFF);
  square += 1;
}
if (Weight <= 0){
   sq(canvas.width/2,canvas.height/2,50,50,000000);
  circle += 1;
}
document.getElementById("heads or tails counter").innerHTML = "black = " + white + "  black = " + black;
}
var auto = function(){
  setInterval(coinFlip,10);
}
