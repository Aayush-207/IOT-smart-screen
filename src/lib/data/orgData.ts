export interface EventSummary {
  id: string;
  name: string;
  category: string;
  dateStr: string;
}

export interface Club {
  id: string;
  name: string;
  shortName: string;
  facultyAdvisor: string;
  events: EventSummary[];
}

export interface School {
  id: string;
  name: string;
  totalEvents: number;
  clubs: Club[];
}

// Generate some placeholder events for clubs since the CSV only provided counts
const generatePlaceholderEvents = (count: number, prefix: string): EventSummary[] => {
  const categories = ['General / Academic / Technical', 'Workshop / Conferences & Sessions', 'Cultural & Performing Arts', 'Sports', 'Socio-economical'];
  return Array.from({ length: count }).map((_, i) => ({
    id: `evt-${prefix}-${i}`,
    name: `Annual ${categories[i % categories.length]} Activity ${2026}`,
    category: categories[i % categories.length],
    dateStr: `Oct ${10 + (i % 20)}, 2026`,
  }));
};

export const ORG_DATA: School[] = [
  {
    id: 's1',
    name: 'MIT-SOES (School of Engineering & Science)',
    totalEvents: 49,
    clubs: [
      { id: 'c1', name: 'Civil Engineering Students Association', shortName: 'CESA', facultyAdvisor: 'Prof. Sagar Sonawane', events: generatePlaceholderEvents(5, 'soes1') },
      { id: 'c2', name: 'ASHRAE Student Chapter', shortName: 'ASHRAE', facultyAdvisor: 'Prof. Dr. Prashant Patunkar', events: generatePlaceholderEvents(4, 'soes2') },
      { id: 'c3', name: 'Laggar Falcon Aero Club', shortName: 'LFAC', facultyAdvisor: 'Prof. Krishna Jadhav', events: generatePlaceholderEvents(3, 'soes3') },
      { id: 'c4', name: 'Mechanical Engineering Student Association', shortName: 'MESA', facultyAdvisor: 'Prof. Shashank S. Gawade', events: generatePlaceholderEvents(6, 'soes4') },
      { id: 'c5', name: 'MIT Electric Vehicle (EV) Club', shortName: 'EV', facultyAdvisor: 'Prof. Shashank S. Gawade', events: generatePlaceholderEvents(5, 'soes5') },
      { id: 'c6', name: 'SAE Collegiate Club', shortName: 'SAE', facultyAdvisor: 'Dr. Anurag Nema', events: generatePlaceholderEvents(8, 'soes6') },
      { id: 'c7', name: 'Speedtail Racing', shortName: 'Speedtail', facultyAdvisor: 'Dr. Anurag Nema', events: generatePlaceholderEvents(7, 'soes7') },
      { id: 'c8', name: 'Team Volta', shortName: 'Volta', facultyAdvisor: 'Prof. Praveen Bhojane', events: generatePlaceholderEvents(4, 'soes8') },
      { id: 'c9', name: 'Vidyut Veda', shortName: 'Vidyut', facultyAdvisor: 'Prof. Mahesh A. Kamthe', events: generatePlaceholderEvents(3, 'soes9') },
      { id: 'c10', name: 'Center for Semicondustor & IC Design', shortName: 'CSID', facultyAdvisor: 'Dr. Sanjaykumar Nipanikar', events: generatePlaceholderEvents(4, 'soes10') },
    ]
  },
  {
    id: 's2',
    name: 'MIT-SOC (School of Computing)',
    totalEvents: 76,
    clubs: [
      { id: 'c11', name: 'Aces MITSOE', shortName: 'ACES', facultyAdvisor: 'Prof. Swapnil Patil', events: generatePlaceholderEvents(3, 'soc1') },
      { id: 'c12', name: 'ACM-W Student Chapter', shortName: 'ACM-W', facultyAdvisor: 'Prof. Dr. Ayesha Butalia', events: generatePlaceholderEvents(4, 'soc2') },
      { id: 'c13', name: 'Arcade - Game Development And Metaverse', shortName: 'ARCADE', facultyAdvisor: 'Prof. Shubhra Mathur', events: generatePlaceholderEvents(2, 'soc3') },
      { id: 'c14', name: 'ASTECH', shortName: 'ASTECH', facultyAdvisor: 'Prof. Benazir Pirjade', events: generatePlaceholderEvents(3, 'soc4') },
      { id: 'c15', name: 'AWS Student Builder Group Leader', shortName: 'AWS SBGL', facultyAdvisor: 'Prof. Dr. Rajani Sajjan', events: generatePlaceholderEvents(2, 'soc5') },
      { id: 'c16', name: 'Cloud Computing Club', shortName: 'Cloud', facultyAdvisor: 'Prof. Dr. Sumit Hirve', events: generatePlaceholderEvents(3, 'soc6') },
      { id: 'c17', name: 'Codechef', shortName: 'CODECHEF', facultyAdvisor: 'Prof. Ravi Chaudhari', events: generatePlaceholderEvents(4, 'soc7') },
      { id: 'c18', name: 'Geeks For Geeks Student Chapter', shortName: 'GFGSC', facultyAdvisor: 'Prof. Hemant Shinde', events: generatePlaceholderEvents(3, 'soc8') },
      { id: 'c19', name: 'Google Developer Group', shortName: 'GDG', facultyAdvisor: 'N/A', events: generatePlaceholderEvents(2, 'soc9') },
      { id: 'c20', name: 'Ideate', shortName: 'IDEATE', facultyAdvisor: 'Prof. Dr. Anant Kaulage', events: generatePlaceholderEvents(2, 'soc10') },
      { id: 'c21', name: 'IEEE Student Branch MIT-ADT', shortName: 'IEEE SB', facultyAdvisor: 'Prof. Dr. Suvarna Joshi', events: generatePlaceholderEvents(4, 'soc11') },
      { id: 'c22', name: 'IEEE EMBS Student Chapter', shortName: 'IEEE EMBS', facultyAdvisor: 'N/A', events: generatePlaceholderEvents(2, 'soc12') },
      { id: 'c23', name: 'Ignite', shortName: 'IGNITE', facultyAdvisor: 'Prof. Pallavi Bhujbal', events: generatePlaceholderEvents(3, 'soc13') },
      { id: 'c24', name: 'IIC, CRiEYA, AIC, IPR Cell. & TTO', shortName: 'IIC', facultyAdvisor: 'Prof. Moushmee Kuri', events: generatePlaceholderEvents(5, 'soc14') },
      { id: 'c25', name: 'Java Brewers', shortName: 'JB', facultyAdvisor: 'Prof. Rahul More', events: generatePlaceholderEvents(2, 'soc15') },
      { id: 'c26', name: 'Mirage', shortName: 'MIRAGE', facultyAdvisor: 'Prof. Revati Deshpande', events: generatePlaceholderEvents(3, 'soc16') },
      { id: 'c27', name: 'MIT CBC (Cybersecurity And Blockchain)', shortName: 'CBC', facultyAdvisor: 'Prof. Aman Kamble', events: generatePlaceholderEvents(3, 'soc17') },
      { id: 'c28', name: 'MIT ADT Consulting Club', shortName: 'MACC', facultyAdvisor: 'Prof. Palash Sontakke', events: generatePlaceholderEvents(3, 'soc18') },
      { id: 'c29', name: 'MIT Swift Coding Club', shortName: 'Swift', facultyAdvisor: 'Prof. Reetika Kerketta', events: generatePlaceholderEvents(2, 'soc19') },
      { id: 'c30', name: 'Synapse AI', shortName: 'Synapse AI', facultyAdvisor: 'Prof. Mukund Wagh', events: generatePlaceholderEvents(4, 'soc20') },
      { id: 'c31', name: 'Techno Smart Campus Club', shortName: 'Techno Smart', facultyAdvisor: 'Prof. Dr. Rajani Sajjan', events: generatePlaceholderEvents(3, 'soc21') },
      { id: 'c32', name: 'Ted-X', shortName: 'Ted-X', facultyAdvisor: 'Prof. Moushmee Kuri', events: generatePlaceholderEvents(4, 'soc22') },
      { id: 'c33', name: 'Words\' Worth Club', shortName: 'WWC', facultyAdvisor: 'Prof. Balasaheb Wakde, Prof. Dr. Amol Agase', events: generatePlaceholderEvents(2, 'soc23') },
      { id: 'c34', name: 'Yuvarth', shortName: 'Yuvarth', facultyAdvisor: 'Prof. Kiran Shinde', events: generatePlaceholderEvents(3, 'soc24') },
      { id: 'c35', name: 'FOSSphere', shortName: 'FOSSphere', facultyAdvisor: 'Prof. Dr. Ishwari Raskar & Prof. Pratiksha Dhande', events: generatePlaceholderEvents(3, 'soc25') },
      { id: 'c36', name: 'QQuEST', shortName: 'QQuEST', facultyAdvisor: 'Dr. Harshwardhan Bhatkar', events: generatePlaceholderEvents(2, 'soc26') },
      { id: 'c37', name: 'Alliance Of Students for Tradition, Research and Advancements', shortName: 'ASTRA', facultyAdvisor: 'Prof. Mayuresh Gulame', events: generatePlaceholderEvents(3, 'soc27') },
    ]
  },
  {
    id: 's3',
    name: 'MIT-SOER (School of Education)',
    totalEvents: 5,
    clubs: [
      { id: 'c38', name: 'Samarpan Club', shortName: 'Samarpan', facultyAdvisor: 'Prof. Komal Gagare', events: generatePlaceholderEvents(5, 'soer1') },
    ]
  },
  {
    id: 's4',
    name: 'MIT-SOH (School of Humanities)',
    totalEvents: 10,
    clubs: [
      { id: 'c39', name: 'Between The Lines Book Club', shortName: 'BTLBC', facultyAdvisor: 'Prof. Siddhi Lonkar', events: generatePlaceholderEvents(5, 'soh1') },
      { id: 'c40', name: 'Cinemaniacs', shortName: 'Cinemaniacs', facultyAdvisor: 'Prof. Siddhi Lonkar', events: generatePlaceholderEvents(5, 'soh2') },
    ]
  },
  {
    id: 's5',
    name: 'MIT-MANET',
    totalEvents: 11,
    clubs: [
      { id: 'c41', name: 'The Log Book', shortName: 'TLB', facultyAdvisor: 'Prof. Nilambari Jadhav', events: generatePlaceholderEvents(11, 'manet1') },
    ]
  },
  {
    id: 's6',
    name: 'MIT-SFT (School of Food Technology)',
    totalEvents: 15,
    clubs: [
      { id: 'c42', name: 'The Foodpreneurs Club', shortName: 'TFC', facultyAdvisor: 'Prof. Balaji Jadhav', events: generatePlaceholderEvents(5, 'sft1') },
      { id: 'c43', name: 'The Alpha Cell', shortName: 'Alpha', facultyAdvisor: 'Prof. Balaji Jadhav', events: generatePlaceholderEvents(5, 'sft2') },
      { id: 'c44', name: 'The Infusion Club', shortName: 'Infusion', facultyAdvisor: 'Prof. Yogita Chavan', events: generatePlaceholderEvents(5, 'sft3') },
    ]
  },
  {
    id: 's7',
    name: 'MIT-SBSR',
    totalEvents: 8,
    clubs: [
      { id: 'c45', name: 'Bioengineering Club', shortName: 'Bioengg', facultyAdvisor: 'Dr. Gourab Bhattacharje, Dr. Balkrishna Shinde', events: generatePlaceholderEvents(8, 'sbsr1') },
    ]
  },
  {
    id: 's8',
    name: 'MIT-SOA (School of Architecture)',
    totalEvents: 12,
    clubs: [
      { id: 'c46', name: 'Heritage Yatra', shortName: 'Heritage', facultyAdvisor: 'Prof. Ravi Roshan', events: generatePlaceholderEvents(12, 'soa1') },
    ]
  },
  {
    id: 's9',
    name: 'MIT-SOFAA',
    totalEvents: 14,
    clubs: [
      { id: 'c47', name: 'Painting Club', shortName: 'Painting', facultyAdvisor: 'Prof. Uttam Janawade', events: generatePlaceholderEvents(6, 'sofaa1') },
      { id: 'c48', name: 'Photography Club', shortName: 'Photo', facultyAdvisor: 'Prof. Pankaj Dawande', events: generatePlaceholderEvents(8, 'sofaa2') },
    ]
  },
  {
    id: 's10',
    name: 'MIT-SVS (School of Vedic Sciences)',
    totalEvents: 26,
    clubs: [
      { id: 'c49', name: 'The Psychology Club', shortName: 'Psychology', facultyAdvisor: 'Prof. Ekta Shipure', events: generatePlaceholderEvents(26, 'svs1') },
    ]
  },
  {
    id: 's11',
    name: 'MIT-ADTU (University Level Units)',
    totalEvents: 237,
    clubs: [
      { id: 'c50', name: 'Electoral Literacy Club', shortName: 'ELC', facultyAdvisor: 'Prof. Dr. Pratibha Jagtap', events: generatePlaceholderEvents(10, 'adt1') },
      { id: 'c51', name: 'Gearhead Riders Bikers Community', shortName: 'GRBC', facultyAdvisor: 'Prof. Dr. Swapnil Shirsath', events: generatePlaceholderEvents(12, 'adt2') },
      { id: 'c52', name: 'Groovance', shortName: 'Groovance', facultyAdvisor: 'Prof. Aditi Riswadkar', events: generatePlaceholderEvents(15, 'adt3') },
      { id: 'c53', name: 'Leap Of Grace', shortName: 'LOG', facultyAdvisor: 'Prof. Reshma Girigosavi', events: generatePlaceholderEvents(10, 'adt4') },
      { id: 'c54', name: 'MIT Adventure Club', shortName: 'Trek N Trail', facultyAdvisor: 'Mr. Sandeep Bhapkar', events: generatePlaceholderEvents(20, 'adt5') },
      { id: 'c55', name: 'Muse', shortName: 'Muse', facultyAdvisor: 'Prof. Vivek Sutar', events: generatePlaceholderEvents(8, 'adt6') },
      { id: 'c56', name: 'Panchayati Drama Club', shortName: 'Panchayati', facultyAdvisor: 'Prof. Kiran Pavaskar', events: generatePlaceholderEvents(14, 'adt7') },
      { id: 'c57', name: 'Shivray Dhol Tasha Pathak', shortName: 'SDTP', facultyAdvisor: 'Prof. Dr. Suraj Bhoyar', events: generatePlaceholderEvents(18, 'adt8') },
      { id: 'c58', name: 'ERC-Music Studio', shortName: 'ERCMS', facultyAdvisor: 'Prof. Vivek Sutar', events: generatePlaceholderEvents(10, 'adt9') },
      { id: 'c59', name: 'Kalakriti Cultural Society', shortName: 'Kalakriti', facultyAdvisor: 'Prof. Dr. Pratibha Jagtap', events: generatePlaceholderEvents(25, 'adt10') },
    ]
  }
];

export const TOTAL_CLUBS = 59;
export const TOTAL_EVENTS = 757;
export const TOTAL_SCHOOLS = 11;
