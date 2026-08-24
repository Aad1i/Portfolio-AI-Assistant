import { useState, useEffect } from 'react'

const definitions = [
  { term: 'Artificial Intelligence', text: 'The broad field of building systems that can perform tasks normally requiring human intelligence.' },
  { term: 'Machine Learning', text: 'A subset of AI where systems learn patterns from data instead of being explicitly programmed.' },
  { term: 'Neural Network', text: 'A model loosely inspired by the brain — layers of connected nodes that learn to recognize patterns.' },
  { term: 'Deep Learning', text: 'Neural networks with many layers, capable of learning complex, high-level patterns from large data.' },
]

function DefinitionPanel() {
  const [index, setIndex] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % definitions.length)
        setVisible(true)
      }, 400)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  const current = definitions[index]

  return (
    <div className="definition-panel">
      <h3 className={visible ? 'fade-in' : 'fade-out'}>{current.term}</h3>
      <p className={visible ? 'fade-in' : 'fade-out'}>{current.text}</p>
    </div>
  )
}

export default DefinitionPanel