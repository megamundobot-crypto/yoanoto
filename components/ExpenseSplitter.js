import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// Format number as Argentine pesos: 1234567 -> 1.234.567
function formatPesos(num) {
  if (!num && num !== 0) return ''
  return num.toLocaleString('es-AR')
}

// Parse formatted peso string back to number: "1.234.567" -> 1234567
function parsePesos(str) {
  const cleaned = str.replace(/\./g, '').replace(/,/g, '.')
  const num = parseFloat(cleaned)
  return isNaN(num) ? 0 : num
}

const CATEGORIES = [
  { id: 'carne', label: '🥩 Carne', icon: '🥩' },
  { id: 'bebidas', label: '🍺 Bebidas', icon: '🍺' },
  { id: 'carbon', label: '🔥 Carbón', icon: '🔥' },
  { id: 'hielo', label: '🧊 Hielo', icon: '🧊' },
  { id: 'pan', label: '🍞 Pan', icon: '🍞' },
  { id: 'cancha', label: '⚽ Cancha', icon: '⚽' },
  { id: 'extras', label: '🎵 Extras', icon: '🎵' },
  { id: 'otro', label: '📦 Otro', icon: '📦' },
]

// Load cached names from localStorage
function getCachedNames() {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem('yoanoto_names') || '[]')
  } catch { return [] }
}

function saveCachedNames(names) {
  if (typeof window === 'undefined') return
  try {
    const existing = getCachedNames()
    const updated = [...new Set([...existing, ...names])]
    localStorage.setItem('yoanoto_names', JSON.stringify(updated))
  } catch {}
}

// Debt simplification algorithm
function simplifyDebts(participants, expenses) {
  const balances = {}
  participants.forEach(p => { balances[p] = 0 })

  expenses.forEach(exp => {
    const perPerson = exp.amount / exp.splitBetween.length
    balances[exp.paidBy] += exp.amount
    exp.splitBetween.forEach(p => {
      balances[p] -= perPerson
    })
  })

  const debtors = []
  const creditors = []
  Object.entries(balances).forEach(([name, balance]) => {
    if (balance > 0.5) creditors.push({ name, amount: balance })
    else if (balance < -0.5) debtors.push({ name, amount: -balance })
  })

  debtors.sort((a, b) => b.amount - a.amount)
  creditors.sort((a, b) => b.amount - a.amount)

  const transactions = []
  let i = 0, j = 0
  while (i < debtors.length && j < creditors.length) {
    const amount = Math.min(debtors[i].amount, creditors[j].amount)
    if (amount > 0.5) {
      transactions.push({
        from: debtors[i].name,
        to: creditors[j].name,
        amount: Math.round(amount)
      })
    }
    debtors[i].amount -= amount
    creditors[j].amount -= amount
    if (debtors[i].amount < 0.5) i++
    if (creditors[j].amount < 0.5) j++
  }

  return transactions
}

// ==================== STEP 1: Participants ====================
function StepParticipants({ participants, setParticipants, onNext }) {
  const [inputValue, setInputValue] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const inputRef = useRef(null)

  const cachedNames = getCachedNames()

  const handleInput = (val) => {
    setInputValue(val)
    if (val.length >= 1) {
      const filtered = cachedNames.filter(
        n => n.toLowerCase().startsWith(val.toLowerCase()) && !participants.includes(n)
      )
      setSuggestions(filtered.slice(0, 4))
    } else {
      setSuggestions([])
    }
  }

  const addParticipant = (name) => {
    const trimmed = name.trim()
    if (trimmed && !participants.includes(trimmed)) {
      setParticipants([...participants, trimmed])
      setInputValue('')
      setSuggestions([])
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }

  const removeParticipant = (name) => {
    setParticipants(participants.filter(p => p !== name))
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addParticipant(inputValue)
    }
  }

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="w-full max-w-sm mx-auto space-y-4">
        <div className="text-center">
          <div className="text-5xl mb-2">👥</div>
          <h2 className="text-2xl font-black text-gray-800">¿Quiénes participan?</h2>
          <p className="text-gray-500 text-base mt-1">Agregá a los integrantes de la juntada</p>
        </div>

        {/* Input with autocomplete */}
        <div className="relative">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => handleInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 p-4 bg-white border-2 border-gray-300 rounded-xl text-xl font-bold text-gray-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
              placeholder="Nombre..."
              maxLength={15}
            />
            <button
              onClick={() => addParticipant(inputValue)}
              disabled={!inputValue.trim()}
              className="px-6 py-4 bg-emerald-600 text-white rounded-xl font-black text-2xl shadow active:scale-95 disabled:opacity-40"
            >
              +
            </button>
          </div>

          {/* Suggestions dropdown */}
          {suggestions.length > 0 && (
            <div className="absolute z-10 left-0 right-20 mt-1 bg-white border-2 border-emerald-300 rounded-xl shadow-lg overflow-hidden">
              {suggestions.map((name) => (
                <button
                  key={name}
                  onClick={() => addParticipant(name)}
                  className="w-full px-4 py-3 text-left font-bold text-lg text-emerald-800 hover:bg-emerald-50 active:bg-emerald-100 border-b border-gray-100 last:border-0"
                >
                  {name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Participants list */}
        <div className="space-y-2">
          <AnimatePresence>
            {participants.map((name, idx) => (
              <motion.div
                key={name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex items-center justify-between bg-white p-4 rounded-xl shadow border border-gray-200"
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-emerald-100 rounded-full flex items-center justify-center font-black text-emerald-700 text-xl">
                    {name[0].toUpperCase()}
                  </div>
                  <span className="font-bold text-gray-800 text-xl">{name}</span>
                </div>
                <button
                  onClick={() => removeParticipant(name)}
                  className="w-10 h-10 bg-red-100 text-red-600 rounded-full font-bold text-lg flex items-center justify-center active:bg-red-200"
                >
                  ✕
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {participants.length === 0 && (
          <div className="text-center text-gray-400 py-6">
            <div className="text-4xl mb-2">🫂</div>
            <p className="text-lg">Agregá al menos 2 personas</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ==================== STEP 2: Expenses ====================
function StepExpenses({ participants, expenses, setExpenses, onNext, onBack }) {
  const [showForm, setShowForm] = useState(false)
  const [paidBy, setPaidBy] = useState('')
  const [category, setCategory] = useState('')
  const [customCategory, setCustomCategory] = useState('')
  const [amountRaw, setAmountRaw] = useState('')
  const [amountDisplay, setAmountDisplay] = useState('')
  const [splitType, setSplitType] = useState('all')
  const [splitBetween, setSplitBetween] = useState([])

  const handleAmountChange = (e) => {
    // Only allow digits
    const digits = e.target.value.replace(/[^\d]/g, '')
    if (digits === '') {
      setAmountRaw('')
      setAmountDisplay('')
      return
    }
    const num = parseInt(digits, 10)
    setAmountRaw(num)
    setAmountDisplay(formatPesos(num))
  }

  const resetForm = () => {
    setPaidBy('')
    setCategory('')
    setCustomCategory('')
    setAmountRaw('')
    setAmountDisplay('')
    setSplitType('all')
    setSplitBetween([])
    setShowForm(false)
  }

  const addExpense = () => {
    const catLabel = category === 'otro' ? (customCategory || 'Otro') : CATEGORIES.find(c => c.id === category)?.label || category
    const split = splitType === 'all' ? [...participants] : splitBetween

    if (paidBy && category && amountRaw && split.length > 0) {
      setExpenses([...expenses, {
        id: Date.now(),
        paidBy,
        category: catLabel,
        amount: typeof amountRaw === 'number' ? amountRaw : parseFloat(amountRaw),
        splitBetween: split,
      }])
      resetForm()
    }
  }

  const removeExpense = (id) => {
    setExpenses(expenses.filter(e => e.id !== id))
  }

  const toggleSplitPerson = (name) => {
    setSplitBetween(prev =>
      prev.includes(name) ? prev.filter(p => p !== name) : [...prev, name]
    )
  }

  const total = expenses.reduce((s, e) => s + e.amount, 0)

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="w-full max-w-sm mx-auto space-y-4">
        <div className="text-center">
          <div className="text-5xl mb-2">🧾</div>
          <h2 className="text-2xl font-black text-gray-800">Gastos</h2>
          {total > 0 && (
            <p className="text-emerald-600 font-black text-2xl mt-1">Total: ${formatPesos(total)}</p>
          )}
        </div>

        {/* Expense list */}
        <div className="space-y-2">
          <AnimatePresence>
            {expenses.map((exp) => (
              <motion.div
                key={exp.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white p-4 rounded-xl shadow border border-gray-200"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-gray-800 text-lg">{exp.category}</div>
                    <div className="text-base text-gray-500">
                      Pagó <span className="font-bold text-emerald-700">{exp.paidBy}</span>
                    </div>
                    <div className="text-sm text-blue-600 mt-1">
                      {exp.splitBetween.length === participants.length
                        ? '👥 Entre todos'
                        : `👥 ${exp.splitBetween.join(', ')}`
                      }
                      <span className="text-gray-400"> · ${formatPesos(Math.round(exp.amount / exp.splitBetween.length))} c/u</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-2">
                    <span className="font-black text-xl text-gray-800">${formatPesos(exp.amount)}</span>
                    <button
                      onClick={() => removeExpense(exp.id)}
                      className="w-8 h-8 bg-red-100 text-red-600 rounded-full font-bold flex items-center justify-center"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Add expense form */}
        <AnimatePresence>
          {showForm ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="bg-white p-4 rounded-2xl shadow-lg border-2 border-emerald-300 space-y-4"
            >
              {/* Who paid */}
              <div>
                <label className="text-sm text-gray-500 font-bold uppercase block mb-2">¿Quién pagó?</label>
                <div className="flex flex-wrap gap-2">
                  {participants.map((p) => (
                    <button
                      key={p}
                      onClick={() => setPaidBy(p)}
                      className={`px-4 py-3 rounded-xl font-bold text-base transition-all ${
                        paidBy === p
                          ? 'bg-emerald-600 text-white shadow'
                          : 'bg-gray-100 text-gray-600 active:bg-gray-200'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="text-sm text-gray-500 font-bold uppercase block mb-2">¿Qué se compró?</label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setCategory(cat.id)}
                      className={`px-3 py-2.5 rounded-xl font-bold text-base transition-all ${
                        category === cat.id
                          ? 'bg-amber-500 text-white shadow'
                          : 'bg-gray-100 text-gray-600 active:bg-gray-200'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
                {category === 'otro' && (
                  <input
                    type="text"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    className="w-full mt-2 p-3 border-2 border-gray-300 rounded-xl text-base font-bold focus:border-amber-500 focus:outline-none"
                    placeholder="¿Qué fue?"
                    maxLength={20}
                  />
                )}
              </div>

              {/* Amount */}
              <div>
                <label className="text-sm text-gray-500 font-bold uppercase block mb-2">Monto</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-black text-2xl">$</span>
                  <input
                    type="text"
                    value={amountDisplay}
                    onChange={handleAmountChange}
                    className="w-full p-4 pl-10 border-2 border-gray-300 rounded-xl text-center font-black text-3xl text-gray-800 focus:border-emerald-500 focus:outline-none"
                    placeholder="0"
                    inputMode="numeric"
                  />
                </div>
              </div>

              {/* Split */}
              <div>
                <label className="text-sm text-gray-500 font-bold uppercase block mb-2">¿Entre quiénes?</label>
                <div className="flex gap-2 mb-2">
                  <button
                    onClick={() => setSplitType('all')}
                    className={`flex-1 py-3 rounded-xl font-bold text-base ${
                      splitType === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    👥 Todos
                  </button>
                  <button
                    onClick={() => setSplitType('custom')}
                    className={`flex-1 py-3 rounded-xl font-bold text-base ${
                      splitType === 'custom' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    ✋ Elegir
                  </button>
                </div>
                {splitType === 'custom' && (
                  <div className="flex flex-wrap gap-2">
                    {participants.map((p) => (
                      <button
                        key={p}
                        onClick={() => toggleSplitPerson(p)}
                        className={`px-4 py-3 rounded-xl font-bold text-base transition-all ${
                          splitBetween.includes(p)
                            ? 'bg-blue-500 text-white shadow'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Form actions */}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={resetForm}
                  className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-xl font-bold text-lg active:scale-95"
                >
                  Cancelar
                </button>
                <button
                  onClick={addExpense}
                  disabled={!paidBy || !category || !amountRaw || (splitType === 'custom' && splitBetween.length === 0)}
                  className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold text-lg shadow active:scale-95 disabled:opacity-40"
                >
                  Agregar
                </button>
              </div>
            </motion.div>
          ) : (
            <button
              onClick={() => setShowForm(true)}
              className="w-full py-4 bg-emerald-600 text-white rounded-xl font-bold text-xl shadow-lg active:scale-95 flex items-center justify-center gap-2"
            >
              ➕ Agregar Gasto
            </button>
          )}
        </AnimatePresence>

        {expenses.length === 0 && !showForm && (
          <div className="text-center text-gray-400 py-4">
            <div className="text-4xl mb-2">💸</div>
            <p className="text-lg">Cargá los gastos de la juntada</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ==================== STEP 3: Summary ====================
function StepSummary({ participants, expenses, aliases, setAliases, onBack }) {
  const debts = simplifyDebts(participants, expenses)
  const total = expenses.reduce((s, e) => s + e.amount, 0)

  // Per-person spending
  const perPerson = {}
  participants.forEach(p => { perPerson[p] = { paid: 0, owes: 0 } })
  expenses.forEach(exp => {
    perPerson[exp.paidBy].paid += exp.amount
    const share = exp.amount / exp.splitBetween.length
    exp.splitBetween.forEach(p => {
      perPerson[p].owes += share
    })
  })

  const shareWhatsApp = () => {
    let text = '━━━━━━━━━━━━━━━━━━━━\n'
    text += '💰 *YoAnoto - DIVISIÓN DE GASTOS* 💰\n'
    text += '━━━━━━━━━━━━━━━━━━━━\n\n'

    text += '📋 *DETALLE DE GASTOS:*\n\n'
    expenses.forEach(exp => {
      const splitNames = exp.splitBetween.length === participants.length
        ? 'Entre todos'
        : exp.splitBetween.join(', ')
      const perPers = Math.round(exp.amount / exp.splitBetween.length)
      text += `  ${exp.category}\n`
      text += `  💲 *$${formatPesos(exp.amount)}* — Pagó *${exp.paidBy.toUpperCase()}*\n`
      text += `  👥 ${splitNames} ($${formatPesos(perPers)} c/u)\n\n`
    })

    text += '━━━━━━━━━━━━━━━━━━━━\n'
    text += `💵 *TOTAL: $${formatPesos(total)}*\n`
    text += `👥 ${participants.length} personas\n`
    text += '━━━━━━━━━━━━━━━━━━━━\n\n'

    text += '🔄 *QUIÉN LE PAGA A QUIÉN:*\n\n'
    if (debts.length === 0) {
      text += '  ✅ ¡Están todos al día!\n'
    } else {
      debts.forEach(d => {
        text += `  💸 *${d.from.toUpperCase()}*\n`
        text += `      ➡️  le paga a  ➡️\n`
        text += `  🏦 *${d.to.toUpperCase()}*\n`
        text += `      💲 *$${formatPesos(d.amount)}*\n`
        if (aliases[d.to]) {
          text += `      📲 Alias: *${aliases[d.to]}*\n`
        }
        text += '\n'
      })
    }

    text += '━━━━━━━━━━━━━━━━━━━━\n'
    text += '_Hecho con YoAnoto_ 🃏\n'
    text += '👉 https://yoanoto.vercel.app\n'
    text += '━━━━━━━━━━━━━━━━━━━━'

    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
  }

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="w-full max-w-sm mx-auto space-y-4">
        <div className="text-center">
          <div className="text-5xl mb-2">📊</div>
          <h2 className="text-2xl font-black text-gray-800">Resumen</h2>
          <p className="text-emerald-600 font-black text-2xl mt-1">Total: ${formatPesos(total)}</p>
        </div>

        {/* Per-person breakdown */}
        <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <span className="text-sm font-bold text-gray-500 uppercase">Resumen por persona</span>
          </div>
          {participants.map(p => (
            <div key={p} className="px-4 py-3 border-b border-gray-100 last:border-0 flex justify-between items-center">
              <span className="font-black text-gray-800 text-lg">{p}</span>
              <div className="text-right">
                <div className="text-sm text-gray-500">
                  Pagó ${formatPesos(Math.round(perPerson[p].paid))} · Le toca ${formatPesos(Math.round(perPerson[p].owes))}
                </div>
                <div className={`font-black text-base ${
                  perPerson[p].paid - perPerson[p].owes > 0.5 ? 'text-emerald-600' :
                  perPerson[p].paid - perPerson[p].owes < -0.5 ? 'text-red-600' : 'text-gray-500'
                }`}>
                  {perPerson[p].paid - perPerson[p].owes > 0.5
                    ? `Le deben $${formatPesos(Math.round(perPerson[p].paid - perPerson[p].owes))}`
                    : perPerson[p].paid - perPerson[p].owes < -0.5
                    ? `Debe $${formatPesos(Math.round(perPerson[p].owes - perPerson[p].paid))}`
                    : 'Al día ✓'
                  }
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Transactions */}
        <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 bg-emerald-50 border-b border-emerald-200">
            <span className="text-sm font-bold text-emerald-700 uppercase">🔄 Transferencias</span>
          </div>
          {debts.length === 0 ? (
            <div className="p-4 text-center text-gray-500 text-lg">
              ✅ ¡Nadie debe nada!
            </div>
          ) : (
            debts.map((d, i) => (
              <div key={i} className="px-4 py-4 border-b border-gray-100 last:border-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-red-600 text-lg">{d.from}</span>
                    <span className="text-gray-400 text-xl">➡️</span>
                    <span className="font-black text-emerald-600 text-lg">{d.to}</span>
                  </div>
                  <span className="font-black text-2xl">${formatPesos(d.amount)}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Aliases for payment */}
        <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 bg-blue-50 border-b border-blue-200">
            <span className="text-sm font-bold text-blue-700 uppercase">📲 Alias de pago (opcional)</span>
          </div>
          <div className="p-4 space-y-3">
            {[...new Set(debts.map(d => d.to))].map(name => (
              <div key={name} className="flex items-center gap-3">
                <span className="font-bold text-base text-gray-700 w-24 truncate">{name}:</span>
                <input
                  type="text"
                  value={aliases[name] || ''}
                  onChange={(e) => setAliases({ ...aliases, [name]: e.target.value })}
                  className="flex-1 p-3 border-2 border-gray-200 rounded-xl text-base font-bold focus:border-blue-400 focus:outline-none"
                  placeholder="alias.mp o CBU"
                  maxLength={30}
                />
              </div>
            ))}
            {debts.length === 0 && (
              <p className="text-center text-base text-gray-400">No hay transferencias pendientes</p>
            )}
          </div>
        </div>

        {/* WhatsApp share button */}
        <button
          onClick={shareWhatsApp}
          className="w-full py-5 bg-green-500 text-white rounded-xl font-bold text-xl shadow-lg active:scale-95 flex items-center justify-center gap-2"
        >
          📱 Compartir por WhatsApp
        </button>
      </div>
    </div>
  )
}

// ==================== MAIN COMPONENT ====================
export default function ExpenseSplitter({ onBack }) {
  const [step, setStep] = useState(1)
  const [participants, setParticipants] = useState([])
  const [expenses, setExpenses] = useState([])
  const [aliases, setAliases] = useState({})

  const goToStep2 = () => {
    saveCachedNames(participants)
    setStep(2)
  }

  const stepLabels = ['Personas', 'Gastos', 'Resumen']

  return (
    <div className="h-screen flex flex-col bg-gray-100 overflow-hidden">
      {/* Header */}
      <div
        className="bg-emerald-800 text-white px-3 py-2"
        style={{ paddingTop: 'max(0.5rem, env(safe-area-inset-top, 0px))' }}
      >
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={step === 1 ? onBack : () => setStep(step - 1)}
            className="p-2 active:bg-emerald-700 rounded-lg font-bold text-lg"
          >
            ← {step === 1 ? 'Menú' : 'Atrás'}
          </button>
          <span className="font-bold text-xl">💰 Gastos</span>
          <div className="w-16" />
        </div>

        {/* Step indicator */}
        <div className="flex gap-1">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex-1 flex flex-col items-center">
              <div className={`w-full h-2 rounded-full ${
                s <= step ? 'bg-yellow-400' : 'bg-emerald-600'
              }`} />
              <span className={`text-sm mt-1 ${s === step ? 'text-yellow-300 font-bold' : 'text-emerald-400'}`}>
                {stepLabels[s - 1]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div key="s1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col min-h-0">
            <StepParticipants
              participants={participants}
              setParticipants={setParticipants}
              onNext={goToStep2}
            />
          </motion.div>
        )}
        {step === 2 && (
          <motion.div key="s2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col min-h-0">
            <StepExpenses
              participants={participants}
              expenses={expenses}
              setExpenses={setExpenses}
              onNext={() => setStep(3)}
              onBack={() => setStep(1)}
            />
          </motion.div>
        )}
        {step === 3 && (
          <motion.div key="s3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col min-h-0">
            <StepSummary
              participants={participants}
              expenses={expenses}
              aliases={aliases}
              setAliases={setAliases}
              onBack={() => setStep(2)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom navigation button */}
      <div
        className="bg-white border-t-2 border-gray-300 p-3"
        style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom, 0px))' }}
      >
        {step === 1 && (
          <button
            onClick={goToStep2}
            disabled={participants.length < 2}
            className="w-full py-4 bg-emerald-600 text-white rounded-xl font-black text-xl shadow-lg active:scale-95 disabled:opacity-40"
          >
            Siguiente →
          </button>
        )}
        {step === 2 && (
          <button
            onClick={() => setStep(3)}
            disabled={expenses.length === 0}
            className="w-full py-4 bg-emerald-600 text-white rounded-xl font-black text-xl shadow-lg active:scale-95 disabled:opacity-40"
          >
            Ver Resumen →
          </button>
        )}
        {step === 3 && (
          <button
            onClick={onBack}
            className="w-full py-4 bg-gray-200 text-gray-700 rounded-xl font-bold text-xl active:scale-95"
          >
            🏠 Volver al Menú
          </button>
        )}
      </div>
    </div>
  )
}
