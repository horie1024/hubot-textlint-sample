const TextLintEngine = require("textlint").TextLintEngine;
const engine = new TextLintEngine({
  configFile: "config/textlint/.textlintrc"
});

const severityLevel = ["info", "warning", "error"];

const Qiita = require("../libs/Qiita");
const qiita = new Qiita({team: "vasily", token: process.env.YOUR_QIITA_TOKEN});

module.exports = robot => {

  robot.router.post("/qiita/webhooks", (req, res) => {

    if (req.body.model === "item" &&
       (req.body.action === "created" || req.body.action === "updated") &&
        req.body.item !== undefined) {

      let item = req.body.item;
      let isTechblog = item.tags.some(result => {
        return result.name === "techblog";
      });

      if (isTechblog) {

        engine.executeOnText(item.raw_body, ".md").then(results => {

          return new Promise(resolve => {

            if (engine.isErrorResults(results)) {
              resolve(results[0].messages);
            } else {
              resolve([]);
            }
          });
        }).then(messages => {

          return new Promise(resolve => {

            if (messages.length > 0) {
              let lines = item.raw_body.split("\n").map(line => { return line + "\n" }),
                  _output = [];

              _output.push(`@${item.user.url_name} 文章校正の結果です:+1:\n`);
              messages.map(msg => {
                _output.push(`## [${severityLevel[msg.severity]}] ${msg.message}\n`);
                _output.push("\n");
                _output.push(`> ${lines[msg.line - 1]}\n`);
                _output.push("\n");
                _output.push("\`\`\`\n");
                _output.push(formatMessage(msg));
                _output.push("\`\`\`\n");
                _output.push("\n");
              });

              let output = _output.reduce((previous, current, index, array) => {
                return previous + current;
              });

              resolve(output);

            } else {
              resolve("");
            }
          });

        }).then(output => {

          qiita.Comments.list(item.uuid).then(res => {

            let comment = res.find && res.find((element, index, array) => {
              return element.body.includes("文章校正の結果です") ||
                     element.body.includes("エラーはありません:tada:");
            });

            // If already commented on.
            if (comment !== undefined) {
              if (output.length > 0) {
                qiita.Comments.update(comment.id, output);
              } else {
                qiita.Comments.update(comment.id, `@${item.user.url_name} エラーはありません:tada:`);
              }
            } else {
              if (output.length > 0) {
                qiita.Comments.post(item.uuid, output);
              } else {
                qiita.Comments.post(item.uuid, `@${item.user.url_name} エラーはありません:tada:`);
              }
            }
          });
        });
      }
    }

    res.end();
  });
}

let formatMessage = msg => {
  return ` ${msg.line}:${msg.column} ${severityLevel[msg.severity]} ${msg.message}  ${msg.ruleId}\n`
};
