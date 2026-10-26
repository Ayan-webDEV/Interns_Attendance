import { Router } from 'express';
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import InternshipGroup from '../models/InternshipGroup.js';
import User from '../models/User.js';
import Attendance from '../models/Attendance.js';
import AttendanceSession from '../models/AttendanceSession.js';
import WalletTransaction from '../models/WalletTransaction.js';
import PromoCode from '../models/PromoCode.js';
import Notification from '../models/Notification.js';
import GroupArchive from '../models/GroupArchive.js';
import AuditLog from '../models/AuditLog.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { HttpError } from '../utils/httpError.js';
const router = Router();
const hash = (s) => crypto.createHash('sha256').update(s).digest('hex');
const encryptionKey = () => crypto.createHash('sha256').update(String(process.env.INVITE_TOKEN_ENCRYPTION_KEY || process.env.JWT_SECRET || '')).digest();
const encrypt = (value) => { const iv=crypto.randomBytes(12); const cipher=crypto.createCipheriv('aes-256-gcm',encryptionKey(),iv); const encrypted=Buffer.concat([cipher.update(value,'utf8'),cipher.final()]); return `${iv.toString('base64url')}.${cipher.getAuthTag().toString('base64url')}.${encrypted.toString('base64url')}`; };
const decrypt = (value) => { const [iv,tag,data]=String(value||'').split('.'); if(!iv||!tag||!data) return null; const decipher=crypto.createDecipheriv('aes-256-gcm',encryptionKey(),Buffer.from(iv,'base64url')); decipher.setAuthTag(Buffer.from(tag,'base64url')); return Buffer.concat([decipher.update(Buffer.from(data,'base64url')),decipher.final()]).toString('utf8'); };
const addDays = (date, days) => { const d=new Date(date); d.setDate(d.getDate()+Number(days||0)); return d; };
const safeGroup = (g) => { const x=g?.toObject?g.toObject():{...g}; delete x.inviteTokenHash; delete x.inviteTokenEncrypted; return x; };
const csvEscape = (v) => `"${String(v ?? '').replaceAll('"','""')}"`;
const buildCsv = (archives) => {
  const rows=[['archiveVersion','archiveDate','groupId','groupName','recordType','recordId','recordJson']];
  for(const archive of archives){
    const snap=archive.snapshot||{};
    for(const [type,list] of Object.entries(snap)){
      const items=Array.isArray(list)?list:[list];
      for(const item of items){ rows.push(['1',archive.archivedAt?.toISOString?.()||'',archive.originalGroupId,archive.groupName,type,String(item?._id||item?.id||''),JSON.stringify(item)]); }
    }
  }
  return rows.map(row=>row.map(csvEscape).join(',')).join('\r\n');
};
router.get('/', requireAuth, asyncHandler(async(req,res)=>{
  if(req.user.role==='admin') {
    const groups=await InternshipGroup.find().sort({createdAt:-1}).lean();
    const ids=groups.map(g=>g._id);
    const counts=await User.aggregate([{ $match:{role:'intern',group:{$in:ids}}},{ $group:{_id:'$group',count:{$sum:1}}}]);
    const countMap=new Map(counts.map(c=>[String(c._id),c.count]));
    return res.json({groups:groups.map(g=>({...safeGroup(g),internCount:countMap.get(String(g._id))||0}))});
  }
  if(!req.user.group) return res.json({groups:[]});
  return res.json({groups:await InternshipGroup.find({_id:req.user.group}).lean()});
}));
router.post('/', requireAuth, requireAdmin, asyncHandler(async(req,res)=>{
  const name=String(req.body.name||'').trim(); if(name.length<3) throw new HttpError(400,'Group name must be at least 3 characters.');
  const whatsappGroupCode=String(req.body.whatsappGroupCode||'').trim(); if(whatsappGroupCode.length<2) throw new HttpError(400,'WhatsApp group code is required.');
  const durationDays=Number(req.body.durationDays??28); if(!Number.isInteger(durationDays)||durationDays<1||durationDays>365) throw new HttpError(400,'Internship duration must be between 1 and 365 days.');
  const plannedStartDate=req.body.plannedStartDate?new Date(req.body.plannedStartDate):undefined;if(plannedStartDate&&Number.isNaN(plannedStartDate.getTime()))throw new HttpError(400,'Choose a valid planned start date.');
  const inviteToken=crypto.randomBytes(32).toString('base64url');
  const group=await InternshipGroup.create({name,description:String(req.body.description||''),whatsappGroupCode,durationDays,inviteTokenHash:hash(inviteToken),inviteTokenEncrypted:encrypt(inviteToken),createdBy:req.user._id,plannedStartDate});
  await AuditLog.create({action:'group_created',group:group._id,actor:req.user._id,details:{name:group.name,durationDays:group.durationDays,plannedStartDate:group.plannedStartDate}});
  res.status(201).json({group:safeGroup(group),inviteToken});
}));
router.patch('/:id', requireAuth, requireAdmin, asyncHandler(async(req,res)=>{
  const group=await InternshipGroup.findById(req.params.id); if(!group) throw new HttpError(404,'Group not found.');
  const {name,description,whatsappGroupCode,plannedStartDate,actualStartDate,durationDays}=req.body;
  if(name!==undefined){const v=String(name).trim();if(v.length<3)throw new HttpError(400,'Group name must be at least 3 characters.');group.name=v;}
  if(description!==undefined) group.description=String(description).slice(0,2000);
  if(whatsappGroupCode!==undefined){const v=String(whatsappGroupCode).trim();if(v.length<2)throw new HttpError(400,'WhatsApp group code must be at least 2 characters.');group.whatsappGroupCode=v;}
  if(durationDays!==undefined){const v=Number(durationDays);if(!Number.isInteger(v)||v<1||v>365)throw new HttpError(400,'Duration must be between 1 and 365 days.');group.durationDays=v;}
  if(plannedStartDate!==undefined && group.status==='registration'){const d=plannedStartDate?new Date(plannedStartDate):undefined;if(d&&Number.isNaN(d.getTime()))throw new HttpError(400,'Choose a valid planned start date.');group.plannedStartDate=d;}
  if(actualStartDate!==undefined && group.status==='active'){const d=new Date(actualStartDate);if(Number.isNaN(d.getTime()))throw new HttpError(400,'Choose a valid actual start date.');group.actualStartDate=d;}
  if(group.status==='active'&&group.actualStartDate) group.actualEndDate=addDays(group.actualStartDate,Number(group.durationDays||28));
  if(group.status==='completed')group.archivedAt=undefined;
  await group.save();
  await AuditLog.create({action:'group_updated',group:group._id,actor:req.user._id,details:{name:group.name,description:group.description,whatsappGroupCode:group.whatsappGroupCode,durationDays:group.durationDays,plannedStartDate:group.plannedStartDate,actualStartDate:group.actualStartDate}});
  res.json({group:safeGroup(group)});
}));
router.get('/:id/invite', requireAuth, requireAdmin, asyncHandler(async(req,res)=>{
  const group=await InternshipGroup.findById(req.params.id).select('+inviteTokenEncrypted'); if(!group) throw new HttpError(404,'Group not found.');
  if(group.status==='completed')throw new HttpError(409,'Completed groups cannot retrieve active registration links.');
  let token=group.inviteTokenEncrypted?decrypt(group.inviteTokenEncrypted):null;
  if(!token){ token=crypto.randomBytes(32).toString('base64url'); group.inviteTokenHash=hash(token); group.inviteTokenEncrypted=encrypt(token); group.inviteActive=true; await group.save(); }
  if(!group.inviteActive) throw new HttpError(409,'This invitation has been disabled. Reset it to create a new link.');
  res.json({inviteToken:token,inviteActive:group.inviteActive});
}));
router.post('/:id/regenerate-invite', requireAuth, requireAdmin, asyncHandler(async(req,res)=>{
  const group=await InternshipGroup.findById(req.params.id).select('+inviteTokenEncrypted'); if(!group) throw new HttpError(404,'Group not found.');
  if(group.status==='completed')throw new HttpError(409,'Completed groups cannot create new registration invitations.');
  const inviteToken=crypto.randomBytes(32).toString('base64url'); group.inviteTokenHash=hash(inviteToken); group.inviteTokenEncrypted=encrypt(inviteToken); group.inviteActive=true; await group.save(); res.json({inviteToken,group:safeGroup(group)});
}));
router.post('/:id/start', requireAuth, requireAdmin, asyncHandler(async(req,res)=>{
  const group=await InternshipGroup.findById(req.params.id); if(!group) throw new HttpError(404,'Group not found.');
  if(group.status==='completed'||group.status==='completion_pending') throw new HttpError(409,'Completed or pending-completion groups cannot be started.');
  const start=req.body.actualStartDate?new Date(req.body.actualStartDate):(group.plannedStartDate||new Date());
  if(Number.isNaN(start.getTime())) throw new HttpError(400,'Choose a valid start date.');
  group.status='active'; group.actualStartDate=start; group.durationDays=Number(group.durationDays||28); group.actualEndDate=addDays(start,group.durationDays); await group.save(); await AuditLog.create({action:'group_started',group:group._id,actor:req.user._id,details:{actualStartDate:group.actualStartDate,actualEndDate:group.actualEndDate,durationDays:group.durationDays}}); res.json({group:safeGroup(group)});
}));
router.post('/:id/request-completion', requireAuth, requireAdmin, asyncHandler(async(req,res)=>{
  const group=await InternshipGroup.findById(req.params.id); if(!group) throw new HttpError(404,'Group not found.');
  if(group.status!=='active') throw new HttpError(409,'Only an active group can be marked for completion.');
  const admin=await User.findById(req.user._id).select('+passwordHash'); if(!admin.passwordHash||!(await bcrypt.compare(String(req.body.password||''),admin.passwordHash))) throw new HttpError(401,'Your admin password is incorrect.');
  group.status='completion_pending'; group.completionApprovals=[{admin:req.user._id,approvedAt:new Date()}]; await group.save(); res.json({message:'First approval recorded. A different authorized admin must approve.',group:safeGroup(group)});
}));
router.post('/:id/approve-completion', requireAuth, requireAdmin, asyncHandler(async(req,res)=>{
  const group=await InternshipGroup.findById(req.params.id); if(!group) throw new HttpError(404,'Group not found.');
  if(group.status!=='completion_pending') throw new HttpError(409,'This group is not awaiting completion approval.');
  if(group.completionApprovals.some(a=>String(a.admin)===String(req.user._id))) throw new HttpError(409,'A different authorized admin must provide the second approval.');
  const admin=await User.findById(req.user._id).select('+passwordHash'); if(!admin.passwordHash||!(await bcrypt.compare(String(req.body.password||''),admin.passwordHash))) throw new HttpError(401,'Your admin password is incorrect.');
  group.completionApprovals.push({admin:req.user._id,approvedAt:new Date()}); group.status='completed'; group.completedAt=new Date(); group.inviteActive=false; await group.save(); await AuditLog.create({action:'group_completed',group:group._id,actor:req.user._id,details:{completedAt:group.completedAt,approvalCount:group.completionApprovals.length}});
  res.json({message:'Group completed. Attendance is closed and certification status is unlocked.',group:safeGroup(group)});
}));
router.get('/:id/interns', requireAuth, requireAdmin, asyncHandler(async(req,res)=>{
  const group=await InternshipGroup.findById(req.params.id); if(!group) throw new HttpError(404,'Group not found.');
  const interns=await User.find({group:group._id,role:'intern'}).select('-passwordHash -googleSub').sort({name:1}).lean(); res.json({group:safeGroup(group),interns});
}));
router.post('/:id/transfer-intern', requireAuth, requireAdmin, asyncHandler(async(req,res)=>{
  const {internId,targetGroupId}=req.body; const lookup=String(internId||'').trim().toUpperCase(); const criteria=mongoose.Types.ObjectId.isValid(String(internId||''))?{_id:internId,role:'intern'}:{internId:lookup,role:'intern'}; const intern=await User.findOne(criteria); if(!intern) throw new HttpError(404,'Intern not found.');
  const target=await InternshipGroup.findById(targetGroupId); if(!target||target.status==='completed') throw new HttpError(400,'Choose a valid, non-completed destination group.');
  const sourceGroup=intern.group;const internSnapshot={_id:intern._id,internId:intern.internId,name:intern.name,email:intern.email,domain:intern.domain,whatsappNumber:intern.whatsappNumber,sourceGroup};
  intern.group=target._id; intern.whatsappGroupName=target.name; intern.whatsappGroupCode=target.whatsappGroupCode; await intern.save();
  await AttendanceSession.deleteMany({intern:intern._id,consumedAt:null});
  if(sourceGroup)await Attendance.updateMany({intern:intern._id,group:sourceGroup,status:'pending'},{$set:{status:'rejected',rejectedAt:new Date(),rejectedBy:req.user._id,rejectionReason:'Intern transferred to another group.'},$push:{approvalHistory:{action:'rejected',actor:req.user._id,at:new Date(),note:'Intern transferred to another group.'}}});
  await AuditLog.create({action:'intern_transferred',group:sourceGroup||undefined,relatedGroup:target._id,intern:intern._id,actor:req.user._id,details:{fromGroup:sourceGroup?String(sourceGroup):null,toGroup:String(target._id),internSnapshot,reason:String(req.body.reason||'Admin transfer').slice(0,500)}});
  res.json({message:`${intern.name} transferred to ${target.name}.`,intern:{id:intern._id,internId:intern.internId,name:intern.name,group:target._id}});
}));
router.post('/:id/archive', requireAuth, requireAdmin, asyncHandler(async(req,res)=>{
  const group=await InternshipGroup.findById(req.params.id); if(!group) throw new HttpError(404,'Group not found.');
  if(group.status!=='completed') throw new HttpError(409,'Only completed groups can be archived.');
  const groupId=String(group._id);
  await group.populate('completionApprovals.admin','name email');
  const [interns,attendance,sessions,promoCodes,notifications,auditLogs]=await Promise.all([
    User.find({group:group._id,role:'intern'}).select('-passwordHash -googleSub').lean(),
    Attendance.find({group:group._id}).populate('intern','name email internId domain whatsappNumber').populate('approvedBy rejectedBy correctedBy','name email').lean(),
    AttendanceSession.find({group:group._id}).lean(),
    PromoCode.find({group:group._id}).lean(),
    Notification.find({$or:[{targetGroup:group._id},{targetGroup:null}]}).lean(),
    AuditLog.find({$or:[{group:group._id},{relatedGroup:group._id}]}).populate('actor','name email').lean()
  ]);
  const relatedIds=new Set(interns.map(x=>String(x._id)));for(const row of attendance){if(row.intern?._id)relatedIds.add(String(row.intern._id));}for(const log of auditLogs){if(log.intern)relatedIds.add(String(log.intern));if(log.details?.internSnapshot?._id)relatedIds.add(String(log.details.internSnapshot._id));}
  const internIds=[...relatedIds].map(id=>new mongoose.Types.ObjectId(id));
  const walletTransactions=await WalletTransaction.find({$or:[{group:group._id},{group:{$exists:false},intern:{$in:internIds}}]}).populate('createdBy','name email').lean();
  const snapshot={group:safeGroup(group),interns,attendance,sessions,walletTransactions,promoCodes,notifications,auditLogs};
  await GroupArchive.findOneAndUpdate({originalGroupId:groupId},{$set:{groupName:group.name,archivedAt:new Date(),archivedBy:req.user._id,snapshot}},{upsert:true,new:true,setDefaultsOnInsert:true});
  group.archivedAt=new Date(); await group.save();
  const archives=await GroupArchive.find().sort({archivedAt:1}).lean();
  res.setHeader('Content-Type','text/csv; charset=utf-8');
  res.setHeader('Content-Disposition',`attachment; filename="VELOop-Complete-Archive-Latest-${new Date().toISOString().slice(0,10)}.csv"`);
  res.send('\uFEFF'+buildCsv(archives));
}));
router.delete('/:id', requireAuth, requireAdmin, asyncHandler(async(req,res)=>{
  const group=await InternshipGroup.findById(req.params.id); if(!group) throw new HttpError(404,'Group not found.');
  if(group.status!=='completed') throw new HttpError(409,'Only completed groups can be deleted.');
  const archived=await GroupArchive.findOne({originalGroupId:String(group._id)}); if(!archived||!group.archivedAt) throw new HttpError(409,'Export and archive the latest group details before deleting it. If you edited the group after archiving, update the archive first.');
  const session=await mongoose.startSession();
  try { await session.withTransaction(async()=>{
    const users=await User.find({group:group._id,role:'intern'}).select('_id').session(session); const ids=users.map(u=>u._id);
    await Attendance.deleteMany({group:group._id},{session}); await AttendanceSession.deleteMany({group:group._id},{session});
    await WalletTransaction.deleteMany({$or:[{group:group._id},{group:{$exists:false},intern:{$in:ids}}]},{session}); await PromoCode.deleteMany({group:group._id},{session}); await Notification.deleteMany({targetGroup:group._id},{session}); await AuditLog.deleteMany({$or:[{group:group._id},{relatedGroup:group._id}]},{session});
    await User.deleteMany({_id:{$in:ids}},{session}); await InternshipGroup.deleteOne({_id:group._id},{session});
  }); } finally { await session.endSession(); }
  res.json({message:'Archived group and its live records deleted. The cumulative archive remains available.'});
}));
router.get('/admin/archive/download', requireAuth, requireAdmin, asyncHandler(async(req,res)=>{
  const archives=await GroupArchive.find().sort({archivedAt:1}).lean();
  res.setHeader('Content-Type','text/csv; charset=utf-8'); res.setHeader('Content-Disposition',`attachment; filename="VELOop-Complete-Archive-Latest-${new Date().toISOString().slice(0,10)}.csv"`); res.send('\uFEFF'+buildCsv(archives));
}));
export default router;
