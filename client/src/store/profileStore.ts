import { create } from 'zustand';
import type { GameRecord, PlayerStats } from '../types/game';

interface ProfileStore {
  name: string;
  avatar: string;
  records: GameRecord[];

  loadFromStorage: () => void;
  setName: (name: string) => void;
  setAvatar: (avatar: string) => void;
  addRecord: (record: GameRecord) => void;
  clearRecords: () => void;
  getStats: () => PlayerStats;
}

export const useProfileStore = create<ProfileStore>((set, get) => ({
  name: '',
  avatar: '😎',
  records: [],

  loadFromStorage: () => {
    const name = localStorage.getItem('pd_name') || '';
    const avatar = localStorage.getItem('pd_avatar') || '😎';
    let records: GameRecord[] = [];
    try {
      const raw = localStorage.getItem('pd_records');
      if (raw) records = JSON.parse(raw);
    } catch { records = []; }
    set({ name, avatar, records });
  },

  setName: (name) => {
    localStorage.setItem('pd_name', name);
    set({ name });
  },

  setAvatar: (avatar) => {
    localStorage.setItem('pd_avatar', avatar);
    set({ avatar });
  },

  addRecord: (record) => {
    const records = [record, ...get().records].slice(0, 50);
    localStorage.setItem('pd_records', JSON.stringify(records));
    set({ records });
  },

  clearRecords: () => {
    localStorage.setItem('pd_records', '[]');
    set({ records: [] });
  },

  getStats: () => {
    const records = get().records;
    if (records.length === 0) {
      return {
        totalGames: 0, wins: 0, losses: 0, draws: 0, winRate: 0,
        maxRoundScore: 0, maxGameScore: 0,
        maxRoundScoreGameId: '', maxGameScoreGameId: '',
      };
    }
    let wins = 0, losses = 0, draws = 0;
    let maxRoundScore = 0, maxGameScore = 0;
    let maxRoundScoreGameId = '', maxGameScoreGameId = '';

    for (const r of records) {
      if (r.result === 'win') wins++;
      else if (r.result === 'lose') losses++;
      else draws++;

      if (r.myTotalScore > maxGameScore) {
        maxGameScore = r.myTotalScore;
        maxGameScoreGameId = r.id;
      }
      for (const rs of r.roundScores) {
        if (rs.myScore > maxRoundScore) {
          maxRoundScore = rs.myScore;
          maxRoundScoreGameId = r.id;
        }
      }
    }

    return {
      totalGames: records.length,
      wins, losses, draws,
      winRate: Math.round((wins / records.length) * 100),
      maxRoundScore, maxGameScore,
      maxRoundScoreGameId, maxGameScoreGameId,
    };
  },
}));
