import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from './config/db.js';
import Attendance from './models/Attendance.js';

async function main(){
  mongoose.set('autoIndex', false);
  await connectDB();
  const collection=Attendance.collection;
  const exists=await mongoose.connection.db.listCollections({name:collection.collectionName}).hasNext();
  if(!exists)await mongoose.connection.db.createCollection(collection.collectionName);
  const indexes=await collection.indexes();
  const old=indexes.find(i=>i.unique && i.key?.intern===1 && i.key?.dateKey===1 && !('sessionNumber' in i.key));
  if(old){
    console.log(`Dropping legacy unique index: ${old.name}`);
    await collection.dropIndex(old.name);
  }
  const legacy=await collection.updateMany({sessionNumber:{$exists:false},status:'present'},{$set:{sessionNumber:1,status:'approved',rewardIssued:true,rewardAmount:1}});
  const remaining=await collection.updateMany({sessionNumber:{$exists:false}},{$set:{sessionNumber:1,rewardAmount:1}});
  const result={modifiedCount:legacy.modifiedCount+remaining.modifiedCount};
  const currentIndexes=await collection.indexes();
  if(!currentIndexes.some(i=>i.name==='intern_date_session_unique')) await collection.createIndex({intern:1,dateKey:1,sessionNumber:1},{unique:true,name:'intern_date_session_unique'});
  if(!currentIndexes.some(i=>i.name==='group_date_status')) await collection.createIndex({group:1,dateKey:-1,status:1},{name:'group_date_status'});
  console.log(`Attendance migration complete. Existing records normalized: ${result.modifiedCount}.`);
}
main().catch(error=>{console.error('Attendance migration failed:',error.message);process.exitCode=1;}).finally(async()=>mongoose.disconnect());
