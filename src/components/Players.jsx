import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

const inputStyle = { background: '#333', color: '#fff', border: '1px solid #555', padding: '10px', borderRadius: '6px', width: '100%', boxSizing: 'border-box' };

const Players = ({ players, onUpdate }) => {
  const [name, setName] = useState('');

  const addPlayer = async () => {
    if(!name) return;
    await supabase.from('players').insert([{ name }]);
    setName('');
    onUpdate();
  };

  return (
    <div style={{ maxWidth: '500px', margin: '0 auto' }}>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <input type="text" placeholder="Никнейм игрока" value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} />
        <button onClick={addPlayer} style={{ background: '#2d5a27', color: '#fff', border: 'none', padding: '0 20px', borderRadius: '6px', cursor: 'pointer' }}>➕</button>
      </div>
      {players.map(p => (
        <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', borderBottom: '1px solid #333' }}>
          <span>{p.name}</span>
          <button onClick={async () => { if(confirm("Удалить?")) { await supabase.from('players').delete().eq('id', p.id); onUpdate(); } }} style={{ color: '#ff4d4d', background: 'none', border: 'none', cursor: 'pointer' }}>Удалить</button>
        </div>
      ))}
    </div>
  );
};

export default Players;