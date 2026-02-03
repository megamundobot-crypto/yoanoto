import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// Sound effects
const playSound = (type) => {
  if (typeof window === 'undefined') return
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
    const oscillator = audioCtx.createOscillator()
    const gainNode = audioCtx.createGain()
    oscillator.connect(gainNode)
    gainNode.connect(audioCtx.destination)

    if (type === 'tap') {
      oscillator.frequency.setValueAtTime(600, audioCtx.currentTime)
      oscillator.frequency.exponentialRampToValueAtTime(200, audioCtx.currentTime + 0.08)
      gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.08)
      oscillator.start()
      oscillator.stop(audioCtx.currentTime + 0.08)
    } else if (type === 'win') {
      [523, 659, 784, 1047].forEach((freq, i) => {
        setTimeout(() => {
          try {
            const o = audioCtx.createOscillator()
            const g = audioCtx.createGain()
            o.connect(g)
            g.connect(audioCtx.destination)
            o.frequency.value = freq
            g.gain.setValueAtTime(0.15, audioCtx.currentTime)
            g.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2)
            o.start()
            o.stop(audioCtx.currentTime + 0.2)
          } catch(e) {}
        }, i * 150)
      })
    }
  } catch (e) {}
}

// Birome canvas - draws based on actual score, tap to add +1
function BiromeCanvas({ onStrokeComplete, score1, score2, team1, team2, maxPoints }) {
  const canvasRef = useRef(null)
  const strokeCacheRef = useRef({ team1: [], team2: [] })

  // Generate wobble values for a stroke (cached so they don't change on re-render)
  const getStrokeWithWobble = (team, index) => {
    const cache = team === 1 ? strokeCacheRef.current.team1 : strokeCacheRef.current.team2
    if (cache[index]) return cache[index]

    const canvas = canvasRef.current
    if (!canvas) return null

    const halfWidth = canvas.width / 2
    const baseX = team === 1 ? 30 : halfWidth + 30
    const groupIndex = Math.floor(index / 5)
    const strokeInGroup = index % 5

    const groupCol = groupIndex % 3
    const groupRow = Math.floor(groupIndex / 3)
    const groupX = baseX + groupCol * 75
    const groupY = 55 + groupRow * 65
    const size = 35

    let x1, y1, x2, y2
    switch (strokeInGroup) {
      case 0: x1 = groupX; y1 = groupY; x2 = groupX; y2 = groupY + size; break
      case 1: x1 = groupX; y1 = groupY; x2 = groupX + size; y2 = groupY; break
      case 2: x1 = groupX + size; y1 = groupY; x2 = groupX + size; y2 = groupY + size; break
      case 3: x1 = groupX; y1 = groupY + size; x2 = groupX + size; y2 = groupY + size; break
      case 4: x1 = groupX; y1 = groupY + size; x2 = groupX + size; y2 = groupY; break
    }

    const wobble = () => (Math.random() - 0.5) * 3
    const stroke = { x1: x1 + wobble(), y1: y1 + wobble(), x2: x2 + wobble(), y2: y2 + wobble() }
    cache[index] = stroke
    return stroke
  }

  const handleTap = (e) => {
    e.preventDefault()
    e.stopPropagation()
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    // Handle both touch and mouse events
    let clientX
    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX
    } else if (e.changedTouches && e.changedTouches.length > 0) {
      clientX = e.changedTouches[0].clientX
    } else {
      clientX = e.clientX
    }
    const x = (clientX - rect.left) * (canvas.width / rect.width)
    const team = x < canvas.width / 2 ? 1 : 2
    playSound('tap')
    if (navigator.vibrate) navigator.vibrate(30)
    onStrokeComplete(team, 1)
  }

  // Render canvas based on actual scores
  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const halfPoints = maxPoints / 2

    // Determine phases
    const phase1 = score1 >= halfPoints ? 'buenas' : 'malas'
    const phase2 = score2 >= halfPoints ? 'buenas' : 'malas'
    const display1 = phase1 === 'buenas' ? score1 - halfPoints : score1
    const display2 = phase2 === 'buenas' ? score2 - halfPoints : score2

    // Background with phase colors
    ctx.fillStyle = phase1 === 'buenas' ? '#ecfdf5' : '#fef2f2'
    ctx.fillRect(0, 0, canvas.width / 2, canvas.height)
    ctx.fillStyle = phase2 === 'buenas' ? '#ecfdf5' : '#fef2f2'
    ctx.fillRect(canvas.width / 2, 0, canvas.width / 2, canvas.height)

    // Notebook lines
    ctx.strokeStyle = 'rgba(200, 200, 220, 0.4)'
    ctx.lineWidth = 1
    for (let y = 45; y < canvas.height; y += 30) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(canvas.width, y)
      ctx.stroke()
    }

    // Center divider
    ctx.strokeStyle = 'rgba(150, 100, 100, 0.6)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(canvas.width / 2, 0)
    ctx.lineTo(canvas.width / 2, canvas.height)
    ctx.stroke()

    // Team labels with phase indicator
    ctx.font = 'bold 16px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillStyle = phase1 === 'buenas' ? '#059669' : '#dc2626'
    ctx.fillText(`${team1} - ${phase1 === 'buenas' ? 'BUENAS' : 'MALAS'}`, canvas.width / 4, 22)
    ctx.fillStyle = phase2 === 'buenas' ? '#059669' : '#dc2626'
    ctx.fillText(`${team2} - ${phase2 === 'buenas' ? 'BUENAS' : 'MALAS'}`, (canvas.width / 4) * 3, 22)

    // Draw strokes based on display score
    const drawStroke = (stroke, color) => {
      if (!stroke) return
      ctx.strokeStyle = color
      ctx.lineWidth = 2.5
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(stroke.x1, stroke.y1)
      ctx.lineTo(stroke.x2, stroke.y2)
      ctx.stroke()
    }

    const color1 = phase1 === 'buenas' ? '#047857' : '#1e3a8a'
    const color2 = phase2 === 'buenas' ? '#047857' : '#9a3412'

    for (let i = 0; i < display1; i++) {
      drawStroke(getStrokeWithWobble(1, i), color1)
    }
    for (let i = 0; i < display2; i++) {
      drawStroke(getStrokeWithWobble(2, i), color2)
    }

    // Tap hint
    ctx.font = '13px sans-serif'
    ctx.fillStyle = 'rgba(120, 120, 120, 0.5)'
    ctx.fillText('👆 Tocá para +1', canvas.width / 4, canvas.height - 12)
    ctx.fillText('👆 Tocá para +1', (canvas.width / 4) * 3, canvas.height - 12)

  }, [score1, score2, team1, team2, maxPoints])

  // Reset cache when scores reset
  useEffect(() => {
    if (score1 === 0 && score2 === 0) {
      strokeCacheRef.current = { team1: [], team2: [] }
    }
  }, [score1, score2])

  return (
    <canvas
      ref={canvasRef}
      width={600}
      height={400}
      className="w-full h-full rounded-lg"
      style={{ cursor: 'pointer', touchAction: 'none' }}
      onMouseDown={handleTap}
      onTouchStart={handleTap}
    />
  )
}

// Config screen
function ConfigScreen({ onStart }) {
  const [team1, setTeam1] = useState('Nosotros')
  const [team2, setTeam2] = useState('Ellos')
  const [maxPoints, setMaxPoints] = useState(30)
  const [faltaEnvido, setFaltaEnvido] = useState(2)

  const pointOptions = [6, 9, 12, 18, 24, 30]

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-100 to-amber-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <h1 className="text-4xl font-bold text-center text-gray-800 mb-1" style={{ fontFamily: 'Georgia, serif' }}>
          YoAnoto
        </h1>
        <p className="text-center text-gray-500 mb-6">✏️ Anotador de Truco</p>

        <div className="bg-white rounded-2xl shadow-xl p-6 space-y-5">
          {/* Teams */}
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wider mb-2 block">Equipos</label>
            <div className="flex gap-3 items-center">
              <input
                type="text"
                value={team1}
                onChange={(e) => setTeam1(e.target.value)}
                className="flex-1 p-3 border-2 border-gray-200 rounded-xl text-center font-semibold focus:border-blue-400 focus:outline-none"
                maxLength={12}
              />
              <span className="text-gray-300 font-bold text-lg">vs</span>
              <input
                type="text"
                value={team2}
                onChange={(e) => setTeam2(e.target.value)}
                className="flex-1 p-3 border-2 border-gray-200 rounded-xl text-center font-semibold focus:border-orange-400 focus:outline-none"
                maxLength={12}
              />
            </div>
          </div>

          {/* Points - grid with all options */}
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wider mb-2 block">Puntos de la partida</label>
            <div className="grid grid-cols-3 gap-2">
              {pointOptions.map((pts) => (
                <button
                  key={pts}
                  onClick={() => setMaxPoints(pts)}
                  className={`py-3 rounded-xl font-bold text-lg transition-all ${
                    maxPoints === pts
                      ? 'bg-blue-600 text-white shadow-lg scale-105'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {pts}
                </button>
              ))}
            </div>
          </div>

          {/* Falta Envido */}
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wider mb-2 block">Falta Envido</label>
            <div className="flex gap-2">
              {[1, 2].map((n) => (
                <button
                  key={n}
                  onClick={() => setFaltaEnvido(n)}
                  className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
                    faltaEnvido === n
                      ? 'bg-red-600 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {n} Falta{n > 1 ? 's' : ''}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => onStart({ team1, team2, maxPoints, faltaEnvido })}
            className="w-full py-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-xl shadow-lg transition-all active:scale-95"
          >
            ¡A jugar! 🎴
          </button>
        </div>

        <p className="text-center text-gray-400 text-xs mt-4">
          Dibujá con el dedo como si fuera una birome
        </p>
      </div>
    </div>
  )
}

// Winner modal
function WinnerModal({ winner, onRematch, onNewGame }) {
  useEffect(() => {
    playSound('win')
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.8, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-white rounded-2xl p-8 text-center w-full max-w-xs shadow-2xl"
      >
        <div className="text-6xl mb-4">🏆</div>
        <h2 className="text-2xl font-bold text-gray-600 mb-1">¡Victoria!</h2>
        <h3 className="text-3xl font-bold text-green-600 mb-6">{winner}</h3>
        <button
          onClick={onRematch}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold mb-3 transition-all"
        >
          🔄 Revancha
        </button>
        <button
          onClick={onNewGame}
          className="w-full py-2 text-gray-500 font-medium hover:text-gray-700"
        >
          Nueva configuración
        </button>
      </motion.div>
    </motion.div>
  )
}

// Game screen
function GameScreen({ config, onNewGame }) {
  const [score1, setScore1] = useState(0)
  const [score2, setScore2] = useState(0)
  const [history, setHistory] = useState([])
  const [winner, setWinner] = useState(null)

  useEffect(() => {
    if (score1 >= config.maxPoints && !winner) {
      setWinner(config.team1)
    } else if (score2 >= config.maxPoints && !winner) {
      setWinner(config.team2)
    }
  }, [score1, score2, config.maxPoints, config.team1, config.team2, winner])

  const addPoints = useCallback((team, points) => {
    if (winner) return
    playSound('tap')
    if (navigator.vibrate) navigator.vibrate(30)

    if (team === 1) {
      setScore1((prev) => Math.min(prev + points, config.maxPoints))
    } else {
      setScore2((prev) => Math.min(prev + points, config.maxPoints))
    }
    setHistory((prev) => [...prev, { team, points }])
  }, [winner, config.maxPoints])

  const getFaltaPoints = (forTeam) => {
    const opponentScore = forTeam === 1 ? score2 : score1
    if (config.faltaEnvido === 1) {
      return config.maxPoints - Math.max(score1, score2)
    } else {
      const leader = Math.max(score1, score2)
      return leader >= (config.maxPoints / 2) ? config.maxPoints - leader : (config.maxPoints / 2) - leader
    }
  }

  const undo = () => {
    if (history.length === 0) return
    const last = history[history.length - 1]
    if (last.team === 1) setScore1((p) => Math.max(0, p - last.points))
    else setScore2((p) => Math.max(0, p - last.points))
    setHistory((prev) => prev.slice(0, -1))
    if (winner) setWinner(null)
  }

  const rematch = () => {
    setScore1(0)
    setScore2(0)
    setHistory([])
    setWinner(null)
  }

  return (
    <div className="min-h-screen bg-amber-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b shadow-sm">
        <button onClick={onNewGame} className="text-2xl">⚙️</button>
        <div className="text-center">
          <span className="font-bold text-gray-700">Partida a {config.maxPoints}</span>
          <span className="text-gray-400 text-sm ml-2">({config.faltaEnvido} falta{config.faltaEnvido > 1 ? 's' : ''})</span>
        </div>
        <button
          onClick={undo}
          disabled={history.length === 0}
          className="text-2xl disabled:opacity-30"
        >
          ↩️
        </button>
      </div>

      {/* Score header */}
      <div className="flex bg-white border-b">
        <div className="flex-1 text-center py-2 border-r">
          <div className="font-bold text-blue-700 text-lg">{config.team1}</div>
          <div className="text-3xl font-bold text-gray-800">{score1}</div>
        </div>
        <div className="flex-1 text-center py-2">
          <div className="font-bold text-orange-700 text-lg">{config.team2}</div>
          <div className="text-3xl font-bold text-gray-800">{score2}</div>
        </div>
      </div>

      {/* Drawing area - birome style */}
      <div className="flex-1 mx-3 my-2 rounded-lg shadow-lg overflow-hidden border-2 border-gray-300">
        <BiromeCanvas
          score1={score1}
          score2={score2}
          team1={config.team1}
          team2={config.team2}
          maxPoints={config.maxPoints}
          onStrokeComplete={(team, points) => addPoints(team, points)}
        />
      </div>

      {/* Hint */}
      <div className="text-center text-xs text-gray-400 mb-1">
        ✏️ Dibujá en cada lado para anotar puntos
      </div>

      {/* Quick buttons - columns */}
      <div className="flex gap-2 mx-3 mb-3">
        {/* Team 1 column */}
        <div className="flex-1 bg-blue-50 rounded-xl p-3 border-2 border-blue-200">
          <div className="text-center text-xs text-blue-600 font-bold mb-2">{config.team1}</div>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => addPoints(1, 3)}
              className="py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-bold text-lg transition-all active:scale-95"
            >
              +3
            </button>
            <button
              onClick={() => addPoints(1, 6)}
              className="py-3 bg-blue-700 hover:bg-blue-800 text-white rounded-lg font-bold text-lg transition-all active:scale-95"
            >
              +6
            </button>
            <button
              onClick={() => {
                const pts = getFaltaPoints(1)
                if (pts > 0) addPoints(1, pts)
              }}
              className="py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-sm transition-all active:scale-95"
            >
              Falta +{getFaltaPoints(1)}
            </button>
          </div>
        </div>

        {/* Team 2 column */}
        <div className="flex-1 bg-orange-50 rounded-xl p-3 border-2 border-orange-200">
          <div className="text-center text-xs text-orange-600 font-bold mb-2">{config.team2}</div>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => addPoints(2, 3)}
              className="py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-bold text-lg transition-all active:scale-95"
            >
              +3
            </button>
            <button
              onClick={() => addPoints(2, 6)}
              className="py-3 bg-orange-700 hover:bg-orange-800 text-white rounded-lg font-bold text-lg transition-all active:scale-95"
            >
              +6
            </button>
            <button
              onClick={() => {
                const pts = getFaltaPoints(2)
                if (pts > 0) addPoints(2, pts)
              }}
              className="py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-sm transition-all active:scale-95"
            >
              Falta +{getFaltaPoints(2)}
            </button>
          </div>
        </div>
      </div>

      {/* Winner */}
      <AnimatePresence>
        {winner && (
          <WinnerModal
            winner={winner}
            onRematch={rematch}
            onNewGame={onNewGame}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export default function Home() {
  const [config, setConfig] = useState(null)

  return (
    <AnimatePresence mode="wait">
      {config ? (
        <GameScreen key="game" config={config} onNewGame={() => setConfig(null)} />
      ) : (
        <ConfigScreen key="config" onStart={setConfig} />
      )}
    </AnimatePresence>
  )
}
