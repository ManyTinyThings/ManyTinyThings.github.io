var addOppositeParticles = function(simulation)
{
    var d = simulation.boxBounds.width / 4;
    var particleSW = new Particle();
    v2.set(particleSW.position, -d, -d);
    addParticle(simulation, particleSW);

    var particleNE = new Particle();
    v2.set(particleNE.position, d, d);
    addParticle(simulation, particleNE);
}


function ensembleSpeed(particles)
{
    var totalVelocity = v2.alloc();
    v2.set(totalVelocity, 0, 0);
    for (var particleIndex = 0; particleIndex < particles.length; particleIndex++) {
        var particle = particles[particleIndex];
        v2.add(totalVelocity, totalVelocity, particle.velocity);
    }
    var ensembleSpeed = v2.magnitude(totalVelocity) / particles.length;
    v2.free(totalVelocity);
    return ensembleSpeed;
}