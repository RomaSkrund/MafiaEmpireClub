import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import Rating from './components/Rating';
import NewGame from './components/NewGame';
import Players from './components/Players';
import History from './components/History';

export default function App() {
  const [activeTab, setActiveTab] = useState('rating');
  const [players, setPlayers] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [gameHistory, setGameHistory] = useState([]);

  const loadAll = async () => {
    const { data: p } = await supabase.from('players').select('*, game_results(*)').order('name');
    const { data: t } = await supabase.from('tournaments').select('*').order('date', { ascending: false });
    const { data: g } = await supabase.from('games').select('*, game_results(*, players(name))').order('created_at', { ascending: false });
    setPlayers(p || []);
    setTournaments(t || []);
    setGameHistory(g || []);
  };

  useEffect(() => { loadAll(); }, []);

  const tabStyle = (id) => ({
    padding: '12px 20px', 
    border: 'none', 
    borderRadius: '8px', 
    cursor: 'pointer',
    background: activeTab === id ? '#2d5a27' : 'transparent', 
    color: activeTab === id ? '#fff' : '#888',
    fontWeight: 'bold',
    transition: '0.3s'
  });

  return (
    <div style={{ 
      background: '#121212', 
      color: '#eee', 
      minHeight: '100vh', 
      width: '100%', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      padding: '40px 10px', /* Уменьшили боковые отступы */
      boxSizing: 'border-box' 
    }}>
      <h1 style={{ 
        color: '#ffd700', 
        fontSize: 'clamp(2rem, 5vw, 3rem)', 
        marginBottom: '30px', 
        textAlign: 'center'
      }}>
        ИМПЕРИЯ МАФ-КЛУБ
      </h1>
      
      <nav style={{ 
        background: '#222', 
        padding: '10px', 
        borderRadius: '12px', 
        display: 'flex', 
        gap: '10px', 
        marginBottom: '40px',
        flexWrap: 'wrap',
        justifyContent: 'center'
      }}>
        <button onClick={() => setActiveTab('rating')} style={tabStyle('rating')}>🏆 РЕЙТИНГ</button>
        <button onClick={() => setActiveTab('new-game')} style={tabStyle('new-game')}>📝 ИГРА</button>
        <button onClick={() => setActiveTab('players')} style={tabStyle('players')}>👥 ИГРОКИ</button>
        <button onClick={() => setActiveTab('history')} style={tabStyle('history')}>📜 ИСТОРИЯ</button>
      </nav>

      <div style={{ 
        background: '#1a1a1a', 
        borderRadius: '20px', 
        padding: '20px', /* Уменьшили внутренний отступ для таблицы */
        width: '100%', 
        maxWidth: '1400px', /* Увеличили ширину */
        boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
        boxSizing: 'border-box'
      }}>
        {activeTab === 'rating' && <Rating players={players} tournaments={tournaments} gameHistory={gameHistory} />}
        {activeTab === 'new-game' && <NewGame players={players} tournaments={tournaments} onGameSaved={loadAll} />}
        {activeTab === 'players' && <Players players={players} onUpdate={loadAll} />}
        {activeTab === 'history' && <History tournaments={tournaments} gameHistory={gameHistory} />}
      </div>
    </div>
  );
}
