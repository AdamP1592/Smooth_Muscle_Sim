//sets the graphing coordinate constraints
const maxX = 150;
const maxY = 150;

const PropertyViewWidth = 30;
const PropertyViewHeight = 20;
const PropertyViewFontSize = 5;

//pre creates variables for all the main parts of the sim
var focused_button = null;
var canvas = null;
var ctx = null;
var sim = null;
var scalingFactor = null;
var renderingScale = 1;
var startTime = 0;

//for ctrl + (key) events
var controlPressed = false;

//for client bounding rect
var rect = null;

//for property view
var propView = null;

//Storage for maintaining the connection between dt and fps
var lastFrameTime = null;

//pausing
var isPaused = false;

//resizeEventStuff
var oldWidth = 0;
var oldHeight = 0;
var resizeTimeout;
var defaultScrollX = 0;
var defaultScrollY = 0;

//hover event stuff
var mouseHoverX = 0;
var mouseHoverY = 0;


/**
 * Takes in x and y in graphing coordinates.
 * Checks if those graphing coordinates fall within the given rect
 * @param {Number} x 
 * @param {Number} y 
 * @param {Rect} rect 
 * @param {String} positioning 
 */
function isWithinRect(x, y, rect, positioning="centered"){
  // IF ANYTHING IS POSITIONED IN A DIFFERENT WAY(eg. bottomright) ADD THEM HERE
  let leftSide = rect.x;
  let topSide = rect.y;

  let rightSide = rect.x + rect.width;
  let bottomSide = rect.y + rect.height;
  
  if(positioning === "centered"){

    let widthDisplacement = rect.width * 0.5;
    let heightDisplacement = rect.height * 0.5;

    leftSide -= widthDisplacement;
    topSide -= heightDisplacement;

    rightSide -= widthDisplacement;
    bottomSide -= heightDisplacement;

  }

  return (x > leftSide && x < rightSide) && (y > topSide  && y < bottomSide)
}
/**
 * 
 * @param {*} x 
 * @param {*} y 
 * @returns 
 */
function convertClientCoordsToGraph(x, y, debug=false){

  x += window.scrollX;
  y += window.scrollY;
  // For some reason when the page loads with a default x offset, client.bounding
  // rect gives a negative value for something you can actually scroll to, even
  // if I get the bounding rect in this function

  /* This is technically how you can resolve it, but it's more efficient to just clamp
  if(rect.left == -window.scrollX && window.scrollX != 0){
    x -= window.scrollX
  }
  if(rect.top == -window.scrollY && window.scrollY != 0){
    y -= window.scrollY;
  }
  */
  const canvasX = x - Math.max(0, rect.left);
  const canvasY = y - Math.max(0, rect.top);
  const graphX = canvasX / scalingFactor;
  const graphY = canvasY / scalingFactor;
  if(debug){
    console.log(`
    x: ${Math.round(x)}, y:${Math.round(y)}
    ScrollX: ${window.scrollX}, ScrollY:${window.scrollY}
    CanvasX: ${canvasX}, CanvasY:${canvasY}
    GraphX: ${graphX}, GraphY: ${graphY}
    RectLeft: ${rect.left}, RectTop:${rect.top}
    `);
    console.log(rect)
  }

  return [graphX, graphY]
}
/**
 * converts graphing x and y to canvas coords
 * @param {Number} x 
 * @param {Number} y 
 * @returns 
 */
function convertGraphCoordsToCanvas(x, y){
  //converts 0 - maxX/maxY coords to canvas coords

  let xCanvas = x * scalingFactor
  let yCanvas = y * scalingFactor
  
  return [xCanvas, yCanvas]
}
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
  let x = event.clientX;
  let y = event.clientY;

  let [graphX, graphY] = convertClientCoordsToGraph(x, y, true)
  console.log(x, y, graphX, graphY)
  //in bounds
  if(!( graphX < 0 || graphX < 0 || graphX > maxX || graphX > maxY)){

    switch(buttonID){
      case "fixed_spawn":
        sim.createFixedSquare(graphX, graphY)
        break;
      case "move_spawn":
        sim.createMoveableSquare(graphX, graphY)
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

function drawMuscles(){
  for(let i = 0; i < sim.forceAddingElements.length; i++){
    let element = sim.forceAddingElements[i];

    let obj1 = sim.objects[element.index1];
    let obj2 = sim.objects[element.index2];

    let [obj1X, obj1Y] = convertGraphCoordsToCanvas(obj1.x, obj1.y);
    let [obj2X, obj2Y] = convertGraphCoordsToCanvas(obj2.x, obj2.y);

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
function drawElements(){
  ctx.beginPath();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for(let i = 0; i < sim.objects.length; i++){

    let obj = sim.objects[i];

    ctx.fillStyle = obj.color;

    let canvasWidth = obj.width * scalingFactor;
    let canvasHeight = obj.height * scalingFactor;
    
    let [xCanvas, yCanvas] = convertGraphCoordsToCanvas(obj.x, obj.y)

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
  const fps = 60
  const dt = 0.001
  let elapsedTime = currentTime - lastFrameTime;
  //dt is 1ms, there are 30 fps, elapsed time is 
  if(!isPaused){
    let currentTimeSeconds = currentTime/1000;
    let stepCount = Math.round((currentTimeSeconds - sim.t)  / dt);
    //console.log(elapsedTime, stepCount)
    for(let i = 0; i < stepCount; i++){
      sim.step(dt);
    }
  }

  if (elapsedTime > 1000/fps){
    //every second
    // in case fps is low, the sim adjusts each subsequent number
    // of steps to fit real-time simulation
    
    // DEBUG: let stepCount = 1;
    //clear canvas
    ctx.beginPath();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fill();

    // draw grid
    drawGrid();
    // draw muscles
    drawMuscles();
    // draw rects
    drawElements();
      
    // update sim 
    lastFrameTime = currentTime;
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

  let gridSpacing = 10;
  for(let i = 0; i < Math.round(maxX / gridSpacing); i++){
    ctx.beginPath();
    //move to some incriment of 10 in graph coords 
    let graphingCoord = i * gridSpacing;
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
  
  let main = document.getElementById("main");
  let body = document.getElementsByTagName("body")[0];
  //if canvas + min width interactions is > window width
  if(canvas.width + 100 > window.innerWidth){
    body.classList.add("noMargin");
    main.classList.add("justify-left");
    
  }else{
    main.classList.remove("justify-left")
    body.classList.remove("noMargin");
  }
  rect = canvas.getBoundingClientRect();

  console.log(canvas)
  console.log(rect.left)

  scalingFactor = rect.width/maxX;

  oldWidth = canvas.width;
  oldHeight = canvas.height;
  
  //rescale st
  propView.style.width = (PropertyViewWidth * scalingFactor);
  propView.style.height = (PropertyViewHeight * scalingFactor);
  propView.style.fontSize = (PropertyViewFontSize * scalingFactor);
  

  
  //let spawnButtons = document.getElementsByClassName("spawn_button");
  
  rect = canvas.getBoundingClientRect();
}
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
    controlPressed = true;
  }
  if(event.key === " "){
    isPaused = !isPaused;
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
  const[graphX, graphY] = convertClientCoordsToGraph(event.clientX, event.pageY, true)

  let borderCount = 0;
  //to prevent having to index a list
  let objectsWithBorders = {};
  for(let i = 0; i < sim.objects.length; i++){
    let obj = sim.objects[i];

    if(controlPressed){
      //all squares are positioned center to x and y

      //if there was a square that got clicked
      if (isWithinRect(graphX, graphY, obj)) {
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
function checkHoverEvent(event){
  mouseHoverX = event.clientX;
  mouseHoverY = event.clientY;
  
  let [graphX, graphY] = convertClientCoordsToGraph(mouseHoverX, mouseHoverY)

  for(let i = 0; i < sim.objects.length; i++){

    let obj = sim.objects[i];
    if(isWithinRect(graphX, graphY, obj)){
      propView.style.left = (mouseHoverX + window.scrollX) + "px";
      propView.style.top = (mouseHoverY + window.scrollY) + "px";
      let objInfo = "";
      let objInfoDict = obj.getObjectInfo();
      let len = 0;
      for(key in objInfoDict){
        len += 1;
        objInfo += `${key}: ${Math.round(objInfoDict[key] * 100)/100}\n`
      }
      //0.75 accounts for line spacing changing it's size as the text
      //gets bigger
      let height = (PropertyViewFontSize * len) + (0.75 * len);
      propView.style.height = height * scalingFactor;

      propView.innerText = objInfo
      

      propView.classList.remove("hidden");
      break;
    }else{
      if(!propView.classList.contains("hidden")){
        propView.classList.add("hidden")
      }
    }
  }
}
/**
 * Assign all events on mouseover
 */
function canvasEntered(){
  canvas.addEventListener('click', leftClickCanvas);
  canvas.addEventListener('mousemove', checkHoverEvent)
  
}
/**
 * Remove all events on mouseout
 */
function canvasLeave(){
  canvas.removeEventListener('click', leftClickCanvas);
  canvas.removeEventListener('mousemove', checkHoverEvent)
  
}

//window events
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => resizeCanvas(), 50);
  });

window.addEventListener("load", function() {
  sim = new PhysicsSim();
  demo1();

  defaultScrollX = window.scrollX;
  defaultScrollY = window.scrollY;

  propView = document.getElementById("propertyView");

  canvas = document.getElementById("phys_sim");
  ctx = canvas.getContext("2d");

  document.addEventListener("keydown", keyPressed);
  document.addEventListener("keyup", keyReleased);

  canvas.addEventListener('mouseover', canvasEntered);
  canvas.addEventListener('mouseout', canvasLeave);

  create_onclick_events();
  lastFrameTime = performance.now();
  window.dispatchEvent(new Event('resize'));
  resizeCanvas();
  startTime = performance.now()
  requestAnimationFrame(draw);
});
