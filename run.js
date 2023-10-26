const path = require("path");
const fs = require("fs");
const puppeteer = require('puppeteer');
const pLimit = require("p-limit");
const webpack = require("webpack");
const WebpackDevServer = require("webpack-dev-server");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

function createConfig(context, css, chunks, aPriority, bPriority) {
  const styleLoader = css === 'style-loader';
  const experimentsCss = css === 'experiments';
  const miniCss = css === 'mini-css';
 
  /** @type {import("webpack").Configuration} */
  const config = {
    entry: "./index.js",
    mode: "development",
    context: path.resolve(__dirname, context),
    devtool: false,
    plugins: [
      new HtmlWebpackPlugin(),
      miniCss && new MiniCssExtractPlugin(),
    ],
    optimization: {
      splitChunks: {
        minSize: 0,
        chunks,
        cacheGroups: {
          a: {
            test: /a\.css/,
            name: 'a',
            priority: aPriority,
          },
          b: {
            test: /b\.css/,
            name: 'b',
            priority: bPriority,
          },
        }
      }
    },
    module: {
      rules: [
        miniCss && {
          test: /\.css/,
          use: [MiniCssExtractPlugin.loader, 'css-loader']
        },
        styleLoader && {
          test: /\.css/,
          use: ['style-loader', 'css-loader']
        },
      ]
    },
    experiments: {
      css: experimentsCss,
    }
  }
  return config;
}

const availableContext = ["static", "dynamic"];
const availableCss = ["style-loader", "experiments", "mini-css"];
const availableChunks = ["all", "async"];
const availableAPriorty = [0, 10, 20]
const availableBPriorty = [0, 10, 20]

function combine(arr1, arr2) {
  return arr1.flatMap(a => arr2.map(b => [...a, b]))
}

const combs = [availableContext.map(i => [i])]
  .map(i => combine(i, availableCss))
  .map(i => combine(i, availableChunks))
  .map(i => combine(i, availableAPriorty))
  .map(i => combine(i, availableBPriorty))
  .flat();

const limit = pLimit(10);

Promise.all(combs.map((comb, index) => limit(async () => {
  const compiler = webpack(createConfig(...comb));
  const port = 8000 + index;
  const devServer = new WebpackDevServer({ port }, compiler);
  await devServer.start();
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.goto(`http://localhost:${port}`);
  const body = await page.$('body');
  const rgb = await body.evaluate((body) => getComputedStyle(body).backgroundColor)
  const color = rgb === 'rgb(0, 0, 255)' ? 'blue' : rgb === 'rgb(255, 0, 0)' ? 'red' : 'ERROR';
  await browser.close();
  await devServer.stop();
  return [...comb, color]
}))).then(async results => {
  const tableHead = `
| import | css | splitChunks chunks | splitChunks a priority | splitChunks b priority | color |
|--------|-----|--------------------|------------------------|------------------------|-------|
`;
  const tableBody = results.map(result => result.join('|')).join('\n');
  const table = tableHead + tableBody;
  const title = '# webpack css + splitChunks: red or blue?\n';
  const explanation = await fs.promises.readFile(path.resolve(__dirname, 'explanation.md'), 'utf-8');
  const md = title + table + '\n\n' + explanation;
  return fs.promises.writeFile(path.resolve(__dirname, 'README.md'), md)
})
