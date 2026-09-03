/**
 * Image Service for EventBook
 * Provides high-resolution event posters, artist mappings, genre fallbacks,
 * and live online image search via Wikimedia Commons & Wikipedia open APIs.
 */

// Curated high-res images for all seed artists & popular acts
const ARTIST_IMAGES = {
  'Coldplay': 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80',
  'AR Rahman': 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80',
  'A. R. Rahman': 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80',
  'Arijit Singh': 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1200&q=80',
  'Zakir Khan': 'https://images.unsplash.com/photo-1585699324551-f6c309eedeca?auto=format&fit=crop&w=1200&q=80',
  'Diljit Dosanjh': 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=1200&q=80',
  'Prateek Kuhad': 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=1200&q=80',
  'Sunidhi Chauhan': 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=1200&q=80',
  'Vir Das': 'https://images.unsplash.com/photo-1527224857830-43a7acc85260?auto=format&fit=crop&w=1200&q=80',
  'Zakir Hussain': 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80',
  'Shreya Ghoshal': 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=1200&q=80',
  'Anirudh Ravichander': 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=1200&q=80',
  'Ritviz': 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1200&q=80',
  'Nucleya': 'https://images.unsplash.com/photo-1516873240891-4bf014598ab4?auto=format&fit=crop&w=1200&q=80',
  'Papon': 'https://images.unsplash.com/photo-1487180144351-b8472da7d491?auto=format&fit=crop&w=1200&q=80',
  'KK Tribute': 'https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=1200&q=80',
  'Local Train': 'https://images.unsplash.com/photo-1464375117522-1311d6a5b81f?auto=format&fit=crop&w=1200&q=80',
  'The Local Train': 'https://images.unsplash.com/photo-1464375117522-1311d6a5b81f?auto=format&fit=crop&w=1200&q=80',
  'When Chai Met Toast': 'https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?auto=format&fit=crop&w=1200&q=80',
  'Parikrama': 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&w=1200&q=80',
  'Indian Ocean': 'https://images.unsplash.com/photo-1465821185615-20b3c2fbf41b?auto=format&fit=crop&w=1200&q=80',
  'Euphoria': 'https://images.unsplash.com/photo-1501612780327-45045538702b?auto=format&fit=crop&w=1200&q=80',
  'Kailash Kher': 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&w=1200&q=80',
  'Sonu Nigam': 'https://images.unsplash.com/photo-1520523839898-507127027582?auto=format&fit=crop&w=1200&q=80',
  'Shankar Mahadevan': 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80',
  'Amit Trivedi': 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?auto=format&fit=crop&w=1200&q=80',
  'Jubin Nautiyal': 'https://images.unsplash.com/photo-1485579149621-3123dd979885?auto=format&fit=crop&w=1200&q=80',
  'Neha Kakkar': 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1200&q=80',
  'Badshah': 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1200&q=80',
  'Divine': 'https://images.unsplash.com/photo-1546707012-c46675f12716?auto=format&fit=crop&w=1200&q=80',
  'Raftaar': 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1200&q=80',
  'Ranveer Allahbadia': 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=1200&q=80',
};

// Curated high-res images for specific known events & titles
const SPECIFIC_EVENT_IMAGES = {
  'Comic Con India': 'https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=1200&q=80',
  'Sunburn Festival': 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80',
  'NH7 Weekender': 'https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=1200&q=80',
  'IPL Final 2026': 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=1200&q=80',
  'Rock On Reunion Tour': 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=1200&q=80',
  'Kabir Singh Fan Fest': 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=80',
  'Classical Fusion Night': 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&w=1200&q=80',
  'New Year EDM Night': 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1200&q=80',
  'Map Test Event': 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1200&q=80',
};

// Curated high-res images by event category / genre
const CATEGORY_IMAGES = {
  'Live in Concert': 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80',
  'World Tour': 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1200&q=80',
  'Unplugged': 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80',
  'Stand-Up Comedy Night': 'https://images.unsplash.com/photo-1585699324551-f6c309eedeca?auto=format&fit=crop&w=1200&q=80',
  'Comedy Special': 'https://images.unsplash.com/photo-1527224857830-43a7acc85260?auto=format&fit=crop&w=1200&q=80',
  'Theatre Production': 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?auto=format&fit=crop&w=1200&q=80',
  'Dance Recital': 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=1200&q=80',
  'Classical Music Evening': 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80',
  'Film Screening': 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=80',
  'Poetry Slam': 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=1200&q=80',
  'Sports Championship': 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=1200&q=80',
  'Fan Convention': 'https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=1200&q=80',
  'Food & Music Festival': 'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=1200&q=80',
  'DJ Night': 'https://images.unsplash.com/photo-1516873240891-4bf014598ab4?auto=format&fit=crop&w=1200&q=80',
  'Cultural Fest': 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=1200&q=80',
};

const DEFAULT_EVENT_IMAGE = 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80';

/**
 * Searches online images from Wikimedia Commons, Wikipedia, and Curated Collections.
 * Returns an array of candidate images: { title, url, thumb, source }
 */
async function searchOnlineImages(query, limit = 12) {
  const results = [];
  const cleanQuery = (query || '').trim();
  if (!cleanQuery) return results;

  // 1. Check curated artist / title / category matches first
  for (const [artist, imgUrl] of Object.entries(ARTIST_IMAGES)) {
    if (artist.toLowerCase().includes(cleanQuery.toLowerCase()) || cleanQuery.toLowerCase().includes(artist.toLowerCase())) {
      results.push({
        title: `${artist} Live Poster`,
        url: imgUrl,
        thumb: imgUrl.replace('w=1200', 'w=400'),
        source: 'Curated HD'
      });
      break;
    }
  }

  for (const [cat, imgUrl] of Object.entries(CATEGORY_IMAGES)) {
    if (cat.toLowerCase().includes(cleanQuery.toLowerCase()) || cleanQuery.toLowerCase().includes(cat.toLowerCase())) {
      results.push({
        title: `${cat} Banner`,
        url: imgUrl,
        thumb: imgUrl.replace('w=1200', 'w=400'),
        source: 'Curated HD'
      });
    }
  }

  // 2. Query Wikimedia Commons API (Files)
  try {
    const commonsUrl = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(cleanQuery + ' concert OR live OR stage')}&gsrnamespace=6&gsrlimit=6&prop=imageinfo&iiprop=url|thumburl&iiurlwidth=800&format=json`;
    const res = await fetch(commonsUrl, {
      headers: { 'User-Agent': 'EventBookPlatform/1.0 (contact@eventbook.dev)' },
      signal: AbortSignal.timeout(4000)
    });
    
    if (res.ok) {
      const data = await res.json();
      const pages = Object.values(data.query?.pages || {});
      for (const page of pages) {
        const info = page.imageinfo?.[0];
        if (info && (info.thumburl || info.url)) {
          const rawTitle = page.title.replace(/^File:/i, '').replace(/\.[^/.]+$/, '');
          results.push({
            title: rawTitle.slice(0, 50),
            url: info.url,
            thumb: info.thumburl || info.url,
            source: 'Wikimedia Commons'
          });
        }
      }
    }
  } catch (err) {
    // Graceful network timeout fallback
  }

  // 3. Query Wikipedia PageImages API
  try {
    const wikiUrl = `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(cleanQuery)}&gsrlimit=4&prop=pageimages&format=json&piprop=thumbnail&pithumbsize=800`;
    const res = await fetch(wikiUrl, {
      headers: { 'User-Agent': 'EventBookPlatform/1.0 (contact@eventbook.dev)' },
      signal: AbortSignal.timeout(4000)
    });

    if (res.ok) {
      const data = await res.json();
      const pages = Object.values(data.query?.pages || {});
      for (const page of pages) {
        if (page.thumbnail?.source) {
          results.push({
            title: `${page.title} (Wikipedia)`,
            url: page.thumbnail.source,
            thumb: page.thumbnail.source,
            source: 'Wikipedia'
          });
        }
      }
    }
  } catch (err) {
    // Graceful network timeout fallback
  }

  // 4. Fill in with curated aesthetic fallback options if needed
  if (results.length < 4) {
    const fallbacks = [
      { title: 'Concert Stage & Crowd', url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80', source: 'Aesthetic Stage' },
      { title: 'Live Performance Lights', url: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1200&q=80', source: 'Aesthetic Stage' },
      { title: 'Acoustic / Vocal Stage', url: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1200&q=80', source: 'Aesthetic Stage' },
      { title: 'Electric Night Concert', url: 'https://images.unsplash.com/photo-1516873240891-4bf014598ab4?auto=format&fit=crop&w=1200&q=80', source: 'Aesthetic Stage' },
      { title: 'Comedy & Spotlight', url: 'https://images.unsplash.com/photo-1585699324551-f6c309eedeca?auto=format&fit=crop&w=1200&q=80', source: 'Comedy Club' },
      { title: 'Stadium Arena Crowd', url: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=1200&q=80', source: 'Arena' },
    ];

    for (const fb of fallbacks) {
      if (!results.some(r => r.url === fb.url)) {
        results.push({
          title: fb.title,
          url: fb.url,
          thumb: fb.url.replace('w=1200', 'w=400'),
          source: fb.source
        });
      }
    }
  }

  return results.slice(0, limit);
}

/**
 * Determines the best high-res poster image for any given event
 * based on its title, venue, and description.
 */
function getBestImageForEvent(title = '', venue = '', description = '') {
  const fullText = `${title} ${venue} ${description}`.trim();

  // 1. Check exact or known event titles
  for (const [key, url] of Object.entries(SPECIFIC_EVENT_IMAGES)) {
    if (fullText.toLowerCase().includes(key.toLowerCase())) {
      return url;
    }
  }

  // 2. Check artist match
  for (const [artist, url] of Object.entries(ARTIST_IMAGES)) {
    if (fullText.toLowerCase().includes(artist.toLowerCase())) {
      return url;
    }
  }

  // 3. Check category match
  for (const [cat, url] of Object.entries(CATEGORY_IMAGES)) {
    if (fullText.toLowerCase().includes(cat.toLowerCase())) {
      return url;
    }
  }

  // 4. Keyword heuristics
  const lower = fullText.toLowerCase();
  if (lower.includes('comedy') || lower.includes('standup') || lower.includes('comic') || lower.includes('laugh')) {
    return CATEGORY_IMAGES['Stand-Up Comedy Night'];
  }
  if (lower.includes('classical') || lower.includes('tabla') || lower.includes('sitar') || lower.includes('violin')) {
    return CATEGORY_IMAGES['Classical Music Evening'];
  }
  if (lower.includes('theatre') || lower.includes('play') || lower.includes('drama')) {
    return CATEGORY_IMAGES['Theatre Production'];
  }
  if (lower.includes('dj') || lower.includes('edm') || lower.includes('club') || lower.includes('party')) {
    return CATEGORY_IMAGES['DJ Night'];
  }
  if (lower.includes('cricket') || lower.includes('ipl') || lower.includes('match') || lower.includes('sports')) {
    return CATEGORY_IMAGES['Sports Championship'];
  }
  if (lower.includes('dance') || lower.includes('ballet') || lower.includes('recital')) {
    return CATEGORY_IMAGES['Dance Recital'];
  }
  if (lower.includes('food') || lower.includes('fest') || lower.includes('carnival')) {
    return CATEGORY_IMAGES['Food & Music Festival'];
  }
  if (lower.includes('film') || lower.includes('movie') || lower.includes('cinema')) {
    return CATEGORY_IMAGES['Film Screening'];
  }

  return DEFAULT_EVENT_IMAGE;
}

module.exports = {
  ARTIST_IMAGES,
  CATEGORY_IMAGES,
  SPECIFIC_EVENT_IMAGES,
  DEFAULT_EVENT_IMAGE,
  searchOnlineImages,
  getBestImageForEvent
};
