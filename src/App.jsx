import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Analytics } from '@vercel/analytics/react'
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Check,
  ChevronRight,
  Copy,
  Heart,
  LoaderCircle,
  Plus,
  RotateCcw,
  Share2,
  Sparkles,
  Trophy,
  WandSparkles,
  X,
} from 'lucide-react'
import { Link, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom'
import { teddyMessages } from './assets/quizlyAssets'
import { StickerLayer, TeddyArt, TeddyMessage } from './components/VisualAssets'
import api from './services/api'
import { filters, getRelationship, getResultMessage, getResultMood, getThemeStyle, relationships } from './utils/quizlyData'

const APP_DESCRIPTION = 'Create a fun quiz about yourself and find out how well your friends, partner or family really know you.'
const DEFAULT_QUESTION_COUNT = 10
const genderOptions = [
  { id: 'male', symbol: '👨', label: 'Male', description: 'Share a little about yourself' },
  { id: 'female', symbol: '👩', label: 'Female', description: 'Share a little about yourself' },
  { id: 'prefer_not_to_say', symbol: '💕', label: 'Prefer not to say', description: 'That is completely okay' },
]

function optionText(option) {
  return typeof option === 'string' ? option : option?.text || ''
}

function quizPath(slug) {
  return `/quiz/${slug}`
}

function quizUrl(slug) {
  return `${window.location.origin}${quizPath(slug)}`
}

async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return
  }

  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.setAttribute('readonly', '')
  textarea.style.position = 'fixed'
  textarea.style.left = '-9999px'
  document.body.appendChild(textarea)
  textarea.select()
  document.execCommand('copy')
  document.body.removeChild(textarea)
}

function setMeta(selector, content) {
  const element = document.head.querySelector(selector)
  if (element) element.setAttribute('content', content)
}

function Seo({ title = 'Quizly - How Well Do They Know You?', description = APP_DESCRIPTION, image = '/og-preview.svg' }) {
  useEffect(() => {
    document.title = title
    setMeta('meta[name="description"]', description)
    setMeta('meta[property="og:title"]', title)
    setMeta('meta[property="og:description"]', description)
    setMeta('meta[property="og:image"]', image)
    setMeta('meta[name="twitter:title"]', title)
    setMeta('meta[name="twitter:description"]', description)
    setMeta('meta[name="twitter:image"]', image)
  }, [title, description, image])

  return null
}

function PageTransition({ children }) {
  const reduceMotion = useReducedMotion()
  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
      transition={{ duration: reduceMotion ? 0 : 0.2 }}
    >
      {children}
    </motion.div>
  )
}

function ThemeScope({ relationship = 'best-friend', children }) {
  return (
    <div className="theme-scope" style={getThemeStyle(relationship)}>
      {children}
    </div>
  )
}

function MobileHeader({ back = false, action = false }) {
  const navigate = useNavigate()
  return (
    <header className="page-width flex items-center justify-between py-4">
      {back ? (
        <button aria-label="Go back" onClick={() => navigate(-1)} className="icon-button">
          <ArrowLeft size={19} />
        </button>
      ) : (
        <div className="h-11 w-11" aria-hidden="true" />
      )}
      <Link to="/" aria-label="Quizly home" className="brand-link">
        <span className="brand-mark">
          <Heart size={16} fill="currentColor" />
        </span>
        quizly
      </Link>
      {action ? (
        <Link to="/create" className="mini-action">
          Create
        </Link>
      ) : (
        <div className="h-11 w-11" aria-hidden="true" />
      )}
    </header>
  )
}

function PrimaryButton({ children, onClick, disabled = false, variant = 'primary', type = 'button', className = '' }) {
  const reduceMotion = useReducedMotion()
  return (
    <motion.button
      whileTap={reduceMotion || disabled ? undefined : { scale: 0.98 }}
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`app-button ${variant === 'primary' ? 'app-button-primary' : 'app-button-secondary'} ${className}`}
    >
      {children}
    </motion.button>
  )
}

function ButtonLink({ to, state, children, variant = 'primary', className = '' }) {
  return (
    <Link to={to} state={state} className={`app-button ${variant === 'primary' ? 'app-button-primary' : 'app-button-secondary'} ${className}`}>
      {children}
    </Link>
  )
}

function RelationshipCard({ item, selected, onSelect }) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      type="button"
      onClick={() => onSelect(item.id)}
      aria-pressed={selected}
      className={`relationship-card ${selected ? 'is-selected' : ''}`}
    >
      <span className="relationship-symbol" aria-hidden="true">
        {item.symbol}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[14px] font-bold text-[#2d252b]">{item.label}</span>
        <span className="mt-0.5 block truncate text-[12px] text-[#75696e]">{item.description}</span>
      </span>
      <span className="select-dot" aria-hidden="true">
        {selected && <Check size={13} strokeWidth={3} />}
      </span>
    </motion.button>
  )
}

function LoadingState({ relationship = 'best-friend', message = teddyMessages.loading }) {
  return (
    <ThemeScope relationship={relationship}>
      <PageTransition>
        <MobileHeader back />
        <main className="page-width flex min-h-[70dvh] flex-col items-center justify-center text-center">
          <TeddyArt state="loading" size="lg" />
          <p className="mt-4 text-[15px] font-bold text-[#4d4248]">{message}</p>
          <LoaderCircle size={20} className="mt-3 animate-spin text-[var(--accent)]" aria-hidden="true" />
        </main>
      </PageTransition>
    </ThemeScope>
  )
}

function ErrorState({ title = teddyMessages.network, message = 'Please try again.', retry, actionLabel = 'Try Again', teddy = 'sad', relationship = 'best-friend' }) {
  return (
    <ThemeScope relationship={relationship}>
      <PageTransition>
        <MobileHeader />
        <main className="page-width relative flex min-h-[72dvh] flex-col items-center justify-center text-center">
          <StickerLayer variant="empty" />
          <TeddyArt state={teddy} size="lg" />
          <h1 className="display mt-5 text-[27px] font-bold leading-tight">{title}</h1>
          <p className="mt-3 max-w-[320px] text-[14px] leading-6 text-[#75696e]">{message}</p>
          {retry && (
            <div className="mt-7 w-full max-w-[260px]">
              <PrimaryButton onClick={retry}>
                {actionLabel} <RotateCcw size={17} />
              </PrimaryButton>
            </div>
          )}
        </main>
      </PageTransition>
    </ThemeScope>
  )
}

function EmptyPanel({ title, message, teddy = 'confused' }) {
  return (
    <section className="empty-panel">
      <TeddyArt state={teddy} size="md" />
      <h2 className="display mt-3 text-[22px] font-bold">{title}</h2>
      <p className="mt-2 text-[14px] leading-6 text-[#75696e]">{message}</p>
    </section>
  )
}

function SkeletonState({ kind = 'quiz', relationship = 'best-friend' }) {
  return (
    <ThemeScope relationship={relationship}>
      <PageTransition>
        <MobileHeader back />
        <main className="page-width pb-12 pt-5" aria-busy="true" aria-live="polite">
          <section className="skeleton-panel">
            <div className="skeleton-avatar" />
            <div className="mt-5 skeleton-line w-2/5" />
            <div className="mt-3 skeleton-line h-9 w-4/5" />
            <div className="mt-2 skeleton-line h-9 w-3/5" />
            {kind === 'leaderboard' ? (
              <div className="mt-8 grid gap-3">
                {[0, 1, 2, 3].map(item => (
                  <div key={item} className="skeleton-row" />
                ))}
              </div>
            ) : (
              <div className="mt-8 grid gap-3">
                <div className="skeleton-card" />
                <div className="skeleton-card" />
                <div className="skeleton-button" />
              </div>
            )}
          </section>
          <span className="sr-only">Loading {kind}...</span>
        </main>
      </PageTransition>
    </ThemeScope>
  )
}

function ConfettiBurst({ show }) {
  const reduceMotion = useReducedMotion()
  if (!show || reduceMotion) return null

  return (
    <div className="confetti-burst" aria-hidden="true">
      {Array.from({ length: 14 }).map((_, index) => (
        <motion.span
          key={index}
          style={{ '--x': `${(index - 6.5) * 12}px`, '--rot': `${index * 31}deg` }}
          initial={{ opacity: 0, y: 0, scale: 0.7 }}
          animate={{ opacity: [0, 1, 0], y: [-6, -54 - (index % 4) * 9], x: (index - 6) * 10, scale: 1 }}
          transition={{ duration: 0.9, delay: index * 0.025, ease: 'easeOut' }}
        />
      ))}
    </div>
  )
}

function ScoreReaction({ score, total }) {
  const percentage = total ? (score / total) * 100 : 0
  if (percentage === 100) return <video className="score-reaction" src="/assets/teddy/tenScore.mp4" autoPlay muted playsInline loop={false} controls={false} aria-label="Celebration reaction" />
  if (percentage >= 50) return <img className="score-reaction" src="/assets/teddy/after_lessthan9_score.gif" alt="Happy score reaction" onError={event => { event.currentTarget.style.display = 'none' }} />
  return <video className="score-reaction" src="/assets/teddy/less%20than%205%20score.mp4" autoPlay muted playsInline loop={false} controls={false} aria-label="Score reaction" />
}

function Home() {
  const [selected, setSelected] = useState('best-friend')
  const navigate = useNavigate()
  const selectedRelationship = getRelationship(selected)

  return (
    <ThemeScope relationship={selected}>
      <PageTransition>
        <Seo title="Quizly - How Well Do They Know You?" />
        <MobileHeader action />
        <main className="page-width pb-12 pt-5">
          <section className="hero-panel">
            <StickerLayer variant="home" />
            <div className="relative z-10 max-w-[410px]">
              <div className="eyebrow">
                <Sparkles size={14} />
                A tiny test of love
              </div>
              <h1 className="display mt-4 text-[38px] font-extrabold leading-[1.08] text-[#292127] sm:text-[52px]">
                How well do they <span className="accent-text">know you?</span>
              </h1>
              <p className="mt-4 text-[16px] leading-7 text-[#75696e]">
                Create a cute quiz about yourself, share it, and see who knows the little things.
              </p>
              <TeddyMessage state="waving" className="mt-5">
                {teddyMessages.home}
              </TeddyMessage>
              <div className="mt-6 max-w-[310px]">
                <PrimaryButton onClick={() => navigate('/create', { state: { relationship: selected } })}>
                  Create My Quiz <ArrowRight size={18} />
                </PrimaryButton>
              </div>
            </div>
            <div className="hero-teddy" aria-hidden="true">
              <TeddyArt state="home" size="hero" decorative />
            </div>
          </section>

          <section className="relative mt-9">
            <StickerLayer variant="cards" />
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <p className="section-kicker">Make it personal</p>
                <h2 className="display text-[23px] font-bold">Who is this quiz for?</h2>
              </div>
              <TeddyArt state="love" size="xs" decorative />
            </div>
            <div className="grid gap-2.5 sm:grid-cols-2">
              {relationships.map(item => (
                <RelationshipCard key={item.id} item={item} selected={selected === item.id} onSelect={setSelected} />
              ))}
            </div>
          </section>

          <section className="mt-9">
            <p className="section-kicker">How it works</p>
            <div className="how-steps">
              {['Create your quiz', 'Share your link', 'See who knows you best'].map((item, index) => (
                <div key={item} className="how-step">
                  <span>{index + 1}</span>
                  <b>{item}</b>
                </div>
              ))}
            </div>
          </section>
        </main>
      </PageTransition>
    </ThemeScope>
  )
}

function CreateFlow() {
  const navigate = useNavigate()
  const location = useLocation()
  const [step, setStep] = useState(0)
  const [relationship, setRelationship] = useState(location.state?.relationship || '')
  const [name, setName] = useState('')
  const [gender, setGender] = useState('')
  const [error, setError] = useState('')
  const themeRelationship = relationship || 'best-friend'

  if (step === 3) return <QuestionPicker relationship={relationship} creatorName={name.trim()} gender={gender} count={DEFAULT_QUESTION_COUNT} />

  const next = () => {
    if (step === 0 && !relationship) return setError('Pick someone to continue.')
    if (step === 1 && !name.trim()) return setError('Tell us your name first.')
    if (step === 2 && !gender) return setError('Choose an option, or select Prefer not to say.')
    setError('')
    setStep(step + 1)
  }

  const currentTeddy = step === 0 ? 'waving' : step === 1 ? 'writing' : step === 2 ? 'love' : 'thinking'

  return (
    <ThemeScope relationship={themeRelationship}>
      <PageTransition>
        <MobileHeader back />
        <main className="page-width pb-12 pt-4">
          <Seo title="Create Your Quiz - Quizly" />
          <p className="section-kicker accent-text">Step {step + 1} of 4</p>
          <TeddyMessage state={currentTeddy} className="mt-3">
            {step === 0 ? 'Choose the vibe for your quiz.' : step === 2 ? 'A little personalization, if you like.' : 'Make it feel like it is really from you.'}
          </TeddyMessage>

          {step === 0 && (
            <section className="mt-6">
              <h1 className="display text-[32px] font-extrabold leading-tight">Who are you making this quiz for?</h1>
              <p className="mt-3 text-[15px] leading-6 text-[#75696e]">Pick the person who will know your little details best.</p>
              <div className="mt-7 grid gap-2.5 sm:grid-cols-2">
                {relationships.map(item => (
                  <RelationshipCard
                    key={item.id}
                    item={item}
                    selected={relationship === item.id}
                    onSelect={value => {
                      setRelationship(value)
                      setError('')
                    }}
                  />
                ))}
              </div>
            </section>
          )}

          {step === 1 && (
            <section className="mt-6">
              <h1 className="display text-[32px] font-extrabold leading-tight">What is your name?</h1>
              <p className="mt-3 text-[15px] leading-6 text-[#75696e]">This appears on the quiz link and result screens.</p>
              <label htmlFor="creator-name" className="mt-7 block text-[13px] font-bold text-[#55484f]">
                Your name
              </label>
              <input
                id="creator-name"
                autoFocus
                value={name}
                onChange={event => {
                  setName(event.target.value)
                  setError('')
                }}
                onKeyDown={event => {
                  if (event.key === 'Enter') next()
                }}
                className="text-input mt-2"
                placeholder="e.g. Alex"
                autoComplete="name"
              />
            </section>
          )}

          {step === 2 && (
            <section className="mt-6">
              <h1 className="display text-[32px] font-extrabold leading-tight">What's your gender?</h1>
              <p className="mt-3 text-[15px] leading-6 text-[#75696e]">This helps us personalize your quiz experience 💕</p>
              <div className="mt-7 grid gap-3">
                {genderOptions.map(option => (
                  <motion.button
                    key={option.id}
                    type="button"
                    whileTap={{ scale: 0.98 }}
                    aria-pressed={gender === option.id}
                    onClick={() => {
                      setGender(option.id)
                      setError('')
                    }}
                    className={`gender-card ${gender === option.id ? 'is-selected' : ''}`}
                  >
                    <span className="gender-symbol" aria-hidden="true">{option.symbol}</span>
                    <span className="min-w-0 flex-1 text-left">
                      <span className="block text-[15px] font-extrabold text-[#2d252b]">{option.label}</span>
                      <span className="mt-1 block text-[12px] text-[#75696e]">{option.description}</span>
                    </span>
                    <span className="select-dot" aria-hidden="true">
                      {gender === option.id && <Check size={13} strokeWidth={3} />}
                    </span>
                  </motion.button>
                ))}
              </div>
            </section>
          )}

          {error && (
            <p role="alert" aria-live="polite" className="mt-4 rounded-[8px] bg-[var(--accent-soft)] px-3 py-2 text-[13px] font-semibold text-[var(--accent-strong)]">
              {error}
            </p>
          )}
          <div className="mt-8">
            <PrimaryButton onClick={next}>
              Continue <ChevronRight size={18} />
            </PrimaryButton>
          </div>
          <button type="button" onClick={() => navigate('/')} className="mt-4 min-h-[44px] w-full text-[13px] font-bold text-[#8a7b82]">
            Back to home
          </button>
        </main>
      </PageTransition>
    </ThemeScope>
  )
}

function QuestionPicker({ count = 10, relationship, creatorName, gender }) {
  const navigate = useNavigate()
  const [questions, setQuestions] = useState([])
  const [category, setCategory] = useState('ALL')
  const [selected, setSelected] = useState([])
  const [customQuestions, setCustomQuestions] = useState([])
  const [customForm, setCustomForm] = useState(null)
  const [correctAnswers, setCorrectAnswers] = useState({})
  const [expanded, setExpanded] = useState({})
  const [skipped, setSkipped] = useState([])
  const [loading, setLoading] = useState(true)
  const [fetching, setFetching] = useState(false)
  const [surprising, setSurprising] = useState(false)
  const [complete, setComplete] = useState(false)
  const [creating, setCreating] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [actionError, setActionError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    if (category === 'MY_OWN') {
      setQuestions([])
      setLoading(false)
      setFetching(false)
      return undefined
    }
    const controller = new AbortController()
    setFetching(true)
    setLoadError('')
    api
      .get('/questions', { params: { relationshipType: relationship, category, limit: 40 }, signal: controller.signal })
      .then(({ data }) => setQuestions(data.questions || []))
      .catch(error => {
        if (error.name !== 'CanceledError') setLoadError(teddyMessages.network)
      })
      .finally(() => {
        setLoading(false)
        setFetching(false)
      })
    return () => controller.abort()
  }, [relationship, category, reloadKey])

  const selectedIds = useMemo(() => new Set(selected.map(question => question._id)), [selected])
  const allFilters = filters

  const toggle = question => {
    setActionError('')
    if (selectedIds.has(question._id)) {
      setSelected(items => items.filter(item => item._id !== question._id))
      setCorrectAnswers(items => {
        const next = { ...items }
        delete next[question._id]
        return next
      })
      return
    }
    if (selected.length >= count) return setActionError(`Remove one question before adding more than ${count}.`)
    setSelected(items => [...items, question])
  }

  const surprise = async () => {
    setSurprising(true)
    setActionError('')
    try {
      const { data } = await api.get('/questions', { params: { relationshipType: relationship, category: 'ALL', limit: count, sample: 'true' } })
      if ((data.questions || []).length < count) {
        setActionError(teddyMessages.notEnough)
      } else {
        setSelected(data.questions.slice(0, count))
      }
    } catch (error) {
      setActionError(teddyMessages.network)
    } finally {
      setSurprising(false)
    }
  }

  const createQuiz = async () => {
    if (selected.length < count) return setActionError(teddyMessages.notEnough)
    setCreating(true)
    setActionError('')
    try {
      const { data } = await api.post('/quizzes', {
        creatorName,
        gender,
        relationshipType: relationship,
        questionIds: selected.filter(question => !question.isCustom).map(question => question._id),
        questionConfigs: selected.filter(question => !question.isCustom).map(question => ({
          questionId: question._id,
          correctAnswer: correctAnswers[question._id],
        })),
        customQuestions: selected.filter(question => question.isCustom).map(({ _id, isCustom, ...question }) => question),
      })
      navigate(`/quiz/${data.slug}/share`, { state: data })
    } catch (error) {
      setActionError(error.response?.data?.message || teddyMessages.network)
    } finally {
      setCreating(false)
    }
  }

  if (loadError) {
    return (
      <ErrorState
        relationship={relationship}
        title={loadError}
        message="Your question bank did not load. Check the connection and try again."
        retry={() => setReloadKey(key => key + 1)}
      />
    )
  }

  if ((loading && !questions.length) || surprising) {
    return <LoadingState relationship={relationship} message={surprising ? 'Teddy is picking a balanced set...' : teddyMessages.loading} />
  }

  if (complete) {
    return (
      <ThemeScope relationship={relationship}>
        <PageTransition>
          <MobileHeader back />
          <main className="page-width pb-12 pt-5">
            <div className="text-center">
              <TeddyMessage state="celebrating" className="mx-auto">
                {teddyMessages.quizReady}
              </TeddyMessage>
              <h1 className="display mt-5 text-[32px] font-extrabold">Your questions are ready</h1>
              <p className="mx-auto mt-3 max-w-[320px] text-[15px] leading-6 text-[#75696e]">
                You chose {selected.length} sweet little questions. Review or remove any before creating.
              </p>
            </div>
            <div className="mt-8 grid gap-2.5">
              {selected.map((question, index) => (
                <article key={question._id} className="selected-question">
                  <span className="question-index">{index + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p>{question.question}</p>
                    <div className="mt-3 grid gap-2">
                      {question.options.map((option, optionIndex) => (
                        <label key={`${question._id}-${optionIndex}`} className="creator-answer-option">
                          <input
                            type="radio"
                            name={`correct-${question._id}`}
                            checked={(question.isCustom ? question.correctAnswer : correctAnswers[question._id]) === optionIndex}
                            onChange={() => question.isCustom
                              ? setSelected(items => items.map(item => item._id === question._id ? { ...item, correctAnswer: optionIndex } : item))
                              : setCorrectAnswers(items => ({ ...items, [question._id]: optionIndex }))}
                          />
                          <span>{optionText(option)}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <button
                    type="button"
                    aria-label={`Remove question ${index + 1}`}
                    onClick={() => {
                      setSelected(items => items.filter(item => item._id !== question._id))
                      if (question.isCustom) setCustomQuestions(items => items.filter(item => item._id !== question._id))
                    }}
                    className="icon-button small"
                  >
                    <X size={15} />
                  </button>
                  {question.isCustom && (
                    <button
                      type="button"
                      className="icon-button small"
                      aria-label={`Edit question ${index + 1}`}
                      onClick={() => {
                        setCustomForm(question)
                        setCategory('MY_OWN')
                        setComplete(false)
                      }}
                    >
                      ✎
                    </button>
                  )}
                </article>
              ))}
            </div>
            {actionError && <p role="alert" className="mt-4 text-center text-[13px] font-bold text-[var(--accent-strong)]">{actionError}</p>}
            <div className="mt-8 grid gap-3">
              <PrimaryButton disabled={creating || selected.length < count || selected.some(question => !question.isCustom && correctAnswers[question._id] === undefined)} onClick={createQuiz}>
                {creating ? (
                  <>
                    <LoaderCircle size={17} className="animate-spin" /> Creating...
                  </>
                ) : (
                  <>
                    Create My Quiz <Heart size={17} />
                  </>
                )}
              </PrimaryButton>
              <PrimaryButton variant="secondary" onClick={() => setComplete(false)}>
                Keep Picking <ArrowLeft size={17} />
              </PrimaryButton>
            </div>
          </main>
        </PageTransition>
      </ThemeScope>
    )
  }

  return (
    <ThemeScope relationship={relationship}>
      <PageTransition>
        <MobileHeader back />
        <main className="page-width pb-32 pt-4">
          <section className="relative">
            <StickerLayer variant="picker" />
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="section-kicker accent-text">Step 4 of 4</p>
                <h1 className="display mt-2 text-[31px] font-extrabold">Pick 10 questions</h1>
                <p className="mt-2 text-[14px] leading-6 text-[#75696e]">Choose the details they should know.</p>
              </div>
              <TeddyArt state={selected.length === count ? 'happy' : 'thinking'} size="sm" />
            </div>
            <TeddyMessage state={selected.length < count ? 'thinking' : 'happy'} className="mt-5">
              {selected.length < count ? teddyMessages.questionSelection : teddyMessages.quizReady}
            </TeddyMessage>
          </section>

          <div className="sticky top-0 z-20 -mx-1 mt-5 bg-[#fffdfc]/95 py-2 backdrop-blur">
            <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Question filters">
              {allFilters.map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={category === id}
                  onClick={() => {
                    setCategory(id)
                    setActionError('')
                    if (id === 'MY_OWN') setCustomForm(null)
                  }}
                  className={`filter-chip ${category === id ? 'is-active' : ''}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between gap-3">
            <span className="text-[13px] font-bold text-[#54474e]">Selected: {selected.length} / {count}</span>
            <button type="button" onClick={surprise} className="inline-tool-button" disabled={surprising}>
              <WandSparkles size={15} />
              Surprise Me
            </button>
          </div>

          {fetching && !loading && (
            <p className="mt-2 flex items-center gap-2 text-[12px] font-bold text-[#8a7b82]" aria-live="polite">
              <LoaderCircle size={14} className="animate-spin text-[var(--accent)]" /> Filtering questions...
            </p>
          )}

          {actionError && (
            <p role="alert" className="mt-3 rounded-[8px] bg-[var(--accent-soft)] px-3 py-2 text-[13px] font-semibold text-[var(--accent-strong)]">
              {actionError}
            </p>
          )}

          {category === 'MY_OWN' ? (
            <CustomQuestionForm
              value={customForm}
              disabled={selected.length >= count}
              onCancel={() => setCategory('ALL')}
              onSave={value => {
                if (selected.length >= count && !customForm) return setActionError('Your quiz is full! Remove a question to add another. 🧸')
                const item = { ...value, _id: customForm?._id || `custom-${Date.now()}`, isCustom: true }
                setCustomQuestions(items => customForm ? items.map(existing => existing._id === item._id ? item : existing) : [...items, item])
                setSelected(items => customForm ? items.map(existing => existing._id === item._id ? item : existing) : [...items, item])
                setCustomForm(null)
                setCategory('ALL')
                setActionError('')
              }}
            />
          ) : (
          <section className="mt-3 grid gap-2.5" aria-label="Available questions">
            {questions.length ? (
              questions.map(question => {
                const isSelected = selectedIds.has(question._id)
                const isSkipped = skipped.includes(question._id)
                const options = Array.isArray(question.options) ? question.options : []
                return (
                  <article key={question._id} className={`question-card ${isSelected ? 'is-selected' : ''} ${isSkipped ? 'is-skipped' : ''}`}>
                    <div className="flex gap-3">
                      <span className="question-badge" aria-hidden="true">
                        {isSelected ? <Check size={16} /> : <Plus size={16} />}
                      </span>
                      <p className="flex-1 text-[14px] font-semibold leading-5 text-[#43373d]">{question.question}</p>
                    </div>
                    <button
                      type="button"
                      className="mt-3 text-left text-[12px] font-extrabold text-[var(--accent-strong)]"
                      aria-expanded={Boolean(expanded[question._id])}
                      onClick={() => {
                        console.log('Question:', question)
                        console.log('Options:', question.options)
                        console.log('Array.isArray(options):', Array.isArray(question.options))
                        setExpanded(items => ({ ...items, [question._id]: !items[question._id] }))
                      }}
                    >
                      {expanded[question._id] ? 'Hide options' : `Preview options (${options.length})`}
                    </button>
                    <AnimatePresence initial={false}>
                      {expanded[question._id] && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-2 grid grid-cols-2 gap-2 overflow-hidden"
                        >
                          {options.map((option, optionIndex) => {
                            const imageUrl = typeof option === 'object' ? option.imageUrl : ''
                            return (
                              <div key={`${question._id}-preview-${optionIndex}`} className="option-preview">
                                {imageUrl && <img src={imageUrl} alt="" loading="lazy" />}
                                <span><b>{String.fromCharCode(65 + optionIndex)}.</b> {optionText(option)}</span>
                              </div>
                            )
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        disabled={!isSelected && selected.length >= count}
                        onClick={() => toggle(question)}
                        className={`question-action ${isSelected ? 'is-added' : ''}`}
                      >
                        {isSelected ? (
                          <>
                            <Check size={14} /> Added
                          </>
                        ) : (
                          <>
                            <Plus size={14} /> Add
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => setSkipped(items => (items.includes(question._id) ? items.filter(id => id !== question._id) : [...items, question._id]))}
                        className="question-skip"
                      >
                        {isSkipped ? 'Unskip' : 'Skip'}
                      </button>
                    </div>
                  </article>
                )
              })
            ) : (
              <EmptyPanel title="No questions here yet" message="Try another filter or use Surprise Me for a ready-made set." />
            )}
          </section>
          )}

          {selected.length > 0 && selected.length < count && (
            <div className="mt-5 rounded-[8px] bg-[var(--accent-soft)] p-4 text-center text-[13px] font-bold text-[var(--accent-strong)]">
              {teddyMessages.notEnough} Pick {count - selected.length} more.
            </div>
          )}
        </main>
        <div className="sticky-action">
          <div className="mx-auto flex w-full max-w-[760px] items-center gap-3">
            <span className="flex-1 text-[13px] font-bold text-[#54474e]">Selected: {selected.length} / {count}</span>
            <button type="button" disabled={selected.length < count} onClick={() => setComplete(true)} className="sticky-next">
              Continue <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </PageTransition>
    </ThemeScope>
  )
}

function CustomQuestionForm({ value, disabled, onCancel, onSave }) {
  const [question, setQuestion] = useState(value?.question || '')
  const [options, setOptions] = useState(value?.options || [0, 1, 2, 3].map(() => ({ text: '', imageUrl: '' })))
  const [correctAnswer, setCorrectAnswer] = useState(value?.correctAnswer)
  const [error, setError] = useState('')

  const updateOption = (index, field, nextValue) => {
    setOptions(items => items.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: nextValue } : item))
  }

  const save = () => {
    if (!question.trim()) return setError('Write your question first.')
    if (options.some(option => !option.text.trim())) return setError('Add text for all four options.')
    if (correctAnswer === undefined) return setError('Choose the correct answer.')
    onSave({ question: question.trim(), options: options.map(option => ({ text: option.text.trim(), imageUrl: option.imageUrl.trim() })), correctAnswer })
  }

  return (
    <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="custom-question-card mt-4">
      <TeddyMessage state="writing">Make one that only your people can answer! 🧸</TeddyMessage>
      <h2 className="display mt-5 text-[25px] font-extrabold">✨ Create Your Own Question</h2>
      <label className="mt-5 block text-[13px] font-bold text-[#55484f]" htmlFor="custom-question">Question</label>
      <input id="custom-question" className="text-input mt-2" value={question} onChange={event => setQuestion(event.target.value)} placeholder="What's my favourite place to visit?" />
      <p className="mt-5 text-[13px] font-extrabold text-[#55484f]">Answer options</p>
      <div className="mt-2 grid gap-3">
        {options.map((option, index) => (
          <div key={index} className="custom-option-editor">
            <label className="text-[12px] font-extrabold text-[#75696e]" htmlFor={`custom-option-${index}`}>Option {String.fromCharCode(65 + index)}</label>
            <input id={`custom-option-${index}`} className="text-input mt-1" value={option.text} onChange={event => updateOption(index, 'text', event.target.value)} placeholder={['Beach', 'Mountains', 'Cafe', 'Home'][index]} />
            <label className="mt-2 block text-[12px] font-bold text-[#75696e]" htmlFor={`custom-image-${index}`}>Image/GIF URL (optional)</label>
            <input id={`custom-image-${index}`} className="text-input mt-1" value={option.imageUrl} onChange={event => updateOption(index, 'imageUrl', event.target.value)} placeholder="https://example.com/image.webp" inputMode="url" />
            {option.imageUrl && (
              <div className="mt-2">
                <img className="custom-image-preview" src={option.imageUrl} alt="" onError={event => { event.currentTarget.style.display = 'none'; event.currentTarget.nextElementSibling.style.display = 'block' }} />
                <span className="custom-image-error">Couldn't load this image</span>
              </div>
            )}
          </div>
        ))}
      </div>
      <p className="mt-5 text-[13px] font-extrabold text-[#55484f]">Which answer is correct?</p>
      <div className="mt-2 grid gap-2">
        {options.map((option, index) => (
          <label key={`correct-${index}`} className="creator-answer-option">
            <input type="radio" name="custom-correct-answer" checked={correctAnswer === index} onChange={() => setCorrectAnswer(index)} />
            <span>{option.text || `Option ${String.fromCharCode(65 + index)}`}</span>
          </label>
        ))}
      </div>
      {error && <p role="alert" className="mt-3 text-[13px] font-bold text-[var(--accent-strong)]">{error}</p>}
      {disabled && !value && <p className="mt-3 text-[13px] font-bold text-[var(--accent-strong)]">Your quiz is full! Remove a question to add another. 🧸</p>}
      <div className="mt-5 grid gap-2">
        <PrimaryButton disabled={disabled && !value} onClick={save}>✨ {value ? 'Save Changes' : 'Add To My Quiz'}</PrimaryButton>
        <PrimaryButton variant="secondary" onClick={onCancel}>Cancel</PrimaryButton>
      </div>
    </motion.section>
  )
}

function SharePage({ quiz }) {
  const [copied, setCopied] = useState(false)
  const relationship = quiz.relationshipType || 'best-friend'
  const shareUrl = quiz.shareUrl || quizUrl(quiz.slug)
  const manageUrl = quiz.manageUrl
  const shareText = `\u{1F440} How well do you know me?\nI made a quiz about myself.\nLet's see if you can get 10/10! \u2764\uFE0F\n${shareUrl}`
  const title = `How well do you know ${quiz.creatorName || 'me'}?`

  const copy = async () => {
    await copyText(shareUrl)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2200)
  }

  const share = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Quizly quiz', text: shareText, url: shareUrl })
      } else {
        await copy()
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        await copy()
      }
    }
  }

  return (
    <ThemeScope relationship={relationship}>
      <PageTransition>
        <Seo title={`${title} - Quizly`} description="Take this quick Quizly challenge and see your score." />
        <MobileHeader />
        <main className="page-width relative flex min-h-[78dvh] flex-col items-center justify-center pb-12 pt-4 text-center">
          <StickerLayer variant="share" />
          <TeddyMessage state="celebrating">{teddyMessages.quizReady}</TeddyMessage>
          <h1 className="display mt-5 text-[35px] font-extrabold leading-tight">Your quiz is ready!</h1>
          <p className="mt-3 text-[15px] text-[#75696e]">How well do they know {quiz.creatorName || 'you'}?</p>
          <p className="mt-2 text-[13px] font-semibold text-[#8e7d84]">{quiz.totalQuestions || 10} questions</p>
          <div className="share-url mt-7 w-full">
            <p className="truncate px-2 py-1 text-[13px] text-[#675a61]">{shareUrl}</p>
          </div>
          <div className="mt-3 grid w-full grid-cols-2 gap-3">
            <PrimaryButton variant="primary" onClick={copy}>
              <Copy size={16} /> Copy Link
            </PrimaryButton>
            <PrimaryButton variant="secondary" onClick={share}>
              <Share2 size={16} /> Share
            </PrimaryButton>
          </div>
          <ButtonLink to={manageUrl ? `/quiz/manage/${quiz.manageToken}` : `/quiz/${quiz.slug}/results`} variant="secondary" className="mt-3">
            <BarChart3 size={16} /> View Results
          </ButtonLink>
          {manageUrl && <CreatorLinkCopy manageUrl={manageUrl} />}
          <a href={`https://wa.me/?text=${encodeURIComponent(shareText)}`} target="_blank" rel="noreferrer" className="whatsapp-button mt-3">
            WhatsApp
          </a>
          {copied && (
            <motion.p initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="mt-4 text-[13px] font-bold text-[#2f8f53]">
              {'\u2713'} Link copied
            </motion.p>
          )}
          <ButtonLink to={quizPath(quiz.slug)} className="mt-5 w-full max-w-[320px]">
            Preview Quiz <ArrowRight size={17} />
          </ButtonLink>
        </main>
      </PageTransition>
    </ThemeScope>
  )
}

function CreatorLinkCopy({ manageUrl }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    await copyText(manageUrl)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2200)
  }
  return (
    <div className="mt-7 w-full rounded-2xl border border-[#eadfe0] bg-white/70 p-4 text-left">
      <p className="text-[13px] font-extrabold text-[#4a343c]">Your private creator link</p>
      <p className="mt-1 text-[12px] leading-5 text-[#8e7d84]">Save this link to check who played your quiz and see their scores.</p>
      <PrimaryButton variant="secondary" className="mt-3" onClick={copy}><Copy size={16} /> {copied ? 'Creator Link Copied' : 'Copy Creator Dashboard Link'}</PrimaryButton>
      <p className="mt-2 text-[11px] leading-4 text-[#9a8790]">Anyone with this private link can view your results. Keep it private.</p>
    </div>
  )
}

function ShareRoute() {
  const { slug } = useParams()
  const location = useLocation()
  const [quiz, setQuiz] = useState(location.state?.slug === slug ? location.state : null)
  const [error, setError] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    if (quiz?.slug === slug) return
    setError(null)
    api
      .get(`/quizzes/public/${slug}`)
      .then(({ data }) => setQuiz({ ...(data.quiz || data), shareUrl: quizUrl(slug) }))
      .catch(error => {
        const status = error.response?.status
        setError({
          title: status === 410 ? 'This quiz is no longer available.' : status === 404 ? "Oops! This quiz doesn't exist." : 'Something went wrong. Please try again.',
          message: status === 404 || status === 410 ? 'Ask the creator for a fresh link.' : 'Check your connection and try again.',
          teddy: status === 404 || status === 410 ? '404' : 'sad',
        })
      })
  }, [slug, quiz, reloadKey])

  if (error) {
    return (
      <ErrorState
        title={error.title}
        message={error.message}
        teddy={error.teddy}
        retry={() => {
          setQuiz(null)
          setReloadKey(key => key + 1)
        }}
      />
    )
  }

  if (!quiz) return <SkeletonState kind="share" />

  return <SharePage quiz={{ ...quiz, shareUrl: quiz.shareUrl || quizUrl(slug) }} />
}

function PlayerQuiz({ slug }) {
  const [quiz, setQuiz] = useState(null)
  const [loadError, setLoadError] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [step, setStep] = useState(-2)
  const [answers, setAnswers] = useState([])
  const [playerName, setPlayerName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [answerFeedback, setAnswerFeedback] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    setLoadError(null)
    setQuiz(null)
    api
      .get(`/quizzes/public/${slug}`)
      .then(({ data }) => setQuiz(data.quiz || data))
      .catch(error => {
        const status = error.response?.status
        setLoadError({
          title: status === 410 ? 'This quiz is no longer available.' : status === 404 ? "Oops! This quiz doesn't exist." : 'Something went wrong. Please try again.',
          message: status === 404 || status === 410 ? 'Ask the creator for a fresh link.' : 'Check your connection and try again.',
          teddy: status === 404 || status === 410 ? '404' : 'sad',
        })
      })
  }, [slug, reloadKey])

  if (loadError) {
    return (
      <ErrorState
        title={loadError.title}
        message={loadError.message}
        teddy={loadError.teddy}
        retry={() => setReloadKey(key => key + 1)}
      />
    )
  }

  if (!quiz) return <SkeletonState kind="quiz" />

  const relationship = quiz.relationshipType || 'best-friend'
  const chooseAnswer = index => {
    if (answerFeedback) return
    setAnswerFeedback(true)
    setAnswers(previous => {
      const next = [...previous]
      next[step] = index
      return next
    })
    window.setTimeout(() => setAnswerFeedback(false), 350)
  }

  const submitQuiz = async () => {
    if (!playerName.trim() || playerName.trim().length < 2) {
      setSubmitError('Enter at least 2 characters for your name.')
      setStep(-2)
      return
    }
    setSubmitting(true)
    setSubmitError('')
    try {
      const { data } = await api.post(`/quizzes/${slug}/submit`, { playerName: playerName.trim(), answers })
      navigate(`/quiz/${slug}/result/${data.responseId}`, { state: { ...data, totalQuestions: quiz.totalQuestions, creatorName: quiz.creatorName } })
    } catch (error) {
      setSubmitError(error.response?.data?.message || teddyMessages.submit)
      setSubmitting(false)
    }
  }

  if (step === -2) {
    return (
      <ThemeScope relationship={relationship}>
        <PageTransition>
          <Seo title={`Join ${quiz.creatorName}'s Quiz - Quizly`} />
          <MobileHeader />
          <main className="page-width flex min-h-[76dvh] flex-col items-center justify-center pb-12 text-center">
            <TeddyArt state="waving" size="lg" />
            <p className="section-kicker accent-text mt-5">Before we start... 👀</p>
            <h1 className="display mt-2 text-[34px] font-extrabold leading-tight">What's your name?</h1>
            <p className="mt-3 max-w-[320px] text-[15px] leading-6 text-[#75696e]">Your name will appear on the quiz results.</p>
            <input
              id="player-name"
              autoFocus
              value={playerName}
              onChange={event => {
                setPlayerName(event.target.value.slice(0, 30))
                setSubmitError('')
              }}
              onKeyDown={event => { if (event.key === 'Enter') setStep(-1) }}
              className="text-input mt-7 max-w-[340px]"
              placeholder="Your name"
              autoComplete="name"
            />
            {submitError && <p role="alert" className="mt-2 text-[13px] font-semibold text-[var(--accent-strong)]">{submitError}</p>}
            <div className="mt-6 w-full max-w-[320px]">
              <PrimaryButton onClick={() => {
                if (playerName.trim().length < 2) return setSubmitError('Please enter at least 2 characters.')
                setStep(-1)
              }}>Let's Play <Heart size={17} /></PrimaryButton>
            </div>
          </main>
        </PageTransition>
      </ThemeScope>
    )
  }

  if (step === -1) {
    return (
      <ThemeScope relationship={relationship}>
        <PageTransition>
          <Seo title={`How well do you know ${quiz.creatorName}? - Quizly`} description={`Take ${quiz.creatorName}'s Quizly challenge and see your score.`} />
          <MobileHeader />
          <main className="page-width flex min-h-[76dvh] flex-col items-center justify-center pb-12 text-center">
            <TeddyArt state="love" size="lg" />
            <p className="section-kicker accent-text mt-5">{getRelationship(relationship).label} Quiz</p>
            <h1 className="display mt-2 max-w-[420px] text-[34px] font-extrabold leading-tight">How well do you know {quiz.creatorName}?</h1>
            <p className="mt-4 text-[15px] text-[#75696e]">{quiz.totalQuestions} questions</p>
            <TeddyMessage state="thinking" className="mt-6">
              {teddyMessages.result}
            </TeddyMessage>
            <div className="mt-8 w-full max-w-[320px]">
              <PrimaryButton onClick={() => setStep(0)}>
                Start Quiz <ArrowRight size={18} />
              </PrimaryButton>
            </div>
          </main>
        </PageTransition>
      </ThemeScope>
    )
  }

  if (step === quiz.questions.length) {
    return (
      <ThemeScope relationship={relationship}>
        <PageTransition>
          <Seo title="Almost Done - Quizly" />
          <MobileHeader />
          <main className="page-width flex min-h-[76dvh] flex-col justify-center pb-12">
            <TeddyMessage state="celebrating">Ready to reveal your score, {playerName}! 🧸</TeddyMessage>
            <h1 className="display mt-6 text-[34px] font-extrabold leading-tight">You finished the quiz!</h1>
            <p className="mt-3 text-[15px] leading-6 text-[#75696e]">Your answers are ready to be checked.</p>
            {submitError && <p role="alert" className="mt-2 text-[13px] font-semibold text-[var(--accent-strong)]">{submitError}</p>}
            <div className="mt-7">
              <PrimaryButton disabled={submitting} onClick={submitQuiz}>
                {submitting ? (
                  <>
                    <LoaderCircle size={17} className="animate-spin" /> Submitting...
                  </>
                ) : (
                  <>
                    See My Score <Check size={17} />
                  </>
                )}
              </PrimaryButton>
            </div>
          </main>
        </PageTransition>
      </ThemeScope>
    )
  }

  const current = quiz.questions[step]
  const progress = ((step + 1) / quiz.totalQuestions) * 100

  return (
    <ThemeScope relationship={relationship}>
      <PageTransition>
        <Seo title={`Question ${step + 1} - Quizly`} />
        <MobileHeader back />
        <main className="page-width flex min-h-[78dvh] flex-col pb-8 pt-4">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="section-kicker accent-text">Question {step + 1} / {quiz.totalQuestions}</p>
              <h1 className="display mt-2 text-[27px] font-extrabold">Choose the closest answer</h1>
            </div>
            <span className="text-[13px] font-bold text-[#9a8790]">{Math.round(progress)}%</span>
          </div>
          <div className="mb-8 h-2 overflow-hidden rounded-full bg-[#f0e6e9]">
            <motion.div className="h-full rounded-full bg-[var(--accent)]" animate={{ width: `${progress}%` }} />
          </div>
          <motion.section key={step} initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} className="flex-1">
            <div className="mb-3 flex justify-end" aria-hidden="true">
              <TeddyArt state="thinking" size="xs" decorative />
            </div>
            <h2 className="display text-[25px] font-bold leading-tight text-[#30262c]">{current.question}</h2>
            <div className="mt-7 grid gap-3">
              {current.options.map((option, index) => (
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  key={`${current._id}-${index}`}
                  aria-pressed={answers[step] === index}
                  onClick={() => chooseAnswer(index)}
                  className={`answer-option ${answers[step] === index ? 'is-selected' : ''}`}
                >
                  <span className="answer-letter">{String.fromCharCode(65 + index)}</span>
                  {typeof option === 'object' && option.imageUrl && (
                    <img className="answer-option-image" src={option.imageUrl} alt="" loading="lazy" onError={event => { event.currentTarget.style.display = 'none' }} />
                  )}
                  <span className="min-w-0 flex-1">{optionText(option)}</span>
                  {answers[step] === index && <Check size={18} className="ml-auto" />}
                </motion.button>
              ))}
            </div>
          </motion.section>
          <div className="mt-8 grid grid-cols-2 gap-3">
            <PrimaryButton variant="secondary" disabled={step === 0} onClick={() => setStep(step - 1)}>
              <ArrowLeft size={17} /> Back
            </PrimaryButton>
            <PrimaryButton disabled={answers[step] === undefined} onClick={() => setStep(step + 1)}>
              {step === quiz.totalQuestions - 1 ? 'Finish Quiz' : 'Next'} <ArrowRight size={17} />
            </PrimaryButton>
          </div>
        </main>
      </PageTransition>
    </ThemeScope>
  )
}

function ScoreRing({ percentage }) {
  const reduceMotion = useReducedMotion()
  const circumference = 2 * Math.PI * 49
  return (
    <div className="relative h-40 w-40">
      <svg className="-rotate-90" viewBox="0 0 120 120" aria-hidden="true">
        <circle cx="60" cy="60" r="49" fill="none" stroke="#f2e6e8" strokeWidth="9" />
        <motion.circle
          initial={reduceMotion ? false : { strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - (circumference * percentage) / 100 }}
          transition={{ duration: reduceMotion ? 0 : 0.8, ease: 'easeOut' }}
          cx="60"
          cy="60"
          r="49"
          fill="none"
          stroke="var(--accent)"
          strokeLinecap="round"
          strokeWidth="9"
          strokeDasharray={circumference}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="display text-[31px] font-extrabold text-[#2d252b]">{percentage}%</span>
        <span className="text-[10px] font-bold uppercase tracking-[.1em] text-[#8f7e86]">score</span>
      </div>
    </div>
  )
}

function AnswersReview({ review }) {
  const [open, setOpen] = useState(false)
  if (!review?.length) return null

  return (
    <section className="review-panel mt-7">
      <button type="button" onClick={() => setOpen(value => !value)} className="flex min-h-[44px] w-full items-center justify-between text-[15px] font-bold text-[#3d3137]">
        See My Answers
        <motion.span animate={{ rotate: open ? 90 : 0 }}>
          <ChevronRight size={18} />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="mt-3 grid gap-2 border-t border-[#f1e8e9] pt-3">
              {review.map((item, index) => (
                <div key={`${item.question}-${index}`} className={`answer-review ${item.correct ? 'is-correct' : 'is-wrong'}`}>
                  <span className="mt-0.5">{item.correct ? <Check size={16} /> : <X size={16} />}</span>
                  <div>
                    <p className="text-[13px] font-semibold leading-5 text-[#493c42]">
                      {index + 1}. {item.question}
                    </p>
                    <p className="mt-1 text-[12px] text-[#887a80]">Your answer: {item.selectedAnswer || 'No answer'}</p>
                    <p className="text-[12px] font-semibold">{item.correct ? 'Nice pick.' : 'Needs a rematch.'}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}

function ResultPage() {
  const { slug, responseId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const [result, setResult] = useState(location.state || null)
  const [loading, setLoading] = useState(!location.state && Boolean(responseId))
  const [error, setError] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (location.state) {
      setResult(location.state)
      return
    }
    if (!responseId) return

    setLoading(true)
    setError(null)
    api
      .get(`/quizzes/${slug}/responses/${responseId}`)
      .then(({ data }) => setResult(data))
      .catch(error => {
        const status = error.response?.status
        setError({
          title: status === 410 ? 'This quiz is no longer available.' : status === 404 ? 'Result not found' : 'Something went wrong. Please try again.',
          message: status === 404 || status === 410 ? 'Open the quiz again to submit a fresh result.' : 'Check your connection and try again.',
          teddy: status === 404 || status === 410 ? 'confused' : 'sad',
        })
      })
      .finally(() => setLoading(false))
  }, [slug, responseId, location.state, reloadKey])

  if (loading) return <SkeletonState kind="result" />

  if (error) {
    return (
      <ErrorState
        title={error.title}
        message={error.message}
        teddy={error.teddy}
        retry={() => setReloadKey(key => key + 1)}
      />
    )
  }

  if (!result) {
    return (
      <ErrorState
        title="Result not available"
        message="Open the quiz again to submit your answers and see a fresh result."
        retry={() => navigate(quizPath(slug))}
        actionLabel="Back to Quiz"
        teddy="confused"
      />
    )
  }

  const relationship = result.relationshipType || 'best-friend'
  const total = result.totalQuestions || DEFAULT_QUESTION_COUNT
  const percentage = result.percentage ?? Math.round((result.score / total) * 100)
  const wrong = total - result.score
  const mood = getResultMood(percentage, relationship)
  const personalResult = getResultMessage({
    score: result.score,
    totalQuestions: total,
    creatorGender: result.creatorGender || 'prefer_not_to_say',
  })
  const text = `I just scored ${result.score}/${total} on their quiz \u{1F440}\nThink you can beat me?`
  const shareUrl = quizUrl(slug)

  const copy = async () => {
    await copyText(`${text}\n${shareUrl}`)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }

  const share = async () => {
    try {
      if (navigator.share) await navigator.share({ title: 'My Quizly result', text, url: shareUrl })
      else await copy()
    } catch (error) {
      if (error.name !== 'AbortError') await copy()
    }
  }

  return (
    <ThemeScope relationship={relationship}>
      <PageTransition>
        <Seo title={`I scored ${result.score}/${total} - Quizly`} description="See this Quizly result and try to beat the score." />
        <MobileHeader />
        <main className="page-width pb-14 pt-5">
          <section className="relative text-center">
            <StickerLayer variant="result" />
            <ConfettiBurst show={percentage >= 80} />
            <TeddyArt state={mood.teddy} size="lg" className="mx-auto" />
            <p className="section-kicker accent-text mt-4">Quiz complete</p>
            <ScoreReaction score={result.score} total={total} />
            <h1 className="display mt-2 text-[35px] font-extrabold">{result.playerName}'s Result 🎉</h1>
            <div className="mx-auto mt-5 flex justify-center">
              <ScoreRing percentage={percentage} />
            </div>
            <p className="display mt-1 text-[25px] font-extrabold text-[var(--accent)]">
              {result.score} <span className="text-[#ad9ca3]">/ {total}</span>
            </p>
            <h2 className="display mx-auto mt-4 max-w-[350px] text-[23px] font-extrabold leading-tight text-[#3d3137]">{personalResult.title}</h2>
            <p className="mx-auto mt-3 max-w-[350px] text-[16px] font-semibold leading-6 text-[#75696e]">{personalResult.message}</p>
          </section>

          <div className="mt-7 grid grid-cols-2 gap-3">
            <div className="stat-tile positive">
              <b>{result.score}</b>
              <span>Correct</span>
            </div>
            <div className="stat-tile negative">
              <b>{wrong}</b>
              <span>Wrong</span>
            </div>
          </div>

          <AnswersReview review={result.review || []} />

          <div className="mt-7 grid grid-cols-3 gap-2">
            <PrimaryButton variant="secondary" onClick={share}>
              <Share2 size={15} /> Share
            </PrimaryButton>
            <a href={`https://wa.me/?text=${encodeURIComponent(`${text}\n${shareUrl}`)}`} target="_blank" rel="noreferrer" className="whatsapp-compact">
              WhatsApp
            </a>
            <PrimaryButton variant="secondary" onClick={copy}>
              <Copy size={15} /> Copy
            </PrimaryButton>
          </div>
          {copied && <p className="mt-3 text-center text-[13px] font-bold text-[#2f8f53]">{'\u2713'} Copied</p>}
          <div className="mt-7 grid gap-3">
            <PrimaryButton onClick={share}>
              Challenge a Friend <Share2 size={17} />
            </PrimaryButton>
            <PrimaryButton variant="secondary" onClick={() => navigate('/create')}>
              Create Your Own Quiz <Heart size={17} />
            </PrimaryButton>
            <ButtonLink to={`/quiz/${slug}/leaderboard`} state={{ responseId: result.responseId, playerName: result.playerName }} variant="secondary">
              <Trophy size={17} /> See Leaderboard
            </ButtonLink>
          </div>
        </main>
      </PageTransition>
    </ThemeScope>
  )
}

function LeaderboardPage({ creator = false }) {
  const { slug } = useParams()
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const result = useLocation().state
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    setError(null)
    setData(null)
    api
      .get(`/quizzes/${slug}/${creator ? 'results' : 'leaderboard'}`)
      .then(({ data: response }) => setData(response))
      .catch(() => setError({ title: 'Something went wrong. Please try again.', message: creator ? 'Your quiz results did not load.' : 'The leaderboard did not load.' }))
  }, [slug, creator, reloadKey])

  if (error) return <ErrorState title={error.title} message={error.message} retry={() => setReloadKey(key => key + 1)} />
  if (!data) return <SkeletonState kind="leaderboard" />

  const relationship = data.relationshipType || 'best-friend'

  return (
    <ThemeScope relationship={relationship}>
      <PageTransition>
        <Seo title={creator ? 'Your Quiz Results - Quizly' : `Who knows ${data.creatorName} best? - Quizly`} description="See the Quizly leaderboard and challenge a friend." />
        <MobileHeader back />
        <main className="page-width pb-14 pt-5">
          <div className="mb-7 text-center">
            <TeddyArt state={creator ? 'writing' : 'celebrating'} size="md" className="mx-auto" />
            <p className="section-kicker accent-text mt-3">{creator ? 'Creator view' : 'The leaderboard'}</p>
            <h1 className="display mt-2 text-[30px] font-extrabold leading-tight">{creator ? 'Your Quiz Results' : `Who knows ${data.creatorName} best?`}</h1>
          </div>

          {creator && (
            <div className="mb-6 grid grid-cols-2 gap-2.5">
              <Stat label="Total Players" value={data.totalPlayers} />
              <Stat label="Average Score" value={`${data.averageScore} / ${data.totalQuestions}`} />
              <Stat label="Highest Score" value={`${data.highestScore} / ${data.totalQuestions}`} />
              <Stat label="Lowest Score" value={`${data.lowestScore} / ${data.totalQuestions}`} />
            </div>
          )}

          <section className="leaderboard-list" aria-label="Leaderboard">
            {data.entries.length ? (
              data.entries.map((entry, index) => {
                const isCurrent = result?.responseId ? result.responseId === entry.responseId : result?.playerName === entry.playerName
                const rank = index === 0 ? '\u{1F947}' : index === 1 ? '\u{1F948}' : index === 2 ? '\u{1F949}' : index + 1
                return (
                <motion.article
                  key={`${entry.playerName}-${entry.completedAt}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.025 }}
                  className={`leaderboard-entry ${isCurrent ? 'is-current' : ''}`}
                >
                  <span className="rank-badge">{rank}</span>
                  <span className="min-w-0 flex-1">
                    <b className="block truncate text-[14px] text-[#44363d]">{entry.playerName}</b>
                    {isCurrent && <small className="font-bold text-[var(--accent-strong)]">That is you</small>}
                  </span>
                  <span className="text-right">
                    <b className="block text-[14px] text-[#44363d]">{entry.score}/{data.totalQuestions}</b>
                    <small className="text-[11px] text-[#8f7f86]">{entry.percentage}%</small>
                  </span>
                </motion.article>
              )})
            ) : (
              <EmptyPanel title={creator ? 'No players yet' : 'No one has taken this quiz yet \u{1F440}'} message={creator ? 'Share your quiz link and results will appear here.' : 'Be the first to play this quiz.'} teddy="sleeping" />
            )}
          </section>

        </main>
      </PageTransition>
    </ThemeScope>
  )
}

function CreatorQuizDashboard() {
  const { manageToken } = useParams()
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    setError(null)
    api.get(`/quizzes/manage/${manageToken}`)
      .then(({ data: response }) => {
        if (!response?.quiz || !Array.isArray(response.submissions)) throw new Error('Invalid dashboard response')
        setData(response)
      })
      .catch(error => setError(error.response?.status === 404 ? 'This private dashboard link is invalid or expired.' : 'Your results could not be loaded.'))
  }, [manageToken, reloadKey])

  if (error) return <ErrorState title="Dashboard unavailable" message={error} retry={() => setReloadKey(key => key + 1)} teddy="sad" />
  if (!data) return <SkeletonState kind="leaderboard" />

  const { quiz, submissions } = data
  const best = submissions[0]
  const average = submissions.length ? Math.round(submissions.reduce((sum, item) => sum + item.percentage, 0) / submissions.length) : 0
  const playerUrl = quizUrl(quiz.slug)
  const copy = async () => {
    await copyText(playerUrl)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2200)
  }
  return (
    <ThemeScope relationship={quiz.relationshipType}>
      <PageTransition>
        <Seo title="Your Quiz Results - Quizly" description="See who knows you best on Quizly." />
        <MobileHeader />
        <main className="page-width pb-14 pt-5">
          <div className="text-center">
            <TeddyArt state="writing" size="md" className="mx-auto" />
            <p className="section-kicker accent-text mt-3">Private creator dashboard</p>
            <h1 className="display mt-2 text-[30px] font-extrabold leading-tight">Your Quiz Results 🧸</h1>
            <p className="mt-2 text-[15px] text-[#75696e]">See who knows you the best!</p>
          </div>
          <div className="mt-7 grid grid-cols-3 gap-2">
            <Stat label="Players" value={submissions.length} />
            <Stat label="Best Score" value={best ? `${best.score}/${quiz.totalQuestions}` : `0/${quiz.totalQuestions}`} />
            <Stat label="Average" value={`${average}%`} />
          </div>
          <div className="mt-6 grid gap-2">
            <PrimaryButton onClick={copy}><Share2 size={17} /> Share Quiz</PrimaryButton>
            <PrimaryButton variant="secondary" onClick={() => setReloadKey(key => key + 1)}>Refresh Results ↻</PrimaryButton>
          </div>
          <h2 className="display mt-9 text-[22px] font-extrabold">Who took your quiz? 👀</h2>
          {submissions.length ? (
            <div className="mt-4 grid gap-3">
              {submissions.map((submission, index) => (
                <ButtonLink key={submission.submissionId} to={`/quiz/manage/${manageToken}/submission/${submission.submissionId}`} variant="secondary" className="!h-auto !justify-start !p-4 text-left">
                  <span className="min-w-0 flex-1"><b className="block truncate">{index < 3 ? ['🥇', '🥈', '🥉'][index] : `#${index + 1}`} {submission.playerName}</b><small className="mt-1 block text-[#8e7d84]">{new Date(submission.completedAt).toLocaleString()}</small></span>
                  <span className="text-right"><b className="block">{submission.score}/{quiz.totalQuestions}</b><small className="text-[#8e7d84]">{submission.percentage}%</small></span>
                </ButtonLink>
              ))}
            </div>
          ) : (
            <EmptyPanel title="No one's taken your quiz yet 👀" message="Share your quiz and come back here to see who really knows you!" teddy="sleeping" />
          )}
          {copied && <p className="mt-3 text-center text-[13px] font-bold text-[#2f8f53]">✓ Player link copied</p>}
        </main>
      </PageTransition>
    </ThemeScope>
  )
}

function CreatorSubmissionPage() {
  const { manageToken, submissionId } = useParams()
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  useEffect(() => {
    api.get(`/quizzes/manage/${manageToken}/submissions/${submissionId}`)
      .then(({ data }) => setResult(data.result))
      .catch(() => setError('This submission could not be loaded.'))
  }, [manageToken, submissionId])
  if (error) return <ErrorState title="Submission unavailable" message={error} retry={() => window.history.back()} teddy="sad" />
  if (!result) return <SkeletonState kind="result" />
  return (
    <ThemeScope relationship={result.relationshipType}>
      <PageTransition>
        <MobileHeader back />
        <main className="page-width pb-14 pt-5">
          <div className="text-center"><TeddyArt state="celebrating" size="md" className="mx-auto" /><p className="section-kicker accent-text mt-3">Creator result</p><h1 className="display mt-2 text-[30px] font-extrabold">{result.playerName}'s Result 🧸</h1><p className="mt-2 text-[24px] font-extrabold text-[var(--accent)]">{result.score}/{result.totalQuestions} · {result.percentage}%</p></div>
          <div className="mt-7 grid gap-3">
            {(result.review || []).map((item, index) => <article key={`${item.question}-${index}`} className="selected-question"><b>Question {index + 1}</b><p className="mt-2 text-[14px]">{item.question}</p><p className="mt-2 text-[13px] text-[#75696e]">Selected: {item.selectedAnswer || 'No answer'} {item.correct ? '✓' : '✕'}</p></article>)}
          </div>
        </main>
      </PageTransition>
    </ThemeScope>
  )
}

function Stat({ label, value }) {
  return (
    <div className="stat-card">
      <b>{value}</b>
      <span>{label}</span>
    </div>
  )
}

function PlayerRoute() {
  const { slug } = useParams()
  return <PlayerQuiz slug={slug} />
}

function NotFound() {
  const navigate = useNavigate()
  return (
    <ErrorState
      title="Looks like this quiz took a wrong turn."
      message="The page you are looking for is not here."
      teddy="404"
      retry={() => navigate('/')}
      actionLabel="Go Home"
    />
  )
}

function App() {
  const location = useLocation()
  return (
    <div className="app-shell">
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Home />} />
          <Route path="/create" element={<CreateFlow />} />
          <Route path="/create/questions" element={<CreateFlow />} />
          <Route path="/quiz/manage/:manageToken/submission/:submissionId" element={<CreatorSubmissionPage />} />
          <Route path="/quiz/manage/:manageToken" element={<CreatorQuizDashboard />} />
          <Route path="/quiz/:slug/share" element={<ShareRoute />} />
          <Route path="/quiz/:slug/result/:responseId" element={<ResultPage />} />
          <Route path="/quiz/:slug/result" element={<ResultPage />} />
          <Route path="/quiz/:slug/leaderboard" element={<LeaderboardPage />} />
          <Route path="/quiz/:slug/results" element={<LeaderboardPage creator />} />
          <Route path="/quiz/:slug" element={<PlayerRoute />} />
          <Route path="/q/:slug/share" element={<ShareRoute />} />
          <Route path="/q/:slug/result/:responseId" element={<ResultPage />} />
          <Route path="/q/:slug/result" element={<ResultPage />} />
          <Route path="/q/:slug/leaderboard" element={<LeaderboardPage />} />
          <Route path="/q/:slug/results" element={<LeaderboardPage creator />} />
          <Route path="/q/:slug" element={<PlayerRoute />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AnimatePresence>
      <Analytics />
    </div>
  )
}

export default App
