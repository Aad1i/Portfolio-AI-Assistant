import { useRef, useEffect } from 'react'

function NeuralBackground() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    let animationId
    let particles = []
    let shootingStars = []

    function resize() {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const particleCount = Math.min(70, Math.floor((window.innerWidth * window.innerHeight) / 15000))
    particles = Array.from({ length: particleCount }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
    }))

    const connectDistance = 140

    function spawnShootingStar() {
      const startX = Math.random() * canvas.width
      const startY = Math.random() * canvas.height * 0.4 // starts in upper portion
      const angle = (Math.PI / 4) + (Math.random() * 0.3 - 0.15) // roughly diagonal, slight variation
      const speed = 8 + Math.random() * 6
      shootingStars.push({
        x: startX,
        y: startY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1, // fades from 1 to 0
      })
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      particles.forEach((p) => {
        p.x += p.vx
        p.y += p.vy
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1
      })

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < connectDistance) {
            const opacity = 1 - dist / connectDistance
            ctx.strokeStyle = `rgba(136, 136, 255, ${opacity * 0.4})`
            ctx.lineWidth = 1
            ctx.beginPath()
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.stroke()
          }
        }
      }

      particles.forEach((p) => {
        ctx.beginPath()
        ctx.arc(p.x, p.y, 2, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(180, 180, 255, 0.8)'
        ctx.fill()
      })

      // Randomly spawn a new shooting star occasionally
      if (Math.random() < 0.008) spawnShootingStar()

      // Update and draw shooting stars
      shootingStars = shootingStars.filter((s) => s.life > 0)
      shootingStars.forEach((s) => {
        s.x += s.vx
        s.y += s.vy
        s.life -= 0.02

        const tailX = s.x - s.vx * 4
        const tailY = s.y - s.vy * 4
        const gradient = ctx.createLinearGradient(s.x, s.y, tailX, tailY)
        gradient.addColorStop(0, `rgba(255, 255, 255, ${s.life})`)
        gradient.addColorStop(1, 'rgba(1, 5, 252, 0)')

        ctx.strokeStyle = gradient
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(s.x, s.y)
        ctx.lineTo(tailX, tailY)
        ctx.stroke()
      })

      animationId = requestAnimationFrame(draw)
    }
    draw()

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return <canvas ref={canvasRef} className="neural-bg" />
}

export default NeuralBackground