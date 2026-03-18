import React, { useMemo, useState } from 'react';

const SEASON_CONFIGS = [
  {
    id: 'year',
    tabLabel: 'Итог 2026',
    summaryLabel: 'Общее количество игр за год',
    seasonLabel: 'Итог 2026',
    dateLabel: '12.12.2025 - 06.12.2026',
    start: '2025-12-12',
    end: '2026-12-06',
  },
  {
    id: 'season-1',
    tabLabel: '1 сезон',
    summaryLabel: 'Общее количество игр за сезон',
    seasonLabel: '1 сезон',
    dateLabel: '12.12.2025 - 26.04.2026',
    start: '2025-12-12',
    end: '2026-04-26',
  },
  {
    id: 'season-2',
    tabLabel: '2 сезон',
    summaryLabel: 'Общее количество игр за сезон',
    seasonLabel: '2 сезон',
    dateLabel: '27.04.2026 - 16.08.2026',
    start: '2026-04-27',
    end: '2026-08-16',
  },
  {
    id: 'season-3',
    tabLabel: '3 сезон',
    summaryLabel: 'Общее количество игр за сезон',
    seasonLabel: '3 сезон',
    dateLabel: '17.08.2026 - 06.12.2026',
    start: '2026-08-17',
    end: '2026-12-06',
  },
];

const tableCellStyle = {
  border: '1px solid rgba(92, 110, 53, 0.55)',
  padding: '7px 5px',
  textAlign: 'center',
  whiteSpace: 'nowrap',
};

const topHeaderStyle = {
  ...tableCellStyle,
  background: 'linear-gradient(180deg, #a6bd74 0%, #dce7ba 100%)',
  color: '#14200d',
  fontSize: '10px',
  fontWeight: 900,
  textTransform: 'uppercase',
};

const subHeaderStyle = {
  ...tableCellStyle,
  background: '#d4e1b3',
  color: '#1b2a11',
  fontSize: '9px',
  fontWeight: 800,
};

const bodyCellStyle = {
  ...tableCellStyle,
  background: 'rgba(255,255,255,0.38)',
  color: '#13210f',
  fontSize: '11px',
  fontWeight: 700,
};

const tabButtonStyle = (isActive) => ({
  border: '1px solid',
  borderColor: isActive ? '#dce8bc' : 'rgba(133, 153, 91, 0.28)',
  background: isActive ? 'linear-gradient(180deg, #edf5db 0%, #d7e7b4 100%)' : 'rgba(255,255,255,0.04)',
  color: isActive ? '#14200d' : '#bfd29b',
  borderRadius: '999px',
  padding: '10px 16px',
  fontWeight: 800,
  fontSize: '13px',
  cursor: 'pointer',
  minWidth: '120px',
  boxShadow: isActive ? '0 10px 24px rgba(125, 150, 73, 0.18)' : 'none',
  transition: '0.2s ease',
});

const numberFormat = new Intl.NumberFormat('ru-RU', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const ratioFormat = new Intl.NumberFormat('ru-RU', {
  minimumFractionDigits: 3,
  maximumFractionDigits: 3,
});

const percentFormat = new Intl.NumberFormat('ru-RU', {
  style: 'percent',
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

const toNumber = (value) => Number(value || 0);
const CI_POINTS = { mafia: 0.05, don: 0.1 };

const parseDate = (value) => {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;

  const normalized = typeof value === 'string' ? value.trim() : String(value);

  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    return new Date(`${normalized}T00:00:00`);
  }

  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const parseFirstShot = (value) =>
  String(value || '')
    .split(/[^\d]+/)
    .filter(Boolean)
    .map((item) => Number(item))
    .filter((item) => item >= 1 && item <= 10);

const isInRange = (date, start, end) => Boolean(date && date >= start && date <= end);

const createGameMetaMap = (gameHistory, tournaments) => {
  const tournamentDateMap = new Map(tournaments.map((tournament) => [tournament.id, parseDate(tournament.date)]));

  return new Map(
    gameHistory.map((game) => {
      const tournamentDate = tournamentDateMap.get(game.tournament_id);
      const fallbackDate = parseDate(game.created_at);
      const seatRoleMap = new Map((game.game_results || []).map((result, index) => [index + 1, result.role]));

      return [
        game.id,
        {
          date: tournamentDate || fallbackDate,
          seatRoleMap,
        },
      ];
    })
  );
};

const calculateCi = (firstShot, seatRoleMap) =>
  parseFirstShot(firstShot).reduce((total, seat) => total + (CI_POINTS[seatRoleMap?.get(seat)] || 0), 0);

const calculateStats = (results, gameMetaMap) => {
  const stats = {
    g_don: 0,
    w_don: 0,
    g_maf: 0,
    w_maf: 0,
    g_sher: 0,
    w_sher: 0,
    g_red: 0,
    w_red: 0,
    firstShotCount: 0,
    ci: 0,
    bestMove: 0,
    extra: 0,
    minus: 0,
    gameIds: new Set(),
  };

  results.forEach((result) => {
    if (result.role === 'don') {
      stats.g_don += 1;
      if (result.is_win) stats.w_don += 1;
    } else if (result.role === 'mafia') {
      stats.g_maf += 1;
      if (result.is_win) stats.w_maf += 1;
    } else if (result.role === 'sheriff') {
      stats.g_sher += 1;
      if (result.is_win) stats.w_sher += 1;
    } else if (result.role === 'red') {
      stats.g_red += 1;
      if (result.is_win) stats.w_red += 1;
    }

    if (result.game_id) {
      stats.gameIds.add(result.game_id);
    }

    if (result.first_shot) {
      stats.firstShotCount += 1;
      stats.ci += calculateCi(result.first_shot, gameMetaMap.get(result.game_id)?.seatRoleMap);
    }

    stats.bestMove += toNumber(result.best_move_points);
    stats.extra += toNumber(result.extra_points);
    stats.minus += toNumber(result.penalty_points);
  });

  const gamesTotal = stats.g_don + stats.g_maf + stats.g_sher + stats.g_red;
  const winsTotal = stats.w_don + stats.w_maf + stats.w_sher + stats.w_red;
  const points = winsTotal + stats.extra + stats.bestMove + stats.ci - stats.minus;
  const coefficient = gamesTotal > 0 ? points / gamesTotal : 0;

  return {
    ...stats,
    gamesTotal,
    winsTotal,
    points,
    coefficient,
  };
};

const buildSeasonTable = (players, gameMetaMap, season) => {
  const start = parseDate(season.start);
  const end = parseDate(season.end);

  const rows = players
    .map((player) => {
      const seasonResults = (player.game_results || []).filter((result) =>
        isInRange(gameMetaMap.get(result.game_id)?.date, start, end)
      );

      return {
        ...player,
        stats: calculateStats(seasonResults, gameMetaMap),
      };
    })
    .filter((player) => player.stats.gamesTotal > 0)
    .sort((left, right) => {
      if (right.stats.points !== left.stats.points) return right.stats.points - left.stats.points;
      if (right.stats.coefficient !== left.stats.coefficient) {
        return right.stats.coefficient - left.stats.coefficient;
      }
      return left.name.localeCompare(right.name, 'ru');
    });

  const totalGames = new Set(rows.flatMap((player) => [...player.stats.gameIds])).size;

  return {
    totalGames,
    rows: rows.map((player) => ({
      ...player,
      gamesShare: totalGames > 0 ? player.stats.gamesTotal / totalGames : 0,
    })),
  };
};

const RatingTable = ({ season, totalGames, rows }) => (
  <div style={{ width: '100%' }}>
    <div
      style={{
        width: '100%',
        background: 'linear-gradient(180deg, #f7faef 0%, #e3ecc9 100%)',
        padding: '18px',
        borderRadius: '22px',
        boxShadow: '0 18px 40px rgba(20, 32, 13, 0.12), inset 0 0 0 1px rgba(84, 100, 51, 0.18)',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(240px, 300px) 1fr',
          gap: '12px',
          marginBottom: '14px',
          alignItems: 'stretch',
        }}
      >
        <div
          style={{
            background: 'linear-gradient(180deg, #dce8ba 0%, #eef4df 100%)',
            border: '1px solid rgba(92, 110, 53, 0.18)',
            borderRadius: '18px',
            padding: '14px 16px',
            display: 'grid',
            gap: '6px',
            boxShadow: '0 10px 24px rgba(116, 137, 74, 0.12)',
          }}
        >
          <div style={{ fontSize: '11px', fontWeight: 900, color: '#55663a', textTransform: 'uppercase' }}>
            {season.summaryLabel}
          </div>
          <div style={{ fontSize: '30px', lineHeight: 1, fontWeight: 900, color: '#16220f' }}>{totalGames}</div>
          <div style={{ fontSize: '13px', fontWeight: 800, color: '#46582d', textTransform: 'uppercase' }}>
            {season.seasonLabel}
          </div>
          <div style={{ fontSize: '12px', color: '#607244' }}>{season.dateLabel}</div>
        </div>

        <div
          style={{
            background: 'linear-gradient(90deg, #6f8342 0%, #dce8ba 50%, #6f8342 100%)',
            border: '1px solid rgba(92, 110, 53, 0.18)',
            borderRadius: '18px',
            padding: '16px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            color: '#18240f',
            fontSize: 'clamp(14px, 2vw, 24px)',
            fontWeight: 900,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            boxShadow: '0 10px 24px rgba(116, 137, 74, 0.12)',
          }}
        >
          Рейтинг маф-клуба "Империя-Смоленск"
        </div>
      </div>

      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          color: '#13210f',
          fontSize: '11px',
          fontFamily: '"Arial Black", Arial, sans-serif',
          tableLayout: 'fixed',
        }}
      >
        <colgroup>
          <col style={{ width: '190px' }} />
          <col style={{ width: '64px' }} />
          <col style={{ width: '64px' }} />
          <col style={{ width: '42px' }} />
          <col style={{ width: '42px' }} />
          <col style={{ width: '42px' }} />
          <col style={{ width: '42px' }} />
          <col style={{ width: '48px' }} />
          <col style={{ width: '48px' }} />
          <col style={{ width: '48px' }} />
          <col style={{ width: '48px' }} />
          <col style={{ width: '56px' }} />
          <col style={{ width: '46px' }} />
          <col style={{ width: '42px' }} />
          <col style={{ width: '62px' }} />
          <col style={{ width: '72px' }} />
          <col style={{ width: '72px' }} />
          <col style={{ width: '96px' }} />
          <col style={{ width: '96px' }} />
        </colgroup>
        <thead>
          <tr>
            <th style={{ ...topHeaderStyle, textAlign: 'left', paddingLeft: '12px' }} rowSpan="2">
              Игрок
            </th>
            <th style={topHeaderStyle} rowSpan="2">Игр всего</th>
            <th style={topHeaderStyle} rowSpan="2">Победы</th>
            <th style={topHeaderStyle} colSpan="2">Дон</th>
            <th style={topHeaderStyle} colSpan="2">Мафия</th>
            <th style={{ ...topHeaderStyle, color: '#a51111' }} colSpan="2">Шериф</th>
            <th style={{ ...topHeaderStyle, color: '#a51111' }} colSpan="2">Красный</th>
            <th style={topHeaderStyle} rowSpan="2">ПУ</th>
            <th style={topHeaderStyle} rowSpan="2">Ci</th>
            <th style={topHeaderStyle} rowSpan="2">ЛХ</th>
            <th style={topHeaderStyle} rowSpan="2">Допы</th>
            <th style={topHeaderStyle} rowSpan="2">Минус</th>
            <th style={topHeaderStyle} rowSpan="2">Баллы</th>
            <th style={topHeaderStyle} rowSpan="2">Коэффициент</th>
            <th style={topHeaderStyle} rowSpan="2">% игр к общему</th>
          </tr>
          <tr>
            <th style={subHeaderStyle}>И</th>
            <th style={subHeaderStyle}>П</th>
            <th style={subHeaderStyle}>И</th>
            <th style={subHeaderStyle}>П</th>
            <th style={{ ...subHeaderStyle, color: '#a51111' }}>И</th>
            <th style={{ ...subHeaderStyle, color: '#a51111' }}>П</th>
            <th style={{ ...subHeaderStyle, color: '#a51111' }}>И</th>
            <th style={{ ...subHeaderStyle, color: '#a51111' }}>П</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((player, index) => (
            <tr
              key={player.id}
              style={{
                background: index % 2 === 0 ? 'rgba(255,255,255,0.52)' : 'rgba(233,240,211,0.94)',
              }}
            >
              <td style={{ ...bodyCellStyle, textAlign: 'left', paddingLeft: '12px', fontWeight: 900 }}>
                {player.name}
              </td>
              <td style={bodyCellStyle}>{player.stats.gamesTotal}</td>
              <td style={bodyCellStyle}>{player.stats.winsTotal}</td>
              <td style={bodyCellStyle}>{player.stats.g_don}</td>
              <td style={bodyCellStyle}>{player.stats.w_don}</td>
              <td style={bodyCellStyle}>{player.stats.g_maf}</td>
              <td style={bodyCellStyle}>{player.stats.w_maf}</td>
              <td style={{ ...bodyCellStyle, color: '#a51111' }}>{player.stats.g_sher}</td>
              <td style={{ ...bodyCellStyle, color: '#a51111' }}>{player.stats.w_sher}</td>
              <td style={{ ...bodyCellStyle, color: '#a51111' }}>{player.stats.g_red}</td>
              <td style={{ ...bodyCellStyle, color: '#a51111' }}>{player.stats.w_red}</td>
              <td style={bodyCellStyle}>{player.stats.firstShotCount}</td>
              <td style={bodyCellStyle}>{numberFormat.format(player.stats.ci)}</td>
              <td style={bodyCellStyle}>{numberFormat.format(player.stats.bestMove)}</td>
              <td style={bodyCellStyle}>{numberFormat.format(player.stats.extra)}</td>
              <td style={bodyCellStyle}>{numberFormat.format(player.stats.minus)}</td>
              <td style={{ ...bodyCellStyle, color: '#a51111', fontWeight: 900 }}>
                {numberFormat.format(player.stats.points)}
              </td>
              <td style={bodyCellStyle}>{ratioFormat.format(player.stats.coefficient)}</td>
              <td style={bodyCellStyle}>{percentFormat.format(player.gamesShare)}</td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td
                colSpan={19}
                style={{
                  ...bodyCellStyle,
                  padding: '28px',
                  fontWeight: 800,
                  color: '#4d5f34',
                  background: 'rgba(255,255,255,0.5)',
                }}
              >
                Для этого периода пока нет игр.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
);

const Rating = ({ players, tournaments, gameHistory }) => {
  const [activeSeasonId, setActiveSeasonId] = useState('year');

  const seasonTables = useMemo(() => {
    const gameMetaMap = createGameMetaMap(gameHistory, tournaments);
    return Object.fromEntries(
      SEASON_CONFIGS.map((season) => [season.id, buildSeasonTable(players, gameMetaMap, season)])
    );
  }, [gameHistory, players, tournaments]);

  const activeSeason = SEASON_CONFIGS.find((season) => season.id === activeSeasonId) || SEASON_CONFIGS[0];
  const activeTable = seasonTables[activeSeason.id] || { totalGames: 0, rows: [] };

  return (
    <div style={{ display: 'grid', gap: '16px' }}>
      <div
        style={{
          display: 'flex',
          gap: '10px',
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}
      >
        {SEASON_CONFIGS.map((season) => (
          <button
            key={season.id}
            onClick={() => setActiveSeasonId(season.id)}
            style={tabButtonStyle(season.id === activeSeason.id)}
          >
            {season.tabLabel}
          </button>
        ))}
      </div>

      <RatingTable season={activeSeason} totalGames={activeTable.totalGames} rows={activeTable.rows} />
    </div>
  );
};

export default Rating;
