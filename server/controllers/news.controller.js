const { asyncHandler } = require('../utils/asyncHandler');
const { AppError } = require('../utils/AppError');
const Leader = require('../models/Leader');
const { SEED_LEADERS } = require('./leaders.controller');

// Comprehensive topic-based contextual image library for Andhra Pradesh and TDP news
const TOPIC_IMAGE_CATALOG = [
  {
    topic: 'amaravati',
    keywords: ['amaravati', 'capital', 'crda', 'high court', 'seed access', 'velagapudi', 'secretariat', 'rajdhani'],
    images: [
      'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1541888946425-d0fbb18f15f6?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1200&q=80',
    ],
  },
  {
    topic: 'technology_it',
    keywords: ['it', 'technology', 'ai', 'software', 'tcs', 'hcl', 'cyber', 'data center', 'google', 'microsoft', 'electronics', 'foxconn', 'tech', 'digital', 'semiconductor'],
    images: [
      'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1200&q=80',
    ],
  },
  {
    topic: 'agriculture_farmers',
    keywords: ['farmer', 'farmers', 'agriculture', 'rythu', 'crop', 'paddy', 'irrigation', 'kharif', 'rabi', 'fertilizer', 'kisan', 'annadata', 'cultivation'],
    images: [
      'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1586771107445-d3ca888129ff?auto=format&fit=crop&w=1200&q=80',
    ],
  },
  {
    topic: 'water_polavaram',
    keywords: ['polavaram', 'dam', 'water', 'river', 'canal', 'godavari', 'krishna', 'flood', 'drinking water', 'spillway', 'reservoir'],
    images: [
      'https://images.unsplash.com/photo-1574950578143-858c6fc58922?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
    ],
  },
  {
    topic: 'aviation_airports',
    keywords: ['aviation', 'airport', 'flight', 'airline', 'bhogapuram', 'gannavaram', 'airways', 'civil aviation', 'terminal', 'aircraft', 'runway'],
    images: [
      'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1520437358207-323b43b50729?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1508873696983-2df5293cb32b?auto=format&fit=crop&w=1200&q=80',
    ],
  },
  {
    topic: 'welfare_pension',
    keywords: ['welfare', 'pension', 'scheme', 'women', 'stree', 'shakti', 'ntr bharosa', 'aid', 'subsidy', 'poor', 'bpl', 'financial assistance', 'beneficiary'],
    images: [
      'https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1577962917302-cd874c4e31d2?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?auto=format&fit=crop&w=1200&q=80',
    ],
  },
  {
    topic: 'assembly_governance',
    keywords: ['assembly', 'cabinet', 'minister', 'government', 'bill', 'session', 'speaker', 'mla', 'mlc', 'budget', 'ordinance', 'resolution', 'governor'],
    images: [
      'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1575320181282-9afab399332c?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?auto=format&fit=crop&w=1200&q=80',
    ],
  },
  {
    topic: 'education_jobs',
    keywords: ['education', 'school', 'dsc', 'teacher', 'university', 'student', 'college', 'exam', 'recruitment', 'job', 'youth', 'skill', 'degree', 'scholarship'],
    images: [
      'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=1200&q=80',
    ],
  },
  {
    topic: 'healthcare_medical',
    keywords: ['health', 'hospital', 'medical', 'doctor', 'aarogyasri', 'clinic', 'medicine', 'patient', 'ambulance', 'treatment'],
    images: [
      'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1538108149393-fbbd81895907?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1504813184591-01572f98c85f?auto=format&fit=crop&w=1200&q=80',
    ],
  },
  {
    topic: 'roads_highways_transport',
    keywords: ['road', 'highway', 'expressway', 'bridge', 'nh', 'traffic', 'flyover', 'transport', 'railway', 'metro', 'port', 'visakhapatnam port'],
    images: [
      'https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1545459720-aac8509eb02c?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=1200&q=80',
    ],
  },
  {
    topic: 'party_rally_politics',
    keywords: ['tdp', 'party', 'rally', 'mahanadu', 'prajagalam', 'election', 'vote', 'cadre', 'speech', 'public meeting', 'alliance', 'victory'],
    images: [
      'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80',
    ],
  },
  {
    topic: 'police_law_security',
    keywords: ['police', 'security', 'home minister', 'crime', 'law', 'safety', 'disaster', 'ndrf', 'sdrf', 'cctv'],
    images: [
      'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1453733190371-0a9bedd82893?auto=format&fit=crop&w=1200&q=80',
    ],
  },
];

// Curated leader real situational news photos
const LEADER_SITUATIONAL_IMAGES = {
  cbn: [
    'https://yt3.googleusercontent.com/OyHTN7U_Ub5iZR2qDDJ34uFWBQJ4VGolPIo1xE_0i-HeRapRLS8KccvZS9NviBLbjU18Pv8J=s900-c-k-c0x00ffffff-no-rj',
    'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=1200&q=80',
  ],
  lokesh: [
    'https://theleaderspage.com/wp-content/uploads/2020/07/nara-lokesh.jpg',
    'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1200&q=80',
  ],
  ram_mohan_naidu: [
    'https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/Kinjarapu_Ram_Mohan_Naidu_in_2024.jpg/440px-Kinjarapu_Ram_Mohan_Naidu_in_2024.jpg',
    'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1520437358207-323b43b50729?auto=format&fit=crop&w=1200&q=80',
  ],
  pemmasani_chandrasekhar: [
    'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Dr._Pemmasani_Chandra_Sekhar_in_2024.jpg/440px-Dr._Pemmasani_Chandra_Sekhar_in_2024.jpg',
    'https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=1200&q=80',
  ],
  thippe_swamy: [
    'https://s3.ap-southeast-1.amazonaws.com/images.deccanchronicle.com/dc-Cover-h888ii526o296qi4udif56da84-20230626233651.Medi.jpeg',
    'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1574950578143-858c6fc58922?auto=format&fit=crop&w=1200&q=80',
  ],
  ms_raju: [
    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSfcbsN7t1LnUerPviprD4Ver0GUc4nAPR4yQ&s',
    'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80',
  ],
  atchannaidu: [
    'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Kinjarapu_Atchannaidu.jpg/440px-Kinjarapu_Atchannaidu.jpg',
    'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=1200&q=80',
  ],
  anitha: [
    'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/Vangalapudi_Anitha.jpg/440px-Vangalapudi_Anitha.jpg',
    'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1575320181282-9afab399332c?auto=format&fit=crop&w=1200&q=80',
  ],
};

function stripHtml(input) {
  if (!input) return '';
  return String(input).replace(/<[^>]*>/g, '').trim();
}

function decodeXml(input) {
  if (!input) return '';
  return String(input)
    .replace(/<!\[CDATA\[/g, '')
    .replace(/\]\]>/g, '')
    .replace(/\\"/g, '"')
    .replace(/\\'/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#x([0-9a-f]+);/gi, (_m, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_m, n) => String.fromCharCode(parseInt(n, 10)))
    .trim();
}

function matchTag(block, tag) {
  const re = new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const m = block.match(re);
  return m?.[1] ? decodeXml(m[1]) : null;
}

function matchTagAttr(block, tag, attr) {
  const re = new RegExp(`<${tag}\\b[^>]*${attr}=["']([^"']+)["'][^>]*\\/?\\s*>`, 'i');
  const m = block.match(re);
  return m?.[1] ? decodeXml(m[1]) : null;
}

function pickEmbeddedRssImage(itemXml) {
  if (!itemXml) return null;
  const mediaUrl = matchTagAttr(itemXml, 'media:content', 'url');
  if (mediaUrl && /^https?:\/\//i.test(mediaUrl)) return mediaUrl;

  const thumbUrl = matchTagAttr(itemXml, 'media:thumbnail', 'url');
  if (thumbUrl && /^https?:\/\//i.test(thumbUrl)) return thumbUrl;

  const encUrl = matchTagAttr(itemXml, 'enclosure', 'url');
  if (encUrl && /^https?:\/\//i.test(encUrl)) return encUrl;

  const desc = matchTag(itemXml, 'description') || matchTag(itemXml, 'content:encoded') || '';
  const d = decodeXml(desc);
  const m1 = String(d).match(/<img[^>]+(?:src|data-src)=["'](https?:\/\/[^"']+)["']/i);
  if (m1?.[1]) return decodeXml(m1[1]);

  return null;
}

function resolveContextualNewsImage(title, description, leaderSlug, index = 0) {
  const text = `${title || ''} ${description || ''}`.toLowerCase();

  // 1. Topic Match
  for (const cat of TOPIC_IMAGE_CATALOG) {
    for (const kw of cat.keywords) {
      if (text.includes(kw)) {
        const list = cat.images;
        return list[Math.abs((index + title.length) % list.length)];
      }
    }
  }

  // 2. Leader specific varied photos
  const leaderVariants = LEADER_SITUATIONAL_IMAGES[leaderSlug];
  if (Array.isArray(leaderVariants) && leaderVariants.length > 0) {
    return leaderVariants[Math.abs(index % leaderVariants.length)];
  }

  // 3. High quality news generic backup
  const generalPool = [
    'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80',
  ];
  return generalPool[Math.abs(index % generalPool.length)];
}

async function fetchRss(url) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 12000);

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 TDPNewsBot/2.0',
        Accept: 'application/rss+xml, application/xml;q=0.9, text/xml;q=0.8, */*;q=0.7',
      },
      signal: ctrl.signal,
    });

    if (!res.ok) {
      throw new AppError(`Failed to fetch news feed (${res.status})`, 502);
    }

    return await res.text();
  } finally {
    clearTimeout(t);
  }
}

function parseGoogleNewsRss(xmlText, leader) {
  const items = [];
  const re = /<item\b[^>]*>([\s\S]*?)<\/item>/gi;
  let m;
  while ((m = re.exec(xmlText))) {
    items.push(m[1]);
  }

  return items
    .map((itemXml, index) => {
      const titleRaw = matchTag(itemXml, 'title');
      const title = stripHtml(titleRaw);
      const link = matchTag(itemXml, 'link');

      const pubDateRaw = matchTag(itemXml, 'pubDate');
      const pubDate = pubDateRaw ? new Date(pubDateRaw).toISOString() : null;

      const source = stripHtml(matchTag(itemXml, 'source')) || null;
      const sourceUrl = matchTagAttr(itemXml, 'source', 'url');

      const descriptionRaw = matchTag(itemXml, 'description') || '';
      const description = stripHtml(descriptionRaw);

      // Embedded RSS image or intelligent contextual news image based on story keywords!
      const embeddedImg = pickEmbeddedRssImage(itemXml);
      const imageUrl =
        embeddedImg ||
        resolveContextualNewsImage(title, description, leader.slug || leader.id, index);

      if (!title || !link) return null;

      return {
        leaderId: leader.slug || leader.id,
        leaderName: leader.name,
        title,
        link,
        pubDate,
        source,
        sourceUrl: sourceUrl || null,
        description,
        imageUrl,
      };
    })
    .filter(Boolean);
}

const cache = new Map();

function getCacheKey(leaderSlug, limit) {
  return `${leaderSlug}:${limit}`;
}

async function getTrackedLeaders() {
  try {
    const docs = await Leader.find({ isActive: true, trackInNews: true }).sort({ order: 1 });
    if (docs && docs.length > 0) {
      return docs.map((d) => ({
        id: d.slug,
        slug: d.slug,
        name: d.name,
        role: d.role,
        searchKeywords: d.searchKeywords || d.name,
        photoUrl: d.photoUrl,
      }));
    }
  } catch (err) {
    console.warn('[News] Leader DB fetch fallback to SEED_LEADERS:', err.message);
  }

  return SEED_LEADERS.filter((x) => x.trackInNews).map((x) => ({
    id: x.slug,
    slug: x.slug,
    name: x.name,
    role: x.role,
    searchKeywords: x.searchKeywords || x.name,
    photoUrl: x.photoUrl,
  }));
}

const listLeadersNews = asyncHandler(async (req, res) => {
  const { leaderId, limit = 20 } = req.query;
  const l = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));

  const allTracked = await getTrackedLeaders();

  let leadersToFetch = allTracked;
  if (leaderId && leaderId !== 'all') {
    const normalized = String(leaderId).toLowerCase().trim();
    leadersToFetch = allTracked.filter(
      (x) => x.slug === normalized || x.id === normalized || x.name.toLowerCase().includes(normalized)
    );

    if (leadersToFetch.length === 0) {
      // Allow searching for any leader by custom query even if not in tracked list
      leadersToFetch = [{
        id: normalized,
        slug: normalized,
        name: leaderId,
        searchKeywords: `${leaderId} TDP Andhra Pradesh`,
      }];
    }
  }

  const now = Date.now();
  const TTL_MS = 2 * 60 * 1000;

  const results = await Promise.all(
    leadersToFetch.map(async (leader) => {
      const key = getCacheKey(leader.slug || leader.id, l);
      const cached = cache.get(key);
      if (cached && now - cached.at < TTL_MS) {
        return { leaderId: leader.slug || leader.id, leaderName: leader.name, items: cached.items };
      }

      const searchQuery = leader.searchKeywords
        ? leader.searchKeywords
        : `${leader.name} TDP Andhra Pradesh`;

      const q = encodeURIComponent(searchQuery);
      const url = `https://news.google.com/rss/search?q=${q}&hl=en-IN&gl=IN&ceid=IN:en`;

      try {
        const xml = await fetchRss(url);
        const items = parseGoogleNewsRss(xml, leader).slice(0, l);
        cache.set(key, { at: now, items });
        return { leaderId: leader.slug || leader.id, leaderName: leader.name, items };
      } catch (e) {
        console.warn(`[News] Failed to fetch news for ${leader.name}:`, e.message);
        return { leaderId: leader.slug || leader.id, leaderName: leader.name, items: [] };
      }
    })
  );

  const flat = results
    .flatMap((r) => r.items.map((it) => ({ ...it, leaderName: r.leaderName })))
    .sort((a, b) => {
      const da = a.pubDate ? new Date(a.pubDate).getTime() : 0;
      const db = b.pubDate ? new Date(b.pubDate).getTime() : 0;
      return db - da;
    });

  res.json({
    ok: true,
    trackedLeaders: allTracked,
    leaders: results,
    items: flat,
  });
});

module.exports = {
  listLeadersNews,
  resolveContextualNewsImage,
  getTrackedLeaders,
};
