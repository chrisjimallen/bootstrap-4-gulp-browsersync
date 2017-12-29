var browserSync  = require('browser-sync');
var watchify     = require('watchify');
var browserify   = require('browserify');
var source       = require('vinyl-source-stream');
var buffer       = require('vinyl-buffer');
var gulp         = require('gulp');
var gutil        = require('gulp-util');
var gulpSequence = require('gulp-sequence');
var processhtml  = require('gulp-minify-html');
var sass         = require('gulp-sass');
var autoprefixer = require('gulp-autoprefixer');
var watch        = require('gulp-watch');
var cleanCSS     = require('gulp-clean-css');
var uncss        = require('gulp-uncss');
var uglify       = require('gulp-uglify');
var streamify    = require('gulp-streamify');
var sourcemaps   = require('gulp-sourcemaps');
var concat       = require('gulp-concat');
var babel        = require('gulp-babel');
var fontawesome  = require('node-font-awesome');
var duration     = require('gulp-duration');
var prod         = gutil.env.prod;

var sassPaths = [
  'node_modules/bootstrap/scss'
];

var onError = function(err) {
  console.log(err.message);
  this.emit('end');
};

// bundling js with browserify and watchify
var b = watchify(browserify('./build/assets/js/app', {
  cache: {},
  packageCache: {},
  fullPaths: true
}));

gulp.task('js', bundle);
b.on('update', bundle);
b.on('log', gutil.log);

function bundle() {
  return b.bundle()
    .on('error', onError)
    .pipe(source('app.js'))
    .pipe(buffer())
    .pipe(prod ? sourcemaps.init() : gutil.noop())
    .pipe(prod ? babel({
       presets: ['es2015']
     }) : gutil.noop())
    .pipe(concat('app.js'))
    .pipe(prod ? uglify() : gutil.noop())
    .pipe(prod ? sourcemaps.write('.') : gutil.noop())
    .pipe(gulp.dest('./dist/assets/js'))
    .pipe(browserSync.stream());
}

// fonts
gulp.task('fonts', function() {
  gulp.src(fontawesome.fonts)
    .pipe(gulp.dest('./dist/assets/fonts'))
    .pipe(browserSync.stream());
});

// sass
gulp.task('sass', function() {
  return gulp.src('./build/assets/scss/**/*.scss')
      .pipe(prod ? sourcemaps.init() : gutil.noop())
      .pipe(sass({
        includePaths: [].concat(require('node-bourbon').includePaths, ['node_modules/bootstrap/scss', fontawesome.scssPath ])
      }))
      .on('error', onError)
      .pipe(prod ? uncss({
        html: [ './build/templates/**/*.html' ] // html files to check for styles to keep
      }) : gutil.noop())
      .pipe(prod ? cleanCSS() : gutil.noop())
      .pipe(prod ? autoprefixer({
        browsers: ['last 2 versions'],
        cascade: false
      }) : gutil.noop())
      .pipe(prod ? sourcemaps.write('.') : gutil.noop())
      .pipe(gulp.dest('./dist/assets/css'))
      .pipe(browserSync.stream());
});

// html
gulp.task('html', function() {
  return gulp.src('./build/templates/**/*')
    .pipe(processhtml())
    .pipe(gulp.dest('dist'))
    .pipe(browserSync.stream());
});

// browser sync server for live reload
gulp.task('serve', function() {
  browserSync.init({
    server: {
      baseDir: './dist'
    }
  });

  gulp.watch('./build/templates/**/*', ['html']);
  gulp.watch('./build/assets/scss/**/*.scss', ['sass']);
});

// use gulp-sequence to finish building html, sass and js before first page load
gulp.task('default', gulpSequence(['fonts', 'html', 'sass', 'js'], 'serve'));
