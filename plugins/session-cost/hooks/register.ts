import type { EngineInterface, Register, SessionCost, SessionRateLimit } from 'claude-code'

// The plan's price is spread over the weekly limit: 1% of the week is worth
// weeklyPrice / 100. How many API dollars fill 1% is not published, so it is
// measured: every session running this mod logs its API-rate spend per weekly
// window in $.store, and the sum is divided by how far the window moved.

type Window = { basePercent: number }
type Spend = { from: number; usd: number }
type Rate = { usdPerPercent: number; at: number }
type Memo = {
  weeklyPrice: number
  weeklyApiValue: number
  sessionKey?: string
  lastUsd?: number
  others: { key: string; usd: number; at: number }
}

const HOUR = 3_600_000
const MIN_POINTS = 2
const OTHERS_TTL = 5 * 60_000

const money = (usd: number) => `$${usd < 10 ? usd.toFixed(2) : usd.toFixed(usd < 100 ? 1 : 0)}`
const windowKey = (resetsAt: string) =>
  new Date(Math.round(Date.parse(resetsAt) / HOUR) * HOUR).toISOString().slice(0, 13)

async function othersSpend($: EngineInterface, memo: Memo, week: string, mine: string, now: number) {
  if (memo.others.key === week && now - memo.others.at < OTHERS_TTL) return memo.others.usd
  let usd = 0
  for (const key of await $.store.keys()) {
    if (key.startsWith(`s|${week}|`) && key !== mine) {
      usd += ((await $.store.get(key)) as Spend | undefined)?.usd ?? 0
    }
  }
  memo.others = { key: week, usd, at: now }
  return usd
}

async function latestRate($: EngineInterface) {
  let best: Rate | undefined
  for (const key of await $.store.keys()) {
    if (!key.startsWith('r|')) continue
    const rate = (await $.store.get(key)) as Rate | undefined
    if (rate && (!best || rate.at > best.at)) best = rate
  }
  return best
}

async function prune($: EngineInterface, now: number) {
  for (const key of await $.store.keys()) {
    const reset = Date.parse(`${key.split('|')[1]}:00:00Z`)
    const keepFor = key.startsWith('r|') ? 60 * 24 * HOUR : 24 * HOUR
    if (Number.isFinite(reset) && now - reset > keepFor) await $.store.delete(key)
  }
}

async function show(
  $: EngineInterface,
  memo: Memo,
  cost: SessionCost | undefined,
  rateLimits: readonly SessionRateLimit[],
) {
  if (!cost) return
  const usd = cost.usd
  const weekly = rateLimits.find(limit => limit.kind === 'seven_day')
  const fiveHour = rateLimits.find(limit => limit.kind === 'five_hour')
  const api = `${money(usd)} at API rates`

  if (!weekly?.resetsAt || memo.weeklyPrice === 0) {
    $.ui.status(usd > 0 ? `session ${api}` : undefined)
    return
  }

  const now = await $.clock.now()
  memo.sessionKey ??= String((await $.session.usage()).startedAt)
  const week = windowKey(weekly.resetsAt)
  const mineKey = `s|${week}|${memo.sessionKey}`

  let held = (await $.store.get(`w|${week}`)) as Window | undefined
  if (!held) {
    held = { basePercent: weekly.percentUsed }
    await $.store.set(`w|${week}`, held)
  }

  const mine = ((await $.store.get(mineKey)) as Spend | undefined) ?? { from: memo.lastUsd ?? usd, usd: 0 }
  mine.usd = Math.max(0, usd - mine.from)
  await $.store.set(mineKey, mine)
  memo.lastUsd = usd

  const points = weekly.percentUsed - held.basePercent
  const logged = mine.usd + (await othersSpend($, memo, week, mineKey, now))
  let rate = memo.weeklyApiValue > 0 ? { usdPerPercent: memo.weeklyApiValue / 100, at: now } : await latestRate($)
  if (memo.weeklyApiValue === 0 && points >= MIN_POINTS && logged > 0) {
    rate = { usdPerPercent: logged / points, at: now }
    await $.store.set(`r|${week}`, rate)
  }

  const limits = `week ${Math.round(weekly.percentUsed)}%${fiveHour ? `, 5h ${Math.round(fiveHour.percentUsed)}%` : ''} used`
  if (!rate) {
    $.ui.status(`session ${api} · plan share calibrating · ${limits}`)
    return
  }
  const weekShare = usd / rate.usdPerPercent
  const plan = (weekShare * memo.weeklyPrice) / 100
  $.ui.status(`session ≈ €${money(plan).slice(1)} of plan (${weekShare.toFixed(1)}% of week) · ${api} · ${limits}`)
}

export const register: Register = (on, options) => {
  const memo: Memo = {
    weeklyPrice: ((Number(options.monthlyPrice) || 0) * 12) / 52,
    weeklyApiValue: Number(options.weeklyApiValue) || 0,
    others: { key: '', usd: 0, at: 0 },
  }

  on('session.start', async ($, e, next) => {
    const usage = await $.session.usage()
    memo.sessionKey = String(usage.startedAt)
    memo.lastUsd ??= usage.cost?.usd
    await prune($, await $.clock.now())
    await show($, memo, usage.cost, usage.rateLimits)
    return next(e)
  })

  on('session.measure', async ($, e, next) => {
    await show($, memo, e.cost, e.rateLimits)
    return next(e)
  })
}
