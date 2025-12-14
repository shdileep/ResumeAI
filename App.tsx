import React, { useState } from 'react';
import { Home, FileText, Settings, Wand2, LogOut, Layout, Briefcase, Fingerprint } from 'lucide-react';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import ResumeBuilder from './components/ResumeBuilder';
import Enhancer from './components/Enhancer';
import ATSChecker from './components/ATSChecker';
import InterviewAI from './components/InterviewAI';
import ZeroAI from './components/ZeroAI';
import ChatBot from './components/ChatBot';
import { AppView } from './types';

import { auth, onAuthStateChanged } from './services/firebase';

const App: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<AppView>('dashboard');

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u: any) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  if (!user) {
    return <Auth onLogin={() => { }} />;
  }

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard': return <Dashboard onChangeView={setCurrentView} />;
      case 'builder': return <ResumeBuilder />;
      case 'enhance': return <Enhancer />;
      case 'settings': return <ATSChecker />;
      case 'interview': return <InterviewAI />;
      case 'zeroai': return <ZeroAI />;
      default: return <Dashboard onChangeView={setCurrentView} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar Navigation */}
      <aside className="w-20 md:w-64 bg-white border-r border-slate-200 fixed h-full z-10 hidden md:flex flex-col justify-between">
        <div>
          <div className="p-6 flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">R</div>
            <span className="text-xl font-bold text-slate-800 hidden md:inline">ResumeAI</span>
          </div>
          <nav className="mt-6 px-4 space-y-2">
            <NavItem icon={<Home />} label="Home" active={currentView === 'dashboard'} onClick={() => setCurrentView('dashboard')} />
            <NavItem icon={<FileText />} label="Resume" active={currentView === 'builder'} onClick={() => setCurrentView('builder')} />
            <NavItem icon={<Wand2 />} label="Enhance" active={currentView === 'enhance'} onClick={() => setCurrentView('enhance')} />
            <NavItem icon={<Briefcase />} label="InterviewAI" active={currentView === 'interview'} onClick={() => setCurrentView('interview')} />
            <NavItem icon={<Fingerprint />} label="ZeroAI" active={currentView === 'zeroai'} onClick={() => setCurrentView('zeroai')} />
            <NavItem icon={<Settings />} label="ATS Score" active={currentView === 'settings'} onClick={() => setCurrentView('settings')} />
          </nav>
        </div>
        <div className="p-4 border-t border-slate-100">
          <button
            onClick={async () => {
              const { logout } = await import('./services/firebase');
              await logout();
            }}
            className="flex items-center gap-3 text-slate-500 hover:text-red-600 transition w-full px-4 py-3 rounded-lg hover:bg-red-50"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium hidden md:inline">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 md:ml-64 transition-all duration-300 relative">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-20 shadow-sm no-print">
          <div className="md:hidden font-bold text-xl text-blue-600">ResumeAI</div>
          <div className="flex items-center gap-4 ml-auto">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-bold text-slate-700">Demo User</div>
              <div className="text-xs text-slate-500">Premium Plan</div>
            </div>
            <div className="w-10 h-10 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold shadow-md">
              D
            </div>
          </div>
        </header>

        {/* Dynamic Content */}
        <div className="min-h-[calc(100vh-64px)] pb-20 md:pb-0">
          {renderContent()}
        </div>

        {/* Floating Chat Bot */}
        <ChatBot />
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 w-full bg-white border-t border-slate-200 flex justify-around p-3 z-30 no-print">
        <MobileNavItem icon={<Home />} active={currentView === 'dashboard'} onClick={() => setCurrentView('dashboard')} />
        <MobileNavItem icon={<FileText />} active={currentView === 'builder'} onClick={() => setCurrentView('builder')} />
        <MobileNavItem icon={<Wand2 />} active={currentView === 'enhance'} onClick={() => setCurrentView('enhance')} />
        <MobileNavItem icon={<Briefcase />} active={currentView === 'interview'} onClick={() => setCurrentView('interview')} />
        <MobileNavItem icon={<Fingerprint />} active={currentView === 'zeroai'} onClick={() => setCurrentView('zeroai')} />
      </nav>
    </div>
  );
};

const NavItem: React.FC<{ icon: React.ReactNode; label: string; active: boolean; onClick: () => void }> = ({ icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition font-medium ${active ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
      }`}
  >
    <span className="w-5 h-5">{icon}</span>
    <span className="hidden md:inline">{label}</span>
  </button>
);

const MobileNavItem: React.FC<{ icon: React.ReactNode; active: boolean; onClick: () => void }> = ({ icon, active, onClick }) => (
  <button
    onClick={onClick}
    className={`p-3 rounded-full transition ${active ? 'bg-blue-100 text-blue-600' : 'text-slate-500'}`}
  >
    {icon}
  </button>
);

export default App;
