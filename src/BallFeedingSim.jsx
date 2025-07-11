import { useRef, useEffect, useState } from "react";

const BallFeedingSim = () => {
  const canvasRef = useRef(null);
  const [energy, setEnergy] = useState({ isrm: 100, reflex: 100, ml: 100 });
  const [alive, setAlive] = useState({ isrm: true, reflex: true, ml: true });
  const [stats, setStats] = useState({
    isrm: { deaths: 0, ballsCollected: 0, respawnTimer: 0 },
    reflex: { deaths: 0, ballsCollected: 0, respawnTimer: 0 },
    ml: { deaths: 0, ballsCollected: 0, respawnTimer: 0 }
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const AGENT_RADIUS = 10;
    const FOOD_RADIUS = 8;
    const deathThreshold = 10;
    const deathTimer = { isrm: 0, reflex: 0, ml: 0 };
    const respawnTimer = { isrm: 0, reflex: 0, ml: 0 };
    const RESPAWN_TIME = 600; // 10 seconds at 60fps
    const agentStats = {
      isrm: { deaths: 0, ballsCollected: 0 },
      reflex: { deaths: 0, ballsCollected: 0 },
      ml: { deaths: 0, ballsCollected: 0 }
    };

    const distance = (a, b) => Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);

    const makeAgent = (x, y, logicType) => ({
      x,
      y,
      vx: 0,
      vy: 0,
      color:
        logicType === "isrm"
          ? "#42f5a7"
          : logicType === "reflex"
          ? "#4287f5"
          : "#c2a1f5",
      logic: logicType,
      energy: 100,
      dead: false,
      memory: { lastValue: 10, lastCost: 1, score: 10 },
      ballsCollected: 0,
    });

    const makeFood = () => {
      const x = Math.random() * (canvas.width - 40) + 20;
      const y = Math.random() * (canvas.height - 40) + 20;
      return {
        x,
        y,
        type: "normal",
        value: 10,
        color: "#f55ac2",
      };
    };

    const respawnAgent = (agent) => {
      // Random position near the center
      const offsetX = (Math.random() - 0.5) * canvas.width * 0.5;
      const offsetY = (Math.random() - 0.5) * canvas.height * 0.5;
      agent.x = canvas.width / 2 + offsetX;
      agent.y = canvas.height / 2 + offsetY;
      agent.vx = 0;
      agent.vy = 0;
      agent.energy = 100;
      agent.dead = false;
      // Keep the ballsCollected count
    };

    const agents = [
      makeAgent(100, canvas.height / 2 - 60, "isrm"),
      makeAgent(canvas.width - 100, canvas.height / 2, "reflex"),
      makeAgent(canvas.width / 2, canvas.height / 2 + 60, "ml"),
    ];

    const foods = Array.from({ length: 5 }).map(() => makeFood());

    setInterval(() => {
      if (foods.length < 40) foods.push(makeFood());
    }, 300);

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw foods
      for (let food of foods) {
        ctx.beginPath();
        ctx.arc(food.x, food.y, FOOD_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = food.color;
        ctx.fill();
      }

      for (let agent of agents) {
        const logic = agent.logic;
        const e = agent.energy;

        if (agent.dead) {
          // Draw dead agent
          ctx.beginPath();
          ctx.arc(agent.x, agent.y, AGENT_RADIUS, 0, Math.PI * 2);
          ctx.fillStyle = "#555";
          ctx.fill();
          
          // Draw death symbol and respawn timer
          ctx.fillStyle = "#888";
          ctx.font = "12px monospace";
          
          // Increment respawn timer and check if it's time to respawn
          if (respawnTimer[logic] < RESPAWN_TIME) {
            respawnTimer[logic]++;
            const secondsLeft = Math.ceil((RESPAWN_TIME - respawnTimer[logic]) / 60);
            ctx.fillText(`${logic} ☠ ${secondsLeft}s`, agent.x + 12, agent.y);
          } else {
            respawnAgent(agent);
            respawnTimer[logic] = 0;
            setAlive(prev => ({ ...prev, [logic]: true }));
          }
          continue;
        }

        if (e < deathThreshold) {
          deathTimer[logic]++;
          if (deathTimer[logic] > 100) {
            agent.dead = true;
            agentStats[logic].deaths++;
            setAlive(prev => ({ ...prev, [logic]: false }));
            setStats(prev => ({
              ...prev,
              [logic]: {
                ...prev[logic],
                deaths: agentStats[logic].deaths
              }
            }));
            continue;
          }
        } else {
          deathTimer[logic] = 0;
        }

        const targets = foods.slice().sort((a, b) => {
          const distA = distance(agent, a);
          const distB = distance(agent, b);
          if (logic === "reflex") return distA - distB;
          if (logic === "ml") {
            const scoreA = a.value / (distA + 1);
            const scoreB = b.value / (distB + 1);
            return scoreB - scoreA;
          }
          // ISRM
          const scoreA = a.value / (distA + 1);
          const scoreB = b.value / (distB + 1);
          return scoreB - scoreA;
        });

        const target = targets[0];
        const dx = target.x - agent.x;
        const dy = target.y - agent.y;
        const mag = Math.sqrt(dx * dx + dy * dy) || 1;

        let move = false;
        let speed = 1.0;

        if (logic === "isrm" && agent.energy > 5 && distance(agent, target) < 200) move = true;
        if (logic === "reflex" && agent.energy > 5) {
          move = true;
          speed = e > 50 ? 1.3 : 0.4;
        }
        if (logic === "ml" && agent.energy > 5) {
          move = true;
          speed = e > 50 ? 1.2 : 0.5;
        }

        if (move) {
          agent.vx += (dx / mag) * speed;
          agent.vy += (dy / mag) * speed;
          const moveCost = Math.abs(agent.vx) + Math.abs(agent.vy);
          const totalCost = moveCost * 0.1 + moveCost * 0.025;
          agent.energy = Math.max(0, agent.energy - totalCost);
        } else {
          agent.energy = Math.max(0, agent.energy - 0.025);
          agent.energy = Math.min(100, agent.energy + 0.05);
        }

        agent.x += agent.vx;
        agent.y += agent.vy;
        agent.vx *= 0.85;
        agent.vy *= 0.85;

        if (agent.x < AGENT_RADIUS || agent.x > canvas.width - AGENT_RADIUS)
          agent.vx *= -0.6;
        if (agent.y < AGENT_RADIUS || agent.y > canvas.height - AGENT_RADIUS)
          agent.vy *= -0.6;

        agent.x = Math.min(canvas.width - AGENT_RADIUS, Math.max(AGENT_RADIUS, agent.x));
        agent.y = Math.min(canvas.height - AGENT_RADIUS, Math.max(AGENT_RADIUS, agent.y));

        for (let i = foods.length - 1; i >= 0; i--) {
          if (distance(agent, foods[i]) < AGENT_RADIUS + FOOD_RADIUS) {
            const gain = foods[i].value;
            agent.energy = Math.min(100, agent.energy + gain);
            
            // Track ball collection
            agent.ballsCollected++;
            agentStats[logic].ballsCollected = agent.ballsCollected;
            
            if (logic === "ml") {
              const moveCost = Math.abs(agent.vx) + Math.abs(agent.vy);
              agent.memory.lastValue = gain;
              agent.memory.lastCost = moveCost;
              agent.memory.score = gain / (moveCost + 1);
            }
            foods.splice(i, 1);
            break;
          }
        }

        ctx.beginPath();
        ctx.arc(agent.x, agent.y, AGENT_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = agent.color;
        ctx.fill();

        const barWidth = 40;
        const energyRatio = agent.energy / 100;
        ctx.fillStyle = "#444";
        ctx.fillRect(agent.x - barWidth / 2, agent.y + 16, barWidth, 5);
        ctx.fillStyle = agent.color;
        ctx.fillRect(agent.x - barWidth / 2, agent.y + 16, barWidth * energyRatio, 5);

        ctx.fillStyle = "#ffffff";
        ctx.font = "12px monospace";
        ctx.fillText(`${logic}`, agent.x + 12, agent.y);
      }

      setEnergy({
        isrm: agents[0].energy,
        reflex: agents[1].energy,
        ml: agents[2].energy,
      });

      // Update stats for UI
      setStats({
        isrm: { 
          deaths: agentStats.isrm.deaths, 
          ballsCollected: agentStats.isrm.ballsCollected,
          respawnTimer: respawnTimer.isrm ? Math.ceil((RESPAWN_TIME - respawnTimer.isrm) / 60) : 0
        },
        reflex: { 
          deaths: agentStats.reflex.deaths, 
          ballsCollected: agentStats.reflex.ballsCollected,
          respawnTimer: respawnTimer.reflex ? Math.ceil((RESPAWN_TIME - respawnTimer.reflex) / 60) : 0
        },
        ml: { 
          deaths: agentStats.ml.deaths, 
          ballsCollected: agentStats.ml.ballsCollected,
          respawnTimer: respawnTimer.ml ? Math.ceil((RESPAWN_TIME - respawnTimer.ml) / 60) : 0
        }
      });

      requestAnimationFrame(animate);
    }

    animate();
  }, []);

  return (
    <section className="py-20 bg-gray-950 text-white border-t border-white/10">
      <div className="container mx-auto px-4 max-w-5xl">
        <h2 className="text-2xl font-bold mb-4"></h2>
        <p className="text-white/70 mb-6">
          
        </p>
        <div className="rounded-lg overflow-hidden border border-white/10">
          <canvas ref={canvasRef} className="w-full h-[500px] bg-black" />
        </div>
        <div className="mt-4 text-sm text-white/70 flex gap-6 justify-center flex-wrap">
          <div className="p-2 bg-gray-900 rounded">
            🟢 ISRM: {alive.isrm ? energy.isrm.toFixed(0) : stats.isrm.respawnTimer + "s"} | 
            Balls: {stats.isrm.ballsCollected} | 
            Deaths: {stats.isrm.deaths}
          </div>
          <div className="p-2 bg-gray-900 rounded">
            🔵 Reflex: {alive.reflex ? energy.reflex.toFixed(0) : stats.reflex.respawnTimer + "s"} | 
            Balls: {stats.reflex.ballsCollected} | 
            Deaths: {stats.reflex.deaths}
          </div>
          <div className="p-2 bg-gray-900 rounded">
            🧠 ML: {alive.ml ? energy.ml.toFixed(0) : stats.ml.respawnTimer + "s"} | 
            Balls: {stats.ml.ballsCollected} | 
            Deaths: {stats.ml.deaths}
          </div>
        </div>
      </div>
    </section>
  );
};

export default BallFeedingSim;