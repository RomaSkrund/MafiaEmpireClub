import React from 'react';

const tdStyle = { 
  border: '1px solid #7a8a5c', 
  padding: '6px 2px', /* Еще немного уменьшили падинги в ячейках */
  textAlign: 'center', 
  whiteSpace: 'nowrap' 
};

const Rating = ({ players }) => {
  const calculateStats = (p) => {
    const results = p.game_results || [];
    const s = { g_don: 0, w_don: 0, g_maf: 0, w_maf: 0, g_sher: 0, w_sher: 0, g_red: 0, w_red: 0, best_move: 0, extra: 0, ci: 0 };
    results.forEach(res => {
      if (res.role === 'don') { s.g_don++; if(res.is_win) s.w_don++; }
      else if (res.role === 'mafia') { s.g_maf++; if(res.is_win) s.w_maf++; }
      else if (res.role === 'sheriff') { s.g_sher++; if(res.is_win) s.w_sher++; }
      else if (res.role === 'red') { s.g_red++; if(res.is_win) s.w_red++; }
      s.best_move += Number(res.best_move_points || 0);
      s.extra += Number(res.extra_points || 0);
      if (res.is_first_kill) s.ci += 1;
    });
    const g_total = s.g_don + s.g_maf + s.g_sher + s.g_red;
    const w_total = s.w_don + s.w_maf + s.w_sher + s.w_red;
    const points = (w_total + s.extra + s.best_move + (s.ci * 0.1)).toFixed(2);
    const coeff = g_total > 0 ? (points / g_total).toFixed(3) : "0.000";
    return { ...s, g_total, w_total, points, coeff };
  };

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <div style={{ 
        background: '#e1e9c2', 
        padding: '10px', 
        borderRadius: '12px', 
        boxSizing: 'border-box'
      }}>
        <table style={{ 
          width: '100%', 
          borderCollapse: 'collapse', 
          color: '#000', 
          fontSize: '11px',
          tableLayout: 'auto' /* Позволяет таблице подстраиваться под контент */
        }}>
          <thead>
            <tr style={{ background: '#a5b886' }}>
              <th style={tdStyle} rowSpan="2">№</th>
              <th style={{...tdStyle, textAlign: 'left', minWidth: '100px'}} rowSpan="2">ИГРОК</th>
              <th style={tdStyle} rowSpan="2">ИГРЫ</th>
              <th style={tdStyle} rowSpan="2">ПОБЕДЫ</th>
              <th style={tdStyle} colSpan="2">ДОН</th>
              <th style={tdStyle} colSpan="2">МАФИЯ</th>
              <th style={{...tdStyle, color: '#b00'}} colSpan="2">ШЕРИФ</th>
              <th style={{...tdStyle, color: '#b00'}} colSpan="2">КРАСНЫЙ</th>
              <th style={tdStyle} rowSpan="2">ЛХ</th>
              <th style={tdStyle} rowSpan="2">ДОП</th>
              <th style={tdStyle} rowSpan="2">БАЛЛЫ</th>
              <th style={tdStyle} rowSpan="2">КОЭФ</th>
            </tr>
            <tr style={{ background: '#a5b886' }}>
              <th style={tdStyle}>И</th><th style={tdStyle}>П</th>
              <th style={tdStyle}>И</th><th style={tdStyle}>П</th>
              <th style={{...tdStyle, color: '#b00'}}>И</th><th style={{...tdStyle, color: '#b00'}}>П</th>
              <th style={{...tdStyle, color: '#b00'}}>И</th><th style={{...tdStyle, color: '#b00'}}>П</th>
            </tr>
          </thead>
          <tbody>
            {players.map(p => ({...p, s: calculateStats(p)}))
              .sort((a,b) => b.s.points - a.s.points)
              .map((p, i) => (
                <tr key={p.id} style={{ background: i % 2 ? '#d4dbb6' : 'transparent' }}>
                  <td style={tdStyle}>{i+1}</td>
                  <td style={{...tdStyle, textAlign:'left', fontWeight:'bold'}}>{p.name}</td>
                  <td style={tdStyle}>{p.s.g_total}</td>
                  <td style={tdStyle}>{p.s.w_total}</td>
                  <td style={tdStyle}>{p.s.g_don}</td><td style={tdStyle}>{p.s.w_don}</td>
                  <td style={tdStyle}>{p.s.g_maf}</td><td style={tdStyle}>{p.s.w_maf}</td>
                  <td style={{...tdStyle, color:'#b00'}}>{p.s.g_sher}</td><td style={{...tdStyle, color:'#b00'}}>{p.s.w_sher}</td>
                  <td style={{...tdStyle, color:'#b00'}}>{p.s.g_red}</td><td style={{...tdStyle, color:'#b00'}}>{p.s.w_red}</td>
                  <td style={tdStyle}>{p.s.best_move}</td><td style={tdStyle}>{p.s.extra}</td>
                  <td style={{...tdStyle, fontWeight:'bold', color: '#b00'}}>{p.s.points}</td>
                  <td style={tdStyle}>{p.s.coeff.replace('.',',')}</td>
                </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Rating;