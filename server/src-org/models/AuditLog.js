import mongoose from 'mongoose';
const schema=new mongoose.Schema({
  action:{type:String,required:true,index:true},
  group:{type:mongoose.Schema.Types.ObjectId,ref:'InternshipGroup',index:true},
  relatedGroup:{type:mongoose.Schema.Types.ObjectId,ref:'InternshipGroup',index:true},
  intern:{type:mongoose.Schema.Types.ObjectId,ref:'User',index:true},
  actor:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true},
  details:{type:mongoose.Schema.Types.Mixed,default:{}}
},{timestamps:true});
schema.index({group:1,createdAt:-1});
export default mongoose.model('AuditLog',schema);
