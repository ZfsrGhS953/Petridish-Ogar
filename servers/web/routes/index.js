var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function (req, res, next) {
    res.render('game', {title: 'GreenTeeas', game: true});
});

router.get('/gallery', function (req, res, next) {
    res.render('gallery', {title: 'GreenTeeas skins', gallery: true});
});

module.exports = router;
