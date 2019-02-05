var canvas = document.querySelector("canvas");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

var c = canvas.getContext('2d');
    


    
   
   
 var ellipse = function(x,y){
    c.beginPath();
    c.arc(x,y,30,0,Math.PI * 2,false);
    c.strokeStyle = "FF0000";
    c.stroke();
  }
  
for(var i = 0; i < 1000; i ++){
    var x = Math.random() * window.innerWidth;
    var y = Math.random() * window.innerHeight;
    ellipse(x,y);
} 
// var x = 0;
// var draw = function(){
//     if(x=400){

//     } else{
//     ellipse(x,100)
//     x++;
//     }
// }
