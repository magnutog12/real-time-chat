import React, { useRef, useState} from 'react';
import './App.css';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import 'firebase/compat/auth';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useCollectionData } from 'react-firebase-hooks/firestore';

// check if Firebase is already initialized
if (!firebase.apps.length) {
  firebase.initializeApp({
    apiKey: "AIzaSyA8CJI2iBYXo90Y5XkvV3031eGw8FQQoDA",
    authDomain: "react-chat-poke.firebaseapp.com",
    projectId: "react-chat-poke",
    storageBucket: "react-chat-poke.firebasestorage.app",
    messagingSenderId: "791693170883",
    appId: "1:791693170883:web:516e7867a40742f14e2a76",
    measurementId: "G-YZT706NP7M"
  });
}

const auth = firebase.auth();
const firestore = firebase.firestore();

function App() {
  const [user, loading, error] = useAuthState(auth);

  if (loading) {
    return <div>Loading...</div>;
  }
  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <div className="App">
      <header>
        <SignOut />
      </header>
      <section>
        {user ? <ChatRoom /> : <SignIn />}
      </section>
    </div>
  );
}

function SignIn() {
  const signInWithGoogle = async () => {
    try {
      const provider = new firebase.auth.GoogleAuthProvider();
      await auth.signInWithPopup(provider);
    } catch (error) {
      console.error('Sign in error:', error);
    }
  }
  return (
    <button className="sign-in" onClick={signInWithGoogle}>Sign in with Google</button>
  )
}

function SignOut() {
  return auth.currentUser && (
    <button className="sign-out" onClick={() => auth.signOut()}>Sign Out</button>
  )
}

function ChatRoom() {
  const dummy = useRef();
  const messagesRef = firestore.collection('messages');
  const query = messagesRef.orderBy('createdAt');
  const [messages, loading, error] = useCollectionData(query, { idField: 'id' });
  const [formValue, setFormValue] = useState('');
  const [recipient, setRecipient] = useState(null);
  const [showDM, setShowDM] = useState(false); 

  if (loading) return <div>Loading messages...</div>;
  if (error) return <div>Error loading messages: {error.message}</div>;

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!formValue.trim()) return;

    try {
      const { uid, photoURL } = auth.currentUser;
      await messagesRef.add({
        text: formValue,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        uid,
        photoURL
      });

      if(showDM && recipient) {
        messageData.to = recipient.uid;
        messageData.from = uid;
      }

      setFormValue('');
      dummy.current?.scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }

  return (
    <>
      <main>
        {messages && messages.map(msg => <ChatMessage key={msg.id} message={msg} />)}
        <span ref={dummy}></span>
      </main>
      <form onSubmit={sendMessage}>
        <input 
          value={formValue} 
          onChange={(e) => setFormValue(e.target.value)} 
          placeholder="say something nice" 
        />
        <button type="submit" disabled={!formValue.trim()}>send</button>
      </form>
    </>
  )
}

function ChatMessage(props) {
  const { text, uid, photoURL } = props.message;
  
  // add null check for auth.currentUser
  const messageClass = auth.currentUser 
    ? uid === auth.currentUser.uid ? 'sent' : 'received'
    : 'received';

  return (
    <div className={`message ${messageClass}`}>
      {photoURL && <img src={photoURL} alt="user avatar" />}
      <p>{text}</p>
    </div>
  )
}

export default App;