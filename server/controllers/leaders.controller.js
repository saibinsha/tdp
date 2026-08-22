const { asyncHandler } = require('../utils/asyncHandler');
const { AppError } = require('../utils/AppError');
const { slugify } = require('../utils/slugify');
const Leader = require('../models/Leader');

const SEED_LEADERS = [
  {
    name: 'N. Chandrababu Naidu',
    slug: 'cbn',
    role: 'Party National President & Chief Minister of Andhra Pradesh',
    category: 'state_leadership',
    photoUrl: 'https://yt3.googleusercontent.com/OyHTN7U_Ub5iZR2qDDJ34uFWBQJ4VGolPIo1xE_0i-HeRapRLS8KccvZS9NviBLbjU18Pv8J=s900-c-k-c0x00ffffff-no-rj',
    bio: 'Visionary statesman, founder of modern Hi-tech Andhra Pradesh, and National President of the Telugu Desam Party.',
    constituency: 'Kuppam',
    district: 'Chittoor',
    trackInNews: true,
    searchKeywords: 'Chandrababu Naidu TDP Andhra Pradesh CM',
    order: 1,
  },
  {
    name: 'Nara Lokesh',
    slug: 'lokesh',
    role: 'National General Secretary & Minister for IT, Electronics & HRD',
    category: 'state_leadership',
    photoUrl: 'https://theleaderspage.com/wp-content/uploads/2020/07/nara-lokesh.jpg',
    bio: 'National General Secretary of Telugu Desam Party leading digital governance, youth empowerment, and industrial modernization.',
    constituency: 'Mangalagiri',
    district: 'Guntur',
    trackInNews: true,
    searchKeywords: 'Nara Lokesh TDP IT Minister Andhra Pradesh',
    order: 2,
  },
  {
    name: 'Kinjarapu Ram Mohan Naidu',
    slug: 'ram_mohan_naidu',
    role: 'Union Cabinet Minister for Civil Aviation (Govt of India)',
    category: 'national_leadership',
    photoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/Kinjarapu_Ram_Mohan_Naidu_in_2024.jpg/440px-Kinjarapu_Ram_Mohan_Naidu_in_2024.jpg',
    bio: 'Youngest Union Cabinet Minister representing Srikakulam constituency and leading India’s Civil Aviation ministry.',
    constituency: 'Srikakulam',
    district: 'Srikakulam',
    trackInNews: true,
    searchKeywords: 'Ram Mohan Naidu Civil Aviation Minister TDP',
    order: 3,
  },
  {
    name: 'Dr. Pemmasani Chandrasekhar',
    slug: 'pemmasani_chandrasekhar',
    role: 'Union Minister of State for Rural Development & Communications',
    category: 'national_leadership',
    photoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Dr._Pemmasani_Chandra_Sekhar_in_2024.jpg/440px-Dr._Pemmasani_Chandra_Sekhar_in_2024.jpg',
    bio: 'Renowned physician, entrepreneur, and Member of Parliament representing Guntur leading Rural Development.',
    constituency: 'Guntur',
    district: 'Guntur',
    trackInNews: true,
    searchKeywords: 'Pemmasani Chandra Sekhar Guntur MP TDP',
    order: 4,
  },
  {
    name: 'Gundumala Thippe Swamy',
    slug: 'thippe_swamy',
    role: 'Senior Leader & Member of Legislative Council (MLC)',
    category: 'state_leadership',
    photoUrl: 'https://s3.ap-southeast-1.amazonaws.com/images.deccanchronicle.com/dc-Cover-h888ii526o296qi4udif56da84-20230626233651.Medi.jpeg',
    bio: 'Veteran political leader and MLC dedicated to grassroots welfare and regional agricultural development in Rayalaseema.',
    constituency: 'Madakasira',
    district: 'Sri Sathya Sai',
    trackInNews: true,
    searchKeywords: 'Thippe Swamy TDP MLC Madakasira',
    order: 5,
  },
  {
    name: 'M.S. Raju',
    slug: 'ms_raju',
    role: 'TDP Senior Leader & Member of Legislative Assembly (MLA)',
    category: 'state_leadership',
    photoUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSfcbsN7t1LnUerPviprD4Ver0GUc4nAPR4yQ&s',
    bio: 'Dedicated public representative and MLA working tirelessly for education, water management, and social welfare.',
    constituency: 'Madakasira',
    district: 'Sri Sathya Sai',
    trackInNews: true,
    searchKeywords: 'MS Raju Madakasira MLA TDP',
    order: 6,
  },
  {
    name: 'Kinjarapu Atchannaidu',
    slug: 'atchannaidu',
    role: 'Minister for Agriculture, Cooperation & Marketing',
    category: 'cabinet_ministers',
    photoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Kinjarapu_Atchannaidu.jpg/440px-Kinjarapu_Atchannaidu.jpg',
    bio: 'Senior TDP leader and Minister for Agriculture spearheading farm welfare, irrigation, and cooperative growth across Andhra Pradesh.',
    constituency: 'Tekkali',
    district: 'Srikakulam',
    trackInNews: true,
    searchKeywords: 'Atchannaidu Agriculture Minister TDP',
    order: 7,
  },
  {
    name: 'Vangalapudi Anitha',
    slug: 'anitha',
    role: 'Minister for Home Affairs & Disaster Management',
    category: 'cabinet_ministers',
    photoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/Vangalapudi_Anitha.jpg/440px-Vangalapudi_Anitha.jpg',
    bio: 'Dynamic leader and Home Minister championing women empowerment, state security, and citizen safety.',
    constituency: 'Payakaraopet',
    district: 'Anakapalli',
    trackInNews: true,
    searchKeywords: 'Vangalapudi Anitha Home Minister TDP',
    order: 8,
  },
];

async function ensureSeedLeaders() {
  try {
    const count = await Leader.countDocuments();
    if (count === 0) {
      await Leader.insertMany(SEED_LEADERS);
      console.log('[Leaders] Seeded initial party leadership members successfully');
    }
  } catch (err) {
    console.warn('[Leaders] ensureSeedLeaders skipped/error:', err.message);
  }
}

const listLeaders = asyncHandler(async (req, res) => {
  await ensureSeedLeaders();

  const { category, trackInNews, q, activeOnly = 'true' } = req.query;

  const filter = {};
  if (activeOnly === 'true') filter.isActive = true;
  if (category) filter.category = String(category);
  if (trackInNews !== undefined) filter.trackInNews = trackInNews === 'true';

  if (q && String(q).trim()) {
    const regex = new RegExp(String(q).trim(), 'i');
    filter.$or = [
      { name: regex },
      { role: regex },
      { constituency: regex },
      { district: regex },
    ];
  }

  const items = await Leader.find(filter).sort({ order: 1, createdAt: -1 });
  res.json({ ok: true, items });
});

const getLeaderByIdOrSlug = asyncHandler(async (req, res) => {
  await ensureSeedLeaders();

  const { idOrSlug } = req.params;
  const item = await Leader.findOne({
    $or: [{ _id: idOrSlug.match(/^[0-9a-fA-F]{24}$/) ? idOrSlug : null }, { slug: idOrSlug }],
  });

  if (!item) throw new AppError('Leader not found', 404);
  res.json({ ok: true, item });
});

const createLeader = asyncHandler(async (req, res) => {
  const {
    name,
    role,
    category = 'state_leadership',
    photoUrl,
    bio,
    constituency,
    district,
    trackInNews = true,
    searchKeywords,
    order = 0,
    socialLinks,
  } = req.body;

  if (!name || !String(name).trim()) throw new AppError('Leader name is required', 400);
  if (!role || !String(role).trim()) throw new AppError('Leader designation/role is required', 400);

  const cleanName = String(name).trim();
  const baseSlug = slugify(cleanName) || `leader-${Date.now()}`;
  let slug = baseSlug;
  let counter = 1;
  while (await Leader.exists({ slug })) {
    slug = `${baseSlug}-${counter++}`;
  }

  const doc = await Leader.create({
    name: cleanName,
    slug,
    role: String(role).trim(),
    category,
    photoUrl: photoUrl ? String(photoUrl).trim() : '',
    bio: bio ? String(bio).trim() : '',
    constituency: constituency ? String(constituency).trim() : '',
    district: district ? String(district).trim() : '',
    trackInNews: Boolean(trackInNews),
    searchKeywords: searchKeywords ? String(searchKeywords).trim() : cleanName,
    order: Number(order) || 0,
    socialLinks: typeof socialLinks === 'object' && socialLinks !== null ? socialLinks : {},
    isActive: true,
  });

  res.status(201).json({ ok: true, item: doc });
});

const updateLeader = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const allowed = [
    'name',
    'role',
    'category',
    'photoUrl',
    'bio',
    'constituency',
    'district',
    'trackInNews',
    'searchKeywords',
    'order',
    'socialLinks',
    'isActive',
  ];

  const patch = {};
  for (const k of allowed) {
    if (req.body[k] !== undefined) patch[k] = req.body[k];
  }

  const doc = await Leader.findByIdAndUpdate(id, patch, { new: true });
  if (!doc) throw new AppError('Leader not found', 404);

  res.json({ ok: true, item: doc });
});

const deleteLeader = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const doc = await Leader.findByIdAndDelete(id);
  if (!doc) throw new AppError('Leader not found', 404);

  res.json({ ok: true, message: 'Leader deleted successfully', id });
});

const toggleNewsTracking = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const leader = await Leader.findById(id);
  if (!leader) throw new AppError('Leader not found', 404);

  leader.trackInNews = !leader.trackInNews;
  await leader.save();

  res.json({ ok: true, item: leader });
});

module.exports = {
  listLeaders,
  getLeaderByIdOrSlug,
  createLeader,
  updateLeader,
  deleteLeader,
  toggleNewsTracking,
  SEED_LEADERS,
  ensureSeedLeaders,
};
