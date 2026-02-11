import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Head from 'next/head'

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

// Tally square component - 5 strokes form a square with diagonal
function TallySquare({ count, color }) {
  const size = 50
  const sw = 4
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="inline-block mx-0.5">
      {count >= 1 && <line x1={sw} y1={4} x2={sw} y2={size-4} stroke={color} strokeWidth={sw} strokeLinecap="round" />}
      {count >= 2 && <line x1={4} y1={sw} x2={size-4} y2={sw} stroke={color} strokeWidth={sw} strokeLinecap="round" />}
      {count >= 3 && <line x1={size-sw} y1={4} x2={size-sw} y2={size-4} stroke={color} strokeWidth={sw} strokeLinecap="round" />}
      {count >= 4 && <line x1={4} y1={size-sw} x2={size-4} y2={size-sw} stroke={color} strokeWidth={sw} strokeLinecap="round" />}
      {count >= 5 && <line x1={4} y1={size-4} x2={size-4} y2={4} stroke={color} strokeWidth={sw} strokeLinecap="round" />}
    </svg>
  )
}

// Score tally display
function TallyDisplay({ score, color }) {
  const fullGroups = Math.floor(score / 5)
  const remainder = score % 5

  return (
    <div className="flex flex-wrap justify-center items-center gap-1 min-h-[60px]">
      {[...Array(fullGroups)].map((_, i) => (
        <TallySquare key={i} count={5} color={color} />
      ))}
      {remainder > 0 && <TallySquare count={remainder} color={color} />}
      {score === 0 && <span className="text-gray-300 text-4xl">—</span>}
    </div>
  )
}

// Config screen - Redesigned
function ConfigScreen({ onStart }) {
  const [team1, setTeam1] = useState('Nosotros')
  const [team2, setTeam2] = useState('Ellos')
  const [maxPoints, setMaxPoints] = useState(30)
  const [faltaEnvido, setFaltaEnvido] = useState(2)

  const pointOptions = [6, 9, 12, 18, 24, 30]

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-800 to-green-900 flex flex-col p-4 overflow-auto">
      <Head>
        <title>YoAnoto - Anotador de Truco</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="w-full max-w-sm mx-auto flex-1 flex flex-col justify-center py-4">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="text-7xl mb-2">🎴</div>
          <h1 className="text-4xl font-black text-white tracking-tight">
            YoAnoto
          </h1>
          <p className="text-green-300 text-sm mt-1">Anotador de Truco</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-4 space-y-4">
          {/* Teams */}
          <div>
            <label className="text-xs text-gray-500 font-bold uppercase mb-2 block">
              Equipos
            </label>
            <div className="flex gap-2 items-center">
              <input
                type="text"
                value={team1}
                onChange={(e) => setTeam1(e.target.value)}
                className="flex-1 min-w-0 p-3 bg-blue-50 border-2 border-blue-200 rounded-xl text-center font-bold text-blue-800 focus:border-blue-500 focus:outline-none"
                maxLength={10}
              />
              <span className="text-xl flex-shrink-0">⚡</span>
              <input
                type="text"
                value={team2}
                onChange={(e) => setTeam2(e.target.value)}
                className="flex-1 min-w-0 p-3 bg-orange-50 border-2 border-orange-200 rounded-xl text-center font-bold text-orange-800 focus:border-orange-500 focus:outline-none"
                maxLength={10}
              />
            </div>
          </div>

          {/* Points */}
          <div>
            <label className="text-xs text-gray-500 font-bold uppercase mb-2 block">
              Puntos
            </label>
            <div className="grid grid-cols-6 gap-1.5">
              {pointOptions.map((pts) => (
                <button
                  key={pts}
                  onClick={() => setMaxPoints(pts)}
                  className={`py-3 rounded-lg font-bold text-lg transition-all ${
                    maxPoints === pts
                      ? 'bg-green-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-600 active:bg-gray-200'
                  }`}
                >
                  {pts}
                </button>
              ))}
            </div>
          </div>

          {/* Falta Envido */}
          <div>
            <label className="text-xs text-gray-500 font-bold uppercase mb-2 block">
              Falta Envido
            </label>
            <div className="flex gap-2">
              {[1, 2].map((n) => (
                <button
                  key={n}
                  onClick={() => setFaltaEnvido(n)}
                  className={`flex-1 py-3 rounded-lg font-bold text-lg transition-all ${
                    faltaEnvido === n
                      ? 'bg-red-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-600 active:bg-gray-200'
                  }`}
                >
                  {n} Falta{n > 1 ? 's' : ''}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => onStart({ team1, team2, maxPoints, faltaEnvido })}
            className="w-full py-4 bg-green-600 active:bg-green-700 text-white rounded-xl font-black text-xl shadow-lg transition-all active:scale-98"
          >
            ¡JUGAR! 🎴
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
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.5, rotate: -10 }}
        animate={{ scale: 1, rotate: 0 }}
        className="bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-3xl p-8 text-center w-full max-w-sm shadow-2xl"
      >
        <div className="text-8xl mb-4">🏆</div>
        <h2 className="text-2xl font-bold text-yellow-900 mb-2">¡GANADOR!</h2>
        <h3 className="text-4xl font-black text-white mb-8 drop-shadow-lg">{winner}</h3>
        <button
          onClick={onRematch}
          className="w-full py-4 bg-white text-green-700 rounded-2xl font-bold text-xl mb-3 shadow-lg hover:bg-gray-100 transition-all"
        >
          🔄 Revancha
        </button>
        <button
          onClick={onNewGame}
          className="w-full py-3 bg-yellow-600 text-white rounded-xl font-semibold hover:bg-yellow-700 transition-all"
        >
          Nueva Partida
        </button>
      </motion.div>
    </motion.div>
  )
}

// Score Panel - tappable area for each team
function ScorePanel({ team, score, phase, color, bgColor, onTap, maxPoints }) {
  const lastTapRef = useRef(0)
  const halfPoints = maxPoints / 2
  const displayScore = phase === 'buenas' ? score - halfPoints : score

  const handleTap = (e) => {
    e.preventDefault()
    const now = Date.now()
    if (now - lastTapRef.current < 250) return
    lastTapRef.current = now
    playSound('tap')
    if (navigator.vibrate) navigator.vibrate(30)
    onTap()
  }

  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      onClick={handleTap}
      onTouchStart={handleTap}
      className={`flex-1 flex flex-col items-center justify-center p-4 cursor-pointer select-none transition-colors ${bgColor}`}
      style={{ touchAction: 'manipulation' }}
    >
      {/* Team name */}
      <div className={`font-bold text-lg ${color} mb-1`}>{team}</div>

      {/* Phase indicator */}
      <div className={`text-xs font-bold px-3 py-1 rounded-full mb-3 ${
        phase === 'buenas'
          ? 'bg-green-500 text-white'
          : 'bg-red-500 text-white'
      }`}>
        {phase === 'buenas' ? '✓ BUENAS' : '✗ MALAS'}
      </div>

      {/* BIG Score */}
      <div className={`text-8xl font-black ${color} leading-none mb-2`}>
        {score}
      </div>

      {/* Tally marks */}
      <TallyDisplay
        score={displayScore}
        color={phase === 'buenas' ? '#059669' : '#1e3a8a'}
      />

      {/* Tap hint */}
      <div className="text-gray-400 text-xs mt-3">👆 Tocá para +1</div>
    </motion.div>
  )
}

// Game screen
function GameScreen({ config, onNewGame }) {
  const [score1, setScore1] = useState(0)
  const [score2, setScore2] = useState(0)
  const [history, setHistory] = useState([])
  const [winner, setWinner] = useState(null)

  const halfPoints = config.maxPoints / 2
  const phase1 = score1 >= halfPoints ? 'buenas' : 'malas'
  const phase2 = score2 >= halfPoints ? 'buenas' : 'malas'

  useEffect(() => {
    if (score1 >= config.maxPoints && !winner) {
      setWinner(config.team1)
    } else if (score2 >= config.maxPoints && !winner) {
      setWinner(config.team2)
    }
  }, [score1, score2, config.maxPoints, config.team1, config.team2, winner])

  const addPoints = useCallback((team, points) => {
    if (winner) return
    if (team === 1) {
      setScore1((prev) => Math.min(prev + points, config.maxPoints))
    } else {
      setScore2((prev) => Math.min(prev + points, config.maxPoints))
    }
    setHistory((prev) => [...prev, { team, points }])
  }, [winner, config.maxPoints])

  const getFaltaPoints = (forTeam) => {
    if (config.faltaEnvido === 1) {
      return config.maxPoints - Math.max(score1, score2)
    } else {
      const leader = Math.max(score1, score2)
      return leader >= halfPoints ? config.maxPoints - leader : halfPoints - leader
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
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Head>
        <title>{score1} - {score2} | YoAnoto</title>
      </Head>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-green-800 text-white shadow-lg">
        <button onClick={onNewGame} className="text-2xl p-2 hover:bg-green-700 rounded-lg transition-colors">
          ⚙️
        </button>
        <div className="text-center">
          <span className="font-bold text-lg">🎴 a {config.maxPoints}</span>
          <span className="text-green-200 text-sm ml-2">({config.faltaEnvido}F)</span>
        </div>
        <button
          onClick={undo}
          disabled={history.length === 0}
          className="text-2xl p-2 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-30"
        >
          ↩️
        </button>
      </div>

      {/* Main score area - BIG tappable panels */}
      <div className="flex-1 flex">
        <ScorePanel
          team={config.team1}
          score={score1}
          phase={phase1}
          color="text-blue-700"
          bgColor={phase1 === 'buenas' ? 'bg-green-50' : 'bg-red-50'}
          onTap={() => addPoints(1, 1)}
          maxPoints={config.maxPoints}
        />

        <div className="w-1 bg-gray-400" />

        <ScorePanel
          team={config.team2}
          score={score2}
          phase={phase2}
          color="text-orange-700"
          bgColor={phase2 === 'buenas' ? 'bg-green-50' : 'bg-red-50'}
          onTap={() => addPoints(2, 1)}
          maxPoints={config.maxPoints}
        />
      </div>

      {/* Quick buttons */}
      <div className="bg-white border-t-2 border-gray-200 p-3">
        <div className="flex gap-2">
          {/* Team 1 buttons */}
          <div className="flex-1 flex gap-2">
            <button
              onClick={() => addPoints(1, 3)}
              className="flex-1 py-4 bg-blue-600 text-white rounded-xl font-black text-xl shadow-lg active:scale-95 transition-all"
            >
              +3
            </button>
            <button
              onClick={() => addPoints(1, 6)}
              className="flex-1 py-4 bg-blue-800 text-white rounded-xl font-black text-xl shadow-lg active:scale-95 transition-all"
            >
              +6
            </button>
            <button
              onClick={() => {
                const pts = getFaltaPoints(1)
                if (pts > 0) addPoints(1, pts)
              }}
              className="py-4 px-3 bg-red-600 text-white rounded-xl font-bold text-sm shadow-lg active:scale-95 transition-all"
            >
              F +{getFaltaPoints(1)}
            </button>
          </div>

          {/* Divider */}
          <div className="w-1 bg-gray-300 rounded" />

          {/* Team 2 buttons */}
          <div className="flex-1 flex gap-2">
            <button
              onClick={() => addPoints(2, 3)}
              className="flex-1 py-4 bg-orange-600 text-white rounded-xl font-black text-xl shadow-lg active:scale-95 transition-all"
            >
              +3
            </button>
            <button
              onClick={() => addPoints(2, 6)}
              className="flex-1 py-4 bg-orange-800 text-white rounded-xl font-black text-xl shadow-lg active:scale-95 transition-all"
            >
              +6
            </button>
            <button
              onClick={() => {
                const pts = getFaltaPoints(2)
                if (pts > 0) addPoints(2, pts)
              }}
              className="py-4 px-3 bg-red-600 text-white rounded-xl font-bold text-sm shadow-lg active:scale-95 transition-all"
            >
              F +{getFaltaPoints(2)}
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
    <>
      <Head>
        <title>YoAnoto - Anotador de Truco</title>
        <meta name="description" content="Anotador de Truco Argentino" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="theme-color" content="#166534" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <link rel="manifest" href="/manifest.json" />
      </Head>
      <AnimatePresence mode="wait">
        {config ? (
          <GameScreen key="game" config={config} onNewGame={() => setConfig(null)} />
        ) : (
          <ConfigScreen key="config" onStart={setConfig} />
        )}
      </AnimatePresence>
    </>
  )
}
