import React, { useState } from 'react';

// Вспомогательный компонент для иконок ролей
const RoleIcon = ({ role }) => {
  switch (role) {
    case 'sheriff': return '⭐';
    case 'don': return '🎩';
    case 'mafia': return '🔫';
    default: return null;
  }
};

const GameCard = ({ game, index }) => {
  // Определяем цвет шапки в зависимости от победителя
  const headerBg = game.winner === 'red' ? '#e53935' : '#333';
  const results = game.game_results || [];

  return (
    <div style={{
      width: '100%',
      maxWidth: '350px',
      backgroundColor: '#fff',
      color: '#000',
      borderRadius: '8px',
      overflow: 'hidden',
      boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
      fontFamily: 'sans-serif'
    }}>
      {/* Шапка карточки */}
      <div style={{ backgroundColor: headerBg, color: '#fff', padding: '10px', textAlign: 'center', position: 'relative' }}>
        <div style={{ fontSize: '14px', fontWeight: 'bold' }}>
          Тур {game.table_number || 1} стол 1 ✔️
          <span style={{ position: 'absolute', right: '10px', cursor: 'pointer' }}>✏️</span>
        </div>
        <div style={{ fontSize: '16px', margin: '5px 0' }}>{game.tournament_name || 'Судья'}</div>
        <div style={{ fontSize: '12px' }}>{new Date(game.created_at).toLocaleString('ru-RU')}</div>
      </div>

      {/* Таблица игроков */}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
        <tbody>
          {results.map((res, i) => {
            // Расчет итогового балла для отображения (Победа(1) + ЛХ + Доп - Штраф)
            const total = (res.is_win ? 1 : 0) + (res.best_move_points || 0) + (res.extra_points || 0) - (res.penalty_points || 0);
            
            return (
              <tr key={res.id} style={{ 
                borderBottom: '1px solid #ddd',
                // Подсветка первого убитого (как на фото синим)
                backgroundColor: res.is_first_kill ? '#add8e6' : 'transparent' 
              }}>
                <td style={{ padding: '5px', borderRight: '1px solid #ddd', textAlign: 'center', width: '25px', color: '#666' }}>
                  {i + 1}
                </td>
                <td style={{ padding: '5px', borderRight: '1px solid #ddd', fontWeight: '500' }}>
                  {res.players?.name || 'Игрок'}
                </td>
                <td style={{ padding: '5px', borderRight: '1px solid #ddd', textAlign: 'center', width: '30px' }}>
                  <RoleIcon role={res.role} />
                </td>
                <td style={{ padding: '5px', textAlign: 'right', fontWeight: 'bold', width: '45px' }}>
                  {total !== 0 ? total.toFixed(2).replace('.', ',') : ''}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

const History = ({ tournaments, gameHistory }) => {
  const [expanded, setExpanded] = useState(null);

  return (
    <div style={{ width: '100%' }}>
      {tournaments.map(t => (
        <div key={t.id} style={{ marginBottom: '15px', background: '#222', borderRadius: '10px', overflow: 'hidden' }}>
          {/* Заголовок вечера */}
          <div 
            onClick={() => setExpanded(expanded === t.id ? null : t.id)} 
            style={{ padding: '15px', cursor: 'pointer', background: '#2a2a2a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <span style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>📅 {t.date} — {t.name}</span>
            <span style={{ color: '#ffd700' }}>{expanded === t.id ? '▲ Скрыть' : '▼ Показать игры'}</span>
          </div>

          {/* Список игр в развернутом вечере */}
          {expanded === t.id && (
            <div style={{ 
              padding: '20px', 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: '20px', 
              justifyContent: 'center',
              background: '#111' 
            }}>
              {gameHistory
                .filter(g => g.tournament_id === t.id)
                .map((game, idx) => (
                  <GameCard key={game.id} game={game} index={idx} />
                ))
              }
              {gameHistory.filter(g => g.tournament_id === t.id).length === 0 && (
                <p style={{ color: '#666' }}>В этот вечер игр еще не записано</p>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default History;