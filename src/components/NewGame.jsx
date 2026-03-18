import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import FirstShotInput from './FirstShotInput';

const inputStyle = {
  background: '#333',
  color: '#fff',
  border: '1px solid #555',
  padding: '10px',
  borderRadius: '6px',
  width: '100%',
  boxSizing: 'border-box',
};

const normalizeFirstShot = (value) => {
  const normalized = String(value || '').trim();
  if (!normalized) return '';

  const numbers = normalized
    .split(/[^\d]+/)
    .filter(Boolean)
    .map((item) => Number(item));

  if (numbers.length !== 3) {
    throw new Error('В ПУ нужно указать ровно 3 номера игроков.');
  }

  if (numbers.some((number) => number < 1 || number > 10)) {
    throw new Error('В ПУ можно указывать только номера от 1 до 10.');
  }

  if (new Set(numbers).size !== 3) {
    throw new Error('В ПУ номера не должны повторяться.');
  }

  return numbers.join(',');
};

const createEmptyParticipants = () =>
  Array.from({ length: 10 }, (_, index) => ({
    slot: index + 1,
    playerId: '',
    role: 'red',
    firstShot: '',
    bestMove: 0,
    extra: 0,
    penalty: 0,
  }));

const updateParticipant = (participants, index, key, value) =>
  participants.map((participant, participantIndex) =>
    participantIndex === index ? { ...participant, [key]: value } : participant
  );

const prepareParticipants = (participants) => {
  const prepared = participants.map((participant) => ({
    ...participant,
    firstShot: normalizeFirstShot(participant.firstShot),
  }));

  const firstShotRows = prepared.filter((participant) => participant.firstShot);
  if (firstShotRows.length > 1) {
    throw new Error('ПУ можно указать только у одного игрока за игру.');
  }

  if (firstShotRows.some((participant) => !participant.playerId)) {
    throw new Error('ПУ можно указать только у заполненного игрока.');
  }

  return prepared;
};

const NewGame = ({ players, tournaments, onGameSaved }) => {
  const [winner, setWinner] = useState('red');
  const [selectedTournamentId, setSelectedTournamentId] = useState('');
  const [newTournamentName, setNewTournamentName] = useState('');
  const [newTournamentDate, setNewTournamentDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [participants, setParticipants] = useState(createEmptyParticipants);

  const handleCreateTournament = async () => {
    if (!newTournamentDate) return alert('Укажите дату вечера.');
    if (!newTournamentName.trim()) return alert('Введите название вечера.');

    const { data, error } = await supabase
      .from('tournaments')
      .insert([{ date: newTournamentDate, name: newTournamentName.trim() }])
      .select()
      .single();

    if (error) {
      alert(error.message);
      return;
    }

    setNewTournamentName('');
    setSelectedTournamentId(String(data.id));
    onGameSaved?.();
    alert('Игровой вечер создан.');
  };

  const saveGame = async () => {
    if (!selectedTournamentId) return alert('Выберите игровой вечер.');

    try {
      const preparedParticipants = prepareParticipants(participants);
      const filledParticipants = preparedParticipants.filter((participant) => participant.playerId);
      if (filledParticipants.length === 0) return alert('Добавьте хотя бы одного игрока.');

      const { data, error } = await supabase
        .from('games')
        .insert([{ winner, tournament_id: selectedTournamentId }])
        .select()
        .single();

      if (error) throw error;

      const resultRows = filledParticipants.map((participant) => ({
        game_id: data.id,
        player_id: participant.playerId,
        role: participant.role,
        is_win:
          (winner === 'red' && (participant.role === 'red' || participant.role === 'sheriff')) ||
          (winner === 'black' && (participant.role === 'mafia' || participant.role === 'don')),
        first_shot: participant.firstShot || null,
        best_move_points: Number(participant.bestMove) || 0,
        extra_points: Number(participant.extra) || 0,
        penalty_points: Number(participant.penalty) || 0,
      }));

      const { error: resultsError } = await supabase.from('game_results').insert(resultRows);
      if (resultsError) throw resultsError;

      setParticipants(createEmptyParticipants());
      setWinner('red');
      alert('Игра сохранена.');
      onGameSaved?.();
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div style={{ maxWidth: '820px', margin: '0 auto', display: 'grid', gap: '24px' }}>
      <div style={{ background: '#1b1b1b', padding: '20px', borderRadius: '12px' }}>
        <h2 style={{ margin: '0 0 15px', color: '#ffd700' }}>Создать игровой вечер</h2>
        <div style={{ display: 'grid', gap: '12px', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
          <input
            type="date"
            value={newTournamentDate}
            onChange={(event) => setNewTournamentDate(event.target.value)}
            style={inputStyle}
          />
          <input
            type="text"
            placeholder="Название вечера"
            value={newTournamentName}
            onChange={(event) => setNewTournamentName(event.target.value)}
            style={inputStyle}
          />
          <button
            type="button"
            onClick={handleCreateTournament}
            style={{
              padding: '12px',
              background: '#2d5a27',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 'bold',
              cursor: 'pointer',
            }}
          >
            Создать вечер
          </button>
        </div>
      </div>

      <div style={{ background: '#1b1b1b', padding: '20px', borderRadius: '12px' }}>
        <h2 style={{ margin: '0 0 15px', color: '#ffd700' }}>Новая игра</h2>

        <select
          value={selectedTournamentId}
          onChange={(event) => setSelectedTournamentId(event.target.value)}
          style={{ ...inputStyle, marginBottom: '20px' }}
        >
          <option value="">-- Выберите вечер --</option>
          {tournaments.map((tournament) => (
            <option key={tournament.id} value={tournament.id}>
              {tournament.date} | {tournament.name}
            </option>
          ))}
        </select>

        <div style={{ display: 'flex', gap: '15px', marginBottom: '25px' }}>
          <button
            type="button"
            onClick={() => setWinner('red')}
            style={{
              flex: 1,
              padding: '15px',
              background: winner === 'red' ? '#d32f2f' : '#444',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 'bold',
              cursor: 'pointer',
            }}
          >
            Мирные
          </button>
          <button
            type="button"
            onClick={() => setWinner('black')}
            style={{
              flex: 1,
              padding: '15px',
              background: winner === 'black' ? '#000' : '#444',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 'bold',
              cursor: 'pointer',
            }}
          >
            Мафия
          </button>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '28px minmax(180px, 1fr) 110px 70px 70px 70px 96px',
            gap: '8px',
            marginBottom: '10px',
            alignItems: 'center',
            color: '#bdbdbd',
            fontSize: '12px',
            fontWeight: 'bold',
          }}
        >
          <span />
          <span>Игрок</span>
          <span>Роль</span>
          <span>ЛХ</span>
          <span>Допы</span>
          <span>Минус</span>
          <span style={{ textAlign: 'center' }}>ПУ</span>
        </div>

        <div style={{ color: '#8f8f8f', fontSize: '12px', marginBottom: '12px' }}>
          ПУ: введите 3 номера через запятую, например `1,4,10`. Поле должно быть заполнено только у игрока первого отстрела.
        </div>

        {participants.map((participant, index) => (
          <div
            key={participant.slot}
            style={{
              display: 'grid',
              gridTemplateColumns: '28px minmax(180px, 1fr) 110px 70px 70px 70px 96px',
              gap: '8px',
              marginBottom: '8px',
              alignItems: 'center',
            }}
          >
            <span style={{ color: '#888' }}>{index + 1}</span>
            <select
              value={participant.playerId}
              onChange={(event) =>
                setParticipants(updateParticipant(participants, index, 'playerId', event.target.value))
              }
              style={inputStyle}
            >
              <option value="">Игрок</option>
              {players.map((player) => (
                <option key={player.id} value={player.id}>
                  {player.name}
                </option>
              ))}
            </select>
            <select
              value={participant.role}
              onChange={(event) =>
                setParticipants(updateParticipant(participants, index, 'role', event.target.value))
              }
              style={{ ...inputStyle, width: '100%' }}
            >
              <option value="red">Красный</option>
              <option value="sheriff">Шериф</option>
              <option value="mafia">Мафия</option>
              <option value="don">Дон</option>
            </select>
            <input
              type="number"
              step="0.1"
              placeholder="ЛХ"
              value={participant.bestMove}
              onChange={(event) =>
                setParticipants(updateParticipant(participants, index, 'bestMove', event.target.value))
              }
              style={{ ...inputStyle, width: '100%' }}
            />
            <input
              type="number"
              step="0.1"
              placeholder="Доп"
              value={participant.extra}
              onChange={(event) =>
                setParticipants(updateParticipant(participants, index, 'extra', event.target.value))
              }
              style={{ ...inputStyle, width: '100%' }}
            />
            <input
              type="number"
              step="0.1"
              placeholder="Минус"
              value={participant.penalty}
              onChange={(event) =>
                setParticipants(updateParticipant(participants, index, 'penalty', event.target.value))
              }
              style={{ ...inputStyle, width: '100%' }}
            />
            <FirstShotInput
              value={participant.firstShot}
              onChange={(nextValue) =>
                setParticipants(updateParticipant(participants, index, 'firstShot', nextValue))
              }
              participants={participants}
            />
          </div>
        ))}

        <button
          type="button"
          onClick={saveGame}
          style={{
            width: '100%',
            padding: '18px',
            background: '#2d5a27',
            color: '#fff',
            border: 'none',
            borderRadius: '10px',
            marginTop: '20px',
            fontWeight: 'bold',
            cursor: 'pointer',
          }}
        >
          Сохранить результат
        </button>
      </div>
    </div>
  );
};

export default NewGame;
