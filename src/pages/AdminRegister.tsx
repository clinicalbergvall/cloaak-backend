import React, { useState } from 'react'
import { authAPI } from '@/lib/api'
import { saveUserSession } from '@/lib/storage'
import toast from 'react-hot-toast'

interface AdminRegisterData {
  name: string
  phone: string
  password: string
}

export default function AdminRegister() {
  const [formData, setFormData] = useState<AdminRegisterData>({
    name: '',
    phone: '',
    password: ''
  })
  const [isLoading, setIsLoading] = useState(false)

  const handleInputChange = (e: any) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e: any) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { name, phone, password } = formData
      const result = await authAPI.register({
        name,
        phone,
        password,
        role: 'admin'
      })

      if (result.success) {
        toast.success('Admin account created successfully!')
        setTimeout(() => {
          window.location.href = '/admin'
        }, 2000)
      }
    } catch (error: any) {
      const errorMsg = error?.response?.data?.message || error?.message || 'Failed to create admin account'
      toast.error(errorMsg)
      console.error('Admin registration error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-yellow-400/40 rounded-2xl p-8 max-w-md w-full shadow-[0_0_35px_rgba(234,179,8,0.25)]">
        <div className="text-center mb-8">
          <h1 className="text-yellow-400 text-3xl font-bold mb-2">Admin Registration</h1>
          <p className="text-slate-300">Create administrator account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-yellow-400 mb-2">
              Full Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              value={formData.name}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
              placeholder="Enter your full name"
            />
          </div>

          

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-yellow-400 mb-2">
              Phone Number
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              pattern="0[17]\d{8}"
              required
              value={formData.phone}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
              placeholder="07XXXXXXXX or 01XXXXXXXX"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-yellow-400 mb-2">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={formData.password}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
              placeholder="Create a strong password"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-bold py-3 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Creating Admin Account...' : 'Create Admin Account'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <a href="/admin" className="text-yellow-400 hover:text-yellow-300 text-sm">
            ← Back to Admin Login
          </a>
        </div>
      </div>
    </div>
  )
}
