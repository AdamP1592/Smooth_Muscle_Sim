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

        let newMuscle = new Muscle(index1, index2, obj1.x, obj1.y, obj2.x, obj2.y);
        this.forceAddingElements.push(newMuscle)
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
    constructor(width, height, x, y, weight){
        super(width, height, x, y);
        this.weight = weight;
        this.phyiscs = new physicsObject(x, y, weight);
        this.moveable = true;

        this.color = '#f1ff74ff'
    }
    addForce(forceX, forceY){
        this.phyiscs.addForce(forceX, forceY)
    }
    update(t){
        this.physics.move(t);
        this.x = this.physics.x;
        this.y = this.phyiscs.y;

        return [this.phyiscs.x, this.phyiscs.y]
    }
}
class Muscle{
    
    constructor(index1, index2, obj1X, obj1Y, obj2X, obj2Y){

        this.index1 = index1;
        this.index2 = index2;

        let euclid_distance = Math.sqrt( ((obj1X - obj2X)^ 2) + ((obj1Y - obj2Y) ^ 2))

        this.muscle = new fiber();
        this.muscle.length = euclid_distance;
        
    }
    //returns the force vector for obj2
    update(obj1, obj2, t){
        //contraction force
        let force = this.muscle.contract(t);
        
        //break down force into component forces

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