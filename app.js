const express = require("express");
const mongoose = require("mongoose");
const axios = require("axios");
const request = require("request");
const bcrypt = require("bcryptjs");

const cache = require("./models/cache");
const User = require("./models/user");

const app = express();

app.get("/", (req, res) => {
  res.send("Hello World");
});

app.get("/connect", (req, res) => {
    res.json({message: "Hello World"});
});

app.get("/callback", (req, res) => {
  var options = {
    url: "https://api.notion.com/v1/oauth/token",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization:
        "Basic " +
        Buffer.from(
          `${process.env.CLIENT_ID}:${process.env.CLIENT_SECRET}`
        ).toString("base64"),
    },
    body: JSON.stringify({
      grant_type: "authorization_code",
      code: req.query.code,
      redirect_uri: "http://localhost:3000/callback",
    }),
  };
  request(options, function (error, response, body) {
    if (!error) {
      res.send(body);
      const newUser = new User({
        email: body.owner.user.person.email,
        name: body.owner.user.name,
        profilePic: body.owner.user.avatar_url,
        accessToken: body.access_token,
        password: "notion",
        template_id: body.duplicated_template_id,
      });
      newUser.save().then((result) => {
        console.log("User saved");
        return res.redirect("/create");
      });
    } else {
      res.send(error);
      console.log("error" + error);
      res.json({ message: "Error" });
    }
  });
  console.log("Sucesss");
});

app.post("/create", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const user = User.findOne({ email: email }).then((user)=>{
    if(!user || !user.password=="notion"){
      return res.json({ message: "User does not exist or already created password" });
    }
    return user;
  }).updateOne({
    password: bcrypt.hash(password, 12),
  }).then((result) => {
    res.json({ message: "User created" });
  });
});

app.get('/add', (req, res) => {
    const tags=User.findOne
});

app.get("/notion", (req, res) => {
  console.log(req.query);
  console.log("-----");
  console.log(req.body);
});

mongoose.set("strictQuery", true);
mongoose.connect(process.env.MONGODB_URL).then(
  app.listen(3000, () => {
    console.log("Listening on port 3000");
  })
);
