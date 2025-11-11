
const fiber_const_map = {
    a: 6.506,
    b: 1.019,
    c: 7.011,
    d: 6.89, 
    tau_c: 3.7, 
    t_p: 3.0,
    tau_r: 3.9, 
    alpha: 2,
    length: 35,
    tau_b: -5.085

};
class fiber{
    constructor(constants = fiber_const_map){
        this.a = constants["a"];
        this.b = constants["b"];
        this.c = constants["c"];
        this.d = constants["d"];
        this.tau_c = constants["tau_c"];
        this.t_p = constants["t_p"];
        this.t_b = this.t_p;// approximate form
        this.tau_r = constants["tau_r"];
        this.alpha = constants["alpha"];
        this.length = constants["length"];
    }
    contract(t){
        let f_t_Numerator = (1 - (e ^ -(t / this.tau_c) ^ this.alpha)) * (e ^ -((t - this.t_b) / this.tau_r) ^ this.alpha);
        let f_t_Denominator = (1 - (e ^ -(this.t_p / this.tau_c) ^ this.alpha)) * (e ^ -((this.t_p - this.t_b) / this.tau_r) ^ this.alpha);

        let f_t = f_t_Numerator / f_t_Denominator

        let f_passive = this.a * ((this.length - this.b) ^ 2);
        let f_active = (this.c * this.length) - this.d;
        
        let force = f_passive + (f_active * f_t);

        return force
    }

}


//var fiber1 = fiber(fiber_const_map);