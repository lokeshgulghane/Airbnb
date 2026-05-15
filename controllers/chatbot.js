const Listing = require("../models/listing.js");

function avgRating(reviews) {
    if (!reviews || reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, r) => acc + (r.rating || 0), 0);
    return sum / reviews.length;
}

function enrichListings(listings) {
    return listings.map((listing) => ({
        id: listing._id,
        title: listing.title,
        location: listing.location,
        country: listing.country,
        price: listing.price,
        avgRating: Math.round(avgRating(listing.reviews) * 10) / 10,
        reviewCount: listing.reviews ? listing.reviews.length : 0,
        url: `/listings/${listing._id}`,
    }));
}

function pickLocation(message, listings) {
    const lower = message.toLowerCase();
    const places = new Set();
    listings.forEach((l) => {
        if (l.location) places.add(l.location.toLowerCase());
        if (l.country) places.add(l.country.toLowerCase());
    });
    for (const place of places) {
        if (place && lower.includes(place)) return place;
    }
    const inMatch = lower.match(/\b(?:in|at|near)\s+([a-z\s]+?)(?:\?|$|,|\.|!)/);
    if (inMatch) return inMatch[1].trim();
    return null;
}

function filterByPlace(listings, place) {
    if (!place) return listings;
    const p = place.toLowerCase();
    return listings.filter(
        (l) =>
            (l.location && l.location.toLowerCase().includes(p)) ||
            (l.country && l.country.toLowerCase().includes(p)) ||
            (l.title && l.title.toLowerCase().includes(p))
    );
}

function formatListingLine(item, i) {
    const stars =
        item.reviewCount > 0
            ? ` — ${item.avgRating}★ (${item.reviewCount} reviews)`
            : " — no reviews yet";
    return `${i + 1}. **${item.title}** (${item.location}, ${item.country}) — ₹${item.price?.toLocaleString("en-IN")}/night${stars}\n   [View stay](${item.url})`;
}

module.exports.ask = async (req, res) => {
    const message = (req.body.message || "").trim();
    if (!message) {
        return res.json({
            reply:
                "Hi! I'm your Wanderlust assistant. Ask me things like:\n• Which is the best stay?\n• Cheapest stay in India\n• Best stay in Goa",
        });
    }

    const listings = await Listing.find({}).populate("reviews");
    const lower = message.toLowerCase();

    if (/hello|hi|hey|help/.test(lower) && !/best|cheap|stay|listing/.test(lower)) {
        return res.json({
            reply:
                "Hello! I can help you find the **best stay**, **cheapest options**, or stays in a **specific place**. What are you looking for?",
        });
    }

    if (/how many|total listings|count/.test(lower)) {
        return res.json({
            reply: `We currently have **${listings.length}** stays on Wanderlust. Browse them all at [/listings](/listings).`,
        });
    }

    const place = pickLocation(message, listings);
    let filtered = filterByPlace(listings, place);

    if (filtered.length === 0 && place) {
        return res.json({
            reply: `I couldn't find any stays matching **"${place}"**. Try another city or country, or see all listings at [/listings](/listings).`,
        });
    }

    const pool = filtered.length > 0 ? filtered : listings;
    const enriched = enrichListings(pool);

    if (/cheap|budget|affordable|lowest price|less price/.test(lower)) {
        const sorted = [...enriched].sort((a, b) => (a.price || 0) - (b.price || 0));
        const top = sorted.slice(0, 3);
        const placeNote = place ? ` in **${place}**` : "";
        const lines = top.map((item, i) => formatListingLine(item, i)).join("\n\n");
        return res.json({
            reply: `Here are the most **budget-friendly** stays${placeNote}:\n\n${lines}`,
            listings: top,
        });
    }

    if (/best|top|recommend|popular|highest rated|which stay/.test(lower)) {
        const sorted = [...enriched].sort((a, b) => {
            if (b.avgRating !== a.avgRating) return b.avgRating - a.avgRating;
            return b.reviewCount - a.reviewCount;
        });
        const top = sorted.slice(0, 3);
        const placeNote = place ? ` in **${place}**` : "";
        const lines = top.map((item, i) => formatListingLine(item, i)).join("\n\n");
        const tip =
            top[0].reviewCount === 0
                ? "\n\n_Tip: Ratings are based on guest reviews. Listings without reviews are sorted by availability._"
                : "";
        return res.json({
            reply: `Here are the **best-rated** stays${placeNote}:\n\n${lines}${tip}`,
            listings: top,
        });
    }

    if (place) {
        const sorted = [...enriched].sort((a, b) => b.avgRating - a.avgRating);
        const top = sorted.slice(0, 3);
        const lines = top.map((item, i) => formatListingLine(item, i)).join("\n\n");
        return res.json({
            reply: `Stays in **${place}**:\n\n${lines}`,
            listings: top,
        });
    }

    return res.json({
        reply:
            "I can help with:\n• **Best stay** — top-rated properties\n• **Cheapest stay** — budget options\n• **Best stay in [city]** — e.g. Goa, Mumbai\n\nTry asking: *Which is the best stay?*",
    });
};
