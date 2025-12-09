class Obj{
    constructor(x, y, color){
        this.x = x;
        this.y = y;
        this.color = color
        this.border = false;
    }
}
class MoveableObj extends Obj{
    constructor(x, y, mass){
        super(x, y, "#000000");
        this.physics = new PhysicsObject(x, y, mass)
    }
    /**
     * Takes in the component forces and adds them to the existing forces
     * Forces are to be reset every time update(t) is called
     * @param {float} forceX 
     * @param {float} forceY 
     */
    addForce(forceX, forceY){
        this.physics.addForce(forceX, forceY)
    }
    update(dt){
        this.componentForces = this.physics.move(dt);
        
        this.x = this.physics.x;
        this.y = this.physics.y;

        return [this.physics.x, this.physics.y]
    }
}


class Rect extends Obj{
    constructor(width, height, x, y){
        super(x, y)
        this.width = width;
        this.height = height;
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
        this.physics = new PhysicsObject(x, y, mass);
        this.moveable = true;

        this.color = '#f1ff74ff'

        this.componentForces = [0, 0];
    }
    /**
     * Takes in the component forces and adds them to the existing forces
     * Forces are to be reset every time update(t) is called
     * @param {float} forceX 
     * @param {float} forceY 
     */
    addForce(forceX, forceY){
        this.physics.addForce(forceX, forceY)
    }
    /**
     * Updates the position of the object using the net force accumulated by addForce(fx, fy)
     * @param {float} dt 
     * @returns [x, y]
     */
    update(dt){
        this.componentForces = this.physics.move(dt);
        
        this.x = this.physics.x;
        this.y = this.physics.y;

        return [this.physics.x, this.physics.y]
    }
}
class Muscle{
    constructor(index1, index2){
        this.index1 = index1;
        this.index2 = index2;
        this.muscle = null;
    }
    /**
     * A general helper function to compute euclidean distance given two points
     * @param {float} x1 
     * @param {float} x2 
     * @param {float} y1 
     * @param {float} y2 
     * @returns 
     */
    getLength(x1, x2, y1, y2){
        return Math.sqrt(((x1 - x2)** 2) + ((y1 - y2) ** 2))
    }
    /**
     * A helper function to update the length of the muscle
     * using the two objects it's connected to
     * @param {float} x1 
     * @param {float} x2 
     * @param {float} y1 
     * @param {float} y2 
     */
    updateLength(x1, x2, y1, y2){
        // console(`Updating length:\n x1:${x1}, y1:${y1}, x2:${x2}, y2:${y2}\nLength: ${Math.sqrt( ((x1 - x2)** 2) + ((y1 - y2) ** 2))}`)
        this.muscle.x = this.getLength(x1, x2, y1, y2)
    }
}
class SmoothMuscle extends Muscle{
    /**
     * Takes in the indices of the attached objects, as well as their positions;
     * @param {int} index1 
     * @param {int} index2 
     * @param {float} obj1X 
     * @param {float} obj1Y 
     * @param {float} obj2X 
     * @param {float} obj2Y 
     */
    constructor(index1, index2, obj1X, obj1Y, obj2X, obj2Y){

        super(index1, index2)

        this.muscle = new SmoothMuscle();
        
        //sets l_m
        this.updateLength(obj1X, obj2X, obj1Y, obj2Y);
        // console(this.muscle.b, this.muscle.length)
        //sets l_0 
        this.muscle.setRestingLength(this.muscle.length)
        
        
    }
    /**
     * Takes in the two objects the muscle connects to
     * and some dt
     * @param {Rect} obj1 
     * @param {Rect} obj2 
     * @param {float} dt 
     * @returns {array} component forces
     */
    update(obj1, obj2, dt){
        
        //contraction force
        let force = this.muscle.contract(dt);
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

}
class SkeletalMuscle extends Muscle{
    constructor(index1, index2, x1, y1, x2, y2){
        super(index1, index2);
        let params = {
            kappa: 6,
            sigma_t: 0,
            delta_sigma: 1e-6,
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

        //ensures no default stimulation
        this.muscle.setStimulation(0, "none");
    }
    /**
     * Takes in the two connected objects as well as the time step
     * and the current time(used in calculating activation of the muscle).
     * @param {Rect} obj1 
     * @param {Rect} obj2 
     * @param {float} dt 
     * @param {float} t 
     * @returns {array} component forces
     */
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
    /**
     * 
     * @param {*} x1 
     * @param {*} x2 
     * @param {*} y1 
     * @param {*} y2 
     */
    updateLength(x1, x2, y1, y2){
        // console(`Updating length:\n x1:${x1}, y1:${y1}, x2:${x2}, y2:${y2}\nLength: ${Math.sqrt( ((x1 - x2)** 2) + ((y1 - y2) ** 2))}`)
        this.muscle.x = this.getLength(x1, x2, y1, y2)
    }
}