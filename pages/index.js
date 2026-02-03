import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// Dynamically import confetti to avoid SSR issues
const confetti = typeof window !== 'undefined' ? require('canvas-confetti') : null

// Sound effects using Web Audio API
const playSound = (type) => {
  if (typeof window === 'undefined') return
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
    const oscillator = audioCtx.createOscillator()
    const gainNode = audioCtx.createGain()
    oscillator.connect(gainNode)
    gainNode.connect(audioCtx.destination)

    if (type === 'tap') {
      oscillator.frequency.setValueAtTime(800, audioCtx.currentTime)
      oscillator.frequency.exponentialRampToValueAtTime(400, audioCtx.currentTime + 0.05)
      gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.05)
      oscillator.start(audioCtx.currentTime)
      oscillator.stop(audioCtx.currentTime + 0.05)
    } else if (type === 'win') {
      const notes = [523, 659, 784, 1047]
      notes.forEach((freq, i) => {
        const osc = audioCtx.createOscillator()
        const gain = audioCtx.createGain()
        osc.connect(gain)
        gain.connect(audioCtx.destination)
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime + i * 0.15)
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime + i * 0.15)
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + i * 0.15 + 0.3)
        osc.start(audioCtx.currentTime + i * 0.15)
        osc.stop(audioCtx.currentTime + i * 0.15 + 0.3)
      })
    } else if (type === 'undo') {
      oscillator.frequency.setValueAtTime(300, audioCtx.currentTime)
      oscillator.frequency.exponentialRampToValueAtTime(600, audioCtx.currentTime + 0.1)
      gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1)
      oscillator.start(audioCtx.currentTime)
      oscillator.stop(audioCtx.currentTime + 0.1)
    }
  } catch (e) {}
}

// Points options
const POINTS_OPTIONS = [15, 30]

// Fosforo (matchstick) SVG component
function Fosforo({ rotation = 0, isNew = false }) {
  return (
    <motion.div
      initial={isNew ? { scale: 0, opacity: 0 } : false}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="absolute"
      style={{
        width: '8px',
        height: '45px',
        transform: `rotate(${rotation}deg)`,
        transformOrigin: 'center',
      }}
    >
      {/* Matchstick body */}
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2"
        style={{
          width: '6px',
          height: '38px',
          background: 'linear-gradient(90deg, #D4A574 0%, #E8C99B 50%, #D4A574 100%)',
          borderRadius: '1px',
          boxShadow: '1px 1px 2px rgba(0,0,0,0.3)',
        }}
      />
      {/* Matchstick head */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2"
        style={{
          width: '8px',
          height: '10px',
          background: 'linear-gradient(180deg, #8B0000 0%, #CD5C5C 30%, #8B0000 100%)',
          borderRadius: '3px 3px 1px 1px',
        }}
      />
    </motion.div>
  )
}

// Group of 5 fosforos forming a square with diagonal
function FosforoGroup({ count, isNewGroup }) {
  // Square: top, right, bottom, left + diagonal
  return (
    <div className="relative w-16 h-16 m-1">
      {/* Top horizontal */}
      {count >= 1 && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2">
          <Fosforo rotation={90} isNew={isNewGroup && count === 1} />
        </div>
      )}
      {/* Right vertical */}
      {count >= 2 && (
        <div className="absolute right-0 top-1/2 -translate-y-1/2">
          <Fosforo rotation={0} isNew={isNewGroup && count === 2} />
        </div>
      )}
      {/* Bottom horizontal */}
      {count >= 3 && (
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2">
          <Fosforo rotation={90} isNew={isNewGroup && count === 3} />
        </div>
      )}
      {/* Left vertical */}
      {count >= 4 && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2">
          <Fosforo rotation={0} isNew={isNewGroup && count === 4} />
        </div>
      )}
      {/* Diagonal */}
      {count >= 5 && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <Fosforo rotation={45} isNew={isNewGroup && count === 5} />
        </div>
      )}
    </div>
  )
}

// Score display for one team
function ScoreColumn({ score, maxScore, teamName, onAdd, isBuenas }) {
  const displayScore = isBuenas ? score - 15 : score
  const fullGroups = Math.floor(displayScore / 5)
  const remainder = displayScore % 5

  const groups = []
  for (let i = 0; i < fullGroups; i++) {
    groups.push(<FosforoGroup key={i} count={5} isNewGroup={false} />)
  }
  if (remainder > 0) {
    groups.push(<FosforoGroup key={fullGroups} count={remainder} isNewGroup={true} />)
  }

  const bgColor = isBuenas
    ? 'bg-gradient-to-b from-green-800 to-green-900'
    : 'bg-gradient-to-b from-red-800 to-red-900'

  return (
    <div className={`flex-1 flex flex-col ${bgColor} rounded-lg m-1 overflow-hidden`}>
      {/* Team name header */}
      <div className="bg-orange-500 py-2 px-3 text-center shadow-md">
        <h2 className="text-xl font-bold text-white uppercase tracking-wide" style={{ textShadow: '2px 2px 2px rgba(0,0,0,0.5)' }}>
          {teamName}
        </h2>
      </div>

      {/* Score info */}
      <div className="bg-sky-400 py-1 px-2 text-center">
        <span className="text-lg font-bold text-white">
          {displayScore} {isBuenas ? 'Buenas' : 'Malas'}
        </span>
      </div>

      {/* Matchsticks area */}
      <div className="flex-1 flex flex-wrap content-start justify-center p-2 min-h-[200px]">
        {groups.length > 0 ? groups : (
          <span className="text-white/30 text-lg mt-8">0</span>
        )}
      </div>

      {/* Quick add buttons */}
      <div className="flex gap-2 p-2 bg-black/20">
        <button
          onClick={() => onAdd(2)}
          className="flex-1 py-3 bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white text-xl font-bold rounded-lg shadow-lg"
        >
          +2
        </button>
        <button
          onClick={() => onAdd(4)}
          className="flex-1 py-3 bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white text-xl font-bold rounded-lg shadow-lg"
        >
          +4
        </button>
      </div>
    </div>
  )
}

// Configuration screen
function ConfigScreen({ onStart }) {
  const [team1, setTeam1] = useState('Nosotros')
  const [team2, setTeam2] = useState('Ellos')
  const [maxPoints, setMaxPoints] = useState(30)
  const [withFlor, setWithFlor] = useState(false)
  const [faltaEnvido, setFaltaEnvido] = useState(2)

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-800 to-amber-950 px-4 py-8 flex flex-col items-center justify-center">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-amber-200 mb-1">
            🍺 YoAnoto
          </h1>
          <p className="text-lg text-amber-400">
            Anotador de Truco Argentino
          </p>
        </div>

        <div className="bg-amber-100 rounded-2xl p-5 w-full space-y-4 shadow-xl">
          {/* Team names */}
          <div className="space-y-2">
            <label className="text-lg text-amber-900 block font-bold">Equipos</label>
            <div className="flex gap-2 items-center">
              <input
                type="text"
                value={team1}
                onChange={(e) => setTeam1(e.target.value)}
                placeholder="Nosotros"
                maxLength={12}
                className="flex-1 p-2 rounded-lg bg-white border-2 border-amber-600 text-lg text-center"
              />
              <span className="text-xl font-bold text-amber-700">vs</span>
              <input
                type="text"
                value={team2}
                onChange={(e) => setTeam2(e.target.value)}
                placeholder="Ellos"
                maxLength={12}
                className="flex-1 p-2 rounded-lg bg-white border-2 border-amber-600 text-lg text-center"
              />
            </div>
          </div>

          {/* Points */}
          <div className="space-y-2">
            <label className="text-lg text-amber-900 block font-bold">Partida a</label>
            <div className="flex gap-2">
              {POINTS_OPTIONS.map((pts) => (
                <button
                  key={pts}
                  onClick={() => setMaxPoints(pts)}
                  className={`flex-1 p-3 rounded-lg text-xl font-bold transition-all ${
                    maxPoints === pts
                      ? 'bg-amber-700 text-white'
                      : 'bg-white text-amber-800 border-2 border-amber-400'
                  }`}
                >
                  {pts}
                </button>
              ))}
            </div>
          </div>

          {/* Flor toggle */}
          <div className="flex items-center justify-between p-3 bg-white rounded-lg">
            <span className="text-lg text-amber-900 font-bold">Con Flor</span>
            <button
              onClick={() => setWithFlor(!withFlor)}
              className={`w-14 h-7 rounded-full transition-all ${
                withFlor ? 'bg-green-500' : 'bg-gray-400'
              }`}
            >
              <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${
                withFlor ? 'translate-x-8' : 'translate-x-1'
              }`} />
            </button>
          </div>

          {/* Falta Envido */}
          <div className="space-y-2">
            <label className="text-lg text-amber-900 block font-bold">Falta Envido</label>
            <div className="flex gap-2">
              <button
                onClick={() => setFaltaEnvido(1)}
                className={`flex-1 p-2 rounded-lg text-base font-bold transition-all ${
                  faltaEnvido === 1
                    ? 'bg-amber-700 text-white'
                    : 'bg-white text-amber-800 border-2 border-amber-400'
                }`}
              >
                1 Falta
              </button>
              <button
                onClick={() => setFaltaEnvido(2)}
                className={`flex-1 p-2 rounded-lg text-base font-bold transition-all ${
                  faltaEnvido === 2
                    ? 'bg-amber-700 text-white'
                    : 'bg-white text-amber-800 border-2 border-amber-400'
                }`}
              >
                2 Faltas
              </button>
            </div>
            <p className="text-sm text-amber-700 text-center">
              {faltaEnvido === 1
                ? 'Completa a ' + maxPoints
                : 'Completa a 15 (malas) o ' + maxPoints + ' (buenas)'}
            </p>
          </div>

          {/* Start button */}
          <button
            onClick={() => onStart({ team1, team2, maxPoints, withFlor, faltaEnvido })}
            className="w-full p-4 bg-green-600 hover:bg-green-500 text-white rounded-xl text-2xl font-bold mt-4 shadow-lg"
          >
            🃏 ¡Empezar!
          </button>
        </div>

        <p className="text-center mt-4 text-amber-400 text-sm">
          Hecho con 🧉 en Argentina
        </p>
      </div>
    </div>
  )
}

// Winner celebration
function WinnerCelebration({ winner, onNewGame, onRematch }) {
  useEffect(() => {
    if (confetti) {
      const duration = 3000
      const end = Date.now() + duration
      const frame = () => {
        confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#FFD700', '#CC0000', '#00A550'] })
        confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#FFD700', '#CC0000', '#00A550'] })
        if (Date.now() < end) requestAnimationFrame(frame)
      }
      frame()
    }
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="bg-amber-100 rounded-3xl p-8 text-center max-w-sm w-full shadow-2xl"
      >
        <div className="text-6xl mb-4">🏆</div>
        <h2 className="text-3xl font-bold text-amber-900 mb-2">¡Ganó!</h2>
        <h3 className="text-4xl font-bold text-green-700 mb-6">{winner}</h3>
        <div className="space-y-3">
          <button onClick={onRematch} className="w-full p-4 bg-amber-600 text-white rounded-xl text-xl font-bold">
            🔄 Revancha
          </button>
          <button onClick={onNewGame} className="w-full p-3 bg-gray-500 text-white rounded-xl text-lg font-bold">
            ⚙️ Nueva Config
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// Main game screen
function GameScreen({ config, onNewGame }) {
  const [score1, setScore1] = useState(0)
  const [score2, setScore2] = useState(0)
  const [history, setHistory] = useState([])
  const [winner, setWinner] = useState(null)

  // Check if in "buenas" (second half)
  const isBuenas1 = score1 >= 15
  const isBuenas2 = score2 >= 15

  // Check for winner
  useEffect(() => {
    if (score1 >= config.maxPoints) {
      setWinner(config.team1)
      playSound('win')
    } else if (score2 >= config.maxPoints) {
      setWinner(config.team2)
      playSound('win')
    }
  }, [score1, score2, config.maxPoints, config.team1, config.team2])

  const vibrate = () => {
    if (navigator.vibrate) navigator.vibrate(50)
  }

  // Add points to team
  const addPoints = useCallback((team, points) => {
    if (winner) return
    vibrate()
    playSound('tap')

    if (team === 1) {
      setScore1((prev) => Math.min(prev + points, config.maxPoints))
    } else {
      setScore2((prev) => Math.min(prev + points, config.maxPoints))
    }
    setHistory((prev) => [...prev, { team, points, timestamp: Date.now() }])
  }, [winner, config.maxPoints])

  // Calculate falta envido points
  const getFaltaPoints = (team) => {
    const myScore = team === 1 ? score1 : score2

    if (config.faltaEnvido === 1) {
      // 1 Falta: completa directo al máximo (30 o 15)
      return config.maxPoints - myScore
    } else {
      // 2 Faltas: completa a 15 si está en malas, o al máximo si está en buenas
      const inBuenas = myScore >= 15
      if (inBuenas) {
        return config.maxPoints - myScore
      } else {
        return 15 - myScore
      }
    }
  }

  // Undo last action
  const undo = () => {
    if (history.length === 0) return
    playSound('undo')
    const last = history[history.length - 1]
    if (last.team === 1) {
      setScore1((prev) => Math.max(0, prev - last.points))
    } else {
      setScore2((prev) => Math.max(0, prev - last.points))
    }
    setHistory((prev) => prev.slice(0, -1))
    setWinner(null)
  }

  const rematch = () => {
    setScore1(0)
    setScore2(0)
    setHistory([])
    setWinner(null)
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background: 'linear-gradient(180deg, #5D4037 0%, #3E2723 100%)',
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-center py-3 bg-black/30">
        <span className="text-2xl font-bold text-white px-4 py-1 bg-amber-900 rounded-lg">
          {config.maxPoints}
        </span>
      </div>

      {/* Score columns */}
      <div className="flex-1 flex p-2">
        <ScoreColumn
          score={score1}
          maxScore={config.maxPoints}
          teamName={config.team1}
          onAdd={(pts) => addPoints(1, pts)}
          isBuenas={isBuenas1}
        />

        {/* Divider */}
        <div className="w-2 flex items-center justify-center">
          <div className="h-full w-1 bg-gradient-to-b from-sky-300 via-white to-sky-300 rounded-full opacity-80" />
        </div>

        <ScoreColumn
          score={score2}
          maxScore={config.maxPoints}
          teamName={config.team2}
          onAdd={(pts) => addPoints(2, pts)}
          isBuenas={isBuenas2}
        />
      </div>

      {/* Bottom buttons */}
      <div className="flex gap-2 p-3 bg-black/40">
        <button
          onClick={() => addPoints(1, 1)}
          className="flex-1 py-2 bg-gray-600 text-white rounded-lg font-bold"
        >
          +1
        </button>
        <button
          onClick={() => {
            const pts = getFaltaPoints(1)
            if (pts > 0) addPoints(1, pts)
          }}
          className="flex-1 py-2 bg-red-700 text-white rounded-lg font-bold text-sm"
        >
          Falta ({getFaltaPoints(1)})
        </button>
        <button
          onClick={undo}
          disabled={history.length === 0}
          className="py-2 px-4 bg-gray-700 text-white rounded-lg font-bold disabled:opacity-50"
        >
          ↩️
        </button>
        <button
          onClick={() => {
            const pts = getFaltaPoints(2)
            if (pts > 0) addPoints(2, pts)
          }}
          className="flex-1 py-2 bg-red-700 text-white rounded-lg font-bold text-sm"
        >
          Falta ({getFaltaPoints(2)})
        </button>
        <button
          onClick={() => addPoints(2, 1)}
          className="flex-1 py-2 bg-gray-600 text-white rounded-lg font-bold"
        >
          +1
        </button>
      </div>

      {/* Settings button */}
      <button
        onClick={onNewGame}
        className="absolute top-3 right-3 p-2 bg-black/30 rounded-full"
      >
        ⚙️
      </button>

      {/* Winner modal */}
      <AnimatePresence>
        {winner && (
          <WinnerCelebration
            winner={winner}
            onNewGame={onNewGame}
            onRematch={rematch}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// Main component
export default function Home() {
  const [gameConfig, setGameConfig] = useState(null)

  const handleStart = (config) => {
    localStorage.setItem('trucoConfig', JSON.stringify(config))
    setGameConfig(config)
  }

  return (
    <main>
      <AnimatePresence mode="wait">
        {gameConfig ? (
          <GameScreen key="game" config={gameConfig} onNewGame={() => setGameConfig(null)} />
        ) : (
          <ConfigScreen key="config" onStart={handleStart} />
        )}
      </AnimatePresence>
    </main>
  )
}
