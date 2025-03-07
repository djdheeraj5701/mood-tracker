"use client";

import { useState, useEffect } from "react";
import { auth, db, signIn, logOut } from "@/lib/firebase";
import { collection, addDoc, Timestamp, query, orderBy, getDocs } from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [moods, setMoods] = useState<{ mood: string; timestamp: Timestamp }[]>([]);
  const [isClient, setIsClient] = useState(false); // Fix hydration issue

  const moodOptions = [
    { emoji: "😊", label: "Happy" },
    { emoji: "😢", label: "Sad" },
    { emoji: "😡", label: "Angry" },
    { emoji: "😤", label: "Frustrated" },
    { emoji: "😴", label: "Sleepy" },
    { emoji: "😐", label: "Neutral" },
    { emoji: "🥳", label: "Enjoying" },
  ];

  // Fix SSR mismatch by ensuring rendering only happens on the client
  useEffect(() => {
    setIsClient(true);

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
        fetchMoods(user.uid);
      } else {
        setUser(null);
        setMoods([]);
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchMoods = async (userId: string) => {
    const q = query(collection(db, "moods"), orderBy("timestamp", "desc"));
    const querySnapshot = await getDocs(q);
    const moodsData = querySnapshot.docs
      .filter((doc) => doc.data().userId === userId)
      .map((doc) => doc.data() as { mood: string; timestamp: Timestamp });
    setMoods(moodsData);
  };

  const logMood = async (mood: string) => {
    if (!user) {
      const signedInUser = await signIn();
      if (!signedInUser) return;
      setUser(signedInUser);
    }

    await addDoc(collection(db, "moods"), {
      mood,
      timestamp: Timestamp.now(),
      userId: user?.uid,
    });
    fetchMoods(user?.uid as string);
  };

  // If the component is not yet ready for client-side rendering, show a loading state
  if (!isClient) return <div className="text-center p-6">Loading...</div>;

  return (
    <div className="flex flex-col items-center p-6 text-center">
      <h1 className="text-3xl font-bold mb-4">Mood Tracker</h1>

      {user ? (
        <>
          <p className="mb-4">Welcome, {user.displayName}!</p>
          <button className="bg-red-500 text-white px-4 py-2 rounded cursor-pointer" onClick={logOut}>
            Log Out
          </button>

          <h3 className="text-xl mt-4">Select Your Mood:</h3>
          <div className="flex gap-4 my-4">
            {moodOptions.map((m) => (
              <button key={m.label} onClick={() => logMood(m.label)} className="text-4xl cursor-pointer">
                {m.emoji}
              </button>
            ))}
          </div>

          <h3 className="text-xl mt-4">Your Mood History:</h3>
          <ul>
            {moods.map((m, index) => (
              <li key={index}>
                {m.mood} - {new Date(m.timestamp.toDate()).toLocaleString()}
              </li>
            ))}
          </ul>
        </>
      ) : (
        <>
          <p className="mb-4">Please sign in to track your moods.</p>
          <button className="bg-blue-500 text-white px-4 py-2 rounded cursor-pointer" onClick={signIn}>
            Sign In with Google
          </button>
        </>
      )}
    </div>
  );
}
