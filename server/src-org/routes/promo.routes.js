import { Router } from 'express';
import crypto from 'node:crypto';
import mongoose from 'mongoose';
import PromoCode from '../models/PromoCode.js';
import InternshipGroup from '../models/InternshipGroup.js';
import User from '../models/User.js';
import WalletTransaction from '../models/WalletTransaction.js';
import { requireAuth, requireAdmin, requireRegisteredIntern } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { HttpError } from '../utils/httpError.js';
const router=Router();
const makeCode=()=>crypto.randomBytes(5).toString('hex').toUpperCase();
router.get('/',requireAuth,requireAdmin,asyncHandler(async(req,res)=>res.json({codes:await PromoCode.find().populate('group','name status').populate('createdBy','name email').sort({createdAt:-1}).lean()})));
router.post('/',requireAuth,requireAdmin,asyncHandler(async(req,res)=>{
 const group=await InternshipGroup.findById(req.body.groupId); if(!group||group.status==='completed') throw new HttpError(400,'Choose a valid, non-completed group.');
 const minReward=Number(req.body.minReward),maxReward=Number(req.body.maxReward),maxRedemptions=Number(req.body.maxRedemptions);
 if(!Number.isInteger(minReward)||!Number.isInteger(maxReward)||minReward<1||maxReward<minReward) throw new HttpError(400,'Enter a valid whole-number reward range.');
 if(!Number.isInteger(maxRedemptions)||maxRedemptions<1||maxRedemptions>100000) throw new HttpError(400,'Enter a valid redemption limit.');
 const code=String(req.body.code||makeCode()).toUpperCase().replace(/[^A-Z0-9-]/g,''); if(code.length<5||code.length>24) throw new HttpError(400,'Promo code must be 5–24 characters.');
 const created=await PromoCode.create({code,group:group._id,minReward,maxReward,maxRedemptions,createdBy:req.user._id,expiresAt:req.body.expiresAt?new Date(req.body.expiresAt):undefined}); res.status(201).json({code:created});
}));

router.post('/:id/expire',requireAuth,requireAdmin,asyncHandler(async(req,res)=>{
 const promo=await PromoCode.findById(req.params.id);if(!promo)throw new HttpError(404,'Promo code not found.');
 promo.active=false;promo.expiredAt=new Date();promo.expiredBy=req.user._id;await promo.save();res.json({message:'Promo code expired immediately.',code:promo});
}));
router.post('/redeem',requireAuth,requireRegisteredIntern,asyncHandler(async(req,res)=>{
 const code=String(req.body.code||'').trim().toUpperCase(); if(!code) throw new HttpError(400,'Enter a promo code.');
 const session=await mongoose.startSession(); let outcome;
 try {
  await session.withTransaction(async()=>{
   const promo=await PromoCode.findOne({code}).session(session); if(!promo||!promo.active) throw new HttpError(400,'This promo code is invalid or inactive.');
   if(String(promo.group)!==String(req.user.group)) throw new HttpError(403,'This promo code is for a different internship group.');
   if(promo.expiresAt&&promo.expiresAt<new Date()) throw new HttpError(400,'This promo code has expired.');
   if(promo.redeemedBy.some(x=>String(x.intern)===String(req.user._id))) throw new HttpError(409,'You have already redeemed this promo code.');
   if(promo.redemptionCount>=promo.maxRedemptions) throw new HttpError(409,'This promo code has reached its redemption limit.');
   const reward=crypto.randomInt(promo.minReward,promo.maxReward+1);
   promo.redeemedBy.push({intern:req.user._id,amount:reward,redeemedAt:new Date()}); promo.redemptionCount+=1; if(promo.redemptionCount>=promo.maxRedemptions) promo.active=false; await promo.save({session});
   const user=await User.findOneAndUpdate({_id:req.user._id},{$inc:{internCashBalance:reward}},{new:true,session});
   await WalletTransaction.create([{intern:user._id,group:promo.group,amount:reward,type:'promo_reward',reference:`promo:${promo._id}:${user._id}`,description:`Promo code ${promo.code} redemption`,balanceAfter:user.internCashBalance}],{session});
   outcome={reward,balance:user.internCashBalance,redemptionsRemaining:Math.max(0,promo.maxRedemptions-promo.redemptionCount)};
  });
 } finally { await session.endSession(); }
 res.json({message:`Promo code redeemed. You received ${outcome.reward} InternCash.`,...outcome});
}));
export default router;
