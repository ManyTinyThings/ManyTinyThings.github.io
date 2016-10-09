
function createShowLatestShotParticleButton()
{
	insertHere(createButton({
		label: "Show latest shot ball",
		mouseDown: function()
		{
			if (sim.mouse.activeParticle)
			{
				sim.mouse.activeParticle.color = hexColor("red", 0xff0000);
			}
			
		},
		mouseUp: function()
		{
			if (sim.mouse.activeParticle)
			{
				sim.mouse.activeParticle.color = Color.black;
			}
		},
	}));	
}
