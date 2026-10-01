const fs = require('fs');
let content = fs.readFileSync('schema.sql', 'utf8');
const oldClue = /(3, 'Thugwar', 'Compete in the Thugwar challenge', 400, 'Locked', '12223', 'VENUE_03', )'[^]+?'\),/;
content = content.replace(oldClue, `$1'Call The fireforce to the CS Block'),`);
fs.writeFileSync('schema.sql', content);
