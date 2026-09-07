const fs = require('fs');

const ALL_MONTHS = [
  { id: '2026-09', name: 'September 2026', shortName: 'Sep 2026', term: 'Odd Semester', year: 2026, month: 9, gid: '426735830' },
  { id: '2026-10', name: 'October 2026', shortName: 'Oct 2026', term: 'Odd Semester', year: 2026, month: 10, gid: '2047089881' },
  { id: '2026-11', name: 'November 2026', shortName: 'Nov 2026', term: 'Odd Semester', year: 2026, month: 11, gid: '1215803459' },
  { id: '2026-12', name: 'December 2026', shortName: 'Dec 2026', term: 'Odd Semester', year: 2026, month: 12, gid: '1343657438' },
  { id: '2027-01', name: 'January 2027', shortName: 'Jan 2027', term: 'Even Semester', year: 2027, month: 1, gid: '1339569430' },
  { id: '2027-02', name: 'February 2027', shortName: 'Feb 2027', term: 'Even Semester', year: 2027, month: 2, gid: '1733404311' },
  { id: '2027-03', name: 'March 2027', shortName: 'Mar 2027', term: 'Even Semester', year: 2027, month: 3, gid: '18478995' },
  { id: '2027-04', name: 'April 2027', shortName: 'Apr 2027', term: 'Even Semester', year: 2027, month: 4, gid: '726333162' },
  { id: '2027-05', name: 'May 2027', shortName: 'May 2027', term: 'Even Semester', year: 2027, month: 5, gid: '1736853873' },
];

function parseCSV(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    const next = text[i + 1];
    if (c === '"') {
      if (inQuotes && next === '"') { cell += '"'; i++; }
      else { inQuotes = !inQuotes; }
    } else if (c === ',' && !inQuotes) {
      row.push(cell.trim());
      cell = '';
    } else if ((c === '\r' || c === '\n') && !inQuotes) {
      if (c === '\r' && next === '\n') i++;
      row.push(cell.trim());
      if (row.some(x => x !== '')) rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += c;
    }
  }
  if (cell || row.length > 0) {
    row.push(cell.trim());
    if (row.some(x => x !== '')) rows.push(row);
  }
  return rows;
}

function parseMonthSheet(rows, monthCfg) {
  const { id: monthId, name: monthTitle, year: targetYear, month: targetMonth } = monthCfg;
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const weeks = [];
  let currentWeek = null;
  let weekIndex = 0;

  for (let r = 2; r < rows.length; r++) {
    const row = rows[r];
    const numMatches = row.slice(0, 7).filter(cell => /^\d{1,2}$/.test(cell.trim()));
    
    if (row[0] && (row[0].toLowerCase().includes('holiday') || row[0].toLowerCase().includes('university flagship') || row[0].toLowerCase().includes('socio-economical'))) {
      break;
    }

    if (numMatches.length >= 4) {
      currentWeek = [];
      for (let col = 0; col < 7; col++) {
        const rawCell = row[col] ? row[col].trim() : '';
        const val = /^\d{1,2}$/.test(rawCell) ? parseInt(rawCell) : null;
        if (val !== null) {
          let m = targetMonth;
          let y = targetYear;
          if (weekIndex === 0 && val > 20) {
            m = targetMonth === 1 ? 12 : targetMonth - 1;
            if (targetMonth === 1) y -= 1;
          } else if (weekIndex >= 4 && val < 15) {
            m = targetMonth === 12 ? 1 : targetMonth + 1;
            if (targetMonth === 12) y += 1;
          }
          const isCurrentMonth = m === targetMonth;
          const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(val).padStart(2, '0')}`;
          currentWeek.push({
            dateStr,
            dayNum: val,
            dayOfWeek: daysOfWeek[col],
            isCurrentMonth,
            events: []
          });
        } else {
          currentWeek.push(null);
        }
      }
      weeks.push(currentWeek);
      weekIndex++;
    } else if (currentWeek) {
      for (let col = 0; col < 7; col++) {
        const dayObj = currentWeek[col];
        if (!dayObj) continue;
        const cellText = (row[col] || '').trim();
        if (cellText) {
          const items = cellText.split('\n').map(s => s.trim()).filter(Boolean);
          for (const item of items) {
            let category = 'Academic & General';
            const lower = item.toLowerCase();
            if (lower.includes('holiday') || lower.includes('jayanti') || lower.includes('festival') || lower.includes('puja') || lower.includes('poojan') || lower.includes('chaturthi') || lower.includes('visarjan') || lower.includes('diwali') || lower.includes('dasara') || lower.includes('dussehra') || lower.includes('eid') || lower.includes('christmas') || lower.includes('good friday') || lower.includes('republic') || lower.includes('independence') || lower.includes('mahashivratri') || lower.includes('holi') || lower.includes('ram navami') || lower.includes('ambedkar')) {
              category = 'Holiday & Festival';
            } else if (lower.includes('inter collegiate') || lower.includes('badminton') || lower.includes('tennis') || lower.includes('football') || lower.includes('cricket') || lower.includes('boxing') || lower.includes('volleyball') || lower.includes('rowing') || lower.includes('chess') || lower.includes('kabaddi') || lower.includes('swimming') || lower.includes('triathlon') || lower.includes('kho-kho') || lower.includes('yoga') || lower.includes('athletics') || lower.includes('sports') || lower.includes('tournament') || lower.includes('championship')) {
              category = 'Sports & Athletics';
            } else if (lower.includes('hackathon') || lower.includes('ctf') || lower.includes('code') || lower.includes('ai ') || lower.includes('swift') || lower.includes('linux') || lower.includes('arcade') || lower.includes('coding') || lower.includes('developer') || lower.includes('robotics') || lower.includes('cyber')) {
              category = 'Tech & Hackathons';
            } else if (lower.includes('workshop') || lower.includes('bootcamp') || lower.includes('training') || lower.includes('session') || lower.includes('webinar') || lower.includes('conference') || lower.includes('lecture') || lower.includes('seminar') || lower.includes('talk') || lower.includes('symposium')) {
              category = 'Workshops & Seminars';
            } else if (lower.includes('trek') || lower.includes('trail') || lower.includes('waterfall') || lower.includes('fort') || lower.includes('jungle') || lower.includes('camp') || lower.includes('hike')) {
              category = 'Trek & Adventure';
            } else if (lower.includes('alumni') || lower.includes('convocation') || lower.includes('placement') || lower.includes('career') || lower.includes('orientation') || lower.includes('internship')) {
              category = 'Alumni & Careers';
            } else if (lower.includes('celebration') || lower.includes('drive') || lower.includes('campaign') || lower.includes('exhibition') || lower.includes('natak') || lower.includes('play') || lower.includes('garba') || lower.includes('dance') || lower.includes('competition') || lower.includes('music') || lower.includes('cultural') || lower.includes('carnival') || lower.includes('nss') || lower.includes('rotaract') || lower.includes('fest')) {
              category = 'Cultural & Campus Life';
            }

            let club = null;
            const clubMatch = item.match(/\(([^)]+)\)$/);
            if (clubMatch) {
              const matchedInside = clubMatch[1].trim();
              if (!/^\d+\s*(to|-)\s*\d+$/i.test(matchedInside) && !/^holiday$/i.test(matchedInside)) {
                club = matchedInside;
              }
            }

            dayObj.events.push({
              title: item,
              category,
              club
            });
          }
        }
      }
    }
  }

  const allDays = weeks.flat().filter(Boolean);
  const events = [];
  for (const day of allDays) {
    if (day.isCurrentMonth) {
      for (const ev of day.events) {
        events.push({
          dateStr: day.dateStr,
          dayNum: day.dayNum,
          dayOfWeek: day.dayOfWeek,
          ...ev
        });
      }
    }
  }

  return {
    id: monthId,
    title: monthTitle,
    shortName: monthCfg.shortName,
    term: monthCfg.term,
    year: targetYear,
    month: targetMonth,
    weeks,
    events,
    totalEvents: events.length
  };
}

async function buildAllMonths() {
  console.log(`Fetching ${ALL_MONTHS.length} months of calendar data...`);
  const results = [];

  for (const cfg of ALL_MONTHS) {
    const url = `https://docs.google.com/spreadsheets/d/1DUIFEJNlvkBvof1FB5jK4tF35tyD9Err8PF-ozT6SW8/export?format=csv&gid=${cfg.gid}`;
    try {
      const res = await fetch(url);
      const text = await res.text();
      const parsedData = parseMonthSheet(parseCSV(text), cfg);
      console.log(`✓ ${cfg.name} (${cfg.gid}): ${parsedData.totalEvents} events parsed across ${parsedData.weeks.length} weeks.`);
      results.push({
        id: cfg.id,
        name: cfg.name,
        shortName: cfg.shortName,
        term: cfg.term,
        gid: cfg.gid,
        year: cfg.year,
        month: cfg.month,
        data: parsedData
      });
    } catch (err) {
      console.error(`✗ Error fetching ${cfg.name}:`, err);
    }
  }

  const output = {
    months: results,
    updatedAt: new Date().toISOString()
  };

  fs.writeFileSync('src/lib/calendarDataFallback.json', JSON.stringify(output, null, 2));
  console.log(`Successfully generated and cached ${results.length} months into src/lib/calendarDataFallback.json!`);
}

buildAllMonths().catch(err => {
  console.error(err);
  process.exit(1);
});
