const lessons = [
  ['Creative coding', 'Hendon', 12, '💻', 'Amira', 'Khan'],
  ['Street dance', 'Colindale', 10, '🩰', 'Noah', 'Bennett'],
  ['Junior football', 'Brent Cross', 14, '⚽', 'Amira', 'Khan'],
  ['Pottery studio', 'Golders Green', 16, '🏺', 'Sofia', 'Patel'],
  ['Guitar club', 'Hendon', 13, '🎸', 'Ethan', 'Brooks'],
  ['Science lab', 'Mill Hill', 15, '🔬', 'Sofia', 'Patel'],
  ['Basketball skills', 'Finchley', 12, '🏀', 'Noah', 'Bennett'],
  ['Art & illustration', 'Colindale', 11, '🎨', 'Lily', 'Chen'],
  ['Chess thinkers', 'Brent Cross', 9, '♟️', 'Ethan', 'Brooks'],
  ['Young chefs', 'Golders Green', 17, '🧑‍🍳', 'Lily', 'Chen']
].map(([topic, location, price, icon, firstName, lastName]) => ({
  topic, location, price, space: 5, icon, image: ({'Creative coding':'coding.svg','Street dance':'dance.svg','Junior football':'football.svg','Pottery studio':'pottery.svg','Guitar club':'guitar.svg','Science lab':'science.svg','Basketball skills':'basketball.svg','Art & illustration':'art.svg','Chess thinkers':'chess.svg','Young chefs':'cooking.svg'})[topic],
  teachers: [{ firstName, lastName }],
}));

async function main() {
  require('dotenv').config();
  const { MongoClient } = require('mongodb');
  if (!process.env.MONGODB_URI) throw new Error('Set MONGODB_URI in .env');
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db(process.env.DB_NAME || 'afterclass');
  const result = await db.collection('lesson').insertMany(lessons);
  console.log(`Inserted ${result.insertedCount} lessons into ${db.databaseName}.lesson`);
  await client.close();
}
main().catch(error => { console.error(error); process.exitCode = 1; });


