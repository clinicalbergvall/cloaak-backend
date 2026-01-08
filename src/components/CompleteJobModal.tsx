import { useState } from 'react'

interface CompleteJobModalProps {
    booking: {
        id: string
        serviceCategory: string
        price: number
    }
    onConfirm: () => Promise<void>
    onCancel: () => void
}

export function CompleteJobModal({ booking, onConfirm, onCancel }: CompleteJobModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleSubmit = async () => {
        setIsSubmitting(true)
        try {
            await onConfirm()
        } finally {
            setIsSubmitting(false)
        }
    }

    const cleanerPayout = Math.round(booking.price * 0.6)

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-md w-full">
                {}
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            ✅
                            Complete Job?
                        </h2>
                        <button
                            onClick={onCancel}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xl"
                        >
                            ✕
                        </button>
                    </div>
                </div>

                {}
                <div className="p-6 space-y-4">
                    {}
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        <h3 className="font-semibold text-gray-900 dark:text-white capitalize mb-2">
                            {booking.serviceCategory?.replace('-', ' ')}
                        </h3>
                        <div className="text-center">
                            <p className="text-gray-500 dark:text-gray-400">Your Earnings</p>
                            <p className="text-2xl font-bold text-green-600 dark:text-green-500">
                                KSh {cleanerPayout.toLocaleString()}
                            </p>
                        </div>
                    </div>

                    {}
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                        <p className="text-sm text-blue-800 dark:text-blue-300">
                            ℹ️ Client will be notified to review and pay within 2 hours. Your payout will be sent automatically after payment.
                        </p>
                    </div>


                </div>

                {}
                <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex gap-3">
                    <button
                        onClick={onCancel}
                        disabled={isSubmitting}
                        className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 
                     dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-semibold 
                     rounded-lg transition duration-200 disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="flex-1 px-4 py-3 bg-green-500 hover:bg-green-600 text-white font-semibold 
                     rounded-lg transition duration-200 shadow-md hover:shadow-lg
                     disabled:opacity-50 disabled:cursor-not-allowed
                     flex items-center justify-center gap-2"
                    >
                        {isSubmitting ? (
                            <>
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                Completing...
                            </>
                        ) : (
                            <>
                                ✅ Mark Complete
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}
