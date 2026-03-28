const fs = require("fs");
const p = "d:/web/qu-n-ly-ban-l/frontend/assets/js/shared.js";
const s = fs.readFileSync(p, "utf8");
function keys(block) {
    const m = {};
    const re = /"([^"]+)"\s*:/g;
    let mm;
    while ((mm = re.exec(block))) m[mm[1]] = 1;
    return Object.keys(m);
}
const viM = s.match(/vi: \{([\s\S]*?)\n    \},\n    en:/);
const enM = s.match(/en: \{([\s\S]*?)\n    \}\n\};/);
const viBlock = viM ? viM[1] : "";
const enBlock = enM ? enM[1] : "";
const vk = new Set(keys(viBlock));
const ek = new Set(keys(enBlock));
const onlyVi = [...vk].filter((k) => !ek.has(k)).sort();
const onlyEn = [...ek].filter((k) => !vk.has(k)).sort();
console.log("vi-only keys:", onlyVi.length, onlyVi);
console.log("en-only keys:", onlyEn.length, onlyEn);
