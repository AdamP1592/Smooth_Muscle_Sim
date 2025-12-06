class PhysicsSim{
    constructor(){
        //objects in this case are things that move
        this.fixedObjects = []
        this.moveableObjects = []
        //elements in this case are things that cause movement
        this.forceAddingElements = [] 
        this.objects = []
        this.t = 0
    }
    createFixedSquare(x, y){
        let width = 10;
        let height = 10;
        let rect = new Rect(width, height, x, y)
        this.fixedObjects.push(rect);
        this.objects.push(rect)
    }  
    createMoveableSquare(x, y){
        let width = 10;
        let height = 10;
        //0.01 g
        let mass = 0.1;
        let rect = new MoveableRect(width, height, x, y, mass)
        this.fixedObjects.push(rect)
        this.objects.push(rect)
    }
    createMuscle(obj1, obj2, index1, index2){

        //prevent duplicates
        for(let i = 0; i < this.forceAddingElements.length; i++){
            let m = this.forceAddingElements[i];
            //index 1 and index 2 will always be in order of least to greatest
            if(m.index1 == index1 && m.index2 == index2){
                console.log("Duplicate muscle");
                return;
            }
        }

        let newMuscle = new SkeletalMuscle(index1, index2, obj1.x, obj1.y, obj2.x, obj2.y);
        this.forceAddingElements.push(newMuscle)
    }
    /**
     * takes in two physics objects
     * @param {physicsObject} phisObj1 
     * @param {physicsObject} physObj2
     * 
     * @returns {number} the tension between the two objects 
     */
    getMuscleForce(phisObj1, physObj2){
        let vx1 = phisObj1.physicsObject.velocityX;
        let vy1 = phisObj1.physicsObject.velocityY;
        let m1 = phisObj1.mass;

        let vx2 = physObj2.physicsObject.velocityX;
        let vy2 = physObj2.physicsObject.velocityY;
        let m2 = physObj2.mass;



    }
    step(dt){
        this.t += dt
        //console.log("Step: ", this.t);
        // updates objects to new positions
        for(let i = 0; i < this.objects.length; i++){
            this.objects[i].update(dt);
        }
        for(let i = 0; i < this.forceAddingElements.length; i++){
            // console("ElementsLoop")
            let element = this.forceAddingElements[i];
            // console(element)

            let obj1 = this.objects[element.index1];
            let obj2 = this.objects[element.index2];
            // updates all muscles to their new length
            element.updateLength(obj1.x, obj2.x, obj1.y, obj2.y);

            // recalculates force given the new length
            let [forceX, forceY] = element.update(obj1, obj2, dt, this.t);
            // console(`muslce: ${element.index1}, ${element.index2}:\n ForceX:${forceX}\n ForceY:${forceY}`)
            // applies force to connected objects for the next step
            obj2.addForce(-forceX, -forceY);
            obj1.addForce(forceX, forceY);
        }
    }
}
class Rect{
    constructor(width, height, x, y){
        this.width = width;
        this.height = height;
        this.x = x;
        this.y = y;
        this.moveable = false;

        this.color = '#575757ff'
        this.border = false;

        this.dForce = 0;
    }
    update(t){
        //update position function
    }
    addForce(forceX, forceY){
        //add force to object function
    }
}
class MoveableRect extends Rect{
    constructor(width, height, x, y, mass){
        super(width, height, x, y);
        this.physics = new physicsObject(x, y, mass);
        this.moveable = true;

        this.color = '#f1ff74ff'

        this.dv = [0, 0];
    }
    addForce(forceX, forceY){
        this.physics.addForce(forceX, forceY)
    }
    update(t){
        this.dv = this.physics.move(t);
        
        this.x = this.physics.x;
        this.y = this.physics.y;

        return [this.physics.x, this.physics.y]
    }
}
class Muscle{
    constructor(index1, index2){
        this.index1 = index1; this.index2 = index2;
    }
    getLength(x1, x2, y1, y2){
        return Math.sqrt( ((x1 - x2)** 2) + ((y1 - y2) ** 2))
    }

}
class SmoothMuscle extends Muscle{
    constructor(index1, index2, obj1X, obj1Y, obj2X, obj2Y){

        super(index1, index2)

        this.muscle = new SmoothMuscle();
        
        //sets l_m
        this.updateLength(obj1X, obj2X, obj1Y, obj2Y);
        // console(this.muscle.b, this.muscle.length)
        //sets l_0 
        this.muscle.setRestingLength(this.muscle.length)
        
        
    }
    //returns the force vector for obj2
    update(obj1, obj2, t){
        
        //contraction force
        let force = this.muscle.contract(t);
        //break down force into component forces

        // console("Force:", force)
        let dx = obj2.x - obj1.x;
        let dy = obj2.y - obj1.y;

        let ux = dx/this.muscle.length;
        let uy = dy/this.muscle.length;
        
        let forceX = ux * force;
        let forceY = uy * force;

        //return to the sim to apply force to the objects
        return [forceX, forceY]
        
    }
    updateLength(x1, x2, y1, y2){
        // console(`Updating length:\n x1:${x1}, y1:${y1}, x2:${x2}, y2:${y2}\nLength: ${Math.sqrt( ((x1 - x2)** 2) + ((y1 - y2) ** 2))}`)
        this.muscle.length = this.getLength(x1, x2, y1, y2)
    }
}
class SkeletalMuscle extends Muscle{
    constructor(index1, index2, x1, y1, x2, y2){
        super(index1, index2);
        let params = {
            kappa: 6,
            sigma_t: 1.0,
            delta_sigma: 1e-3,
            delta_x: 2e-5,
            delta_a: 8e-3,
            //for future use for dynamically setting custom functions to define mbar and abar given force
            aBar_base: 0.95465,
            aBar_shift: 27.8085,
            aBar_scaleFactor: 27.41952,
            mBar_base:0.633738,
            mBar_shift:0.599493,
            mBar_scaleFactor:8.01869
            
        }
        this.muscle = new SkeletalFiber(this.getLength(x1, x2, y1, y2), params)

        this.muscle.setStimulation(0, "none");
        
        this.active = true;
    }
    update(obj1, obj2, dt, t){
        // console("T in phys sim:" + t)
        this.muscle.updateActivation(t);
        let force = this.muscle.step(dt);
        
        //console.log("Force:", force)

        let length = Math.max(this.muscle.x, 1e-8);

        let dx = obj2.x - obj1.x;
        let dy = obj2.y - obj1.y;

        let ux = dx/length;
        let uy = dy/length;
        
        let forceX = ux * force;
        let forceY = uy * force;
        // console(`Active: ${this.muscle.activation} \nLength: ${this.muscle.x}\nForce:\n x: ${forceX}, y: ${forceY}\n ux: ${ux}, uy: ${uy}\n dx: ${dx}, dy: ${dy}`)

        //return to the sim to apply force to the objects
        return [forceX, forceY]

    }

    updateLength(){
        this.length = this.muscle.x;
    }
    setActive(){
        this.active = true;
    }

    setInactive(){
        this.active = false;
    }
}
class SoftBody{
    constructor(){

    }
    update(dt){

    }
}
class SoftBody1d{
    constructor(length, elasticity, mass){
        this.mass = mass;
        this.length = length;
        this.elasticity = elasticity;
    }
}