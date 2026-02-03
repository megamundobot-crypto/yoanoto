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

// Birome drawing canvas - strokes disappear after registering point
function BiromeCanvas({ onStrokeComplete, score1, score2, team1, team2, maxPoints }) {
  const canvasRef = useRef(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentPath, setCurrentPath] = useState([])
  const [flash, setFlash] = useState(null) // {team: 1 or 2} for visual feedback

  const getPos = (e) => {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const touch = e.touches ? e.touches[0] : e
    return {
      x: (touch.clientX - rect.left) * (canvas.width / rect.width),
      y: (touch.clientY - rect.top) * (canvas.height / rect.height)
    }
  }

  const startDrawing = (e) => {
    e.preventDefault()
    const pos = getPos(e)
    setIsDrawing(true)
    setCurrentPath([pos])
  }

  const draw = (e) => {
    if (!isDrawing) return
    e.preventDefault()
    const pos = getPos(e)
    setCurrentPath(prev => [...prev, pos])
  }

  const stopDrawing = (e) => {
    if (!isDrawing) return
    e.preventDefault()
    setIsDrawing(false)

    if (currentPath.length > 3) {
      const minX = Math.min(...currentPath.map(p => p.x))
      const maxX = Math.max(...currentPath.map(p => p.x))
      const minY = Math.min(...currentPath.map(p => p.y))
      const maxY = Math.max(...currentPath.map(p => p.y))
      const strokeLength = Math.max(maxX - minX, maxY - minY)

      if (strokeLength > 20) {
        const avgX = currentPath.reduce((sum, p) => sum + p.x, 0) / currentPath.length
        const canvas = canvasRef.current
        const midX = canvas.width / 2
        const team = avgX < midX ? 1 : 2

        // Flash feedback
        setFlash({ team })
        setTimeout(() => setFlash(null), 300)

        onStrokeComplete(team)
      }
    }
    setCurrentPath([])
  }

  // Render canvas
  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')

    // Paper texture background
    ctx.fillStyle = '#fffef8'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Flash effect when point is scored
    if (flash) {
      ctx.fillStyle = flash.team === 1 ? 'rgba(59, 130, 246, 0.2)' : 'rgba(249, 115, 22, 0.2)'
      if (flash.team === 1) {
        ctx.fillRect(0, 0, canvas.width / 2, canvas.height)
      } else {
        ctx.fillRect(canvas.width / 2, 0, canvas.width / 2, canvas.height)
      }
    }

    // Subtle grid lines like notebook paper
    ctx.strokeStyle = 'rgba(200, 200, 220, 0.3)'
    ctx.lineWidth = 1
    for (let y = 30; y < canvas.height; y += 30) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(canvas.width, y)
      ctx.stroke()
    }

    // Center divider
    ctx.strokeStyle = 'rgba(200, 100, 100, 0.4)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(canvas.width / 2, 0)
    ctx.lineTo(canvas.width / 2, canvas.height)
    ctx.stroke()

    // Team labels
    ctx.font = 'bold 16px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillStyle = 'rgba(59, 130, 246, 0.6)'
    ctx.fillText(team1, canvas.width / 4, 25)
    ctx.fillStyle = 'rgba(249, 115, 22, 0.6)'
    ctx.fillText(team2, (canvas.width / 4) * 3, 25)

    // Score display in canvas
    ctx.font = 'bold 48px Georgia, serif'
    ctx.textAlign = 'center'
    ctx.fillStyle = 'rgba(59, 130, 246, 0.15)'
    ctx.fillText(score1.toString(), canvas.width / 4, canvas.height / 2 + 15)
    ctx.fillStyle = 'rgba(249, 115, 22, 0.15)'
    ctx.fillText(score2.toString(), (canvas.width / 4) * 3, canvas.height / 2 + 15)

    // Draw current stroke (birome style) - disappears when released
    if (currentPath.length > 1) {
      ctx.strokeStyle = '#1a237e'
      ctx.lineWidth = 3
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.beginPath()
      ctx.moveTo(currentPath[0].x, currentPath[0].y)
      for (let i = 1; i < currentPath.length; i++) {
        ctx.lineTo(currentPath[i].x, currentPath[i].y)
      }
      ctx.stroke()
    }
  }, [currentPath, flash, score1, score2, team1, team2])

  return (
    <canvas
      ref={canvasRef}
      width={600}
      height={500}
      className="w-full h-full touch-none rounded-lg"
      style={{ cursor: 'crosshair' }}
      onMouseDown={startDrawing}
      onMouseMove={draw}
      onMouseUp={stopDrawing}
      onMouseLeave={stopDrawing}
      onTouchStart={startDrawing}
      onTouchMove={draw}
      onTouchEnd={stopDrawing}
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
          onStrokeComplete={(team) => addPoints(team, 1)}
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
