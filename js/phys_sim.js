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
    /**
     * Creates a fixed square at the graphing coordinates
     * x and y
     * @param {int} x 
     * @param {int} y 
     */
    createFixedSquare(x, y){
        let width = 5;
        let height = 5;
        let rect = new Rect(width, height, x, y)
        this.fixedObjects.push(rect);
        this.objects.push(rect)
    }  
    /**
     * Creates a moveable square at the graphing coordinates
     * x and y
     * @param {int} x 
     * @param {int} y 
     */
    createMoveableSquare(x, y){
        let width = 10;
        let height = 10;
        //0.01 g
        let mass = 0.1;
        let rect = new MoveableRect(width, height, x, y, mass)
        this.fixedObjects.push(rect)
        this.objects.push(rect)
    }
    /**
     * Creates a muscle attached to obj1 and obj2
     * index is just the index the respective object
     * is at in the objects list and is used for
     * updating forces by the sim
     * @param {physicsObject} obj1 
     * @param {physicsObject} obj2 
     * @param {int} index1 
     * @param {int} index2 
     * @returns {bool} objectCreated
     */
    createMuscle(obj1, obj2, index1, index2){

        //prevent duplicates
        for(let i = 0; i < this.forceAddingElements.length; i++){
            let m = this.forceAddingElements[i];
            //index 1 and index 2 will always be in order of least to greatest
            if(m.index1 == index1 && m.index2 == index2){
                console.log("Duplicate muscle");
                return false;
            }
        }

        let newMuscle = new SkeletalMuscle(index1, index2, obj1.x, obj1.y, obj2.x, obj2.y);
        this.forceAddingElements.push(newMuscle)
        return true
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
    /**
     * Takes in dt and performs a step, updating all objects and forces
     * @param {float} dt 
     */
    step(dt){
        this.t += dt
        //console.log("Step: ", this.t);
        // updates objects to new positions
        for(let i = 0; i < this.objects.length; i++){
            this.objects[i].update(dt);
        }
        //update all muscles and add forces to the objects the muscle is connected to
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
