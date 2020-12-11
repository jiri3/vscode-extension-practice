const VueLoaderPlugin = require("vue-loader/lib/plugin");

module.exports = {
  mode: "development",
  entry: `./media/main.ts`,
  output: {
    path: `${__dirname}/media/dist`,
    filename: "main.js",
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: [
          {
            loader: "ts-loader",
            options: {
              appendTsSuffixTo: [/\.vue$/],
            },
          },
        ],
      },
      {
        test: /\.css$/,
        use: [{ loader: "style-loader" }, { loader: "css-loader" }],
      },
      {
        test: /\.vue$/,
        use: [{ loader: "vue-loader" }],
      },
    ],
  },
  resolve: {
    extensions: [".js", ".vue", ".ts"],
    alias: {
      vue$: `vue/dist/vue.esm.js`,
    },
  },
  plugins: [new VueLoaderPlugin()],
};
