const path = require("path");
const fs = require("fs");
const puppeteer = require("puppeteer");
const pLimit = require("p-limit");
const arg = require("arg");
const webpack = require("webpack");
const WebpackDevServer = require("webpack-dev-server");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

function throwError() {
  throw new Error("panic");
}

function createConfig(css, context, chunks, priority) {
  const styleLoader = css === "style-loader";
  const experimentsCss = css === "experiments";
  const miniCss = css === "mini-css";
  const [aPriority, bPriority] =
    priority === "a = b"
      ? [0, 0]
      : priority === "a > b"
      ? [10, 0]
      : priority === "a < b"
      ? [0, 10]
      : throwError();

  /** @type {import("webpack").Configuration} */
  const config = {
    entry: "./index.js",
    mode: "development",
    context: path.resolve(__dirname, context),
    devtool: false,
    plugins: [new HtmlWebpackPlugin(), miniCss && new MiniCssExtractPlugin()],
    optimization: {
      splitChunks: {
        minSize: 0,
        chunks,
        cacheGroups: {
          a: {
            test: /a\.css/,
            name: "a",
            priority: aPriority,
          },
          b: {
            test: /b\.css/,
            name: "b",
            priority: bPriority,
          },
        },
      },
    },
    module: {
      rules: [
        miniCss && {
          test: /\.css/,
          use: [MiniCssExtractPlugin.loader, "css-loader"],
        },
        styleLoader && {
          test: /\.css/,
          use: ["style-loader", "css-loader"],
        },
      ],
    },
    experiments: {
      css: experimentsCss,
    },
  };
  return config;
}

const availableCss = ["style-loader", "experiments", "mini-css"];
const availableContext = ["static", "dynamic"];
const availableChunks = ["all", "async"];
const availablePriorty = ["a = b", "a > b", "a < b"];

function combine(arr1, arr2) {
  return arr1.flatMap((a) => arr2.map((b) => [...a, b]));
}

const combs = [availableCss.map((i) => [i])]
  .map((i) => combine(i, availableContext))
  .map((i) => combine(i, availableChunks))
  .map((i) => combine(i, availablePriorty))
  .flat();

const limit = pLimit(10);

const args = arg({
  "--single": Number,
});
const single = args["--single"];

(async function main() {
  if (single) {
    const comb = combs[single];
    const compiler = webpack(createConfig(...comb));
    const devServer = new WebpackDevServer({ port: 8080 }, compiler);
    await devServer.start();
  } else {
    const results = await Promise.all(
      combs.map((comb, index) =>
        limit(async () => {
          const compiler = webpack(createConfig(...comb));
          const port = 8000 + index;
          const devServer = new WebpackDevServer({ port }, compiler);
          await devServer.start();
          const browser = await puppeteer.launch({ headless: "new" });
          const page = await browser.newPage();
          await page.goto(`http://localhost:${port}`);
          const body = await page.$("body");
          const rgb = await body.evaluate(
            (body) => getComputedStyle(body).backgroundColor,
          );
          const color =
            rgb === "rgb(0, 0, 255)"
              ? "blue"
              : rgb === "rgb(255, 0, 0)"
              ? "red"
              : throwError();
          await browser.close();
          await devServer.stop();
          return [...comb, color];
        }),
      ),
    );
    const tableHead = `
| No. | import | css | splitChunks chunks | splitChunks priority | color |
|-----|--------|-----|--------------------|----------------------|-------|
`;
    const tableBody = results
      .map((result, index) => `| ${index} |${result.join("|")}|`)
      .join("\n");
    const table = tableHead + tableBody;
    const title = "# webpack css + splitChunks: red or blue?\n";
    const explanation = await fs.promises.readFile(
      path.resolve(__dirname, "explanation.md"),
      "utf-8",
    );
    const md = title + table + "\n\n" + explanation;
    return fs.promises.writeFile(path.resolve(__dirname, "README.md"), md);
  }
})();
