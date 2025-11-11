
var focused_button = null;
var canvas = null;
var ctx = null;
var sim = null;
var scalingFactor = null;

var lastFrameTime = null;

function create_onclick_events(){
    let buttons = document.getElementsByClassName("spawn_button");
    //console.log(buttons)
    for (let i = 0; i < buttons.length; i++){
        buttons[i].addEventListener("mousedown", onclick_event)
    }
}
function onclick_event(event){
  //console.log("Clicked", event.srcElement)
  button = event.srcElement
  buttonID = event.srcElement.id
  document.addEventListener('mouseup', click_released);

  let main = document.getElementById("main");
  main.classList.add('hover_with_obj');
  
  function click_released(event){
    
    //gets coords of rect
    let rect = canvas.getBoundingClientRect();

    console.log(event, "\n", rect)

    let x = event.clientX - rect.left;
    let y = event.clientY - rect.top;
    console.log(x, y);
    let main = document.getElementById("main")
    switch(buttonID){
      case "fixed_spawn":
        console.log(buttonID);
        sim.createFixedSquare(x, y)
        break;
      case "move_spawn":
        break;
      case "fiber_spawn":
        break;
    }
    main.classList.remove('hover_with_obj');
    document.removeEventListener('mouseup', click_released)
  } 

}

function drawFixedSquares(){
  for(let i = 0; i < sim.fixedObjects.length; i++){
    let obj = sim.fixedObjects[i];
    ctx.rect(obj.x, obj.y, obj.width * scalingFactor , obj.height * scalingFactor);
  }

}

function draw(currentTime){
  const fps = 30
  let elapsedTime = currentTime - lastFrameTime;
  //1000 ms per second
  if (elapsedTime > 1000/fps){

    //start a new path so the old frame gets cleared
    ctx.beginPath();

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    lastFrameTime = currentTime - (elapsedTime % (1000/fps));
    //draw all the stuff from the sim

    drawFixedSquares();
    ctx.fill();
    
  }
  requestAnimationFrame(draw); 
}

function resizeCanvas(){
  let rect = canvas.getBoundingClientRect();
  canvas.width = rect.width;
  canvas.height = rect.height;
  scalingFactor = rect.width/150;
}
window.addEventListener("load", function() {
  sim = new PhysicsSim();
  canvas = document.getElementById("phys_sim");
  ctx = canvas.getContext("2d");
  create_onclick_events();
  lastFrameTime = performance.now();
  resizeCanvas();
  requestAnimationFrame(draw);


  
});
window.addEventListener("resize", resizeCanvas)
