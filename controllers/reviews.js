const Listing = require("../models/listing.js");
const Review = require("../models/review.js");


module.exports.createReview = async(req,res) => {
    let listing = await Listing.findById(req.params.id);
    let newReview = new Review(req.body.review);
    newReview.author = req.user._id;
    listing.reviews.push(newReview);
    
    await newReview.save();
    await listing.save();
    req.flash("success", "New Review Created!");
    res.redirect(`/listings/${listing._id}`);
};

module.exports.renderEditForm = async (req, res) => {
    let { id, reviewId } = req.params;
    const listing = await Listing.findById(id);
    const review = await Review.findById(reviewId);
    if (!listing || !review) {
        req.flash("error", "Review or listing does not exist!");
        return res.redirect(`/listings/${id}`);
    }
    res.render("reviews/edit.ejs", { listing, review });
};

module.exports.updateReview = async (req, res) => {
    let { id, reviewId } = req.params;
    await Review.findByIdAndUpdate(reviewId, { ...req.body.review });
    req.flash("success", "Review Updated!");
    res.redirect(`/listings/${id}`);
};


module.exports.destroyReview = async(req,res) => {
    let { id,reviewId } = req.params;

    await Listing.findByIdAndUpdate(id, {$pull: {reviews: reviewId}});
    await Review.findByIdAndDelete(reviewId);
    req.flash("success", "Review Deleted!");
    res.redirect(`/listings/${id}`);
};