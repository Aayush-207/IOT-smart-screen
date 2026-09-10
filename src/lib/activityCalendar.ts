import fallbackData from './calendarDataFallback.json'

export interface CalendarEvent {
  title: string
  category: string
  club?: string | null
  department?: string | null
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
    badgeClass: 'text-[#ef2045] bg-[#ffeaea] border-[#ef2045]/30 dark:text-[#ef2045] dark:bg-[#ef2045]/10 dark:border-[#ef2045]/20',
    dotClass: 'bg-[#ef2045]',
    borderClass: 'border-l-[#ef2045]',
    accentColor: '#f43f5e',
  },
  'Tech & Hackathons': {
    label: 'Tech & Hackathons',
    badgeClass: 'text-[#3D1165] bg-[#3D1165]/10 border-[#3D1165]/30 dark:text-[#3D1165] dark:bg-[#3D1165]/10 dark:border-[#3D1165]/20',
    dotClass: 'bg-[#3D1165]',
    borderClass: 'border-l-[#3D1165]',
    accentColor: '#6366f1',
  },
  'Sports & Athletics': {
    label: 'Sports & Athletics',
    badgeClass: 'text-[#00eaff] bg-[#00eaff]/10 border-[#00eaff]/30 dark:text-[#00eaff] dark:bg-[#00eaff]/10 dark:border-[#00eaff]/20',
    dotClass: 'bg-[#00eaff]',
    borderClass: 'border-l-[#00eaff]',
    accentColor: '#10b981',
  },
  'Workshops & Seminars': {
    label: 'Workshops & Seminars',
    badgeClass: 'text-[#af1591] bg-[#af1591]/10 border-[#af1591]/30 dark:text-[#af1591] dark:bg-[#af1591]/10 dark:border-[#af1591]/20',
    dotClass: 'bg-[#af1591]',
    borderClass: 'border-l-[#af1591]',
    accentColor: '#f59e0b',
  },
  'Cultural & Campus Life': {
    label: 'Cultural & Campus Life',
    badgeClass: 'text-[#cfa2f7] bg-[#cfa2f7]/10 border-[#cfa2f7]/30 dark:text-[#cfa2f7] dark:bg-[#cfa2f7]/10 dark:border-[#cfa2f7]/20',
    dotClass: 'bg-[#cfa2f7]',
    borderClass: 'border-l-[#cfa2f7]',
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
          const rawItems = cellText
            .split('\n')
            .map((s) => s.trim())
            .filter(Boolean)
            
          const items: string[] = []
          for (let i = 0; i < rawItems.length; i++) {
            const line = rawItems[i]
            if (items.length === 0) {
              items.push(line)
            } else {
              const prev = items[items.length - 1]
              // Check if the line is a continuation of the previous event
              // e.g., starts with '(', lowercase letter, or version number like '2.0'
              const isContinuation = 
                /^\(/.test(line) || 
                /^[a-z]/.test(line) || 
                /^\d+\.\d+/.test(line)
                
              if (isContinuation) {
                items[items.length - 1] = prev + ' ' + line
              } else {
                items.push(line)
              }
            }
          }

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
            let department: string | null = null
            const allMatches = [...item.matchAll(/\(([^)]+)\)/g)]
            if (allMatches.length > 0) {
              // Get the last set of parentheses that isn't a date/time/holiday
              for (let i = allMatches.length - 1; i >= 0; i--) {
                const matchedInside = allMatches[i][1].trim()
                if (
                  !/^\d+\s*(?:to|-)\s*\d+$/i.test(matchedInside) &&
                  !/^holiday$/i.test(matchedInside) &&
                  !/^\d{1,2}:\d{2}/.test(matchedInside) &&
                  !/^\d{1,2}(st|nd|rd|th)/i.test(matchedInside)
                ) {
                  const upper = matchedInside.toUpperCase()
                  const isDept =
                    upper.includes('SHD') || upper.includes('MANET') || upper.includes('SVS') ||
                    upper.includes('MITCOM') || upper.includes('SAP') || upper.includes('SOC') ||
                    upper.includes('SOFT') || upper.includes('SOH') || upper.includes('SOER') ||
                    upper.includes('SOD') || upper.includes('SCIL') || upper.includes('SOES') ||
                    upper.includes('SPES') || upper.includes('BIOENGINEERING') || upper.includes('PSYCHOLOGY') ||
                    upper.includes('SICS')

                  if (isDept && !upper.includes('CLUB')) {
                    department = matchedInside
                  } else {
                    club = matchedInside
                  }
                  break
                }
              }
            }

            dayObj.events.push({
              title: item,
              category,
              club,
              department,
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

export async function fetchClubsMapping(): Promise<Record<string, string>> {
  const url = `https://docs.google.com/spreadsheets/d/1DUIFEJNlvkBvof1FB5jK4tF35tyD9Err8PF-ozT6SW8/export?format=csv&gid=380806459`
  try {
    const res = await fetch(url, { next: { revalidate: 3600 } })
    if (!res.ok) return {}
    const csvText = await res.text()
    const rows = parseCSV(csvText)
    const map: Record<string, string> = {}
    let currentSchool = ''
    for (let i = 2; i < rows.length; i++) {
      const row = rows[i]
      if (row.length < 4) continue
      const schoolCol = row[1]?.trim()
      const sForm = row[3]?.trim()
      if (schoolCol) {
        currentSchool = schoolCol
      }
      if (sForm && currentSchool) {
        map[sForm.toUpperCase()] = currentSchool
      }
      const clubName = row[2]?.trim()
      if (clubName && currentSchool) {
        map[clubName.toUpperCase()] = currentSchool
      }
    }
    return map
  } catch (err) {
    console.warn('[ActivityCalendar] Failed to fetch clubs mapping:', err)
    return {}
  }
}

function applyClubsMapping(data: MonthCalendarData, clubsMap: Record<string, string>) {
  const MANUAL_OVERRIDES: Record<string, string> = {
    'CYBERSHAKTI CELL': 'MIT-SOC',
    'AWS': 'MIT-SOC',
    'SAE CLUB': 'MIT-SOES',
    'SAE & SPEEDTAIL RACING CLUB': 'MIT-SOES',
    'SPEEDTAIL RACING & SAE CLUB': 'MIT-SOES',
    'LFAC CLUB': 'MIT-SOES',
    'INFUSION CLUB': 'MIT-SFT',
    'ADVENTURE CLUB': 'MIT-ADTU',
    'IIC': 'MIT-SOC',
    '(IIC': 'MIT-SOC',
    'IIC+AIC': 'MIT-SOC',
    'AIC': 'MIT-SOC',
    'IPR&TTO': 'MIT-SOC',
    'IPR-TTO': 'MIT-SOC',
    'SAP-HERITAGE CLUB': 'MIT-SOA',
    'ASTRA': 'MIT-SOC',
    'ACM_W': 'MIT-SOC',
    'HR CLUB-MITCOM': 'MITCOM',
    'LAVERIC': 'MITCOM',
    'LAVERIC CLUB': 'MITCOM',
    'OIA': 'MIT-ADTU',
    'IEEE STD. CHAPTER': 'MIT-SOC',
    'MACC CLUB': 'MIT-SOC',
    'EV CLUB': 'MIT-SOES',
    'EV & MESA CLUB': 'MIT-SOES',
    'MESA & EV CLUB': 'MIT-SOES',
    'EV, MESA CLUB&CESA': 'MIT-SOES',
    'ASHRAE CLUB': 'MIT-SOES',
    'ASHRAE & MESA CLUB': 'MIT-SOES',
    'CODE VERSE': 'MIT-SOC',
    'SWIFT CODING': 'MIT-SOC',
    'PANCHAYATI & KALAKRITI': 'MIT-ADTU',
    'NSS': 'MIT-ADTU',
    'CRICKET': 'MIT-ADTU',
  }

  for (const ev of data.events) {
    if (ev.club && !ev.department) {
      const upper = ev.club.toUpperCase()
      const mappedDept = MANUAL_OVERRIDES[upper] || clubsMap[upper]
      if (mappedDept) ev.department = mappedDept
    }
  }
  for (const week of data.weeks) {
    if (week) {
      for (const day of week) {
        if (day) {
          for (const ev of day.events) {
            if (ev.club && !ev.department) {
              const upper = ev.club.toUpperCase()
              const mappedDept = MANUAL_OVERRIDES[upper] || clubsMap[upper]
              if (mappedDept) ev.department = mappedDept
            }
          }
        }
      }
    }
  }
}

export async function fetchCalendarMonthData(
  config: MonthConfig,
  clubsMap: Record<string, string> = {}
): Promise<MonthCalendarData> {
  const url = `https://docs.google.com/spreadsheets/d/1DUIFEJNlvkBvof1FB5jK4tF35tyD9Err8PF-ozT6SW8/export?format=csv&gid=${config.gid}`
  try {
    const res = await fetch(url, { next: { revalidate: 300 } })
    if (!res.ok) {
      throw new Error(`Failed to fetch sheet: HTTP ${res.status}`)
    }
    const csvText = await res.text()
    const rows = parseCSV(csvText)
    const parsedData = parseMonthSheet(rows, config)
    applyClubsMapping(parsedData, clubsMap)
    return parsedData
  } catch (err) {
    console.warn(`[ActivityCalendar] Live fetch failed for ${config.name}, using fallback:`, err)
    const found = fallbackData.months.find((m) => m.id === config.id)
    if (found?.data) {
      const data = JSON.parse(JSON.stringify(found.data)) as MonthCalendarData
      applyClubsMapping(data, clubsMap)
      return data
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
  const clubsMap = await fetchClubsMapping()

  // Pre-loaded fallback provides instantaneous response for all 9 months
  const fallbackMap: Record<string, MonthCalendarData> = {}
  if (fallbackData?.months && Array.isArray(fallbackData.months)) {
    for (const item of fallbackData.months) {
      if (item?.id && item?.data) {
        const data = JSON.parse(JSON.stringify(item.data)) as MonthCalendarData
        applyClubsMapping(data, clubsMap)
        fallbackMap[item.id] = data
      }
    }
  }

  // If fallback has all configs, return immediately for instant server rendering
  if (Object.keys(fallbackMap).length >= MONTH_CONFIGS.length) {
    return fallbackMap
  }

  const entries = await Promise.all(
    MONTH_CONFIGS.map(async (cfg) => {
      const data = await fetchCalendarMonthData(cfg, clubsMap)
      return [cfg.id, data] as const
    })
  )
  return Object.fromEntries(entries)
}
