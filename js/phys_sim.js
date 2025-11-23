class PhysicsSim{
    constructor(){
        //objects in this case are things that move
        this.fixedObjects = []
        this.moveableObjects = []
        //elements in this case are things that cause movement
        this.forceAddingElements = [] 
        this.objects = []
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
        
        let weight = 25;
        let rect = new MoveableRect(width, height, x, y, weight)
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
    step(t){

        console.log("Step: ", t);
        // updates objects to new positions
        for(let i = 0; i < this.objects.length; i++){
            this.objects[i].update(t);
        }
        for(let i = 0; i < this.forceAddingElements.length; i++){
            console.log("ElementsLoop")
            let element = this.forceAddingElements[i];

            let obj1 = this.objects[element.index1];
            let obj2 = this.objects[element.index2];
            // updates all muscles to their new length
            element.updateLength(obj1.x, obj2.x, obj1.y, obj2.y);

            // recalculates force given the new length
            let [forceX, forceY] = element.update(obj1, obj2, t);
            console.log(`muslce: ${element.index1}, ${element.index2}:\n ForceX:${forceX}\n ForceY:${forceY}`)
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
        this.mass = mass;
        this.physics = new physicsObject(x, y, mass);
        this.moveable = true;

        this.color = '#f1ff74ff'
    }
    addForce(forceX, forceY){
        this.physics.addForce(forceX, forceY)
    }
    update(t){
        this.physics.move(t);
        
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

        this.muscle = new fiber();
        
        //sets l_m
        this.updateLength(obj1X, obj2X, obj1Y, obj2Y);
        console.log(this.muscle.b, this.muscle.length)
        //sets l_0 
        this.muscle.setRestingLength(this.muscle.length)
        
        
    }
    //returns the force vector for obj2
    update(obj1, obj2, t){
        //contraction force
        let force = this.muscle.contract(t);
        if(force > 10000){
            //sleep(5000)
        }
        
        //break down force into component forces

        console.log("Force:", force)
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
        console.log(`Updating length:\n x1:${x1}, y1:${y1}, x2:${x2}, y2:${y2}\nLength: ${Math.sqrt( ((x1 - x2)** 2) + ((y1 - y2) ** 2))}`)
        this.muscle.length = this.getLength(x1, x2, y1, y2)
    }
}
class SkeletalMuscle extends Muscle{
    constructor(index1, index2, x1, y1, x2, y2){
        super(index1, index2);
        let params = {kappa: 6, mBar: 0.33, aBar:-24.1}
        this.muscle = new SkeletalFiber(this.getLength(x1, x2, y1, y2), params)
        this.active = true;
    }
    update(obj1, obj2, dt){
        this.muscle.updateActivation(dt, this.active);
        this.muscle.update(dt);

        let force = this.muscle.force;

        console.log("Force:", force)

        let length = Math.max(this.muscle.x, 1e-8);

        let dx = obj2.x - obj1.x;
        let dy = obj2.y - obj1.y;

        let ux = dx/length;
        let uy = dy/length;
        
        let forceX = ux * force;
        let forceY = uy * force;
        console.log(`Active: ${this.muscle.activation} \nLength: ${this.muscle.x}\nForce:\n x: ${forceX}, y: ${forceY}\n ux: ${ux}, uy: ${uy}\n dx: ${dx}, dy: ${dy}`)

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
