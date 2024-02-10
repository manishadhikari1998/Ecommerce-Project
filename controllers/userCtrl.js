const { generateToken } = require("../config/jwtToken");
const User = require("../models/userModel");
const asyncHandler = require('express-async-handler');
const validateMongoDbId = require("../utils/validateMongodbid");
const { generateRefreshToken } = require("../config/refreshtoken");
const jwt = require("jsonwebtoken");





// Create a User
const createUser = asyncHandler(async(req,res)=>{
  const {email} = req.body;
  const findUser = await User.findOne({email});
  if(!findUser){
    // create a new user
    const newUser = await User.create(req.body);
    res.json({newUser,message:"User Created",sucess:true})
  }
  else{
    // User already exists
    throw new Error('User already Exists')
  }

})

// Login a User
const loginUserCtrl = asyncHandler(async(req,res)=>{
  const {email,password} = req.body;
  //check if the user exists or not
  const findUser = await User.findOne({email});
  if(User.find && (await findUser.isPasswordMatched(password))){
    const refreshToken = await generateRefreshToken(findUser?._id);
    const updateuser = await User.findByIdAndUpdate(findUser.id,{
      refreshToken : refreshToken,
    },{
      new: true
    });
    res.cookie("refreshToken",refreshToken,{
      httpOnly:true,
      maxAge: 72 * 60 * 60 * 1000,
    })
    res.json({
      _id: findUser?._id,
      firstname: findUser?.firstname,
      lastname:findUser?.lastname,
      email:findUser?.email,
      mobile:findUser?.mobile,
      token:generateToken(findUser?._id)

    })
  }else{
   throw new Error("Invalid Credentials"); 
  }
})

// Handle Refresh Token

const handleRefreshToken = asyncHandler(async(req,res)=>{
  const cookie = req.cookies;
  if(!cookie?.refreshToken) throw new Error("No refresh Token in cookies");
  const refreshToken = cookie.refreshToken;
  const user = await User.findOne({refreshToken});
  if(!user) throw new Error("No Refresh Token present in db or not matched");
  jwt.verify(refreshToken,process.env.JWT_SECRET,(err,decoded)=>{
    if(err || user.id !== decoded.id){
      throw new Error('There is something wrong with refresh token')
    }
    const accessToken = generateToken(user?._id);
    res.json({accessToken});
  }) 
  
})

// Logout Functionality
const logout = asyncHandler(async(req,res)=>{
  const cookie = req.cookies;
  if(!cookie?.refreshToken) throw new Error("No refresh Token in cookies");
  const refreshToken = cookie.refreshToken;
  const user = await User.findOne({refreshToken});
  if(!user){
    res.clearCookie("refreshToken",{
      httpOnly: true,
      secure: true,
    });
    return res.sendStatus(204); //forbidden
  }
  await User.findOneAndUpdate({ refreshToken }, { $set: { refreshToken: "" } });
  res.clearCookie("refreshToken",{
    httpOnly: true,
    secure: true,
  });
  res.sendStatus(204);   //forbidden


})


// Get all Users
const getallUser = asyncHandler(async(req,res)=>{
  try {
    const getUsers = await User.find();
    res.json(getUsers);
  } catch (error) {
    throw new Error(error);
  }
})

//Get a User
const getUser = asyncHandler(async(req,res)=>{
  const {id} = req.params;
  validateMongoDbId(id);
  try {
    const getUser = await User.findById(id);
    res.json(getUser);
  } catch (error) {
    throw new Error(error)
  }
})

//Delete a user
const deleteUser = asyncHandler(async(req,res)=>{
  const {id} = req.params;
  validateMongoDbId(id);
  try {
    const deleteUser = await User.findByIdAndDelete(id);
    res.json({deleteUser,message:" User Deleted",})
  } catch (error) {
    throw new Error(error);
  }
});

//Update a user
const updatedUser = asyncHandler(async(req,res)=>{
  const {_id} = req.user;
  validateMongoDbId(_id);
  try {
    const updatedUser = await User.findByIdAndUpdate(_id,{
      firstname: req?.body?.firstname,
      lastname: req?.body?.lastname,
      email: req?.body?.email,
      mobile: req?.body?.mobile,
    },{
      new: true,
    });

    res.json(updatedUser)
  } catch (error) {
    throw new Error(error);
  }
});
// Block a user
const blockUser = asyncHandler(async(req,res)=>{
  const {id} = req.params;
  validateMongoDbId(id);
  try {
    const blockuser = await User.findByIdAndUpdate(id,{
      isBlocked: true,
    },{
      new: true,
    });
    res.json(blockuser)
  } catch (error) {
    throw new Error(error)
  }
})

//Unblock a user
const unblockUser = asyncHandler(async(req,res)=>{
  const {id} = req.params;
  validateMongoDbId(id);

  try {
    const unblock = await User.findByIdAndUpdate(id,{
      isBlocked: false,
    },{
      new: true,
    });
    res.json({
      message: "User Unblocked",
    })
  } catch (error) {
    throw new Error(error)
  }
})

module.exports = {createUser,loginUserCtrl,getallUser,getUser,deleteUser,updatedUser,blockUser,unblockUser,handleRefreshToken,logout};  