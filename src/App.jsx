import React, { useState, useEffect } from 'react';
import { Mail, X, Send, User, Bell, Check, Users, Database, Shield } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithCustomToken, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, onSnapshot, query, serverTimestamp, doc, setDoc } from 'firebase/firestore';

// --- Firebase Configuration ---
const firebaseConfig = {
  apiKey: "AIzaSyBfscanI5Kz14vo31wvtVI0odMJDI9E060",
  authDomain: "grad-invite.firebaseapp.com",
  projectId: "grad-invite",
  storageBucket: "grad-invite.firebasestorage.app",
  messagingSenderId: "629821105536",
  appId: "1:629821105536:web:d26aa6988cfae446f58d65",
  measurementId: "G-5WW60M4C9F"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = firebaseConfig.appId || 'default-app-id';

const App = () => {
  const [popups, setPopups] = useState([]);
  const [showMain, setShowMain] = useState(false); 
  const [notification, setNotification] = useState(null);
  const [user, setUser] = useState(null);
  const [guests, setGuests] = useState([]);
  const [isRsvpModalOpen, setIsRsvpModalOpen] = useState(false);
  const [rsvpName, setRsvpName] = useState('');
  const [showAdmin, setShowAdmin] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const excitingMessages = [
    "HAVE YOU HEARD?!", "Finally finished! 🎓", "Code complete!", 
    "Zero bugs found!", "Class of 2026! 🥂", "It's party time!", 
    "System Update: GRADUATED!", "Error 404: Homework Not Found"
  ];

  // (1) Handle Authentication
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.error("Auth error:", err);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  // (2) Listen for Guests
  useEffect(() => {
    if (!user) return;

    const guestsRef = collection(db, 'artifacts', appId, 'public', 'data', 'guests');
    const unsubscribe = onSnapshot(guestsRef, (snapshot) => {
      const guestList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      guestList.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
      setGuests(guestList);
    }, (error) => {
      console.error("Firestore error:", error);
    });

    return () => unsubscribe();
  }, [user]);

  // (3) Random Popups Logic
  useEffect(() => {
    const interval = setInterval(() => {
      if (popups.length < 5) {
        const newMessage = excitingMessages[Math.floor(Math.random() * excitingMessages.length)];
        const id = Date.now();
        setPopups(prev => [...prev, {
          id, text: newMessage,
          top: Math.random() * 60 + 10 + "%",
          right: Math.random() * 10 + 2 + "%",
        }]);
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [popups]);

  const removePopup = (id) => setPopups(prev => prev.filter(p => p.id !== id));

  const showSystemMessage = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleRsvpSubmit = async (e) => {
    e.preventDefault();
    if (!rsvpName.trim() || !user) return;

    setIsSubmitting(true);
    try {
      const guestsRef = collection(db, 'artifacts', appId, 'public', 'data', 'guests');
      await addDoc(guestsRef, {
        name: rsvpName,
        timestamp: serverTimestamp(),
        userId: user.uid
      });
      showSystemMessage(`Excited to see you!, ${rsvpName}!`);
      setIsRsvpModalOpen(false);
      setRsvpName('');
    } catch (err) {
      showSystemMessage("Error saving RSVP. Pls message Zahra!");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFAFC] font-serif p-4 md:p-10 relative overflow-hidden flex items-center justify-center">
      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#ff8fa3 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

      {/* Top Bar */}
      <div className="absolute top-0 left-0 w-full bg-[#ffb3c1] border-b-2 border-[#ff8fa3] px-4 py-1 flex justify-between items-center text-xs font-mono text-[#7a4b54] z-50">
        <div className="flex items-center gap-4 cursor-help" onClick={() => setShowAdmin(!showAdmin)}>
          <span className="animate-pulse">● {user ? 'SYSTEM: ONLINE' : 'SYSTEM: CONNECTING...'}</span>
        </div>
        <div className="flex items-center gap-2">
          <Bell size={12} />
          <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>

      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-12 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top">
          <div className="bg-white border-2 border-[#ff4d6d] p-3 shadow-[4px_4px_0px_#ffb3c1] flex items-center gap-3">
            <Check size={16} className="text-[#ff4d6d]" />
            <span className="font-mono text-sm font-bold text-[#ff4d6d]">{notification}</span>
          </div>
        </div>
      )}

      {/* Admin / Guest List Window */}
      {showAdmin && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
          <div className="bg-white border-4 border-[#ff4d6d] w-full max-w-md shadow-[10px_10px_0px_#000]">
            <div className="bg-[#ff4d6d] text-white p-2 flex justify-between items-center">
              <div className="flex items-center gap-2 font-bold text-sm">
                <Shield size={14} /> <span>ADMIN_GUEST_LIST.exe</span>
              </div>
              <button onClick={() => setShowAdmin(false)}><X size={18} /></button>
            </div>
            <div className="p-4 max-h-[400px] overflow-y-auto font-mono text-sm">
              <div className="mb-4 text-xs text-gray-500 uppercase tracking-widest border-b pb-1">
                Total Connections: {guests.length}
              </div>
              {guests.length === 0 ? (
                <p className="text-gray-400 italic">No guests detected in system yet...</p>
              ) : (
                <ul className="space-y-2">
                  {guests.map((g) => (
                    <li key={g.id} className="flex justify-between border-b border-pink-100 pb-1">
                      <span className="font-bold text-[#ff4d6d]">{g.name}</span>
                      <span className="text-[10px] text-gray-400">
                        {g.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {/* RSVP Name Modal */}
      {isRsvpModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40">
          <div className="bg-[#fff0f3] border-2 border-[#ff4d6d] w-full max-w-sm shadow-[8px_8px_0px_#ff4d6d] animate-in zoom-in">
            <div className="bg-[#ff4d6d] text-white p-2 flex justify-between items-center">
              <span className="text-xs font-bold">IDENTITY_VERIFICATION</span>
              <button onClick={() => setIsRsvpModalOpen(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleRsvpSubmit} className="p-6 space-y-4">
              <label className="block">
                <span className="text-xs font-mono font-bold text-[#ff4d6d] uppercase">Enter Your Name:</span>
                <input 
                  required
                  autoFocus
                  value={rsvpName}
                  onChange={(e) => setRsvpName(e.target.value)}
                  className="mt-2 w-full p-3 border-2 border-[#ffccd5] focus:border-[#ff4d6d] outline-none font-mono text-sm"
                  placeholder="Guest_Name_01"
                />
              </label>
              <button 
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#ff4d6d] text-white p-3 font-bold shadow-[4px_4px_0px_#800f2f] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all"
              >
                {isSubmitting ? 'UPLOADING...' : 'CONFIRM_RSVP'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Main Invitation Window */}
      {showMain && (
        <div className="relative w-full max-w-2xl bg-[#fff0f3] border-2 border-white shadow-[12px_12px_0px_rgba(255,179,193,0.5)] z-10 animate-in fade-in zoom-in">
          <div className="bg-gradient-to-r from-[#ff8fa3] to-[#ffb3c1] p-2 flex justify-between items-center border-b-2 border-white">
            <div className="flex items-center gap-2 text-white font-bold text-sm tracking-tight">
              <Mail size={16} /> <span>Microsoft Outlook (Graduation Edition)</span>
            </div>
            <div className="flex gap-1">
              <button onClick={() => setShowMain(false)} className="bg-[#fff0f3] border border-[#ff8fa3] w-5 h-5 flex items-center justify-center text-[#ff8fa3] hover:bg-white"><X size={12} /></button>
            </div>
          </div>

          <div className="p-4 border-b border-[#ffccd5] bg-white text-sm">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2"><span className="text-[#ff8fa3] font-bold w-12 uppercase text-[10px] font-mono">From:</span><span className="bg-[#fff0f3] px-2 py-0.5 rounded border border-[#ffccd5] text-[11px]"><User size={12} className="inline mr-1 text-[#ff8fa3]" /> zahra.rahman@warwick.ac.uk</span></div>
              <div className="flex items-center gap-2"><span className="text-[#ff8fa3] font-bold w-12 uppercase text-[10px] font-mono">Subject:</span><span className="italic font-bold text-[#ff758f]">I finally finished my degree! Let's Celebrate! 🎓✨</span></div>
            </div>
          </div>

          <div className="p-6 md:p-10 space-y-6">
            <div className="font-mono text-[10px] text-[#ffb3c1] uppercase tracking-widest">// Initialization of party sequence...</div>
            <h1 className="text-3xl md:text-5xl font-black text-[#ff4d6d] leading-tight tracking-tighter text-center sm:text-left">Hello World!<br/>I'm Graduating!</h1>
            <div className="space-y-4 text-[#7a4b54]">
              <p className="text-lg">Please join me to celebrate at my house with afternoon tea, manys sweet treats and lots of fun</p>
              <div className="bg-white p-6 border-2 border-dashed border-[#ffb3c1] space-y-4 shadow-inner">
                <div className="grid grid-cols-2 md:grid-cols-2 gap-6">
                  <div><span className="block text-[10px] font-mono text-[#ffb3c1] uppercase">Date</span><p className="font-bold text-xl">Saturday Jan 31st @ 2:30 PM</p></div>
                  <div><span className="block text-[10px] font-mono text-[#ffb3c1] uppercase">Address</span><p className="font-bold text-lg underline decoration-[#ffccd5]">2 The Alders N21 1AR</p></div>
                  <div><span className="block text-[10px] font-mono text-[#ffb3c1] uppercase">Dress</span><p className="font-bold text-lg underline decoration-[#ffccd5]">Formal/smart pls!</p></div>
                  <div><span className="block text-[10px] font-mono text-[#ffb3c1] uppercase">Confirmation</span><p className="font-bold text-lg underline decoration-[#ffccd5]">Press the button below to confirm</p></div>
                </div>
              </div>
            </div>

            <div className="flex justify-center pt-4">
              <button 
                onClick={() => setIsRsvpModalOpen(true)}
                className="w-full sm:w-auto bg-[#ff4d6d] text-white px-12 py-4 font-bold flex items-center justify-center gap-2 shadow-[4px_4px_0px_#800f2f] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_#800f2f] transition-all"
              >
                <Users size={18} /> RSVP.confirm()
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Side Popups */}
      {popups.map((popup) => (
        <div key={popup.id} className="fixed bg-[#fff0f3] border-2 border-[#ff8fa3] shadow-lg p-3 w-40 z-40 animate-in slide-in-from-right" style={{ top: popup.top, right: popup.right }}>
          <div className="flex justify-between items-center mb-1 border-b border-[#ffccd5] pb-1">
            <span className="text-[10px] font-bold text-[#ff8fa3]">SMS</span>
            <button onClick={() => removePopup(popup.id)} className="hover:text-red-500"><X size={10} /></button>
          </div>
          <p className="text-[11px] font-bold text-[#ff758f]">{popup.text}</p>
        </div>
      ))}

      {/* Centered Email Button (Landing) */}
      {!showMain && (
        <div className="flex flex-col items-center justify-center gap-4 z-50 animate-in fade-in zoom-in duration-500">
          {/* Custom Speech Bubble */}
          <div className="animate-bounce bg-white border-2 border-[#ff8fa3] p-3 shadow-[6px_6px_0px_#ffccd5] relative">
            <span className="text-xs font-mono font-bold text-[#ff758f] whitespace-nowrap px-2">
              you have one new email!
            </span>
            {/* Bubble Tail */}
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-r-2 border-b-2 border-[#ff8fa3] rotate-45" />
          </div>
          
          <button 
            onClick={() => setShowMain(true)} 
            className="bg-[#ffb3c1] p-8 rounded-full shadow-[8px_8px_0px_#ff8fa3] border-4 border-white hover:scale-110 active:scale-95 transition-all group relative"
          >
            <Mail className="text-[#800f2f] group-hover:scale-110 transition-transform" size={48} />
            <div className="absolute top-0 right-0 bg-red-500 w-6 h-6 rounded-full border-2 border-white text-[10px] flex items-center justify-center text-white font-bold animate-pulse">
              1
            </div>
          </button>
        </div>
      )}

      <footer className="fixed bottom-4 left-4 text-[10px] text-[#ffb3c1] font-mono bg-white/50 px-2 py-1 rounded">
        &gt; BUILD_STATUS: SUCCESS | DB_LINKED: {guests.length} GUESTS
      </footer>
    </div>
  );
};

export default App;