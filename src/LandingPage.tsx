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
    
    // Redirect logged in cleaners to the jobs board
    window.location.href = '/jobs'
    return null
  }

  if (showLogin) {
    return <LoginForm onAuthSuccess={() => window.location.reload()} />
  }

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat flex items-center justify-center p-4"
      style={{ backgroundImage: 'url(/assets/images/CLOAKED.jpeg)' }}
    >
      <div className="max-w-xl w-full">
        {/* Cleaner Card */}
        <Card className="p-8 text-center hover:shadow-xl transition-shadow cursor-pointer border-2 border-yellow-400 bg-yellow-50 hover:border-yellow-500 shadow-sm"
          onClick={() => {
            setUserType('cleaner')
            setShowLogin(true)
          }}>
          <div className="w-20 h-20 bg-gradient-to-br from-yellow-500 to-yellow-700 rounded-full flex items-center justify-center mx-auto mb-4 text-white overflow-hidden shadow-lg">
            <img src="/detail-logo.jpg" className="w-full h-full object-cover" alt="Detail Logo" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">
            Join the Clean Cloak Family and Offer Premium Detailing Services
          </h3>
          <p className="text-gray-600 mb-6">
            Offer Premium Detailing Services and grow your business. Find cleaning jobs near you and get paid securely.
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
    </div>
  )
}