class PhysicsObject{
    constructor(x, y, mass){
        this.x = x;
        this.y = y;
        this.mass = mass;

        this.kineticFrictionConstant = 0.4;
        this.staticFrictionConstant = 0.5;

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
    /**
     * predicts x, y vx, vy from component forces
     * @param {float} dt 
     * @param {float} forceX 
     * @param {float} forceY 
     * @returns {object}{newVelX, newVelY, newX, newY}
     */
    predictStep(dt, forceX = this.force_x, forceY = this.force_y){
        // f = ma a = f/m
        // 
        let accelerationX =  forceX / this.mass;
        let accelerationY = forceY / this.mass;

        // a = m/s^2, v = m/s
        let newVelocityX = (accelerationX * dt) + this.velocityX;
        let newVelocityY = (accelerationY * dt) + this.velocityY;

        let x = (newVelocityX * dt) + this.x;
        let y = (newVelocityY * dt) + this.y;

        let output = {
            newVelX: newVelocityX,
            newVelY: newVelocityY,
            newX: x,
            newY: y
        }

        return output;
    }
    /**
     * accumulates force over a given timestep
     * @param {float} force_x 
     * @param {float} force_y 
     */
    addForce(force_x, force_y){  
        this.force_x += force_x;
        this.force_y += force_y;
    }
    /**
     * Performs the movement and resets force to 0
     * @param {float} dt 
     * @returns {array} component velocity derivatives dvx and dvy
     */
    move(dt){
        let oldVX = this.velocityX;
        let oldVY = this.velocityY;
        
        // coulomb friction
        let frictionX = 0;
        let frictionY = 0;

        const staticFrictionMagnitude = this.mass * 9.81 * this.staticFrictionConstant;

        // Converts compoenent forces to actual force
        let appliedForce = Math.sqrt(Math.pow(this.force_x, 2) + Math.pow(this.force_y, 2));
        
        // scale eps with dt
        let eps = 1e-6 * dt;
        if(Math.abs(this.velocityX) < eps && Math.abs(this.velocityY) < eps && appliedForce <= staticFrictionMagnitude){
            // applies static friction(object wont move)
            this.velocityX = 0;
            this.velocityY = 0;
            frictionX = -this.force_x;
            frictionY = -this.force_y;
        }else{
            // applies kinetic friction
            const kineticFrictionMagnitude = this.mass * 9.81 * this.kineticFrictionConstant;
            const speed = Math.sqrt(Math.pow(this.velocityX, 2) + Math.pow(this.velocityY, 2));
            if(speed > eps){// prevent devision by zero
                frictionX = -(this.velocityX / speed) * kineticFrictionMagnitude;
                frictionY = -(this.velocityY / speed) * kineticFrictionMagnitude;
            }
        }
        // Total force with friction
        let totalForceX = this.force_x + frictionX;
        let totalForceY = this.force_y + frictionY;

        // get acceleration
        let accelerationX = totalForceX / this.mass;
        let accelerationY = totalForceY / this.mass;
        
        // change velocity with acceleration
        this.velocityX += accelerationX * dt;
        this.velocityY += accelerationY * dt;

        // if velocity passes through zero just set it to zero
        // to prevent jitter
        if (oldVX * this.velocityX < 0) {
            this.velocityX = 0;
        }
        if (oldVY * this.velocityY < 0) {
            this.velocityY = 0;
        }
        
        // updates position
        this.x += (this.velocityX * dt);
        this.y += (this.velocityY * dt);

        //calculates dvx and dvy
        let deltaVX = this.velocityX - oldVX;
        let deltaVY = this.velocityY - oldVY;

        this.resetForces()

        return [deltaVX, deltaVY];
    }
    /**
     * Helper function to reset all forces
     */
    resetForces(){
        this.force_x = 0;
        this.force_y = 0;
    }
}