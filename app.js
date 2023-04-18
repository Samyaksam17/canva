// Import required modules
const express = require("express");
const bodyParser = require("body-parser");
const { createCanvas, loadImage } = require("canvas");
const fs = require("fs");
const wrap = require("word-wrap");
const mongoose = require("mongoose");
let config = require("./config/db");
require("dotenv").config;

// Set up the app
const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// connect to database
mongoose.connect(config.database, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// on connection
mongoose.connection.on("connected", () => {
  console.log("connected to database " + config.database);
});

// on error
mongoose.connection.on("error", (err) => {
  console.log("database connection error " + err);
});

// Set up the route to generate the certificate
app.post("/generateCertificate", function (req, res) {
  // Get the selected template from the request body
  const user_data = req.body;
  // console.log('user-data', user_data);

  //==================================

  let keys = Object.keys(user_data[0]);
  // console.log('keys', keys);
  let user_key_data = [];

  for (let i = 1; i < keys.length; i++) {
    user_data.map((obj) => {
      // console.log(obj[keys[i]]);
      user_key_data.push(obj[keys[i]]);
    });
  }

  // console.log('user_key_data', user_key_data);

  //=================================

  // Retrieve the metadata for the selected template from the database
  Template.findOne(
    { name: user_data[0].selectedTemplate },
    async function (err, templateData) {
      if (err) throw err;
      // console.log('templateData', templateData);

      // Create a new canvas with the size and background color specified in the metadata
      const canvas = createCanvas(templateData.width, templateData.height);
      const context = canvas.getContext("2d");

      // Load the background image
      const backgroundImage = await loadImage("temp1.png"); // db
      context.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
      // context.fillStyle = templateData.backgroundColor;

      // Loop through the input fields and add them to the certificate
      for (let i = 0; i < templateData.fields.length; i++) {
        const field = templateData.fields[i];

        const fieldValue = user_key_data[i];

        // console.log(field);
        // console.log(fieldValue);

        // Use the field position and style information from the metadata to place the text on the canvas
        context.font = field.fontStyle;
        context.fillStyle = field.fontColor;

        // console.log('font', field.fontStyle);
        // console.log('fillStyle', field.fontColor);
        

        const wrappedText = wrap(fieldValue, {
          width: templateData.wrap_width,
        });
        const lines = wrappedText.split("\n");

        for (let x = 0; x < lines.length; x++) {
          // console.log('INNNN');
          // console.log('templateData.upper_height', templateData.upper_height);
          // console.log('templateData.lineHeight', templateData.lineHeight);
          const y = field.upper_height + field.lineHeight * x; //db
          // console.log('yyyyy', y);
          context.fillText(lines[x],field.left_width,y,field.width); //db
        }
      }
      const buffer = canvas.toBuffer("image/png");

      fs.writeFileSync("./genTemplate/" + "x.png", buffer); // save in folder with user "templatename"

      console.log("template generated successfully");
      res.json({status: true , message: "template generated successfully"})
    }
  );
});

// Template model
const templateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  width: {
    type: Number,
    required: true,
  },
  height: {
    type: Number,
    required: true,
  },
  backgroundColor: {
    type: String,
    required: true,
  },
  fields: [
    {
      name: {
        type: String,
        required: true,
      },
      position: {
        x: {
          type: Number,
          required: true,
        },
        y: {
          type: Number,
          required: true,
        },
      },
      fontStyle: {
        type: String,
        required: true,
      },
      fontColor: {
        type: String,
        required: true,
      },
      lineHeight: {
        type: Number,
        required: true,
      },
      wrap_width: {
        type: Number,
        required: true,
      },
      upper_height: {
        type: Number,
        required: true,
      },
      left_width: {
        type: Number,
        required: true,
      },
    },
  ],
});

const Template = mongoose.model("Templates", templateSchema);

const newTemplate = new Template({
  name: "Template B",
  width: 800,
  height: 600,
  backgroundColor: "#fff",
  fields: [
    {
      name: "Name",
      position: { x: 400, y: 200 },
      fontStyle: "bold 32px Arial",
      fontColor: "#000",
      lineHeight: 35,
      wrap_width: 15,
      upper_height: 200,
      left_width: 160,
    },
    {
      name: "Course",
      position: { x: 400, y: 300 },
      fontStyle: "24px Arial",
      fontColor: "#000",
      lineHeight: 20,
      wrap_width: 35,
      upper_height: 250,
      left_width: 180,
    },
    {
      name: "Date",
      position: { x: 400, y: 400 },
      fontStyle: "italic 20px Arial",
      fontColor: "#000",
      lineHeight: 25,
      wrap_width: 15,
      upper_height: 220,
      left_width: 160,
    },
  ],
});

// newTemplate.save()
//   .then(template => {
//     console.log('Template saved successfully:', template);
//   })
//   .catch(err => {
//     console.error('Error saving template:', err);
//   });

// Start the server
app.listen(5555, function () {
  console.log("Server started on port 5555");
});
