const Page = require("../models/Page");


// ===============================
// LIST ALL PAGES (Admin)
// ===============================
exports.listPages = async (req, res) => {
    try {
        const pages = await Page.find().sort({ createdAt: 1 });

        res.render("admin/pages/index", {
            pages
        });

    } catch (error) {
        console.error(error);
        res.status(500).send("Server Error");
    }
};


// ===============================
// EDIT PAGE FORM
// ===============================
exports.editPageForm = async (req, res) => {
    try {
        const page = await Page.findById(req.params.id);

        if (!page) {
            return res.status(404).send("Page not found");
        }

        res.render("admin/pages/edit", {
            page
        });

    } catch (error) {
        console.error(error);
        res.status(500).send("Server Error");
    }
};


// ===============================
// UPDATE PAGE
// ===============================
exports.updatePage = async (req, res) => {
    try {

        const { title, content, status } = req.body;

        await Page.findByIdAndUpdate(
            req.params.id,
            {
                title,
                content,
                status
            },
            { new: true }
        );

        res.redirect("/admin/pages");

    } catch (error) {
        console.error(error);
        res.status(500).send("Server Error");
    }
};








// ===============================
// FRONTEND PAGE VIEW
// ===============================
exports.viewPage = async (req, res) => {
    try {
        const page = await Page.findOne({
            slug: req.params.slug,
            status: "published"
        });

        if (!page) {
            return res.status(404).render("404");
        }

        res.render("pages/view", {
            page,
            currentUrl: req.protocol + '://' + req.get('host') + req.originalUrl
        });

    } catch (error) {
        console.error(error);
        res.status(500).send("Server Error");
    }
};