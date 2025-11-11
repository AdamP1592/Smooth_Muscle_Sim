class PhysicsSim{
    constructor(){
        this.fixedObjects = []
        this.moveableObjects = []
        this.forceAddingObjects = []
    }
    createFixedSquare(x, y){
        let width = 5;
        let height = 5;

        this.fixedObjects.push(new Rect(width, height, x, y));
    }  
    create_moveable_square(x, y){

    }
    create_muscle(x, y){
    
    }
}
class Rect{
    constructor(width, height, x, y){
        this.width = width;
        this.height = height;
        this.x = x;
        this.y = y;
        this.moveable = false;
    }
    update(t){
        //update position function
    }
    addForce(forceX, forceY){
        //add force to object function
    }
}
class moveable_rect extends Rect{
    constructor(width, height, x, y, weight){
        this.weight = weight;
        super(width, height, x, y);
        this.phyiscs = new physicsObject(x, y, weight);
        this.moveable = true;
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
class muscle_obj{
    
    constructor(connectedObjects){
    
        if (connectedObjects.length != 2){
            console.error("Muscle must be attached at two points")
        }
        this.moveableObjects = []
        this.fixedObjects = []

        this.connectedObjects = connectedObjects;

        for(let obj in connectedObjects){
            if(obj.moveable){
                this.moveableObjects.append(obj);
            }
            else{
                this.fixedObjects.append(obj);
            }
        }
        
        let obj1 = connectedObjects[0];
        let obj2 = connectedObjects[1];

        let euclid_distance = sqrt( ((obj1.x - obj2.x)^ 2) + ((obj1.y - obj2.y) ^ 2))


        this.muscle = new fiber();
        this.muscle.length = euclid_distance;
        
    }
    update(t){
        //contraction force
        let force = this.muscle.contract(t);
        
        //break down force into component forces
        let deltaY = 0;
        if(this.connectedObjects[0] > this.connectedObjects[1]){
            deltaY = this.connectedObjects[0].y - this.connectedObjects[1].y;
        }else{
            deltaY = this.connectedObjects[1].y - this.connectedObjects[0].y;
        }
        
        let direction = Math.asin(deltaY/this.muscle.length);
        let forceX = cos(direction) * force;
        let forceY = sin(direction) * force;

        //apply force to each
        for(let obj in this.moveableObjects){
            obj.addForce(forceX, forceY);
        }
        
    }
}