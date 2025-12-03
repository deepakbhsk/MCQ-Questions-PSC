
export interface Quote {
  text: string;
  author: string;
  book: string;
}

export const MOTIVATIONAL_QUOTES: Quote[] = [
  {
    text: "There is no substitute for hard work.",
    author: "Thomas Edison",
    book: "Life of Thomas Edison"
  },
  {
    text: "It is time for us all to stand and cheer for the doer, the achiever - the one who recognizes the challenges and does something about it.",
    author: "Vince Lombardi",
    book: "Run to Win"
  },
  {
    text: "Success is the sum of small efforts, repeated day in and day out.",
    author: "Robert Collier",
    book: "The Secret of the Ages"
  },
  {
    text: "The only place where success comes before work is in the dictionary.",
    author: "Vidal Sassoon",
    book: "Vidal: The Autobiography"
  },
  {
    text: "Whatever you do, do it well.",
    author: "Walt Disney",
    book: "Walt Disney: An American Original"
  },
  {
    text: "Do not wait; the time will never be 'just right'. Start where you stand, and work with whatever tools you may have at your command.",
    author: "Napoleon Hill",
    book: "Think and Grow Rich"
  },
  {
    text: "Genius is one percent inspiration and ninety-nine percent perspiration.",
    author: "Thomas Edison",
    book: "Life of Thomas Edison"
  },
  {
    text: "I am a great believer in luck, and I find the harder I work, the more I have of it.",
    author: "Thomas Jefferson",
    book: "Letters of Thomas Jefferson"
  },
  {
    text: "Determine never to be idle. No person will have occasion to complain of the want of time who never loses any.",
    author: "Thomas Jefferson",
    book: "Letters to his Daughter"
  },
  {
    text: "It’s not what we do once in a while that shapes our lives. It’s what we do consistently.",
    author: "Anthony Robbins",
    book: "Awaken the Giant Within"
  },
  {
    text: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.",
    author: "Will Durant",
    book: "The Story of Philosophy"
  },
  {
    text: "He who would learn to fly one day must first learn to stand and walk and run and climb and dance; one cannot fly into flying.",
    author: "Friedrich Nietzsche",
    book: "Thus Spoke Zarathustra"
  },
  {
    text: "To strive, to seek, to find, and not to yield.",
    author: "Alfred, Lord Tennyson",
    book: "Ulysses"
  },
  {
    text: "The man who moves a mountain begins by carrying away small stones.",
    author: "Confucius",
    book: "The Analects"
  },
  {
    text: "If you can dream it, you can do it.",
    author: "Walt Disney",
    book: "Walt Disney: An American Original"
  },
  {
    text: "Action is the foundational key to all success.",
    author: "Pablo Picasso",
    book: "Picasso on Art"
  }
];

export const getRandomQuote = (): Quote => {
  const randomIndex = Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length);
  return MOTIVATIONAL_QUOTES[randomIndex];
};
