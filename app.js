const express = require("express");
const mongoose = require("mongoose");
const request = require("request");
const bcrypt = require("bcryptjs");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");

const User = require("./models/user");

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

//Universal Handler
app.get("/", (req, res) => {
  res.send("Hello World");
});

//Connect to Notion API using OAuth
app.get("/connect", (req, res) => {
  res.json({ message: "Hello World" });
});

//Callback URL from Notion API
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
  request(options, async function (error, response, body) {
    if (!error) {
      let json = JSON.parse(body);
      //Create user to save in db
      const newUser = new User({
        email: json.owner.user.person.email,
        name: json.owner.user.name,
        profilePic: json.owner.user.avatar_url,
        accessToken: json.access_token,
        password: "notion",
        template_id: json.duplicated_template_id,
      });
      // console.log(newUser);
      newUser
        .save()
        .then((result) => {
          console.log("User saved");
          //User created now redirect to create password
          return res.redirect("/create");
        })
        .catch((err) => {
          console.log(err.message);
        });
    } else {
      res.send(error);
      console.log("error" + error);
      res.json({ message: "Error" });
    }
  });
});

app.get("/create", (req, res) => {
  res.send("Create password");
});

//User must create password or password will be notion
app.post("/create", async (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const encrypt = await bcrypt.hash(password, 10);
  const user = await User.findOne({ email: email }).then((user) => {
    console.log(user);
    if (!user || !user.password == "notion") {
      return res.json({
        message: "User does not exist or already created password",
      });
    }
  });
  User.updateOne(
    { email: email },
    {
      password: encrypt,
    }
  ).then((result) => {
    const token = jwt.sign({ email: email }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });
    console.log(token);
    res.json({ message: "User created", token: token });
  });
});

app.get("/add", (req, res) => {
  //Verify user JWT token
  let verify;
  let jwttoken = req.headers.authorization.split(" ")[1];
  try {
    verify = jwt.verify(jwttoken, process.env.JWT_SECRET);
  } catch (err) {
    console.log(err.message);
    return res.json({ message: "Invalid request" });
  }
  const email = verify.email;
  const tags = User.findOne({ email: email }).then((user) => {
    if (!user) {
      return res.json({ message: "User does not exist" });
    }
    res.json({ tags: user.tags, profilePic: user.profilePic, name: user.name });
    //Send info for frontend
  });
});

app.post("/add", async (req, res) => {
  //Verify user JWT token
  // let verify;
  // let jwttoken = req.headers.authorization.split(" ")[1];
  // try {
  //   verify = jwt.verify(jwttoken, process.env.JWT_SECRET);
  // } catch (err) {
  //   console.log(err.message);
  //   return res.json({ message: "Invalid request" });
  // }
  const email = "shewalechinmay54@gmail.com"; //Take from verify now hardcoded
  const addtag = User.updateOne(
    { email: email },
    { $addToSet: { tags: req.body.tag } }
  ); //add all tags to db
  const title = req.body.title;
  const description = req.body.description;
  const url = req.body.url;
  const tag = req.body.tag;
  let tags = [];
  let database_id, accessToken;
  for (let i = 0; i < tag.length; i++) {
    tags.push({ name: tag[i] });
  }
  //Retrieve user info from db
  const user = await User.findOne({ email: email }).then((user) => {
    if (!user) {
      return res.json({ message: "User does not exist" });
    }
    database_id = user.template_id;
    accessToken = user.accessToken;
    
  });
  
  
  // console.log(database_id, accessToken);
  //Create page in Notion
  var options = {
    method: "POST",
    url: "https://api.notion.com/v1/pages",
    headers: {
      "Notion-Version": "2022-02-22",
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      parent: {
        type: "database_id",
        database_id: database_id,
      },
      properties: {
        URL: { type: "url", url: url },
        Description: {
          type: "rich_text",
          rich_text: [{ type: "text", text: { content: description } }],
        },
        Tags: {
          type: "multi_select",
          multi_select: tags,
        },
        Name: {
          type: "title",
          title: [{ type: "text", text: { content: title } }],
        },
      },
    }),
  };
  request(options, function (error, response) {
    if (error) throw new Error(error);
    console.log(response.body);
    res.json({ message: response.body });
  });
});

mongoose.set("strictQuery", true);
mongoose.connect(process.env.MONGODB_URL).then(
  app.listen(3000, () => {
    console.log("Listening on port 3000");
  })
);
