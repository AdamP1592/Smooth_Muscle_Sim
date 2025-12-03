class Activation{
    constructor(t_on, frequency){
        this.t_on = t_on;
        this.f = frequency;
        this.type = "none"
        this.currentActivationFunction = this.activateNone.bind(this);
        this.types = {
            "sin":this.activateSin.bind(this),
            "square":this.activateSquare.bind(this),
            "constant":this.activateConstant.bind(this),
            "const": this.activateConstant.bind(this),
            "none":this.activateNone.bind(this)
        }
    }
    start(t){
        this.t_on = t;
    }
    changeType(type){
        

        if(this.types[type]){
            this.type = type;
            this.currentActivationFunction = this.types[type];
        }
    }
    startNew(t, f, type="none"){
        this.changeType(type);
        this.t_on = t;
        this.f = f;
    }
    activate(t){
        //console.log(`\nActivation(${t})\nType: ${this.type}`)
        let activationLevel = this.currentActivationFunction(t);
        //console.log("Activation Level:" , activationLevel)
        return activationLevel;
    }
    activateSin(t){
        //console.log(`t:${t}, ton:${this.t_on}, f:${this.f}`)
        return Math.pow(Math.sin((t - this.t_on) * Math.PI * this.f), 2);
    }
    activateSquare(t){
        let wave = this.activateSin(t);
        return Number(wave > 0);
    }
    activateConstant(t){
        return 1;
    }
    activateNone(t){
        return 0;
    }
}
