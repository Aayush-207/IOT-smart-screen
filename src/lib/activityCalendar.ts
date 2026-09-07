import fallbackData from './calendarDataFallback.json'

export interface CalendarEvent {
  title: string
  category: string
  club?: string | null
  dateStr?: string
  dayNum?: number
  dayOfWeek?: string
}

export interface CalendarDay {
  dateStr: string
  dayNum: number
  dayOfWeek: string
  isCurrentMonth: boolean
  events: CalendarEvent[]
}

export interface MonthCalendarData {
  id: string
  title: string
  shortName?: string
  term?: string
  year: number
  month: number
  weeks: (CalendarDay | null)[][]
  events: CalendarEvent[]
  totalEvents: number
}

export interface MonthConfig {
  id: string
  name: string
  shortName: string
  term: 'Odd Semester' | 'Even Semester'
  gid: string
  year: number
  month: number
}

export const MONTH_CONFIGS: MonthConfig[] = [
  {
    id: '2026-09',
    name: 'September 2026',
    shortName: 'Sep 2026',
    term: 'Odd Semester',
    gid: '426735830',
    year: 2026,
    month: 9,
  },
  {
    id: '2026-10',
    name: 'October 2026',
    shortName: 'Oct 2026',
    term: 'Odd Semester',
    gid: '2047089881',
    year: 2026,
    month: 10,
  },
  {
    id: '2026-11',
    name: 'November 2026',
    shortName: 'Nov 2026',
    term: 'Odd Semester',
    gid: '1215803459',
    year: 2026,
    month: 11,
  },
  {
    id: '2026-12',
    name: 'December 2026',
    shortName: 'Dec 2026',
    term: 'Odd Semester',
    gid: '1343657438',
    year: 2026,
    month: 12,
  },
  {
    id: '2027-01',
    name: 'January 2027',
    shortName: 'Jan 2027',
    term: 'Even Semester',
    gid: '1339569430',
    year: 2027,
    month: 1,
  },
  {
    id: '2027-02',
    name: 'February 2027',
    shortName: 'Feb 2027',
    term: 'Even Semester',
    gid: '1733404311',
    year: 2027,
    month: 2,
  },
  {
    id: '2027-03',
    name: 'March 2027',
    shortName: 'Mar 2027',
    term: 'Even Semester',
    gid: '18478995',
    year: 2027,
    month: 3,
  },
  {
    id: '2027-04',
    name: 'April 2027',
    shortName: 'Apr 2027',
    term: 'Even Semester',
    gid: '726333162',
    year: 2027,
    month: 4,
  },
  {
    id: '2027-05',
    name: 'May 2027',
    shortName: 'May 2027',
    term: 'Even Semester',
    gid: '1736853873',
    year: 2027,
    month: 5,
  },
]

export const CATEGORY_STYLES: Record<
  string,
  {
    label: string
    badgeClass: string
    dotClass: string
    borderClass: string
    accentColor: string
  }
> = {
  'Holiday & Festival': {
    label: 'Holidays & Festivals',
    badgeClass: 'text-rose-700 bg-rose-50 border-rose-200 dark:text-rose-400 dark:bg-rose-500/10 dark:border-rose-500/20',
    dotClass: 'bg-rose-500',
    borderClass: 'border-l-rose-500',
    accentColor: '#f43f5e',
  },
  'Tech & Hackathons': {
    label: 'Tech & Hackathons',
    badgeClass: 'text-indigo-700 bg-indigo-50 border-indigo-200 dark:text-indigo-400 dark:bg-indigo-500/10 dark:border-indigo-500/20',
    dotClass: 'bg-indigo-500',
    borderClass: 'border-l-indigo-500',
    accentColor: '#6366f1',
  },
  'Sports & Athletics': {
    label: 'Sports & Athletics',
    badgeClass: 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-500/10 dark:border-emerald-500/20',
    dotClass: 'bg-emerald-500',
    borderClass: 'border-l-emerald-500',
    accentColor: '#10b981',
  },
  'Workshops & Seminars': {
    label: 'Workshops & Seminars',
    badgeClass: 'text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-500/10 dark:border-amber-500/20',
    dotClass: 'bg-amber-500',
    borderClass: 'border-l-amber-500',
    accentColor: '#f59e0b',
  },
  'Cultural & Campus Life': {
    label: 'Cultural & Campus Life',
    badgeClass: 'text-fuchsia-700 bg-fuchsia-50 border-fuchsia-200 dark:text-fuchsia-400 dark:bg-fuchsia-500/10 dark:border-fuchsia-500/20',
    dotClass: 'bg-fuchsia-500',
    borderClass: 'border-l-fuchsia-500',
    accentColor: '#d946ef',
  },
  'Trek & Adventure': {
    label: 'Trek & Adventure',
    badgeClass: 'text-teal-700 bg-teal-50 border-teal-200 dark:text-teal-400 dark:bg-teal-500/10 dark:border-teal-500/20',
    dotClass: 'bg-teal-500',
    borderClass: 'border-l-teal-500',
    accentColor: '#14b8a6',
  },
  'Alumni & Careers': {
    label: 'Alumni & Careers',
    badgeClass: 'text-sky-700 bg-sky-50 border-sky-200 dark:text-sky-400 dark:bg-sky-500/10 dark:border-sky-500/20',
    dotClass: 'bg-sky-500',
    borderClass: 'border-l-sky-500',
    accentColor: '#0ea5e9',
  },
  'Academic & General': {
    label: 'Academic & General',
    badgeClass: 'text-neutral-700 bg-neutral-100 border-neutral-200 dark:text-neutral-300 dark:bg-neutral-800 dark:border-neutral-700',
    dotClass: 'bg-neutral-400',
    borderClass: 'border-l-neutral-400',
    accentColor: '#737373',
  },
}

function parseCSV(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let inQuotes = false

  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    const next = text[i + 1]
    if (c === '"') {
      if (inQuotes && next === '"') {
        cell += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (c === ',' && !inQuotes) {
      row.push(cell.trim())
      cell = ''
    } else if ((c === '\r' || c === '\n') && !inQuotes) {
      if (c === '\r' && next === '\n') i++
      row.push(cell.trim())
      if (row.some((x) => x !== '')) rows.push(row)
      row = []
      cell = ''
    } else {
      cell += c
    }
  }
  if (cell || row.length > 0) {
    row.push(cell.trim())
    if (row.some((x) => x !== '')) rows.push(row)
  }
  return rows
}

function parseMonthSheet(rows: string[][], monthCfg: MonthConfig): MonthCalendarData {
  const { id: monthId, name: monthTitle, year: targetYear, month: targetMonth, shortName, term } = monthCfg
  const daysOfWeek = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ]
  const weeks: (CalendarDay | null)[][] = []
  let currentWeek: (CalendarDay | null)[] | null = null
  let weekIndex = 0

  for (let r = 2; r < rows.length; r++) {
    const row = rows[r]
    const numMatches = row.slice(0, 7).filter((cell) => /^\d{1,2}$/.test(cell.trim()))

    if (
      row[0] &&
      (row[0].toLowerCase().includes('holiday') ||
        row[0].toLowerCase().includes('university flagship') ||
        row[0].toLowerCase().includes('socio-economical'))
    ) {
      break
    }

    if (numMatches.length >= 4) {
      currentWeek = []
      for (let col = 0; col < 7; col++) {
        const rawCell = row[col] ? row[col].trim() : ''
        const val = /^\d{1,2}$/.test(rawCell) ? parseInt(rawCell) : null
        if (val !== null) {
          let m = targetMonth
          let y = targetYear
          if (weekIndex === 0 && val > 20) {
            m = targetMonth === 1 ? 12 : targetMonth - 1
            if (targetMonth === 1) y -= 1
          } else if (weekIndex >= 4 && val < 15) {
            m = targetMonth === 12 ? 1 : targetMonth + 1
            if (targetMonth === 12) y += 1
          }
          const isCurrentMonth = m === targetMonth
          const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(val).padStart(2, '0')}`
          currentWeek.push({
            dateStr,
            dayNum: val,
            dayOfWeek: daysOfWeek[col],
            isCurrentMonth,
            events: [],
          })
        } else {
          currentWeek.push(null)
        }
      }
      weeks.push(currentWeek)
      weekIndex++
    } else if (currentWeek) {
      for (let col = 0; col < 7; col++) {
        const dayObj = currentWeek[col]
        if (!dayObj) continue
        const cellText = (row[col] || '').trim()
        if (cellText) {
          const items = cellText
            .split('\n')
            .map((s) => s.trim())
            .filter(Boolean)
          for (const item of items) {
            let category = 'Academic & General'
            const lower = item.toLowerCase()
            if (
              lower.includes('holiday') ||
              lower.includes('jayanti') ||
              lower.includes('festival') ||
              lower.includes('puja') ||
              lower.includes('poojan') ||
              lower.includes('chaturthi') ||
              lower.includes('visarjan') ||
              lower.includes('diwali') ||
              lower.includes('dasara') ||
              lower.includes('dussehra') ||
              lower.includes('eid') ||
              lower.includes('christmas') ||
              lower.includes('good friday') ||
              lower.includes('republic') ||
              lower.includes('independence') ||
              lower.includes('mahashivratri') ||
              lower.includes('holi') ||
              lower.includes('ram navami') ||
              lower.includes('ambedkar')
            ) {
              category = 'Holiday & Festival'
            } else if (
              lower.includes('inter collegiate') ||
              lower.includes('badminton') ||
              lower.includes('tennis') ||
              lower.includes('football') ||
              lower.includes('cricket') ||
              lower.includes('boxing') ||
              lower.includes('volleyball') ||
              lower.includes('rowing') ||
              lower.includes('chess') ||
              lower.includes('kabaddi') ||
              lower.includes('swimming') ||
              lower.includes('triathlon') ||
              lower.includes('kho-kho') ||
              lower.includes('yoga') ||
              lower.includes('athletics') ||
              lower.includes('sports') ||
              lower.includes('tournament') ||
              lower.includes('championship')
            ) {
              category = 'Sports & Athletics'
            } else if (
              lower.includes('hackathon') ||
              lower.includes('ctf') ||
              lower.includes('code') ||
              lower.includes('ai ') ||
              lower.includes('swift') ||
              lower.includes('linux') ||
              lower.includes('arcade') ||
              lower.includes('coding') ||
              lower.includes('developer') ||
              lower.includes('robotics') ||
              lower.includes('cyber')
            ) {
              category = 'Tech & Hackathons'
            } else if (
              lower.includes('workshop') ||
              lower.includes('bootcamp') ||
              lower.includes('training') ||
              lower.includes('session') ||
              lower.includes('webinar') ||
              lower.includes('conference') ||
              lower.includes('lecture') ||
              lower.includes('seminar') ||
              lower.includes('talk') ||
              lower.includes('symposium')
            ) {
              category = 'Workshops & Seminars'
            } else if (
              lower.includes('trek') ||
              lower.includes('trail') ||
              lower.includes('waterfall') ||
              lower.includes('fort') ||
              lower.includes('jungle') ||
              lower.includes('camp') ||
              lower.includes('hike')
            ) {
              category = 'Trek & Adventure'
            } else if (
              lower.includes('alumni') ||
              lower.includes('convocation') ||
              lower.includes('placement') ||
              lower.includes('career') ||
              lower.includes('orientation') ||
              lower.includes('internship')
            ) {
              category = 'Alumni & Careers'
            } else if (
              lower.includes('celebration') ||
              lower.includes('drive') ||
              lower.includes('campaign') ||
              lower.includes('exhibition') ||
              lower.includes('natak') ||
              lower.includes('play') ||
              lower.includes('garba') ||
              lower.includes('dance') ||
              lower.includes('competition') ||
              lower.includes('music') ||
              lower.includes('cultural') ||
              lower.includes('carnival') ||
              lower.includes('nss') ||
              lower.includes('rotaract') ||
              lower.includes('fest')
            ) {
              category = 'Cultural & Campus Life'
            }

            let club: string | null = null
            const clubMatch = item.match(/\(([^)]+)\)$/)
            if (clubMatch) {
              const matchedInside = clubMatch[1].trim()
              if (
                !/^\d+\s*(to|-)\s*\d+$/i.test(matchedInside) &&
                !/^holiday$/i.test(matchedInside)
              ) {
                club = matchedInside
              }
            }

            dayObj.events.push({
              title: item,
              category,
              club,
            })
          }
        }
      }
    }
  }

  const allDays = weeks.flat().filter(Boolean) as CalendarDay[]
  const events: CalendarEvent[] = []
  for (const day of allDays) {
    if (day.isCurrentMonth) {
      for (const ev of day.events) {
        events.push({
          dateStr: day.dateStr,
          dayNum: day.dayNum,
          dayOfWeek: day.dayOfWeek,
          ...ev,
        })
      }
    }
  }

  return {
    id: monthId,
    title: monthTitle,
    shortName,
    term,
    year: targetYear,
    month: targetMonth,
    weeks,
    events,
    totalEvents: events.length,
  }
}

export async function fetchCalendarMonthData(
  config: MonthConfig
): Promise<MonthCalendarData> {
  const url = `https://docs.google.com/spreadsheets/d/1DUIFEJNlvkBvof1FB5jK4tF35tyD9Err8PF-ozT6SW8/export?format=csv&gid=${config.gid}`
  try {
    const res = await fetch(url, { next: { revalidate: 300 } })
    if (!res.ok) {
      throw new Error(`Failed to fetch sheet: HTTP ${res.status}`)
    }
    const csvText = await res.text()
    const rows = parseCSV(csvText)
    return parseMonthSheet(rows, config)
  } catch (err) {
    console.warn(`[ActivityCalendar] Live fetch failed for ${config.name}, using fallback:`, err)
    const found = fallbackData.months.find((m) => m.id === config.id)
    if (found?.data) {
      return found.data as unknown as MonthCalendarData
    }
    return {
      id: config.id,
      title: config.name,
      shortName: config.shortName,
      term: config.term,
      year: config.year,
      month: config.month,
      weeks: [],
      events: [],
      totalEvents: 0,
    }
  }
}

export async function getAllMonthsCalendarData(): Promise<
  Record<string, MonthCalendarData>
> {
  // Pre-loaded fallback provides instantaneous sub-10ms response for all 9 months
  const fallbackMap: Record<string, MonthCalendarData> = {}
  if (fallbackData?.months && Array.isArray(fallbackData.months)) {
    for (const item of fallbackData.months) {
      if (item?.id && item?.data) {
        fallbackMap[item.id] = item.data as unknown as MonthCalendarData
      }
    }
  }

  // If fallback has all configs, return immediately for instant server rendering
  if (Object.keys(fallbackMap).length >= MONTH_CONFIGS.length) {
    return fallbackMap
  }

  const entries = await Promise.all(
    MONTH_CONFIGS.map(async (cfg) => {
      const data = await fetchCalendarMonthData(cfg)
      return [cfg.id, data] as const
    })
  )
  return Object.fromEntries(entries)
}
