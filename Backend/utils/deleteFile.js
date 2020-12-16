const fs = require("fs");
const path = require("path");
const rootPath = require("./path");

exports.deleteFile = (filePath) => {
  pathToDelete = path.join(rootPath, filePath);
  fs.unlink(pathToDelete, (err) => {
    if (err) {
      console.log(err);
    }
  });
};
