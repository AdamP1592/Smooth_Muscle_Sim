class physicsObject{
    constructor(x, y, weight){
        this.x = x;
        this.y = y;
        this.weight = weight;

        //total current speed
        this.speed_x = 0;
        this.speed_y = 0;

        //sum of all forces acting over some time
        this.force_x = 0;
        this.force_y = 0;
    }
    move(delta_t){
        // f = ma a = f/m
        let acceleration_x =  this.force_x / this.mass;
        let acceleration_y = this.force_y / this.mass;

        //since it's simplified with an assumed low t value w/ eulers method
        let delta_x = acceleration_x * (delta_t^2);
        let delta_y = acceleration_y * (delta_t^2);

        x += delta_x;
        y += delta_y;

        this.force_x = 0;
        this.force_y = 0;
        return true;
    }
    addForce(force_x, force_y){  
        this.force_x += force_x;
        this.force_y += force_y;

        return true;
    }
    
}