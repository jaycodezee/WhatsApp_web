const express = require("express");
const { authenticate } = require("../middleware/Authenticate");
const { signup, login, searchUser, alreadyConnectedUser ,allUser , logout , apiRefresh, getAllMessages, deleteChatMessages} = require('../controllers/usercontrollers');

const userRoutes = express.Router();

userRoutes.post('/signup',signup);

userRoutes.post('/login',login);

userRoutes.get('/logout',authenticate,logout);
userRoutes.get('/allUser',authenticate,allUser);
userRoutes.get('/alreadyConnectedUser',alreadyConnectedUser);
userRoutes.get('/searchUser',searchUser);
userRoutes.get('/apiRefresh',apiRefresh);
userRoutes.get('/getAllMessages',getAllMessages);

userRoutes.delete('/deleteChatMessages',deleteChatMessages);

module.exports = {
    userRoutes,
};
