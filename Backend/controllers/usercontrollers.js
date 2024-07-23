const { UserModel } = require("../model/User.Model");
const { BlacklistModel } = require("../model/Blacklist.Model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const signup =  async (req, res) => {
    const { name, email, password, picture } = req.body;
    try {
        const userPresent = await UserModel.find({ email: email });
        if (userPresent.size > 0) {
            return res.status(400).json({ error: "this email is already present." });
        }
        const username = await UserModel.find({ name: name });
        if (name.size > 0) {
            return res.status(400).json({ error: "Username is already present." });
        }
        

        const hashed_password = bcrypt.hashSync(password, 4);
        const user = new UserModel({
            name,
            email,
            password: hashed_password,
            picture,
        });
        await user.save();

        res.json({ success: "User created successfully" });
    } catch (error) {
        res.send({ error: "Something went wrong", error: error.message });
    }
}

const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await UserModel.findOne({ email: email });
        if (!user) {
            return res
                .status(400)
                .json({ error: "username and password is wrong" });
        }

        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if (!isPasswordMatch) {
            return res.status(400).json({ error: "Wrong credential" });
        }

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
            expiresIn: "9h",
        });
        const reftoken = jwt.sign(
            { userId: user._id },
            process.env.REF_SECRET,
            { expiresIn: 30000 }
        );
        return res.status(200).json({
            success: "User login successfully",
            token: token,
            reftoken: reftoken,
            userId: user._id,
        });
    } catch (error) {
        res.send({ error: "Something went wrong", error: error.message });
    }
}

const logout = async (req, res) => {
    const token = req.headers.authorization.split(" ")[1];
    const blacklist = new BlacklistModel({ token });
    await blacklist.save();
    return res.status(200).json({ message: "User logged out successfully" });
}

const allUser =  async (req, res) => {
    const { userId } = req.query;
    try {
        const users = await UserModel.find({
            _id: { $ne: userId },
        });
        res.send(users);
    } catch (error) {
        res.send(error.message);
    }
}

const alreadyConnectedUser = async (req, res) => {
    const { userId } = req.query;
    try {
        const users = await UserModel.findOne({
            _id: userId,
        });
        let arr = users.chatMessageModel;
        let obj = {};
        for (let i = 0; i < arr.length; i++) {
            if (arr[i].senderId == userId) {
                obj[arr[i].receiverId] = 1;
            } else {
                obj[arr[i].senderId] = 1;
            }
        }

        console.log(obj);
        let ans = [];
        for (key in obj) {
            const eleUser = await UserModel.findOne({
                _id: key,
            });
            ans.push(eleUser);
        }
        res.send([ans, users.name, users.picture]);
    } catch (error) {
        res.send(error.message);
    }
}

const searchUser = async (req, res) => {
    const { search, userId } = req.query;
    try {
        const users = await UserModel.find({
            _id: { $ne: userId },
            name: { $regex: search, $options: "i" },
        });
        res.send(users);
    } catch (error) {
        res.send(error.message);
    }
}
const apiRefresh = async (req, res) => {
    const reftoken = req.headers.authorization.split(" ")[1];
    try {
        const decoded = jwt.verify(reftoken, process.env.REF_SECRET);
        const { userId } = decoded;

        const user = await UserModel.findById(userId);
        if (!user) {
            return res.status(403).json({ message: "Unauthorized" });
        }

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
            expiresIn: 6000,
        });

        res.send({ token });
    } catch (error) {
        return res.status(403).json({ message: "Login First" });
    }
}

const getAllMessages = async (req, res) => {
    const { user1, user2 } = req.query;
    try {
        const userChatData = await UserModel.findOne({ _id: user1 });
        const msgs = userChatData.chatMessageModel;
        let allData = [];
        for (let i = 0; i < msgs.length; i++) {
            if (msgs[i].senderId === user1 && msgs[i].receiverId === user2) {
                allData.push({ data: msgs[i], type: "send" });
            } else if (
                msgs[i].senderId === user2 &&
                msgs[i].receiverId === user1
            ) {
                allData.push({ data: msgs[i], type: "receive" });
            }
        }
        res.send(allData);
    } catch (error) {
        res.send({ message: "Something went wrong", error: error.message });
    }
}

const deleteChatMessages = async (req, res) => {
    const { sender, receiver } = req.body;
    try {
        const userChatData = await UserModel.updateOne(
            { _id: sender },
            {
                $pull: {
                    chatMessageModel: {
                        $or: [
                            { senderId: sender, receiverId: receiver },
                            { senderId: receiver, receiverId: sender }
                        ],
                    },
                },
            }
        );

        if (userChatData.nModified > 0) {
            res.status(200).send({ message: "Chat history cleared successfully" });
        } else {
            res.status(404).send({ message: "No chat history found between the specified users" });
        }
    } catch (error) {
        res.status(500).send({ message: "Something went wrong", error: error.message });
    }
};



module.exports = { signup ,  login ,logout ,allUser, alreadyConnectedUser, searchUser, apiRefresh , getAllMessages, deleteChatMessages} 