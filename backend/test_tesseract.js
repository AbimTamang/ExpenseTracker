const Tesseract = require("tesseract.js");

(async () => {
    console.log("Analyzing image...");
    const result = await Tesseract.recognize("../images.png", "eng");
    console.log("Result:");
    console.log(result.data.text);
})();
