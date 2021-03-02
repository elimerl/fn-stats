import cheerio from "cheerio";
import fetch from "node-fetch";
import path from "path";
import fs from "fs";
let headers: any = [];
let weaponData: any = [];

let dbUrl = "https:db.fortnitetracker.com";

let cellTypes = {
  IMAGE: 0,
  NAME: 1,
  RARITY: 2,
  DPS: 3,
  DAMAGE: 4,
  ENV_DAMAGE: 5,
  FIRE_RATE: 6,
  MAGAZINE: 7,
  RELOAD_TIME: 8,
};

let innerTagTypes = {
  IMG: "img",
  LINK: "a",
};

function sanitizeHeaderName(headerName: string): string {
  let h: any = headerName.split(" ");
  let newHeaderName = "";
  h.forEach((current: string, i: number) => {
    let word: string;
    if (i === 0) {
      word = current.toLowerCase();
    } else {
      word = current[0].toUpperCase() + current.slice(1, current.length);
    }
    newHeaderName += word;
  });
  return newHeaderName;
}

fetch("https:db.fortnitetracker.com/weapons/")
  .then((res) => res.text())
  .then((_html) => {
    const $ = cheerio.load(_html);
    $("th").each((i: number, elem: any) => {
      if (i > 0) {
        let headerName = elem.children[0].data;
        if (headerName === "Weapon") {
          headers.push("image");
          headers.push("name");
        } else {
          headers.push(sanitizeHeaderName(headerName));
        }
      } else {
        let headerName = "image";
        headers.push(headerName);
      }
    });
    let weapon: any = {};
    $("td").each((i: number, elem: any) => {
      const cell: any = elem.children[0];
      let cellData: any = cell.data;
      let cellType: string = cell.type;
      let columnIndex: number = i % 9;

      if (cellData == "\n") {
        let innerTag = cell.next;
        let innerTagType = innerTag.name;
        switch (innerTagType) {
          case innerTagTypes.IMG:
            let weaponImgUrl = innerTag.attribs.src;
            let fullImgUrl = dbUrl + weaponImgUrl;
            cellData = fullImgUrl;
            break;
          case innerTagTypes.LINK:
            let weaponName = innerTag.children[0].data;
            let weaponUrl = innerTag.children[0].parent.attribs.href;
            cellData = {
              text: "",
              url: "",
            };
            cellData.text = weaponName;
            cellData.url = dbUrl + weaponUrl;
            break;
          default:
        }
      }
      switch (columnIndex) {
        case cellTypes.IMAGE:
          weapon[headers[columnIndex]] = cellData;
          break;
        case cellTypes.NAME:
          weapon[headers[columnIndex]] = cellData;
          break;
        case cellTypes.RELOAD_TIME:
          weapon[headers[columnIndex]] = cellData;
          weaponData.push(weapon);
          weapon = {};
          break;
        default:
          weapon[headers[columnIndex]] = cellData;
      }
    });
    let fileName = path.join(__dirname, `../statistics.json`);
    fs.writeFile(
      fileName,
      JSON.stringify(weaponData, null, 2),
      (error: any) => {
        if (error) {
          throw error;
        }
      }
    );
  });
