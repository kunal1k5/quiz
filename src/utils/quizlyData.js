export const relationships = [
  { id: 'friend', label: 'Friend', description: 'Someone you laugh with', symbol: '\u{1F91D}', teddy: 'waving' },
  { id: 'best-friend', label: 'Best Friend', description: 'Your favourite person', symbol: '\u{1F9F8}', teddy: 'happy' },
  { id: 'partner', label: 'Partner', description: 'Your special someone', symbol: '\u2764\uFE0F', teddy: 'love' },
  { id: 'crush', label: 'Crush', description: 'Keep it cute and curious', symbol: '\u{1F498}', teddy: 'excited' },
  { id: 'family', label: 'Family', description: 'The people who know you', symbol: '\u{1F46A}', teddy: 'home' },
]

export const filters = [
  ['ALL', 'All'],
  ['PERSONALITY', 'Deep'],
  ['FOOD', 'Food'],
  ['MEMORIES', 'Memories'],
  ['FUNNY', 'Funny'],
  ['HABITS', 'Habits'],
  ['FRIENDSHIP', 'Friends'],
  ['BEST FRIEND', 'Bestie'],
  ['COUPLE', 'Love'],
  ['CRUSH', 'Crush'],
  ['FAMILY', 'Family'],
]

export const relationshipThemes = {
  friend: {
    accent: '#5b7cec',
    accentStrong: '#405ec8',
    accentSoft: '#eef3ff',
    accentTint: '#f7f9ff',
    accentBorder: '#dbe5ff',
    accentShadow: 'rgba(91, 124, 236, .22)',
  },
  'best-friend': {
    accent: '#8a5cf6',
    accentStrong: '#6b43d7',
    accentSoft: '#f3edff',
    accentTint: '#fbf8ff',
    accentBorder: '#e4d8ff',
    accentShadow: 'rgba(138, 92, 246, .2)',
  },
  partner: {
    accent: '#e24d6f',
    accentStrong: '#c83759',
    accentSoft: '#fff0f3',
    accentTint: '#fff8f9',
    accentBorder: '#ffd5df',
    accentShadow: 'rgba(226, 77, 111, .22)',
  },
  crush: {
    accent: '#d94fa3',
    accentStrong: '#b93682',
    accentSoft: '#fff0fa',
    accentTint: '#fff8fd',
    accentBorder: '#f8d3ee',
    accentShadow: 'rgba(217, 79, 163, .2)',
  },
  family: {
    accent: '#d88922',
    accentStrong: '#a96510',
    accentSoft: '#fff5de',
    accentTint: '#fffaf0',
    accentBorder: '#ffe2a8',
    accentShadow: 'rgba(216, 137, 34, .2)',
  },
}

export function getRelationship(id) {
  return relationships.find(item => item.id === id) || relationships[1]
}

export function getThemeStyle(id) {
  const theme = relationshipThemes[id] || relationshipThemes['best-friend']
  return {
    '--accent': theme.accent,
    '--accent-strong': theme.accentStrong,
    '--accent-soft': theme.accentSoft,
    '--accent-tint': theme.accentTint,
    '--accent-border': theme.accentBorder,
    '--accent-shadow': theme.accentShadow,
  }
}

const relationshipLevels = {
  friend: '\u{1F525} Close Friend',
  'best-friend': '\u{1F3C6} Best Friend Material',
  partner: '\u2764\uFE0F You Know Them Really Well',
  crush: '\u{1F498} Interesting...',
  family: '\u{1FAC2} You Know Them Well',
}

export function getResultMood(percentage, relationship = 'best-friend') {
  const level = relationshipLevels[relationship] || relationshipLevels['best-friend']
  if (percentage >= 100) return { teddy: 'celebrating', message: '\u{1F3C6} You know them better than anyone!', level }
  if (percentage >= 80) return { teddy: 'happy', message: '\u2764\uFE0F You know them really well!', level }
  if (percentage >= 50) return { teddy: 'thinking', message: '\u{1F440} Not bad... but you can do better!', level }
  if (percentage >= 30) return { teddy: 'confused', message: '\u{1F62D} We need to talk!', level }
  return { teddy: 'sad', message: '\u{1F480} Fake friend detected!', level }
}

const resultMessages = {
  male: {
    veryLow: { title: 'Bro... do you even know me? 💀', message: 'Tu mera friend hi nahi hai 😭 Itna bhi nahi pata? Main tujhe block kar raha hoon 😂', emoji: '💀😭' },
    low: { title: 'Fake Friend Detected 🚨', message: 'Tu mera friend bolta hai aur mujhe itna bhi nahi jaanta? 😭 Block list mein naam daal raha hoon 💀', emoji: '😭' },
    average: { title: 'Half Friend, Half Stranger 👀', message: '50-50 hai bhai 😭 Thoda aur time mere saath spend karna padega.', emoji: '👀' },
    good: { title: "You're Getting There 👀", message: 'Accha hai bhai! Tu mujhe kaafi had tak jaanta hai 😎', emoji: '😎💕' },
    excellent: { title: 'Almost Perfect! 🥹', message: 'Bas ek answer aur! Tu toh mujhe almost pura jaanta hai bro ❤️', emoji: '🥹❤️' },
    perfect: { title: 'YOU ACTUALLY KNOW ME! 🥹❤️', message: 'Brooo! 10/10?! Tu mujhe itna achhe se kaise jaanta hai 😭❤️ Respect!', emoji: '🥳🎉❤️' },
  },
  female: {
    veryLow: { title: 'Girl... Do You Even Know Me? 💀', message: 'Girl 😭 tum mujhe jaanti hi nahi ho! Main tumhe block kar rahi hoon 😂', emoji: '💀😭' },
    low: { title: 'Fake Friend Detected 🚨', message: 'Tum mujhe friend bolti ho aur mujhe itna bhi nahi jaanti? 😭 Main block kar rahi hoon 💀', emoji: '😭' },
    average: { title: 'Half Friend, Half Stranger 👀', message: 'Okay girl... 50-50 😭 Thoda aur time mere saath spend karna padega.', emoji: '👀' },
    good: { title: "You're Getting There 💕", message: 'Accha hai girl! Tum mujhe kaafi had tak jaanti ho 😌', emoji: '😎💕' },
    excellent: { title: 'Almost Perfect! 🥹', message: 'Bas ek answer aur! Tum toh mujhe almost pura jaanti ho ❤️', emoji: '🥹❤️' },
    perfect: { title: 'YOU ACTUALLY KNOW ME! 🥹❤️', message: 'Girl!!! 10/10?! Tum mujhe itna achhe se kaise jaanti ho 😭❤️ Bestie for real!', emoji: '🥳🎉❤️' },
  },
  neutral: {
    veryLow: { title: 'Umm... Do You Even Know Me? 💀', message: 'Yaar 😭 tum mujhe bilkul nahi jaante. Friendship seriously under review hai 💀', emoji: '💀😭' },
    low: { title: 'Friendship Under Investigation 🚨', message: 'Itne kam answers? 😭 Mujhe lagta hai humein thoda aur time saath spend karna chahiye.', emoji: '😭' },
    average: { title: 'Not Bad 👀', message: "Halfway there! Tum mujhe thoda jaante ho, but there's room for improvement.", emoji: '👀' },
    good: { title: 'Okay, You Know Me! 👀', message: 'Pretty good! Tum mujhe actually kaafi achhe se jaante ho 💕', emoji: '😎💕' },
    excellent: { title: 'So Close! 🥹', message: 'Bas ek answer! Almost perfect.', emoji: '🥹❤️' },
    perfect: { title: 'YOU KNOW ME TOO WELL! 🥹❤️', message: '10/10! Okay... this is actually impressive. Tum mujhe REALLY jaante ho! ❤️', emoji: '🥳🎉❤️' },
  },
}

const scoreOverrides = {
  male: {
    2: { title: 'Bro, this is embarrassing 😭', message: 'Tu mujhe jaanta hi nahi hai bhai 💀 Main soch raha hoon tujhe block kar doon.' },
    3: { title: 'Are we even friends? 😭', message: 'Bhai, itne kam answers? Mujhe lagta hai friendship ka revision karna padega 😂' },
    6: { title: 'Okay... You Know Me A Little 😏', message: 'Not bad bro 👀 Lekin abhi aur improvement chahiye.' },
  },
  female: {
    2: { title: 'This Is Painful 😭', message: 'Girl, itna bhi nahi pata mere baare mein? 💀 Mujhe tumse baat karni padegi.' },
    3: { title: 'Are We Even Friends? 😭', message: 'Girl 😭 itne kam answers? Lagta hai friendship ka crash course chahiye.' },
    6: { title: 'Okayyy... You Know Me A Little 😏', message: 'Not bad girl 👀 Tum mujhe thoda toh jaanti ho.' },
  },
}

export function getResultMessage({ score, totalQuestions, creatorGender }) {
  const percentage = totalQuestions ? (score / totalQuestions) * 100 : 0
  const tone = creatorGender === 'male' ? 'male' : creatorGender === 'female' ? 'female' : 'neutral'
  const band = percentage === 100 ? 'perfect'
    : percentage >= 85 ? 'excellent'
      : percentage >= 70 ? 'good'
        : percentage >= 50 ? 'average'
          : percentage >= 30 ? 'low' : 'veryLow'
  const reactionType = band === 'perfect' ? 'celebration' : band === 'excellent' ? 'excited' : band === 'good' ? 'happy' : band === 'average' ? 'thinking' : 'sad'
  const exact = totalQuestions === 10 ? scoreOverrides[tone]?.[score] : null
  return { ...(exact || resultMessages[tone][band]), emoji: resultMessages[tone][band].emoji, reactionType }
}
