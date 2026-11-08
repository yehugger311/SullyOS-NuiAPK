import React, { useState } from 'react';
import { ensureActorAccounts, mutateFishingMarket, type FishingMarketState, type MarketActor } from '../../utils/vrWorld/fishingMarket';
import { creditSARWallet } from '../../utils/vrWorld/sarEconomy';

// ---------------------------------------------------------------------------
// 个人作弊控件（分支隔离，不触碰原作者逻辑）
// 仅当 ownerId === 'user'（本人）时渲染；通过 creditSARWallet 加币，
// 保留 999,999 上限。控件渲染在 SARHubPanels 仓库面板的钱包余额下方。
// 本文件为新增文件，原作者上游不存在，rebase 时零冲突。
// ---------------------------------------------------------------------------

export function CoinCheatControl({ ownerId, actors, market }: {
  ownerId: string;
  actors: MarketActor[];
  market: FishingMarketState | null;
}) {
  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');

  if (ownerId !== 'user' || !market) return null;

  const onAdd = async () => {
    const value = Number(amount);
    if (!Number.isInteger(value) || value <= 0 || !Number.isSafeInteger(value)) {
      setNotice('请输入大于 0 的整数。');
      return;
    }
    setBusy(true);
    setNotice('');
    try {
      await mutateFishingMarket(s => {
        const next = ensureActorAccounts(s, actors);
        const current = next.accounts[ownerId] ?? 0;
        next.accounts = { ...next.accounts, [ownerId]: creditSARWallet(current, value) };
        return next;
      });
      setAmount('');
      setNotice(`已添加 ${value.toLocaleString()} 鳞币。`);
    } catch (cause) {
      setNotice(cause instanceof Error ? cause.message : '添加失败');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="sar-hub-coin-cheat" style={{ marginTop: '0.75rem' }}>
      <div className="sar-hub-coin-cheat__row">
        <label className="sar-hub-coin-cheat__label">
          自助加币（仅本人）
          <input
            className="fish-input"
            type="number"
            min={1}
            step={1}
            inputMode="numeric"
            value={amount}
            placeholder="数量"
            aria-label="要添加的鳞币数量"
            onChange={e => setAmount(e.target.value)}
            style={{ width: '8rem' }}
          />
        </label>
        <button type="button" className="sar-hub-setting-action" onClick={onAdd} disabled={busy}>
          {busy ? '添加中…' : '添加'}
        </button>
      </div>
      {notice ? <p className="sar-hub-muted" role="status" style={{ marginTop: '0.4rem' }}>{notice}</p> : null}
    </div>
  );
}
