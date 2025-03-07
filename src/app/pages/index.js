import { useState, useEffect } from "react";
import { collection, addDoc, Timestamp, query, orderBy, getDocs } from "firebase/firestore";
import { db, auth, signIn, logOut } from "../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

export default function Home() {
  const [user, setUser] = useState(null);
  const [moods, setMoods] = useState([]);

  const moodOptions = [
    { emoji: "😊", label: "Happy" },
    { emoji: "😢", label: "Sad" },
    { emoji: "😡", label: "Angry" },
    { emoji: "😤", label: "Frustrated" },
    { emoji: "😴", label: "Sleepy" },
    { emoji: "😐", label: "Neutral" },
    { emoji: "🥳", label: "Enjoying" },
  ];

  useEffect(() => {
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

  const fetchMoods = async (userId) => {
    const q = query(collection(db, "moods"), orderBy("timestamp", "desc"));
    const querySnapshot = await getDocs(q);
    const moodsData = querySnapshot.docs
      .filter((doc) => doc.data().userId === userId)
      .map((doc) => doc.data());
    setMoods(moodsData);
  };

  const logMood = async (mood) => {
    if (!user) return signIn();
    await addDoc(collection(db, "moods"), {
      mood,
      timestamp: Timestamp.now(),
      userId: user.uid,
    });
    fetchMoods(user.uid);
  };

  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <h1>Mood Tracker</h1>
      {user ? (
        <>
          <p>Welcome, {user.displayName}!</p>
          <button onClick={logOut}>Log Out</button>
          <h3>Select Your Mood:</h3>
          <div style={{ display: "flex", justifyContent: "center", gap: "10px" }}>
            {moodOptions.map((m) => (
              <button key={m.label} onClick={() => logMood(m.label)} style={{ fontSize: "2rem", border: "none", background: "transparent", cursor: "pointer" }}>
                {m.emoji}
              </button>
            ))}
          </div>
          <h3>Your Mood History:</h3>
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
          <p>Please sign in to track your moods.</p>
          <button onClick={signIn}>Sign In with Google</button>
        </>
      )}
    </div>
  );
}
