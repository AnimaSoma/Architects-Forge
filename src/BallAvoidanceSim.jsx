
import { useRef, useEffect, useState } from "react";

const BallAvoidanceSim = () => {
  const canvasRef = useRef(null);
  const [hits, setHits] = useState({ isrm: 0, reflex: 0, stoic: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const AGENT_RADIUS = 10;
    const BALL_RADIUS = 12;
    const BALL_COUNT = 20;
    const CENTER = { x: canvas.width / 2, y: canvas.height / 2 };
    const RADIUS = Math.min(canvas.width, canvas.height) / 2 - 20;

    const distance = (a, b) =>
      Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);

    const toCenterDist = (x, y) =>
      Math.sqrt((x - CENTER.x) ** 2 + (y - CENTER.y) ** 2);

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
          : "#f5a742",
      logic: logicType,
      hits: 0,
      cooldown: 0,
      memory: Array(60).fill(0),
      U_base: 0.6,
      energy: 100,
    });

    const agents = [
      makeAgent(CENTER.x - 80, CENTER.y, "isrm"),
      makeAgent(CENTER.x, CENTER.y, "reflex"),
      makeAgent(CENTER.x + 80, CENTER.y, "stoic"),
    ];

    const balls = Array.from({ length: BALL_COUNT }).map(() => {
      let angle = Math.random() * Math.PI * 2;
      let radius = Math.random() * (RADIUS - 20);
      return {
        x: CENTER.x + Math.cos(angle) * radius,
        y: CENTER.y + Math.sin(angle) * radius,
        vx: (Math.random() - 0.5) * 16,
        vy: (Math.random() - 0.5) * 16,
      };
    });

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.beginPath();
      ctx.arc(CENTER.x, CENTER.y, RADIUS, 0, Math.PI * 2);
      ctx.strokeStyle = "#ffffff20";
      ctx.lineWidth = 2;
      ctx.stroke();

      for (let b of balls) {
        b.x += b.vx;
        b.y += b.vy;

        let distFromCenter = toCenterDist(b.x, b.y);
        if (distFromCenter + BALL_RADIUS > RADIUS) {
          let dx = b.x - CENTER.x;
          let dy = b.y - CENTER.y;
          let mag = Math.sqrt(dx * dx + dy * dy);
          let nx = dx / mag;
          let ny = dy / mag;
          let dot = b.vx * nx + b.vy * ny;
          b.vx -= 2 * dot * nx;
          b.vy -= 2 * dot * ny;
        }

        ctx.beginPath();
        ctx.arc(b.x, b.y, BALL_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = "#f55ac2";
        ctx.fill();
      }

      for (let agent of agents) {
        const closest = balls.reduce((acc, b) =>
          distance(agent, b) < distance(agent, acc) ? b : acc
        );
        let dist = distance(agent, closest);
        let dC = 1.0 - Math.min(dist / 200, 1.0);
        let E = 0.05;
        let S = dC > 0.5 ? 0.4 : 0.1;
        let U = dC - E + S;

        const memAvg = agent.memory.reduce((a, b) => a + b, 0) / agent.memory.length;
        const U_thresh = agent.U_base - memAvg * 0.2;

        let dx = agent.x - closest.x;
        let dy = agent.y - closest.y;
        let mag = Math.sqrt(dx * dx + dy * dy) || 1;
        let speed = 1.0;

        if (agent.logic === "reflex") {
          if (agent.energy > 50) speed = 1.2;
          else speed = 0.3;
        }

        if (
          (agent.logic === "isrm" && U >= U_thresh && agent.energy > 0) ||
          (agent.logic === "reflex" && agent.energy > 0) ||
          (agent.logic === "stoic" && agent.energy > 0 &&
            balls.filter((b) => distance(agent, b) < 60).length > 2)
        ) {
          agent.vx += (dx / mag) * speed;
          agent.vy += (dy / mag) * speed;
          agent.energy = Math.max(0, agent.energy - 0.2);
        } else {
          // Regenerate energy if not moving
          agent.energy = Math.min(100, agent.energy + 0.1);
        }

        agent.x += agent.vx;
        agent.y += agent.vy;
        agent.vx *= 0.85;
        agent.vy *= 0.85;

        let dFromCenter = toCenterDist(agent.x, agent.y);
        if (dFromCenter + AGENT_RADIUS > RADIUS) {
          let dx = agent.x - CENTER.x;
          let dy = agent.y - CENTER.y;
          let mag = Math.sqrt(dx * dx + dy * dy);
          let nx = dx / mag;
          let ny = dy / mag;
          let dot = agent.vx * nx + agent.vy * ny;
          agent.vx -= 2 * dot * nx;
          agent.vy -= 2 * dot * ny;
          agent.x = CENTER.x + nx * (RADIUS - AGENT_RADIUS);
          agent.y = CENTER.y + ny * (RADIUS - AGENT_RADIUS);
        }

        let gotHit = 0;
        if (agent.cooldown === 0) {
          for (let b of balls) {
            if (distance(agent, b) < AGENT_RADIUS + BALL_RADIUS) {
              agent.hits += 1;
              agent.cooldown = 30;
              gotHit = 1;
              b.vx *= -1;
              b.vy *= -1;
              break;
            }
          }
        } else {
          agent.cooldown -= 1;
        }

        agent.memory.shift();
        agent.memory.push(gotHit);

        ctx.beginPath();
        ctx.arc(agent.x, agent.y, AGENT_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = agent.color;
        ctx.fill();

        // Energy bar
        const barWidth = 40;
        const barHeight = 5;
        const energyRatio = agent.energy / 100;
        ctx.fillStyle = "#444";
        ctx.fillRect(agent.x - barWidth / 2, agent.y + 16, barWidth, barHeight);
        ctx.fillStyle = agent.color;
        ctx.fillRect(agent.x - barWidth / 2, agent.y + 16, barWidth * energyRatio, barHeight);

        ctx.font = "12px monospace";
        ctx.fillStyle = "#ffffff";
        ctx.fillText(`${agent.logic} (${agent.hits})`, agent.x + 12, agent.y);
      }

      setHits({
        isrm: agents[0].hits,
        reflex: agents[1].hits,
        stoic: agents[2].hits,
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
        <div className="mt-4 text-sm text-white/70 flex gap-6 justify-center">
          <div>🟢 ISRM Hits: {hits.isrm}</div>
          <div>🔵 Reflex Hits: {hits.reflex}</div>
          <div>🟠 Stoic Hits: {hits.stoic}</div>
        </div>
      </div>
    </section>
  );
};

export default BallAvoidanceSim;
