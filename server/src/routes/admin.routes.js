import { Router } from 'express';
import User from '../models/User.js';
import Attendance from '../models/Attendance.js';
import InternshipGroup from '../models/InternshipGroup.js';
import PromoCode from '../models/PromoCode.js';
import AppSettings from '../models/AppSettings.js';
import { HttpError } from '../utils/httpError.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
const router=Router();

const defaultSchedule={firstStart:'09:30',firstEnd:'12:30',secondStart:'13:00',secondEnd:'15:30',minimumSeconds:Number(process.env.ATTENDANCE_MIN_SECONDS||50)};
const toMinutes=(v)=>{const m=String(v||'').match(/^(\d{2}):(\d{2})$/);if(!m)return NaN;const h=Number(m[1]),n=Number(m[2]);return h<=23&&n<=59?h*60+n:NaN};
router.get('/settings/attendance',requireAuth,requireAdmin,asyncHandler(async(req,res)=>{const saved=await AppSettings.findOne({key:'attendance-schedule'}).lean();res.json({settings:{...defaultSchedule,...(saved?.value||{})}})}));
router.patch('/settings/attendance',requireAuth,requireAdmin,asyncHandler(async(req,res)=>{
 const value={firstStart:String(req.body.firstStart||''),firstEnd:String(req.body.firstEnd||''),secondStart:String(req.body.secondStart||''),secondEnd:String(req.body.secondEnd||''),minimumSeconds:Number(req.body.minimumSeconds||50)};
 const a=toMinutes(value.firstStart),b=toMinutes(value.firstEnd),c=toMinutes(value.secondStart),d=toMinutes(value.secondEnd);
 if([a,b,c,d].some(Number.isNaN)||a>=b||c>=d||a>=c||b>c)throw new HttpError(400,'Use valid times. The first window must finish before the second window starts.');
 if(!Number.isInteger(value.minimumSeconds)||value.minimumSeconds<10||value.minimumSeconds>600)throw new HttpError(400,'Minimum attendance wait must be 10–600 seconds.');
 const saved=await AppSettings.findOneAndUpdate({key:'attendance-schedule'},{$set:{value,updatedBy:req.user._id}},{upsert:true,new:true,setDefaultsOnInsert:true});res.json({message:'Attendance schedule updated for all groups.',settings:saved.value});
}));
router.get('/overview',requireAuth,requireAdmin,asyncHandler(async(req,res)=>{
 const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
 const [totalInterns,groups,activeGroups,presentToday,completedGroups,promoCodes]=await Promise.all([
  User.countDocuments({role:'intern'}),InternshipGroup.countDocuments(),InternshipGroup.countDocuments({status:'active'}),Attendance.countDocuments({dateKey:today,status:{$in:['approved','admin_corrected_present']}}),InternshipGroup.countDocuments({status:'completed'}),PromoCode.countDocuments({active:true})
 ]);
 res.json({totalInterns,groups,activeGroups,presentToday,completedGroups,activePromoCodes:promoCodes});
}));
router.get('/interns',requireAuth,requireAdmin,asyncHandler(async(req,res)=>{
 const q=String(req.query.q||'').trim(); const filter={role:'intern'};
 if(req.query.groupId) filter.group=req.query.groupId;
 if(q) filter.$or=[{name:{$regex:q,$options:'i'}},{email:{$regex:q,$options:'i'}},{internId:{$regex:q,$options:'i'}},{whatsappNumber:{$regex:q,$options:'i'}},{domain:{$regex:q,$options:'i'}}];
 const interns=await User.find(filter).select('-passwordHash -googleSub').populate('group','name status').sort({createdAt:-1}).limit(1000).lean(); res.json({interns});
}));
export default router;
