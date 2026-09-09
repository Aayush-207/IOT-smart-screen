"use client"

import { useState, useEffect } from 'react'

const IMAGES = [
  '/bg-carousel-1.jpg',
  '/bg-carousel-2.jpg',
  '/bg-carousel-3.jpg'
]

export function LoginBackgroundCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % IMAGES.length)
    }, 3000)
    return () => clearInterval(timer)
  }, [])

  return (
    <>
      {IMAGES.map((src, index) => (
        <div
          key={src}
          className={`absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-1000 ease-in-out ${
            index === currentIndex ? 'opacity-60 mix-blend-luminosity' : 'opacity-0'
          }`}
          style={{ backgroundImage: `url(${src})` }}
        />
      ))}
    </>
  )
}
