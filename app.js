//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const { MongoClient, ServerApiVersion } = require("mongodb");
const encrypt = require('mongoose-encryption');
const app = express();


app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));

mongoose.connect(
  "mongodb+srv://feliperjj:sucodefruta97@cluster0.slouc31.mongodb.net/secrets",
  {
    useNewUrlParser: true,
  }
);
const users = new mongoose.Schema({
  email: String,
  password: String,
});


users.plugin(encrypt, { secret: process.env.SECRET, encryptedFields:["password"] });


const user = mongoose.model("user", users);

app.get("/", function (req, res) {
  res.render("home");
});

app.get("/login", function (req, res) {
  res.render("login");
});

app.get("/register", function (req, res) {
  res.render("register");
});

app.post("/register", function (req, res) {
  const NewUser = new user({
    email: req.body.username,
    password: req.body.password,
  });
  NewUser.save(function (err) {
    if (err) {
      console.log(err);
    } else {
      res.render("secrets");
    }
  });
});

app.post("/login",function (req,res) {
  const username = req.body.username;
  const password= req.body.password;

  user.findOne({email:username} ,function(err,foundUser){

    if(err){
      console.log(err)
      
    }else{
        if(foundUser){

          if(foundUser.password === password){

            res.render("secrets");
          }
        }
    }
  })

})

app.listen(3000, function () {
  console.log("conectado");
});
