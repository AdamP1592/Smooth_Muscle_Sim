class physicsObject{
    constructor(x, y, mass){
        this.x = x;
        this.y = y;
        this.mass = mass;

        this.friction_constant = 0.1;

        //total current velocity
        this.velocityX = 0;
        this.velocityY = 0;

        //sum of all forces acting over some time
        this.force_x = 0;
        this.force_y = 0;
    }
    //for runge-kutta
    dState_dt(state, forceX, forceY){
        let vx = state[0];
        let vy = state[1];
        let ax = forceX / this.mass;
        let ay = forceY / this.mass;
        
        //returns the dxdt and dvdt
        return [vx, vy, ax, ay];
    }
    predictStep(t, forceX = this.force_x, forceY = this.force_y){
        // f = ma a = f/m
        // 
        let accelerationX =  forceX / this.mass;
        let accelerationY = forceY / this.mass;

        // a = m/s^2, v = m/s
        let newVelocityX = (accelerationX * t) + this.velocityX;
        let newVelocityY = (accelerationY * t) + this.velocityY;

        let x = (newVelocityX * t) + this.x;
        let y = (newVelocityY * t) + this.y;

        let output = {
            newVelX: newVelocityX,
            newVelY: newVelocityY,
            newX: x,
            newY: y
        }

        return output;
    }
    addForce(force_x, force_y){  
        this.force_x += force_x;
        this.force_y += force_y;

        return true;
    }
    move(t){
        let newState = this.predictStep(t);
        let vx = newState["newVelX"];
        let vy = newState["newVelY"];

        //flat
        this.velocityX = vx - (this.friction_constant * vx);
        this.velocityY = vy - (this.friction_constant * vy);

        this.x = newState["newX"];
        this.y = newState["newY"];

        return true;
    }
    
}