const express = require('express');
const app = express();
const { ocrSpace } = require('ocr-space-api-wrapper');
const axios = require("axios").default;
const translate = require('@vitalets/google-translate-api');
const ejsMate = require('ejs-mate');
app.set('view engine', 'ejs');
const multer = require('multer');
const path = require('path')
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './uploads')
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + "--" + file.originalname);
    },
});
let languages = {};
for (let key in translate.languages) {
    if (key !== "isSupported" && key != "getCode" && key != "auto") {
        languages[key] = translate.languages[key];
    }
}
const upload = multer({ storage: storage });

app.get('/', async (req, res) => {
    res.render('home', { languages });
});

app.post('/translate', upload.single('translate'), async (req, res) => {
    //console.log(languages, req.body.language);
    //console.log(languages[`${req.body.language}`]);
    let responseObject = {};
    let newLanguage = req.body.language;
    console.log(newLanguage);
    try {
        console.log("Request received!");
        console.log(`./uploads/${req.file.filename}`);
        const OCR = await ocrSpace(`./uploads/${req.file.filename}`);
        console.log("OCR Done!");
        //console.log(OCR);
        let originalText = OCR["ParsedResults"][0]["ParsedText"];
        translate(originalText, { to: req.body.language })
            .then(resp => {
                responseObject = {
                    "originalLanguage": languages[resp.from.language.iso],
                    "newLanguage": languages[newLanguage],
                    "originalText": originalText,
                    "translatedText": resp.text
                };
                res.render('display', { result: responseObject })
            })
            .catch(err => {
                console.error(err);
            });
    } catch (e) {
        console.log(e);
    }
})
app.listen(8000, () => {
    console.log("Listening on port 8000...");
})