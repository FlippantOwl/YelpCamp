var express    = require("express"),
    router     = express.Router(),
    Campground = require("../models/campground"),
    middleware = require("../middleware"),
    NodeGeocoder = require('node-geocoder');
 
var options = {
  provider: 'google',
  httpAdapter: 'https',
  apiKey: process.env.GEOCODER_API_KEY,
  formatter: null
};
 
var geocoder = NodeGeocoder(options);

//INDEX - Shows all campgrounds
router.get("/", function(req, res){
    // get all campgrounds from db
    Campground.find({}, function(err, allCampgrounds){
        if(err){
            console.log(err);
        } else {
            res.render("campgrounds/index", {campgrounds:allCampgrounds, page: "campgrounds"});
        }
    });

//CREATE - Add new campground to the DB
router.post("/", middleware.isLoggedIn, function(req, res){
  // get data from form and add to campgrounds array
  var name   = req.body.name;
  var image  = req.body.image;
  var desc   = req.body.description;
  var author = {
      id: req.user._id,
      username: req.user.username
  }
  geocoder.geocode(req.body.location, function (err, data) {
    if (err || !data.length) {
      req.flash('error', 'Invalid address');
      return res.redirect('back');
    }
    var lat = data[0].latitude;
    var lng = data[0].longitude;
    var location = data[0].formattedAddress;
    var newCampground = {name: name, image: image, description: desc, author:author, location: location, lat: lat, lng: lng};
    // Create a new campground and save to DB
    Campground.create(newCampground, function(err, newlyCreated){
        if(err){
            console.log(err);
        } else {
            res.redirect("/campgrounds");
        }
    });
  });
});

//NEW - Takes you to the form to create a new campground
router.get("/new", middleware.isLoggedIn, function(req, res){
   res.render("campgrounds/new");
});

//SHOW - shows more info about a single campground
router.get("/:id", function(req, res){
    //find the campground with provided id
    Campground.findById(req.params.id).populate("comments").exec(function(err, foundCampground){
        if(err || !foundCampground){
            req.flash("error", "Campground not found");
            res.redirect("back");
        } else {
            res.render("campgrounds/show", {campground:foundCampground});
        }
    });
});

// EDIT CAMPGROUND ROUTE
router.get("/:id/edit", middleware.checkCampgroundOwnership, function(req, res){
    Campground.findById(req.params.id, function(err, foundCampground){
        console.log(err);
        res.render("campgrounds/edit", {campground: foundCampground}); 
    });
});
    
// UPDATE CAMPGROUND ROUTE
router.put("/:id", middleware.checkCampgroundOwnership, function(req, res){
      geocoder.geocode(req.body.location, function (err, data) {
        if (err || !data.length) {
          console.log(err);
          req.flash('error', 'Invalid address');
          return res.redirect('back');
        }
        req.body.campground.lat = data[0].latitude;
        req.body.campground.lng = data[0].longitude;
        req.body.campground.location = data[0].formattedAddress;
        
        Campground.findByIdAndUpdate(req.params.id, req.body.campground, function(err, campground){
            if(err){
                req.flash("error", err.message);
                res.redirect("back");
            } else {
                req.flash("success","Successfully Updated!");
                res.redirect("/campgrounds/" + campground._id);
            }
        });
     });
   });
});

// DESTROY CAMPGROUND ROUTE
router.delete("/:id", middleware.checkCampgroundOwnership, function(req, res){
    Campground.findByIdAndRemove(req.params.id, function(err){
       if(err){
           res.redirect("/campgrounds");
       } else {
           res.redirect("/campgrounds");
       }
    });
});

module.exports = router;