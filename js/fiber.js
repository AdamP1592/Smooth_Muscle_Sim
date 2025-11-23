const fiber_const_map = {
    a: 65.06,
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

        // issue with paper: once a muscle has fully contracted
        // any further compression should be resisted

        this.k_compression = 100;

        // vascular can contract up to 40% of resting length so i'll use that
        this.l_min = 0.4 * this.b
        this.l_absoluteMin = 0.2 * this.b;

        this.stimulusDuration = 0.0
        this.newPulse = true;
        this.activePlateauReached = false;
        
    }
    setRestingLength(l){
        this.b = l;
        this.l_min = l * 0.4
    }
    contract(dt, l_m = this.length, activeStimulation = true){

        // clear duration when the stimulation stops
        if (activeStimulation && this.newPulse) {
            this.stimulusDuration = 0;
            this.newPulse = false;
        } else if (!activeStimulation) {
            this.newPulse = true;
            
        } else{
            this.stimulusDuration += dt;
        }
        // clamp duration so it can't indefinitely grow
        this.stimulusDuration = Math.min(this.stimulusDuration, this.t_p + 5 * this.tau_r);
        
        let t = this.stimulusDuration;
        // Debug Info
        console.log(`Constants:\n a:${this.a}, b:${this.b}, c:${this.c}, d:${this.d}\n tau_c:${this.tau_c}, tau_r:${this.tau_r}\n t_p:${this.t_p} t_b:${this.t_b}\n alpha:${this.alpha}`)
        
        let trClamped = Math.max(t - this.t_b, 0) / this.tau_r;
        
        // Debug Info
        console.log(`clamped TR: ${trClamped}, t: ${t}, t_b: ${this.t_b}, tau_r: ${this.tau_r}, lm-b: ${l_m-this.b}`)

        let f_t_Numerator = (1 - Math.E ** ( - ((t / this.tau_c) ** this.alpha) )) * Math.E ** (- (trClamped ** this.alpha));
        let f_t_Denominator = (1 - Math.E ** ( - ((this.t_p / this.tau_c) ** this.alpha) )) * Math.E ** ( - (((this.t_p - this.t_b) / this.tau_r) ** this.alpha) );

        let f_t = f_t_Numerator / f_t_Denominator
        
        // paper defines f(t) as between 0 and 1

        f_t = Math.min(Math.max(f_t, 0), 1);
        const passiveSoftcap = 5e3;

        let f_passive = this.a * (Math.max(0, l_m - this.b) ** 2);

        let f_active = (activeStimulation && l_m > this.l_min) ? (this.c * l_m) - this.d : 0;

        let f_compression = 0;


        if (activeStimulation && f_t >= 1.0) {
            this.activePlateauReached = true;
        }
        if (this.activePlateauReached) {
            f_t = 1.0; // freeze f_t at maximum
        }
        if(l_m < this.l_min){
            f_compression = -this.k_compression * (this.l_min - l_m); //restorative force
        }
        
        let contractingForce = (f_passive + (f_active * f_t))
        let force = (contractingForce) + f_compression;
        // Debug Info
        console.log(`force: ${force}, f_passive ${f_passive}, f_active ${f_active}, f_compression: ${f_compression}\n f_t ${f_t}, f_t_numerator ${f_t_Numerator}, f_t_denom${f_t_Denominator}`)
        return force;
    }

}
class SkeletalFiber{
    constructor(initialLength, params){
        this.x = initialLength;
        this.x_r = initialLength;

        this.crossSectionArea = params.crossSectionArea;

        this.x_ref = params.x_ref
        this.kappa = params.kappa;

        this.sigma_t = params.sigma_t

        
        this.xrMin = 0.6 * initialLength;
        this.xrMax = initialLength;

        this.activation = this.aBar;
        /* isomeric
        switch(activationFrequency){
            case 50:
                this.mBar = 0.95;
                this.aBar = -24.1
                break;
            case 150:
                this.mBar = 0.33
                this.aBar = -19;
                break;
            default:
                this.mBar = 1;
                this.aBar = -15
                break;
        }
        */

        console.log(`initialized:\n x: ${this.x}\n xr: ${this.x_r}\n kappa: ${this.kappa}\n mBar: ${this.mBar}\n aBar: ${this.aBar}\n xrMin: ${this.xrMin}\n xrMax: ${this.xrMax}`)
    }
    
    erfc(x) {
        const erf = math.erf(x)
        return 1 - erf;
    }
    get LambdaE(){
        return this.x / this.xrMax;
    }
    get Lambda(){
        return this.x / this.x_ref;
    }
    get LambdaR(){
        return this.x / this.x_ref;
    }
    get mSigma(){
        const m_sigma = 0.5 * erfc((this.sigma_t - this.PsiPrime) / (Math.sqrt(2) * this.delta_sigma));
        return m_sigma
    }
    get PsiR(){
        if(this.LambdaE == 0){
            return 0;
        }
        let first = Math.pow(Math.pow(this.LambdaE, 4) - 1, 2)
        let second = Math.pow(Math.log(Math.log(Math.pow(lambdaE, 4))), 2)
        return (this.kappa/8) * (first + second);
    }
    get PsiPrime(){
        if(this.LambdaE == 0){
            return 0;
        }
        let le = this.LambdaE;
        let first =  Math.pow(le, 3) * (Math.pow(le, 4) - 1);
        let second = Math.log(le^4)/le;
        return (this.kappa) * (first + second)
    }
    get e(){
        return this.PsiR - (this.LambdaE * this.PsiPrime);
    }
    get Force(){
        return this.crossSectionArea * (this.PsiPrime + this.activation)
    }
    getSigmaHat(activation){
        return activation * this.PsiPrime;
    }
    mobility(a){
        const m_a = (this.x_r > this.xrMin && this.x_r < this.xrMax) ? 1 : 0;
        return this.mBar * this.mSigma * m_a;
    }
    updateActivation(dt, activation=true){
        if(activation){
            // activation rises toward mBar
            this.activation += this.kappa * (this.mBar - this.activation) * dt;
        } else {
            // activation decays back to aBar
            this.activation += this.kappa * (this.aBar - this.activation) * dt;
        }
    }
    update(dt){
        let a = this.activation;
        let m = this.mobility(a);

        let dxr_dt = m * (a - this.LambdaR * this.e);
        this.xr += dxr_dt * dt;

        //clamped between max and min length
        this.xr = Math.max(this.xrMin, Math.min(this.xr, this.xrMax));
    }
}

const params = {
    delta_sigma: 1e-3,
    delta_x: 2e-5,
    delta_a: 8e-3,
    crossSectionArea: 0.5,
    kappa: 6,
    activationFrequency: 50

}
/*
class SkeletalFiber{
    constructor(){
        //constants
        this.R_in = 692;
        this.C = 0.123 * (10 ** -6);
        this.R_ex = 558;
        this.q_th = 0.412 * (10 ** -6);
        this.a_c1 = 4.00 * (10 ** -10);
        this.a = 4.41 * (10**-32);
        this.Ca_th = 30.3 * (10 ** -2);
        this.a_c2 = 13.6;
        this.f_max = 0.704;
        this.k_s0 = 6.15 * (10 ** 6);
        this.a_ms = 3.00 * (10 ** -9);
        this.k_p0 = 0;
        this.a_mc1 = 3.49
        this.a_mc2 = 1.0 * (10**-10);
        this.c_0 = 2.37
        this.k_l = 0;// no spring attached
        this.k_compression = 100;
        this.length = 0.05;



        this.t0 = 2.15e-2;

        //states
        this.q_c = 0.0;
        this.bufferLen = Math.max(1, Math.ceil(t0 / dt));
        this.bufferIndex = 0;
        this.Ca = 0.0;
        this.f_ce = 0.0;
        this.x = 0.0
        this.xdot = 0.0

    }
    logistic(x, k){
        // overflow clamp
        const L = 60; 
        const arg = Math.max(-L, Math.min(L, k * x));
        return 1.0 / (1.0 + Math.exp(-arg))
    }
    step(v, dt, forces = [0.0]){

        const readIndex = (this.bufferIndex + 1) % this.bufferLen;
        const qc_prime = qcBuffer[readIndex];

        const i_in = (v - this.qc / this.C)/this.R_in;
        const qc_new = this.qc + i_in * dt;
        //const qc_abs = Math.abs(qc_new)

        const delta_q = qc_prime - this.q_th
        const zeta_q = this.logistic(delta_q, 1e11);
        const dCa_dt = (delta_q > 0) ? ac1 * delta_q * zeta_q: 0.0;
        const Ca_new = dCa_dt * dt + this.alpha * this.Ca;

        const zeta_ca = logistic(Ca_new - this.Ca_th, 102);
        const f_ce_new = this.f_max * (1.0 - Math.exp(-this.a_c2)) * zeta_ca;
        
        const k_s = this.a_ms * f_ce_new + this.k_s0;
        const k_eff = (k_s * this.k_l) / (k_s + k_l);

        let f_ext = 0;
        for(let i = 0; i < forces.length; i++){
            f_ext += forces[i];
        }

        let c = this.a_mc1 * f_ce_new * Math.exp(-this.a_mc2 * Math.abs(this.xdot)) + this.c_0;
        c = Math.max(c, 1e-6);//avoid division by 0;
        const xdot_new = (f_ce_new - k_eff * this.x)/c;
        const x_new = this.x + (this.xdot * dt);

        this.qc = qc_new;
        this.qcBuffer[this.bufferIndex] = this.qc;
        this.bufferIndex = (this.bufferIndex + 1) % this.bufferLen;
        this.Ca = Ca_new;
        this.f_ce = f_ce_new;
        this.x = x_new;
        this.xdot = xdot_new
    }

}
*/
//var fiber1 = fiber(fiber_const_map);