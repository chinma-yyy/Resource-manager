const express = require("express");
const mongoose = require("mongoose");
const axios = require("axios");
const request = require("request");

const cache = require("./models/cache");
const credentials = require("./models/credentials");

const app = express();

app.get("/", (req, res) => {
  res.send("Hello World");
});

app.post("/add", (req, res) => {
  // const title= req.body.title;
  // const description = req.body.description;
  // const url = req.body.url;
  // const tags = req.body.tags;

  const authLink = process.env.AUTH_LINK;
  console.log(authLink);
  res.json({ url: authLink });
});

app.get("/callback", (req, res) => {
  console.log(req.query.code);
//   res.send(req.query.code);
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
        redirect_uri: "http://localhost:3000/callback"
    })
  };
  request(options, function (error, response, body) {
    if (!error ) {
      res.send(body);
      console.log("body"+body);
    } else {
      res.send(error);
      console.log("error"+error);
    }
  });
  console.log("Sucesss");
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
