const maxX = 100;
const maxY = 100
var focused_button = null;
var canvas = null;
var ctx = null;
var sim = null;
var scalingFactor = null;

var controlPressed = false;

var rect = null;

var lastFrameTime = null;

var oldWidth = 0;
var oldHeight = 0;

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

    //console.log(`Event ${event}.\nRect: ${rect}`)

    let x = event.clientX - rect.left;
    let y = event.clientY - rect.top;

    //scaled to between 0 to maxX/maxY 
    let xScaled = maxX * (x / rect.width);
    let yScaled = maxY * (y / rect.height);
    //console.log(`RawXY: ${x}, ${y} \nScaledXY(0 - maxY) ${xScaled}, ${yScaled}`)

    //in bounds
    if(!( x < 0 || y < 0 || x > rect.width || y > rect.height)){

      switch(buttonID){
        case "fixed_spawn":
          //console.log("Button ID: ", buttonID);
          sim.createFixedSquare(xScaled, yScaled)
          break;
        case "move_spawn":
          sim.createMoveableSquare(xScaled, yScaled)
          break;
      }
    }
    else{
      console.log("Out of bounds")
    }
    let main = document.getElementById("main")
    main.classList.remove('hover_with_obj');
    document.removeEventListener('mouseup', click_released)
  } 

}

function convertRawCoordsToCanvas(x, y){
  //converts 0 - maxX/maxY coords to canvas coords
  let xCanvas = x * rect.width / maxX
  let yCanvas = y * rect.height / maxY

  return [xCanvas, yCanvas]
}
function drawMuscles(){
  for(let i = 0; i < sim.forceAddingElements.length; i++){
    let element = sim.forceAddingElements[i];

    let obj1 = sim.objects[element.index1];
    let obj2 = sim.objects[element.index2];

    let [obj1X, obj1Y] = convertRawCoordsToCanvas(obj1.x, obj1.y);
    let [obj2X, obj2Y] = convertRawCoordsToCanvas(obj2.x, obj2.y);


    ctx.beginPath();
    ctx.strokeStyle = '#c21212ff';
    ctx.lineWidth = 3
    ctx.moveTo(obj1X + (obj1.width * scalingFactor)/2, obj1Y + (obj1.height * scalingFactor)/2);
    ctx.lineTo(obj2X + (obj2.width * scalingFactor)/2, obj2Y + (obj2.height * scalingFactor)/2);

    ctx.stroke();

  }
}
function drawSquares(){
  ctx.beginPath();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for(let i = 0; i < sim.objects.length; i++){

    let obj = sim.objects[i];

    ctx.fillStyle = obj.color;

    let canvasWidth = obj.width * scalingFactor;
    let canvasHeight = obj.height * scalingFactor;
    
    let [xCanvas, yCanvas] = convertRawCoordsToCanvas(obj.x, obj.y)
    //console.log("Scaled to fit current canvas:");
    //console.log(`CanvasXY: (${yCanvas}, ${yCanvas})`)


    ctx.fillRect(xCanvas, yCanvas, canvasWidth , canvasHeight);
    ctx.fillStyle = '#76acadff';
    if(obj.border){
      ctx.strokeRect(xCanvas, yCanvas, canvasWidth, canvasHeight);
    }
    let fontSize =  String(5 * scalingFactor);
    ctx.font = fontSize + 'px bold arial'
    ctx.fillText(i, xCanvas + canvasWidth/2, yCanvas + canvasHeight/2)
    
  }
  ctx.fill();
  ctx.stroke();
}

function draw(currentTime){
  const fps = 0.5
  const dt = 0.1
  let elapsedTime = currentTime - lastFrameTime;
  //1000 ms per second

  
  if (elapsedTime > 1000/fps){
    //clear canvas
    ctx.beginPath();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fill();

    // draw muscles
    drawMuscles();

    // draw rects

    drawSquares();

    // update sim 
    sim.step(dt);


    lastFrameTime = currentTime - (elapsedTime % (1000/fps));
    
  }
  requestAnimationFrame(draw); 
}

function resizeCanvas(){
  rect = canvas.getBoundingClientRect();
  canvas.width = rect.width;
  canvas.height = rect.height;
  scalingFactor = rect.width/150;
  oldWidth = canvas.width;
  oldHeight = canvas.height;

  
}
window.addEventListener("load", function() {
  sim = new PhysicsSim();
  sim.createFixedSquare(50, 50);
  sim.createMoveableSquare(20, 20 );

  sim.createMuscle(sim.objects[0], sim.objects[1], 0, 1)
  canvas = document.getElementById("phys_sim");
  ctx = canvas.getContext("2d");

  canvas.addEventListener('click', leftClickCanvas);

  create_onclick_events();
  lastFrameTime = performance.now();
  resizeCanvas();
  requestAnimationFrame(draw);
});

function keyPressed(event){
  if(event.key === "Control"){
    controlPressed = true;
  }
  if(event.key === "Space"){
    sleep(1000);
  }
}
function keyReleased(event){
  if(event.key === "Control"){
    controlPressed = false;
  }
}


function leftClickCanvas(event) {
  event.preventDefault();

  const mouseX = event.clientX - canvas.getBoundingClientRect().left;
  const mouseY = event.clientY - canvas.getBoundingClientRect().top;
  
  let borderCount = 0;
  //to prevent having to index a list
  let objectsWithBorders = {};

  for(let i = 0; i < sim.objects.length; i++){
    let obj = sim.objects[i];
    let [canvasX, canvasY] = convertRawCoordsToCanvas(obj.x, obj.y);
    
    let width = obj.width * scalingFactor;
    let height = obj.height * scalingFactor;

    if(controlPressed){
      //if there was a square that got clicked
      if (mouseX >= canvasX && mouseX <= canvasX + width &&
          mouseY >= canvasY && mouseY <= canvasY + height) {
          //if it hasn't been clicked yet, add it to the list of clicked
          if(obj.border == false){
            obj.border = true;
            objectsWithBorders[i] = obj;
            borderCount += 1;
          }else{
            //if it has been clicked, remove the border
            obj.border = false;
          }
      }
      else{
        //if there is a border on a square and it wasn't clicked
        if(obj.border){
          objectsWithBorders[i] = obj;
          borderCount += 1;
        }
      }
    }
    //if control is not pressed and someone clicked clear all borders
    else{
      obj.border = false;
    }
  }
  if(borderCount > 1){
    let objects = []
    for(const key in objectsWithBorders){
      let obj = objectsWithBorders[key]
      obj.border = false;
      objects.push([key, obj])
    }
    sim.createMuscle(objects[0][1], objects[1][1], objects[0][0], objects[1][0])
    //console.log(sim.forceAddingElements);
  }


}
function sleep(miliseconds) {
   var currentTime = new Date().getTime();

   while (currentTime + miliseconds >= new Date().getTime()) {
   }
}

window.addEventListener("resize", resizeCanvas)

document.addEventListener("keydown", keyPressed);
document.addEventListener("keyup", keyReleased);
