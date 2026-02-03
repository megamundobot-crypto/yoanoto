import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import dynamic from 'next/dynamic'

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
      // Short click sound like pen on paper
      oscillator.frequency.setValueAtTime(800, audioCtx.currentTime)
      oscillator.frequency.exponentialRampToValueAtTime(400, audioCtx.currentTime + 0.05)
      gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.05)
      oscillator.start(audioCtx.currentTime)
      oscillator.stop(audioCtx.currentTime + 0.05)
    } else if (type === 'win') {
      // Fanfare for winning
      const notes = [523, 659, 784, 1047] // C5, E5, G5, C6
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
      // Reverse swoosh
      oscillator.frequency.setValueAtTime(300, audioCtx.currentTime)
      oscillator.frequency.exponentialRampToValueAtTime(600, audioCtx.currentTime + 0.1)
      gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1)
      oscillator.start(audioCtx.currentTime)
      oscillator.stop(audioCtx.currentTime + 0.1)
    }
  } catch (e) {
    // Audio not supported, fail silently
  }
}

// No colors needed for birome style - using single blue ink color

// Points options
const POINTS_OPTIONS = [6, 9, 12, 18, 24, 30]

// Quick score buttons
const QUICK_SCORES = [
  { label: 'Envido', points: 2, icon: '🎴' },
  { label: 'Real Envido', points: 3, icon: '👑' },
  { label: 'Falta', points: 0, icon: '💀' }, // Special: gives remaining points
  { label: 'Truco', points: 2, icon: '🃏' },
  { label: 'Retruco', points: 3, icon: '🔥' },
  { label: 'Vale 4', points: 4, icon: '💎' },
  { label: 'Flor', points: 3, icon: '🎴' },
]

// Palito (birome stroke) component
function Palito({ isNew, isDiagonal = false }) {
  return (
    <motion.div
      initial={isNew ? { scaleY: 0 } : false}
      animate={{ scaleY: 1 }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
      className={`palito ${isDiagonal ? 'palito-diagonal' : ''} ${isNew ? 'palito-new' : ''}`}
      style={{ transformOrigin: 'bottom' }}
    />
  )
}

// Group of 5 palitos (4 vertical + 1 diagonal crossing)
function PalitoGroup({ count, isNewGroup }) {
  return (
    <div className="palito-group">
      {count >= 1 && <Palito isNew={isNewGroup && count === 1} />}
      {count >= 2 && <Palito isNew={isNewGroup && count === 2} />}
      {count >= 3 && <Palito isNew={isNewGroup && count === 3} />}
      {count >= 4 && <Palito isNew={isNewGroup && count === 4} />}
      {count >= 5 && (
        <div className="palito-diagonal">
          <Palito isNew={isNewGroup && count === 5} isDiagonal />
        </div>
      )}
    </div>
  )
}

// Score display with chapitas
function ScoreDisplay({ score, maxScore, teamName, isLeft }) {
  const fullGroups = Math.floor(score / 5)
  const remainder = score % 5
  const [prevScore, setPrevScore] = useState(score)
  const [newGroupIndex, setNewGroupIndex] = useState(-1)

  useEffect(() => {
    if (score > prevScore) {
      setNewGroupIndex(fullGroups + (remainder > 0 ? 1 : 0) - 1)
      const timer = setTimeout(() => setNewGroupIndex(-1), 500)
      return () => clearTimeout(timer)
    }
    setPrevScore(score)
  }, [score, prevScore, fullGroups, remainder])

  const groups = []
  for (let i = 0; i < fullGroups; i++) {
    groups.push(
      <PalitoGroup
        key={i}
        count={5}
        isNewGroup={i === newGroupIndex}
      />
    )
  }
  if (remainder > 0) {
    groups.push(
      <PalitoGroup
        key={fullGroups}
        count={remainder}
        isNewGroup={fullGroups === newGroupIndex}
      />
    )
  }

  return (
    <div className={`flex-1 flex flex-col ${isLeft ? 'items-start' : 'items-end'} p-2`}>
      <div className={`text-2xl font-bold text-amber-900 dark:text-amber-200 mb-1 ${isLeft ? 'text-left' : 'text-right'} w-full truncate px-2`}>
        {teamName}
      </div>
      <div className="text-4xl font-bold text-amber-800 dark:text-amber-300 mb-3">
        {score} <span className="text-lg text-amber-600 dark:text-amber-400">/ {maxScore}</span>
      </div>
      <div className={`flex flex-wrap gap-3 ${isLeft ? 'justify-start' : 'justify-end'} flex-1 overflow-y-auto max-h-[40vh] w-full px-1`}>
        {groups.length > 0 ? groups : (
          <div className="text-amber-600/50 dark:text-amber-400/30 text-lg italic">
            Sin tantos
          </div>
        )}
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen mantel-pattern px-4 py-6 flex flex-col items-center justify-center"
    >
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-amber-900 dark:text-amber-200 mb-1">
            🍺 YoAnoto
          </h1>
          <p className="text-lg text-amber-700 dark:text-amber-400">
            Anotador de Truco Argentino
          </p>
        </div>

        <div className="paper-effect rounded-2xl p-5 w-full space-y-5">
        {/* Team names */}
        <div className="space-y-2">
          <label className="text-lg text-amber-900 dark:text-amber-200 block">
            Equipos
          </label>
          <div className="flex gap-2 items-center">
            <input
              type="text"
              value={team1}
              onChange={(e) => setTeam1(e.target.value)}
              placeholder="Nosotros"
              maxLength={12}
              className="flex-1 p-2 rounded-lg bg-white/80 dark:bg-gray-800 border-2 border-amber-600 text-lg text-center focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <span className="text-xl font-bold text-amber-700">vs</span>
            <input
              type="text"
              value={team2}
              onChange={(e) => setTeam2(e.target.value)}
              placeholder="Ellos"
              maxLength={12}
              className="flex-1 p-2 rounded-lg bg-white/80 dark:bg-gray-800 border-2 border-amber-600 text-lg text-center focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        {/* Points */}
        <div className="space-y-2">
          <label className="text-lg text-amber-900 dark:text-amber-200 block">
            Partida a
          </label>
          <div className="grid grid-cols-3 gap-2">
            {POINTS_OPTIONS.map((pts) => (
              <button
                key={pts}
                onClick={() => setMaxPoints(pts)}
                className={`p-2 rounded-lg text-base font-bold transition-all ${
                  maxPoints === pts
                    ? 'btn-wood'
                    : 'bg-white/60 dark:bg-gray-700 text-amber-800 dark:text-amber-200 border-2 border-amber-400'
                }`}
              >
                {pts}
              </button>
            ))}
          </div>
        </div>

        {/* Flor toggle */}
        <div className="flex items-center justify-between p-3 bg-white/60 dark:bg-gray-700 rounded-lg">
          <span className="text-lg text-amber-900 dark:text-amber-200 font-bold">
            Con Flor
          </span>
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
          <label className="text-lg text-amber-900 dark:text-amber-200 block">
            Falta Envido
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => setFaltaEnvido(1)}
              className={`flex-1 p-2 rounded-lg text-base font-bold transition-all ${
                faltaEnvido === 1
                  ? 'btn-wood'
                  : 'bg-white/60 dark:bg-gray-700 text-amber-800 dark:text-amber-200 border-2 border-amber-400'
              }`}
            >
              1 Falta
            </button>
            <button
              onClick={() => setFaltaEnvido(2)}
              className={`flex-1 p-2 rounded-lg text-base font-bold transition-all ${
                faltaEnvido === 2
                  ? 'btn-wood'
                  : 'bg-white/60 dark:bg-gray-700 text-amber-800 dark:text-amber-200 border-2 border-amber-400'
              }`}
            >
              2 Faltas
            </button>
          </div>
        </div>

        {/* Start button */}
        <button
          onClick={() => onStart({ team1, team2, maxPoints, withFlor, faltaEnvido })}
          className="w-full p-4 btn-wood rounded-xl text-2xl font-bold mt-4"
        >
          🃏 ¡Empezar!
        </button>
      </div>

      <p className="text-center mt-4 text-amber-700 dark:text-amber-400 text-sm">
        Hecho con 🧉 en Argentina
      </p>
      </div>
    </motion.div>
  )
}

// Winner celebration
function WinnerCelebration({ winner, onNewGame, onRematch }) {
  useEffect(() => {
    if (confetti) {
      const duration = 3000
      const end = Date.now() + duration

      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#FFD700', '#CC0000', '#00A550']
        })
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#FFD700', '#CC0000', '#00A550']
        })

        if (Date.now() < end) {
          requestAnimationFrame(frame)
        }
      }
      frame()
    }
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0, rotate: -10 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 200 }}
        className="paper-effect rounded-3xl p-8 text-center max-w-sm w-full"
      >
        <div className="text-6xl mb-4">🏆</div>
        <h2 className="text-3xl font-bold text-amber-900 dark:text-amber-200 mb-2">
          ¡Ganó!
        </h2>
        <h3 className="text-4xl font-bold text-amber-800 dark:text-amber-300 mb-6">
          {winner}
        </h3>
        <div className="space-y-3">
          <button
            onClick={onRematch}
            className="w-full p-4 btn-wood rounded-xl text-xl font-bold"
          >
            🔄 Revancha
          </button>
          <button
            onClick={onNewGame}
            className="w-full p-3 bg-white/60 dark:bg-gray-700 rounded-xl text-lg text-amber-800 dark:text-amber-200 border-2 border-amber-400"
          >
            ⚙️ Nueva Configuración
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// Rules modal
function RulesModal({ onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="paper-effect rounded-2xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-amber-900 dark:text-amber-200">
            📜 Reglamento del Truco
          </h2>
          <button
            onClick={onClose}
            className="text-3xl text-amber-700 dark:text-amber-400"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4 text-amber-800 dark:text-amber-300 text-lg">
          <section>
            <h3 className="font-bold text-xl mb-2">🎴 El Envido</h3>
            <p>• Envido: 2 puntos</p>
            <p>• Real Envido: 3 puntos</p>
            <p>• Falta Envido: El resto o lo que falta</p>
            <p>• Se puede cantar Envido, Envido, Real Envido, Falta Envido</p>
          </section>

          <section>
            <h3 className="font-bold text-xl mb-2">🃏 El Truco</h3>
            <p>• Truco: 2 puntos</p>
            <p>• Retruco: 3 puntos</p>
            <p>• Vale Cuatro: 4 puntos</p>
          </section>

          <section>
            <h3 className="font-bold text-xl mb-2">🎴 La Flor</h3>
            <p>• Flor: 3 puntos (sin oposición)</p>
            <p>• Contra Flor: 4 puntos</p>
            <p>• Contra Flor al Resto: El resto</p>
            <p>• Con Flor y Flor: 4 puntos cada uno</p>
          </section>

          <section>
            <h3 className="font-bold text-xl mb-2">📊 Valores del Envido</h3>
            <p>• Se suman las 2 cartas del mismo palo + 20</p>
            <p>• Figuras (10, 11, 12) valen 0</p>
            <p>• Sin cartas del mismo palo: la carta más alta</p>
          </section>

          <section>
            <h3 className="font-bold text-xl mb-2">🏆 Jerarquía de Cartas</h3>
            <p>1. Ancho de Espadas (1E)</p>
            <p>2. Ancho de Bastos (1B)</p>
            <p>3. Siete de Espadas (7E)</p>
            <p>4. Siete de Oros (7O)</p>
            <p>5. Los 3</p>
            <p>6. Los 2</p>
            <p>7. Anchos falsos (1C, 1O)</p>
            <p>8. Los 12</p>
            <p>9. Los 11</p>
            <p>10. Los 10</p>
            <p>11. Los 7 (falsos)</p>
            <p>12. Los 6</p>
            <p>13. Los 5</p>
            <p>14. Los 4</p>
          </section>

          <div className="pt-4 border-t border-amber-400">
            <a
              href="https://drive.google.com/file/d/168wgaIPHUZet9ljRpRlQXOFo-qWju52W/view"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-center p-3 btn-wood rounded-xl"
            >
              📄 Ver Reglamento Oficial Completo
            </a>
          </div>
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
  const [showRules, setShowRules] = useState(false)
  const [darkMode, setDarkMode] = useState(false)

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

  // Vibrate on score
  const vibrate = () => {
    if (navigator.vibrate) {
      navigator.vibrate(50)
    }
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
    const opponentScore = team === 1 ? score2 : score1
    if (config.faltaEnvido === 1) {
      // Lo que le falta al que acepta
      return config.maxPoints - opponentScore
    } else {
      // El resto del partido
      return config.maxPoints - Math.max(score1, score2)
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

  // Share result
  const shareResult = () => {
    const text = `🃏 Truco!\n${config.team1}: ${score1}\n${config.team2}: ${score2}\n${winner ? `🏆 Ganó ${winner}!` : 'Partida en curso...'}\n\n📱 yoanoto.vercel.app`

    if (navigator.share) {
      navigator.share({ text })
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
    }
  }

  // Rematch (same config, reset scores)
  const rematch = () => {
    setScore1(0)
    setScore2(0)
    setHistory([])
    setWinner(null)
  }

  // Toggle dark mode
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
  }, [darkMode])

  return (
    <div className={`min-h-screen mantel-pattern flex flex-col safe-area-bottom ${darkMode ? 'dark' : ''}`}>
      {/* Header */}
      <header className="flex items-center justify-between p-3 bg-amber-900/90 dark:bg-gray-900/90 text-white">
        <button
          onClick={() => setShowRules(true)}
          className="p-2 text-xl"
        >
          📜
        </button>
        <h1 className="text-2xl font-bold">🍺 YoAnoto</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 text-xl"
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
          <button
            onClick={shareResult}
            className="p-2 text-xl"
          >
            📤
          </button>
        </div>
      </header>

      {/* Score board */}
      <div className="flex-1 flex">
        <ScoreDisplay
          score={score1}
          maxScore={config.maxPoints}
          teamName={config.team1}
          isLeft={true}
        />

        <div className="score-divider" />

        <ScoreDisplay
          score={score2}
          maxScore={config.maxPoints}
          teamName={config.team2}
          isLeft={false}
        />
      </div>

      {/* Quick add buttons */}
      <div className="p-3 bg-amber-100/90 dark:bg-gray-800/90">
        <div className="flex justify-between items-center mb-2">
          <span className="text-lg text-amber-800 dark:text-amber-300 font-bold">
            Anotar para {config.team1}
          </span>
          <span className="text-lg text-amber-800 dark:text-amber-300 font-bold">
            {config.team2}
          </span>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-3">
          {QUICK_SCORES.filter(s => s.label !== 'Flor' || config.withFlor).map((score) => (
            <div key={score.label} className="flex flex-col gap-1">
              <button
                onClick={() => addPoints(1, score.label === 'Falta' ? getFaltaPoints(1) : score.points)}
                className="quick-btn p-2 bg-amber-600 dark:bg-amber-700 text-white rounded-lg text-xs font-bold"
              >
                <span className="block text-lg">{score.icon}</span>
                <span className="block text-[10px]">+{score.label === 'Falta' ? getFaltaPoints(1) : score.points}</span>
              </button>
              <button
                onClick={() => addPoints(2, score.label === 'Falta' ? getFaltaPoints(2) : score.points)}
                className="quick-btn p-2 bg-red-600 dark:bg-red-700 text-white rounded-lg text-xs font-bold"
              >
                <span className="block text-lg">{score.icon}</span>
                <span className="block text-[10px]">+{score.label === 'Falta' ? getFaltaPoints(2) : score.points}</span>
              </button>
            </div>
          ))}
        </div>

        {/* Manual +1 buttons */}
        <div className="flex gap-3 mb-2">
          <button
            onClick={() => addPoints(1, 1)}
            className="flex-1 p-4 bg-amber-700 dark:bg-amber-800 text-white rounded-xl text-xl font-bold quick-btn"
          >
            +1 {config.team1}
          </button>
          <button
            onClick={() => addPoints(2, 1)}
            className="flex-1 p-4 bg-red-700 dark:bg-red-800 text-white rounded-xl text-xl font-bold quick-btn"
          >
            +1 {config.team2}
          </button>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <button
            onClick={undo}
            disabled={history.length === 0}
            className="flex-1 p-3 bg-gray-500 text-white rounded-xl font-bold disabled:opacity-50"
          >
            ↩️ Deshacer
          </button>
          <button
            onClick={onNewGame}
            className="flex-1 p-3 bg-gray-700 text-white rounded-xl font-bold"
          >
            ⚙️ Nueva
          </button>
        </div>
      </div>

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

      {/* Rules modal */}
      <AnimatePresence>
        {showRules && <RulesModal onClose={() => setShowRules(false)} />}
      </AnimatePresence>
    </div>
  )
}

// Main component
export default function Home() {
  const [gameConfig, setGameConfig] = useState(null)

  // Load saved config from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('trucoConfig')
    if (saved) {
      try {
        // Don't auto-start, just pre-fill
      } catch (e) {}
    }
  }, [])

  const handleStart = (config) => {
    localStorage.setItem('trucoConfig', JSON.stringify(config))
    setGameConfig(config)
  }

  const handleNewGame = () => {
    setGameConfig(null)
  }

  return (
    <main>
      <AnimatePresence mode="wait">
        {gameConfig ? (
          <GameScreen
            key="game"
            config={gameConfig}
            onNewGame={handleNewGame}
          />
        ) : (
          <ConfigScreen
            key="config"
            onStart={handleStart}
          />
        )}
      </AnimatePresence>
    </main>
  )
}
