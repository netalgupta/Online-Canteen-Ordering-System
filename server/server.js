import dotenv from 'dotenv';
import express from 'express';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import { rateLimit } from 'express-rate-limit';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import nodemailer from 'nodemailer';
import menuSeed from './seed-menu.json' with { type: 'json' };
import { getPasswordPolicyError, isSomaiyaEmail } from './src/utils/authValidation.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({path:path.join(__dirname,'.env')});
const app = express(); app.use(express.json({limit:'1mb'}));
const PORT = Number(process.env.PORT || 3000);
const authLimiter = rateLimit({windowMs:15*60*1000,limit:20,standardHeaders:'draft-8',legacyHeaders:false,message:{error:'Too many authentication attempts. Try again later.'}});
const otpLimiter = rateLimit({windowMs:15*60*1000,limit:8,standardHeaders:'draft-8',legacyHeaders:false,message:{error:'Too many verification attempts. Try again later.'}});
const resendOtpLimiter = rateLimit({windowMs:60*60*1000,limit:3,standardHeaders:'draft-8',legacyHeaders:false,message:{error:'Too many verification codes requested. Try again later.'}});
const ADMIN_EMAILS = new Set((process.env.ADMIN_EMAILS || '').split(',').map(x=>x.trim().toLowerCase()).filter(Boolean));
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 32) { console.error('Set JWT_SECRET to a random secret of at least 32 characters.'); process.exit(1); }

// ─── Schemas ───────────────────────────────────────────────────────────────────
const userSchema = new mongoose.Schema({
  name:{type:String,required:true,trim:true,maxlength:100},
  email:{type:String,required:true,unique:true,lowercase:true,trim:true,match:/^[^\s@]+@somaiya\.edu$/i},
  passwordHash:{type:String,required:true},
  role:{type:String,enum:['student','staff','admin'],default:'student'},
  counterId:{type:String,enum:['C1','C2','C3','C4',null],default:null},
  verified:{type:Boolean,default:false},
  // OTP-based email verification (replaces link-based flow)
  otpHash:String,
  otpExpires:Date,
  otpAttempts:{type:Number,default:0},
  createdAt:{type:Date,default:Date.now}
},{versionKey:false});

const menuSchema = new mongoose.Schema({itemId:{type:String,unique:true,index:true},name:String,category:String,price:{type:Number,min:0},prepTimeMinutes:{type:Number,default:5},veg:{type:Boolean,default:true},available:{type:Boolean,default:true},popular:Boolean,description:String,image:String},{versionKey:false});
const orderSchema = new mongoose.Schema({orderNumber:{type:Number,unique:true},userId:{type:mongoose.Schema.Types.ObjectId,ref:'User',index:true},customerName:String,customerEmail:String,items:[{menuItemId:String,name:String,price:Number,quantity:{type:Number,min:1},instructions:String,counterId:String,status:{type:String,enum:['received','accepted','preparing','ready','collected'],default:'received'},prepTimeMinutes:Number}],pickupSlot:{type:Date,index:true},paymentMethod:{type:String,enum:['pay-at-counter','online','demo'],default:'pay-at-counter'},paymentStatus:{type:String,enum:['not-required','pending','paid','failed'],default:'not-required'},instructions:String,total:Number,status:{type:String,default:'received'},createdAt:{type:Date,default:Date.now}},{versionKey:false});
const User=mongoose.model('User',userSchema), Menu=mongoose.model('MenuItem',menuSchema), Order=mongoose.model('Order',orderSchema);

// ─── Email transport ───────────────────────────────────────────────────────────
const emailTransport = process.env.SMTP_HOST ? nodemailer.createTransport({
  host:process.env.SMTP_HOST,
  port:Number(process.env.SMTP_PORT||587),
  secure:process.env.SMTP_SECURE==='true',
  auth:process.env.SMTP_USER?{user:process.env.SMTP_USER,pass:process.env.SMTP_PASS}:undefined
}) : null;
if(process.env.NODE_ENV==='production'&&!emailTransport){console.error('Configure SMTP before starting QueueLess in production.');process.exit(1);}

// ─── Helpers ───────────────────────────────────────────────────────────────────
function safeUser(u){return {id:String(u._id),name:u.name,email:u.email,role:u.role,counterId:u.counterId,verified:u.verified};}
function issueToken(u){return jwt.sign({sub:String(u._id),email:u.email,name:u.name,role:u.role},JWT_SECRET,{expiresIn:'7d',issuer:'queueless-demo'});}
function auth(req,res,next){const raw=(req.headers.authorization||'').replace(/^Bearer\s+/i,'');try{if(!raw)throw 0;const p=jwt.verify(raw,JWT_SECRET,{issuer:'queueless-demo'});req.auth=p;next();}catch{return res.status(401).json({error:'Please sign in again.'});}}
function roles(...allowed){return async(req,res,next)=>{const u=await User.findById(req.auth.sub).catch(()=>null);if(!u)return res.status(401).json({error:'Account not found.'});if(!u.verified)return res.status(403).json({error:'Verify your email before continuing.'});if(!allowed.includes(u.role))return res.status(403).json({error:'You do not have permission for this action.'});req.user=u;next();};}
function counterFor(category=''){if(['Packaged Snacks','Snacks','Desserts','Ice Cream','Packaged Snacks & Ice Cream'].includes(category))return 'C1';if(['Frankie Counter','Juices','Juice','Frankie'].includes(category))return 'C2';if(['Chaat Items','Chaat'].includes(category))return 'C3';return 'C4';}

/** Generate a 6-digit OTP, store its hash, return plain OTP for emailing. */
function generateOtp(){
  const otp = String(Math.floor(100000 + crypto.randomInt(900000))).padStart(6,'0');
  const hash = crypto.createHash('sha256').update(otp).digest('hex');
  return {otp, hash};
}

/** Send OTP email (or print to console in dev). Returns {sent, devOtp?} */
async function sendOtpEmail(user, otp){
  const subject = 'Your QueueLess verification code';
  const text = `Hi ${user.name},\n\nYour QueueLess verification code is:\n\n  ${otp}\n\nThis code expires in 15 minutes. Do not share it with anyone.\n\nIf you did not create this account, ignore this message.`;
  const html = `<p>Hi <strong>${user.name}</strong>,</p>
<p>Your QueueLess verification code is:</p>
<h2 style="font-family:monospace;letter-spacing:8px;font-size:36px;color:#a8121c">${otp}</h2>
<p>This code expires in <strong>15 minutes</strong>. Do not share it with anyone.</p>
<p style="color:#888;font-size:12px">If you did not create this account, ignore this message.</p>`;

  if(emailTransport){
    await emailTransport.sendMail({from:process.env.MAIL_FROM||process.env.SMTP_USER,to:user.email,subject,text,html});
    return {sent:true};
  }
  console.log(`[DEMO OTP] Code for ${user.email}: ${otp}`);
  return {sent:false, devOtp: otp};
}

// ─── Health ────────────────────────────────────────────────────────────────────
app.get('/api/health',(_req,res)=>res.json({ok:true,service:'QueueLess MongoDB demo'}));

// ─── Auth: Register ────────────────────────────────────────────────────────────
app.post('/api/auth/register',authLimiter,async(req,res)=>{
  try{
    const name=String(req.body.name||'').trim(),email=String(req.body.email||'').trim().toLowerCase(),password=String(req.body.password||'');
    if(name.length<2||name.length>100)return res.status(400).json({error:'Enter your full name.'});
    if(!isSomaiyaEmail(email))return res.status(400).json({error:'Use your college email ending in @somaiya.edu.'});
    const passwordError=getPasswordPolicyError(password);
    if(passwordError)return res.status(400).json({error:passwordError});
    if(await User.exists({email}))return res.status(409).json({error:'An account already exists for this email.'});
    const role=ADMIN_EMAILS.has(email)?'admin':'student';
    const {otp,hash}=generateOtp();
    const user=await User.create({name,email,passwordHash:await bcrypt.hash(password,12),role,verified:false,otpHash:hash,otpExpires:new Date(Date.now()+15*60*1000),otpAttempts:0});
    const mail=await sendOtpEmail(user,otp);
    res.status(201).json({
      message: mail.sent
        ? 'Account created! Check your email for the 6-digit verification code.'
        : 'Account created! Email not configured — use the dev OTP below.',
      email:user.email,
      verificationRequired:true,
      devOtp: mail.devOtp || undefined
    });
  }catch(e){console.error(e);res.status(500).json({error:'Could not create account. Check server configuration.'});}
});

// ─── Auth: Verify OTP ──────────────────────────────────────────────────────────
app.post('/api/auth/verify-otp',otpLimiter,async(req,res)=>{
  try{
    const email=String(req.body.email||'').trim().toLowerCase();
    const otp=String(req.body.otp||'').trim().replace(/\s/g,'');
    if(!isSomaiyaEmail(email)||!otp)return res.status(400).json({error:'Use your @somaiya.edu email and enter the verification code.'});
    const u=await User.findOne({email,verified:false});
    if(!u)return res.status(404).json({error:'Account not found or already verified.'});
    if(u.otpAttempts>=5)return res.status(429).json({error:'Too many failed attempts. Request a new code.'});
    if(!u.otpHash||!u.otpExpires||u.otpExpires<new Date())return res.status(400).json({error:'Verification code has expired. Request a new one.'});
    const hash=crypto.createHash('sha256').update(otp).digest('hex');
    const storedHash=Buffer.from(u.otpHash,'hex');
    const submittedHash=Buffer.from(hash,'hex');
    if(storedHash.length!==submittedHash.length||!crypto.timingSafeEqual(storedHash,submittedHash)){
      u.otpAttempts=(u.otpAttempts||0)+1;
      await u.save();
      const left=5-u.otpAttempts;
      return res.status(400).json({error:`Incorrect code. ${left} attempt${left===1?'':'s'} remaining.`});
    }
    u.verified=true;
    u.otpHash=undefined;
    u.otpExpires=undefined;
    u.otpAttempts=0;
    await u.save();
    res.json({ok:true,message:'Email verified! You can now log in.'});
  }catch(e){console.error(e);res.status(500).json({error:'Could not verify code.'});}
});

// ─── Auth: Resend OTP ─────────────────────────────────────────────────────────
app.post('/api/auth/resend-otp',resendOtpLimiter,async(req,res)=>{
  try{
    const email=String(req.body.email||'').trim().toLowerCase();
    if(!isSomaiyaEmail(email))return res.status(400).json({error:'Use your college email ending in @somaiya.edu.'});
    const u=await User.findOne({email,verified:false});
    if(u){
      const {otp,hash}=generateOtp();
      u.otpHash=hash;
      u.otpExpires=new Date(Date.now()+15*60*1000);
      u.otpAttempts=0;
      await u.save();
      const mail=await sendOtpEmail(u,otp);
      return res.json({message:'A new verification code has been sent to your email.',devOtp:mail.devOtp||undefined});
    }
    res.json({message:'If the account exists and is unverified, a new code has been sent.'});
  }catch{res.status(500).json({error:'Could not resend code.'});}
});

// ─── Auth: Login ───────────────────────────────────────────────────────────────
app.post('/api/auth/login',authLimiter,async(req,res)=>{
  try{
    const email=String(req.body.email||'').trim().toLowerCase(),password=String(req.body.password||'');
    if(!isSomaiyaEmail(email))return res.status(400).json({error:'Use your college email ending in @somaiya.edu.'});
    const u=await User.findOne({email});
    if(!u||!(await bcrypt.compare(password,u.passwordHash)))return res.status(401).json({error:'Email or password is incorrect.'});
    if(!u.verified){
      // Auto-send a fresh OTP so user can verify inline on the login page
      const {otp,hash}=generateOtp();
      u.otpHash=hash;
      u.otpExpires=new Date(Date.now()+15*60*1000);
      u.otpAttempts=0;
      await u.save();
      const mail=await sendOtpEmail(u,otp);
      return res.status(403).json({
        error:'Please verify your email first. A new code has been sent.',
        verificationRequired:true,
        email:u.email,
        devOtp:mail.devOtp||undefined
      });
    }
    if(ADMIN_EMAILS.has(u.email)&&u.role!=='admin'){u.role='admin';await u.save();}
    const token=issueToken(u);
    res.json({token,user:safeUser(u)});
  }catch(e){console.error(e);res.status(500).json({error:'Could not sign in.'});}
});

// ─── Auth: Me / Logout / Profile / Password ────────────────────────────────────
app.get('/api/auth/me',auth,async(req,res)=>{const u=await User.findById(req.auth.sub);if(!u)return res.status(401).json({error:'Account not found.'});res.json({user:safeUser(u)});});
app.post('/api/auth/logout',(_req,res)=>res.json({ok:true}));
app.patch('/api/auth/profile',auth,async(req,res)=>{try{const u=await User.findById(req.auth.sub);if(!u)return res.status(401).json({error:'Account not found.'});if(req.body.name!==undefined){const name=String(req.body.name).trim();if(name.length<2||name.length>100)return res.status(400).json({error:'Name must be 2–100 characters.'});u.name=name;}await u.save();res.json({user:safeUser(u)});}catch{res.status(500).json({error:'Could not update profile.'});}});
app.patch('/api/auth/password',auth,async(req,res)=>{try{const u=await User.findById(req.auth.sub);if(!u||!(await bcrypt.compare(String(req.body.currentPassword||''),u.passwordHash)))return res.status(400).json({error:'Current password is incorrect.'});const next=String(req.body.newPassword||'');const passwordError=getPasswordPolicyError(next,'New password');if(passwordError)return res.status(400).json({error:passwordError});u.passwordHash=await bcrypt.hash(next,12);await u.save();res.json({ok:true});}catch{res.status(500).json({error:'Could not change password.'});}});

// ─── Menu ──────────────────────────────────────────────────────────────────────
app.get('/api/menu',async(_req,res)=>res.json({items:await Menu.find({}).sort({category:1,name:1}).lean()}));

// ─── Admin: Staff Access ───────────────────────────────────────────────────────
app.get('/api/admin/staff-access',auth,roles('admin'),async(_req,res)=>{const users=await User.find({role:{$in:['staff','student']}}).select('name email role counterId verified createdAt').sort({role:1,name:1}).lean();res.json({users:users.map(u=>({...u,id:String(u._id)}))});});
app.post('/api/admin/staff-access/approve',auth,roles('admin'),async(req,res)=>{try{const email=String(req.body.email||'').trim().toLowerCase(),counterId=String(req.body.counterId||'');if(!isSomaiyaEmail(email))return res.status(400).json({error:'Enter the exact @somaiya.edu email used to sign up.'});if(!['C1','C2','C3','C4'].includes(counterId))return res.status(400).json({error:'Choose a valid counter.'});const user=await User.findOne({email});if(!user)return res.status(404).json({error:'No account found for that email. Ask the person to sign up first.'});if(ADMIN_EMAILS.has(email)||user.role==='admin')return res.status(400).json({error:'Admin accounts cannot be changed to staff.'});user.role='staff';user.counterId=counterId;await user.save();res.json({message:'Staff access approved.',user:safeUser(user)});}catch(e){console.error(e);res.status(500).json({error:'Could not approve staff access.'});}});
app.patch('/api/admin/staff-access/:userId/revoke',auth,roles('admin'),async(req,res)=>{try{const user=await User.findById(req.params.userId);if(!user)return res.status(404).json({error:'Account not found.'});if(user.role==='admin'||ADMIN_EMAILS.has(user.email))return res.status(400).json({error:'Admin access cannot be revoked here.'});user.role='student';user.counterId=null;await user.save();res.json({message:'Staff access revoked.',user:safeUser(user)});}catch(e){res.status(500).json({error:'Could not revoke staff access.'});}});

// ─── Menu Management ───────────────────────────────────────────────────────────
app.put('/api/menu/:itemId',auth,roles('admin'),async(req,res)=>{try{const itemId=String(req.params.itemId).trim();const b=req.body||{};if(!itemId||!String(b.name||'').trim()||!String(b.category||'').trim()||!Number.isFinite(Number(b.price))||Number(b.price)<0)return res.status(400).json({error:'Provide item ID, name, category and a valid price.'});const item=await Menu.findOneAndUpdate({itemId},{$set:{itemId,name:String(b.name).trim(),category:String(b.category).trim(),price:Number(b.price),prepTimeMinutes:Math.max(1,Number(b.prepTimeMinutes||5)),available:b.available!==false,popular:!!b.popular,description:String(b.description||b.desc||''),image:String(b.image||''),veg:b.veg!==false}},{new:true,upsert:true,runValidators:true});res.json({item});}catch{res.status(500).json({error:'Could not save menu item.'});}});
app.patch('/api/menu/:itemId',auth,roles('admin','staff'),async(req,res)=>{const item=await Menu.findOne({itemId:req.params.itemId});if(!item)return res.status(404).json({error:'Menu item not found.'});if(req.user.role==='staff'&&counterFor(item.category)!==req.user.counterId)return res.status(403).json({error:'This item belongs to another counter.'});for(const k of ['available','prepTimeMinutes'])if(req.body[k]!==undefined)item[k]=req.body[k];if(req.user.role==='admin')for(const k of ['name','category','price','description','image','popular'])if(req.body[k]!==undefined)item[k]=req.body[k];await item.save();res.json({item});});

// ─── Orders ────────────────────────────────────────────────────────────────────
app.post('/api/orders',auth,roles('student','staff','admin'),async(req,res)=>{try{const items=req.body.items;if(!Array.isArray(items)||!items.length)return res.status(400).json({error:'Cart is empty.'});const pickupSlot=new Date(req.body.pickupSlot);if(!Number.isFinite(pickupSlot.getTime()))return res.status(400).json({error:'Choose a valid pickup slot.'});const hour=pickupSlot.getHours()+pickupSlot.getMinutes()/60;if(hour<6||hour>=19)return res.status(400).json({error:'Pickup slots must be between 6:00 AM and 7:00 PM.'});if(pickupSlot.getTime()<Date.now()-60_000)return res.status(400).json({error:'Pickup slot is in the past.'});if(pickupSlot.getMinutes()%7!==0)return res.status(400).json({error:'Choose a 7-minute pickup slot.'});const count=await Order.countDocuments({pickupSlot});if(count>=10)return res.status(409).json({error:'This pickup slot is full. Choose another slot.'});const ids=items.map(x=>String(x.id||x.menuItemId));const menu=await Menu.find({itemId:{$in:ids},available:true}).lean();if(menu.length!==new Set(ids).size)return res.status(400).json({error:'One or more menu items are unavailable. Refresh the menu.'});const byId=new Map(menu.map(m=>[m.itemId,m]));const orderItems=items.map(i=>{const m=byId.get(String(i.id||i.menuItemId));const quantity=Number(i.qty??i.quantity);if(!Number.isInteger(quantity)||quantity<1||quantity>30)throw new Error('Item quantity must be between 1 and 30.');return {menuItemId:m.itemId,name:m.name,price:m.price,quantity,instructions:String(i.instructions||'').slice(0,250),counterId:counterFor(m.category),status:'received',prepTimeMinutes:m.prepTimeMinutes};});const total=orderItems.reduce((s,i)=>s+i.price*i.quantity,0);const order=await Order.create({orderNumber:Date.now()%1000000,userId:req.auth.sub,customerName:(await User.findById(req.auth.sub).select('name email').lean())?.name||'Student',customerEmail:req.auth.email,items:orderItems,pickupSlot,paymentMethod:req.body.paymentMethod==='demo'?'demo':(req.body.paymentMethod==='online'?'online':'pay-at-counter'),paymentStatus:req.body.paymentMethod==='online'?'pending':'not-required',instructions:String(req.body.instructions||'').slice(0,500),total,status:'received'});res.status(201).json({order});}catch(e){res.status(400).json({error:e.message||'Could not create order.'});}});
app.get('/api/orders/mine',auth,async(req,res)=>res.json({orders:await Order.find({userId:req.auth.sub}).sort({createdAt:-1}).limit(100).lean()}));

// Staff queue: returns all non-collected orders filtered by counter for staff role
app.get('/api/orders/queue',auth,roles('staff','admin'),async(req,res)=>{
  const q={status:{$ne:'collected'}};
  if(req.user.role==='staff') q['items.counterId']=req.user.counterId;
  res.json({orders:await Order.find(q).sort({pickupSlot:1,createdAt:1}).limit(250).lean()});
});

app.patch('/api/orders/:orderId/items/:itemId/status',auth,roles('staff','admin'),async(req,res)=>{const allowed={received:'accepted',accepted:'preparing',preparing:'ready',ready:'collected'};const order=await Order.findById(req.params.orderId);if(!order)return res.status(404).json({error:'Order not found.'});const item=order.items.id(req.params.itemId);if(!item)return res.status(404).json({error:'Order item not found.'});if(req.user.role==='staff'&&item.counterId!==req.user.counterId)return res.status(403).json({error:'This order belongs to another counter.'});if(allowed[item.status]!==req.body.status)return res.status(400).json({error:'Invalid status transition.'});item.status=req.body.status;order.status=order.items.every(i=>i.status==='collected')?'collected':order.items.some(i=>i.status==='ready')?'ready':order.items.some(i=>i.status==='preparing')?'preparing':order.items.some(i=>i.status==='accepted')?'accepted':'received';await order.save();res.json({order});});

// ─── Startup ───────────────────────────────────────────────────────────────────
async function start(){
  await mongoose.connect(process.env.MONGODB_URI,{dbName:process.env.MONGODB_DB||'queueless_demo',serverSelectionTimeoutMS:10000});
  const n=await Menu.countDocuments();
  if(n===0){await Menu.insertMany(menuSeed.map(x=>({...x})),{ordered:false});console.log(`Imported ${menuSeed.length} menu items into MongoDB.`);}
  else console.log(`Menu collection already contains ${n} items; preserving existing data.`);
  app.use(express.static(path.resolve(__dirname,'..')));
  app.listen(PORT,()=>console.log(`QueueLess running at http://localhost:${PORT}`));
}
start().catch(e=>{console.error('MongoDB startup failed:',e.message);process.exit(1);});
