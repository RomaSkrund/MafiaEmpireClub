import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

const inputStyle = { background: '#333', color: '#fff', border: '1px solid #555', padding: '10px', borderRadius: '6px', width: '100%', boxSizing: 'border-box' };

const NewGame = ({ players, tournaments, onGameSaved }) => {
  const [winner, setWinner] = useState('red');
  const [selectedTournamentId, setSelectedTournamentId] = useState('');
  const [participants, setParticipants] = useState(
    Array.from({ length: 10 }, (_, i) => ({
      slot: i + 1, playerId: '', role: 'red', isFirstKill: false, bestMove: 0, extra: 0
    }))
  );

  const saveGame = async () => {
    if (!selectedTournamentId) return alert("Выберите вечер!");
    try {
      const { data, error } = await supabase.from('games').insert([{ winner, tournament_id: selectedTournamentId }]).select();
      if (error) throw error;
      const gId = data[0].id;

      const resData = participants.map(p => ({
        game_id: gId, player_id: p.playerId, role: p.role,
        is_win: (winner === 'red' && (p.role === 'red' || p.role === 'sheriff')) || (winner === 'black' && (p.role === 'mafia' || p.role === 'don')),
        is_first_kill: p.isFirstKill, best_move_points: Number(p.bestMove), extra_points: Number(p.extra)
      }));
      await supabase.from('game_results').insert(resData);
      alert("Игра сохранена!");
      onGameSaved();
    } catch (e) { alert(e.message); }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <select value={selectedTournamentId} onChange={(e) => setSelectedTournamentId(e.target.value)} style={{ ...inputStyle, marginBottom: '20px' }}>
        <option value="">-- Выберите вечер --</option>
        {tournaments.map(t => <option key={t.id} value={t.id}>{t.date} | {t.name}</option>)}
      </select>
      
      <div style={{ display: 'flex', gap: '15px', marginBottom: '25px' }}>
        <button onClick={() => setWinner('red')} style={{ flex: 1, padding: '15px', background: winner === 'red' ? '#d32f2f' : '#444', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold' }}>🔴 МИРНЫЕ</button>
        <button onClick={() => setWinner('black')} style={{ flex: 1, padding: '15px', background: winner === 'black' ? '#000' : '#444', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold' }}>⚫ МАФИЯ</button>
      </div>

      {participants.map((p, i) => (
        <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
          <span style={{width: '20px', color: '#888'}}>{i+1}</span>
          <select value={p.playerId} onChange={(e) => { const n = [...participants]; n[i].playerId = e.target.value; setParticipants(n); }} style={{ ...inputStyle, flex: 1 }}>
            <option value="">Игрок</option>
            {players.map(pl => <option key={pl.id} value={pl.id}>{pl.name}</option>)}
          </select>
          <select value={p.role} onChange={(e) => { const n = [...participants]; n[i].role = e.target.value; setParticipants(n); }} style={{...inputStyle, width: '100px'}}>
            <option value="red">Красный</option><option value="sheriff">Шериф</option><option value="mafia">Мафия</option><option value="don">Дон</option>
          </select>
          <input type="number" step="0.1" placeholder="ЛХ" value={p.bestMove} onChange={(e) => { const n = [...participants]; n[i].bestMove = e.target.value; setParticipants(n); }} style={{ ...inputStyle, width: '60px' }} />
        </div>
      ))}
      <button onClick={saveGame} style={{ width: '100%', padding: '18px', background: '#2d5a27', color: '#fff', border: 'none', borderRadius: '10px', marginTop: '20px', fontWeight: 'bold', cursor: 'pointer' }}>СОХРАНИТЬ РЕЗУЛЬТАТ</button>
    </div>
  );
};

export default NewGame;