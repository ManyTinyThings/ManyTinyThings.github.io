function createIceMudSliderHere()
{
	createSliderHere({
	    object: sim.parameters,
	    name: "friction",
	    min: 0.04, max: 5,
	    minLabel: "Ice", maxLabel: "Mud",
	    transform: function(x) { return Math.exp(x); },
	    inverseTransform: function(x) { return Math.log(x); },
	});	
}

