export const TEDDY_SPRITE = '/assets/teddy/states.svg'
export const STICKER_SPRITE = '/assets/stickers/stickers.svg'

export const teddyMessages = {
  home: 'Ready to find out who really knows you? \u{1F9F8}\u{1F495}',
  questionSelection: 'Pick the questions that feel like YOU! \u{1F9F8}',
  notEnough: 'I need a few more! \u{1F97A}',
  quizReady: 'Yayy! Your quiz is ready! \u{1F389}',
  loading: 'Hold on... teddy is thinking! \u{1F9F8}\u{1F4AD}',
  result: "Let's see how well they know you! \u{1F440}",
  network: "Teddy couldn't connect. Try again? \u{1F9F8}",
  quizMissing: 'This quiz disappeared into the clouds \u2601\uFE0F',
  lost: 'Oops! Teddy got lost \u{1F9F8}',
  submit: "Oops! Your answers didn't reach us.",
}

export const stickerSets = {
  home: [
    { name: 'sparkles', className: 'left-2 top-3 h-10 w-10' },
    { name: 'hearts', className: 'right-4 top-5 h-9 w-9' },
    { name: 'clouds', className: 'bottom-4 left-4 h-12 w-12' },
    { name: 'bows', className: 'bottom-5 right-24 hidden h-9 w-9 sm:block' },
  ],
  cards: [
    { name: 'flowers', className: 'right-2 top-2 h-8 w-8' },
    { name: 'stars', className: 'left-3 bottom-3 h-8 w-8' },
  ],
  picker: [
    { name: 'speech-bubbles', className: 'right-0 top-2 h-11 w-11' },
    { name: 'mini-teddy', className: 'left-1 bottom-0 h-10 w-10' },
  ],
  result: [
    { name: 'sparkles', className: 'left-3 top-4 h-10 w-10' },
    { name: 'stars', className: 'right-3 top-6 h-10 w-10' },
    { name: 'envelopes', className: 'bottom-0 right-8 h-11 w-11' },
  ],
  share: [
    { name: 'envelopes', className: 'left-5 top-5 h-11 w-11' },
    { name: 'hearts', className: 'right-5 top-8 h-9 w-9' },
  ],
  empty: [
    { name: 'clouds', className: 'left-6 top-8 h-12 w-12' },
    { name: 'speech-bubbles', className: 'right-5 bottom-6 h-10 w-10' },
  ],
}
