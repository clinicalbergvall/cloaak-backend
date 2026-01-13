import React, { useState } from 'react'
import AppEnhanced from './AppEnhanced';
import { Button, Card } from '@/components/ui'
import { LoginForm } from '@/components/ui'
import { loadUserSession } from '@/lib/storage'

export default function LandingPage() {
  const [userType, setUserType] = useState<'client' | 'cleaner' | null>(null)
  const [showLogin, setShowLogin] = useState(false)

  const session = loadUserSession()

  
  if (session) {
    if (session.userType === 'admin') {
      window.location.href = '/admin'
      return null
    }
    
    return <AppEnhanced />
  }

  if (showLogin) {
    return <LoginForm onAuthSuccess={() => window.location.reload()} />
  }

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: 'url(/assets/images/CLOAKED.jpeg)' }}
    >
      <div className="container max-w-4xl mx-auto px-4 py-12">
        {}
        <header className="text-center mb-12">
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-2 bg-yellow-100 text-sm font-semibold text-black border border-yellow-300 mb-6">
            <span className="animate-pulse"></span>
            <span>Professional Cleaning Services</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-bold font-bricolage text-gray-900 mb-4">
            CleanCloak
          </h1>

          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto font-inter">
            Connecting you with professional cleaners for your car and home.
            Quality service, verified professionals, seamless experience.
          </p>
        </header>

        {}
        <main className="mb-12">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-semibold font-bricolage text-gray-800 mb-2">
              How would you like to use CleanCloak?
            </h2>
            <p className="text-gray-600 font-inter">
              Choose your role to get started
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {}
            <Card className="p-8 text-center hover:shadow-xl transition-shadow cursor-pointer border-2 border-transparent hover:border-blue-200"
              onClick={() => {
                setUserType('client')
                setShowLogin(true)
              }}>
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🏠</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                I'm a Client
              </h3>
              <p className="text-gray-600 mb-6">
                Book professional cleaning services for your car and home.
                Track orders, chat with cleaners, and manage bookings.
              </p>
              <div className="space-y-2 text-sm text-gray-500">
                <div className="flex items-center justify-center gap-2">
                  <span>✓</span>
                  <span>Book professional car detailing</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <span>✓</span>
                  <span>Real-time order tracking</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <span>✓</span>
                  <span>Verified professional cleaners</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <span>✓</span>
                  <span>Secure payments</span>
                </div>
              </div>
              <Button className="w-full mt-6" variant="primary">
                Get Started as Client
              </Button>
            </Card>

            {/* Cleaner Card */}
            <Card className="p-8 text-center hover:shadow-xl transition-shadow cursor-pointer border-2 border-transparent hover:border-green-200"
              onClick={() => {
                setUserType('cleaner')
                setShowLogin(true)
              }}>
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🧹</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                I'm a Cleaner
              </h3>
              <p className="text-gray-600 mb-6">
                Join our network of professional cleaners.
                Find jobs, manage your profile, and grow your business.
              </p>
              <div className="space-y-2 text-sm text-gray-500">
                <div className="flex items-center justify-center gap-2">
                  <span>✓</span>
                  <span>Find cleaning jobs near you</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <span>✓</span>
                  <span>Flexible work schedule</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <span>✓</span>
                  <span>Build your professional profile</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <span>✓</span>
                  <span>Get paid securely</span>
                </div>
              </div>
              <Button className="w-full mt-6" variant="primary">
                Join as Cleaner
              </Button>
            </Card>
          </div>
        </main>

        {}
        <section className="text-center">
          <h2 className="text-2xl font-semibold text-gray-800 mb-8">
            Why Choose CleanCloak?
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">⭐</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Verified Professionals</h3>
              <p className="text-gray-600 text-sm">All cleaners are background-checked and verified</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🚀</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Real-time Tracking</h3>
              <p className="text-gray-600 text-sm">Track your service in real-time</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">💬</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Direct Chat</h3>
              <p className="text-gray-600 text-sm">Communicate directly with your cleaner</p>
            </div>
          </div>
        </section>

        {}
        <footer className="mt-16 pt-8 border-t border-gray-200 text-center text-gray-500">
          <p>© 2025 CleanCloak. Professional cleaning services made simple.</p>
        </footer>
      </div>
    </div>
  )
}