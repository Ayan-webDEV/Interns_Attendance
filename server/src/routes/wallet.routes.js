import { Router } from 'express';
import WalletTransaction from '../models/WalletTransaction.js';
import crypto from 'node:crypto';
import { requireAuth, requireRegisteredIntern, requireAdmin } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { HttpError } from '../utils/httpError.js';
const router=Router();
router.get('/mine',requireAuth,requireRegisteredIntern,asyncHandler(async(req,res)=>{
 const transactions=await WalletTransaction.find({intern:req.user._id}).sort({createdAt:-1}).limit(500).lean();
 res.json({balance:req.user.internCashBalance,conversion:Number(process.env.INTERN_CASH_TO_INR||0.5),transactions});
}));
router.get('/admin/transactions',requireAuth,requireAdmin,asyncHandler(async(req,res)=>{
 const filter={};if(req.query.groupId)filter.$or=[{group:req.query.groupId},{intern:{$in:await (await import('../models/User.js')).default.find({group:req.query.groupId,role:'intern'}).distinct('_id')}}];
 const transactions=await WalletTransaction.find(filter).populate({path:'intern',select:'name email internId group',populate:{path:'group',select:'name'}}).populate('group','name').sort({createdAt:-1}).limit(5000).lean(); res.json({transactions});
}));
router.post('/admin/adjust',requireAuth,requireAdmin,asyncHandler(async(req,res)=>{
 const {internId,amount,reason}=req.body; const n=Number(amount); if(!Number.isInteger(n)||n===0||!reason) throw new HttpError(400,'A non-zero whole-number adjustment and reason are required.');
 const User=(await import('../models/User.js')).default; const user=await User.findById(internId); if(!user||user.role!=='intern') throw new HttpError(404,'Intern not found.');
 if(user.internCashBalance+n<0) throw new HttpError(400,'Balance cannot be negative.'); user.internCashBalance+=n; await user.save();
 const transaction=await WalletTransaction.create({intern:user._id,group:user.group,amount:n,type:'admin_adjustment',reference:`admin-adjustment:${crypto.randomUUID()}`,description:String(reason).slice(0,300),balanceAfter:user.internCashBalance}); res.json({transaction,balance:user.internCashBalance});
}));
export default router;
