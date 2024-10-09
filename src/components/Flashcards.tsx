import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Shuffle, ChevronLeft, ChevronRight, Volume2 } from "lucide-react"
import { phrases } from '@/data/phrases'

type Difficulty = 'easy' | 'good' | 'difficult' | 'repeat'

interface CardWithDifficulty {
  card: typeof phrases[0]
  lastReviewed: number
  nextReview: number
  difficulty: Difficulty | null
}

export default function Flashcards() {
  const [cards, setCards] = useState<CardWithDifficulty[]>(() => 
    phrases.map(phrase => ({
      card: phrase,
      lastReviewed: 0,
      nextReview: 0,
      difficulty: null
    }))
  )
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showMeaning, setShowMeaning] = useState(false)
  const [progress, setProgress] = useState(0)

  const getCurrentCard = useCallback(() => cards[currentIndex], [cards, currentIndex])

  const shuffleCards = useCallback(() => {
    const now = Date.now()
    const shuffled = [...cards]
      .filter(card => card.nextReview <= now)
      .sort(() => Math.random() - 0.5)
    setCards(shuffled)
    setCurrentIndex(0)
    setShowMeaning(false)
    setProgress(0)
  }, [cards])

  const nextCard = useCallback(() => {
    const now = Date.now()
    const nextIndex = cards.findIndex((card, index) => index > currentIndex && card.nextReview <= now)
    if (nextIndex !== -1) {
      setCurrentIndex(nextIndex)
      setProgress((nextIndex / (cards.length - 1)) * 100)
    } else {
      shuffleCards()
    }
    setShowMeaning(false)
  }, [cards, currentIndex, shuffleCards])

  const prevCard = useCallback(() => {
    const now = Date.now()
    for (let i = currentIndex - 1; i >= 0; i--) {
      if (cards[i].nextReview <= now) {
        setCurrentIndex(i)
        setProgress((i / (cards.length - 1)) * 100)
        setShowMeaning(false)
        return
      }
    }
    // If no previous card is found, go to the last available card
    for (let i = cards.length - 1; i > currentIndex; i--) {
      if (cards[i].nextReview <= now) {
        setCurrentIndex(i)
        setProgress((i / (cards.length - 1)) * 100)
        setShowMeaning(false)
        return
      }
    }
  }, [cards, currentIndex])

  const handleDifficulty = useCallback((difficulty: Difficulty) => {
    const now = Date.now()
    setCards(prevCards => {
      const newCards = [...prevCards]
      const currentCard = newCards[currentIndex]
      let interval: number

      switch (difficulty) {
        case 'easy':
          interval = 7 * 24 * 60 * 60 * 1000 // 7 days
          break
        case 'good':
          interval = 3 * 24 * 60 * 60 * 1000 // 3 days
          break
        case 'difficult':
          interval = 24 * 60 * 60 * 1000 // 1 day
          break
        case 'repeat':
          interval = 10 * 60 * 1000 // 10 minutes
          break
      }

      currentCard.lastReviewed = now
      currentCard.nextReview = now + interval
      currentCard.difficulty = difficulty

      return newCards
    })
    nextCard()
  }, [currentIndex, nextCard])

  useEffect(() => {
    shuffleCards()
  }, [])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight') nextCard()
      if (event.key === 'ArrowLeft') prevCard()
      if (event.key === ' ') setShowMeaning(prev => !prev)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [nextCard, prevCard])

  const currentCard = getCurrentCard()

  if (!currentCard) {
    return <div>No cards available for review.</div>
  }

  const cardId = `card-${currentCard.card.id}`
  const meaningId = `meaning-${currentCard.card.id}`

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">"Look" Idiom Flashcards</h1>
        <Progress value={progress} className="mb-8" />
        <Card className="w-full bg-white shadow-lg rounded-xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
            <CardTitle id={`${cardId}-phrase`} className="text-3xl font-bold text-center">{currentCard.card.phrase}</CardTitle>
            <CardDescription id={`${cardId}-translation`} className="text-center text-lg font-medium text-blue-200">
              {currentCard.card.translation}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex justify-center mb-6">
              <img
                src={currentCard.card.image}
                alt={`Illustration for the idiom: ${currentCard.card.phrase}`}
                className="w-full max-w-md rounded-lg shadow-md"
              />
            </div>
            <Button 
              onClick={() => setShowMeaning(!showMeaning)}
              aria-expanded={showMeaning}
              aria-controls={meaningId}
              className="w-full mb-4 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {showMeaning ? 'Hide' : 'Show'} Meaning
            </Button>
            <div id={meaningId} className={`transition-all duration-300 ease-in-out ${showMeaning ? 'opacity-100 max-h-96' : 'opacity-0 max-h-0'} overflow-hidden`}>
              <div className="mb-4">
                <h3 className="font-semibold mb-2 text-gray-700">Meaning:</h3>
                <p className="text-gray-600">{currentCard.card.meaning}</p>
              </div>
              <div className="mb-4">
                <h3 className="font-semibold mb-2 text-gray-700">Examples:</h3>
                <ul className="list-disc pl-5 space-y-2">
                  {currentCard.card.examples.map((example, index) => (
                    <li key={index} className="text-gray-600">
                      <strong className="text-gray-700">{example.topic}:</strong> {example.example}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col items-center bg-gray-50 p-6">
            <div className="flex justify-between w-full mb-4">
              <Button onClick={prevCard} aria-label="Previous card" variant="outline" className="flex items-center">
                <ChevronLeft className="mr-2 h-4 w-4" />
                Previous
              </Button>
              <Button onClick={() => {}} variant="outline" className="flex items-center">
                <Volume2 className="mr-2 h-4 w-4" />
                Listen
              </Button>
              <Button onClick={nextCard} aria-label="Next card" variant="outline" className="flex items-center">
                Next
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
            <div className="flex justify-center space-x-2 w-full">
              <Button onClick={() => handleDifficulty('easy')} variant="outline" className="flex-1 bg-green-100 hover:bg-green-200 text-green-700">Easy</Button>
              <Button onClick={() => handleDifficulty('good')} variant="outline" className="flex-1 bg-blue-100 hover:bg-blue-200 text-blue-700">Good</Button>
              <Button onClick={() => handleDifficulty('difficult')} variant="outline" className="flex-1 bg-yellow-100 hover:bg-yellow-200 text-yellow-700">Hard</Button>
              <Button onClick={() => handleDifficulty('repeat')} variant="outline" className="flex-1 bg-red-100 hover:bg-red-200 text-red-700">Repeat</Button>
            </div>
          </CardFooter>
        </Card>
        <div className="mt-8 flex justify-center">
          <Button onClick={shuffleCards} variant="outline" className="flex items-center bg-white hover:bg-gray-100">
            <Shuffle className="mr-2 h-4 w-4" />
            Shuffle Cards
          </Button>
        </div>
      </div>
    </div>
  )
}