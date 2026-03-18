import React, { useMemo, useState } from 'react';
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

const iconButtonStyle = {
  width: '34px',
  height: '34px',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '8px',
  cursor: 'pointer',
  fontSize: '16px',
  lineHeight: 1,
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
    key: `empty-${index}`,
    playerId: '',
    role: 'red',
    firstShot: '',
    bestMove: 0,
    extra: 0,
    penalty: 0,
  }));

const padParticipants = (results) => {
  const mapped = (results || []).map((result, index) => ({
    key: result.id || `result-${index}`,
    playerId: result.player_id ? String(result.player_id) : '',
    role: result.role || 'red',
    firstShot: result.first_shot || '',
    bestMove: result.best_move_points ?? 0,
    extra: result.extra_points ?? 0,
    penalty: result.penalty_points ?? 0,
  }));

  while (mapped.length < 10) {
    mapped.push({
      key: `empty-${mapped.length}`,
      playerId: '',
      role: 'red',
      firstShot: '',
      bestMove: 0,
      extra: 0,
      penalty: 0,
    });
  }

  return mapped.slice(0, 10);
};

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

const RoleIcon = ({ role }) => {
  switch (role) {
    case 'sheriff':
      return '⭐';
    case 'don':
      return '🎩';
    case 'mafia':
      return '🔫';
    default:
      return null;
  }
};

const Overlay = ({ children, onClose, disabled = false, maxWidth = '420px' }) => (
  <div
    style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.72)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      zIndex: 1000,
    }}
    onClick={disabled ? undefined : onClose}
  >
    <div
      style={{
        width: '100%',
        maxWidth,
        maxHeight: '90vh',
        overflow: 'auto',
        background: '#1f1f1f',
        color: '#fff',
        borderRadius: '16px',
        padding: '24px',
        border: '1px solid #333',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.45)',
      }}
      onClick={(event) => event.stopPropagation()}
    >
      {children}
    </div>
  </div>
);

const ConfirmDialog = ({ open, title, message, confirmLabel, onConfirm, onCancel, loading }) => {
  if (!open) return null;

  return (
    <Overlay onClose={onCancel} disabled={loading}>
      <h3 style={{ margin: '0 0 12px', color: '#ffd700' }}>{title}</h3>
      <p style={{ margin: '0 0 20px', color: '#ddd', lineHeight: 1.5 }}>{message}</p>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
        <button type="button" onClick={onCancel} disabled={loading} style={{ ...inputStyle, width: 'auto' }}>
          Отмена
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={loading}
          style={{
            background: '#c62828',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            padding: '10px 14px',
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
        >
          {loading ? 'Удаление...' : confirmLabel}
        </button>
      </div>
    </Overlay>
  );
};

const TournamentEditor = ({ open, draft, onChange, onSave, onCancel, saving }) => {
  if (!open) return null;

  return (
    <Overlay onClose={onCancel} disabled={saving}>
      <h3 style={{ margin: '0 0 16px', color: '#ffd700' }}>Изменить вечер</h3>
      <div style={{ display: 'grid', gap: '12px' }}>
        <input
          type="date"
          value={draft.date}
          onChange={(event) => onChange((current) => ({ ...current, date: event.target.value }))}
          style={inputStyle}
        />
        <input
          type="text"
          placeholder="Название вечера"
          value={draft.name}
          onChange={(event) => onChange((current) => ({ ...current, name: event.target.value }))}
          style={inputStyle}
        />
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '18px' }}>
        <button type="button" onClick={onCancel} disabled={saving} style={{ ...inputStyle, width: 'auto' }}>
          Отмена
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          style={{
            background: '#2d5a27',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            padding: '10px 14px',
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
        >
          {saving ? 'Сохранение...' : 'Сохранить'}
        </button>
      </div>
    </Overlay>
  );
};

const GameEditor = ({
  open,
  draft,
  players,
  tournaments,
  onDraftChange,
  onParticipantChange,
  onSave,
  onCancel,
  saving,
}) => {
  if (!open) return null;

  return (
    <Overlay onClose={onCancel} disabled={saving} maxWidth="1080px">
      <h3 style={{ margin: '0 0 16px', color: '#ffd700' }}>Изменить игру</h3>

      <div style={{ display: 'grid', gap: '12px', gridTemplateColumns: '1fr 1fr', marginBottom: '16px' }}>
        <select
          value={draft.tournamentId}
          onChange={(event) => onDraftChange((current) => ({ ...current, tournamentId: event.target.value }))}
          style={inputStyle}
        >
          <option value="">-- Выберите вечер --</option>
          {tournaments.map((tournament) => (
            <option key={tournament.id} value={tournament.id}>
              {tournament.date} | {tournament.name}
            </option>
          ))}
        </select>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            onClick={() => onDraftChange((current) => ({ ...current, winner: 'red' }))}
            style={{
              flex: 1,
              padding: '12px',
              background: draft.winner === 'red' ? '#d32f2f' : '#444',
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
            onClick={() => onDraftChange((current) => ({ ...current, winner: 'black' }))}
            style={{
              flex: 1,
              padding: '12px',
              background: draft.winner === 'black' ? '#000' : '#444',
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

      <div style={{ display: 'grid', gap: '8px' }}>
        {draft.participants.map((participant, index) => (
          <div
            key={participant.key}
            style={{
              display: 'grid',
              gridTemplateColumns: '28px minmax(180px, 1fr) 110px 70px 70px 70px 96px',
              gap: '8px',
              alignItems: 'center',
            }}
          >
            <span style={{ color: '#888' }}>{index + 1}</span>
            <select
              value={participant.playerId}
              onChange={(event) => onParticipantChange(index, 'playerId', event.target.value)}
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
              onChange={(event) => onParticipantChange(index, 'role', event.target.value)}
              style={inputStyle}
            >
              <option value="red">Красный</option>
              <option value="sheriff">Шериф</option>
              <option value="mafia">Мафия</option>
              <option value="don">Дон</option>
            </select>
            <input
              type="number"
              step="0.1"
              value={participant.bestMove}
              onChange={(event) => onParticipantChange(index, 'bestMove', event.target.value)}
              placeholder="ЛХ"
              style={inputStyle}
            />
            <input
              type="number"
              step="0.1"
              value={participant.extra}
              onChange={(event) => onParticipantChange(index, 'extra', event.target.value)}
              placeholder="Доп"
              style={inputStyle}
            />
            <input
              type="number"
              step="0.1"
              value={participant.penalty}
              onChange={(event) => onParticipantChange(index, 'penalty', event.target.value)}
              placeholder="Минус"
              style={inputStyle}
            />
            <FirstShotInput
              value={participant.firstShot}
              onChange={(nextValue) => onParticipantChange(index, 'firstShot', nextValue)}
              participants={draft.participants}
            />
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '18px' }}>
        <button type="button" onClick={onCancel} disabled={saving} style={{ ...inputStyle, width: 'auto' }}>
          Отмена
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          style={{
            background: '#2d5a27',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            padding: '10px 14px',
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
        >
          {saving ? 'Сохранение...' : 'Сохранить'}
        </button>
      </div>
    </Overlay>
  );
};

const GameCard = ({ game, onDelete, onEdit }) => {
  const headerBg = game.winner === 'red' ? '#e53935' : '#333';
  const results = game.game_results || [];

  return (
    <div
      style={{
        width: '100%',
        maxWidth: '350px',
        backgroundColor: '#fff',
        color: '#000',
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
        fontFamily: 'sans-serif',
      }}
    >
      <div style={{ backgroundColor: headerBg, color: '#fff', padding: '10px', textAlign: 'center', position: 'relative' }}>
        <div style={{ fontSize: '14px', fontWeight: 'bold' }}>
          Тур {game.table_number || 1} стол 1
          <div style={{ position: 'absolute', right: '10px', top: '8px', display: 'flex', gap: '6px' }}>
            <button
              type="button"
              onClick={() => onEdit(game)}
              title="Изменить игру"
              style={{
                ...iconButtonStyle,
                background: 'rgba(0,0,0,0.18)',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.35)',
              }}
            >
              ✎
            </button>
            <button
              type="button"
              onClick={() => onDelete(game)}
              title="Удалить игру"
              style={{
                ...iconButtonStyle,
                background: 'rgba(0,0,0,0.18)',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.35)',
              }}
            >
              🗑
            </button>
          </div>
        </div>
        <div style={{ fontSize: '16px', margin: '5px 0' }}>{game.tournament_name || 'Игровой вечер'}</div>
        <div style={{ fontSize: '12px' }}>{new Date(game.created_at).toLocaleString('ru-RU')}</div>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
        <tbody>
          {results.map((result, index) => {
            const total =
              (result.is_win ? 1 : 0) +
              (result.best_move_points || 0) +
              (result.extra_points || 0) -
              (result.penalty_points || 0);

            return (
              <tr
                key={result.id}
                style={{
                  borderBottom: '1px solid #ddd',
                  backgroundColor: result.first_shot ? '#add8e6' : 'transparent',
                }}
              >
                <td style={{ padding: '5px', borderRight: '1px solid #ddd', textAlign: 'center', width: '25px', color: '#666' }}>
                  {index + 1}
                </td>
                <td style={{ padding: '5px', borderRight: '1px solid #ddd', fontWeight: '500' }}>
                  {result.players?.name || 'Игрок'}
                </td>
                <td style={{ padding: '5px', borderRight: '1px solid #ddd', textAlign: 'center', width: '30px' }}>
                  <RoleIcon role={result.role} />
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

const History = ({ tournaments, gameHistory, players, onUpdate }) => {
  const [expanded, setExpanded] = useState(null);
  const [confirmState, setConfirmState] = useState({
    open: false,
    title: '',
    message: '',
    confirmLabel: '',
    action: null,
  });
  const [isDeleting, setIsDeleting] = useState(false);
  const [tournamentEditorOpen, setTournamentEditorOpen] = useState(false);
  const [gameEditorOpen, setGameEditorOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [tournamentDraft, setTournamentDraft] = useState({ id: null, name: '', date: '' });
  const [gameDraft, setGameDraft] = useState({
    id: null,
    tournamentId: '',
    winner: 'red',
    participants: createEmptyParticipants(),
  });

  const tournamentNameMap = useMemo(
    () => new Map(tournaments.map((tournament) => [tournament.id, tournament.name])),
    [tournaments]
  );

  const openConfirm = ({ title, message, confirmLabel, action }) => {
    setConfirmState({ open: true, title, message, confirmLabel, action });
  };

  const closeConfirm = () => {
    if (isDeleting) return;
    setConfirmState({ open: false, title: '', message: '', confirmLabel: '', action: null });
  };

  const deleteGame = async (gameId) => {
    const { error: resultsError } = await supabase.from('game_results').delete().eq('game_id', gameId);
    if (resultsError) throw resultsError;

    const { error: gameError } = await supabase.from('games').delete().eq('id', gameId);
    if (gameError) throw gameError;
  };

  const deleteTournament = async (tournamentId) => {
    const gameIds = gameHistory.filter((game) => game.tournament_id === tournamentId).map((game) => game.id);

    if (gameIds.length > 0) {
      const { error: resultsError } = await supabase.from('game_results').delete().in('game_id', gameIds);
      if (resultsError) throw resultsError;

      const { error: gamesError } = await supabase.from('games').delete().eq('tournament_id', tournamentId);
      if (gamesError) throw gamesError;
    }

    const { error: tournamentError } = await supabase.from('tournaments').delete().eq('id', tournamentId);
    if (tournamentError) throw tournamentError;
  };

  const confirmDeleteGame = (game) => {
    openConfirm({
      title: 'Удалить игру?',
      message: 'Будет удалена сама игра и все связанные результаты игроков. Это действие нельзя отменить.',
      confirmLabel: 'Удалить игру',
      action: async () => {
        await deleteGame(game.id);
        onUpdate?.();
      },
    });
  };

  const confirmDeleteTournament = (tournament) => {
    const relatedGamesCount = gameHistory.filter((game) => game.tournament_id === tournament.id).length;
    openConfirm({
      title: 'Удалить игровой вечер?',
      message: `Будет удалён вечер "${tournament.name}" и ${relatedGamesCount} связанных игр вместе с результатами. Это действие нельзя отменить.`,
      confirmLabel: 'Удалить вечер',
      action: async () => {
        await deleteTournament(tournament.id);
        setExpanded((current) => (current === tournament.id ? null : current));
        onUpdate?.();
      },
    });
  };

  const handleConfirmDelete = async () => {
    if (!confirmState.action) return;

    try {
      setIsDeleting(true);
      await confirmState.action();
      setConfirmState({ open: false, title: '', message: '', confirmLabel: '', action: null });
    } catch (error) {
      alert(error.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const openTournamentEditor = (tournament) => {
    setTournamentDraft({ id: tournament.id, name: tournament.name || '', date: tournament.date || '' });
    setTournamentEditorOpen(true);
  };

  const saveTournament = async () => {
    if (!tournamentDraft.date) return alert('Укажите дату вечера.');
    if (!tournamentDraft.name.trim()) return alert('Введите название вечера.');

    try {
      setIsSaving(true);
      const { error } = await supabase
        .from('tournaments')
        .update({ date: tournamentDraft.date, name: tournamentDraft.name.trim() })
        .eq('id', tournamentDraft.id);

      if (error) throw error;

      setTournamentEditorOpen(false);
      onUpdate?.();
    } catch (error) {
      alert(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const openGameEditor = (game) => {
    setGameDraft({
      id: game.id,
      tournamentId: game.tournament_id ? String(game.tournament_id) : '',
      winner: game.winner || 'red',
      participants: padParticipants(game.game_results),
    });
    setGameEditorOpen(true);
  };

  const saveGame = async () => {
    if (!gameDraft.tournamentId) return alert('Выберите игровой вечер.');

    try {
      const preparedParticipants = prepareParticipants(gameDraft.participants);
      const filledParticipants = preparedParticipants.filter((participant) => participant.playerId);
      if (filledParticipants.length === 0) return alert('Добавьте хотя бы одного игрока.');

      setIsSaving(true);

      const { error: gameError } = await supabase
        .from('games')
        .update({ tournament_id: gameDraft.tournamentId, winner: gameDraft.winner })
        .eq('id', gameDraft.id);

      if (gameError) throw gameError;

      const { error: deleteResultsError } = await supabase.from('game_results').delete().eq('game_id', gameDraft.id);
      if (deleteResultsError) throw deleteResultsError;

      const resultRows = filledParticipants.map((participant) => ({
        game_id: gameDraft.id,
        player_id: participant.playerId,
        role: participant.role,
        is_win:
          (gameDraft.winner === 'red' && (participant.role === 'red' || participant.role === 'sheriff')) ||
          (gameDraft.winner === 'black' && (participant.role === 'mafia' || participant.role === 'don')),
        first_shot: participant.firstShot || null,
        best_move_points: Number(participant.bestMove) || 0,
        extra_points: Number(participant.extra) || 0,
        penalty_points: Number(participant.penalty) || 0,
      }));

      const { error: insertResultsError } = await supabase.from('game_results').insert(resultRows);
      if (insertResultsError) throw insertResultsError;

      setGameEditorOpen(false);
      onUpdate?.();
    } catch (error) {
      alert(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ width: '100%' }}>
      <ConfirmDialog
        open={confirmState.open}
        title={confirmState.title}
        message={confirmState.message}
        confirmLabel={confirmState.confirmLabel}
        onConfirm={handleConfirmDelete}
        onCancel={closeConfirm}
        loading={isDeleting}
      />

      <TournamentEditor
        open={tournamentEditorOpen}
        draft={tournamentDraft}
        onChange={setTournamentDraft}
        onSave={saveTournament}
        onCancel={() => !isSaving && setTournamentEditorOpen(false)}
        saving={isSaving}
      />

      <GameEditor
        open={gameEditorOpen}
        draft={gameDraft}
        players={players}
        tournaments={tournaments}
        onDraftChange={setGameDraft}
        onParticipantChange={(index, key, value) =>
          setGameDraft((current) => ({
            ...current,
            participants: updateParticipant(current.participants, index, key, value),
          }))
        }
        onSave={saveGame}
        onCancel={() => !isSaving && setGameEditorOpen(false)}
        saving={isSaving}
      />

      {tournaments.map((tournament) => {
        const tournamentGames = gameHistory
          .filter((game) => game.tournament_id === tournament.id)
          .map((game) => ({
            ...game,
            tournament_name: tournamentNameMap.get(game.tournament_id) || game.tournament_name,
          }));

        return (
          <div key={tournament.id} style={{ marginBottom: '15px', background: '#222', borderRadius: '10px', overflow: 'hidden' }}>
            <div
              onClick={() => setExpanded(expanded === tournament.id ? null : tournament.id)}
              style={{
                padding: '15px',
                cursor: 'pointer',
                background: '#2a2a2a',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '12px',
                flexWrap: 'wrap',
              }}
            >
              <span style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>
                📅 {tournament.date} - {tournament.name}
              </span>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    openTournamentEditor(tournament);
                  }}
                  title="Изменить вечер"
                  style={{
                    ...iconButtonStyle,
                    background: 'rgba(255,255,255,0.08)',
                    color: '#fff',
                    border: '1px solid rgba(255,255,255,0.15)',
                  }}
                >
                  ✎
                </button>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    confirmDeleteTournament(tournament);
                  }}
                  title="Удалить вечер"
                  style={{
                    ...iconButtonStyle,
                    background: 'rgba(198, 40, 40, 0.18)',
                    color: '#ff8a80',
                    border: '1px solid rgba(255, 138, 128, 0.4)',
                  }}
                >
                  🗑
                </button>
                <span style={{ color: '#ffd700' }}>{expanded === tournament.id ? 'Скрыть' : 'Показать игры'}</span>
              </div>
            </div>

            {expanded === tournament.id && (
              <div
                style={{
                  padding: '20px',
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '20px',
                  justifyContent: 'center',
                  background: '#111',
                }}
              >
                {tournamentGames.map((game) => (
                  <GameCard key={game.id} game={game} onDelete={confirmDeleteGame} onEdit={openGameEditor} />
                ))}

                {tournamentGames.length === 0 && (
                  <p style={{ color: '#666' }}>В этом вечере пока нет сохранённых игр.</p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default History;
