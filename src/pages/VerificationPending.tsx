import React from 'react';
import { Card, Button } from '@/components/ui';
import { clearUserSession } from '@/lib/storage';

export default function VerificationPending() {
  const handleSignOut = () => {
    clearUserSession();
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Premium Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-yellow-500/10 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-yellow-600/10 rounded-full blur-[120px] animate-pulse delay-700" />
      
      <div className="max-w-md w-full relative z-10">
        <Card className="p-8 border-yellow-400/30 bg-slate-900/80 backdrop-blur-xl shadow-[0_0_50px_rgba(234,179,8,0.1)] text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(234,179,8,0.3)] transform -rotate-3 overflow-hidden border border-white/20">
            <img src="/detail-logo.jpg" className="w-full h-full object-cover" alt="Detail Logo" />
          </div>
          
          <h1 className="text-3xl font-black text-white mb-4 tracking-tight">
            Verification <span className="text-yellow-400">Pending</span>
          </h1>
          
          <div className="space-y-4 mb-8">
            <p className="text-slate-300 leading-relaxed font-inter">
              Welcome to the <span className="text-white font-semibold">CleanCloak Family</span>! 
              Our elite team is currently reviewing your profile to ensure the highest standards 
              for our premium car detailing services.
            </p>
            
            <div className="p-4 bg-yellow-400/5 rounded-xl border border-yellow-400/10 text-sm text-yellow-200/80">
              <p>This usually takes <span className="text-yellow-400 font-bold">24-48 hours</span>. You will be notified once your specialized access is granted.</p>
            </div>
          </div>

          <div className="space-y-3">
            <Button 
              variant="outline" 
              className="w-full border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
              onClick={() => window.location.reload()}
            >
              Refresh Status
            </Button>
            
            <button 
              onClick={handleSignOut}
              className="text-slate-500 hover:text-slate-400 text-sm transition-colors mt-4"
            >
              Sign out and return home
            </button>
          </div>
          
          <div className="mt-8 pt-6 border-t border-slate-800">
            <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">Priority Support</p>
            <p className="text-sm text-slate-400 mt-2">support@cleancloak.co</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
