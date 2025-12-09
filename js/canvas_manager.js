//sets the graphing coordinate constraints
const maxX = 150;
const maxY = 150;
//pre creates variables for all the main parts of the sim
var focused_button = null;
var canvas = null;
var ctx = null;
var sim = null;
var scalingFactor = null;
var renderingScale = 1;

//for ctrl + (key) events
var controlPressed = false;

//for client bounding rect
var rect = null;

//Storage for maintaining the connection between dt and fps
var lastFrameTime = null;

//resizeEventStuff
var oldWidth = 0;
var oldHeight = 0;

function create_onclick_events(){
    let buttons = document.getElementsByClassName("spawn_button");
    //create all spawn button events
    for (let i = 0; i < buttons.length; i++){
        buttons[i].addEventListener("mousedown", onclick_event)
    }
}
/**
 * if a click is released, place the object that corresponds with the button that was pressed
 * @param {*} event 
 */
function click_released(event){
  
  let x = event.clientX - rect.left;
  let y = event.clientY - rect.top;

  //scaled to between 0 to maxX/maxY 
  let xScaled = maxX * (x / rect.width);
  let yScaled = maxY * (y / rect.height);

  //in bounds
  if(!( x < 0 || y < 0 || x > rect.width || y > rect.height)){

    switch(buttonID){
      case "fixed_spawn":
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
  //reset event listeners and classes
  let main = document.getElementById("main")
  main.classList.remove('hover_with_obj');
  document.removeEventListener('mouseup', click_released)
} 
/**
 * A click event function for buttons 
 * @param {*} event 
 */
function onclick_event(event){
  button = event.srcElement
  buttonID = event.srcElement.id
  document.addEventListener('mouseup', click_released);

  let main = document.getElementById("main");
  main.classList.add('hover_with_obj');
  
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

    let canvasWidth1 = obj1.width * scalingFactor
    let canvasHeight1 = obj1.height * scalingFactor
    let canvasWidth2 = obj2.width * scalingFactor
    let canvasHeight2 = obj2.height * scalingFactor

    obj1X -= canvasWidth1/2;
    obj1Y -= canvasHeight1/2;

    obj2X -= canvasWidth2/2;
    obj2Y -= canvasHeight2/2;

    ctx.beginPath();
    ctx.strokeStyle = '#c21212ff';
    ctx.lineWidth = 3
    ctx.moveTo(obj1X + (canvasWidth1)/2, obj1Y + (canvasHeight1)/2);
    ctx.lineTo(obj2X + (canvasWidth2)/2, obj2Y + (canvasHeight2)/2);

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

    let topCornerX = xCanvas - (canvasWidth/2);
    let topCornerY = yCanvas - (canvasHeight/2);
    ctx.fillRect(topCornerX, topCornerY, canvasWidth , canvasHeight);
    ctx.fillStyle = '#76acadff';
    if(obj.border){
      ctx.strokeRect(topCornerX, topCornerY, canvasWidth, canvasHeight);
    }
    let fontSize =  String(5 * scalingFactor);
    ctx.font = fontSize + 'px bold arial'
    ctx.fillText(i, xCanvas , yCanvas )
    
  }
  ctx.fill();
  ctx.stroke();
}

function draw(currentTime){
  const fps = 30
  const dt = 0.001
  let elapsedTime = currentTime - lastFrameTime;
  //dt is 1ms, there are 30 fps, elapsed time is 
  
  if (elapsedTime > 1000/fps){
    // in case fps is low, the sim adjusts each subsequent number
    // of steps to fit real-time simulation
    let stepCount = Math.round(elapsedTime / ( 1000 * dt ));
    // DEBUG: let stepCount = 1;
    //clear canvas
    ctx.beginPath();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fill();

    drawGrid();
    // draw muscles
    drawMuscles();

    // draw rects

    drawSquares();

    // update sim 
    //console.log(sim.t)
    for(let i = 0; i < stepCount; i++){
      //console.log(sim.t)
      sim.step(dt);
    }
    
    lastFrameTime = currentTime - (elapsedTime % (1000/fps));
    
  }
  requestAnimationFrame(draw); 
}
function drawGrid(){
  ctx.strokeStyle = '#a6a6a6';
  ctx.fillStyle = '#a6a6a6'
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  let fontSize =  String(4 * scalingFactor);
  ctx.font = fontSize + 'px bold arial'
  ctx.lineWidth = 1;
  for(let i = 0; i < Math.round(maxX / 10); i++){
    ctx.beginPath();
    //move to some incriment of 10 in graph coords 
    let graphingCoord = i * 10;
    let canvasCoord = graphingCoord * scalingFactor;
    let graphingCoordString = String(graphingCoord);

    //draw x lines
    ctx.fillText(graphingCoordString, canvasCoord, 0);
    ctx.moveTo(canvasCoord, 0);
    ctx.lineTo(canvasCoord, rect.height);
    ctx.stroke();
    
    //draw y lines
    ctx.fillText(graphingCoordString, 0, canvasCoord);
    ctx.moveTo(0, canvasCoord);
    ctx.lineTo(rect.width, canvasCoord);
    ctx.stroke();
  }
  
}
function resizeCanvas(){
  rect = canvas.getBoundingClientRect();
  canvas.width = rect.width;
  canvas.height = rect.height;

  scalingFactor = rect.width/maxX;

  oldWidth = canvas.width;
  oldHeight = canvas.height;

  //let spawnButtons = document.getElementsByClassName("spawn_button");
  
  
}
window.addEventListener("load", function() {
  sim = new PhysicsSim();
  demo1();

  canvas = document.getElementById("phys_sim");
  ctx = canvas.getContext("2d");

  canvas.addEventListener('click', leftClickCanvas);

  create_onclick_events();
  lastFrameTime = performance.now();
  resizeCanvas();
  requestAnimationFrame(draw);
});
/**
 * sets up the first demo visualization of the simulation(a cube following a circular motion)
 */
function demo1(){
  //create objects
  sim.createMoveableSquare(50, 50);//obj0
  sim.createFixedSquare(30, 30); //obj1
  sim.createFixedSquare(21.715729, 50)//obj2
  sim.createFixedSquare(30, 70)//obj3
  sim.createFixedSquare(78.284271, 50)//obj4
  sim.createFixedSquare(50, 78.284271)//obj5
  sim.createFixedSquare(70, 70)//obj6
  sim.createFixedSquare(70, 30)//obj7
  sim.createFixedSquare(50, 21.715729)//obj8

  let numFixed = 8;
  
  let freq = 1;
  // creates once muscle for each fixed object
  // shifts the activation pattern so that each muscle is activated freq
  // times a second and their activation peaks are evenly spaced across the full
  // stimulation cycle
  for(let i = 0; i < numFixed; i++){
    sim.createMuscle(sim.objects[0], sim.objects[1], 0, i + 1)

    let shift = (i / numFixed) * (1/freq);
    sim.forceAddingElements[i].muscle.setStimulation(shift, "sin", freq)
  }
  
}

function keyPressed(event){
  if(event.key === "Control"){
    console.log("Control Pressed")
    controlPressed = true;
  }
}
function keyReleased(event){
  if(event.key === "Control"){
    controlPressed = false;
  }
}

/**
 * A click event used for muscle creation. 
 * If control is pressed when clicking any subclass of rect, add that to the list of objects that will be getting a muscle.
 * Once two objects are clicked, create a muscle.
 * If you click a rect that has already been clicked, remove it from the list of objects.
 * @param {*} event 
 */
function leftClickCanvas(event) {
  event.preventDefault();

  const mouseX = event.clientX - canvas.getBoundingClientRect().left;
  const mouseY = event.clientY - canvas.getBoundingClientRect().top;
  const graphX = mouseX / scalingFactor;
  const graphY = mouseY / scalingFactor
  
  let borderCount = 0;
  //to prevent having to index a list
  let objectsWithBorders = {};
  console.log("Attempting to make a muscle")
  console.log(`MouseX: ${mouseY}, MouseY: ${mouseX}, graphX: ${mouseX/scalingFactor}, graphY: ${mouseY/scalingFactor}`)
  for(let i = 0; i < sim.objects.length; i++){
    let obj = sim.objects[i];

    if(controlPressed){
      //all squares are positioned center to x and y
      let widthModifier = obj.width/2;
      let heightModifier = obj.height/2;
      //if there was a square that got clicked
      if (graphX >= obj.x - widthModifier && graphX <= obj.x + widthModifier &&
          graphY >= obj.y - heightModifier && graphY <= obj.y + heightModifier) {
          console.log("Selecting: ", i)
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
  // if more than 1 object has a border create a muscle between the first two
  if(borderCount > 1){
    let objects = []
    for(const key in objectsWithBorders){
      let obj = objectsWithBorders[key]
      obj.border = false;
      objects.push([key, obj])
    }
    sim.createMuscle(objects[0][1], objects[1][1], objects[0][0], objects[1][0])
  }
}

//window events
window.addEventListener("resize", resizeCanvas)

//key events
document.addEventListener("keydown", keyPressed);
document.addEventListener("keyup", keyReleased);