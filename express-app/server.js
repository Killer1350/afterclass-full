require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();
const port = Number(process.env.PORT || 3000);
const client = new MongoClient(process.env.MONGODB_URI || '');
let db;

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.originalUrl}`);
  next();
});
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowed = (process.env.CLIENT_ORIGIN || '').split(',').map(x => x.trim()).filter(Boolean);
  if (origin && (allowed.includes(origin) || allowed.includes('*'))) {
    res.setHeader('Access-Control-Allow-Origin', allowed.includes('*') ? '*' : origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  }
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});
app.use(express.json({ limit: '1mb' }));
// Serve lesson illustrations from public/images. Missing files fall through to
// the JSON 404 handler below so they are easy to demonstrate in Postman.
app.use('/images', express.static(path.join(__dirname, 'public', 'images'), { fallthrough: true }));
app.use('/api', (req, res, next) => { req.url = req.url; next(); });
const api = express.Router();
const lessons = () => db.collection('lesson');
const orders = () => db.collection('order');
const isId = id => ObjectId.isValid(id) && String(new ObjectId(id)) === id;
const asObjectId = id => isId(id) ? new ObjectId(id) : id;
const escapeRegex = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

api.get('/health', (req, res) => res.json({ status: 'ok' }));
api.get('/lessons', async (req, res, next) => {
  try { res.json(await lessons().find({}).sort({ topic: 1 }).toArray()); }
  catch (error) { next(error); }
});
api.get('/search', async (req, res, next) => {
  try {
    const q = String(req.query.q || '').trim();
    const pattern = q ? new RegExp(escapeRegex(q), 'i') : null;
    const all = await lessons().find({}).toArray();
    const teacherFirstName = String(req.query.teacherFirstName || '').trim();
    const teacherLastName = String(req.query.teacherLastName || '').trim();
    res.json(all.filter(x => (!teacherFirstName || (x.teachers || []).some(t => t.firstName === teacherFirstName && (!teacherLastName || t.lastName === teacherLastName))) && (!pattern || [x.topic, x.location, x.price, x.space].some(v => pattern.test(String(v))))));
  } catch (error) { next(error); }
});
api.get('/teachers', async (req, res, next) => {
  try {
    const data = await lessons().aggregate([
      { $unwind: '$teachers' },
      { $group: { _id: { firstName: '$teachers.firstName', lastName: '$teachers.lastName' }, lessonCount: { $sum: 1 } } },
      { $project: { _id: 0, firstName: '$_id.firstName', lastName: '$_id.lastName', lessonCount: 1 } },
      { $sort: { lastName: 1, firstName: 1 } }
    ]).toArray();
    res.json(data);
  } catch (error) { next(error); }
});
api.get('/teachers/:firstName/:lastName/lessons', async (req, res, next) => {
  try {
    const result = await lessons().find({ teachers: { $elemMatch: { firstName: req.params.firstName, lastName: req.params.lastName } } }).toArray();
    res.json(result);
  } catch (error) { next(error); }
});
api.get('/enrolment/:lessonid', async (req, res, next) => {
  try {
    const lessonId = asObjectId(req.params.lessonid);
    const lesson = await lessons().findOne({ _id: lessonId });
    if (!lesson) return res.status(404).json({ error: 'Lesson not found' });
    const records = await orders().find({ 'lessonIDs.lessonID': { $in: [lessonId, String(lessonId)] } }).toArray();
    const count = records.reduce((sum, order) => sum + (order.lessonIDs || []).filter(x => String(x.lessonID) === String(lessonId)).reduce((n, x) => n + Number(x.numberOfSpace || 0), 0), 0);
    res.json({ lessonID: String(lessonId), enrolment: count });
  } catch (error) { next(error); }
});
api.post('/orders', async (req, res, next) => {
  try {
    const { name, phone, lessonIDs, numberOfSpace } = req.body || {};
    if (typeof name !== 'string' || !/^[A-Za-z ]+$/.test(name.trim())) return res.status(400).json({ error: 'Name must contain letters and spaces only' });
    if (typeof phone !== 'string' || !/^\d+$/.test(phone.trim())) return res.status(400).json({ error: 'Phone must contain numbers only' });
    if (!Array.isArray(lessonIDs) || !lessonIDs.length || lessonIDs.some(x => !x.lessonID || !Number.isInteger(Number(x.numberOfSpace)) || Number(x.numberOfSpace) < 1)) return res.status(400).json({ error: 'lessonIDs must include a lessonID and positive numberOfSpace for each lesson' });
    const order = { name: name.trim(), phone: phone.trim(), lessonIDs: lessonIDs.map(x => ({ lessonID: String(x.lessonID), numberOfSpace: Number(x.numberOfSpace) })), numberOfSpace: Number(numberOfSpace) || lessonIDs.reduce((n,x) => n + Number(x.numberOfSpace), 0), createdAt: new Date() };
    const result = await orders().insertOne(order);
    res.status(201).json({ message: 'Order submitted', orderId: result.insertedId });
  } catch (error) { next(error); }
});
api.put('/lessons/:id', async (req, res, next) => {
  try {
    const id = asObjectId(req.params.id);
    const allowed = ['topic', 'location', 'price', 'space', 'icon', 'image', 'teachers'];
    const entries = Object.entries(req.body || {}).filter(([key]) => allowed.includes(key));
    if (!entries.length) return res.status(400).json({ error: 'Provide at least one supported lesson attribute' });
    const update = Object.fromEntries(entries);
    if ('space' in update && (!Number.isInteger(Number(update.space)) || Number(update.space) < 0)) return res.status(400).json({ error: 'space must be a non-negative whole number' });
    if ('price' in update && (!Number.isFinite(Number(update.price)) || Number(update.price) < 0)) return res.status(400).json({ error: 'price must be a non-negative number' });
    if ('space' in update) update.space = Number(update.space);
    if ('price' in update) update.price = Number(update.price);
    const result = await lessons().findOneAndUpdate({ _id: id }, { $set: update }, { returnDocument: 'after' });
    if (!result) return res.status(404).json({ error: 'Lesson not found' });
    res.json(result);
  } catch (error) { next(error); }
});
app.use('/api', api);
// Also expose the coursework-required routes at root, e.g. GET /lessons.
app.use('/', api);
// express.static serves existing files; this route explains missing images.
app.get('/images/:filename', (req, res) => {
  const filename = path.basename(req.params.filename);
  const file = path.join(__dirname, 'public', 'images', filename);
  fs.access(file, fs.constants.R_OK, error => {
    if (error) return res.status(404).json({ error: `Image not found: ${filename}` });
    res.sendFile(file);
  });
});
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));
app.use((error, req, res, next) => {
  console.error(error.stack || error);
  res.status(500).json({ error: 'Server error', details: process.env.NODE_ENV === 'production' ? undefined : error.message });
});

async function start() {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is required');
  await client.connect();
  db = client.db(process.env.DB_NAME || 'afterclass');
  await Promise.all([
    lessons().createIndex({ topic: 1 }),
    lessons().createIndex({ location: 1 }),
    orders().createIndex({ createdAt: -1 })
  ]);
  app.listen(port, () => console.log(`AfterClass API listening on port ${port}; database ${db.databaseName}`));
}
start().catch(error => { console.error('API startup failed:', error.message); process.exit(1); });
process.on('SIGINT', async () => { await client.close(); process.exit(0); });
process.on('SIGTERM', async () => { await client.close(); process.exit(0); });


