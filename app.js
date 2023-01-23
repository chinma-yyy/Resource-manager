const express = require("express");
const mongoose = require("mongoose");
const request = require("request");
const bcrypt = require("bcryptjs");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");

const cache = require("./models/cache");
const User = require("./models/user");

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get("/", (req, res) => {
  res.send("Hello World");
});

app.get("/connect", (req, res) => {
  res.json({ message: "Hello World" });
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
  request(options, async function (error, response, body) {
    if (!error) {
      let json = JSON.parse(body);
      const newUser = new User({
        email: json.owner.user.person.email,
        name: json.owner.user.name,
        profilePic: json.owner.user.avatar_url,
        accessToken: json.access_token,
        password: "notion",
        template_id: json.duplicated_template_id,
      });
      console.log(newUser);
      newUser
        .save()
        .then((result) => {
          console.log("User saved");
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
  console.log("Sucesss");
});

app.get("/create", (req, res) => {
  res.send("Create password");
});

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
  console.log("User found");
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
  });
});

app.post("/add", async (req, res) => {
  // let verify;
  // let jwttoken = req.headers.authorization.split(" ")[1];
  // try {
  //   verify = jwt.verify(jwttoken, process.env.JWT_SECRET);
  // } catch (err) {
  //   console.log(err.message);
  //   return res.json({ message: "Invalid request" });
  // }
  const email = "shewalechinmay54@gmail.com";
  const addtag = User.updateOne(
    { email: email },
    { $addToSet: { tags: req.body.tag } }
  );
  const title = req.body.title;
  const description = req.body.description;
  const url = req.body.url;
  const tag = req.body.tag;
  let tags = [];
  let database_id, accessToken;
  for (let i = 0; i < tag.length; i++) {
    tags.push({ name: tag[i] });
  }
  const user = await User.findOne({ email: email }).then((user) => {
    if (!user) {
      return res.json({ message: "User does not exist" });
    }
    database_id = user.template_id;
    accessToken = user.accessToken;
    // console.log(database_id, accessToken);
  });
  console.log(database_id, accessToken);
  // return;
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

app.post("/search", async (req, res) => {
  // let verify;
  // let jwttoken= req.headers.authorization.split(" ")[1];
  // try{
  // verify= jwt.verify(jwttoken,process.env.JWT_SECRET);
  // }catch(err){
  //   console.log(err.message);
  //   return res.json({message:"Invalid request"});
  // }
  // const email=verify.email;
  var options = {
    method: "POST",
    url: "https://api.notion.com/v1/search",
    headers: {
      "Notion-Version": "2022-02-22",
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      filter: {
        value: "database",
        property: "object",
      },
    }),
  };
  request(options, function (error, response) {
    if (error) throw new Error(error);
    let json = JSON.parse(response.body);
    console.log(json);
    res.json({ message: json });
  });
});

mongoose.set("strictQuery", true);
mongoose.connect(process.env.MONGODB_URL).then(
  app.listen(3000, () => {
    console.log("Listening on port 3000");
  })
);
