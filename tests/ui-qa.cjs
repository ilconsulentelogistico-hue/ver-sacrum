const test=require('node:test'),assert=require('node:assert/strict');
const {readFileSync}=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..'),html=readFileSync(path.join(root,'index.html'),'utf8'),css=readFileSync(path.join(root,'app.css'),'utf8');
test('all selection views live inside one bottom dock, without modal markup',()=>{
 assert.doesNotMatch(html,/<dialog\b/);const start=html.indexOf('<nav id="commandDock"'),end=html.indexOf('</nav>',start);
 for(const id of ['selectionCard','characterDialog','skillsDialog','knowledgeDialog','logisticsDialog','communityDialog','tradeDialog','politicsDialog','linksDialog']){const at=html.indexOf(`id="${id}"`);assert(at>start&&at<end,id);}
 assert(html.indexOf('id="gameMenu"')<start);assert(html.indexOf('id="saveBtn"')<start);
});
test('mobile dock is bounded and scrollable, with landscape still at bottom',()=>{
 assert.match(html,/viewport-fit=cover/);assert.match(css,/env\(safe-area-inset-bottom,0px\)/);
 assert.match(css,/\.command-dock\{grid-column:1;grid-row:3;[^}]*max-height:44dvh/);
 assert.match(css,/\.context-body\{[^}]*overflow:auto;[^}]*touch-action:pan-y/);
 assert.match(css,/#commandDock \.management-panel\{position:static;[^}]*max-height:none/);
 assert.match(css,/\[hidden\]\{display:none!important\}/);
});
