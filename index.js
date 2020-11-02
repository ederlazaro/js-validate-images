const XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
const { Parser } = require("json2csv");
const csv = require("csv-parser");
const fs = require("fs");

const results = [];

const file_input = "consultoras_input.csv";

const file_outout = "consultoras_output.csv";

const s3_path_image_default =
  "http://cdn1-prd.somosbelcorp.com/ImagenesPortal/imagenconsultoranodisponible.jpg";

const headers = [
  ";uid",
  "code",
  "name",
  "name2",
  "lastname",
  "lastname2",
  "alias",
  "documentType",
  "document",
  "email",
  "country",
  "administrativeUnit",
  "profilePhotoUrl",
];

const validateImage = (consultant, image_url) => {
  return new Promise(function (resolve, reject) {
    if (image_url === "") return resolve(false);
    const xhr = new XMLHttpRequest();
    xhr.open("GET", image_url, true);
    xhr.send();
    xhr.onreadystatechange = () => {
      if (xhr.readyState === 4) {
        console.log(`${consultant} ${image_url} ->`, xhr.status);
        if (xhr.status === 200) {
          return resolve(xhr.status === 200 || xhr.status === 302);
        }
        return resolve(false);
      }
    };
  });
};

const createCsv = (results) => {
  const opts = { delimiter: ";", fields: headers, quote: "" };

  try {
    const parser = new Parser(opts);
    const csv = parser.parse(results);

    fs.writeFile(file_outout, csv, function (err) {
      if (err) return console.log("createCsv error ->", err);
      console.log("createCsv ->", "Done!");
    });
  } catch (err) {
    console.error("createCsv error ->", err);
  }
};

const validateImageAndCreateCsv = async () => {
  for (const item of results) {
    const value = await validateImage(item.code, item.profilePhotoUrl);
    if (!value) {
      item.profilePhotoUrl = s3_path_image_default;
    }
    item[";uid"] = ";" + item[";uid"];
  }
  createCsv(results);
};

const init = () => {
  fs.createReadStream(file_input)
    .pipe(
      csv({
        separator: ";",
        headers: headers,
      })
    )
    .on("data", (data) => {
      results.push(data);
    })
    .on("end", () => {
      console.log("total ->", `${results.length} consultoras.`);
      validateImageAndCreateCsv();
    });
};

init();
