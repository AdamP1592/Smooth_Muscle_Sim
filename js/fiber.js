//const { simpleLayout } = require("echarts/types/src/chart/graph/simpleLayoutHelper.js");

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
        //console.log(`Constants:\n a:${this.a}, b:${this.b}, c:${this.c}, d:${this.d}\n tau_c:${this.tau_c}, tau_r:${this.tau_r}\n t_p:${this.t_p} t_b:${this.t_b}\n alpha:${this.alpha}`)
        
        let trClamped = Math.max(t - this.t_b, 0) / this.tau_r;
        
        // Debug Info
        //
        //console.log(`clamped TR: ${trClamped}, t: ${t}, t_b: ${this.t_b}, tau_r: ${this.tau_r}, lm-b: ${l_m-this.b}`)

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
        //console.log(`force: ${force}, f_passive ${f_passive}, f_active ${f_active}, f_compression: ${f_compression}\n f_t ${f_t}, f_t_numerator ${f_t_Numerator}, f_t_denom${f_t_Denominator}`)
        return force;
    }

}
class SkeletalFiber{
    constructor(initialLength, params){

        this.x = initialLength;
        this.x_r = initialLength * 0.8;

        //to maintain the ratio from the paper of max length to length: * (12.8 / 11.5)
        this.x_ref = initialLength + 1e-6;

        this.kappa = params.kappa;

        this.sigma_t = params.sigma_t

        this.delta_x = params.delta_x;
        this.delta_a = params.delta_a;
        this.delta_sigma = params.delta_sigma

        
        this.xrMin = 0.6 * initialLength;

        this.setABar(0);
        this.setMBar(0);

        //helper variables
        this.activation = this.aBar;
        this.previousForce = 0;

        this.activationObj = new Activation(0, 0);

    }
    /**
    * @param {string} stimulationType
    */
    setStimulation(t, stimulationType, freq = 150){
        //gets the requested stim type
        stimulationType = stimulationType.toLowerCase()
        
        //sets new parameters
        this.activationObj.startNew(t, freq, stimulationType);
        
    }
    /**
     * Custom fit exponential equation for adaptive mbar: mbar = 8.01869 * (0.633738 ^ x) + 0.599493
     * This was created by me from the limited data given in the paper and may fail to accurately
     * predict the true value. The output is bounded by the max and min values of the given isotonic contraction data.
     * 
     * @param {int} force 
     * 
     */
    setMBar(force){
        let mb = 8.01869 * Math.pow(0.633738, force) + 0.599493
        this.mBar = Math.max(Math.min(4.5, mb), 0.6);
        return true;
    }
    /**
     * Custom fit exponential equation for adaptive mbar: abar = 27.41952 * (0.95465 ^ x) - 29.8085
     * This was created by me from the limited data given in the paper and may fail to accurately
     * predict the true value. The output is bounded by the max and min values of the given isotonic contraction data,.
     * 
     * @param {int} force 
     * 
     */
    setABar(force){
        let ab = 27.41952 * Math.pow(0.95465, force) - 27.78085;
        this.aBar = Math.max(Math.min(-2.3, ab), -17.53);
        //this.aBar = -27.53
        return true;
    }
    /**
    * @param {float} x 
    */
    erfc(x) {
        var erf = math.erf(x)
        return 1.0 - erf;
    }
    get LambdaE(){
        return this.x / this.x_r;
    }
    get Lambda(){
        return this.x / this.x_ref;
    }
    get LambdaR(){
        return this.x_r / this.x_ref;
    }
    mSigma(sigma_minus_sigma_t){
        //console.log(this.delta_sigma)
        let arg = (this.delta_sigma - sigma_minus_sigma_t) / (Math.sqrt(2) * this.delta_sigma)
        //console.log('mSigma called; local arg =', arg);
        let erfcResult = this.erfc(arg)
        var m_sigma = 0.5 * erfcResult
        /*
        console.log("erfc result = (delta_sigma - sigma_minus_sigma_t )/ sqrt(2) * delta_sigma");
        console.log(`${erfcResult} = efrc(${this.delta_sigma - sigma_minus_sigma_t} / (${Math.sqrt(2) * this.delta_sigma}))`)
        console.log(`${erfcResult} = erfc(${arg})`)
        */
        //console.log("sigma_minus_sigma_t: ", sigma_minus_sigma_t);
        return m_sigma
    }
    m_a(driving_force){
        let xr = this.x_r;
        
        //shortening
        let term1_xr = 0.5 * this.erfc((xr - (this.x_ref - this.delta_x)) / (Math.sqrt(2) * this.delta_x / 2));
        let term1_a = 0.5 * this.erfc(-driving_force / (Math.sqrt(2) * this.delta_a));
        let term1 = term1_xr * term1_a;
        
        //lengthening
        let term2_xr = 0.5 * this.erfc((-xr + (this.xrMin + this.delta_x)) / (Math.sqrt(2) * this.delta_x / 2));
        let term2_a = 0.5 * this.erfc(driving_force / (Math.sqrt(2) * this.delta_a));
        let term2 = term2_xr * term2_a;
    
        return term1 + term2;
    }
    PsiR(lambdaE){
        let le = lambdaE
        if(le == 0){
            return 0;
        }
        let first = Math.pow(Math.pow(le, 4) - 1, 2)
        let second = Math.pow(Math.log(Math.pow(le, 4)), 2)
        return (this.kappa/8) * (first + second);
    }
    PsiPrime(lambdaE){
        let le = lambdaE;
        let fraction = Math.log(Math.pow(le, 4)) + Math.pow(le, 8) - Math.pow(le, 4)
        fraction /= le
        return this.kappa * fraction
    }
    e(lambdaE, psiR, psiPrime){
        return psiR - (lambdaE * psiPrime);
    }
    DrivingForce(a, lambdaR, _e){
        return a - (lambdaR * _e);
    }

    mobility(psiPrime, driving_force){
        let sigma_minus_sigma_t = psiPrime - this.sigma_t
        let m_sig = this.mSigma(sigma_minus_sigma_t)
        let ma = this.m_a(driving_force)
        let mobility = this.mBar * m_sig * ma;
        /*
        console.log(`
            Mobility: ${mobility}
            sigma(aka psiPrime): ${psiPrime}
            simga_t: ${this.sigma_t}
            delta_sigma:${this.delta_sigma}
            m_sigma: ${m_sig}
            drivingForce: ${driving_force}
            ma: ${ma}
            mbar: ${this.mBar}
            delta_sigma: ${this.delta_sigma}
            activation: ${this.activation}
            `)
        */
        //console.log(psiPrime, this.mBar, mobility, ma, this.activation)
        //console.log(` Sigma_minus_sigma_t: ${sigma_minus_sigma_t}\n m_sigma: ${m_sig}\n ma: ${ma}, psiPrime: ${psiPrime}, sigma_t: ${this.sigma_t}`)
        return mobility
    }
    updateActivation(t){
        this.activation = this.aBar * this.activationObj.activate(t);
        //console.log(`Activation(${t}s): ${this.activation}`);
        //console.log(this.activationObj)
    }
    step(dt){
        let lambdaE = this.LambdaE;
        let lambdaR = this.LambdaR;

        let psiR = this.PsiR(lambdaE);
        let psiPrime = this.PsiPrime(lambdaE);

        this.setMBar(this.previousForce);
        this.setABar(this.previousForce);
        let _e = this.e(lambdaE, psiR, psiPrime);
        
        let drivingForce = this.activation - lambdaR * _e;

        let m = this.mobility(psiPrime, drivingForce);

        

        //debug
        /*let sigma_minus_sigma_t = psiPrime - this.sigma_t
        let erfc_arg = (this.delta_sigma - sigma_minus_sigma_t) / (Math.sqrt(2) * this.delta_sigma);
        let m_sigma = 0.5 * this.erfc(erfc_arg);*/
        //update xr
        let dxr_dt = this.x_r * m * drivingForce;
        //console.log(`resting length: ${this.x_r}, length ${this.x}`)
        this.x_r += dxr_dt * dt;
        /*console.log(`
            dt = ${dt}
            sigma = ${psiPrime.toFixed(6)}
            sigma_t = ${this.sigma_t}
            sigma - sigma_t = ${sigma_minus_sigma_t}
            erfc_arg = ${erfc_arg.toFixed(3)}
            m_sigma = ${m_sigma.toFixed(6)}
            x_r = ${this.x_r.toFixed(6)}
        `);*/
    
        //console.log(`Step:\n lambda_e: ${lambdaE}\n lambda_r: ${lambdaR}\n ψ_r: ${psiR}\n ψ': ${psiPrime}\n e: ${_e}\n drivingForce: ${drivingForce}\n m: ${m}\n dxrdt: ${dxr_dt}\n xr: ${this.x_r}\n x:${this.x}\n e:${_e}\n activation: ${this.activation}`) 
        //clamped between max and min lengt
        this.x_r = Math.max(this.xrMin, Math.min(this.x_r, this.x_ref));
        
        let force = this.PsiPrime(this.LambdaE)
        this.previousForce = force;
        //console.log("Final Force: ", force)
        
        return force;
    }
    updateLength(newLength){
        this.x = newLength;
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