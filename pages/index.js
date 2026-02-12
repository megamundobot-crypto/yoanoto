import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Head from 'next/head'
import Image from 'next/image'

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
      oscillator.frequency.setValueAtTime(800, audioCtx.currentTime)
      oscillator.frequency.exponentialRampToValueAtTime(300, audioCtx.currentTime + 0.05)
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.05)
      oscillator.start()
      oscillator.stop(audioCtx.currentTime + 0.05)
    } else if (type === 'win') {
      [523, 659, 784, 1047].forEach((freq, i) => {
        setTimeout(() => {
          try {
            const o = audioCtx.createOscillator()
            const g = audioCtx.createGain()
            o.connect(g)
            g.connect(audioCtx.destination)
            o.frequency.value = freq
            g.gain.setValueAtTime(0.12, audioCtx.currentTime)
            g.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15)
            o.start()
            o.stop(audioCtx.currentTime + 0.15)
          } catch(e) {}
        }, i * 120)
      })
    }
  } catch (e) {}
}

// Tally square SVG - 5 strokes form a square with diagonal - BIGGER
function TallySquare({ count, color }) {
  return (
    <svg width="55" height="55" viewBox="0 0 55 55" className="inline-block">
      {count >= 1 && <line x1="5" y1="5" x2="5" y2="50" stroke={color} strokeWidth="5" strokeLinecap="round" />}
      {count >= 2 && <line x1="5" y1="5" x2="50" y2="5" stroke={color} strokeWidth="5" strokeLinecap="round" />}
      {count >= 3 && <line x1="50" y1="5" x2="50" y2="50" stroke={color} strokeWidth="5" strokeLinecap="round" />}
      {count >= 4 && <line x1="5" y1="50" x2="50" y2="50" stroke={color} strokeWidth="5" strokeLinecap="round" />}
      {count >= 5 && <line x1="5" y1="50" x2="50" y2="5" stroke={color} strokeWidth="5" strokeLinecap="round" />}
    </svg>
  )
}

// Score tally display - VERTICAL layout (one below another)
function TallyDisplay({ score, color }) {
  const fullGroups = Math.floor(score / 5)
  const remainder = score % 5

  if (score === 0) return <div className="text-gray-300 text-2xl">—</div>

  return (
    <div className="flex flex-col items-center gap-0">
      {[...Array(fullGroups)].map((_, i) => (
        <TallySquare key={i} count={5} color={color} />
      ))}
      {remainder > 0 && <TallySquare count={remainder} color={color} />}
    </div>
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
    <div
      className="min-h-screen bg-gradient-to-b from-emerald-800 via-emerald-900 to-black flex flex-col"
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <Head>
        <title>YoAnoto - Anotador de Truco</title>
      </Head>

      <div className="flex-1 flex flex-col justify-center p-4">
        <div className="w-full max-w-sm mx-auto">
          {/* Logo con imagen */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center mb-5"
          >
            <div className="w-20 h-20 mx-auto mb-3 rounded-2xl overflow-hidden shadow-2xl border-2 border-yellow-400">
              <img src="/icon-192.png" alt="YoAnoto" className="w-full h-full object-cover" />
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight drop-shadow-lg">
              YoAnoto
            </h1>
            <p className="text-emerald-300 text-sm">Anotador de Truco QUITILIPIENSE</p>
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl shadow-2xl p-5 space-y-4 border-t-4 border-yellow-500"
          >
            {/* Teams - stacked for easier editing */}
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 font-bold uppercase mb-1 block">
                  🔵 Equipo 1
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={team1}
                    onChange={(e) => setTeam1(e.target.value)}
                    onFocus={(e) => e.target.select()}
                    className="w-full p-4 pr-12 bg-blue-50 border-2 border-blue-300 rounded-xl text-center font-black text-xl text-blue-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    maxLength={12}
                    placeholder="Ej: Nosotros"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-400 text-xl pointer-events-none">✏️</span>
                </div>
              </div>

              <div className="flex justify-center">
                <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-xl font-black text-yellow-900">VS</span>
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-500 font-bold uppercase mb-1 block">
                  🟠 Equipo 2
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={team2}
                    onChange={(e) => setTeam2(e.target.value)}
                    onFocus={(e) => e.target.select()}
                    className="w-full p-4 pr-12 bg-orange-50 border-2 border-orange-300 rounded-xl text-center font-black text-xl text-orange-800 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
                    maxLength={12}
                    placeholder="Ej: Ellos"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-orange-400 text-xl pointer-events-none">✏️</span>
                </div>
              </div>
            </div>

            {/* Points */}
            <div>
              <label className="text-xs text-gray-500 font-bold uppercase mb-2 block text-center">
                🎯 Puntos
              </label>
              <div className="grid grid-cols-6 gap-1.5">
                {pointOptions.map((pts) => (
                  <button
                    key={pts}
                    onClick={() => setMaxPoints(pts)}
                    className={`py-3 rounded-xl font-black text-lg transition-all ${
                      maxPoints === pts
                        ? 'bg-emerald-600 text-white shadow-lg scale-105'
                        : 'bg-gray-100 text-gray-500 active:bg-gray-200'
                    }`}
                  >
                    {pts}
                  </button>
                ))}
              </div>
            </div>

            {/* Falta Envido */}
            <div>
              <label className="text-xs text-gray-500 font-bold uppercase mb-2 block text-center">
                🃏 Falta Envido
              </label>
              <div className="flex gap-2">
                {[1, 2].map((n) => (
                  <button
                    key={n}
                    onClick={() => setFaltaEnvido(n)}
                    className={`flex-1 py-3 rounded-xl font-bold text-lg transition-all ${
                      faltaEnvido === n
                        ? 'bg-red-500 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-500 active:bg-gray-200'
                    }`}
                  >
                    {n} Falta{n > 1 ? 's' : ''}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => onStart({ team1, team2, maxPoints, faltaEnvido })}
              className="w-full py-4 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-xl font-black text-xl shadow-xl active:scale-98 transition-transform"
            >
              ¡JUGAR!
            </button>
          </motion.div>

          {/* Credits */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-center mt-4"
          >
            <p className="text-emerald-400/60 text-xs font-mono">
              {'<'}<span className="text-yellow-400/80">dev</span>{'>'} <span className="text-white/70">GaLiSe</span> {'</'}<span className="text-yellow-400/80">dev</span>{'>'}
            </p>
          </motion.div>
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
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.5, rotate: -5 }}
        animate={{ scale: 1, rotate: 0 }}
        className="bg-gradient-to-br from-yellow-400 via-yellow-500 to-orange-500 rounded-3xl p-6 text-center w-full max-w-xs shadow-2xl border-4 border-yellow-300"
      >
        <div className="text-7xl mb-3">🏆</div>
        <h2 className="text-xl font-bold text-yellow-900">¡GANADOR!</h2>
        <h3 className="text-3xl font-black text-white mb-6 drop-shadow-lg">{winner}</h3>
        <button
          onClick={onRematch}
          className="w-full py-3 bg-white text-emerald-700 rounded-xl font-bold text-lg mb-2 shadow-lg active:scale-95 transition-all"
        >
          🔄 Revancha
        </button>
        <button
          onClick={onNewGame}
          className="w-full py-2 text-yellow-100 font-semibold active:text-white"
        >
          Nueva Partida
        </button>
      </motion.div>
    </motion.div>
  )
}

// Exit confirmation modal
function ExitConfirmModal({ score1, score2, team1, team2, onConfirm, onCancel }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        className="bg-white rounded-2xl p-5 text-center w-full max-w-xs shadow-2xl"
      >
        <div className="text-5xl mb-3">⚠️</div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">¿Salir del partido?</h2>
        <p className="text-gray-600 mb-4">
          Vas a perder el marcador actual:
        </p>
        <div className="bg-gray-100 rounded-xl p-3 mb-4">
          <div className="flex justify-center items-center gap-4 text-2xl font-black">
            <span className="text-blue-700">{team1}: {score1}</span>
            <span className="text-gray-400">-</span>
            <span className="text-orange-700">{team2}: {score2}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold text-lg shadow active:scale-95"
          >
            Seguir
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-xl font-bold text-lg shadow active:scale-95"
          >
            Salir
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// Game screen - FIXED LAYOUT with always visible buttons
function GameScreen({ config, onNewGame }) {
  const [score1, setScore1] = useState(0)
  const [score2, setScore2] = useState(0)
  const [history, setHistory] = useState([])
  const [winner, setWinner] = useState(null)
  const [showExitConfirm, setShowExitConfirm] = useState(false)
  const lastTapRef = useRef({ team1: 0, team2: 0 })

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
    playSound('tap')
    if (navigator.vibrate) navigator.vibrate(25)
    if (team === 1) {
      setScore1((prev) => Math.min(prev + points, config.maxPoints))
    } else {
      setScore2((prev) => Math.min(prev + points, config.maxPoints))
    }
    setHistory((prev) => [...prev, { team, points }])
  }, [winner, config.maxPoints])

  const handleTap = (team) => {
    const now = Date.now()
    const key = team === 1 ? 'team1' : 'team2'
    if (now - lastTapRef.current[key] < 200) return
    lastTapRef.current[key] = now
    addPoints(team, 1)
  }

  const getFaltaPoints = () => {
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

  const display1 = phase1 === 'buenas' ? score1 - halfPoints : score1
  const display2 = phase2 === 'buenas' ? score2 - halfPoints : score2

  return (
    <div className="h-screen flex flex-col bg-gray-100 overflow-hidden">
      <Head>
        <title>{score1} - {score2} | YoAnoto</title>
      </Head>

      {/* Header - compact with safe area for iPhone notch */}
      <div
        className="flex items-center justify-between px-3 py-2 bg-emerald-800 text-white"
        style={{ paddingTop: 'max(0.5rem, env(safe-area-inset-top, 0px))' }}
      >
        <button
          onClick={() => {
            if (score1 === 0 && score2 === 0) {
              onNewGame()
            } else {
              setShowExitConfirm(true)
            }
          }}
          className="p-2 active:bg-emerald-700 rounded-lg"
        >
          ⚙️
        </button>
        <div className="flex items-center gap-2">
          <img src="/icon-192.png" alt="" className="w-6 h-6 rounded" />
          <span className="font-bold">a {config.maxPoints}</span>
        </div>
        <button
          onClick={undo}
          disabled={history.length === 0}
          className="p-2 active:bg-emerald-700 rounded-lg disabled:opacity-30"
        >
          ↩️
        </button>
      </div>

      {/* Score panels - tappable */}
      <div className="flex-1 flex min-h-0">
        {/* Team 1 */}
        <div
          onClick={() => handleTap(1)}
          className={`flex-1 flex flex-col items-center justify-center p-3 cursor-pointer select-none active:opacity-80 transition-all ${
            phase1 === 'buenas' ? 'bg-gradient-to-b from-green-100 to-green-200' : 'bg-gradient-to-b from-red-50 to-red-100'
          }`}
          style={{ touchAction: 'manipulation' }}
        >
          <div className="text-blue-800 font-black text-3xl truncate max-w-full px-1">{config.team1}</div>
          <div className={`text-sm font-bold px-3 py-1 rounded-full mt-1 ${
            phase1 === 'buenas' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
          }`}>
            {phase1 === 'buenas' ? 'BUENAS' : 'MALAS'}
          </div>
          <div className="text-9xl font-black text-blue-800 leading-none my-2">{display1}</div>
          <TallyDisplay score={display1} color={phase1 === 'buenas' ? '#059669' : '#1e40af'} />
        </div>

        {/* Divider */}
        <div className="w-1 bg-gray-400" />

        {/* Team 2 */}
        <div
          onClick={() => handleTap(2)}
          className={`flex-1 flex flex-col items-center justify-center p-3 cursor-pointer select-none active:opacity-80 transition-all ${
            phase2 === 'buenas' ? 'bg-gradient-to-b from-green-100 to-green-200' : 'bg-gradient-to-b from-red-50 to-red-100'
          }`}
          style={{ touchAction: 'manipulation' }}
        >
          <div className="text-orange-800 font-black text-3xl truncate max-w-full px-1">{config.team2}</div>
          <div className={`text-sm font-bold px-3 py-1 rounded-full mt-1 ${
            phase2 === 'buenas' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
          }`}>
            {phase2 === 'buenas' ? 'BUENAS' : 'MALAS'}
          </div>
          <div className="text-9xl font-black text-orange-800 leading-none my-2">{display2}</div>
          <TallyDisplay score={display2} color={phase2 === 'buenas' ? '#059669' : '#c2410c'} />
        </div>
      </div>

      {/* Quick buttons - ALWAYS VISIBLE with safe area for iPhone home indicator */}
      <div
        className="bg-white border-t-2 border-gray-300 p-2 shadow-lg"
        style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom, 0px))' }}
      >
        {/* Row 1: +3 +4 +6 buttons */}
        <div className="flex gap-1.5 mb-1.5">
          {/* Team 1 buttons */}
          <div className="flex-1 flex gap-1">
            <button
              onClick={() => addPoints(1, 3)}
              className="flex-1 py-2.5 bg-blue-500 text-white rounded-lg font-black text-lg shadow active:scale-95"
            >
              +3
            </button>
            <button
              onClick={() => addPoints(1, 4)}
              className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg font-black text-lg shadow active:scale-95"
            >
              +4
            </button>
            <button
              onClick={() => addPoints(1, 6)}
              className="flex-1 py-2.5 bg-blue-700 text-white rounded-lg font-black text-lg shadow active:scale-95"
            >
              +6
            </button>
          </div>

          {/* Divider */}
          <div className="w-0.5 bg-gray-300" />

          {/* Team 2 buttons */}
          <div className="flex-1 flex gap-1">
            <button
              onClick={() => addPoints(2, 3)}
              className="flex-1 py-2.5 bg-orange-500 text-white rounded-lg font-black text-lg shadow active:scale-95"
            >
              +3
            </button>
            <button
              onClick={() => addPoints(2, 4)}
              className="flex-1 py-2.5 bg-orange-600 text-white rounded-lg font-black text-lg shadow active:scale-95"
            >
              +4
            </button>
            <button
              onClick={() => addPoints(2, 6)}
              className="flex-1 py-2.5 bg-orange-700 text-white rounded-lg font-black text-lg shadow active:scale-95"
            >
              +6
            </button>
          </div>
        </div>

        {/* Row 2: Falta buttons - wider */}
        <div className="flex gap-1.5">
          <button
            onClick={() => {
              const pts = getFaltaPoints()
              if (pts > 0) addPoints(1, pts)
            }}
            className="flex-1 py-3 bg-red-600 text-white rounded-lg font-bold text-base shadow active:scale-95"
          >
            FALTA +{getFaltaPoints()}
          </button>

          <div className="w-0.5 bg-gray-300" />

          <button
            onClick={() => {
              const pts = getFaltaPoints()
              if (pts > 0) addPoints(2, pts)
            }}
            className="flex-1 py-3 bg-red-600 text-white rounded-lg font-bold text-base shadow active:scale-95"
          >
            FALTA +{getFaltaPoints()}
          </button>
        </div>
      </div>

      {/* Winner modal */}
      <AnimatePresence>
        {winner && (
          <WinnerModal
            winner={winner}
            onRematch={rematch}
            onNewGame={onNewGame}
          />
        )}
      </AnimatePresence>

      {/* Exit confirmation modal */}
      <AnimatePresence>
        {showExitConfirm && (
          <ExitConfirmModal
            score1={score1}
            score2={score2}
            team1={config.team1}
            team2={config.team2}
            onConfirm={onNewGame}
            onCancel={() => setShowExitConfirm(false)}
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
        <meta name="description" content="Anotador de Truco QUITILIPIENSE - El mejor anotador para tus partidas" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
        <meta name="theme-color" content="#065f46" />
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
