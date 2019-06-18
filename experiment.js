var canvas = document.querySelector("canvas");



// canvas.width = window.innerWidth;
// canvas.height = window.innerHeight;

var c = canvas.getContext('2d');
var flipNumber = 0;
var circle = 0;
var square = 0;

var coinFlip = function(){

var ellipse = function(x,y){
    c.beginPath();
    c.arc(x,y,30,0,Math.PI * 2,false);
    c.strokeStyle = "FF0000";
    c.stroke();
  }
  
  var sq = function(x,y,w,h){
      c.fillRect(x,y,w,h);
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
  sq(canvas.width/2 - 30,canvas.height/2 - 30,50,50);
  square += 1;
}
if (Weight <= 0){
  ellipse(canvas.width/2,canvas.height/2);
  circle += 1;
}
document.getElementById("heads or tails counter").innerHTML = "square = " + square + "  circle = " + circle;
}
var auto = function(){
  setInterval(coinFlip,10);
}
