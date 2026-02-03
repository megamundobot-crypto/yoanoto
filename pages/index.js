import { useState, useEffect, useCallback } from 'react'
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

// Simple tally mark - just a line
function TallyMark({ index, total, isNew }) {
  const isDiagonal = index === 4 // 5th mark crosses the others

  return (
    <motion.div
      initial={isNew ? { scaleY: 0 } : false}
      animate={{ scaleY: 1 }}
      transition={{ duration: 0.15 }}
      style={{
        position: isDiagonal ? 'absolute' : 'relative',
        width: isDiagonal ? '3px' : '3px',
        height: isDiagonal ? '40px' : '32px',
        background: '#1a365d',
        borderRadius: '1.5px',
        transform: isDiagonal ? 'rotate(-30deg)' : 'none',
        transformOrigin: 'bottom',
        left: isDiagonal ? '50%' : 'auto',
        top: isDiagonal ? '50%' : 'auto',
        marginLeft: isDiagonal ? '-1.5px' : '0',
        marginTop: isDiagonal ? '-20px' : '0',
      }}
    />
  )
}

// Group of 5 tally marks
function TallyGroup({ count }) {
  return (
    <div
      className="relative flex items-end gap-1 mx-2 my-1"
      style={{ height: '40px', width: '35px' }}
    >
      {[...Array(Math.min(count, 4))].map((_, i) => (
        <TallyMark key={i} index={i} total={count} isNew={false} />
      ))}
      {count >= 5 && <TallyMark index={4} total={count} isNew={false} />}
    </div>
  )
}

// Score display
function ScoreSection({ score, phase, teamName, maxScore }) {
  const displayScore = phase === 'buenas' ? score - 15 : score
  const fullGroups = Math.floor(displayScore / 5)
  const remainder = displayScore % 5

  return (
    <div className="flex-1 flex flex-col">
      {/* Team name */}
      <div className="text-center py-2 border-b-2 border-gray-300">
        <h2 className="text-xl font-bold text-gray-800 uppercase tracking-wider">
          {teamName}
        </h2>
      </div>

      {/* Phase indicator */}
      <div className={`text-center py-1 text-sm font-semibold ${
        phase === 'buenas' ? 'bg-green-100 text-green-800' : 'bg-red-50 text-red-700'
      }`}>
        {displayScore} {phase === 'buenas' ? 'BUENAS' : 'MALAS'}
      </div>

      {/* Tally marks area */}
      <div className="flex-1 flex flex-wrap content-start justify-center p-3 min-h-[180px]">
        {[...Array(fullGroups)].map((_, i) => (
          <TallyGroup key={i} count={5} />
        ))}
        {remainder > 0 && <TallyGroup count={remainder} />}
        {displayScore === 0 && (
          <span className="text-gray-300 text-2xl mt-12">—</span>
        )}
      </div>
    </div>
  )
}

// Config screen
function ConfigScreen({ onStart }) {
  const [team1, setTeam1] = useState('Nosotros')
  const [team2, setTeam2] = useState('Ellos')
  const [maxPoints, setMaxPoints] = useState(30)
  const [faltaEnvido, setFaltaEnvido] = useState(2)

  return (
    <div className="min-h-screen bg-amber-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-xs">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-1">YoAnoto</h1>
        <p className="text-center text-gray-500 mb-6">Anotador de Truco</p>

        <div className="bg-white rounded-xl shadow-lg p-5 space-y-4">
          {/* Teams */}
          <div className="flex gap-2 items-center">
            <input
              type="text"
              value={team1}
              onChange={(e) => setTeam1(e.target.value)}
              className="flex-1 p-2 border-2 border-gray-200 rounded-lg text-center font-medium"
              maxLength={10}
            />
            <span className="text-gray-400 font-bold">vs</span>
            <input
              type="text"
              value={team2}
              onChange={(e) => setTeam2(e.target.value)}
              className="flex-1 p-2 border-2 border-gray-200 rounded-lg text-center font-medium"
              maxLength={10}
            />
          </div>

          {/* Points */}
          <div className="flex gap-2">
            {[15, 30].map((pts) => (
              <button
                key={pts}
                onClick={() => setMaxPoints(pts)}
                className={`flex-1 py-3 rounded-lg font-bold text-lg transition ${
                  maxPoints === pts
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {pts}
              </button>
            ))}
          </div>

          {/* Falta */}
          <div className="flex gap-2">
            {[1, 2].map((n) => (
              <button
                key={n}
                onClick={() => setFaltaEnvido(n)}
                className={`flex-1 py-2 rounded-lg font-medium transition ${
                  faltaEnvido === n
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {n} Falta{n > 1 ? 's' : ''}
              </button>
            ))}
          </div>

          <button
            onClick={() => onStart({ team1, team2, maxPoints, faltaEnvido })}
            className="w-full py-4 bg-green-600 text-white rounded-xl font-bold text-xl"
          >
            Empezar
          </button>
        </div>
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
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        className="bg-white rounded-2xl p-6 text-center w-full max-w-xs shadow-2xl"
      >
        <div className="text-5xl mb-3">🏆</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-1">¡Ganó!</h2>
        <h3 className="text-3xl font-bold text-green-600 mb-6">{winner}</h3>
        <button
          onClick={onRematch}
          className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold mb-2"
        >
          Revancha
        </button>
        <button
          onClick={onNewGame}
          className="w-full py-2 text-gray-500 font-medium"
        >
          Nueva partida
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

  const phase1 = score1 >= 15 ? 'buenas' : 'malas'
  const phase2 = score2 >= 15 ? 'buenas' : 'malas'

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

  const getFaltaPoints = () => {
    const leader = Math.max(score1, score2)
    if (config.faltaEnvido === 1) {
      return config.maxPoints - leader
    } else {
      return leader >= 15 ? config.maxPoints - leader : 15 - leader
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
      <div className="flex items-center justify-between px-4 py-2 bg-white border-b">
        <button onClick={onNewGame} className="text-gray-400 text-xl">⚙️</button>
        <span className="font-bold text-gray-600">a {config.maxPoints}</span>
        <button
          onClick={undo}
          disabled={history.length === 0}
          className="text-gray-400 text-xl disabled:opacity-30"
        >
          ↩️
        </button>
      </div>

      {/* Score board - paper style */}
      <div className="flex-1 flex bg-white mx-3 my-2 rounded-lg shadow-md overflow-hidden border border-gray-200">
        <ScoreSection
          score={score1}
          phase={phase1}
          teamName={config.team1}
          maxScore={config.maxPoints}
        />

        <div className="w-px bg-gray-300" />

        <ScoreSection
          score={score2}
          phase={phase2}
          teamName={config.team2}
          maxScore={config.maxPoints}
        />
      </div>

      {/* Quick buttons */}
      <div className="bg-white mx-3 mb-2 rounded-lg shadow-md p-3 border border-gray-200">
        <div className="grid grid-cols-5 gap-2">
          <button
            onClick={() => addPoints(1, 1)}
            className="py-3 bg-blue-100 text-blue-800 rounded-lg font-bold"
          >
            +1
          </button>
          <button
            onClick={() => addPoints(1, 2)}
            className="py-3 bg-blue-500 text-white rounded-lg font-bold"
          >
            +2
          </button>
          <button
            onClick={() => {
              const pts = getFaltaPoints()
              if (pts > 0) addPoints(1, pts)
            }}
            className="py-3 bg-red-500 text-white rounded-lg font-bold text-xs"
          >
            FALTA<br/>{getFaltaPoints()}
          </button>
          <button
            onClick={() => addPoints(2, 2)}
            className="py-3 bg-orange-500 text-white rounded-lg font-bold"
          >
            +2
          </button>
          <button
            onClick={() => addPoints(2, 1)}
            className="py-3 bg-orange-100 text-orange-800 rounded-lg font-bold"
          >
            +1
          </button>
        </div>

        {/* Labels */}
        <div className="flex justify-between mt-1 px-1">
          <span className="text-xs text-blue-600 font-medium">{config.team1}</span>
          <span className="text-xs text-orange-600 font-medium">{config.team2}</span>
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
