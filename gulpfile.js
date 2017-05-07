var gulp = require("gulp"),
    watch = require("gulp-watch"),
    child = require("child_process"),
    gutil = require("gulp-util"),
    webpackStream = require("webpack-stream"),
    webpack = require("webpack"),
    browserSync = require("browser-sync").create(),
    runSequence  = require("run-sequence").use(gulp);
    
var isProd = true;
    
// see: http://bit.ly/2ph6SJZ    
var devConfig  = {
    watch: true,
    devtool: "cheap-eval-source-map",
    output: {
        filename: "bundle.js",
    },
    module: {
        rules: [
            {
                test: /\.jsx$/,
                exclude: /(node_modules)/,
                use: [
                        {
                        loader: "babel-loader",
                        options: {
                            presets: ["env", "react"]
                        }
                    }
                ]
            },
            
            // Loaders for other file types can go here
        ]
    },
    plugins: [
        new webpack.ProvidePlugin({
            $: 'jquery',
            jQuery: 'jquery'
        })
    ]
};

var prodConfig = Object.create(devConfig);
prodConfig.plugins = [];
prodConfig.plugins = prodConfig.plugins.concat(
  new webpack.DefinePlugin({
    "process.env":{
        "NODE_ENV": JSON.stringify("production")
      }
  }),
  new webpack.optimize.UglifyJsPlugin({
      compress:{
        warnings: false
      },
      sourceMap: true
  })
);
prodConfig.devtool = "source-map";
prodConfig.output = Object.create({
    filename: "bundle.js"
});
prodConfig.output.filename = prodConfig.output.filename.replace(/\.js$/, ".min.js");


gulp.task("webpack", function() {
    var webpackConfig = isProd ? prodConfig : devConfig;
    return gulp.src("src/app.js")
        .pipe(webpackStream(webpackConfig, webpack))
        .on("error", function handleError() {
            console.log("Handling Error!!!!");
            this.emit("end"); // Recover from errors
        })
        .pipe(gulp.dest("dist/"));
});

gulp.task("jekyll", function() {
    // see: https://aaronlasseigne.com/2016/02/03/using-gulp-with-jekyll/
    var exec = process.platform === "win32" ? "jekyll.bat" : "jekyll"; // see: http://bit.ly/2pzQeHk
    var jekyll = child.spawn(exec, ["build", "--watch"]); 
    var jekyllLogger = function(buffer) {
        buffer.toString()
            .split(/\n/)
            .forEach(function(message){
                if(message) {
                    gutil.log("Jekyll: " + message);
                }
            });
    };
    
    jekyll.stdout.on("data", jekyllLogger);
    jekyll.stderr.on("data", jekyllLogger);
});

gulp.task("serve", function(){
    var options = {
        server: {baseDir: "_site/"},
        port: process.env.PORT || 8080,
        ui: { port: 8081 },
        ghostMode: false
    };
    browserSync.init(options);    
    watch("_site/**/*", browserSync.reload); // see: http://bit.ly/2qJeZ3d
});

gulp.task("build", function(callback) {
	isProd = true;
	return runSequence("jekyll", "serve", "webpack");
});

gulp.task("default", function(callback){
    isProd = false;
    return runSequence("jekyll", "serve", "webpack");
})