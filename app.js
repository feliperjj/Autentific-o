//jshint esversion:6
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const { MongoClient, ServerApiVersion } = require("mongodb");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const app = express();
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const { google } = require('googleapis');
const findOrCreate = require("mongoose-findorcreate");
app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));

app.use(
  session({
    secret: "Secret.",
    resave: false,
    saveUninitialized: true,
  })
);

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect(
  "mongodb+srv://feliperjj:sucodefruta97@cluster0.slouc31.mongodb.net/secrets",
  {
    useNewUrlParser: true,
  }
);
const users = new mongoose.Schema({
  email: String,
  password: String,
  googleId:String,
  secret: String,
});
users.plugin(passportLocalMongoose);
users.plugin(findOrCreate);

const user = mongoose.model("user", users);
passport.use(user.createStrategy());

// use static serialize and deserialize of model for passport session support
passport.serializeUser(function (user, cb) {
  process.nextTick(function () {
    return cb(null, {
      id: user.id,
      username: user.username,
      picture: user.picture,
    });
  });
});

passport.deserializeUser(function (user, cb) {
  process.nextTick(function () {
    return cb(null, user);
  });
});

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.CLIENT_ID,
      clientSecret: process.env.SECRET,
      callbackURL: "http://localhost:3000/auth/google/secrets"
    },
    function (accessToken, refreshToken, profile, cb) {
      user.findOrCreate({ googleId: profile.id }, function (err, user) {
        return cb(err, user);
      });
    }
  )
);

app.get("/", function (req, res) {
  res.render("home");
});
app.get(
  "/auth/google",
  passport.authenticate("google", {
    scope: ["profile"],
  })
);
app.get(
  "/auth/google/secrets",
  passport.authenticate("google", { failureRedirect: "/login" }),
  function (req, res) {
    // Successful authentication, redirect secrets.
    res.redirect("/secrets");
  }
);

app.get("/login", function (req, res) {
  res.render("login");
});

app.get("/register", function (req, res) {
  res.render("register");
});

app.get("/secrets", function (req, res) {
 user.find({"secret":{$ne:null}},function(err,foundUsers){

if(err){

  console.log(err)
}else{
  if(foundUsers){
    res.render("secrets",{usersWithSecrets:foundUsers})
  }
}

 })
});

app.get("/submit",function(req,res){

  if (req.isAuthenticated()) {
    user.find({ secret: { $ne: null } }, function (err, foundUsers) {
      if (err) {
        console.log(err);
      } else {
        if (foundUsers) {
          res.render("submit", { usersWithSecrets: foundUsers });
        }
      }
    });
  } else {
    res.redirect("/login");
  }
})
app
    .route('/logout')
    .get((req, res) => {
          req.logout(function(err) {
               if (err) { return next(err); }
           res.redirect('/');
      });
  });
  
app.post("/submit",function(req,res){
const submittedSecret = req.body.secret;

console.log(req.user)
user.findById(req.user.id,function(err,foundUser){

  if(err){
    console.log(err);
  }else{

    if(foundUser){
      foundUser.secret = submittedSecret;
      foundUser.save(function(){
        res.redirect("/secrets");
      })
    }
  }
});
});

app.post("/register", function (req, res) {
  user.register(
    { username: req.body.username },
    req.body.password,
    function (err, user) {
      if (err) {
        console.log(err);
        res.redirect("/register");
      } else {
        passport.authenticate("local")(req, res, function () {
          res.redirect("/secrets");
        });
      }
    }
  );
});

app.post("/login", function (req, res) {
  const user = new user({
    username: req.body.username,
    password: req.body.password,
  });
  req.login(user, function (err) {
    if (err) {
      console.log(err);
    } else {
      passport.authenticate("local")(req, res, function () {
        res.redirect("/secrets");
      });
    }
  });
});

app.listen(3000, function () {
  console.log("conectado");
});
