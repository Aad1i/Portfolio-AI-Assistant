import { useState, useRef,useEffect } from 'react'
import './App.css'
import { PerspectiveCamera } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { Suspense } from 'react'
import Avatar from './Avatar'
import NeuralBackground from './NeuralBackground' 
import { FaLinkedin, FaGithub, FaEnvelope, FaInstagram } from 'react-icons/fa'
import DefinitionPanel from './DefinitionPanel'


function linkify(text) {
  const urlPattern = /(\bhttps?:\/\/[^\s]+)|(\b[\w.-]+\.(com|org|net|io)\/[^\s]*)|(\b[\w.-]+@[\w.-]+\.\w+\b)/g
  const parts = text.split(urlPattern).filter(Boolean)
  return parts.map((part, i) => {
    const trailingPunctuation = part.match(/[.,!?)]+$/)
    const cleanPart = trailingPunctuation ? part.slice(0, -trailingPunctuation[0].length) : part
    const suffix = trailingPunctuation ? trailingPunctuation[0] : ''
    if (cleanPart.match(/^https?:\/\//)) {
      return <span key={i}><a href={cleanPart} target="_blank" rel="noopener noreferrer">{cleanPart}</a>{suffix}</span>
    }
    if (cleanPart.match(/@/)) {
      return <span key={i}><a href={`mailto:${cleanPart}`}>{cleanPart}</a>{suffix}</span>
    }
    if (cleanPart.match(/\.(com|org|net|io)\//)) {
      return <span key={i}><a href={`https://${cleanPart}`} target="_blank" rel="noopener noreferrer">{cleanPart}</a>{suffix}</span>
    }
    return part
  })
}


function App() {
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [loading, setLoading] = useState(false)
  const [listening, setListening] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const [avatarInfo, setAvatarInfo] = useState(null)
  const recognitionRef = useRef(null)
  const [displayedText, setDisplayedText] = useState('')
  const glowRef = useRef(null)
  const bubbleRef = useRef(null)
  const userScrolledUp = useRef(false)

  useEffect(() => {
  if (bubbleRef.current && !userScrolledUp.current) {
    bubbleRef.current.scrollTop = bubbleRef.current.scrollHeight
  }
}, [displayedText])


  useEffect(() => {
    function handleMouseMove(e) {
      if (glowRef.current) {
        glowRef.current.style.setProperty('--mx', `${e.clientX}px`)
        glowRef.current.style.setProperty('--my', `${e.clientY}px`)
      }
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  useEffect(() => {
    userScrolledUp.current = false
  if (!answer) {
    setDisplayedText('')
    return
  }
  setDisplayedText('')
  let i = 0
  const interval = setInterval(() => {
    i++
    setDisplayedText(answer.slice(0, i))
    if (i >= answer.length) clearInterval(interval)
  }, 25)
  return () => clearInterval(interval)
}, [answer])


  useEffect(() => {
  window.speechSynthesis.getVoices() 
}, [])

useEffect(() => {
  function isScrollableAncestor(el) {
    while (el && el !== document.body) {
      const style = window.getComputedStyle(el)
      const overflowY = style.overflowY
      if ((overflowY === 'auto' || overflowY === 'scroll') && el.scrollHeight > el.clientHeight) {
        return true
      }
      el = el.parentElement
    }
    return false
  }

  function blockScroll(e) {
    if (isScrollableAncestor(e.target)) return
    e.preventDefault()
  }

  function blockScrollKeys(e) {
    const isTyping = e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA'
    if (isTyping) return
    const keys = ['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' ']
    if (keys.includes(e.key)) e.preventDefault()
  }

  window.addEventListener('wheel', blockScroll, { passive: false })
  window.addEventListener('touchmove', blockScroll, { passive: false })
  window.addEventListener('keydown', blockScrollKeys)

  return () => {
    window.removeEventListener('wheel', blockScroll)
    window.removeEventListener('touchmove', blockScroll)
    window.removeEventListener('keydown', blockScrollKeys)
  }
}, [])
  async function askAI(text) {
    setLoading(true)
    setAnswer('')
    try {
      const response = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: text }),
      })
      const data = await response.json()
      setAnswer(data.answer)
      speak(data.answer)
    } catch (error) {
      setAnswer('Something went wrong. Try again.')
    } finally {
      setLoading(false)
    }
  }

  function handleSubmit(e) {
    e.preventDefault()
    askAI(question)
  }

  function speak(text) {
    window.speechSynthesis.cancel() 
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 1
    utterance.pitch = 1.05

    const voices = window.speechSynthesis.getVoices()
    const femalevoice = voices.find(v=>
      v.lang.startsWith('en') && /female|zira|susan|samantha|victoria|karen| google us english/i.test(v.name)
    )
    if (femalevoice) {
      utterance.voice = femalevoice
    }

    utterance.onstart = () => setSpeaking(true)
    utterance.onend = () => setSpeaking(false)

    window.speechSynthesis.speak(utterance)
  }

  function startListening() {
    window.speechSynthesis.cancel()
  setSpeaking(false)

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
  if (!SpeechRecognition) {
    alert('Speech recognition is not supported in this browser. Try Chrome.')
    return    }

    const recognition = new SpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = 'en-US'

    recognition.onstart = () => setListening(true)
    recognition.onend = () => setListening(false)

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript
      setQuestion(transcript)
      askAI(transcript) 
    }

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error)
      setListening(false)
    }

    recognitionRef.current = recognition
    recognition.start()
  }

return (
  <div className="App">
    <NeuralBackground />
    <div ref={glowRef} className="cursor-glow" />

    <nav>
     <a href="#home" onClick={(e) => { e.preventDefault(); document.getElementById('home').scrollIntoView({ behavior: 'smooth' }) }}>Home</a>
     <a href="#about" onClick={(e) => { e.preventDefault(); document.getElementById('about').scrollIntoView({ behavior: 'smooth' }) }}>About</a>
     <a href="#projects" onClick={(e) => { e.preventDefault(); document.getElementById('projects').scrollIntoView({ behavior: 'smooth' }) }}>Projects</a>
     <a href="#contact" onClick={(e) => { e.preventDefault(); document.getElementById('contact').scrollIntoView({ behavior: 'smooth' }) }}>Contact</a>
      <div className="social-icons">
      <a href="https://linkedin.com/in/4dityagiri1/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
      <FaLinkedin />
      </a>
      <a href="https://github.com/Aad1i" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
      <FaGithub />
      </a>
      <a href="mailto:4dityagiri@gmail.com" aria-label="Email">
      <FaEnvelope />
      </a>
      <a href="https://instagram.com/ykw.aadii" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
      <FaInstagram />
      </a>
      </div>
    </nav>

    <section id="home" className="section">
      <h1>Aditya's AI Portfolio</h1>

      <DefinitionPanel />


      <div className="stage">
        <div className="avatar-container">
          <Canvas>
            <PerspectiveCamera
              makeDefault
              position={[0, avatarInfo ? avatarInfo.visibleCenterY : 0.8, avatarInfo ? (avatarInfo.visibleHeight / 2) / Math.tan((35 * Math.PI / 180) / 2) * 1.4 : 2]}
              fov={35}
            />
            <ambientLight intensity={1} />
            <directionalLight position={[2, 2, 2]} intensity={1} />
            <Suspense fallback={null}>
              <Avatar listening={listening} speaking={speaking} onReady={setAvatarInfo} />
            </Suspense>
          </Canvas>
        </div>
        {answer && (
  <div
    className="thought-bubble"
    ref={bubbleRef}
    onScroll={(e) => {
      const el = e.target
      const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
      userScrolledUp.current = distanceFromBottom > 30
    }}
  >
    <p>{linkify(displayedText)}</p>
  </div>
)}
      </div>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Type or click the mic to speak..."
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Thinking...' : 'Ask'}
        </button>
        <button type="button" onClick={startListening} disabled={listening || loading}>
          {listening ? '🎙️ Listening...' : '🎤 Speak'}
        </button>
      </form>
    </section>

    <section id="about" className="section">
      <h2>About Me</h2>
      <div className="about-content">
        <img src="/images/Mugshot.jpg" alt="Aditya Giri" className="about-photo" />
        <p className="about-text">
           Hiii, I'm Aditya Giri, an undergraduate CS grad specializing in AI &amp; Machine Learning
          from Sharda University. I've co-authored two research papers, freelanced as a video editor and data analyst, and I learn best
          by diving in first and figuring out the "why" through the errors I hit along the way. Currently, I'm exploring opportunities to practice my skills in real-world projects, and I'm open to collaborations, internships, or any chance to contribute to meaningful AI work.
        </p>
      </div>
    </section>

    <section id="projects" className="section">
      <h2>Projects</h2>
      <div className="projects-grid">
        <div className="project-card">
          <h3>Lung Cancer Detection (Research)</h3>
          <p>An ensemble ML model predicting lung cancer likelihood from simple risk-factor questions, aimed at cheap, accessible early screening. Published in CRC Press Book "Next-Generation AI: Convergence of Neuroscience, Edge Computing, and Sustainable Technologies".</p>
        </div>
        <div className="project-card">
          <h3>ECG Signal Preprocessing (Research)</h3>
          <p>A three-stage pipeline for cleaning noisy ECG signals into high-quality input for AI-driven cardiac analysis. Under review with Cambridge Scholars.</p>
        </div>
        <div className="project-card">
          <h3>This Interactive AI Assistant</h3>
          <p>A voice-driven, 3D-avatar portfolio assistant built with React, Three.js, and Groq — built from zero web dev knowledge, with Claude as a hands-on collaborator.</p>
        </div>
      </div>
    </section>

    <section id="contact" className="section">
      <h2>Get In Touch</h2>
      <div className="contact-links">
        <a href="mailto:4dityagiri@gmail.com">Email</a>
        <a href="https://linkedin.com/in/4dityagiri1/" target="_blank" rel="noopener noreferrer">LinkedIn</a>
        <a href="https://github.com/Aad1i" target="_blank" rel="noopener noreferrer">GitHub</a>
      </div>
    </section>
  </div>
)
}
export default App